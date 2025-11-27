const CACHE_NAME = 'trade-ajay-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/services/geminiService.ts',
  '/components/SearchInput.tsx',
  '/components/AnalysisCard.tsx',
  '/components/TradeLevelCard.tsx',
  '/components/SourceList.tsx',
  '/components/Watchlist.tsx',
  '/components/AlgoPanel.tsx',
  '/components/EarningsTicker.tsx',
  'https://cdn.tailwindcss.com',
  'https://cdn-icons-png.flaticon.com/512/3310/3310624.png',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0',
  'https://aistudiocdn.com/@google/genai@^1.30.0'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return Promise.all(
            urlsToCache.map(url => {
                return cache.add(url).catch(err => {
                    console.warn('Failed to cache:', url, err);
                });
            })
        );
      })
  );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match('/index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          response => {
            if(!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                if (event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });
            return response;
          }
        );
      })
  );
});