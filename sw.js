// Service worker: recibe los avisos push y abre la app al tocarlos.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: 'Nuestro Iglú', body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Nuestro Iglú', {
    body: d.body || '',
    icon: 'icon.svg',
    badge: 'icon.svg',
    tag: d.tag,
    data: { url: d.url || self.registration.scope },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || self.registration.scope;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.startsWith(self.registration.scope)) { await c.focus(); return; } }
    await self.clients.openWindow(url);
  })());
});
