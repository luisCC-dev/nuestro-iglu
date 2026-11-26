// Escena del iglú (portada de "Hoy" y vista previa de la Tienda).
// bg: id de fondo de la tienda ('bg:aurora') o null; night: si es de noche y no hay fondo.
// duo: HTML de los pingüinos; top: HTML encima (saludo, monedas…); cls: clases extra.

// Valores pseudo-aleatorios fijos (la escena no parpadea al repintarse).
const rnd = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

// Copos / pétalos que caen (animados por CSS).
function fall(n, kind) {
  let h = '';
  for (let i = 0; i < n; i++) {
    const s = kind === 'petal' ? 7 + rnd(i, 1) * 5 : 3 + rnd(i, 1) * 4;
    h += `<i style="--x:${Math.round(rnd(i, 2) * 96)}%;--s:${s.toFixed(1)}px;--d:${(kind === 'petal' ? 7 : 6) + rnd(i, 3) * 5}s;--dl:${(-rnd(i, 4) * 10).toFixed(1)}s;--dx:${Math.round(rnd(i, 5) * 40 - 20)}px"></i>`;
  }
  return `<div class="fall ${kind}">${h}</div>`;
}

// Estrellas que parpadean.
function stars(n, maxY = 70) {
  let h = '';
  for (let i = 0; i < n; i++) {
    const s = 1.5 + rnd(i, 7) * 2;
    h += `<i style="left:${Math.round(rnd(i, 8) * 98)}%;top:${Math.round(rnd(i, 9) * maxY)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;animation-delay:${(-rnd(i, 10) * 4).toFixed(1)}s"></i>`;
  }
  return `<div class="stars">${h}</div>`;
}

const cloud = (cls) => `<span class="cloud2 ${cls}"></span>`;

const DECOR = {
  day: () => `<span class="sun"></span>${cloud('c1')}${cloud('c2')}`,
  night: () => `${stars(22)}<span class="moon"></span>`,
  snow: () => `${cloud('c1 grey')}${cloud('c2 grey')}${fall(16, 'flake')}`,
  sunset: () => `<span class="sunset-sun"></span>${cloud('c1 warm')}${cloud('c2 warm')}<span class="glint g1"></span><span class="glint g2"></span><span class="glint g3"></span>`,
  beach: () => `<span class="sun"></span>${cloud('c1')}<span class="sand"></span>
    <svg class="palm" viewBox="0 0 70 100" aria-hidden="true"><path d="M33 98 Q38 60 30 30" stroke="#a9744a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M33 90 l4 -3 M35 76 l4 -3 M34 62 l4 -3" stroke="#8a5a36" stroke-width="2" stroke-linecap="round"/>
      <g fill="#4cb878"><path d="M30 30 Q12 16 2 30 Q16 22 30 32z"/><path d="M30 30 Q20 8 6 8 Q22 12 31 29z"/><path d="M30 30 Q40 6 56 8 Q40 14 31 29z"/><path d="M30 30 Q48 16 66 30 Q48 22 30 32z"/></g>
      <circle cx="29" cy="33" r="3.4" fill="#7a4a2b"/><circle cx="35" cy="34" r="3.2" fill="#7a4a2b"/></svg>
    <svg class="shell" viewBox="0 0 24 20" aria-hidden="true"><path d="M3 17 Q2 6 12 3 Q22 6 21 17z" fill="#ffb3c7"/><path d="M12 4 V17 M7 6 L7 17 M17 6 L17 17" stroke="#ff8fae" stroke-width="1.3"/></svg>`,
  sakura: () => `<svg class="branch" viewBox="0 0 150 90" aria-hidden="true"><path d="M150 6 Q100 14 70 40 Q50 56 30 62" stroke="#8a5a47" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M96 24 Q84 40 80 52" stroke="#8a5a47" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${[[118, 10], [92, 24], [70, 40], [48, 54], [30, 62], [80, 54], [104, 36]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 40})">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="4.6" ry="7" cy="-5" transform="rotate(${a})" fill="#ffc2da"/>`).join('')}<circle r="2.4" fill="#ffe27a"/></g>`).join('')}</svg>${fall(12, 'petal')}`,
  aurora: () => `${stars(24, 60)}<span class="rib r1"></span><span class="rib r2"></span><span class="rib r3"></span>`,
  space: () => `${stars(30)}<svg class="planet" viewBox="0 0 80 60" aria-hidden="true"><ellipse cx="40" cy="30" rx="36" ry="9" fill="none" stroke="#f5c98a" stroke-width="3" opacity=".7" transform="rotate(-18 40 30)"/><circle cx="40" cy="30" r="18" fill="#ff9d5c"/><path d="M24 24 q16 -6 32 2 M23 33 q17 6 34 -1" stroke="#ffc08a" stroke-width="3" fill="none" opacity=".7"/><path d="M12 36 q28 14 56 -14" stroke="#f5c98a" stroke-width="3" fill="none" stroke-linecap="round" transform="rotate(-18 40 30)"/></svg>
    <span class="moon2"></span><span class="shoot"></span>`,
};

