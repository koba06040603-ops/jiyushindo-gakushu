// Service Worker for PWA - 自由進度学習支援システム
const CACHE_VERSION = 'v3.1.0';
const CACHE_NAME = `jiyushindo-gakushu-${CACHE_VERSION}`;

// キャッシュするリソース（CDN系のみ。動的ページはキャッシュしない）
const STATIC_CACHE_URLS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js'
];

// キャッシュしないパス（動的コンテンツ）
const NO_CACHE_PATHS = ['/guide/', '/diagnostic', '/reflection-ai', '/api/', '/static/'];

// APIキャッシュの有効期限（ミリ秒）
const API_CACHE_DURATION = 5 * 60 * 1000; // 5分

// タイムアウト付きfetch
function fetchWithTimeout(request, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('fetch timeout'));
    }, timeoutMs);
    fetch(request, { signal: controller.signal })
      .then(response => { clearTimeout(timeoutId); resolve(response); })
      .catch(err => { clearTimeout(timeoutId); reject(err); });
  });
}

// インストールイベント - 即座にアクティベート
self.addEventListener('install', (event) => {
  console.log('[SW ' + CACHE_VERSION + '] インストール中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'no-cache' })))
        .catch(err => {
          console.warn('[SW] 一部のリソースのキャッシュに失敗:', err);
          return Promise.resolve();
        });
    }).then(() => {
      console.log('[SW ' + CACHE_VERSION + '] インストール完了 → skipWaiting');
      return self.skipWaiting();
    })
  );
});

// アクティベーションイベント - 古いキャッシュを全て削除
self.addEventListener('activate', (event) => {
  console.log('[SW ' + CACHE_VERSION + '] アクティベーション中...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW ' + CACHE_VERSION + '] アクティベーション完了 → clients.claim');
      return self.clients.claim();
    })
  );
});

// パスがキャッシュ禁止リストに含まれるかチェック
function isNoCachePath(pathname) {
  return NO_CACHE_PATHS.some(function(p) { return pathname.startsWith(p); });
}

// フェッチイベント
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 動的コンテンツ（/guide/, /api/ 等）→ 常にネットワークから取得、キャッシュしない
  if (isNoCachePath(url.pathname)) {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleApiRequest(request));
    } else {
      // /guide/ 等の動的ページ → ネットワーク直接、失敗時はリトライ画面
      event.respondWith(
        fetchWithTimeout(request, 15000).catch(() => {
          return makeRetryPage();
        })
      );
    }
    return;
  }

  // ナビゲーションリクエスト（ページ遷移）→ ネットワーク優先
  if (request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(request, 10000).catch(() => {
        return makeRetryPage();
      })
    );
    return;
  }

  // CDN等の静的リソース → ネットワーク優先、オフライン時キャッシュ
  if (request.method === 'GET' && isStaticResource(url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // その他のリクエスト
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then(response => {
        return response || new Response('', { status: 503 });
      });
    })
  );
});

// リトライ付きローディングページ生成
function makeRetryPage() {
  return new Response(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>読み込み中...</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#eef2ff,#fdf2f8);}
.box{text-align:center;padding:2.5rem;background:white;border-radius:1.5rem;box-shadow:0 10px 40px rgba(0,0,0,0.08);max-width:420px;width:90%;}
.spinner-ring{display:inline-block;width:56px;height:56px;border:4px solid #e0e7ff;border-top:4px solid #6366f1;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:1.5rem;}
@keyframes spin{to{transform:rotate(360deg);}}
h1{color:#374151;font-size:1.1rem;margin-bottom:0.5rem;}
p{color:#6B7280;font-size:0.85rem;line-height:1.6;margin-bottom:0.5rem;}
.count{color:#6366f1;font-weight:700;font-size:0.9rem;margin:1rem 0;}
.bar-bg{background:#e5e7eb;height:4px;border-radius:2px;overflow:hidden;margin:1rem 0;}
.bar{background:linear-gradient(90deg,#6366f1,#a78bfa);height:100%;border-radius:2px;transition:width 0.5s ease;width:0%;}
button{background:linear-gradient(135deg,#6366f1,#7c3aed);color:white;border:none;padding:0.8rem 1.5rem;border-radius:0.75rem;font-size:0.9rem;font-weight:600;cursor:pointer;width:100%;margin-top:1rem;transition:all 0.2s;display:none;}
button:hover{filter:brightness(1.1);}
</style></head><body>
<div class="box">
  <div class="spinner-ring"></div>
  <h1>ページを読み込んでいます</h1>
  <p>サーバーがAI処理中のため、少しお待ちください。<br>自動的に再接続します。</p>
  <div class="bar-bg"><div class="bar" id="bar"></div></div>
  <div class="count" id="msg">接続を試みています...</div>
  <button id="btn" onclick="location.reload()">手動で再読み込み</button>
</div>
<script>
(function(){
  var attempt=0,maxAttempt=20,barEl=document.getElementById('bar'),msgEl=document.getElementById('msg'),btnEl=document.getElementById('btn');
  function tryReload(){
    attempt++;
    barEl.style.width=Math.min(attempt/maxAttempt*100,95)+'%';
    msgEl.textContent='再接続中... ('+attempt+'回目)';
    fetch(location.href,{method:'HEAD',cache:'no-store'}).then(function(r){
      if(r.ok){msgEl.textContent='接続成功！';barEl.style.width='100%';setTimeout(function(){location.reload();},500);}
      else{schedule();}
    }).catch(function(){schedule();});
  }
  function schedule(){
    if(attempt>=maxAttempt){msgEl.textContent='サーバーが応答しません';btnEl.style.display='block';return;}
    setTimeout(tryReload,attempt<5?5000:attempt<10?8000:10000);
  }
  setTimeout(tryReload,3000);
})();
</script></body></html>`, {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
  });
}

// 静的リソースの判定
function isStaticResource(url) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.hostname.includes('cdn.tailwindcss.com') ||
         url.hostname.includes('cdn.jsdelivr.net');
}

// 静的リソースのハンドリング（ネットワーク優先、フォールバックでキャッシュ）
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // cache: 'no-cache' でブラウザのHTTPキャッシュをバイパスし、常にサーバーから取得
    const networkResponse = await fetch(request, { cache: 'no-cache' });
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('', { status: 503 });
  }
}

// APIリクエストのハンドリング（ネットワーク優先、期限付きキャッシュ）
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    
    if (request.method === 'GET' && networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      const cacheEntry = {
        response: await responseToCache.text(),
        timestamp: Date.now(),
        headers: Object.fromEntries(networkResponse.headers.entries())
      };
      const cacheResponse = new Response(JSON.stringify(cacheEntry), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put(request, cacheResponse);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cacheEntry = await cachedResponse.json();
      if (Date.now() - cacheEntry.timestamp < API_CACHE_DURATION) {
        return new Response(cacheEntry.response, { headers: cacheEntry.headers });
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'オフラインです。ネットワーク接続を確認してください。',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// メッセージイベント
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // 全キャッシュ強制クリア
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) { return caches.delete(name); }));
    }).then(function() {
      console.log('[SW] 全キャッシュ削除完了');
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ cleared: true });
      }
    });
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
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
    actions: [
      { action: 'explore', title: '確認する' },
      { action: 'close', title: '閉じる' }
    ]
  };
  event.waitUntil(self.registration.showNotification('自由進度学習', options));
});

// 通知クリックイベント
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/dashboard.html'));
  }
});

console.log('[SW ' + CACHE_VERSION + '] スクリプト読み込み完了');
