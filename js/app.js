import { store, dateKey, addDays, dayNumber } from './store.js';
import { penguin, MOODS, moodById } from './penguins.js';
import { QUESTIONS, THIS_OR_THAT, ROUND_SIZE, HUGS } from './content.js';

const root = document.getElementById('app');
const TABS = [
  { id: 'hoy', label: 'Hoy', ico: '☀️' },
  { id: 'diario', label: 'Diario', ico: '📔' },
  { id: 'juego', label: 'Juego', ico: '🎲' },
  { id: 'nosotros', label: 'Nosotros', ico: '💞' },
];

const ui = {
  data: null,
  me: store.getMe(),
  calMonth: null, // 'YYYY-MM'
  calSel: null,
  game: null, // { step, phase: 'pick'|'guess', picks: [], guesses: [] }
  editMood: false,
  draftMood: null,
};

// ---------- utilidades ----------
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const other = (w) => (w === 'a' ? 'b' : 'a');
const name = (w) => esc(ui.data.names?.[w] || (w === 'a' ? 'Tú' : 'Tu pareja'));
const today = () => dateKey();
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const fmtDate = (key, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', opts);
};
const questionFor = (key) => QUESTIONS[((dayNumber(key) % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length];

function roundFor(key) {
  // Barajado fijo según el día: los dos ven las mismas parejas.
  let seed = dayNumber(key) * 9301 + 49297;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const idx = THIS_OR_THAT.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, ROUND_SIZE).map((i) => THIS_OR_THAT[i]);
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

function activeOn(key, who) {
  const d = ui.data;
  return !!(d.answers[key]?.[who] || d.moods[key]?.[who] || d.games[key]?.[who]);
}

function streak() {
  const both = (k) => ui.data.answers[k]?.a && ui.data.answers[k]?.b;
  let k = today();
  if (!both(k)) k = addDays(k, -1);
  let n = 0;
  while (both(k)) { n++; k = addDays(k, -1); }
  return n;
}

function gameScore(g, who) {
  // Aciertos de "who" adivinando lo del otro.
  const mine = g?.[who], theirs = g?.[other(who)];
  if (!mine || !theirs) return null;
  return mine.guesses.filter((x, i) => x === theirs.picks[i]).length;
}

// ---------- piezas comunes ----------
function header() {
  const me = ui.me;
  return `<header class="top">
    <div class="couple">
      <div class="avatars">${penguin('a', null, 40)}${penguin('b', null, 40)}</div>
      <span>${name('a')} & ${name('b')}</span>
    </div>
    <div class="row" style="gap:6px">${store.demo ? '<button class="chip demo" data-action="exit-demo" aria-label="Salir de la demo">Demo ✕</button>' : ''}
    ${store.cloud ? '' : `<button class="chip" data-action="switch-me" title="Modo prueba: cambia quién usa este móvil">
      <small>Eres</small> ${name(me)} ⇄
    </button>`}</div>
  </header>`;
}

function intro() {
  return `<h1 class="page">Nuestro Iglú</h1>
    <p class="lead">Un rincón para los dos: una pregunta al día, cómo os sentís y juegos.</p>
    <div class="pair">${penguin('a', 'feliz', 120, 'bob')}${penguin('b', 'amor', 120, 'bob')}</div>`;
}

function viewAuth() {
  const signup = ui.authMode === 'signup';
  return `<section class="setup">${intro()}
    <form class="card" data-form="auth">
      <h2>${signup ? 'Crear cuenta' : 'Entrar'}</h2>
      <div class="field"><label for="em">Email</label><input id="em" name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label for="pw">Contraseña</label><input id="pw" name="password" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}"></div>
      <button class="btn" type="submit">${signup ? 'Crear cuenta' : 'Entrar'}</button>
      <button class="btn secondary" type="button" data-action="auth-toggle">${signup ? 'Ya tengo cuenta' : 'Soy nuevo: crear cuenta'}</button>
    </form>
    <button class="btn ghost" data-action="demo">👀 Ver la demo sin cuenta</button>
  </section>`;
}

function viewCouple() {
  return `<section class="setup">${intro()}
    <form class="card" data-form="create">
      <h2>Crear nuestro iglú</h2>
      <p class="hint mt0">Para el primero de los dos. Te daremos un código para tu pareja.</p>
      <div class="field"><label for="cn">Tu nombre</label><input id="cn" name="name" required maxlength="20" autocomplete="given-name"></div>
      <button class="btn" type="submit">Crear y ver el código</button>
    </form>
    <form class="card" data-form="join">
      <h2>Tengo un código</h2>
      <div class="field"><label for="jc">Código de tu pareja</label><input id="jc" name="code" required maxlength="6" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em"></div>
      <div class="field"><label for="jn">Tu nombre</label><input id="jn" name="name" required maxlength="20" autocomplete="given-name"></div>
      <button class="btn" type="submit">Unirme</button>
    </form>
    <button class="btn secondary" data-action="signout">Salir</button>
  </section>`;
}

function codeCard() {
  if (!store.cloud || ui.data.full) return '';
  return `<article class="card center">
    <div class="label">Invita a tu pareja</div>
    <p class="question" style="letter-spacing:.25em;margin:4px 0">${esc(ui.data.code || '')}</p>
    <p class="hint mt0">Que abra la app, cree su cuenta y escriba este código en “Tengo un código”.</p>
  </article>`;
}

function tabs(view) {
  return `<nav class="tabs" aria-label="Secciones">${TABS.map((t) =>
    `<a class="tab" href="#${t.id}" ${t.id === view ? 'aria-current="page"' : ''}><span class="ico">${t.ico}</span>${t.label}</a>`).join('')}</nav>`;
}

// ---------- pantallas ----------
function viewSetup() {
  return `<section class="setup">
    <h1 class="page">Nuestro Iglú</h1>
    <p class="lead">Un rincón para los dos: una pregunta al día, cómo os sentís y juegos.</p>
    <div class="pair">${penguin('a', 'feliz', 120, 'bob')}${penguin('b', 'amor', 120, 'bob')}</div>
    <form class="card" data-form="setup">
      <div class="field"><label for="na">Tu nombre (pingüino de la bufanda)</label><input id="na" name="a" required maxlength="20" autocomplete="off"></div>
      <div class="field"><label for="nb">Nombre de tu pareja (pingüino del lazo)</label><input id="nb" name="b" required maxlength="20" autocomplete="off"></div>
      <button class="btn" type="submit">Entrar al iglú</button>
    </form>
  </section>`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

function hero() {
  const k = today(), m = ui.data.moods[k] || {}, s = streak();
  const hr = new Date().getHours(), night = hr >= 21 || hr < 6;
  return `<section class="hero ${night ? 'night' : ''}">
    <div class="hero-text">
      <p class="hello">${greeting()}, ${name(ui.me)}</p>
      <p class="date">${cap(fmtDate(k))}</p>
      <span class="streak-chip">🔥 ${s} ${s === 1 ? 'día' : 'días'} de racha</span>
    </div>
    <div class="floe">
      <div class="duo">${penguin('a', m.a?.mood || 'feliz', 84, 'bob')}${penguin('b', m.b?.mood || 'amor', 84, 'bob delay')}</div>
      <div class="ice"></div>
    </div>
  </section>`;
}

const hugById = (id) => HUGS.find((h) => h[0] === id) || HUGS[0];
function hugItems(who, days = 3) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const k = addDays(today(), -i);
    for (const it of ui.data.hugs?.[k]?.[who]?.items || []) out.push({ ...it, day: k });
  }
  return out.sort((x, y) => y.at - x.at);
}

function hugsCard() {
  const me = ui.me, ot = other(me);
  const got = hugItems(ot).slice(0, 4);
  const sentToday = (ui.data.hugs?.[today()]?.[me]?.items || []).length;
  return `<article class="card">
    <div class="row space"><h2 class="mt0">Mandar un mimo</h2><span class="hint" style="margin:0">${sentToday ? `Hoy: ${sentToday} enviados` : ''}</span></div>
    <div class="hugs" role="group" aria-label="Elige un mimo">${HUGS.map(([id, e, label]) =>
      `<button class="hug ${ui.hugPick === id ? 'on' : ''}" data-action="hug-pick" data-hug="${id}" aria-pressed="${ui.hugPick === id}"><span class="emoji">${e}</span>${label}</button>`).join('')}</div>
    ${ui.hugPick ? `<form data-form="hug" class="hug-form">
      <input name="msg" maxlength="80" placeholder="Añade un mensaje (opcional)" aria-label="Mensaje del mimo" autocomplete="off">
      <button class="btn" type="submit">Enviar ${hugById(ui.hugPick)[2].toLowerCase()} a ${name(ot)}</button>
    </form>` : ''}
    ${got.length ? `<div class="got"><div class="label" style="margin-top:14px">Recibidos de ${name(ot)}</div>${got.map((h) => {
      const [, e, label] = hugById(h.type);
      return `<div class="got-row"><span class="emoji">${e}</span><div><b>${label}</b>${h.msg ? `<p>${esc(h.msg)}</p>` : ''}</div><small>${timeAgo(h.at)}</small></div>`;
    }).join('')}</div>` : ''}
  </article>`;
}

function timeAgo(at) {
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

// Animación cuando llega un mimo nuevo
function checkNewHug() {
  const ot = other(ui.me), newest = hugItems(ot, 2)[0];
  const key = `iglu-hug-seen-${store.demo ? 'demo-' : ''}${ui.me}`;
  const seen = Number(localStorage.getItem(key) || 0);
  if (!newest || newest.at <= seen) return;
  localStorage.setItem(key, String(newest.at));
  showHug(ot, newest);
}

function showHug(from, h) {
  const [id, e, , phrase] = hugById(h.type);
  const el = document.createElement('div');
  el.className = 'hug-overlay';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', `${name(from)} ${phrase}`);
  el.innerHTML = `<div class="hug-pop">
    <div class="scene hug-${id}">
      <span class="pa">${penguin('a', 'amor', 104)}</span>
      <span class="pb">${penguin('b', 'amor', 104)}</span>
      <span class="fx">${e}</span><span class="fx f2">${e}</span><span class="fx f3">💗</span>
    </div>
    <h2>${name(from)} ${phrase}</h2>
    ${h.msg ? `<p class="hug-msg">“${esc(h.msg)}”</p>` : ''}
    <button class="btn" data-close="back">Devolver el mimo 💗</button>
    <button class="btn secondary" data-close="ok">Cerrar</button>
  </div>`;
  el.addEventListener('click', (ev) => {
    const c = ev.target.closest('[data-close]');
    if (c?.dataset.close === 'back') { ui.hugPick = h.type; location.hash = 'hoy'; el.remove(); render(); return; }
    if (c || ev.target === el) el.remove();
  });
  document.body.appendChild(el);
}

function viewToday() {
  const k = today(), me = ui.me, ot = other(me);
  const a = ui.data.answers[k] || {};
  const mine = a[me], theirs = a[ot];
  let body;
  if (!mine) {
    body = `<form data-form="answer">
      <textarea name="text" required maxlength="600" placeholder="Escribe tu respuesta…" aria-label="Tu respuesta"></textarea>
      <button class="btn" type="submit">Responder</button>
      <p class="hint">🔒 ${name(ot)} no verá tu respuesta hasta que conteste, y tú tampoco la suya.</p>
    </form>`;
  } else if (!theirs) {
    body = `<div class="answer">${penguin(me, null, 44)}<div class="bubble"><b>Tu respuesta</b><p>${esc(mine.text)}</p></div></div>
      <div class="locked">${penguin(ot, 'cansado', 56)}<p>${name(ot)} todavía no ha respondido. Su respuesta aparecerá aquí cuando conteste.</p></div>`;
  } else {
    body = [me, ot].map((w) => `<div class="answer">${penguin(w, 'feliz', 44)}<div class="bubble"><b>${w === me ? 'Tú' : name(w)}</b><p>${esc(a[w].text)}</p></div></div>`).join('');
  }

  const m = ui.data.moods[k] || {};
  const moodLine = [me, ot].map((w) => {
    const md = m[w] && moodById(m[w].mood);
    return `<div class="mood-box">${penguin(w, md?.id, 56).replace('class="penguin', 'style="margin:0 auto" class="penguin')}
      <b>${w === me ? 'Tú' : name(w)}</b><small>${md ? md.label : 'Sin apuntar'}</small></div>`;
  }).join('');

  const past = [];
  for (let i = 1; i <= 30 && past.length < 7; i++) {
    const pk = addDays(k, -i), pa = ui.data.answers[pk];
    if (pa?.a && pa?.b) past.push(`<details><summary>${esc(questionFor(pk))}<small>${fmtDate(pk, { day: 'numeric', month: 'long' })}</small></summary>
      ${['a', 'b'].map((w) => `<div class="answer">${penguin(w, null, 34)}<div class="bubble"><b>${name(w)}</b><p>${esc(pa[w].text)}</p></div></div>`).join('')}</details>`);
  }

  return `${codeCard()}${hero()}
    <article class="card">
      <div class="label">Pregunta del día</div>
      <p class="question">${esc(questionFor(k))}</p>
      ${body}
    </article>
    ${hugsCard()}
    <article class="card">
      <div class="row space"><h2 class="mt0">¿Cómo estáis hoy?</h2><a class="btn small secondary" href="#diario">${m[me] ? 'Ver diario' : 'Apuntar'}</a></div>
      <div class="today-moods" style="margin-top:10px">${moodLine}</div>
    </article>
    ${past.length ? `<article class="card history"><h2>Preguntas anteriores</h2>${past.join('')}</article>` : ''}`;
}

function viewDiary() {
  const k = today(), me = ui.me, ot = other(me);
  const m = ui.data.moods[k] || {};
  const mine = m[me];
  const editing = !mine || ui.editMood;
  const sel = ui.draftMood ?? mine?.mood ?? null;

  const mineHtml = editing
    ? `<form data-form="mood">
        <div class="moods" role="group" aria-label="Elige tu emoción">${MOODS.map((md) =>
          `<button type="button" class="mood" data-action="pick-mood" data-mood="${md.id}" aria-pressed="${sel === md.id}" style="${sel === md.id ? `background:${md.color}` : ''}">
            ${penguin(me, md.id, 54)}${md.label}</button>`).join('')}</div>
        <textarea name="note" maxlength="800" placeholder="¿Qué tal tu día? (opcional)" aria-label="Nota del día" style="margin-top:12px">${esc(mine?.note || '')}</textarea>
        <button class="btn" type="submit" ${sel ? '' : 'disabled'}>Guardar mi día</button>
      </form>`
    : `<div class="mood-box" style="background:${moodById(mine.mood)?.color}">
        ${penguin(me, mine.mood, 80).replace('class="penguin', 'style="margin:0 auto" class="penguin')}
        <b>${moodById(mine.mood)?.label}</b>${mine.note ? `<p>${esc(mine.note)}</p>` : ''}</div>
      <button class="btn secondary" data-action="edit-mood">Cambiar</button>`;

  const theirs = m[ot];
  const theirsHtml = theirs
    ? `<div class="mood-box" style="background:${moodById(theirs.mood)?.color}">
        ${penguin(ot, theirs.mood, 80).replace('class="penguin', 'style="margin:0 auto" class="penguin')}
        <b>${moodById(theirs.mood)?.label}</b>${theirs.note ? `<p>${esc(theirs.note)}</p>` : ''}</div>`
    : `<div class="locked">${penguin(ot, null, 48)}<p>${name(ot)} aún no ha escrito su día.</p></div>`;

  return `<h1 class="page">Nuestro diario</h1>
    <p class="lead">Cómo os habéis sentido cada día.</p>
    <article class="card"><h2>Tu día · ${fmtDate(k, { day: 'numeric', month: 'long' })}</h2>${mineHtml}</article>
    <article class="card"><h2>El día de ${name(ot)}</h2>${theirsHtml}</article>
    ${calendar()}`;
}

function calendar() {
  const t = today();
  const month = ui.calMonth || t.slice(0, 7);
  const [y, mo] = month.split('-').map(Number);
  const first = new Date(y, mo - 1, 1);
  const days = new Date(y, mo, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // lunes primero
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push('<span class="day empty"></span>');
  for (let d = 1; d <= days; d++) {
    const k = `${month}-${String(d).padStart(2, '0')}`;
    const m = ui.data.moods[k] || {};
    const dot = (w) => `<i class="dot" style="${m[w] ? `background:${moodById(m[w].mood)?.color};box-shadow:inset 0 0 0 1.5px ${w === 'a' ? '#2f4a6d' : '#ff9ec0'}` : ''}"></i>`;
    const cls = ['day', k === t && 'today', k === ui.calSel && 'sel', k > t && 'future'].filter(Boolean).join(' ');
    cells.push(`<button class="${cls}" data-action="cal-day" data-day="${k}" ${k > t ? 'disabled' : ''} aria-label="${fmtDate(k)}">${d}<span class="dots">${dot('a')}${dot('b')}</span></button>`);
  }
  let detail = '';
  if (ui.calSel) {
    const m = ui.data.moods[ui.calSel] || {};
    detail = `<div style="margin-top:14px"><div class="label">${fmtDate(ui.calSel)}</div><div class="today-moods">${['a', 'b'].map((w) => {
      const md = m[w] && moodById(m[w].mood);
      return `<div class="mood-box" style="${md ? `background:${md.color}` : ''}">${penguin(w, md?.id, 48).replace('class="penguin', 'style="margin:0 auto" class="penguin')}
        <b>${name(w)}</b><small>${md ? md.label : 'Sin apuntar'}</small>${m[w]?.note ? `<p>${esc(m[w].note)}</p>` : ''}</div>`;
    }).join('')}</div></div>`;
  }
  const raw = first.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return `<article class="card">
    <div class="cal-head">
      <button class="icon-btn" data-action="cal-prev" aria-label="Mes anterior">‹</button>
      <h2>${label}</h2>
      <button class="icon-btn" data-action="cal-next" aria-label="Mes siguiente" ${month >= t.slice(0, 7) ? 'disabled' : ''}>›</button>
    </div>
    <div class="cal">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => `<span class="dow">${d}</span>`).join('')}${cells.join('')}</div>
    <p class="hint">Punto izquierdo: ${name('a')} · derecho: ${name('b')}</p>
    ${detail}
  </article>`;
}

function viewGame() {
  const k = today(), me = ui.me, ot = other(me);
  const round = roundFor(k);
  const g = ui.data.games[k] || {};
  let body;

  if (!g[me]) {
    const s = ui.game || (ui.game = { step: 0, phase: 'pick', picks: [], guesses: [] });
    const pair = round[s.step];
    const dots = round.map((_, i) => `<span class="${i < s.step || (i === s.step && s.phase === 'guess') ? 'on' : ''}"></span>`).join('');
    const ask = s.phase === 'pick' ? '¿Qué prefieres tú?' : `¿Qué crees que eligió ${name(ot)}?`;
    body = `<article class="card">
      <div class="progress" aria-label="Pregunta ${s.step + 1} de ${round.length}">${dots}</div>
      <div class="row" style="justify-content:center;margin-bottom:12px">${penguin(s.phase === 'pick' ? me : ot, s.phase === 'pick' ? null : 'emocionado', 52)}<p class="question mt0" style="margin:0;font-size:20px">${ask}</p></div>
      <div class="choices">${pair.map(([e, t], i) =>
        `<button class="choice" data-action="choose" data-i="${i}"><span class="emoji">${e}</span>${esc(t)}</button>`).join('')}</div>
      <p class="hint center">${s.step + 1} de ${round.length}</p>
    </article>`;
  } else if (!g[ot]) {
    body = `<article class="card center">
      ${penguin(ot, 'cansado', 96).replace('class="penguin', 'style="margin:0 auto" class="penguin')}
      <h2>¡Ya has jugado!</h2>
      <p class="hint">Cuando ${name(ot)} termine su ronda veréis quién conoce mejor a quién.</p>
    </article>`;
  } else {
    const sm = gameScore(g, me), so = gameScore(g, ot);
    const rows = round.map((pair, i) => {
      const pm = pair[g[me].picks[i]], po = pair[g[ot].picks[i]];
      const okMe = g[me].guesses[i] === g[ot].picks[i];
      const okOt = g[ot].guesses[i] === g[me].picks[i];
      return `<div class="result-row">
        <div class="who">${pm[0]} ${esc(pm[1])}<br><span class="tag ${okOt ? 'ok' : 'no'}">${name(ot)} ${okOt ? 'acertó' : 'falló'}</span></div>
        <div class="mid">${pair[0][0]} o ${pair[1][0]}</div>
        <div class="who" style="text-align:right">${po[0]} ${esc(po[1])}<br><span class="tag ${okMe ? 'ok' : 'no'}">Tú ${okMe ? 'acertaste' : 'fallaste'}</span></div>
      </div>`;
    }).join('');
    body = `<article class="card">
      <div class="score">
        <div>${penguin(me, sm >= so ? 'feliz' : 'tranquilo', 64).replace('class="penguin', 'style="margin:0 auto" class="penguin')}<strong>${sm}/${round.length}</strong><span class="hint">Tú</span></div>
        <div>${penguin(ot, so >= sm ? 'feliz' : 'tranquilo', 64).replace('class="penguin', 'style="margin:0 auto" class="penguin')}<strong>${so}/${round.length}</strong><span class="hint">${name(ot)}</span></div>
      </div>
      <div class="row space" style="margin-top:12px;font-size:13px;color:var(--muted);font-weight:800"><span>Tú elegiste</span><span>${name(ot)} eligió</span></div>
      ${rows}
      <p class="hint center">Mañana hay una ronda nueva.</p>
    </article>`;
  }

  return `<h1 class="page">Esto o aquello</h1>
    <p class="lead">Elige lo tuyo y adivina lo de ${name(ot)}. ¿Quién conoce mejor a quién?</p>
    ${body}`;
}

function viewUs() {
  const d = ui.data, t = today();
  const s = streak();
  const together = Object.values(d.answers).filter((x) => x.a && x.b).length;
  const games = Object.values(d.games).filter((x) => x.a && x.b);
  const pct = (w) => {
    if (!games.length) return '–';
    const hits = games.reduce((n, g) => n + gameScore(g, w), 0);
    return Math.round((hits / (games.length * ROUND_SIZE)) * 100) + '%';
  };
  const days14 = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const active30 = (w) => Array.from({ length: 30 }, (_, i) => addDays(t, -i)).filter((k) => activeOn(k, w)).length;
  const weekMoods = (w) => {
    const counts = {};
    for (let i = 0; i < 7; i++) { const m = d.moods[addDays(t, -i)]?.[w]; if (m) counts[m.mood] = (counts[m.mood] || 0) + 1; }
    const list = Object.entries(counts).sort((x, y) => y[1] - x[1]);
    return list.length
      ? list.map(([id, n]) => `<span class="mood-pill" style="background:${moodById(id)?.color}">${moodById(id)?.label} ×${n}</span>`).join('')
      : '<span class="hint" style="margin:0">Sin apuntes esta semana</span>';
  };

  return `<h1 class="page">Nosotros</h1>
    <p class="lead">Lo activos que estáis y cómo os sentís.</p>
    <article class="card">
      <div class="streak">${penguin('a', s ? 'feliz' : null, 64)}<div><span class="num">${s}</span><div class="label" style="margin:0">${s === 1 ? 'día' : 'días'} de racha</div></div>${penguin('b', s ? 'amor' : null, 64)}</div>
      <p class="hint center">La racha sube cada día que respondéis los dos la pregunta.</p>
    </article>
    <article class="card">
      <h2>En números</h2>
      <div class="stats">
        <div class="stat"><strong>${together}</strong><span>preguntas juntos</span></div>
        <div class="stat"><strong>${pct('a')}</strong><span>aciertos ${name('a')}</span></div>
        <div class="stat"><strong>${pct('b')}</strong><span>aciertos ${name('b')}</span></div>
      </div>
    </article>
    <article class="card">
      <h2>Actividad · últimos 14 días</h2>
      ${['a', 'b'].map((w) => `<div class="act-row"><span>${name(w)}</span><div class="act-dots ${w}">${days14.map((k) =>
        `<i class="${activeOn(k, w) ? 'on' : ''}" title="${fmtDate(k, { day: 'numeric', month: 'short' })}"></i>`).join('')}</div></div>`).join('')}
      <p class="hint">Activos en los últimos 30 días: ${name('a')} ${active30('a')} · ${name('b')} ${active30('b')}</p>
    </article>
    <article class="card">
      <h2>Emociones de la semana</h2>
      ${['a', 'b'].map((w) => `<div style="margin:10px 0"><div class="row" style="margin-bottom:6px">${penguin(w, null, 30)}<b>${name(w)}</b></div><div class="mood-bars">${weekMoods(w)}</div></div>`).join('')}
    </article>
    <article class="card">
      <h2>Ajustes</h2>
      ${store.cloud
        ? `<p class="hint mt0">Vuestros datos se guardan en vuestra base de datos privada y solo los veis vosotros dos.</p>
           <button class="btn secondary" data-action="signout">Cerrar sesión</button>
           <button class="btn danger" data-action="delete-iglu">Eliminar nuestro iglú</button>
           <p class="hint">Borra el iglú con las respuestas, el diario, las partidas y los mimos de los dos. Vuestras cuentas siguen existiendo y podéis crear otro iglú.</p>`
        : store.demo
          ? `<p class="hint mt0">Estás viendo la demo con datos de ejemplo. Usa “Eres …” arriba para ver la app como la otra persona.</p>
             <button class="btn secondary" data-action="exit-demo">Salir de la demo</button>`
          : `<p class="hint mt0">Modo prueba: los datos se guardan solo en este dispositivo. Usa el botón “Eres …” de arriba para cambiar de persona.</p>
             <button class="btn secondary" data-action="reset">Borrar todo y empezar de nuevo</button>`}
    </article>`;
}

// ---------- render ----------
const ERRORS = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Primero confirma tu email: mira tu correo.',
  'User already registered': 'Ese email ya tiene cuenta. Pulsa “Ya tengo cuenta”.',
  'bad code': 'Ese código no existe. Revísalo.',
  'couple full': 'Ese iglú ya tiene a sus dos pingüinos.',
  'already in a couple': 'Ya estás en un iglú.',
  'rate limit': 'Demasiados intentos seguidos. Espera unos minutos.',
};
const errText = (err) => {
  const m = err?.message || String(err);
  const k = Object.keys(ERRORS).find((x) => m.includes(x));
  return k ? ERRORS[k] : 'Algo falló: ' + m;
};

let subscribed = false;
async function render() {
  if (!ui.status) ui.status = await store.init();
  if (ui.status === 'signed-out') { root.innerHTML = viewAuth(); return; }
  if (ui.status === 'no-couple') { root.innerHTML = viewCouple(); return; }
  ui.me = store.getMe();
  ui.data = await store.getAll();
  if (!ui.data.names) { root.innerHTML = viewSetup(); return; }
  if (store.cloud && !subscribed) { subscribed = true; store.onRemoteChange(() => { if (!document.activeElement?.matches('textarea, input')) render(); }); }
  const view = (location.hash.slice(1) || 'hoy');
  const views = { hoy: viewToday, diario: viewDiary, juego: viewGame, nosotros: viewUs };
  const fn = views[view] || viewToday;
  root.innerHTML = header() + `<main>${fn()}</main>` + tabs(views[view] ? view : 'hoy');
  if (!document.querySelector('.hug-overlay')) checkNewHug();
}

// ---------- eventos ----------
root.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target, kind = f.dataset.form, fd = new FormData(f);
  const btn = f.querySelector('button[type=submit]');
  if (btn) btn.disabled = true;
  try {
    if (kind === 'setup') {
      await store.setNames(fd.get('a').trim(), fd.get('b').trim());
      store.setMe('a'); ui.me = 'a';
    } else if (kind === 'auth') {
      const email = fd.get('email').trim(), pw = fd.get('password');
      if (ui.authMode === 'signup') {
        const ok = await store.signUp(email, pw);
        if (!ok) { toast('Te hemos enviado un email: confírmalo y luego entra.'); ui.authMode = 'signin'; }
      } else await store.signIn(email, pw);
      ui.status = null;
    } else if (kind === 'create') {
      await store.createCouple(fd.get('name').trim());
      ui.status = null;
    } else if (kind === 'join') {
      await store.joinCouple(fd.get('code').trim(), fd.get('name').trim());
      ui.status = null;
      toast('¡Ya estáis los dos en el iglú! 🐧🐧');
    } else if (kind === 'hug') {
      const k = today(), list = [...(ui.data.hugs?.[k]?.[ui.me]?.items || [])];
      const type = ui.hugPick;
      list.push({ type, msg: fd.get('msg').trim(), at: Date.now() });
      await store.saveHugs(k, ui.me, list.slice(-30));
      ui.hugPick = null;
      toast(`${hugById(type)[1]} Enviado a ${name(other(ui.me))}`);
    } else if (kind === 'answer') {
      const text = fd.get('text').trim();
      if (!text) return;
      await store.saveAnswer(today(), ui.me, text);
      toast('Respuesta guardada 🐧');
    } else if (kind === 'mood') {
      const mood = ui.draftMood ?? ui.data.moods[today()]?.[ui.me]?.mood;
      if (!mood) return;
      await store.saveMood(today(), ui.me, mood, fd.get('note').trim());
      ui.editMood = false; ui.draftMood = null;
      toast('Día guardado');
    }
  } catch (err) {
    toast(errText(err));
    if (btn) btn.disabled = false;
    return;
  }
  render();
});