// Iglú de bloques de nieve (colores por variables CSS de cada fondo).
const IGLOO = `<svg class="igloo" viewBox="0 0 120 82" aria-hidden="true">
  <defs><clipPath id="igc"><path d="M8 76 C8 30 34 6 60 6 C86 6 112 30 112 76 Z"/></clipPath></defs>
  <path d="M8 76 C8 30 34 6 60 6 C86 6 112 30 112 76 Z" fill="var(--ig-a)"/>
  <g clip-path="url(#igc)">
    <path d="M70 0 H120 V80 H84 C100 50 90 20 70 0z" fill="var(--ig-b)" opacity=".7"/>
    <g stroke="var(--ig-l)" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M0 62 H120 M0 48 H120 M0 34 H120 M0 20 H120"/>
      <path d="M28 62 V76 M60 62 V76 M92 62 V76 M44 48 V62 M76 48 V62 M108 48 V62 M14 48 V62 M28 34 V48 M60 34 V48 M92 34 V48 M44 20 V34 M76 20 V34 M60 6 V20"/>
    </g>
  </g>
  <path d="M8 76 C8 30 34 6 60 6 C86 6 112 30 112 76" fill="none" stroke="var(--ig-l)" stroke-width="2"/>
  <path d="M34 78 V62 C34 50 44 44 60 44 C76 44 86 50 86 62 V78 Z" fill="var(--ig-a)" stroke="var(--ig-l)" stroke-width="2"/>
  <path d="M43 78 V64 C43 56 50 52 60 52 C70 52 77 56 77 64 V78 Z" fill="var(--ig-door)"/>
  <ellipse cx="60" cy="74" rx="11" ry="3.5" fill="var(--ig-glow)" opacity=".85"/>
</svg>`;

export function scene({ bg = null, night = false, duo = '', top = '', cls = '' } = {}) {
  const key = bg ? bg.split(':')[1] : night ? 'night' : 'day';
  const bgCls = bg ? 'bg-' + key : night ? 'night' : '';
  const dec = (DECOR[key] || DECOR.day)();
  return `<section class="hero ${cls} ${bgCls}">
    <div class="sky" aria-hidden="true">${dec}<span class="sea"></span></div>
    ${top}
    <div class="floe">${IGLOO}<div class="duo">${duo}</div><div class="ice"></div></div>
  </section>`;
}

// Muestra pequeña de un fondo para la tienda (miniatura de 64x64).
export function bgSwatch(bg) {
  const k = bg.split(':')[1];
  return `<span class="bg-swatch bg-${k}"><i class="sw-sea"></i><i class="sw-ice"></i><i class="sw-a"></i><i class="sw-b"></i></span>`;
}
