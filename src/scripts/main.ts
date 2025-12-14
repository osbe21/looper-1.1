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

    const looperNode = new AudioWorkletNode(audioCtx, "looper-processor");

    streamNode.connect(looperNode);

    looperNode.connect(audioCtx.destination);

    looperNode.port.onmessage = (e) => (loopProgress.value = e.data);

    let isRecording = false;

    recordButton.addEventListener("click", () => {
        if (!isRecording) {
            recordButton.innerHTML = "Stop recording";

            const latencyOffset = Math.floor(audioCtx.outputLatency * audioCtx.sampleRate);

            looperNode.parameters.get("latencyOffset")!.value = latencyOffset;
            looperNode.parameters.get("isRecording")!.value = 1;
        } else {
            recordButton.innerHTML = "Start recording";

            looperNode.parameters.get("isRecording")!.value = 0;
        }

        isRecording = !isRecording;
    });

    return audioCtx;
}