root.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a === 'switch-me') {
    ui.me = other(ui.me); store.setMe(ui.me);
    ui.game = null; ui.editMood = false; ui.draftMood = null;
    await render();
    toast(`Ahora eres ${name(ui.me)} (modo prueba)`);
    return;
  }
  if (a === 'demo') { store.enterDemo(); return; }
  if (a === 'exit-demo') { store.exitDemo(); return; }
  if (a === 'hug-pick') ui.hugPick = ui.hugPick === el.dataset.hug ? null : el.dataset.hug;
  if (a === 'delete-iglu') {
    if (!confirm('¿Eliminar vuestro iglú? Se borrará TODO: respuestas, diario, partidas y mimos de los dos.')) return;
    if (!confirm('Última confirmación: esto no se puede deshacer. ¿Eliminar?')) return;
    try { await store.deleteCouple(); ui.status = null; location.hash = ''; toast('Iglú eliminado'); }
    catch (err) { toast(errText(err)); return; }
  }
  if (a === 'auth-toggle') ui.authMode = ui.authMode === 'signup' ? 'signin' : 'signup';
  if (a === 'signout') { await store.signOut(); ui.status = null; location.hash = ''; }
  if (a === 'pick-mood') {
    ui.draftMood = el.dataset.mood;
    const note = root.querySelector('textarea[name="note"]')?.value;
    await render();
    if (note != null) root.querySelector('textarea[name="note"]').value = note;
    return;
  }
  if (a === 'edit-mood') { ui.editMood = true; ui.draftMood = null; }
  if (a === 'cal-day') ui.calSel = ui.calSel === el.dataset.day ? null : el.dataset.day;
  if (a === 'cal-prev' || a === 'cal-next') {
    const cur = ui.calMonth || today().slice(0, 7);
    const [y, m] = cur.split('-').map(Number);
    const dt = new Date(y, m - 1 + (a === 'cal-next' ? 1 : -1), 1);
    ui.calMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }
  if (a === 'choose') {
    const s = ui.game, i = Number(el.dataset.i);
    if (s.phase === 'pick') { s.picks[s.step] = i; s.phase = 'guess'; }
    else {
      s.guesses[s.step] = i; s.step++; s.phase = 'pick';
      if (s.step >= ROUND_SIZE) {
        try { await store.saveGame(today(), ui.me, s.picks, s.guesses); ui.game = null; toast('¡Ronda terminada!'); }
        catch (err) { s.step--; s.phase = 'guess'; toast(errText(err)); }
      }
    }
  }
  if (a === 'reset') {
    if (!confirm('¿Seguro? Se borrarán todas las respuestas, el diario y las partidas de este dispositivo.')) return;
    await store.reset(); ui.me = 'a'; ui.game = null;
  }
  render();
});

window.addEventListener('hashchange', () => { ui.editMood = false; ui.draftMood = null; render(); window.scrollTo(0, 0); });
// Al volver a la app (por ejemplo, tras días en segundo plano) refrescar el día y los datos.
document.addEventListener('visibilitychange', () => { if (!document.hidden && ui.data) render(); });
render();
