self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    }),
  )
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'NOTIFY') return

  event.waitUntil(
    self.registration.showNotification(data.title || 'MyTaskFlow', {
      body: data.body || '',
      icon: '/mytaskflow-icon.svg',
      badge: '/mytaskflow-icon.svg',
      tag: data.tag || 'mytaskflow',
      renotify: true,
    }),
  )
})
