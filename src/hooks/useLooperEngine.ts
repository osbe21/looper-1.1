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

async function createLooperNode(audioCtx: AudioContext, onRecieveMessage: (data: WorkletToMainMessage) => void) {
    await audioCtx.audioWorklet.addModule(looperProcessorURL);

    const looperNode = new AudioWorkletNode(audioCtx, "looper-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
    });

    looperNode.port.onmessage = (e) => onRecieveMessage(e.data as WorkletToMainMessage);

    return looperNode;
}

function setLatencyCorrectionInterval(
    audioCtx: AudioContext,
    micStream: MediaStream,
    looperNode: AudioWorkletNode,
    onLatencyCalculated?: (latency: number) => void
) {
    const micTrack = micStream.getAudioTracks()[0];

    return setInterval(() => {
        if (!audioCtx || !micStream || !looperNode) return;

        const micTrackSettings = micTrack.getSettings();

        // FIXME: settings.latency er ikke tilgjenglig i safari
        // @ts-ignore
        const inputLatency = micTrackSettings.latency;
        const baseLatency = audioCtx.baseLatency;
        const outputLatency = audioCtx.outputLatency;

        console.log(`Input latency: ${Math.round(inputLatency * 1000)}ms`);
        console.log(`Base latency: ${Math.round(baseLatency * 1000)}ms`);
        console.log(`Output latency: ${Math.round(outputLatency * 1000)}ms`);

        // TODO: offset opptaket med inputLatency-en
        const latency = inputLatency + baseLatency + outputLatency;

        if (onLatencyCalculated) onLatencyCalculated(latency);

        const latencyOffset = Math.floor(latency * audioCtx.sampleRate);

        // TODO: endre denne til en automation, for å unngå potensiell popping i lyden
        looperNode.parameters.get("latencyOffset")!.value = latencyOffset;
    }, 1000);
}

export default function useLooperEngine() {
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
        let audioCtx: AudioContext;
        let micStream: MediaStream;
        let latencyCorrectionInterval: ReturnType<typeof setInterval>;

        async function initAudioContext() {
            try {
                audioCtx = createAudioContext();
                micStream = await getMicStream(audioCtx);
                const streamNode = createSourceNode(audioCtx, micStream, true);
                const looperNode = await createLooperNode(audioCtx, onRecieveMessage);
                const gainNode = new GainNode(audioCtx);

                streamNode.connect(looperNode);
                looperNode.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                latencyCorrectionInterval = setLatencyCorrectionInterval(audioCtx, micStream, looperNode, setLatency);

                if (cancelled) throw Error("Component was unmounted before AudioContext initialized");

                audioCtxRef.current = audioCtx;
                micStreamRef.current = micStream;
                looperNodeRef.current = looperNode;
                gainNodeRef.current = gainNode;
            } catch (error) {
                micStream?.getTracks().forEach((track) => track.stop());
                audioCtx?.close();

                clearInterval(latencyCorrectionInterval);

                throw error;
            }
        }

        initAudioContext();

        return () => {
            cancelled = true;

            micStreamRef.current?.getTracks().forEach((track) => track.stop());
            audioCtxRef.current?.close();

            clearInterval(latencyCorrectionInterval);

            setState(LooperState.Empty);
            setLatency(0);
            setLoopProgress(0);
        };
    }, []);

    function onRecieveMessage(data: WorkletToMainMessage) {
        switch (data.type) {
            case "set-state":
                setState(data.value);
                break;
            case "set-loop-progress":
                setLoopProgress(data.value);
        }
    }

    const api = {
        state,
        loopProgress,
        latency,
        audioContextState,

        pokeAudioContext: function () {
            audioCtxRef.current?.resume().finally(() => setAudioContextState(audioCtxRef.current?.state ?? null));
        },

        footswitch: function () {
            const message: MainToWorkletMessage = { type: "footswitch" };
            looperNodeRef.current?.port.postMessage(message);
        },

        setGain: function (value: number) {
            if (gainNodeRef.current) gainNodeRef.current.gain.exponentialRampToValueAtTime(value, 0.01);
        },

        setMicrophoneSettings: function (echoCancellation?: boolean, noiseSuppression?: boolean) {
            micStreamRef.current?.getTracks().forEach((track) =>
                track.applyConstraints({
                    echoCancellation,
                    noiseSuppression,
                })
            );
        },
    };

    return api;
}
