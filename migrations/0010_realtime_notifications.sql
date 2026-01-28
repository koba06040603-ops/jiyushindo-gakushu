-- Phase 7: リアルタイム通知機能のデータベーススキーマ

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,  -- 'teacher_message', 'card_distribution', 'help_response', 'achievement', 'peer_help'
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

CREATE INDEX IF NOT EXISTS idx_notifications_to_user ON notifications(to_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_class ON notifications(class_code, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at);

-- リアルタイムセッションテーブル
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

CREATE INDEX IF NOT EXISTS idx_realtime_sessions_user ON realtime_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_class ON realtime_sessions(class_code);
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_status ON realtime_sessions(connection_status, last_heartbeat);
