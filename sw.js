// ═══════════════════════════════════════════════
// 康軒國語學習 — Service Worker (離線快取)
// ═══════════════════════════════════════════════
const CACHE_NAME = 'kangxuan-v1';

// 所有需要快取的檔案（app 本體）
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// ── 安裝：預先快取所有檔案 ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  // 立即啟用，不等待舊版本結束
  self.skipWaiting();
});

// ── 啟用：清除舊版快取 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── 攔截請求：優先用快取，沒有才連網路 ──
self.addEventListener('fetch', event => {
  // 只處理 GET 請求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // 沒有快取：嘗試網路，同時存入快取
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, toCache);
        });
        return response;
      }).catch(() => {
        // 網路失敗 → 回傳主頁（單頁 app fallback）
        return caches.match('./index.html');
      });
    })
  );
});
