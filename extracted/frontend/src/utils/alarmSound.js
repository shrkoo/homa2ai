// Alarm sound system — internal to Homa AI, uses Web Audio API
// No external service required. Works while app is open.

let ctx = null;
let activeNodes = [];

function getCtx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

export function stopAlarmSound() {
  activeNodes.forEach((n) => {
    try { if (n.stop) n.stop(); } catch {}
    try { n.disconnect(); } catch {}
  });
  activeNodes = [];
}

// Internal alarm sound presets
const SOUNDS = {
  classic: { freqs: [880, 880, 1100], interval: 0.4, type: 'sine' },
  digital: { freqs: [1000, 1200], interval: 0.15, type: 'square' },
  chime: { freqs: [523, 659, 784, 1047], interval: 0.2, type: 'sine' },
  bell: { freqs: [440, 660, 880], interval: 0.5, type: 'triangle' },
  beep: { freqs: [800, 800], interval: 0.2, type: 'square' },
  gentle: { freqs: [392, 523, 659], interval: 0.6, type: 'sine' },
};

export function getAlarmSounds() {
  return Object.keys(SOUNDS);
}

// Play alarm sound in a loop until stopped. Returns a stop function.
export function playAlarmSound(soundId = 'classic', volume = 70, gradual = false) {
  const c = getCtx();
  if (!c) return () => {};

  const preset = SOUNDS[soundId] || SOUNDS.classic;
  const vol = Math.min(0.3, (volume / 100) * 0.25);
  let stopped = false;
  let timeoutId = null;
  let currentVol = gradual ? 0.02 : vol;
  let rampStep = gradual ? 0.03 : 0;

  const playCycle = () => {
    if (stopped) return;
    preset.freqs.forEach((freq, i) => {
      if (stopped) return;
      const start = (i * preset.interval);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = preset.type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, c.currentTime + start);
      g.gain.linearRampToValueAtTime(currentVol, c.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + preset.interval * 0.9);
      o.connect(g);
      g.connect(c.destination);
      o.start(c.currentTime + start);
      o.stop(c.currentTime + start + preset.interval);
      activeNodes.push(o, g);
    });
    // Gradually increase volume each cycle
    if (gradual && currentVol < vol) {
      currentVol = Math.min(vol, currentVol + rampStep);
    }
    const cycleLen = preset.freqs.length * preset.interval;
    timeoutId = setTimeout(playCycle, cycleLen * 1000);
  };

  playCycle();

  return () => {
    stopped = true;
    if (timeoutId) clearTimeout(timeoutId);
    stopAlarmSound();
  };
}

// Vibrate pattern (if supported)
export function vibrateDevice(pattern = [200, 100, 200, 100, 200]) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch {}
}