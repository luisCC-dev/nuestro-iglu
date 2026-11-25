# Nuestro Iglú — diseño (v1)

App web privada para una pareja (Luis y su pareja). Original: mascotas pingüino propias, no copia de ninguna app existente.

## Por qué
Tener un ritual diario juntos: una pregunta al día, ver cómo se siente el otro y jugar a conocerse.

## Objetivos v1
- Pregunta diaria: la respuesta del otro queda oculta hasta que respondéis los dos.
- Diario de emociones: emoción del día + nota, calendario mensual de los dos.
- Actividad: racha de días, totales, últimos 14 días, emociones de la semana.
- Juego "Esto o aquello": 5 parejas al día; eliges y adivinas lo del otro.

## No objetivos (v1)
Cuentas, notificaciones, tiendas de apps, fotos subidas, chat.

## Enfoques
- A) Supabase directo. B) Prototipo local primero y luego Supabase (ELEGIDO). C) Servidor propio (descartado: coste y mantenimiento).

## Cómo
- HTML + CSS + JS sin herramientas de compilación. Se abre en el móvil y se añade a la pantalla de inicio (manifest).
- `js/store.js` es la única capa de datos, con funciones async. v1: localStorage + selector "¿quién eres?" para probar con un solo dispositivo. v2: misma API sobre Supabase.
- Pingüinos dibujados en SVG por código (`js/penguins.js`), con 7 expresiones.

## Siguiente (v2)
Supabase (tabla por tipo de entrada + código de pareja), alojamiento gratis en GitHub Pages.
