// Lienzo de "Dibuja y adivina". Coordenadas guardadas en 0..1000 (independiente del tamaño de pantalla).
// Un trazo = { c: color, s: grosor (0..1000), p: [x0, y0, x1, y1, ...] }
const MAX_POINTS = 6000;

function fit(canvas) {
  const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.width * dpr); // cuadrado
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / 1000, 0, 0, canvas.height / 1000, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return ctx;
}

function clear(ctx) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1000, 1000); }

function segment(ctx, st, i) {
  ctx.strokeStyle = st.c; ctx.lineWidth = st.s;
  ctx.beginPath();
  if (i === 0) { ctx.moveTo(st.p[0], st.p[1]); ctx.lineTo(st.p[0] + 0.1, st.p[1]); }
  else { ctx.moveTo(st.p[i - 2], st.p[i - 1]); ctx.lineTo(st.p[i], st.p[i + 1]); }
  ctx.stroke();
}

export function drawAll(canvas, strokes = []) {
  const ctx = fit(canvas);
  clear(ctx);
  for (const st of strokes) for (let i = 0; i < st.p.length; i += 2) segment(ctx, st, i);
  return ctx;
}

export const pointCount = (strokes) => strokes.reduce((n, s) => n + s.p.length / 2, 0);

// Reproduce el dibujo trazo a trazo en ~ms milisegundos. Devuelve una función para pararlo.
export function replay(canvas, strokes = [], ms = 3500) {
  const ctx = fit(canvas);
  clear(ctx);
  const segs = [];
  strokes.forEach((st) => { for (let i = 0; i < st.p.length; i += 2) segs.push([st, i]); });
  let done = 0, t0 = null, raf;
  const step = (t) => {
    t0 ??= t;
    const want = Math.min(segs.length, Math.ceil(((t - t0) / ms) * segs.length));
    while (done < want) { const [st, i] = segs[done++]; segment(ctx, st, i); }
    if (done < segs.length) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

// Lienzo editable. pad = { strokes: [], color, size } (se muta al dibujar).
export function mountPad(canvas, pad, onChange = () => {}) {
  const ctx = drawAll(canvas, pad.strokes);
  let cur = null;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * 1000), Math.round(((e.clientY - r.top) / r.height) * 1000)];
  };
  canvas.onpointerdown = (e) => {
    if (pointCount(pad.strokes) >= MAX_POINTS) return;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* algunos navegadores no lo permiten */ }
    const [x, y] = pos(e);
    cur = { c: pad.color, s: pad.size, p: [x, y] };
    pad.strokes.push(cur);
    pad.drawing = true;
    segment(ctx, cur, 0);
  };
  canvas.onpointermove = (e) => {
    if (!cur) return;
    const [x, y] = pos(e), n = cur.p.length;
    if (Math.hypot(x - cur.p[n - 2], y - cur.p[n - 1]) < 5 || pointCount(pad.strokes) >= MAX_POINTS) return;
    cur.p.push(x, y);
    segment(ctx, cur, cur.p.length - 2);
  };
  canvas.onpointerup = canvas.onpointercancel = () => { if (cur) { cur = null; pad.drawing = false; onChange(); } };
}
