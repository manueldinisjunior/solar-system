// Original synthesized ambient soundscape. No audio downloads or autoplay.
(() => {
  const button = document.getElementById("soundBtn");
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    button.disabled = true;
    button.title = "Audio is not supported by this browser";
    return;
  }

  let context;
  let master;
  let active = false;

  function createSoundscape() {
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 480;
    lowpass.Q.value = 0.3;
    lowpass.connect(master);

    // Quiet, slow-moving harmonic drone with a subtle stereo field.
    [55, 82.41, 110, 164.81, 220].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index < 2 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      const voice = context.createGain();
      voice.gain.value = [0.18, 0.09, 0.05, 0.025, 0.012][index];
      const pan = context.createStereoPanner?.();
      oscillator.connect(voice);
      if (pan) {
        pan.pan.value = (index - 2) * 0.2;
        voice.connect(pan);
        pan.connect(lowpass);
      } else {
        voice.connect(lowpass);
      }
      oscillator.start();
    });

    // Very slow filter movement gives the static chords a floating quality.
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.045;
    const depth = context.createGain();
    depth.gain.value = 130;
    lfo.connect(depth);
    depth.connect(lowpass.frequency);
    lfo.start();
  }

  function updateButton() {
    button.classList.toggle("on", active);
    button.setAttribute("aria-pressed", String(active));
    const label = active ? "Mute ambient space sound" : "Play ambient space sound";
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      if (!context) createSoundscape();
      if (context.state === "suspended") await context.resume();
      active = !active;
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(active ? 0.22 : 0, now, 0.4);
      updateButton();
    } catch (error) {
      active = false;
      updateButton();
      console.warn("Ambient audio unavailable:", error);
    } finally {
      button.disabled = false;
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(active && !document.hidden ? 0.22 : 0, now, 0.2);
  });
})();
