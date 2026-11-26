// Efectos de sonido sintetizados con Web Audio (sin archivos). sfx('coin'), etc.
// Se activan tras el primer toque (los móviles no dejan sonar antes). Interruptor: localStorage 'iglu-sound' = 'off'.
let ctx = null, master = null;
const KEY = 'iglu-sound';
export const soundOn = () => localStorage.getItem(KEY) !== 'off';
export const setSound = (on) => localStorage.setItem(KEY, on ? 'on' : 'off');

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
// Desbloquear el audio con el primer toque
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, () => { if (soundOn()) ac(); }, { once: true, capture: true });

// Una nota: frecuencia (o [inicio, fin] para deslizar), duración, forma de onda, volumen, retraso
function tone(f, dur = 0.12, type = 'sine', vol = 0.6, delay = 0) {
  const c = ctx, t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  const [f0, f1] = Array.isArray(f) ? f : [f, f];
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}
// Ruido filtrado (agua, viento, papel)
function noise(dur = 0.3, freq = 1200, q = 1, vol = 0.4, delay = 0, type = 'bandpass') {
  const c = ctx, t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

const SOUNDS = {
  tap: () => tone([520, 640], 0.06, 'triangle', 0.35),
  pop: () => tone([380, 900], 0.09, 'sine', 0.5),
  key: () => tone([700, 760], 0.05, 'square', 0.12),
  coin: () => { tone(988, 0.08, 'square', 0.18); tone(1319, 0.22, 'square', 0.18, 0.07); },
  coins: () => { [0, 0.07, 0.14, 0.21].forEach((d, i) => tone([1175 + i * 90, 1568 + i * 90], 0.12, 'square', 0.12, d)); },
  buy: () => { tone(784, 0.08, 'triangle', 0.4); tone(1047, 0.08, 'triangle', 0.4, 0.08); tone(1319, 0.2, 'triangle', 0.4, 0.16); },
  success: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.4, i * 0.08)); },
  fanfare: () => { [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3], [784, 0.42], [1047, 0.5]].forEach(([f, d]) => tone(f, 0.2, 'square', 0.14, d)); tone(1047, 0.5, 'triangle', 0.3, 0.5); },
  fail: () => { tone([330, 220], 0.22, 'sawtooth', 0.12); tone([262, 175], 0.3, 'sawtooth', 0.1, 0.12); },
  whoosh: () => noise(0.35, 900, 0.8, 0.35),
  splash: () => { noise(0.4, 600, 0.6, 0.5); tone([900, 300], 0.15, 'sine', 0.2, 0.02); },
  reel: () => { for (let i = 0; i < 6; i++) tone(1400 + (i % 2) * 200, 0.025, 'square', 0.08, i * 0.035); },
  chest: () => { noise(0.15, 300, 1, 0.3); [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.35, 0.12 + i * 0.07)); },
  love: () => { tone([600, 900], 0.18, 'sine', 0.4); tone([800, 1200], 0.25, 'sine', 0.35, 0.15); },
  kiss: () => { tone([1800, 600], 0.08, 'sine', 0.35); noise(0.05, 3000, 2, 0.2, 0.02); },
  paper: () => { noise(0.25, 4000, 0.7, 0.25); noise(0.2, 2500, 0.7, 0.2, 0.15); },
  levelup: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.14, 'triangle', 0.35, i * 0.06)); tone(2093, 0.6, 'sine', 0.25, 0.4); },
  swish: () => noise(0.18, 2000, 1.5, 0.25),
};

export function sfx(name) {
  if (!soundOn() || !SOUNDS[name]) return;
  try { if (ac()) SOUNDS[name](); } catch { /* sin sonido */ }
}
