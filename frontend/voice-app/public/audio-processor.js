// Audio Worklet Processor for capturing microphone audio
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (input && input[0]) {
      const audioData = input[0];
      
      // Convert Float32Array to Int16Array (PCM 16-bit)
      const int16Data = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        // Clamp to -1.0 to 1.0 and convert to 16-bit int
        const clamped = Math.max(-1, Math.min(1, audioData[i]));
        int16Data[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
      }
      
      // Send to main thread
      this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
    }
    
    return true; // Keep processor alive
  }
}

registerProcessor("audio-processor", AudioProcessor);
