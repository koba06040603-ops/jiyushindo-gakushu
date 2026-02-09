-- Phase 26: クラス全体の学習進捗比較ビュー

-- 1. クラス統計テーブル
CREATE TABLE IF NOT EXISTS class_statistics (
  stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  class_code TEXT NOT NULL,
  grade TEXT NOT NULL,
  stat_date DATE NOT NULL,
  stat_period TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  
  -- 参加状況
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  inactive_students INTEGER DEFAULT 0,
  
  -- 学習量統計
  total_problems_solved INTEGER DEFAULT 0,
  avg_problems_per_student REAL DEFAULT 0,
  total_study_minutes INTEGER DEFAULT 0,
  avg_study_minutes_per_student REAL DEFAULT 0,
  
  -- 正答率統計
  overall_accuracy REAL DEFAULT 0,
  accuracy_std_dev REAL DEFAULT 0,
  median_accuracy REAL DEFAULT 0,
  
  -- 教科別統計（JSON）
  subject_stats TEXT, -- JSON: {"math": {"accuracy": 85, "problems": 120}, ...}
  
  -- 習熟度分布
  mastery_distribution TEXT, -- JSON: {"beginner": 5, "intermediate": 15, "advanced": 10}
  
  -- ランキング情報
  top_performers TEXT, -- JSON: [{"student_id": 1, "score": 95}, ...]
  most_improved TEXT,  -- JSON: [{"student_id": 2, "improvement": 15}, ...]
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(class_code, stat_date, stat_period)
);

CREATE INDEX IF NOT EXISTS idx_class_stats_class_date ON class_statistics(class_code, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_class_stats_grade_date ON class_statistics(grade, stat_date DESC);

-- 2. 学生進捗比較テーブル（匿名化対応）
CREATE TABLE IF NOT EXISTS student_progress_comparison (
  comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  class_code TEXT NOT NULL,
  comparison_date DATE NOT NULL,
  
  -- 個人スコア
  total_problems INTEGER DEFAULT 0,
  accuracy_rate REAL DEFAULT 0,
  study_minutes INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  
  -- クラス内順位
  class_rank INTEGER,
  class_percentile REAL,
  
  -- 学年内順位（オプション）
  grade_rank INTEGER,
  grade_percentile REAL,
  
  -- 比較指標
  vs_class_avg_accuracy REAL, -- クラス平均との差分
  vs_class_avg_problems REAL,
  vs_class_avg_minutes REAL,
  
  -- 教科別クラス順位（JSON）
  subject_ranks TEXT, -- {"math": 5, "japanese": 3, ...}
  
  -- 習熟度レベル
  mastery_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  UNIQUE(student_id, comparison_date)
);

CREATE INDEX IF NOT EXISTS idx_progress_comparison_student ON student_progress_comparison(student_id, comparison_date DESC);
CREATE INDEX IF NOT EXISTS idx_progress_comparison_class ON student_progress_comparison(class_code, comparison_date DESC);

-- 3. ヒートマップデータテーブル
CREATE TABLE IF NOT EXISTS class_heatmap_data (
  heatmap_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  class_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT NOT NULL,
  stat_date DATE NOT NULL,
  
  -- ヒートマップデータ（JSON）
  -- {"student_1": 85, "student_2": 92, "student_3": 78, ...}
  -- 匿名化オプション: {"student_A": 85, "student_B": 92, ...}
  student_scores TEXT NOT NULL,
  
  -- 統計情報
  avg_score REAL DEFAULT 0,
  min_score REAL DEFAULT 0,
  max_score REAL DEFAULT 0,
  std_dev REAL DEFAULT 0,
  
  -- 難易度情報
  difficulty_level TEXT DEFAULT 'standard',
  total_problems INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(class_code, subject, unit, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_heatmap_class_subject ON class_heatmap_data(class_code, subject, stat_date DESC);

-- 4. 習熟度レベル定義テーブル
CREATE TABLE IF NOT EXISTS mastery_level_criteria (
  criteria_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  grade TEXT,
  
  -- レベル定義
  level_name TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  display_name TEXT NOT NULL, -- '初級', '中級', '上級'
  
  -- 判定基準
  min_accuracy REAL NOT NULL,
  max_accuracy REAL NOT NULL,
  min_problems INTEGER,
  min_study_hours REAL,
  
  -- 色設定（UI用）
  color_code TEXT DEFAULT '#4CAF50',
  
  -- 説明
  description TEXT,
  
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(school_id, subject, grade, level_name)
);

-- デフォルトの習熟度基準を挿入
INSERT OR IGNORE INTO mastery_level_criteria (school_id, subject, level_name, display_name, min_accuracy, max_accuracy, color_code) VALUES
  (1, 'all', 'beginner', '初級', 0, 60, '#FF5252'),
  (1, 'all', 'intermediate', '中級', 60, 80, '#FFC107'),
  (1, 'all', 'advanced', '上級', 80, 100, '#4CAF50');

-- 5. クラス比較ビュー設定テーブル
CREATE TABLE IF NOT EXISTS class_comparison_views (
  view_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER NOT NULL,
  view_name TEXT NOT NULL,
  
  -- 比較対象
  class_codes TEXT NOT NULL, -- JSON array: ["3-A", "3-B"]
  
  -- 表示設定
  display_mode TEXT DEFAULT 'heatmap', -- 'heatmap', 'chart', 'table'
  anonymize_students INTEGER DEFAULT 0,
  show_rankings INTEGER DEFAULT 1,
  show_names INTEGER DEFAULT 1,
  
  -- フィルター設定
  subjects TEXT, -- JSON array
  date_range_days INTEGER DEFAULT 30,
  
  -- 通知設定
  notify_on_outliers INTEGER DEFAULT 0,
  outlier_threshold REAL DEFAULT 2.0, -- 標準偏差
  
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_comparison_views_teacher ON class_comparison_views(teacher_id);

-- 6. トリガー: クラス統計の自動更新（日次バッチ処理想定）
-- 実際の更新はアプリケーション側で定期実行するため、トリガーはコメントアウト
-- CREATE TRIGGER IF NOT EXISTS update_class_stats_daily
-- AFTER INSERT ON answer_history
-- BEGIN
--   -- 日次統計の更新ロジック
-- END;
