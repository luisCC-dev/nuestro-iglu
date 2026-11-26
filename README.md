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
- Hecho v3: modo demo (botón "Ver la demo sin cuenta", datos de ejemplo, sessionStorage), mimos (kind hug, animación al recibir), eliminar iglú (rpc delete_my_couple), portada con saludo. Migración: supabase/002_mimos_y_borrar.sql (ya ejecutada).
- Hecho v4: menú de juegos (#juego/esto, #juego/quien, #juego/palabra). "¿Quién es más probable?" (kind likely, oculto hasta jugar los dos). "Palabra secreta" (kind word + wordplay, 6 fallos, el hielo se derrite). Migración supabase/003_juegos.sql (ya ejecutada).
- Hecho v5: avisos push. sw.js + Ajustes > Avisos (hora del recordatorio, prueba, desactivar). Edge Function `push` (supabase/functions/push, Verify JWT OFF, claves VAPID autogeneradas en push_config). Trigger entries_notify (pg_net) + cron iglu-daily cada hora. SQL 004 y 005 ya ejecutados. iPhone: requiere app en pantalla de inicio (iOS 16.4+).
- Hecho v6: monedas + tienda. Monedas calculadas en BD (coins_earned, my_wallet); compras con buy_item, equipar con equip_item (members.style, couples.bg compartido). Catálogo en js/content.js SHOP = precios de shop_price en 006_tienda.sql (mantener iguales). Dibujos en js/penguins.js. SQL 006 ya ejecutado.
- Hecho v7: cofre diario (kind gift, gift_amount en BD) y logros con premio (achievement_bonus, ACHIEVEMENTS en content.js). Escena separada en js/scene.js + css/scene.css (iglú, fondos con decorado, borde de luz en pingüinos; hecho por agente Sonnet). Iglú en Diario refleja la emoción al elegirla. SQL 007 ya ejecutado.
- Ideas: ver propuestas en el chat.

Archivos: `index.html`, `styles.css`, `js/app.js` (pantallas), `js/store.js` (datos), `js/config.js`, `js/penguins.js` (dibujos), `js/content.js` (preguntas), `supabase/schema.sql`.
