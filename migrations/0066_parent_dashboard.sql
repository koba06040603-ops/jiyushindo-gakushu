-- Phase 21-1: 保護者向けダッシュボード

-- 保護者アカウントテーブル
CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  notification_email INTEGER DEFAULT 1,
  notification_frequency TEXT DEFAULT 'daily'
);

-- 保護者-生徒関連テーブル
CREATE TABLE IF NOT EXISTS parent_student_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  relation_type TEXT NOT NULL,
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, student_id)
);

-- 保護者への通知テーブル
CREATE TABLE IF NOT EXISTS parent_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 保護者コメント・応援メッセージテーブル
CREATE TABLE IF NOT EXISTS parent_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'encouragement',
  is_read_by_student INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 保護者の閲覧履歴
CREATE TABLE IF NOT EXISTS parent_view_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  view_type TEXT NOT NULL,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 週次・月次レポート自動生成テーブル
CREATE TABLE IF NOT EXISTS parent_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  report_type TEXT NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  total_study_time INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  correct_rate REAL DEFAULT 0.0,
  streak_days INTEGER DEFAULT 0,
  achievements TEXT,
  strengths TEXT,
  weaknesses TEXT,
  recommendations TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
