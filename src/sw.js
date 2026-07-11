/* eslint-env serviceworker */
// Custom service worker (injectManifest strategy). Compiled by Vite/esbuild.
// Provides: precaching of the app shell + runtime caching so the last-fetched
// weather / plan stays viewable offline during a monsoon power/network cut.

const PRECACHE = 'monsoonmitra-precache-v1';
const WEATHER_CACHE = 'open-meteo-cache';
const TILE_CACHE = 'osm-tiles';

// Vite PWA injects the precache manifest here at build time.
const manifest = self.__WB_MANIFEST || [];
const PRECACHE_URLS = manifest.map((entry) => (typeof entry === 'string' ? entry : entry.url));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![PRECACHE, WEATHER_CACHE, TILE_CACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** NetworkFirst: prefer fresh data, fall back to cache when offline. */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('offline and not cached');
  }
}

/** CacheFirst: serve cached, otherwise fetch and store (for static tiles). */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.status === 200) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Live weather / geocoding — NetworkFirst so offline shows last plan.
  if (url.hostname.endsWith('open-meteo.com')) {
    event.respondWith(networkFirst(request, WEATHER_CACHE));
    return;
  }
  // Map tiles — CacheFirst.
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(request, TILE_CACHE));
    return;
  }
  // App-shell navigations — serve cached index when offline (SPA fallback).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(PRECACHE);
        return (await cache.match('/index.html')) || (await cache.match('/'));
      })
    );
  }
});
