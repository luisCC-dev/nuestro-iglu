// Contenido: preguntas diarias y parejas de "Esto o aquello".
export const QUESTIONS = [
  '¿Qué es lo primero que pensaste de mí cuando nos conocimos?',
  'Si fueras un animal en tu próxima vida, ¿cuál serías?',
  '¿Qué pequeño detalle mío te hace sonreír sin que yo lo sepa?',
  '¿Cuál es tu recuerdo favorito de nosotros este año?',
  'Si mañana tuviéramos un día libre sin planes, ¿qué haríamos?',
  '¿Qué canción te recuerda a mí?',
  '¿Qué comida podrías comer todos los días sin cansarte?',
  '¿A qué lugar del mundo te gustaría ir conmigo primero?',
  '¿Qué es algo que te gustaría aprender juntos?',
  '¿Cuál fue el mejor regalo que has recibido nunca?',
  '¿Qué te hace sentir más querido o querida?',
  '¿Qué serie o película veríamos en bucle?',
  'Si pudiéramos tener una mascota más, ¿cuál sería y cómo se llamaría?',
  '¿Qué es lo más gracioso que nos ha pasado juntos?',
  '¿Qué tradición te gustaría que tuviéramos?',
  '¿Cómo sería nuestra casa ideal?',
  '¿Qué superpoder elegirías y para qué lo usarías?',
  '¿Qué es algo que te da miedo y nunca me has contado?',
  '¿Cuál es tu forma favorita de pasar un domingo?',
  '¿Qué te gustaría que hiciéramos más a menudo?',
  '¿Qué olor te transporta a tu infancia?',
  '¿Qué tres palabras me describen mejor?',
  'Si escribieran un libro sobre nosotros, ¿cómo se llamaría?',
  '¿Qué es lo que más te gusta de cómo nos cuidamos?',
  '¿Cuál sería nuestra cita perfecta con menos de 10 euros?',
  '¿Qué sueño tienes para dentro de cinco años?',
  '¿Qué hábito mío te gustaría copiar?',
  '¿Qué momento del día prefieres pasar conmigo?',
  '¿Qué plato te gustaría que cocináramos juntos?',
  '¿Qué es lo más bonito que alguien ha hecho por ti?',
  'Si pudieras revivir un día de nuestra relación, ¿cuál sería?',
  '¿Qué te relaja cuando tienes un mal día?',
  '¿Qué aventura loca te gustaría vivir conmigo?',
  '¿Qué te hace reír siempre, aunque estés de mal humor?',
  '¿Qué apodo cariñoso nuevo me pondrías?',
  '¿Qué cosa sencilla te hace feliz?',
  '¿Qué meta tienes este mes?',
  '¿Qué es lo que más echas de menos cuando no estamos juntos?',
  '¿Qué juego de mesa o videojuego jugaríamos toda una noche?',
  '¿Qué te gustaría decirme hoy que normalmente no dices?',
];

