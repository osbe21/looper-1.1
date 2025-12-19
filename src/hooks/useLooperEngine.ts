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

export default function useLooperEngine(useSineInput = false) {
    const [state, setState] = useState(LooperState.Empty);
    const [loopProgress, setLoopProgress] = useState(0);
    const [latency, setLatency] = useState(0);
    const [audioContextState, setAudioContextState] = useState<AudioContextState | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const looperNodeRef = useRef<AudioWorkletNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        let cancelled = false;
        let latencyUpdateInterval: ReturnType<typeof setInterval>;

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

                let streamNode: AudioNode;

                if (useSineInput) {
                    const oscillatorNode = new OscillatorNode(audioCtxRef.current, {
                        frequency: Math.random() * 440 + 440,
                    });
                    oscillatorNode.start();

                    streamNode = oscillatorNode;
                } else {
                    streamNode = new MediaStreamAudioSourceNode(audioCtxRef.current, {
                        mediaStream: micStreamRef.current,
                    });
                }

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

                gainNodeRef.current = new GainNode(audioCtxRef.current);

                streamNode.connect(looperNodeRef.current);

                looperNodeRef.current.connect(gainNodeRef.current);

                gainNodeRef.current.connect(audioCtxRef.current.destination);

                const micTrack = micStreamRef.current.getAudioTracks()[0];
                latencyUpdateInterval = setInterval(() => {
                    if (!audioCtxRef.current || !looperNodeRef.current) return;

                    const micTrackSettings = micTrack.getSettings();

                    // FIXME: settings.latency er ikke tilgjenglig i safari
                    // @ts-ignore
                    const inputLatency = micTrackSettings.latency;
                    const baseLatency = audioCtxRef.current.baseLatency;
                    const outputLatency = audioCtxRef.current.outputLatency;

                    console.log(`Input latency: ${Math.round(inputLatency * 1000)}ms`);
                    console.log(`Base latency: ${Math.round(baseLatency * 1000)}ms`);
                    console.log(`Output latency: ${Math.round(outputLatency * 1000)}ms`);

                    // TODO: offset opptaket med inputLatency-en
                    const latency = inputLatency + baseLatency + outputLatency;

                    setLatency(latency);

                    const latencyOffset = Math.floor(latency * audioCtxRef.current.sampleRate);

                    // TODO: endre denne til en automation, for å unngå potensiell popping i lyden
                    looperNodeRef.current.parameters.get("latencyOffset")!.value = latencyOffset;
                }, 1000);

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

            clearInterval(latencyUpdateInterval);

            audioCtxRef.current?.close();
            micStreamRef.current?.getTracks().forEach((track) => track.stop());

            setState(LooperState.Empty);
            setLatency(0);
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

    function setGain(value: number) {
        if (gainNodeRef.current) gainNodeRef.current.gain.exponentialRampToValueAtTime(value, 0.01);
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
        latency,
        audioContextState,
        pokeAudioContext,
        footswitch,
        setGain,
        setMicrophoneSettings,
    };
}
