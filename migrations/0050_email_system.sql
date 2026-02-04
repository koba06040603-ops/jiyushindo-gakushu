-- ============================================
-- Phase 6-1: Email通知システム
-- ============================================

-- 1. Email設定テーブル
CREATE TABLE IF NOT EXISTS email_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  user_id INTEGER NOT NULL,
  email_address TEXT NOT NULL,
  receive_learning_updates INTEGER DEFAULT 1,
  receive_achievements INTEGER DEFAULT 1,
  receive_teacher_comments INTEGER DEFAULT 1,
  receive_system_notices INTEGER DEFAULT 1,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, user_id)
);

-- 2. Email送信履歴テーブル
CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  user_id INTEGER NOT NULL,
  email_to TEXT NOT NULL,
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_email_settings_user ON email_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_email_settings_school ON email_settings(school_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- テストデータ
INSERT OR IGNORE INTO email_settings (school_id, user_id, email_address) VALUES
  (1, 1, 'teacher1@example.com'),
  (1, 2, 'student1@example.com');

SELECT '✅ Migration 0050: Email notification system created' as status;
