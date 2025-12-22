// Typescript har ikke full inference for AudioWorklets, så filen må skrives i js for å unngå // @ts-ignore overalt

class LooperProcessor extends AudioWorkletProcessor {
    static maxSamples = sampleRate * 60 * 5; // 5 minutter

    static get parameterDescriptors() {
        return [
            {
                name: "latencyOffset", // Hvor høy output latency-en er, i samples
                defaultValue: 0,
                minValue: 0,
                // TODO: endre til a-rate, slik at vi kan automate
                // Man merker tydelig popping når inputen er en sinusbølge
                automationRate: "k-rate",
            },
        ];
    }

    state = "empty";
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
            case "empty":
                this.state = "init recording";
                break;
            case "init recording":
                if (this.loopLength === 0) return;
                this.state = "playing";
                break;
            case "playing":
                this.state = "overdubbing";
                break;
            case "overdubbing":
                this.state = "playing";
                break;
        }

        this.port.postMessage({ type: "set-state", value: this.state });
    }

    reset() {
        this.state = "empty";
        this.loop = new Float32Array(LooperProcessor.maxSamples);
        this.loopLength = 0;
        this.currentLoopPos = 0;
    }

    process(inputs, outputs, parameters) {
        const latencyOffset = parameters.latencyOffset[0];

        const input = inputs[0][0];
        const output = outputs[0][0];

        switch (this.state) {
            case "init recording":
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

            case "playing":
                for (let i = 0; i < output.length; i++) {
                    const latencyAdjustedPos = (this.currentLoopPos + latencyOffset) % this.loopLength;

                    output[i] = this.loop[latencyAdjustedPos];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.loopLength;
                }

                break;

            case "overdubbing":
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
