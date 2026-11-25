// Única capa de datos. Dos modos con la misma API:
//  - cloud: Supabase (cada uno en su móvil, con cuenta)
//  - local: localStorage (modo prueba en un solo dispositivo)
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Modo demo: datos de ejemplo en este dispositivo, sin cuenta (?demo o botón "Ver demo").
const DEMO = sessionStorage.getItem('iglu-demo') === '1';
const CLOUD = !!SUPABASE_KEY && !DEMO;
const SECTION = { answer: 'answers', mood: 'moods', game: 'games', hug: 'hugs', likely: 'likely', word: 'words', wordplay: 'wordplays' };
let sb = null;
let member = null; // { slot, couple_id, name } en modo cloud

// ---------- modo local ----------
const KEY = DEMO ? 'iglu-demo-v1' : 'iglu-data-v1', ME_KEY = DEMO ? 'iglu-demo-me' : 'iglu-me';
const empty = () => ({ names: null, answers: {}, moods: {}, games: {}, hugs: {}, likely: {}, words: {}, wordplays: {} });
function loadLocal() { try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return empty(); } }
function putLocal(kind, date, who, value) {
  const d = loadLocal(), s = SECTION[kind];
  d[s][date] = { ...(d[s][date] || {}), [who]: { ...value, at: Date.now() } };
  localStorage.setItem(KEY, JSON.stringify(d));
}

// ---------- modo cloud ----------
async function putCloud(kind, date, value) {
  const { error } = await sb.from('entries').upsert({
    couple_id: member.couple_id, kind, day: date, slot: member.slot, data: value, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export const store = {
  cloud: CLOUD,
  demo: DEMO,
  canCloud: !!SUPABASE_KEY,
  enterDemo() { sessionStorage.setItem('iglu-demo', '1'); location.reload(); },
  exitDemo() { sessionStorage.removeItem('iglu-demo'); localStorage.removeItem('iglu-demo-v1'); location.hash = ''; location.reload(); },

  // Devuelve 'ready' | 'signed-out' | 'no-couple'
  async init() {
    if (DEMO && !localStorage.getItem(KEY)) seedDemo();
    if (!CLOUD) return 'ready';
    if (!sb) {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true } });
    }
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return 'signed-out';
    const { data } = await sb.from('members').select('slot, couple_id, name').eq('user_id', session.user.id).maybeSingle();
    member = data;
    return member ? 'ready' : 'no-couple';
  },

  async getAll() {
    if (!CLOUD) return loadLocal();
    const [{ data: ms }, { data: es }, { data: c }] = await Promise.all([
      sb.from('members').select('slot, name').eq('couple_id', member.couple_id),
      sb.from('entries').select('kind, day, slot, data, updated_at').eq('couple_id', member.couple_id),
      sb.from('couples').select('code').eq('id', member.couple_id).maybeSingle(),
    ]);
    const out = empty();
    out.names = { a: null, b: null };
    for (const m of ms || []) out.names[m.slot] = m.name;
    out.code = c?.code;
    out.full = !!(out.names.a && out.names.b);
    for (const e of es || []) {
      const s = out[SECTION[e.kind]];
      (s[e.day] ||= {})[e.slot] = { ...e.data, at: Date.parse(e.updated_at) };
    }
    return out;
  },

  async setNames(a, b) { const d = loadLocal(); d.names = { a, b }; localStorage.setItem(KEY, JSON.stringify(d)); },
  async saveAnswer(date, who, text) { CLOUD ? await putCloud('answer', date, { text }) : putLocal('answer', date, who, { text }); },
  async saveMood(date, who, mood, note) { CLOUD ? await putCloud('mood', date, { mood, note }) : putLocal('mood', date, who, { mood, note }); },
  async save(kind, date, who, data) { CLOUD ? await putCloud(kind, date, data) : putLocal(kind, date, who, data); },
  async saveHugs(date, who, items) { CLOUD ? await putCloud('hug', date, { items }) : putLocal('hug', date, who, { items }); },
  async saveGame(date, who, picks, guesses) { CLOUD ? await putCloud('game', date, { picks, guesses }) : putLocal('game', date, who, { picks, guesses }); },
  async reset() { localStorage.removeItem(KEY); localStorage.removeItem(ME_KEY); },

  getMe() { return CLOUD ? member?.slot || 'a' : localStorage.getItem(ME_KEY) || 'a'; },
  setMe(who) { if (!CLOUD) localStorage.setItem(ME_KEY, who); },

  // ---- cuentas y pareja (solo cloud) ----
  async signUp(email, password) {
    const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error;
    return !!data.session; // false = hay que confirmar el email
  },
  async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
  async signOut() { await sb.auth.signOut(); member = null; },
  async createCouple(name) { const { data, error } = await sb.rpc('create_couple', { p_name: name }); if (error) throw error; return data; },
  async deleteCouple() {
    if (!CLOUD) { localStorage.removeItem(KEY); localStorage.removeItem(ME_KEY); return; }
    const { error } = await sb.rpc('delete_my_couple'); if (error) throw error; member = null;
  },
  async joinCouple(code, name) { const { error } = await sb.rpc('join_couple', { p_code: code, p_name: name }); if (error) throw error; },

  // Avisa cuando la pareja guarda algo
  onRemoteChange(cb) {
    if (!CLOUD || !member) return;
    sb.channel('entries-' + member.couple_id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries', filter: `couple_id=eq.${member.couple_id}` }, cb)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'members', filter: `couple_id=eq.${member.couple_id}` }, cb)
      .subscribe();
  },
};

// ---- Datos de ejemplo para el modo demo ----
function seedDemo() {
  const d = empty(), t = dateKey();
  d.names = { a: 'Luis', b: 'Ana' };
  const moods = ['feliz', 'amor', 'tranquilo', 'emocionado', 'cansado', 'feliz', 'triste', 'amor', 'feliz', 'tranquilo'];
  const textsA = ['Una cabaña en la nieve con chocolate', 'Un pingüino, obviamente', 'Cuando te ríes con la nariz', 'Ir a Japón contigo', 'Pizza fría del día anterior'];
  const textsB = ['Una casa con jardín y un gato', 'Una nutria', 'Cómo me tapas con la manta', 'Islandia a ver auroras', 'Tortitas los domingos'];
  for (let i = 1; i <= 9; i++) {
    const k = addDays(t, -i), at = Date.now() - i * 86400000;
    d.moods[k] = { a: { mood: moods[i % 10], note: '', at }, b: { mood: moods[(i + 3) % 10], note: '', at } };
    if (i <= 6) d.answers[k] = { a: { text: textsA[i % 5], at }, b: { text: textsB[i % 5], at } };
  }
  d.answers[t] = { b: { text: 'Que me hagas reír aunque esté cansada', at: Date.now() } };
  d.moods[t] = { b: { mood: 'amor', note: 'Día largo, pero con ganas de verte.', at: Date.now() } };
  d.hugs[t] = { b: { items: [{ type: 'abrazo', msg: '¡Buenos días, pingüino!', at: Date.now() - 3600000 }], at: Date.now() } };
  d.likely[t] = { b: { picks: ['a', 'b', 'a', 'a', 'b'], at: Date.now() } };
  d.words[t] = { b: { word: 'CHOCOLATE', clue: 'Lo que siempre me robas', at: Date.now() } };
  localStorage.setItem(KEY, JSON.stringify(d));
  localStorage.setItem(ME_KEY, 'a');
}

// ---- Fechas (siempre hora local) ----
export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + n));
}
export function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
