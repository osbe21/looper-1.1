// Typescript har ikke full inference for AudioWorklets, så filen må skrives i js for å unngå // @ts-ignore overalt

const State = {
    Empty: 0,
    InitRecording: 1,
    Playing: 2,
    Overdubbing: 3,
};

class LooperProcessor extends AudioWorkletProcessor {
    static maxSamples = sampleRate * 60 * 5; // 5 minutter

    static get parameterDescriptors() {
        return [
            {
                name: "latencyOffset", // Hvor høy output latency-en er, i samples
                defaultValue: 0,
                minValue: 0,
                automationRate: "k-rate", // TODO: endre til a-rate, slik at vi kan automate
            },
        ];
    }

    state = State.Empty;
    loop = new Float32Array(LooperProcessor.maxSamples);
    loopLength = 0;
    currentLoopPos = 0;

    constructor(...args) {
        super(...args);

        this.port.onmessage = (e) => {
            if (e.data.type === "footswitch") this.handleFootswitch();
        };
    }

    handleFootswitch() {
        switch (this.state) {
            case State.Empty:
                this.state = State.InitRecording;
                break;
            case State.InitRecording:
                console.log("Attempting to stop recording");
                if (this.loopLength === 0) return;
                console.log("Stopped recording");
                this.state = State.Playing;
                break;
            case State.Playing:
                this.state = State.Overdubbing;
                break;
            case State.Overdubbing:
                this.state = State.Playing;
                break;
        }

        this.port.postMessage({ type: "set-state", value: this.state });
    }

    reset() {
        this.state = State.Empty;
        this.loop = new Float32Array(LooperProcessor.maxSamples);
        this.loopLength = 0;
        this.currentLoopPos = 0;
    }

    process(inputs, outputs, parameters) {
        const latencyOffset = parameters.latencyOffset[0];

        const input = inputs[0][0];
        const output = outputs[0][0];

        switch (this.state) {
            case State.InitRecording:
                if (this.loopLength + input.length > this.loop.length) {
                    // TODO: Ta opp helt opp til vi når enden av bufferet
                    this.handleFootswitch();
                } else {
                    // TODO: offset opptaket med inputLatency-en
                    this.loop.set(input, this.loopLength);

                    this.loopLength += input.length;

                    console.log(this.loopLength);

                    break;
                }

            case State.Playing:
                for (let i = 0; i < output.length; i++) {
                    const latencyAdjustedPos = (this.currentLoopPos + latencyOffset) % this.loopLength;

                    output[i] = this.loop[latencyAdjustedPos];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.loopLength;
                }

                break;

            case State.Overdubbing:
                for (let i = 0; i < output.length; i++) {
                    const latencyAdjustedPos = (this.currentLoopPos + latencyOffset) % this.loopLength;

                    output[i] = this.loop[latencyAdjustedPos];

                    this.loop[this.currentLoopPos] += input[i];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.loopLength;
                }

                break;
        }

        // TODO: Finn en bedre måte å bestemme når denne eventen skal fires
        if (this.currentLoopPos % (128 * 16) == 0 && this.loopLength > 0)
            this.port.postMessage({ type: "set-loop-progress", value: this.currentLoopPos / this.loopLength });

        return true;
    }
}

registerProcessor("looper-processor", LooperProcessor);
