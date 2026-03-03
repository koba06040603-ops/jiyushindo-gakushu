// Service Worker for PWA - 自由進度学習支援システム
const CACHE_VERSION = 'v1.1.0';
const CACHE_NAME = `jiyushindo-gakushu-${CACHE_VERSION}`;

// キャッシュするリソース
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard.html',
  '/parent-dashboard.html',
  '/static/app.js',
  '/static/styles.css',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js'
];

// APIキャッシュの有効期限（ミリ秒）
const API_CACHE_DURATION = 5 * 60 * 1000; // 5分

// インストールイベント
self.addEventListener('install', (event) => {
  console.log('[Service Worker] インストール中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] 静的リソースをキャッシュ中...');
      return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'no-cache' })))
        .catch(err => {
          console.warn('[Service Worker] 一部のリソースのキャッシュに失敗:', err);
          // 失敗しても続行
          return Promise.resolve();
        });
    }).then(() => {
      console.log('[Service Worker] インストール完了');
      return self.skipWaiting();
    })
  );
});

// アクティベーションイベント
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] アクティベーション中...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] アクティベーション完了');
      return self.clients.claim();
    })
  );
});

// フェッチイベント - ネットワーク優先、フォールバックでキャッシュ
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIリクエストの場合
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 静的リソースの場合 - キャッシュ優先
  if (request.method === 'GET' && isStaticResource(url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // ナビゲーションリクエスト（ページ遷移） - ネットワーク優先、タイムアウト付き
  if (request.mode === 'navigate') {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]).catch(() => {
        return caches.match(request).then(response => {
          if (response) return response;
          // オフラインフォールバック - ちゃんとしたHTMLを返す
          return new Response(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>接続中...</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f3f4f6;}.box{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 6px rgba(0,0,0,0.1);max-width:400px;}h1{color:#4F46E5;margin-bottom:0.5rem;}p{color:#6B7280;margin-bottom:1.5rem;}button{background:#4F46E5;color:white;border:none;padding:0.75rem 2rem;border-radius:0.5rem;font-size:1rem;cursor:pointer;}button:hover{background:#4338CA;}</style></head><body><div class="box"><h1>📡 接続できません</h1><p>サーバーに接続できません。<br>インターネット接続を確認してください。</p><button onclick="location.reload()">🔄 再読み込み</button></div></body></html>`, {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
          });
        });
      })
    );
    return;
  }

  // その他のリクエスト - ネットワーク優先
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then(response => {
        return response || new Response('', { status: 503 });
      });
    })
  );
});

// 静的リソースの判定
function isStaticResource(url) {
  const staticExtensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.hostname.includes('cdn.tailwindcss.com') ||
         url.hostname.includes('cdn.jsdelivr.net');
}

// 静的リソースのハンドリング（キャッシュ優先）
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('[Service Worker] キャッシュから取得:', request.url);
    // バックグラウンドで更新
    fetch(request).then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
    }).catch(() => {});
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] ネットワークエラー:', error);
    return new Response('リソースの取得に失敗しました', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// APIリクエストのハンドリング（ネットワーク優先、期限付きキャッシュ）
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // ネットワークから取得を試みる
    const networkResponse = await fetch(request);
    
    // GETリクエストでステータスが200の場合のみキャッシュ
    if (request.method === 'GET' && networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      const cacheEntry = {
        response: await responseToCache.text(),
        timestamp: Date.now(),
        headers: Object.fromEntries(networkResponse.headers.entries())
      };
      
      // カスタムレスポンスとしてキャッシュ
      const cacheResponse = new Response(JSON.stringify(cacheEntry), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put(request, cacheResponse);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[Service Worker] APIリクエスト失敗、キャッシュを確認:', request.url);
    
    // キャッシュから取得
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cacheEntry = await cachedResponse.json();
      
      // キャッシュの有効期限チェック
      if (Date.now() - cacheEntry.timestamp < API_CACHE_DURATION) {
        console.log('[Service Worker] 有効なキャッシュを返却:', request.url);
        return new Response(cacheEntry.response, {
          headers: cacheEntry.headers
        });
      } else {
        console.log('[Service Worker] キャッシュが期限切れ:', request.url);
      }
    }
    
    // オフライン用のフォールバックレスポンス
    return new Response(JSON.stringify({
      success: false,
      error: 'オフラインです。ネットワーク接続を確認してください。',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// メッセージイベント - クライアントからの指示を受け取る
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then(cache => {
      urls.forEach(url => {
        cache.add(url).catch(err => console.warn('キャッシュ追加失敗:', url, err));
      });
    });
  }
});

// プッシュ通知イベント
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'プッシュ通知',
    icon: '/static/icon-192.png',
    badge: '/static/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: '確認する' },
      { action: 'close', title: '閉じる' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('自由進度学習', options)
  );
});

// 通知クリックイベント
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard.html')
    );
  }
});

console.log('[Service Worker] スクリプト読み込み完了');
