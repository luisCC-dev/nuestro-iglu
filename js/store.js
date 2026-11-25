// Única capa de datos. Dos modos con la misma API:
//  - cloud: Supabase (cada uno en su móvil, con cuenta)
//  - local: localStorage (modo prueba en un solo dispositivo)
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const CLOUD = !!SUPABASE_KEY;
const SECTION = { answer: 'answers', mood: 'moods', game: 'games' };
let sb = null;
let member = null; // { slot, couple_id, name } en modo cloud

// ---------- modo local ----------
const KEY = 'iglu-data-v1', ME_KEY = 'iglu-me';
const empty = () => ({ names: null, answers: {}, moods: {}, games: {} });
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

  // Devuelve 'ready' | 'signed-out' | 'no-couple'
  async init() {
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
