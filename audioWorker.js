let encoder;

self.onmessage = async (e) => {
  const { type, config, audioData } = e.data;

  if (type === "init") {
    self.encoderConfig = config; // store desired codec + bitrate
    return;
  }

  if (type === "encode" && audioData) {
    if (!encoder) {
      encoder = new AudioEncoder({
        output: handleChunk,
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

  if (type === "flush") {
    await encoder.flush();
    self.postMessage({ type: "done" });
  }
};

function handleChunk(chunk) {
  self.postMessage({ type: "encoded", chunk });
}
