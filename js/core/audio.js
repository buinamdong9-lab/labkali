window.LabAudio = (function () {
  let ctx = null;
  let enabled = true;

  function ensureContext() {
    if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  function playKeyTick() {
    if (!enabled) return;
    try {
      ensureContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(650 + Math.random() * 280, ctx.currentTime);

      gain.gain.setValueAtTime(0.018, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.022);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.024);
    } catch (_) {
      // Ignore audio errors when browser blocks autoplay
    }
  }

  function playAlertBeep(type = "info") {
    if (!enabled) return;
    try {
      ensureContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === "vuln" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(type === "vuln" ? 320 : 880, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (_) {}
  }

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  return {
    playKeyTick,
    playAlertBeep,
    toggle,
    isEnabled
  };
})();

