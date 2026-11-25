# Nuestro Iglú

App web privada de pareja: pregunta del día, diario de emociones, actividad y "Esto o aquello". Pingüinos propios en SVG.

## Probar en el PC
```
python -m http.server 8765 --directory .
```
Abrir http://localhost:8765 (los módulos JS no funcionan abriendo el archivo con doble clic).

## Estado
- v1 (hecho): todo funciona en un dispositivo, datos en localStorage. Botón "Eres …" para cambiar de persona (modo prueba).
- v2 (pendiente): sincronizar con Supabase y alojar en GitHub Pages.

## Plan de alojamiento (v2)
1. Repo privado en GitHub `nuestro-iglu` + GitHub Pages → URL tipo `https://<usuario>.github.io/nuestro-iglu/`.
   (Pages en repo privado requiere GitHub Pro; alternativa gratis: repo público, los datos NO están en el repo, están en Supabase.)
2. Supabase: proyecto gratis, tablas `answers`, `moods`, `games` con `couple_id`, `who`, `date`, datos JSON.
   Acceso con inicio de sesión por enlace al email (magic link) + políticas RLS para que solo vosotros dos leáis la pareja.
3. Cambiar solo `js/store.js` para usar Supabase. Las pantallas no cambian.
4. En el móvil: abrir la URL → "Añadir a pantalla de inicio".

Archivos: `index.html`, `styles.css`, `js/app.js` (pantallas), `js/store.js` (datos), `js/penguins.js` (dibujos), `js/content.js` (preguntas).