// Cada pareja: [emoji, texto] x 2
export const THIS_OR_THAT = [
  [['🍕', 'Pizza'], ['🍝', 'Pasta']],
  [['🌅', 'Madrugar'], ['🌙', 'Trasnochar']],
  [['🏖️', 'Playa'], ['🏔️', 'Montaña']],
  [['🐶', 'Perro'], ['🐱', 'Gato']],
  [['☕', 'Café'], ['🍵', 'Té']],
  [['🎬', 'Cine'], ['🛋️', 'Peli en casa']],
  [['🍫', 'Chocolate'], ['🍓', 'Fruta']],
  [['📱', 'Mensajes'], ['📞', 'Llamadas']],
  [['🌞', 'Verano'], ['❄️', 'Invierno']],
  [['🍔', 'Hamburguesa'], ['🌮', 'Tacos']],
  [['📚', 'Libro'], ['🎮', 'Videojuego']],
  [['🎉', 'Fiesta'], ['🕯️', 'Plan tranquilo']],
  [['🍦', 'Helado'], ['🥐', 'Bollería']],
  [['🚗', 'Viaje en coche'], ['✈️', 'Viaje en avión']],
  [['🎤', 'Karaoke'], ['💃', 'Bailar']],
  [['🍿', 'Palomitas dulces'], ['🧂', 'Palomitas saladas']],
  [['🌧️', 'Día de lluvia'], ['☀️', 'Día de sol']],
  [['🏙️', 'Ciudad'], ['🌲', 'Campo']],
  [['🍳', 'Desayuno salado'], ['🥞', 'Desayuno dulce']],
  [['🎁', 'Regalo sorpresa'], ['📝', 'Regalo que pedí']],
  [['🧦', 'Calcetines en la cama'], ['🦶', 'Sin calcetines']],
  [['🍣', 'Sushi'], ['🥘', 'Paella']],
  [['🎢', 'Montaña rusa'], ['🎡', 'Noria']],
  [['🛁', 'Baño'], ['🚿', 'Ducha']],
  [['🗺️', 'Planear todo'], ['🎲', 'Improvisar']],
];

export const ROUND_SIZE = 5;

// Mimos: [id, emoji, texto, frase para quien lo recibe]
export const HUGS = [
  ['abrazo', '🤗', 'Abrazo', 'te manda un abrazo'],
  ['beso', '😘', 'Beso', 'te manda un beso'],
  ['choca', '🙌', 'Choca esa', 'quiere chocar esa aleta'],
  ['pienso', '💭', 'Pienso en ti', 'está pensando en ti'],
  ['extraño', '🥺', 'Te echo de menos', 'te echa de menos'],
  ['siesta', '😴', 'Siesta juntos', 'quiere una siesta contigo'],
  ['baile', '💃', 'Bailamos', 'te saca a bailar'],
  ['cosquillas', '😆', 'Cosquillas', 'te hace cosquillas'],
];

// "¿Quién es más probable…?" — cada uno responde "yo" o "mi pareja"
export const LIKELY = [
  'quedarse dormido viendo una peli',
  'perderse aunque lleve el GPS',
  'comerse el último trozo sin preguntar',
  'llorar con un anuncio',
  'llegar tarde a una cita',
  'adoptar un animal sin avisar',
  'hablar con las plantas',
  'ganar en un juego de mesa',
  'olvidar dónde dejó las llaves',
  'empezar una pelea de cosquillas',
  'cantar en la ducha a todo volumen',
  'planear un viaje sorpresa',
  'reírse en un momento serio',
  'comprar algo que no necesita',
  'saludar a todos los perros de la calle',
  'quemar la cena',
  'mandar un audio de cinco minutos',
  'pedir perdón primero',
  'ver una serie entera en un fin de semana',
  'hacer amigos en la cola del súper',
  'despertarse de mal humor',
  'guardar los tickets "por si acaso"',
  'acordarse de un aniversario',
  'tener miedo en una peli de terror',
  'robar la manta por la noche',
  'apuntarse al gimnasio y no ir',
  'bailar en la cocina',
  'decir "cinco minutos más" por la mañana',
  'hacer una foto a la comida',
  'proponer un plan improvisado a las 11 de la noche',
];
export const LIKELY_SIZE = 5;

