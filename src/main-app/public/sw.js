// VERSION and PRECACHE are written by the post-build step (config/vite.core.js); registered in production builds only
const VERSION = 'dev'
const PRECACHE = []
const CACHE = `wna-shell-${VERSION}`

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith('wna-shell-') && key !== CACHE)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    )
})

// One pending share at a time (a new share replaces it); read and deleted by the app (scripts/core/pendingShare.js)
function savePendingShare(record) {
    return new Promise((resolve, reject) => {
        const open = indexedDB.open('wna_share', 1)
        open.onupgradeneeded = () => open.result.createObjectStore('pending')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
            const tx = open.result.transaction('pending', 'readwrite')
            tx.objectStore('pending').put(record, 'current')
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
            tx.onabort = () => reject(tx.error)
        }
    })
}

// A share that can't be stored still opens /share, which says it didn't come through
async function receiveShare(req) {
    try {
        const form = await req.formData()
        const field = name => (typeof form.get(name) === 'string' ? form.get(name) : '')
        await savePendingShare({
            received_at: new Date().toISOString(),
            title: field('title'),
            text: field('text'),
            url: field('url'),
            files: form.getAll('files')
                .filter(f => f instanceof File)
                .map(f => ({ name: f.name, type: f.type, size: f.size, blob: f })),
        })
    } catch { /* nothing stored */ }
    return Response.redirect('/share', 303)
}

// Same-origin GET only, plus the share-target POST; API calls are never intercepted
self.addEventListener('fetch', (event) => {
    const req = event.request
    const url = new URL(req.url)
    if (url.origin !== self.location.origin) return
    if (req.method === 'POST' && url.pathname === '/share-target') {
        event.respondWith(receiveShare(req))
        return
    }
    if (req.method !== 'GET') return

    if (req.mode === 'navigate') {
        event.respondWith(fetch(req).catch(() => caches.match('/index.html', { cacheName: CACHE })))
    } else if (url.pathname.startsWith('/assets/')) {
        event.respondWith(caches.match(req, { cacheName: CACHE }).then(hit => hit || fetch(req)))
    } else if (url.pathname === '/config.js') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok) {
                        const copy = res.clone()
                        event.waitUntil(caches.open(CACHE).then(cache => cache.put('/config.js', copy)))
                    }
                    return res
                })
                .catch(() => caches.match('/config.js', { cacheName: CACHE }))
        )
    } else if (PRECACHE.includes(url.pathname)) {
        // Icons and favicon are requested with a ?v=N cache-buster; offline they match the precached copy without it
        event.respondWith(fetch(req).catch(() => caches.match(url.pathname, { cacheName: CACHE, ignoreSearch: true })))
    }
})

// Web Push: the payload carries the finished copy and the route; the worker composes nothing and calls no API
self.addEventListener('push', (event) => {
    let msg = {}
    try { msg = event.data ? event.data.json() : {} } catch { /* unreadable payload: generic notification */ }
    event.waitUntil(self.registration.showNotification(msg.title || 'WhatsNextAction', {
        body: msg.body || '',
        icon: '/icon-192.png',
        tag: msg.tag || undefined,
        data: { url: msg.url || '/', notification_id: msg.notification_id || null },
    }))
})

// Opens the place the bell row opens; ?notif= lets the app mark that bell row read
self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const { url, notification_id: id } = event.notification.data || {}
    const target = new URL(url || '/', self.location.origin)
    if (target.origin !== self.location.origin) target.href = new URL('/', self.location.origin).href
    if (id) target.searchParams.set('notif', id)

    event.waitUntil((async () => {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        const open = windows.find(c => new URL(c.url).origin === self.location.origin)
        if (open) {
            await open.focus()
            // navigate() works only on a window this worker controls
            if (await open.navigate(target.href).catch(() => null)) return
        }
        await self.clients.openWindow(target.href)
    })())
})
