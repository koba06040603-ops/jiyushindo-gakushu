-- Migration 0019: 友達助け合いシステム
-- 児童同士のヘルプ要請・応答機能

-- ピアヘルプ要請テーブル
CREATE TABLE IF NOT EXISTS peer_help_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 要請者・支援者
  requester_id TEXT NOT NULL,  -- ヘルプを求める児童
  helper_id TEXT NOT NULL,     -- ヘルプできそうな児童
  
  -- 対象学習カード
  curriculum_id TEXT NOT NULL,
  learning_card_id TEXT NOT NULL,
  
  -- メッセージ
  message TEXT,  -- 「この問題がわかりません」など
  
  -- ステータス
  status TEXT NOT NULL DEFAULT 'pending',  -- pending/accepted/declined/completed
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  completed_at DATETIME
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_peer_help_helper 
  ON peer_help_requests(helper_id, status);

CREATE INDEX IF NOT EXISTS idx_peer_help_requester 
  ON peer_help_requests(requester_id, status);

CREATE INDEX IF NOT EXISTS idx_peer_help_created 
  ON peer_help_requests(created_at);

-- ピアヘルプ履歴テーブル（統計用）
CREATE TABLE IF NOT EXISTS peer_help_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 支援者・被支援者
  helper_id TEXT NOT NULL,
  helped_id TEXT NOT NULL,
  
  -- 支援内容
  curriculum_id TEXT NOT NULL,
  learning_card_id TEXT NOT NULL,
  
  -- 支援結果
  was_helpful BOOLEAN,  -- 役に立ったか（被支援者の評価）
  feedback TEXT,        -- フィードバックコメント
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_peer_help_history_helper 
  ON peer_help_history(helper_id);

CREATE INDEX IF NOT EXISTS idx_peer_help_history_helped 
  ON peer_help_history(helped_id);
