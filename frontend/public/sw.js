// Minimal service worker to avoid MIME type errors in dev
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// No caching or fetch handling for now; just a placeholder.
