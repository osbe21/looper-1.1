import { useEffect, useRef, useState } from "react";
import looperProcessorURL from "../scripts/looper-processor?url";
import { toast } from "sonner";

export interface LooperOptions {
    microphoneSettings: {
        noiseSupression: boolean;
        echoCancellation: boolean;
    };
    latencyCompensation: number; // sekunder
    bufferSize: number; // sekunder
    updateProgressInterval: number; // sekunder
}

export type LooperState =
    | "empty"
    | "init recording"
    | "playing"
    | "overdubbing";

type MainToWorkletMessage =
    | { type: "footswitch" }
    | { type: "reset" }
    | { type: "set-latency"; value: { input: number; output: number } };

type WorkletToMainMessage =
    | { type: "set-state"; value: LooperState }
    | { type: "set-progress"; value: number };

export default function useLooperEngine(options: LooperOptions) {
    const [looperState, setLooperState] = useState<LooperState>("empty");
    const [looperProgress, setLooperProgress] = useState(0);
    const [latency, setLatency] = useState(0);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const looperNodeRef = useRef<AudioWorkletNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        let cancelled = false;
        let audioCtx: AudioContext;
        let micStream: MediaStream;

        async function initAudioContext() {
            try {
                audioCtx = createAudioContext();
                micStream = await getMicStream(
                    audioCtx,
                    options.microphoneSettings
                );
                if (cancelled) return cancel();
                const streamNode = createSourceNode(audioCtx, micStream, false);
                const looperNode = await createLooperNode(
                    audioCtx,
                    options.bufferSize,
                    options.updateProgressInterval,
                    onReceiveMessage
                );
                if (cancelled) return cancel();
                const gainNode = new GainNode(audioCtx);

                streamNode.connect(looperNode);
                looperNode.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                audioCtxRef.current = audioCtx;
                micStreamRef.current = micStream;
                looperNodeRef.current = looperNode;
                gainNodeRef.current = gainNode;
            } catch (error) {
                cancel();

                if (error instanceof DOMException) {
                    let message = "";

                    switch (error.name) {
                        case "NotAllowedError":
                            message = "Access to the microphone was denied.";
                            break;
                        case "NotFoundError":
                            message =
                                "No microphone was found. Please connect a microphone and try again.";
                            break;
                        case "SecurityError":
                            message =
                                "Browser security settings are preventing access to the microphone.";
                            break;
                        default:
                            message =
                                "An unknown error occurred during initialization.";
                    }

                    toast.error(message);
                }
            }
        }

        initAudioContext();

        function cancel() {
            if (cancelled) return;

            cancelled = true;

            micStream?.getTracks().forEach((track) => track.stop());
            audioCtx?.close();
        }

        return () => {
            cancel();
        };
    }, [options]);

    function footswitch() {
        if (!micStreamRef.current)
            return toast.error("Microphone access denied");

        const message: MainToWorkletMessage = { type: "footswitch" };
        looperNodeRef.current?.port.postMessage(message);

        updateLatency();
    }

    // TODO: Kall dette når options.latencyCompensation endres
    // TODO: Finn en måte å gjøre dette type safe
    function updateLatency() {
        const { inputLatency, outputLatency } = calculateLatency(
            audioCtxRef.current!,
            micStreamRef.current!
        );

        const userCompensation =
            options.latencyCompensation * audioCtxRef.current!.sampleRate;

        looperNodeRef.current?.port.postMessage({
            type: "set-latency",
            value: {
                input: Math.floor(
                    inputLatency * audioCtxRef.current!.sampleRate
                ),
                output: Math.floor(
                    outputLatency * audioCtxRef.current!.sampleRate +
                        userCompensation
                ),
            },
        } as MainToWorkletMessage);

        setLatency(inputLatency + outputLatency + options.latencyCompensation);
    }

    function onReceiveMessage(data: WorkletToMainMessage) {
        switch (data.type) {
            case "set-state":
                setLooperState(data.value);
                break;
            case "set-progress":
                setLooperProgress(data.value);
        }
    }

    return {
        looperState,
        looperProgress,
        latency,

        resumeAudioContext: function () {
            audioCtxRef.current?.resume().then(updateLatency);
        },

        footswitch,

        setGain: function (value: number) {
            if (audioCtxRef.current && gainNodeRef.current)
                gainNodeRef.current.gain.linearRampToValueAtTime(
                    value,
                    audioCtxRef.current.currentTime + 0.01
                );
        },

        reset: function () {
            if (looperNodeRef.current)
                looperNodeRef.current.port.postMessage({
                    type: "reset",
                } satisfies MainToWorkletMessage);
        },
    };
}

function createAudioContext() {
    return new AudioContext({ latencyHint: 0 });
}

async function getMicStream(
    audioCtx: AudioContext,
    microphoneSettings: {
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
    }
) {
    return await navigator.mediaDevices.getUserMedia({
        audio: {
            sampleRate: audioCtx.sampleRate,
            channelCount: 1,
            autoGainControl: false,
            ...microphoneSettings,
            // @ts-ignore Støttes ikke av safari
            latency: 0,
        },
    });
}

function createSourceNode(
    audioCtx: AudioContext,
    micStream: MediaStream,
    useSine = false
) {
    if (useSine) {
        const oscillatorNode = new OscillatorNode(audioCtx);
        oscillatorNode.start();

        return oscillatorNode;
    } else {
        return new MediaStreamAudioSourceNode(audioCtx, {
            mediaStream: micStream,
        });
    }
}

function calculateLatency(audioCtx: AudioContext, micStream: MediaStream) {
    const micTrack = micStream.getAudioTracks()[0];
    const micTrackSettings = micTrack.getSettings();

    // @ts-ignore Støttes ikke av safari
    const inputLatency = micTrackSettings.latency ?? 0;
    const baseLatency = audioCtx.baseLatency;
    const outputLatency = audioCtx.outputLatency;

    return {
        inputLatency,
        outputLatency: baseLatency + outputLatency,
    };
}

async function createLooperNode(
    audioCtx: AudioContext,
    bufferSize: number,
    updateProgressInterval: number,
    onReceiveMessage: (data: WorkletToMainMessage) => void
) {
    await audioCtx.audioWorklet.addModule(looperProcessorURL);

    const looperNode = new AudioWorkletNode(audioCtx, "looper-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: {
            bufferSize: Math.floor(bufferSize * audioCtx.sampleRate),
            updateProgressInterval: Math.floor(
                updateProgressInterval * audioCtx.sampleRate
            ),
        },
    });

    looperNode.port.onmessage = (e) =>
        onReceiveMessage(e.data as WorkletToMainMessage);

    return looperNode;
}
