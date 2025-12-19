import { useEffect, useRef, useState } from "react";
import looperProcessorURL from "../scripts/looper-processor?url";

export const enum LooperState {
    Empty,
    InitRecording,
    Playing,
    Overdubbing,
}

type MainToWorkletMessage = { type: "footswitch" };
type WorkletToMainMessage = { type: "set-state"; value: number } | { type: "set-loop-progress"; value: number };

export default function useLooper() {
    const [state, setState] = useState(LooperState.Empty);
    const [loopProgress, setLoopProgress] = useState(0);
    const [audioContextState, setAudioContextState] = useState<AudioContextState | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const looperNodeRef = useRef<AudioWorkletNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function initAudioContext() {
            try {
                audioCtxRef.current = new AudioContext({ latencyHint: 0 });

                micStreamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: audioCtxRef.current.sampleRate,
                        channelCount: 1,
                        autoGainControl: false,
                        echoCancellation: true,
                        noiseSuppression: true,
                        // @ts-ignore Støttes ikke av safari
                        latency: 0,
                    },
                });

                const streamNode = new MediaStreamAudioSourceNode(audioCtxRef.current, {
                    mediaStream: micStreamRef.current,
                });

                await audioCtxRef.current.audioWorklet.addModule(looperProcessorURL);

                looperNodeRef.current = new AudioWorkletNode(audioCtxRef.current, "looper-processor", {
                    numberOfInputs: 1,
                    numberOfOutputs: 1,
                    outputChannelCount: [1],
                });

                looperNodeRef.current.port.onmessage = (e) => {
                    const data = e.data as WorkletToMainMessage;

                    switch (data.type) {
                        case "set-state":
                            setState(data.value as LooperState);
                            break;
                        case "set-loop-progress":
                            setLoopProgress(data.value);
                    }
                };

                streamNode.connect(looperNodeRef.current);

                looperNodeRef.current.connect(audioCtxRef.current.destination);

                if (cancelled) cleanUp();
            } catch (error) {
                cleanUp();

                throw error;
            }
        }

        initAudioContext();

        function cleanUp() {
            console.log("Cleanup");

            cancelled = true;

            audioCtxRef.current?.close();
            micStreamRef.current?.getTracks().forEach((track) => track.stop());

            setState(LooperState.Empty);
            setLoopProgress(0);
        }

        return cleanUp;
    }, []);

    function pokeAudioContext() {
        audioCtxRef.current?.resume().finally(() => setAudioContextState(audioCtxRef.current?.state ?? null));
    }

    function footswitch() {
        const message: MainToWorkletMessage = { type: "footswitch" };
        looperNodeRef.current?.port.postMessage(message);
    }

    function setMicrophoneSettings(echoCancellation?: boolean, noiseSuppression?: boolean) {
        micStreamRef.current?.getTracks().forEach((track) =>
            track.applyConstraints({
                echoCancellation,
                noiseSuppression,
            })
        );
    }

    return {
        state,
        loopProgress,
        audioContextState,
        pokeAudioContext,
        footswitch,
        setMicrophoneSettings,
    };
}
