// Typescript har ikke full støtte for AudioWorklets enda, så filen må skrives i js for å unngå // @ts-ignore overalt

class LooperProcessor extends AudioWorkletProcessor {
    initLoop = [];
    fixedLoop = new Float32Array();
    currentLoopPos = 0;

    static get parameterDescriptors() {
        return [
            {
                name: "latencyOffset", // Hvor høy output latency-en er, i samples
                defaultValue: 0,
                minValue: 0,
                automationRate: "k-rate",
            },
            {
                name: "isRecording",
                defaultValue: 0,
                minValue: 0,
                maxValue: 1,
                automationRate: "k-rate", // TODO: Endre process slik at den tillater "a-rate"?
            },
        ];
    }

    process(inputs, outputs, parameters) {
        const latencyOffset = parameters.latencyOffset[0];
        const isRecording = parameters.isRecording[0];

        const input = inputs[0][0];
        const output = outputs[0][0];

        if (!isRecording && this.initLoop.length > 0 && this.fixedLoop.length === 0) {
            // Ble akkurat ferdig med init loop
            this.fixedLoop = new Float32Array(this.initLoop);
            this.initLoop = [];
        }

        if (!isRecording) {
            // Vi er i standby
            if (this.fixedLoop.length > 0) {
                for (let i = 0; i < output.length; i++) {
                    const latencyAdjustedPos = (this.currentLoopPos + latencyOffset) % this.fixedLoop.length;

                    output[i] = this.fixedLoop[latencyAdjustedPos];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.fixedLoop.length;
                }
            }
        } else {
            if (this.fixedLoop.length === 0) {
                // Vi er i init loop
                this.initLoop.push(...input);
            } else {
                // Vi er i overdub
                for (let i = 0; i < output.length; i++) {
                    const latencyAdjustedPos = (this.currentLoopPos + latencyOffset) % this.fixedLoop.length;

                    output[i] = this.fixedLoop[latencyAdjustedPos];

                    this.fixedLoop[this.currentLoopPos] += input[i];

                    this.currentLoopPos++;
                    this.currentLoopPos %= this.fixedLoop.length;
                }
            }
        }

        // TODO: Ikke send denne hver process chunk, brukes bare for å oppdatere ui
        if (this.fixedLoop.length > 0) this.port.postMessage(this.currentLoopPos / this.fixedLoop.length);

        return true;
    }
}

registerProcessor("looper-processor", LooperProcessor);
