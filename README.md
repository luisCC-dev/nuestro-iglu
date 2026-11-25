# Nuestro Iglú

App web privada de pareja: pregunta del día, diario de emociones, actividad y "Esto o aquello". Pingüinos propios en SVG.

## Probar en el PC
```
python -m http.server 8765 --directory .
```
Abrir http://localhost:8765 (los módulos JS no funcionan abriendo el archivo con doble clic).

## Estado
- Publicada: https://luiscc-dev.github.io/nuestro-iglu/ (GitHub Pages, repo público luisCC-dev/nuestro-iglu).
- Datos: Supabase proyecto `xlknnmjkibvqklrvrxti`. Esquema en `supabase/schema.sql` (ya ejecutado). RLS activo en las 3 tablas.
- Cuentas: email + contraseña. Quien crea el iglú es "a" y recibe un código de 6 letras; la pareja se une con él y es "b".
- Privacidad: la respuesta del otro (pregunta y juego) solo se puede leer cuando tú ya hiciste la tuya (lo impone la base de datos, no solo la app).
- Sin clave en `js/config.js` la app vuelve al modo prueba local.
- Site URL de Supabase Auth = la URL de Pages (para el email de confirmación).

## Pendiente / ideas
- Probar con las dos cuentas reales.
- Notificación diaria, más preguntas, "enviar un abrazo".

Archivos: `index.html`, `styles.css`, `js/app.js` (pantallas), `js/store.js` (datos), `js/config.js`, `js/penguins.js` (dibujos), `js/content.js` (preguntas), `supabase/schema.sql`.
