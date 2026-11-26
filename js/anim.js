// Animaciones de la app. Todo usa transform/opacity (Web Animations API) y se apaga con
// prefers-reduced-motion. render() reconstruye #app, así que los efectos que dependen del
// DOM nuevo se registran con after(fn) y se ejecutan al final del siguiente render() (flush()).

const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => mq.matches;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));
export const center = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

// ---------- cola "después del render" ----------
let queue = [];
export function after(fn) { queue.push([Date.now(), fn]); }
export function flush() {
  const q = queue; queue = [];
  const now = Date.now(), run = q.filter(([t]) => now - t < 5000);
  if (!run.length) return;
  // Antes del siguiente pintado: el DOM nuevo aún no se ha visto.
  requestAnimationFrame(() => run.forEach(([, fn]) => { try { fn(); } catch { /* un efecto nunca rompe la app */ } }));
}

// Punto de origen de las monedas (cofre, reto, pesca…) para el vuelo hacia el contador.
let coinFrom = null;
export function setCoinOrigin(pt) { coinFrom = pt ? { ...pt, t: Date.now() } : null; }
export function takeCoinOrigin() {
  const o = coinFrom; coinFrom = null;
  return o && Date.now() - o.t < 5000 ? o : null;
}

// ---------- básicos (WAAPI) ----------
function run(el, keyframes, opt = {}) {
  if (!el || reduced() || !el.animate) return null;
  return el.animate(keyframes, { duration: 400, easing: 'ease-out', fill: 'backwards', ...opt });
}

export const pop = (el, ms = 450, delay = 0) => run(el, [
  { scale: '.55', opacity: 0 }, { scale: '1.14', opacity: 1, offset: .6 }, { scale: '1', opacity: 1 },
], { duration: ms, delay, easing: 'cubic-bezier(.2,1.2,.4,1)' });

export const pulse = (el, amount = 1.18, ms = 300) => run(el, [
  { scale: '1' }, { scale: String(amount), offset: .4 }, { scale: '1' },
], { duration: ms });

export const squish = (el) => run(el, [
  { scale: '1 1' }, { scale: '1.16 .8', offset: .25 }, { scale: '.92 1.12', offset: .55 }, { scale: '1 1' },
], { duration: 420 });

export const shake = (el, px = 7) => run(el, [
  { translate: '0 0' }, { translate: `${-px}px 0`, offset: .15 }, { translate: `${px}px 0`, offset: .35 },
  { translate: `${-px * .6}px 0`, offset: .55 }, { translate: `${px * .4}px 0`, offset: .75 }, { translate: '0 0' },
], { duration: 420, easing: 'ease-in-out' });

export const hop = (el) => run(el, [
  { translate: '0 0', rotate: '0deg' }, { translate: '0 -22px', rotate: '-6deg', offset: .35 },
  { translate: '0 0', rotate: '0deg', offset: .62 }, { translate: '0 -8px', rotate: '3deg', offset: .8 }, { translate: '0 0', rotate: '0deg' },
], { duration: 650, easing: 'ease-out' });

export const wobble = (el) => run(el, [
  { rotate: '0deg' }, { rotate: '-9deg', offset: .25 }, { rotate: '7deg', offset: .55 }, { rotate: '-3deg', offset: .8 }, { rotate: '0deg' },
], { duration: 480, easing: 'ease-in-out' });

export const slideIn = (el, { x = 0, y = 14, delay = 0, dur = 380 } = {}) => run(el, [
  { transform: `translate(${x}px, ${y}px)`, opacity: 0 }, { transform: 'none', opacity: 1 },
], { duration: dur, delay, easing: 'cubic-bezier(.2,.9,.3,1)' });

