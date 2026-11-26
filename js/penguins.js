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

// ---- Decoraciones de la tienda ----
export const BODY_COLORS = {
  'color:mint': '#4fa892', 'color:pink': '#d9799a', 'color:sky': '#5f9bd4', 'color:black': '#26262e', 'color:gold': '#c99a2e',
};
const NECK = ['acc:bowtie', 'acc:necklace'];
let STYLES = { a: {}, b: {} };
export function setStyles(s) { STYLES = { a: s?.a || {}, b: s?.b || {} }; }

function hatSvg(id) {
  switch (id) {
    case 'hat:beanie': return `<path d="M33 42 q27 -40 54 0 z" fill="#ff6f61"/><rect x="31" y="37" width="58" height="9" rx="4.5" fill="#ffd2c9"/>
      <path d="M44 30 l4 -6 M56 24 l2 -7 M68 26 l2 -6" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/><circle cx="60" cy="8" r="6.5" fill="#ffd2c9"/>`;
    case 'hat:party': return `<path d="M45 34 L60 2 L75 34 z" fill="#ffd166"/><path d="M50 24 l18 -6 M48 30 l22 -8 M54 14 l10 -4" stroke="#ff7aa8" stroke-width="3" stroke-linecap="round"/>
      <circle cx="60" cy="3" r="5" fill="#5ec2ff"/>`;
    case 'hat:flower': return `<g transform="translate(80 30)">${[0, 72, 144, 216, 288].map((a) =>
      `<ellipse rx="6" ry="9" transform="rotate(${a}) translate(0 -8)" fill="#ffb3cf"/>`).join('')}<circle r="5.5" fill="#ffd166"/></g>`;
    case 'hat:tophat': return `<ellipse cx="60" cy="33" rx="30" ry="6" fill="#26262e"/><rect x="42" y="4" width="36" height="29" rx="4" fill="#26262e"/>
      <rect x="42" y="24" width="36" height="6" fill="#ff6f61"/>`;
    case 'hat:headphones': return `<path d="M24 62 Q24 20 60 20 Q96 20 96 62" stroke="#3b3f58" stroke-width="7" fill="none"/>
      <rect x="15" y="52" width="14" height="24" rx="7" fill="#ff7a59"/><rect x="91" y="52" width="14" height="24" rx="7" fill="#ff7a59"/>`;
    case 'hat:crown': return `<path d="M38 36 L40 12 L50 24 L60 6 L70 24 L80 12 L82 36 z" fill="#ffcf40" stroke="#e0a800" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="60" cy="27" r="3.5" fill="#ff5b84"/><circle cx="47" cy="30" r="2.5" fill="#5ec2ff"/><circle cx="73" cy="30" r="2.5" fill="#5ec2ff"/>`;
    default: return '';
  }
}

function accSvg(id) {
  switch (id) {
    case 'acc:sunglasses': return `<rect x="36" y="51" width="21" height="13" rx="5" fill="#1f2a3a"/><rect x="63" y="51" width="21" height="13" rx="5" fill="#1f2a3a"/>
      <path d="M57 56 h6" stroke="#1f2a3a" stroke-width="3"/><path d="M40 54 l6 0" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
    case 'acc:glasses': return `<circle cx="47" cy="58" r="9" fill="none" stroke="#8a5a2b" stroke-width="2.6"/><circle cx="73" cy="58" r="9" fill="none" stroke="#8a5a2b" stroke-width="2.6"/>
      <path d="M56 57 q4 -3 8 0" stroke="#8a5a2b" stroke-width="2.6" fill="none"/>`;
    case 'acc:bowtie': return `<path d="M60 82 l-14 -8 v16 z M60 82 l14 -8 v16 z" fill="#ff5b84"/><circle cx="60" cy="82" r="4" fill="#e0436c"/>`;
    case 'acc:necklace': return `<path d="M42 76 q18 14 36 0" stroke="#ffcf40" stroke-width="2" fill="none"/>
      <path d="M60 92 l-5 -5 a3 3 0 0 1 5 -4 a3 3 0 0 1 5 4 z" fill="#ff5b84"/>`;
    default: return '';
  }
}

function accessory(look, style = {}) {
  if (look.accessory === 'scarf' && NECK.includes(style.acc)) return '';
  if (look.accessory === 'bow' && style.hat) return '';
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
export function penguin(who, mood = null, size = 96, extraClass = '', styleOverride = null) {
  const style = styleOverride || STYLES[who] || {};
  const base = LOOKS[who] || LOOKS.a;
  const look = { ...base, body: BODY_COLORS[style.color] || base.body };
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
    ${accessory(look, style)}
    ${accSvg(style.acc)}
    ${hatSvg(style.hat)}
  </svg>`;
}
