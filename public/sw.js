/* eslint-env serviceworker */
/* global Response, Headers, self, caches, fetch, URL */
// This tells ESLint that service worker globals are available

const CACHE_NAME = 'portfolio-cache-v1';
const OFFLINE_URL = '/offline';

// Security headers to be added to responses
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/default-fallback.svg',
  '/favicon.svg',
  '/manifest.webmanifest',
];

const CACHE_STRATEGIES = {
  images: {
    type: 'cache-first',
    maxEntries: 50,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  fonts: {
    type: 'cache-first',
    maxEntries: 10,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  static: {
    type: 'cache-first',
    maxEntries: 100,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
  },
  api: {
    type: 'network-first',
    maxEntries: 50,
    maxAgeSeconds: 24 * 60 * 60, // 1 day
  },
};

// Security and performance optimization functions
function addSecurityHeaders(response) {
  if (!(response instanceof Response)) {
    return response;
  }

  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function cacheWithLimit(cache, request, response, strategy) {
  const keys = await cache.keys();
  if (keys.length >= strategy.maxEntries) {
    // Remove oldest entries if we exceed the limit
    const oldestKey = keys[0];
    await cache.delete(oldestKey);
  }
  await cache.put(request, response.clone());
}

async function clearExpiredCache(cache, strategy) {
  const now = Date.now();
  const keys = await cache.keys();
  const expired = await Promise.all(
    keys.map(async (request) => {
      const response = await cache.match(request);
      const cacheTime = response.headers.get('sw-cache-time');
      if (
        cacheTime &&
        now - parseInt(cacheTime) > strategy.maxAgeSeconds * 1000
      ) {
        return request;
      }
      return null;
    }),
  );
  await Promise.all(
    expired.filter(Boolean).map((request) => cache.delete(request)),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();

      // Clear expired cache entries
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        Object.values(CACHE_STRATEGIES).map((strategy) =>
          clearExpiredCache(cache, strategy),
        ),
      );
    })(),
  );
});

function getStrategy(request) {
  const url = new URL(request.url);

  if (request.destination === 'image') {
    return CACHE_STRATEGIES.images;
  }

  if (request.destination === 'font') {
    return CACHE_STRATEGIES.fonts;
  }

  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.api;
  }

  return CACHE_STRATEGIES.static;
}

async function handleFetch(event) {
  const strategy = getStrategy(event.request);
  const cache = await caches.open(CACHE_NAME);

  try {
    if (strategy.type === 'cache-first') {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return addSecurityHeaders(cachedResponse);
      }
    }

    const response = await fetch(event.request);

    if (response.ok) {
      const enhancedResponse = addSecurityHeaders(response.clone());
      await cacheWithLimit(cache, event.request, enhancedResponse, strategy);
      return enhancedResponse;
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return addSecurityHeaders(cachedResponse);
    }

    if (event.request.mode === 'navigate') {
      return cache.match(OFFLINE_URL);
    }

    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(handleFetch(event));
});
