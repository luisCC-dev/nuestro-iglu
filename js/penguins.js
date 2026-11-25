// Pingüinos dibujados en SVG. Dos personajes: "a" (bufanda) y "b" (lazo).
export const LOOKS = {
  a: { body: '#2f4a6d', accent: '#ff7a59', accessory: 'scarf' },
  b: { body: '#4f6f8f', accent: '#ff9ec0', accessory: 'bow' },
};

export const MOODS = [
  { id: 'feliz', label: 'Feliz', color: '#ffd66b' },
  { id: 'amor', label: 'Con amor', color: '#ffb8cb' },
  { id: 'tranquilo', label: 'Tranquilo', color: '#bfe6c9' },
  { id: 'emocionado', label: 'Con ganas', color: '#ffc98f' },
  { id: 'cansado', label: 'Cansado', color: '#cfd8e3' },
  { id: 'triste', label: 'Triste', color: '#a9c9ec' },
  { id: 'enfadado', label: 'Enfadado', color: '#f4a28c' },
];

export const moodById = (id) => MOODS.find((m) => m.id === id);

const INK = '#1f2a3a';

function eyes(mood) {
  const L = 47, R = 73, Y = 58;
  const dot = (x) => `<circle cx="${x}" cy="${Y}" r="4.2" fill="${INK}"/><circle cx="${x + 1.4}" cy="${Y - 1.6}" r="1.4" fill="#fff"/>`;
  const arc = (x, up = true) =>
    `<path d="M${x - 5} ${Y + (up ? 2 : -1)} q5 ${up ? -7 : 7} 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  switch (mood) {
    case 'feliz': return arc(L) + arc(R);
    case 'tranquilo': return arc(L, false) + arc(R, false);
    case 'amor': {
      const heart = (x) => `<path d="M${x} ${Y + 5} l-5.5 -5.5 a3.2 3.2 0 0 1 5.5 -4 a3.2 3.2 0 0 1 5.5 4 z" fill="#ff5b84"/>`;
      return heart(L) + heart(R);
    }
    case 'emocionado': {
      const star = (x) => `<path d="M${x} ${Y - 6} l1.8 4 4.3 .5 -3.2 3 .9 4.3 -3.8 -2.2 -3.8 2.2 .9 -4.3 -3.2 -3 4.3 -.5z" fill="${INK}"/>`;
      return star(L) + star(R);
    }
    case 'cansado':
      return `<path d="M${L - 5} ${Y} h10 M${R - 5} ${Y} h10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <text x="88" y="38" font-size="11" font-weight="800" fill="${INK}" opacity=".55" font-family="system-ui">z</text>
        <text x="95" y="30" font-size="8" font-weight="800" fill="${INK}" opacity=".4" font-family="system-ui">z</text>`;
    case 'triste':
      return dot(L) + dot(R) +
        `<path d="M${L - 6} ${Y - 9} l9 -3 M${R + 6} ${Y - 9} l-9 -3" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
         <path d="M${L - 2} ${Y + 6} q-2.5 4 0 6 q2.5 -2 0 -6z" fill="#6fb4ff"/>`;
    case 'enfadado':
      return dot(L) + dot(R) +
        `<path d="M${L - 6} ${Y - 11} l10 4 M${R + 6} ${Y - 11} l-10 4" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`;
    default: return dot(L) + dot(R);
  }
}

function accessory(look) {
  if (look.accessory === 'scarf') {
    return `<rect x="27" y="75" width="66" height="10" rx="5" fill="${look.accent}"/>
      <path d="M74 82 q2 14 -3 20 l9 -1 q3 -10 1 -19z" fill="${look.accent}"/>
      <path d="M76 90 h6 M75 95 h6" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>`;
  }
  return `<g transform="translate(80 30) rotate(18)">
      <path d="M0 0 l-12 -8 q-3 8 0 16 z M0 0 l12 -8 q3 8 0 16 z" fill="${look.accent}"/>
      <circle r="4" fill="${look.accent}" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/></g>`;
}

// who: 'a' | 'b'; mood: id or null; size en px.
export function penguin(who, mood = null, size = 96, extraClass = '') {
  const look = LOOKS[who] || LOOKS.a;
  return `<svg class="penguin ${extraClass}" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">
    <ellipse cx="60" cy="114" rx="30" ry="4" fill="#000" opacity=".08"/>
    <ellipse cx="47" cy="110" rx="9" ry="4.5" fill="#ffa63d"/>
    <ellipse cx="73" cy="110" rx="9" ry="4.5" fill="#ffa63d"/>
    <ellipse cx="22" cy="78" rx="8" ry="18" transform="rotate(22 22 78)" fill="${look.body}"/>
    <ellipse cx="98" cy="78" rx="8" ry="18" transform="rotate(-22 98 78)" fill="${look.body}"/>
    <ellipse cx="60" cy="68" rx="38" ry="42" fill="${look.body}"/>
    <ellipse cx="60" cy="88" rx="25" ry="20" fill="#fff8ee"/>
    <ellipse cx="60" cy="61" rx="27" ry="21" fill="#fff8ee"/>
    <ellipse cx="48" cy="34" rx="9" ry="5" fill="#fff" opacity=".12"/>
    <circle cx="39" cy="68" r="5" fill="#ff8fa8" opacity=".45"/>
    <circle cx="81" cy="68" r="5" fill="#ff8fa8" opacity=".45"/>
    ${eyes(mood)}
    <path d="M54 65 q6 -3 12 0 q-6 7 -12 0z" fill="#ffa63d"/>
    ${accessory(look)}
  </svg>`;
}
