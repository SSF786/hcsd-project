// Generates a short notification chime using the Web Audio API
// No external file needed — works in all modern browsers
export function playNotificationSound(type = 'info') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const configs = {
      emergency: [
        { freq: 880, start: 0,    dur: 0.12, vol: 0.5 },
        { freq: 660, start: 0.14, dur: 0.12, vol: 0.5 },
        { freq: 880, start: 0.28, dur: 0.18, vol: 0.6 },
      ],
      success: [
        { freq: 523, start: 0,    dur: 0.1,  vol: 0.3 },
        { freq: 659, start: 0.1,  dur: 0.1,  vol: 0.3 },
        { freq: 784, start: 0.2,  dur: 0.18, vol: 0.4 },
      ],
      task: [
        { freq: 440, start: 0,    dur: 0.1,  vol: 0.3 },
        { freq: 550, start: 0.12, dur: 0.14, vol: 0.35 },
      ],
      info: [
        { freq: 520, start: 0,    dur: 0.08, vol: 0.2 },
        { freq: 620, start: 0.1,  dur: 0.12, vol: 0.25 },
      ],
      warning: [
        { freq: 400, start: 0,    dur: 0.1,  vol: 0.3 },
        { freq: 380, start: 0.12, dur: 0.12, vol: 0.3 },
        { freq: 400, start: 0.26, dur: 0.1,  vol: 0.3 },
      ],
    };

    const notes = configs[type] || configs.info;
    notes.forEach(({ freq, start, dur, vol }) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch (e) {
    // Web Audio not available (unlikely) — silently skip
  }
}
