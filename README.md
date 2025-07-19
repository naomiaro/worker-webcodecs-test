# worker-webcodecs-test

https://www.w3.org/TR/webcodecs-mp3-codec-registration/
https://w3c.github.io/webcodecs/codec_registry.html

https://bugzilla.mozilla.org/show_bug.cgi?id=MediaStreamTrackProcessor


A main script that captures mic input and uses MediaStreamTrackProcessor

A Web Worker to encode with WebCodecs AudioEncoder

Visual volume bars via AnalyserNode

Pause/resume with flags

Stereo support via AudioData with 2 channels



Serve it via a local HTTP server (e.g., python3 -m http.server).

Open http://localhost:8000 in a Chromium-based browser.

