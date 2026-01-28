# Phase 7: リアルタイム通知機能 - 設計書

## 概要
Cloudflare Durable ObjectsとWebSocketを使用したリアルタイム通知システムの実装

---

## システムアーキテクチャ

### 1. Cloudflare Durable Objects WebSocket

```
┌─────────────┐         WebSocket         ┌──────────────────┐
│   生徒UI    │ ←─────────────────────→  │  Durable Object  │
│  (Browser)  │                            │  (WebSocket)     │
└─────────────┘                            └──────────────────┘
                                                    ↕
┌─────────────┐         WebSocket         ┌──────────────────┐
│  教師UI     │ ←─────────────────────→  │  Durable Object  │
│  (Browser)  │                            │  (WebSocket)     │
└─────────────┘                            └──────────────────┘
                                                    ↕
                                           ┌──────────────────┐
                                           │   Cloudflare D1  │
                                           │   (Database)     │
                                           └──────────────────┘
```

### 2. Durable Objectの役割

**ProgressWebSocket Durable Object:**
- WebSocket接続の永続化
- 各クラスルームごとに1つのインスタンス
- 教師と生徒間のメッセージルーティング
- 通知の配信と管理

---

## データモデル

### 1. Cloudflare D1スキーマ

#### notifications テーブル
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- 'teacher_message', 'card_distribution', 'help_response', 'achievement'
  from_user_id INTEGER,
  to_user_id INTEGER,
  class_code TEXT,
  curriculum_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,  -- JSON形式の追加データ
  is_read INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME,
  expires_at DATETIME,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_to_user ON notifications(to_user_id, is_read);
CREATE INDEX idx_notifications_class ON notifications(class_code, created_at);
```

#### realtime_sessions テーブル
```sql
CREATE TABLE IF NOT EXISTS realtime_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  class_code TEXT NOT NULL,
  session_id TEXT NOT NULL,
  connection_status TEXT DEFAULT 'connected',  -- 'connected', 'disconnected'
  last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  disconnected_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_realtime_sessions_user ON realtime_sessions(user_id);
CREATE INDEX idx_realtime_sessions_class ON realtime_sessions(class_code);
```

---

## WebSocketメッセージプロトコル

### 1. クライアント → サーバー

#### 接続初期化
```json
{
  "type": "init",
  "userId": 123,
  "classCode": "CLASS_2026_A",
  "role": "student"  // or "teacher"
}
```

#### ハートビート
```json
{
  "type": "ping"
}
```

#### 教師からの通知送信
```json
{
  "type": "send_notification",
  "notificationType": "teacher_message",
  "targetUserIds": [1, 2, 3],  // or "all"
  "title": "お知らせ",
  "message": "次の学習カードに進んでください",
  "priority": "high"
}
```

#### カード配信通知
```json
{
  "type": "distribute_card",
  "curriculumId": 5,
  "courseId": 2,
  "cardId": 12,
  "targetUserIds": [1, 2, 3]
}
```

### 2. サーバー → クライアント

#### 接続確認
```json
{
  "type": "connected",
  "sessionId": "sess_abc123",
  "userId": 123,
  "timestamp": "2026-01-28T15:30:00Z"
}
```

#### ハートビート応答
```json
{
  "type": "pong",
  "timestamp": "2026-01-28T15:30:00Z"
}
```

#### 通知受信
```json
{
  "type": "notification",
  "notificationId": 456,
  "notificationType": "teacher_message",
  "fromUserId": 100,
  "fromUserName": "田中先生",
  "title": "お知らせ",
  "message": "次の学習カードに進んでください",
  "priority": "high",
  "data": {},
  "timestamp": "2026-01-28T15:30:00Z"
}
```

#### カード配信通知
```json
{
  "type": "card_distribution",
  "notificationId": 457,
  "curriculumId": 5,
  "courseId": 2,
  "cardId": 12,
  "cardTitle": "小数のたし算",
  "message": "新しい学習カードが届きました",
  "timestamp": "2026-01-28T15:30:00Z"
}
```

#### エラー通知
```json
{
  "type": "error",
  "errorCode": "UNAUTHORIZED",
  "message": "接続権限がありません"
}
```

---

## 実装計画

### 1. Durable Object実装

**ファイル:** `/home/user/webapp/src/websocket.ts`

```typescript
// ProgressWebSocket Durable Object
export class ProgressWebSocket {
  state: DurableObjectState
  sessions: Map<string, WebSocket>
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.sessions = new Map()
  }
  
  async fetch(request: Request): Promise<Response> {
    // WebSocketアップグレード処理
  }
  
  async handleWebSocket(websocket: WebSocket, userId: number, classCode: string) {
    // WebSocketメッセージ処理
  }
  
  async broadcastToClass(classCode: string, message: any) {
    // クラス全体へのブロードキャスト
  }
  
  async sendToUser(userId: number, message: any) {
    // 特定ユーザーへの送信
  }
}
```

### 2. バックエンドAPI

**新規エンドポイント:**

```typescript
// WebSocket接続エンドポイント
app.get('/api/realtime/connect', async (c) => {
  // Durable Objectへのアップグレード
})

