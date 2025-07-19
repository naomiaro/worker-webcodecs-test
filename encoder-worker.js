let encoder;

console.log(typeof MediaStreamTrackProcessor !== 'undefined')

self.onmessage = async (e) => {
  const { type, config, audioData } = e.data;

  if (type === "init") {
    self.encoderConfig = config; // store desired codec + bitrate
    return;
  }

  if (type === "encode" && audioData) {
    if (!encoder) {
      encoder = new AudioEncoder({
        output: (chunk) => {
          const raw = new Uint8Array(chunk.byteLength);
          chunk.copyTo(raw);

          const transferableChunk = {
            timestamp: chunk.timestamp,
            duration: chunk.duration ?? 0,
            type: chunk.type,
            data: raw, // send Uint8Array directly
          };
          self.postMessage({ type: 'encoded', chunk: transferableChunk }, [raw.buffer]);
        },
        error: (e) => console.error("AudioEncoder error:", e),
      });

      encoder.configure({
        codec: self.encoderConfig.codec,
        sampleRate: audioData.sampleRate,
        numberOfChannels: audioData.numberOfChannels,
        bitrate: self.encoderConfig.bitrate,
      });
    }

    encoder.encode(audioData);
  }

  if (type === 'flush') {
    await encoder.flush();
  }
};
