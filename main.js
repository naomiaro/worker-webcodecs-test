import { Output, OggOutputFormat, BufferTarget, EncodedAudioPacketSource } from 'mediabunny';

const worker = new Worker('./encoder-worker.js', { type: 'module' });
let audioCtx, reader, micTrack, analyser, dataArray, animationFrame;
let encodedChunks = [];
let actualSampleRate = 48000;
let actualChannels = 1;

worker.onmessage = (e) => {
  if (e.data.type === 'encoded') {
    encodedChunks.push(e.data.chunk);
  }
};

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 2 } });
  micTrack = stream.getAudioTracks()[0];

  audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);

  const processor = new MediaStreamTrackProcessor({ track: micTrack });
  reader = processor.readable.getReader();

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
    const { done, value } = await reader.read();
    if (done) break;
    worker.postMessage({ type: 'encode', audioData: value }, [value]);
  }
}

function drawVolume() {
  analyser.getByteFrequencyData(dataArray);
  const volume = Math.max(...dataArray);
  document.getElementById("volumeBar").style.width = `${volume / 2}%`;
  animationFrame = requestAnimationFrame(drawVolume);
}

export async function stopRecording() {
  reader.cancel();
  micTrack.stop();
  cancelAnimationFrame(animationFrame);
  worker.postMessage({ type: 'flush' });

  await new Promise((resolve) => setTimeout(resolve, 500)); // wait for flush

  const output = new Output({
    format: new OggOutputFormat(),
    target: new BufferTarget(),
  });

  const source = new EncodedAudioPacketSource('opus');
  for (const chunk of encodedChunks) {
    await source.add(chunk, {
      decoderConfig: {
        codec: 'opus',
        numberOfChannels: actualChannels,
        sampleRate: actualSampleRate
      }
    });
  }

  output.addAudioTrack(source);
  await output.start();
  await output.finalize();

  const blob = new Blob([output.target.buffer], { type: 'audio/ogg' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.ogg';
  a.click();
}

window.startRecording = startRecording;
window.stopRecording = stopRecording;
