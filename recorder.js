let worker = new Worker("audioWorker.js", { type: "module" });
let audioCtx, processor, reader, micTrack;
let isPaused = false;
let analyser, dataArray;
let animationFrame;

const chunks = [];

worker.onmessage = (e) => {
  if (e.data.type === "encoded") {
    chunks.push(e.data.chunk);
  } else if (e.data.type === "done") {
    const blob = new Blob(chunks, { type: "audio/ogg" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.ogg";
    a.click();
  }
};

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 2 } });
  micTrack = stream.getAudioTracks()[0];

  audioCtx = new AudioContext({ sampleRate: 48000 });
  const source = audioCtx.createMediaStreamSource(stream);

  // 🔊 Volume visualization setup
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);

  const trackProcessor = new MediaStreamTrackProcessor({ track: micTrack });
  reader = trackProcessor.readable.getReader();

  // 🔧 Encoder config (stereo!)
  worker.postMessage({
    type: "init",
    config: {
      codec: "opus",
      sampleRate: audioCtx.sampleRate,
      numberOfChannels: 2,
      bitrate: 128000,
    },
  });

  readAudio();
  drawVolume();
}

async function readAudio() {
  while (true) {
    if (isPaused) {
      await new Promise(r => setTimeout(r, 100));
      continue;
    }

    const { done, value } = await reader.read();
    if (done) break;
    const audioData = value;
    const transferred = audioData.transferTo({});
    worker.postMessage({ type: "encode", audioData: transferred }, [transferred]);
  }
}

function drawVolume() {
  analyser.getByteFrequencyData(dataArray);
  const volume = Math.max(...dataArray);
  // Render volume bar (you can replace with canvas logic)
  document.getElementById("volumeBar").style.width = `${volume / 2}%`;
  animationFrame = requestAnimationFrame(drawVolume);
}

function pauseRecording() {
  isPaused = true;
}

function resumeRecording() {
  isPaused = false;
}

function stopRecording() {
  reader.cancel();
  micTrack.stop();
  cancelAnimationFrame(animationFrame);
  worker.postMessage({ type: "flush" });
}
