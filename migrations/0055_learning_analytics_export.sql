-- Phase 24: 学習履歴の長期分析とデータエクスポート

-- 1. 学習パターン分析テーブル
CREATE TABLE IF NOT EXISTS learning_patterns (
  pattern_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  school_id INTEGER NOT NULL DEFAULT 1,
  analysis_date DATE NOT NULL,
  peak_study_hour INTEGER,
  morning_ratio REAL DEFAULT 0,
  afternoon_ratio REAL DEFAULT 0,
  evening_ratio REAL DEFAULT 0,
  night_ratio REAL DEFAULT 0,
  weekday_activity REAL DEFAULT 0,
  weekend_activity REAL DEFAULT 0,
  study_days_count INTEGER DEFAULT 0,
  max_consecutive_days INTEGER DEFAULT 0,
  subject_diversity_score REAL DEFAULT 0,
  dominant_subject TEXT,
  challenge_preference TEXT DEFAULT 'balanced',
  efficiency_score REAL DEFAULT 0,
  improvement_rate REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_student_date ON learning_patterns(student_id, analysis_date DESC);

-- 2. データエクスポート履歴テーブル
CREATE TABLE IF NOT EXISTS export_history (
  export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  exported_by INTEGER NOT NULL,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL,
  date_from DATE,
  date_to DATE,
  grade TEXT,
  class_code TEXT,
  subjects TEXT,
  is_anonymized INTEGER DEFAULT 0,
  anonymization_level TEXT,
  record_count INTEGER DEFAULT 0,
  file_size INTEGER DEFAULT 0,
  file_url TEXT,
  purpose TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (exported_by) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_export_history_school ON export_history(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(exported_by, created_at DESC);

-- 3. 匿名化マッピングテーブル
CREATE TABLE IF NOT EXISTS anonymization_mapping (
  mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id INTEGER NOT NULL,
  original_student_id INTEGER NOT NULL,
  anonymous_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (export_id) REFERENCES export_history(export_id) ON DELETE CASCADE,
  FOREIGN KEY (original_student_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_anonymization_mapping_export ON anonymization_mapping(export_id);

-- 4. エクスポートテンプレートテーブル
CREATE TABLE IF NOT EXISTS export_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  template_name TEXT NOT NULL,
  description TEXT,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  default_filters TEXT,
  included_fields TEXT,
  is_anonymized INTEGER DEFAULT 0,
  anonymization_level TEXT DEFAULT 'standard',
  is_default INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_export_templates_school ON export_templates(school_id);

-- デフォルトテンプレートの追加
INSERT OR IGNORE INTO export_templates (template_id, school_id, template_name, description, export_type, format, included_fields, is_anonymized, anonymization_level, is_default) VALUES
  (1, 1, '研究用エクスポート', '学術研究用の完全匿名化データ', 'research', 'csv', '["date", "grade", "subject", "accuracy", "time_spent", "difficulty"]', 1, 'full', 1),
  (2, 1, '進捗レポート', '保護者向け学習進捗レポート', 'progress_report', 'excel', '["student_name", "date", "subject", "completed_cards", "accuracy", "study_time"]', 0, 'none', 0),
  (3, 1, '月次統計', '学校全体の月次学習統計', 'monthly_stats', 'json', '["month", "grade", "class", "total_students", "avg_accuracy", "total_study_hours"]', 0, 'standard', 0);