export const slideOut = (el, x = 36) => {
  const a = run(el, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${x}px)`, opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
  return a ? a.finished.catch(() => {}) : Promise.resolve();
};

export const flip = (el, delay = 0) => run(el, [
  { transform: 'perspective(240px) rotateX(90deg)', opacity: .2 }, { transform: 'perspective(240px) rotateX(-14deg)', opacity: 1, offset: .7 }, { transform: 'perspective(240px) rotateX(0)', opacity: 1 },
], { duration: 420, delay, easing: 'ease-out' });

export const ring = (el, color = 'rgba(255,122,89,.55)') => run(el, [
  { boxShadow: `0 0 0 0 ${color}` }, { boxShadow: `0 0 0 12px rgba(255,255,255,0)` },
], { duration: 600 });

export function bounceTab() {
  run($('.tab[aria-current="page"] .ico'), [
    { translate: '0 0', scale: '1' }, { translate: '0 -9px', scale: '1.25 .9', offset: .35 },
    { translate: '0 0', scale: '.9 1.12', offset: .65 }, { translate: '0 -3px', scale: '1.05', offset: .85 }, { translate: '0 0', scale: '1' },
  ], { duration: 540 });
}

// ---------- partículas ----------
function layer() {
  let l = document.getElementById('fx-layer');
  if (!l) { l = document.createElement('div'); l.id = 'fx-layer'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l); }
  return l;
}
function particle(txt, x, y, size) {
  const s = document.createElement('span');
  s.className = 'fx-p'; s.textContent = txt;
  s.style.cssText = `left:${x}px;top:${y}px;font-size:${size}px`;
  layer().appendChild(s);
  return s;
}
const rand = (a, b) => a + Math.random() * (b - a);

// Explosión de emojis desde un punto (coordenadas de pantalla).
export function burst(x, y, { emojis = ['✨'], n = 10, r = 70, size = 18, dur = 900, lift = 30 } = {}) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(0, .5), d = r * rand(.6, 1.2);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d - lift, spin = rand(-90, 90);
    const p = particle(emojis[i % emojis.length], x, y, size * rand(.8, 1.3));
    const an = p.animate([
      { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(1.1) rotate(${spin}deg)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx * 1.1}px,${dy + 44}px) scale(.7) rotate(${spin * 1.4}deg)`, opacity: 0 },
    ], { duration: dur * rand(.85, 1.2), easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
    an.onfinish = () => p.remove();
  }
}
export const sparkle = (el, o = {}) => { if (el) { const c = center(el); burst(c.x, c.y, { emojis: ['✨', '💫', '⭐'], n: 9, r: 52, size: 16, ...o }); } };

// Emojis que vuelan de un punto a otro con un arco.
export function fly(from, to, emoji, n = 1, { size = 22, dur = 800, stagger = 70, arc = -70, done } = {}) {
  if (reduced()) { done && done(0); return; }
  for (let i = 0; i < n; i++) {
    const p = particle(emoji, from.x + rand(-14, 14), from.y + rand(-10, 10), size);
    const dx = to.x - from.x, dy = to.y - from.y, bend = arc * rand(.7, 1.3);
    const an = p.animate([
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: `translate(${dx * .3}px,${dy * .3 + bend}px) scale(1.15)`, opacity: 1, offset: .35 },
      { transform: `translate(${dx}px,${dy}px) scale(.55)`, opacity: 1, offset: .95 },
      { transform: `translate(${dx}px,${dy}px) scale(.4)`, opacity: 0 },
    ], { duration: dur, delay: i * stagger, easing: 'cubic-bezier(.45,0,.65,.7)', fill: 'both' });
    an.onfinish = () => { p.remove(); done && done(i); };
  }
}

// Monedas que vuelan hasta el contador de la cabecera, que "late" al recibirlas.
export function flyCoins(from, n = 5) {
  const chip = $('.chip.coins');
  if (!chip) return;
  const to = center(chip);
  fly(from, to, '🪙', Math.min(8, Math.max(3, n)), { size: 22, done: (i) => { if (i % 2 === 0) pulse(chip, 1.22, 260); } });
}

// Emojis que suben flotando (mimos).
export function floatUp(from, emoji, n = 4) {
  if (reduced()) return;
  for (let i = 0; i < n; i++) {
    const p = particle(emoji, from.x + rand(-26, 26), from.y, rand(22, 34));
    const sway = rand(-34, 34), rise = rand(110, 190);
    const an = p.animate([
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${sway * .4}px,${-rise * .25}px) scale(1.1)`, opacity: 1, offset: .2 },
      { transform: `translate(${-sway}px,${-rise * .7}px) scale(1)`, opacity: 1, offset: .65 },
      { transform: `translate(${sway * .6}px,${-rise}px) scale(.8)`, opacity: 0 },
    ], { duration: rand(1100, 1500), delay: i * 110, easing: 'ease-out', fill: 'both' });
    an.onfinish = () => p.remove();
  }
}

// ---------- filas nuevas ----------
export const snapIds = (sel) => new Set($$(sel).map((e) => e.dataset.id));
// Tras el siguiente render, desliza las filas cuyo data-id no estaba antes.
export function slideNewRows(sel, rowSel, before) {
  after(() => $$(sel).filter((e) => !before.has(e.dataset.id)).forEach((e) => {
    const row = e.closest(rowSel);
    slideIn(row, { y: -16, dur: 460 });
    ring(row, 'rgba(79,181,122,.5)');
  }));
}