// 通知送信API
app.post('/api/notifications/send', async (c) => {
  // 教師から生徒への通知送信
})

// 通知一覧取得API
app.get('/api/notifications', async (c) => {
  // ユーザーの通知一覧
})

// 通知既読API
app.put('/api/notifications/:id/read', async (c) => {
  // 通知を既読にする
})
```

### 3. フロントエンドUI

**新規コンポーネント:**

```javascript
// WebSocket接続管理
class RealtimeConnection {
  constructor(userId, classCode)
  connect()
  disconnect()
  sendMessage(message)
  onNotification(callback)
}

// 通知表示UI
function NotificationToast({ notification }) {
  // トースト通知の表示
}

function NotificationBadge({ count }) {
  // 未読通知バッジ
}

function NotificationPanel({ notifications }) {
  // 通知一覧パネル
}
```

---

## 通知タイプと優先度

### 通知タイプ

1. **teacher_message** - 先生からのメッセージ
   - 優先度: normal〜high
   - 例: 「次の学習カードに進んでください」

2. **card_distribution** - 新しいカード配信
   - 優先度: normal
   - 例: 「新しい学習カード『小数のたし算』が届きました」

3. **help_response** - ヘルプ要請への応答
   - 優先度: high
   - 例: 「田中先生があなたのヘルプ要請に応答しました」

4. **achievement** - 達成通知
   - 優先度: normal
   - 例: 「おめでとう！10枚の学習カードを完了しました」

5. **peer_help** - 友達からのヘルプ応答
   - 優先度: normal
   - 例: 「佐藤さんがあなたのヘルプ要請を受け入れました」

### 優先度レベル

- **urgent** 🔴 - 即座に注意が必要（音+画面全体のオーバーレイ）
- **high** 🟠 - 重要な通知（音+トースト通知）
- **normal** 🟢 - 通常の通知（トースト通知のみ）
- **low** ⚪ - 低優先度（バッジのみ）

---

## UI/UX設計

### 1. 通知トースト

**位置:** 画面右上
**デザイン:**
```html
<div class="notification-toast priority-high">
  <div class="toast-icon">🔔</div>
  <div class="toast-content">
    <div class="toast-title">田中先生からのメッセージ</div>
    <div class="toast-message">次の学習カードに進んでください</div>
  </div>
  <button class="toast-close">×</button>
</div>
```

### 2. 通知バッジ

**位置:** ヘッダーのベルアイコン
**デザイン:**
```html
<button class="notification-button">
  <i class="fas fa-bell"></i>
  <span class="notification-badge">3</span>
</button>
```

### 3. 通知パネル

**位置:** 画面右側スライドイン
**デザイン:**
```html
<div class="notification-panel">
  <div class="panel-header">
    <h3>通知</h3>
    <button class="mark-all-read">すべて既読</button>
  </div>
  <div class="notification-list">
    <!-- 通知アイテム -->
  </div>
</div>
```

---

## セキュリティ考慮事項

### 1. 認証・認可

- WebSocket接続時にJWTトークン検証
- クラスルームへのアクセス権限確認
- 教師権限の確認（通知送信時）

### 2. レート制限

- 1ユーザーあたりの接続数制限: 5接続
- 通知送信レート制限: 10通知/分
- ハートビート間隔: 30秒

### 3. データ保護

- WebSocket通信はTLS暗号化
- 個人情報の最小化
- 通知の自動削除: 30日後

---

## パフォーマンス最適化

### 1. Durable Object配置

- クラスルームごとに1つのDurable Object
- 地理的に近いリージョンに配置
- 自動スケーリング

### 2. メッセージ配信

- バッチ送信: 100通知/バッチ
- 圧縮: gzip圧縮
- キューイング: 送信失敗時の再送

### 3. 接続管理

- 自動再接続: 3回まで
- ハートビート: 30秒間隔
- タイムアウト: 60秒

---

## テスト計画

### 1. 単体テスト

- WebSocketメッセージ送受信
- 通知の保存・取得
- 認証・認可ロジック

### 2. 統合テスト

- 複数ユーザーの同時接続
- 教師→生徒の通知配信
- 接続断→再接続

### 3. 負荷テスト

- 100ユーザー同時接続
- 1000通知/秒の配信
- Durable Objectのスケーリング

---

## 実装順序

1. ✅ データベーススキーマ作成
2. ✅ Durable Object実装
3. ✅ バックエンドAPI実装
4. ✅ フロントエンド接続管理
5. ✅ 通知UI実装
6. ✅ テストとデバッグ
7. ✅ ドキュメント作成

---

## 次のステップ

Phase 7完了後、Phase 9（学習スタイル対応）へ移行します。

---

**実装開始時刻:** 2026-01-28 15:30  
**予定完了時刻:** 2026-01-29 06:00（朝まで）
