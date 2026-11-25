// Única capa de datos. v1: localStorage. v2: misma API sobre Supabase.
// Todas las funciones son async para que el cambio a Supabase no toque las pantallas.
const KEY = 'iglu-data-v1';
const ME_KEY = 'iglu-me';

const empty = () => ({ names: null, answers: {}, moods: {}, games: {} });

function load() {
  try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY)) }; }
  catch { return empty(); }
}
function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

function put(section, date, who, value) {
  const d = load();
  d[section][date] = { ...(d[section][date] || {}), [who]: { ...value, at: Date.now() } };
  save(d);
}

export const store = {
  async getAll() { return load(); },
  async setNames(a, b) { const d = load(); d.names = { a, b }; save(d); },
  async saveAnswer(date, who, text) { put('answers', date, who, { text }); },
  async saveMood(date, who, mood, note) { put('moods', date, who, { mood, note }); },
  async saveGame(date, who, picks, guesses) { put('games', date, who, { picks, guesses }); },
  async reset() { localStorage.removeItem(KEY); localStorage.removeItem(ME_KEY); },
  // Quién usa este dispositivo (en v2 vendrá del inicio de sesión).
  getMe() { return localStorage.getItem(ME_KEY) || 'a'; },
  setMe(who) { localStorage.setItem(ME_KEY, who); },
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
