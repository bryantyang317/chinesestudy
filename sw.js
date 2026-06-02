// ═══════════════════════════════════════════════
// 康軒國語學習 — Service Worker (離線快取)
// 版本：v2 — 改為網路優先策略，確保更新即時生效
// ═══════════════════════════════════════════════
const CACHE_NAME = 'kangxuan-v2';

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
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── 啟用：清除所有舊版快取 ──
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

// ── 攔截請求：網路優先，失敗才用快取 ──
// 這樣每次更新 index.html 後，只要有網路就會立刻拿到最新版
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 網路成功：更新快取並回傳
        if (response && response.status === 200 && response.type === 'basic') {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, toCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 無網路：從快取取出（完全離線可用）
        return caches.match(event.request)
          .then(cached => cached || caches.match('./index.html'));
      })
  );
});
