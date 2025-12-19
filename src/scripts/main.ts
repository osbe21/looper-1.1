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
    const audioCtx = new AudioContext({ latencyHint: 0 });

    // TODO: Gjør at man kan velge/fjerne disse
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            sampleRate: audioCtx.sampleRate,
            channelCount: 1,
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
            // @ts-ignore Støttes ikke av safari
            latency: 0,
        },
    });

    const streamNode = new MediaStreamAudioSourceNode(audioCtx, { mediaStream: stream });

    await audioCtx.audioWorklet.addModule(looperProcessorURL);

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

        console.log(`Input latency: ${Math.round(inputLatency * 1000)}ms`);
        console.log(`Base latency: ${Math.round(audioCtx.baseLatency * 1000)}ms`);
        console.log(`Output latency: ${Math.round(audioCtx.outputLatency * 1000)}ms`);

        // TODO: offset opptaket med inputLatency-en
        const latency = inputLatency + audioCtx.baseLatency + audioCtx.outputLatency;

        document.getElementById("latency-hint")!.innerHTML = `Latency ${Math.round(latency * 1000)}ms`;

        const latencyOffset = Math.floor(latency * audioCtx.sampleRate);

        // TODO: endre denne til en automation, for å unngå potensiell popping i lyden
        looperNode.parameters.get("latencyOffset")!.value = latencyOffset;
    }, 1000);

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
