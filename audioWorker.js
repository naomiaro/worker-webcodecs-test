let encoder;

self.onmessage = async (e) => {
  const { type, config, audioData } = e.data;

  if (type === "init") {
    encoder = new AudioEncoder({
      output: handleChunk,
      error: (e) => console.error("AudioEncoder error", e),
    });

    encoder.configure({
      codec: config.codec,
      sampleRate: config.sampleRate,
      numberOfChannels: config.numberOfChannels,
      bitrate: config.bitrate,
    });
  }

  if (type === "encode" && audioData) {
    encoder.encode(audioData);
  }

  if (type === "flush") {
    await encoder.flush();
    self.postMessage({ type: "done" });
  }
};

function handleChunk(chunk) {
  const copy = chunk.copy();
  self.postMessage({ type: "encoded", chunk: copy }, [copy.buffer]);
}
