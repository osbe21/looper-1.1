import { useEffect, useRef, useState } from "react";
import looperProcessorURL from "../scripts/looper-processor?url";

interface LooperOptions {
    microphoneSettings?: {
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
    };
    bufferSize?: number; // sekunder
    updateProgressInterval?: number; // sekunder
}

export type LooperState = "empty" | "init recording" | "playing" | "overdubbing";

type MainToWorkletMessage =
    | { type: "footswitch" }
    | { type: "set-input-latency"; value: number }
    | { type: "set-output-latency"; value: number };
type WorkletToMainMessage = { type: "set-state"; value: LooperState } | { type: "set-progress"; value: number };

const defaultMicrophoneSettings = { echoCancellation: true, noiseSuppression: true };

export default function useLooperEngine({
    microphoneSettings = defaultMicrophoneSettings,
    bufferSize = 5 * 60,
    updateProgressInterval = 0.01,
}: LooperOptions = {}) {
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
                micStream = await getMicStream(audioCtx, microphoneSettings);
                if (cancelled) return cancel();
                const streamNode = createSourceNode(audioCtx, micStream, false);
                const looperNode = await createLooperNode(
                    audioCtx,
                    bufferSize,
                    updateProgressInterval,
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
            }
        }

        initAudioContext();

        function cancel() {
            micStream?.getTracks().forEach((track) => track.stop());
            audioCtx?.close();
        }

        return () => {
            cancelled = true;

            cancel();
        };
    }, [microphoneSettings, bufferSize, updateProgressInterval]);

    function updateLatency() {
        const { inputLatency, outputLatency } = calculateLatency(audioCtxRef.current!, micStreamRef.current!);

        looperNodeRef.current?.port.postMessage({
            type: "set-input-latency",
            value: Math.floor(inputLatency * audioCtxRef.current!.sampleRate),
        });

        looperNodeRef.current?.port.postMessage({
            type: "set-output-latency",
            value: Math.floor(outputLatency * audioCtxRef.current!.sampleRate),
        });

        setLatency(inputLatency + outputLatency);
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

        footswitch: function () {
            const message: MainToWorkletMessage = { type: "footswitch" };
            looperNodeRef.current?.port.postMessage(message);

            updateLatency();
        },

        setGain: function (value: number) {
            if (audioCtxRef.current && gainNodeRef.current)
                gainNodeRef.current.gain.linearRampToValueAtTime(value, audioCtxRef.current.currentTime + 0.01);
        },
    };
}

function createAudioContext() {
    return new AudioContext({ latencyHint: 0 });
}

async function getMicStream(
    audioCtx: AudioContext,
    microphoneSettings: { echoCancellation?: boolean; noiseSuppression?: boolean }
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

function createSourceNode(audioCtx: AudioContext, micStream: MediaStream, useSine = false) {
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
            updateProgressInterval: Math.floor(updateProgressInterval * audioCtx.sampleRate),
        },
    });

    looperNode.port.onmessage = (e) => onReceiveMessage(e.data as WorkletToMainMessage);

    return looperNode;
}
