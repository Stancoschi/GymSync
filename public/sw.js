// GymSync Service Worker — manual Workbox-style caching
// Compatible with Next.js 16 + Turbopack (no webpack plugins needed)

const CACHE_VERSION = "v1";
const STATIC_CACHE = `gymsync-static-${CACHE_VERSION}`;
const PAGES_CACHE = `gymsync-pages-${CACHE_VERSION}`;
const API_CACHE = `gymsync-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `gymsync-images-${CACHE_VERSION}`;

const STATIC_EXTENSIONS = /\.(?:js|css|woff2?|ttf|otf|ico|svg)$/;
const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|webp|avif|gif)$/;

// Pages to pre-cache on install
const PRECACHE_PAGES = ["/dashboard", "/feed", "/workouts", "/nutrition"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_PAGES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // Don't fail install if precache fails
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, PAGES_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !currentCaches.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ── Supabase Storage (avatars, images) → CacheFirst
  if (url.hostname.includes("supabase.co") && url.pathname.includes("/storage/")) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // ── Supabase API → NetworkFirst
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(networkFirst(request, API_CACHE, 24 * 60 * 60));
    return;
  }

  // ── Next.js static assets → CacheFirst
  if (url.pathname.startsWith("/_next/static") || STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 30 * 24 * 60 * 60));
    return;
  }

  // ── Images → CacheFirst
  if (IMAGE_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // ── App pages → NetworkFirst with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, PAGES_CACHE, 24 * 60 * 60));
    return;
  }
});

// ── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedAt = cached.headers.get("sw-cached-at");
    if (cachedAt) {
      const age = (Date.now() - parseInt(cachedAt, 10)) / 1000;
      if (age < maxAgeSeconds) return cached;
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const body = await cloned.arrayBuffer();
      cache.put(request, new Response(body, { status: cloned.status, headers }));
    }
    return response;
  } catch {
    return cached ?? new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
    ]);
    if (response.ok) {
      const cloned = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const body = await cloned.arrayBuffer();
      cache.put(request, new Response(body, { status: cloned.status, headers }));
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response("Offline", { status: 503 });
  }
}
