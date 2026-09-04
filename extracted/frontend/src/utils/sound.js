let ctx = null;

function getCtx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

export function playBeep(freq = 660, duration = 0.08) {
  try {
    const c = getCtx(); if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    o.stop(c.currentTime + duration);
  } catch {}
}

// Pleasant in-app notification chime — managed entirely by Homa AI
function playTone(c, freq, start, duration, volume = 0.06, type = 'sine') {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(volume, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
  o.connect(g);
  g.connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + duration);
}

// Success chime — rising arpeggio (C5-E5-G5-C6)
export function playNotification() {
  try {
    const c = getCtx(); if (!c) return;
    playTone(c, 523.25, 0, 0.15);
    playTone(c, 659.25, 0.08, 0.15);
    playTone(c, 783.99, 0.16, 0.15);
    playTone(c, 1046.5, 0.24, 0.3, 0.07);
  } catch {}
}

// Error sound — descending tones (G4-E4-C4)
export function playErrorSound() {
  try {
    const c = getCtx(); if (!c) return;
    playTone(c, 392.0, 0, 0.15, 0.05, 'triangle');
    playTone(c, 329.63, 0.12, 0.15, 0.05, 'triangle');
    playTone(c, 261.63, 0.24, 0.3, 0.06, 'triangle');
  } catch {}
}