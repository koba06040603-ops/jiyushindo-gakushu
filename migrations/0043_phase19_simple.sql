-- Phase 19: 次世代学習支援機能（簡略版）
-- 作成日時: 2026-01-30

-- ゲーミフィケーション：ポイントシステム
CREATE TABLE IF NOT EXISTS student_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL UNIQUE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_cards_completed INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- テーマ設定
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'light',
  color_scheme TEXT DEFAULT 'blue',
  font_size TEXT DEFAULT 'medium',
  voice_enabled BOOLEAN DEFAULT 1,
  voice_speed REAL DEFAULT 1.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 音声メモ
CREATE TABLE IF NOT EXISTS voice_memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  card_id INTEGER,
  transcription TEXT,
  duration INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 保護者向けレポート
CREATE TABLE IF NOT EXISTS parent_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  report_date DATE NOT NULL,
  weekly_cards_completed INTEGER DEFAULT 0,
  weekly_study_time INTEGER DEFAULT 0,
  weekly_help_requests INTEGER DEFAULT 0,
  strengths TEXT,
  improvements TEXT,
  teacher_comment TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, report_date)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_student_points_student_id ON student_points(student_id);
CREATE INDEX IF NOT EXISTS idx_voice_memos_student_id ON voice_memos(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_reports_student_id ON parent_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_reports_date ON parent_reports(report_date);
