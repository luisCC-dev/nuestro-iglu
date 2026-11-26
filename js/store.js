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
const empty = () => ({ names: null, answers: {}, moods: {}, games: {}, hugs: {}, likely: {}, words: {}, wordplays: {}, styles: { a: {}, b: {} }, bg: null, owned: { a: [], b: [] } });
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
    if (!CLOUD) { const d = loadLocal(); d.wallet = coinsEarned(d, this.getMe()) - spentLocal(d, this.getMe()); return d; }
    const [{ data: ms }, { data: es }, { data: c }, { data: ps }, { data: w }] = await Promise.all([
      sb.from('members').select('slot, name, style').eq('couple_id', member.couple_id),
      sb.from('entries').select('kind, day, slot, data, updated_at').eq('couple_id', member.couple_id),
      sb.from('couples').select('code, bg').eq('id', member.couple_id).maybeSingle(),
      sb.from('purchases').select('slot, item').eq('couple_id', member.couple_id),
      sb.rpc('my_wallet'),
    ]);
    const out = empty();
    out.names = { a: null, b: null };
    for (const m of ms || []) { out.names[m.slot] = m.name; out.styles[m.slot] = m.style || {}; }
    for (const p of ps || []) out.owned[p.slot].push(p.item);
    out.code = c?.code;
    out.bg = c?.bg || null;
    out.wallet = w ? w.earned - w.spent : 0;
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
  // ---- avisos push (solo cloud) ----
  async fn(body) {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/push`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `push ${r.status}`);
    return j;
  },
  async pushKey() { return (await this.fn({ mode: 'key' })).publicKey; },
  async savePush(row) {
    const { data: { session } } = await sb.auth.getSession();
    const { error } = await sb.from('push_subs').upsert({ ...row, user_id: session.user.id, couple_id: member.couple_id, slot: member.slot });
    if (error) throw error;
  },
  async getPush(endpoint) { const { data } = await sb.from('push_subs').select('remind_hour').eq('endpoint', endpoint).maybeSingle(); return data; },
  async deletePush(endpoint) { await sb.from('push_subs').delete().eq('endpoint', endpoint); },
  async testPush(endpoint) { return this.fn({ mode: 'test', endpoint }); },
  // ---- tienda ----
  async buy(item, price) {
    if (CLOUD) { const { error } = await sb.rpc('buy_item', { p_item: item }); if (error) throw error; return; }
    const d = loadLocal(), me = this.getMe();
    if (d.owned[me].includes(item)) throw new Error('already owned');
    if (coinsEarned(d, me) - spentLocal(d, me) < price) throw new Error('not enough coins');
    d.owned[me].push(item); (d.spent ||= { a: 0, b: 0 })[me] = (d.spent[me] || 0) + price;
    localStorage.setItem(KEY, JSON.stringify(d));
  },
  async equip(cat, item) {
    if (CLOUD) { const { error } = await sb.rpc('equip_item', { p_cat: cat, p_item: item }); if (error) throw error; return; }
    const d = loadLocal(), me = this.getMe();
    if (cat === 'bg') d.bg = item;
    else if (item) d.styles[me] = { ...d.styles[me], [cat]: item };
    else { const st = { ...d.styles[me] }; delete st[cat]; d.styles[me] = st; }
    localStorage.setItem(KEY, JSON.stringify(d));
  },
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter: `couple_id=eq.${member.couple_id}` }, cb)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${member.couple_id}` }, cb)
      .subscribe();
  },
};

// ---- Monedas (mismas reglas que coins_earned en la BD) ----
export function coinsEarned(d, slot) {
  let n = 0;
  for (const [day, e] of Object.entries(d.answers || {})) if (e[slot]) n += 10 + (e[slot === 'a' ? 'b' : 'a'] ? 5 : 0);
  for (const e of Object.values(d.moods || {})) if (e[slot]) n += 5;
  for (const e of Object.values(d.games || {})) if (e[slot]) n += 10;
  for (const e of Object.values(d.likely || {})) if (e[slot]) n += 10;
  for (const e of Object.values(d.words || {})) if (e[slot]) n += 5;
  for (const e of Object.values(d.wordplays || {})) { const r = e[slot]?.result; n += r === 'win' ? 10 : r === 'lose' ? 3 : 0; }
  for (const e of Object.values(d.hugs || {})) if (e[slot]) n += Math.min((e[slot].items || []).length, 3);
  return n;
}
const spentLocal = (d, slot) => d.spent?.[slot] || 0;

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