// Tienda. Precios iguales que supabase/006_tienda.sql (shop_price).
export const SHOP_CATS = [
  ['hat', 'Gorros', '🎩'],
  ['acc', 'Complementos', '🕶️'],
  ['color', 'Colores', '🎨'],
  ['bg', 'Fondos', '🏔️'],
];
export const SHOP = [
  { id: 'hat:flower', name: 'Flor', price: 25 },
  { id: 'hat:beanie', name: 'Gorro de lana', price: 30 },
  { id: 'hat:party', name: 'Gorro de fiesta', price: 40 },
  { id: 'hat:headphones', name: 'Cascos', price: 60 },
  { id: 'hat:tophat', name: 'Chistera', price: 80 },
  { id: 'hat:crown', name: 'Corona', price: 120 },
  { id: 'acc:bowtie', name: 'Pajarita', price: 30 },
  { id: 'acc:glasses', name: 'Gafas redondas', price: 35 },
  { id: 'acc:necklace', name: 'Collar corazón', price: 45 },
  { id: 'acc:sunglasses', name: 'Gafas de sol', price: 50 },
  { id: 'color:black', name: 'Noche', price: 40 },
  { id: 'color:sky', name: 'Cielo', price: 50 },
  { id: 'color:mint', name: 'Menta', price: 60 },
  { id: 'color:pink', name: 'Rosa', price: 60 },
  { id: 'color:gold', name: 'Dorado', price: 150 },
  { id: 'bg:snow', name: 'Nevada', price: 60 },
  { id: 'bg:sunset', name: 'Atardecer', price: 70 },
  { id: 'bg:beach', name: 'Playa', price: 80 },
  { id: 'bg:sakura', name: 'Cerezos', price: 90 },
  { id: 'bg:aurora', name: 'Aurora boreal', price: 100 },
  { id: 'bg:space', name: 'Espacio', price: 150 },
];
export const itemById = (id) => SHOP.find((i) => i.id === id);

// Cómo se ganan monedas (igual que coins_earned en la BD)
export const EARN = [
  ['Responder la pregunta del día', '+10'],
  ['Si respondéis los dos ese día', '+5'],
  ['Escribir tu día en el diario', '+5'],
  ['Jugar a Esto o aquello / ¿Quién es más probable?', '+10'],
  ['Poner una palabra secreta', '+5'],
  ['Adivinar una palabra (perder da +3)', '+10'],
  ['Mandar mimos (máx. 3 al día)', '+1'],
  ['Abrir el cofre del día', '+3 a +10'],
  ['Pescar en el hielo (5 cañas al día)', '+2 a +15'],
  ['Conseguir logros (en Nosotros)', 'hasta +100'],
];

// Logros: premio en monedas al llegar a la meta. Igual que achievement_bonus en 007_cofre_logros.sql.
export const ACHIEVEMENTS = [
  { id: 'primer', emoji: '🐣', name: 'Primer paso', desc: 'Responde tu primera pregunta', metric: 'answers', goal: 1, reward: 5 },
  { id: 'semana', emoji: '📅', name: 'Una semana hablando', desc: 'Responde 7 preguntas', metric: 'answers', goal: 7, reward: 20 },
  { id: 'mes', emoji: '🗓️', name: 'Un mes de preguntas', desc: 'Responde 30 preguntas', metric: 'answers', goal: 30, reward: 60 },
  { id: 'diario', emoji: '📔', name: 'Querido diario', desc: 'Escribe tu día 7 veces', metric: 'moods', goal: 7, reward: 20 },
  { id: 'jugon', emoji: '🎲', name: 'Pingüino jugón', desc: 'Juega 10 partidas', metric: 'games', goal: 10, reward: 30 },
  { id: 'mimoso', emoji: '🤗', name: 'Mimoso', desc: 'Manda 20 mimos', metric: 'hugs', goal: 20, reward: 20 },
  { id: 'detective', emoji: '🕵️', name: 'Detective', desc: 'Adivina 5 palabras secretas', metric: 'wins', goal: 5, reward: 30 },
  { id: 'racha7', emoji: '🔥', name: 'Racha de 7', desc: '7 días seguidos respondiendo los dos', metric: 'streak', goal: 7, reward: 40 },
  { id: 'racha30', emoji: '💎', name: 'Racha de 30', desc: '30 días seguidos respondiendo los dos', metric: 'streak', goal: 30, reward: 100 },
  { id: 'coleccion', emoji: '🛍️', name: 'Coleccionista', desc: 'Compra 5 objetos en la tienda', metric: 'buys', goal: 5, reward: 25 },
  { id: 'pescador', emoji: '🎣', name: 'Pescador', desc: 'Pesca 25 peces', metric: 'fish', goal: 25, reward: 30 },
];

