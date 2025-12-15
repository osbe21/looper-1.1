import looperProcessorURL from "./looper-processor?url";

const initContextButton = document.getElementById("init-context-button")!;
const loopProgress = document.getElementById("loop-progress")! as HTMLProgressElement;
const recordButton = document.getElementById("record-button")!;

let audioCtx: AudioContext | null = null;

initContextButton.onclick = toggleAudioContext;

async function toggleAudioContext() {
    if (audioCtx === null) {
        initContextButton.innerHTML = "Close audio context";

        audioCtx = await initAudioContext();
    } else {
        initContextButton.innerHTML = "Init audio context";

        audioCtx.close();

        audioCtx = null;
    }
}

async function initAudioContext(): Promise<AudioContext> {
    // TODO: Pass på at stream og audioCtx bruker samme samplerate (vet ikke hvilken som skal få 1. pri)

    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            channelCount: 1,
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
        },
    });

    const audioCtx = new AudioContext({ latencyHint: 0 });

    await audioCtx.audioWorklet.addModule(looperProcessorURL);

    const streamNode = new MediaStreamAudioSourceNode(audioCtx, { mediaStream: stream });

    const looperNode = new AudioWorkletNode(audioCtx, "looper-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
    });

    streamNode.connect(looperNode);

    looperNode.connect(audioCtx.destination);

    looperNode.port.onmessage = (e) => (loopProgress.value = e.data);

    setInterval(() => {
        const audioTrack = stream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();

        // FIXME: settings.latency er ikke tilgjenglig i safari
        // @ts-ignore
        const inputLatency = settings.latency;

        const latency = inputLatency + audioCtx.baseLatency + audioCtx.outputLatency;

        document.getElementById("latency-hint")!.innerHTML = `Latency ${Math.round(latency * 1000)}ms`;

        const latencyOffset = Math.floor(latency * audioCtx.sampleRate);

        // TODO: endre denne til en automation, for å unngå potensiell popping i lyden
        looperNode.parameters.get("latencyOffset")!.value = latencyOffset;
    }, 500);

    let isRecording = false;

    recordButton.addEventListener("click", () => {
        if (!isRecording) {
            recordButton.innerHTML = "Stop recording";

            looperNode.port.postMessage("toggleRecord");
        } else {
            recordButton.innerHTML = "Start recording";

            looperNode.port.postMessage("toggleRecord");
        }

        isRecording = !isRecording;
    });

    return audioCtx;
}
