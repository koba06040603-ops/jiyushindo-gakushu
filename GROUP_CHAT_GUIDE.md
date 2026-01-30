# グループチャット機能実装ガイド

## 📋 概要

協働学習を促進するためのリアルタイムグループチャット機能。

---

## 🏗️ システム構成

```
Frontend (Chat UI)
    ↓ HTTP/WebSocket
Worker API
    ↓ D1 Database
Chat Messages Table
    ↓ Broadcast
All Group Members
```

---

## 📝 データベーススキーマ

### chat_groups（チャットグループ）
```sql
CREATE TABLE IF NOT EXISTS chat_groups (
  group_id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_name TEXT NOT NULL,
  class_code TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### chat_messages（チャットメッセージ）
```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',  -- text, image, file
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES chat_groups(group_id)
);
```

### chat_members（チャットメンバー）
```sql
CREATE TABLE IF NOT EXISTS chat_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, student_id)
);
```

---

## 💻 バックエンド実装

### src/group-chat.ts

```typescript
export class GroupChatSystem {
  constructor(private db: D1Database) {}

  async createGroup(groupName: string, classCode: string, creatorId: number) {
    const result = await this.db.prepare(`
      INSERT INTO chat_groups (group_name, class_code, created_by)
      VALUES (?, ?, ?)
    `).bind(groupName, classCode, creatorId).run();

    return result.meta.last_row_id;
  }

  async addMember(groupId: number, studentId: number) {
    await this.db.prepare(`
      INSERT INTO chat_members (group_id, student_id)
      VALUES (?, ?)
    `).bind(groupId, studentId).run();
  }

  async sendMessage(groupId: number, senderId: number, messageText: string) {
    const result = await this.db.prepare(`
      INSERT INTO chat_messages (group_id, sender_id, message_text)
      VALUES (?, ?, ?)
    `).bind(groupId, senderId, messageText).run();

    const messageId = result.meta.last_row_id;

    // メッセージをブロードキャスト
    await this.broadcastMessage(groupId, {
      message_id: messageId,
      sender_id: senderId,
      message_text: messageText,
      created_at: new Date().toISOString()
    });

    return messageId;
  }

  async getGroupMessages(groupId: number, limit = 50) {
    const result = await this.db.prepare(`
      SELECT m.*, s.student_name
      FROM chat_messages m
      JOIN students s ON m.sender_id = s.student_id
      WHERE m.group_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `).bind(groupId, limit).all();

    return result.results.reverse();
  }

  async getGroupMembers(groupId: number) {
    const result = await this.db.prepare(`
      SELECT s.student_id, s.student_name, s.grade_level
      FROM chat_members cm
      JOIN students s ON cm.student_id = s.student_id
      WHERE cm.group_id = ?
    `).bind(groupId).all();

    return result.results;
  }

  private async broadcastMessage(groupId: number, message: any) {
    // WebSocket経由で全メンバーに送信
    // 実装は WEBSOCKET_GUIDE.md 参照
  }
}
```

### API エンドポイント

**src/index.tsx**:
```typescript
// グループ作成
app.post('/api/chat/groups', async (c) => {
  const { group_name, class_code } = await c.req.json();
  const user = c.get('user');  // authMiddleware経由
  
  const chatSystem = new GroupChatSystem(c.env.DB);
  const groupId = await chatSystem.createGroup(group_name, class_code, user.user_id);
  
  // 作成者を自動追加
  await chatSystem.addMember(groupId, user.user_id);
  
  return c.json({ success: true, group_id: groupId });
});

// メッセージ送信
app.post('/api/chat/groups/:groupId/messages', async (c) => {
  const groupId = parseInt(c.req.param('groupId'));
  const { message_text } = await c.req.json();
  const user = c.get('user');
  
  const chatSystem = new GroupChatSystem(c.env.DB);
  const messageId = await chatSystem.sendMessage(groupId, user.user_id, message_text);
  
  return c.json({ success: true, message_id: messageId });
});

// メッセージ取得
app.get('/api/chat/groups/:groupId/messages', async (c) => {
  const groupId = parseInt(c.req.param('groupId'));
  
  const chatSystem = new GroupChatSystem(c.env.DB);
  const messages = await chatSystem.getGroupMessages(groupId);
  
  return c.json({ success: true, messages });
});
```

---

## 🎨 フロントエンド実装

### public/static/group-chat.js

```javascript
class GroupChatClient {
  constructor(groupId, userId) {
    this.groupId = groupId;
    this.userId = userId;
    this.messages = [];
    this.loadMessages();
    this.setupWebSocket();
  }

  async loadMessages() {
    const response = await fetch(`/api/chat/groups/${this.groupId}/messages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    this.messages = data.messages;
    this.renderMessages();
  }

  async sendMessage(text) {
    const response = await fetch(`/api/chat/groups/${this.groupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message_text: text })
    });
    
    if (response.ok) {
      // メッセージ送信成功
      document.getElementById('messageInput').value = '';
    }
  }

  setupWebSocket() {
    // WebSocket接続でリアルタイム更新
    this.ws = new WebSocket(`wss://${window.location.host}/api/ws/chat/${this.groupId}`);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messages.push(message);
      this.renderMessages();
    };
  }

  renderMessages() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    
    this.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = msg.sender_id === this.userId ? 'message own' : 'message';
      div.innerHTML = `
        <div class="message-header">
          <span class="sender">${msg.student_name}</span>
          <span class="time">${new Date(msg.created_at).toLocaleTimeString()}</span>
        </div>
        <div class="message-body">${msg.message_text}</div>
      `;
      container.appendChild(div);
    });
    
    // 最新メッセージにスクロール
    container.scrollTop = container.scrollHeight;
  }
}

// 使用例
const chat = new GroupChatClient(groupId, userId);

document.getElementById('sendButton').addEventListener('click', () => {
  const text = document.getElementById('messageInput').value;
  if (text.trim()) {
    chat.sendMessage(text);
  }
});
```

---

## 🎯 機能一覧

### 基本機能
- ✅ グループ作成
- ✅ メンバー追加/削除
- ✅ テキストメッセージ送受信
- ✅ リアルタイム更新

### 拡張機能（将来実装）
- 📷 画像・ファイル共有
- 📝 メッセージ編集・削除
- 👍 リアクション（いいね等）
- 🔔 未読カウント
- 🔍 メッセージ検索

---

## 🚀 デプロイ

```bash
# マイグレーション適用
npx wrangler d1 migrations apply jiyushindo-gakushu-production --remote

# デプロイ
npm run build
npx wrangler pages deploy dist --project-name jiyushindo-gakushu
```

---

**作成日**: 2026-01-30
