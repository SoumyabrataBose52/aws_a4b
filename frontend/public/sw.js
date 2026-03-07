// Empty service worker - prevents 404 errors from stale registrations
// This file intentionally does nothing.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
