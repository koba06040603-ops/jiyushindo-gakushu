-- Phase 24: 学習履歴の長期分析とデータエクスポート

-- 1. 長期学習分析用のビュー
CREATE VIEW IF NOT EXISTS v_learning_history_summary AS
SELECT 
  pa.student_id,
  u.name as student_name,
  u.grade,
  u.class_code,
  DATE(pa.answered_at) as date,
  strftime('%Y-%m', pa.answered_at) as month,
  strftime('%Y-W%W', pa.answered_at) as week,
  c.subject,
  COUNT(*) as total_problems,
  SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
  AVG(CASE WHEN pa.is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy_rate,
  AVG(pa.time_spent_seconds) as avg_time_spent,
  SUM(pa.time_spent_seconds) as total_time_spent
FROM answer_history pa
JOIN users u ON pa.student_id = u.id
JOIN learning_cards lc ON pa.card_id = lc.id
JOIN courses c ON lc.course_id = c.id
GROUP BY pa.student_id, DATE(pa.answered_at), c.subject;

-- 2. 月別学習統計ビュー
CREATE VIEW IF NOT EXISTS v_monthly_learning_stats AS
SELECT 
  student_id,
  month,
  subject,
  SUM(total_problems) as monthly_problems,
  AVG(accuracy_rate) as monthly_accuracy,
  SUM(total_time_spent) / 3600.0 as monthly_hours
FROM v_learning_history_summary
GROUP BY student_id, month, subject;

-- 3. 成長曲線分析用ビュー（累積データ）
CREATE VIEW IF NOT EXISTS v_growth_curve AS
SELECT 
  student_id,
  date,
  subject,
  SUM(total_problems) OVER (
    PARTITION BY student_id, subject 
    ORDER BY date
  ) as cumulative_problems,
  AVG(accuracy_rate) OVER (
    PARTITION BY student_id, subject 
    ORDER BY date 
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as rolling_7day_accuracy
FROM v_learning_history_summary;

-- 4. 学習パターン分析テーブル
CREATE TABLE IF NOT EXISTS learning_patterns (
  pattern_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  analysis_date DATE NOT NULL,
  
  -- 学習時間帯パターン
  peak_hour INTEGER,
  morning_ratio REAL,      -- 6-12時の学習割合
  afternoon_ratio REAL,    -- 12-18時
  evening_ratio REAL,      -- 18-24時
  night_ratio REAL,        -- 0-6時
  
  -- 曜日パターン
  weekday_ratio REAL,
  weekend_ratio REAL,
  most_active_day TEXT,
  
  -- 学習継続性
  study_days_count INTEGER,
  max_consecutive_days INTEGER,
  avg_daily_problems REAL,
  
  -- 教科バランス
  subject_diversity REAL,  -- 教科の多様性（0-1）
  dominant_subject TEXT,
  
  -- 難易度選好
  challenge_preference TEXT, -- 'basic', 'standard', 'advanced'
  
  -- 学習効率
  efficiency_score REAL,   -- 正答率 × 問題数 / 時間
  improvement_rate REAL,   -- 月次改善率
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_student ON learning_patterns(student_id, analysis_date DESC);

-- 5. エクスポート履歴テーブル
CREATE TABLE IF NOT EXISTS export_history (
  export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  exported_by INTEGER,  -- user_id
  export_type TEXT NOT NULL, -- 'individual', 'class', 'school', 'anonymized'
  format TEXT NOT NULL,      -- 'csv', 'json', 'excel'
  
  -- フィルター条件
  date_from DATE,
  date_to DATE,
  grade TEXT,
  class_code TEXT,
  subjects TEXT,            -- JSON array
  
  -- 匿名化設定
  is_anonymized INTEGER DEFAULT 0,
  anonymization_level TEXT, -- 'basic', 'standard', 'full'
  
  -- エクスポート結果
  record_count INTEGER,
  file_size INTEGER,
  file_url TEXT,
  
  -- メタデータ
  purpose TEXT,            -- 研究目的など
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME     -- ファイルの有効期限
);

CREATE INDEX IF NOT EXISTS idx_export_history_school ON export_history(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(exported_by, created_at DESC);

-- 6. 匿名化マッピングテーブル（研究用）
CREATE TABLE IF NOT EXISTS anonymization_mapping (
  mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id INTEGER NOT NULL,
  original_student_id INTEGER NOT NULL,
  anonymous_id TEXT NOT NULL,      -- A001, A002, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (export_id) REFERENCES export_history(export_id)
);

CREATE INDEX IF NOT EXISTS idx_anonymization_export ON anonymization_mapping(export_id);

-- 7. 統計サマリーテーブル（高速アクセス用）
CREATE TABLE IF NOT EXISTS learning_statistics_cache (
  cache_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  period_type TEXT NOT NULL,  -- 'daily', 'weekly', 'monthly', 'yearly'
  period_value TEXT NOT NULL, -- '2026-02', '2026-W05', etc.
  subject TEXT,
  
  -- 統計データ
  total_problems INTEGER,
  correct_problems INTEGER,
  accuracy_rate REAL,
  total_time_minutes INTEGER,
  avg_time_per_problem REAL,
  
  -- ランキング
  class_rank INTEGER,
  grade_rank INTEGER,
  
  -- 達成度
  goal_achievement_rate REAL,
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE(student_id, period_type, period_value, subject)
);

CREATE INDEX IF NOT EXISTS idx_stats_cache_student_period ON learning_statistics_cache(student_id, period_type, period_value DESC);

-- 8. トリガー: 統計キャッシュの自動更新
CREATE TRIGGER IF NOT EXISTS update_stats_cache_on_answer
AFTER INSERT ON answer_history
BEGIN
  -- 日次統計を更新
  INSERT OR REPLACE INTO learning_statistics_cache (
    student_id, period_type, period_value, subject,
    total_problems, correct_problems, accuracy_rate,
    total_time_minutes, avg_time_per_problem
  )
  SELECT 
    NEW.student_id,
    'daily',
    DATE(NEW.answered_at),
    c.subject,
    COUNT(*),
    SUM(CASE WHEN pa.is_correct = 1 THEN 1 ELSE 0 END),
    AVG(CASE WHEN pa.is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100,
    SUM(pa.time_spent_seconds) / 60,
    AVG(pa.time_spent_seconds)
  FROM answer_history pa
  JOIN learning_cards lc ON pa.card_id = lc.id
  JOIN courses c ON lc.course_id = c.id
  WHERE pa.student_id = NEW.student_id
    AND DATE(pa.answered_at) = DATE(NEW.answered_at)
    AND c.subject = (SELECT subject FROM courses WHERE id = (SELECT course_id FROM learning_cards WHERE id = NEW.card_id))
  GROUP BY pa.student_id, DATE(pa.answered_at), c.subject;
END;

-- 9. 初期データ: エクスポートテンプレート
CREATE TABLE IF NOT EXISTS export_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'research', 'progress_report', 'admin'
  
  -- エクスポート設定（JSON）
  settings TEXT NOT NULL,
  
  -- フィールド選択
  included_fields TEXT NOT NULL, -- JSON array
  
  is_public INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- デフォルトテンプレート
INSERT OR IGNORE INTO export_templates (school_id, template_name, template_type, settings, included_fields, is_public) VALUES
  (1, '研究用エクスポート（完全匿名化）', 'research', 
   '{"anonymization_level":"full","exclude_personal_info":true}',
   '["date","grade","subject","accuracy_rate","time_spent","problem_type"]',
   1),
  
  (1, '学習進捗レポート', 'progress_report',
   '{"anonymization_level":"none","include_student_names":true}',
   '["student_name","date","subject","problems_solved","accuracy_rate","time_spent","streak"]',
   0),
  
  (1, '管理者用統計', 'admin',
   '{"anonymization_level":"basic","aggregate_by":"class"}',
   '["class_code","grade","subject","avg_accuracy","total_problems","active_students"]',
   0);
