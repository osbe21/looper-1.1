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
        console.log(audioCtx.baseLatency);
        console.log(audioCtx.outputLatency);

        if (!isRecording) {
            recordButton.innerHTML = "Stop recording";

            looperNode.parameters.get("isRecording")!.value = 1;
        } else {
            recordButton.innerHTML = "Start recording";

            looperNode.parameters.get("isRecording")!.value = 0;
        }

        isRecording = !isRecording;
    });

    return audioCtx;
}
