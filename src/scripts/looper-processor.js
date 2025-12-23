// Typescript har ikke full inference for AudioWorklets, så filen må skrives i js for å unngå // @ts-ignore overalt

class LooperProcessor extends AudioWorkletProcessor {
    state = "empty";
    loopLength = 0;
    currentLoopPos = 0;
    updateProgressCounter = 0;

    inputLatency = 0; // samples
    outputLatency = 0; // samples

    constructor(options) {
        super();

        this.loopBuffer = new Float32Array(options.processorOptions.bufferSize);
        this.updateProgressInterval = options.processorOptions.updateProgressInterval; // samples

        this.port.onmessage = (e) => {
            switch (e.data.type) {
                case "footswitch":
                    this.handleFootswitch();
                    break;
                case "set-input-latency":
                    this.inputLatency = e.data.value;
                    break;
                case "set-output-latency":
                    this.outputLatency = e.data.value;
                    break;
            }
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
        this.loopBuffer.fill(0);
        this.loopLength = 0;
        this.currentLoopPos = 0;
    }

    process(inputs, outputs) {
        const input = inputs[0][0];
        const output = outputs[0][0];

        for (let i = 0; i < output.length; i++) {
            const latencyOffset = this.inputLatency + this.outputLatency;
            const latencyAdjustedPos = (this.currentLoopPos + latencyOffset) % this.loopLength;

            switch (this.state) {
                case "init recording":
                    // TODO: offset opptaket med inputLatency-en
                    this.loopBuffer[this.loopLength] = input[i];

                    this.loopLength++;

                    if (this.loopLength === this.loopBuffer.length) {
                        this.handleFootswitch();
                    }

                    break;

                case "playing":
                    output[i] = this.loopBuffer[latencyAdjustedPos];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.loopLength;

                    break;

                case "overdubbing":
                    output[i] = this.loopBuffer[latencyAdjustedPos];

                    this.loopBuffer[this.currentLoopPos] += input[i];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.loopLength;

                    break;
            }
        }

        this.updateProgressCounter += output.length;

        if (this.updateProgressCounter >= this.updateProgressInterval && this.loopLength > 0) {
            this.port.postMessage({ type: "set-progress", value: this.currentLoopPos / this.loopLength });
            this.updateProgressCounter %= this.updateProgressInterval;
        }

        return true;
    }
}

registerProcessor("looper-processor", LooperProcessor);
