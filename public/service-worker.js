// Service Worker for PWA - 自由進度学習支援システム
const CACHE_VERSION = 'v1.10.0';
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

// インストールイベント
self.addEventListener('install', (event) => {
  console.log('[Service Worker] インストール中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] 静的リソースをキャッシュ中...');
      return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'no-cache' })))
        .catch(err => {
          console.warn('[Service Worker] 一部のリソースのキャッシュに失敗:', err);
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

// フェッチイベント
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // APIリクエストの場合
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 静的リソースの場合
  if (request.method === 'GET' && isStaticResource(url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // ナビゲーションリクエスト（ページ遷移） - サーバービジー時は自動リトライ画面
  if (request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(request, 10000).catch(() => {
        // タイムアウト時: 自動リトライ付きのローディング画面を返す
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
button:active{transform:scale(0.97);}
.status{font-size:0.75rem;color:#9ca3af;margin-top:0.5rem;}
</style></head><body>
<div class="box">
  <div class="spinner-ring"></div>
  <h1>ページを読み込んでいます</h1>
  <p>サーバーがAI処理中のため、少しお待ちください。<br>自動的に再接続します。</p>
  <div class="bar-bg"><div class="bar" id="bar"></div></div>
  <div class="count" id="msg">接続を試みています...</div>
  <div class="status" id="status"></div>
  <button id="btn" onclick="location.reload()">手動で再読み込み</button>
</div>
<script>
(function(){
  var attempt=0, maxAttempt=20, barEl=document.getElementById('bar'), msgEl=document.getElementById('msg'), statusEl=document.getElementById('status'), btnEl=document.getElementById('btn');
  function tryReload(){
    attempt++;
    var pct=Math.min(attempt/maxAttempt*100,95);
    barEl.style.width=pct+'%';
    msgEl.textContent='再接続中... ('+attempt+'回目)';
    statusEl.textContent='次の試行まで '+(attempt<5?'5秒':attempt<10?'8秒':'10秒');
    fetch(location.href,{method:'HEAD',cache:'no-store'}).then(function(r){
      if(r.ok){msgEl.textContent='接続成功！読み込み中...';barEl.style.width='100%';setTimeout(function(){location.reload();},500);}
      else{schedule();}
    }).catch(function(){schedule();});
  }
  function schedule(){
    if(attempt>=maxAttempt){msgEl.textContent='サーバーが応答しません';statusEl.textContent='';btnEl.style.display='block';return;}
    var delay=attempt<5?5000:attempt<10?8000:10000;
    setTimeout(tryReload,delay);
  }
  setTimeout(tryReload,3000);
})();
</script></body></html>`, {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
        });
      })
    );
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

// 静的リソースの判定
function isStaticResource(url) {
  const staticExtensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.hostname.includes('cdn.tailwindcss.com') ||
         url.hostname.includes('cdn.jsdelivr.net');
}

// 静的リソースのハンドリング（ネットワーク優先、フォールバックでキャッシュ）
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // まずネットワークから取得を試みる
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // ネットワーク失敗時のみキャッシュを使用
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] オフライン - キャッシュから取得:', request.url);
      return cachedResponse;
    }
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
