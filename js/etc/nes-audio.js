class NESAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.buffer = new Float32Array(44100);
        this.writeIndex = 0;
        this.readIndex  = 0;

        this.port.onmessage = (event) => {
            if (event.data.type === "samples") {
                const samples = new Float32Array(event.data.samples);
                for (let i = 0; i < samples.length; i++) {
                    this.buffer[this.writeIndex] = samples[i];
                    this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
                }
            }
        };
    }

    process(inputs, outputs) {
        const output = outputs[0][0];
        for (let i = 0; i < output.length; i++) {
            output[i] = this.buffer[this.readIndex] || 0.0;
            this.readIndex = (this.readIndex + 1) % this.buffer.length;
        }

        return true;
    }
}

registerProcessor("nes-audio", NESAudioProcessor);
