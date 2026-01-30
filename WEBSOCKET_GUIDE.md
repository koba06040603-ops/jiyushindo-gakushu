# WebSocketリアルタイム通知実装ガイド

## 📋 概要

Cloudflare Durable Objectsを使用したWebSocketリアルタイム通知システム。

---

## 🏗️ アーキテクチャ

```
Client (Browser)
    ↓ WebSocket
Cloudflare Worker
    ↓ Durable Object
WebSocket Manager (Durable Object)
    ↓ Broadcast
All Connected Clients
```

---

## 📝 実装手順

### Step 1: Durable Object定義

**src/websocket.ts**:
```typescript
export class NotificationWebSocket {
  state: DurableObjectState;
  sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    await this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(webSocket: WebSocket) {
    webSocket.accept();
    this.sessions.add(webSocket);

    webSocket.addEventListener('message', (event) => {
      // Broadcast to all sessions
      this.broadcast(event.data);
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(webSocket);
    });
  }

  broadcast(message: string) {
    for (const session of this.sessions) {
      try {
        session.send(message);
      } catch (err) {
        // Remove broken sessions
        this.sessions.delete(session);
      }
    }
  }
}
```

### Step 2: wrangler.jsonc設定

```jsonc
{
  "durable_objects": {
    "bindings": [
      {
        "name": "NOTIFICATIONS",
        "class_name": "NotificationWebSocket",
        "script_name": "jiyushindo-gakushu"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["NotificationWebSocket"]
    }
  ]
}
```

### Step 3: エンドポイント追加

**src/index.tsx**:
```typescript
app.get('/api/ws/notifications/:studentId', async (c) => {
  const { NOTIFICATIONS } = c.env;
  const studentId = c.req.param('studentId');
  
  // Get Durable Object instance
  const id = NOTIFICATIONS.idFromName(studentId);
  const stub = NOTIFICATIONS.get(id);
  
  return stub.fetch(c.req.raw);
});
```

### Step 4: クライアント側実装

**public/static/notifications.js**:
```javascript
class NotificationClient {
  constructor(studentId) {
    this.studentId = studentId;
    this.ws = null;
    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/notifications/${this.studentId}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      this.handleNotification(notification);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => this.connect(), 3000);
    };
  }

  handleNotification(notification) {
    // Display notification
    showToast(notification.message);
    
    // Update UI
    updateBadgeCount();
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

// Usage
const notificationClient = new NotificationClient(studentId);
```

---

## 🚀 デプロイ

```bash
# ビルド
npm run build

# ローカルテスト
npx wrangler pages dev dist

# 本番デプロイ
npx wrangler pages deploy dist --project-name jiyushindo-gakushu
```

---

## 📊 通知の種類

1. **新しいカード配信**: 先生が新しい学習カードを配信
2. **メッセージ受信**: 先生・保護者からのメッセージ
3. **実績解除**: ゲーミフィケーション実績達成
4. **リマインダー**: 学習計画のリマインド

---

## ⚠️ 注意事項

### Cloudflare Workers制限
- WebSocketは本番環境（Workers Paid Plan）が必要
- 無料プランではWebSocket使用不可
- Durable Objectsは追加料金発生

### 代替案（無料プラン対応）
- Server-Sent Events (SSE)使用
- ポーリング（定期的なAPI呼び出し）
- Cloudflare Queues使用

---

**作成日**: 2026-01-30
