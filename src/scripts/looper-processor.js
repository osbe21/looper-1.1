// Typescript har ikke full støtte for AudioWorklets enda, så filen må skrives i js for å unngå // @ts-ignore overalt

const State = {
    Idle: 0,
    InitLoop: 1,
    Playback: 2,
    Overdub: 3,
};

class LooperProcessor extends AudioWorkletProcessor {
    static maxSamples = sampleRate * 60 * 5; // 5 minutter

    static get parameterDescriptors() {
        return [
            {
                name: "latencyOffset", // Hvor høy output latency-en er, i samples
                defaultValue: 0,
                minValue: 0,
                automationRate: "k-rate",
            },
        ];
    }

    state = State.Idle;
    loop = new Float32Array(LooperProcessor.maxSamples);
    loopLength = 0;
    currentLoopPos = 0;

    constructor(...args) {
        super(...args);

        this.port.onmessage = (e) => {
            switch (e.data) {
                case "toggleRecord":
                    this.handleToggleRecord();
                    break;

                case "reset":
                    this.state = State.Idle;
                    this.loop = new Float32Array(LooperProcessor.maxSamples);
                    this.loopLength = 0;
                    this.currentLoopPos = 0;
                    break;
            }
        };
    }

    handleToggleRecord() {
        switch (this.state) {
            case State.Idle:
                this.state = State.InitLoop;
                break;
            case State.InitLoop:
                this.state = State.Playback;
                break;
            case State.Playback:
                this.state = State.Overdub;
                break;
            case State.Overdub:
                this.state = State.Playback;
                break;
        }
    }

    process(inputs, outputs, parameters) {
        const latencyOffset = parameters.latencyOffset[0];

        const input = inputs[0][0];
        const output = outputs[0][0];

        switch (this.state) {
            case State.InitLoop:
                if (this.loopLength + input.length > this.loop.length) {
                    // FIXME: Send event om at vi endret state internt
                    // TODO: Ta opp helt opp til vi når enden av bufferet
                    this.handleToggleRecord();
                } else {
                    this.loop.set(input, this.loopLength);

                    this.loopLength += input.length;

                    break;
                }

            case State.Playback:
                for (let i = 0; i < output.length; i++) {
                    const latencyAdjustedPos = (this.currentLoopPos + latencyOffset) % this.loopLength;

                    output[i] = this.loop[latencyAdjustedPos];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.loopLength;
                }

                break;

            case State.Overdub:
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
            this.port.postMessage(this.currentLoopPos / this.loopLength);

        return true;
    }
}

registerProcessor("looper-processor", LooperProcessor);
