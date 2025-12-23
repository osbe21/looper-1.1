import { useEffect, useRef, useState } from "react";
import looperProcessorURL from "../scripts/looper-processor?url";

export type LooperState = "empty" | "init recording" | "playing" | "overdubbing";

type MainToWorkletMessage =
    | { type: "footswitch" }
    | { type: "set-input-latency"; value: number }
    | { type: "set-output-latency"; value: number };
type WorkletToMainMessage = { type: "set-state"; value: LooperState } | { type: "set-progress"; value: number };

export default function useLooperEngine() {
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
                micStream = await getMicStream(audioCtx);
                if (cancelled) return cancel();
                const streamNode = createSourceNode(audioCtx, micStream, false);
                const looperNode = await createLooperNode(audioCtx, onReceiveMessage);
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
    }, []);

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
            audioCtxRef.current?.resume().then(() => {
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
            });
        },

        footswitch: function () {
            const message: MainToWorkletMessage = { type: "footswitch" };
            looperNodeRef.current?.port.postMessage(message);
        },

        setGain: function (value: number) {
            if (audioCtxRef.current && gainNodeRef.current)
                gainNodeRef.current.gain.linearRampToValueAtTime(value, audioCtxRef.current.currentTime + 0.01);
        },

        // TODO: disse instillingene må restarte audio contexten
        // setMicrophoneSettings: function (echoCancellation?: boolean, noiseSuppression?: boolean) {
        //     micStreamRef.current?.getTracks().forEach((track) =>
        //         track.applyConstraints({
        //             echoCancellation,
        //             noiseSuppression,
        //         })
        //     );
        // },
    };
}

function createAudioContext() {
    return new AudioContext({ latencyHint: 0 });
}

async function getMicStream(audioCtx: AudioContext) {
    return await navigator.mediaDevices.getUserMedia({
        audio: {
            sampleRate: audioCtx.sampleRate,
            channelCount: 1,
            autoGainControl: false,
            echoCancellation: true,
            noiseSuppression: true,
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

    // FIXME: settings.latency er ikke tilgjenglig i safari
    // @ts-ignore
    const inputLatency = micTrackSettings.latency;
    const baseLatency = audioCtx.baseLatency;
    const outputLatency = audioCtx.outputLatency;

    return {
        inputLatency,
        outputLatency: baseLatency + outputLatency,
    };
}

async function createLooperNode(audioCtx: AudioContext, onReceiveMessage: (data: WorkletToMainMessage) => void) {
    await audioCtx.audioWorklet.addModule(looperProcessorURL);

    // TODO: legg til parameter for loop buffer size
    const looperNode = new AudioWorkletNode(audioCtx, "looper-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        processorOptions: {},
    });

    looperNode.port.onmessage = (e) => onReceiveMessage(e.data as WorkletToMainMessage);

    return looperNode;
}