// Retos semanales (mismo orden y metas que challenge_goal en 008_nivel_retos.sql)
export const CHALLENGES = [
  { metric: 'both_answers', goal: 5, emoji: '💬', text: 'Responded los dos la pregunta 5 días' },
  { metric: 'moods_both', goal: 4, emoji: '📔', text: 'Escribid los dos vuestro día 4 días' },
  { metric: 'hugs', goal: 10, emoji: '🤗', text: 'Mandaos 10 mimos entre los dos' },
  { metric: 'games', goal: 6, emoji: '🎲', text: 'Jugad 6 partidas entre los dos' },
  { metric: 'words', goal: 2, emoji: '🧊', text: 'Adivinad 2 palabras secretas' },
  { metric: 'gifts', goal: 8, emoji: '🎁', text: 'Abrid 8 cofres entre los dos' },
  { metric: 'answers', goal: 10, emoji: '✍️', text: 'Sumad 10 respuestas entre los dos' },
];
export const CHALLENGE_REWARD = 20; // monedas para cada uno (y +30 puntos de iglú)

// Niveles del iglú: puntos necesarios y lo que se desbloquea en la escena
export const LEVELS = [
  { xp: 0, name: 'Iglú recién hecho', unlock: '' },
  { xp: 100, name: 'Iglú con chimenea', unlock: 'Chimenea con humo' },
  { xp: 250, name: 'Iglú con bandera', unlock: 'Bandera en lo alto' },
  { xp: 450, name: 'Iglú de fiesta', unlock: 'Guirnalda de luces' },
  { xp: 700, name: 'Iglú con amigo', unlock: 'Muñeco de nieve' },
  { xp: 1000, name: 'Iglú acogedor', unlock: 'Farolillo junto a la puerta' },
  { xp: 1400, name: 'Iglú pescador', unlock: 'Agujero de pesca con pez' },
  { xp: 1900, name: 'Iglú con ventana', unlock: 'Ventana iluminada' },
  { xp: 2500, name: 'Iglú enamorado', unlock: 'Corazón de hielo' },
  { xp: 3200, name: 'Iglú legendario', unlock: 'Estrella dorada' },
];
export function levelOf(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  return { level: i + 1, ...LEVELS[i], next: LEVELS[i + 1] || null };
}
// Lunes de la semana (hora local) y número de semana como en la BD
export function mondayOf(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d), dow = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dow);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
export function weekChallenges(monday) {
  const w = Math.floor((Date.parse(monday + 'T00:00:00Z') - Date.parse('2024-01-01T00:00:00Z')) / 86400000 / 7);
  return [0, 1, 2].map((i) => ({ idx: i, ...CHALLENGES[(w * 3 + i) % CHALLENGES.length] }));
}

// Pesca: especies por tirada (0..99), igual que fish_value en 009_pesca.sql
export const FISH = [
  { id: 'sardina', name: 'Sardina', emoji: '🐟', max: 45, value: 2, zone: 0.30, speed: 1.0 },
  { id: 'gamba', name: 'Gamba', emoji: '🦐', max: 70, value: 3, zone: 0.26, speed: 1.15 },
  { id: 'calamar', name: 'Calamar', emoji: '🦑', max: 85, value: 4, zone: 0.22, speed: 1.3 },
  { id: 'colores', name: 'Pez de colores', emoji: '🐠', max: 94, value: 6, zone: 0.17, speed: 1.5 },
  { id: 'globo', name: 'Pez globo', emoji: '🐡', max: 99, value: 8, zone: 0.14, speed: 1.7 },
  { id: 'dorado', name: 'Pez dorado', emoji: '🌟', max: 100, value: 15, zone: 0.10, speed: 2.0 },
];
export const CASTS_PER_DAY = 5;
export const fishForRoll = (r) => FISH.find((f) => r < f.max);
