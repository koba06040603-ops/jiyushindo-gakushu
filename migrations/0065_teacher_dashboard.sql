-- Phase 20-3: 教師向け管理ダッシュボード

-- 1. 教師テーブル（既存のteachersテーブルを拡張）
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL UNIQUE,
  display_name TEXT,
  subject_specialties TEXT, -- JSON array: ["数学", "理科"]
  classes_assigned TEXT, -- JSON array: クラスIDのリスト
  notification_preferences TEXT, -- JSON: 通知設定
  dashboard_settings TEXT, -- JSON: ダッシュボード表示設定
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 2. クラス学習状況サマリー（教師用）
CREATE TABLE IF NOT EXISTS class_learning_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  summary_date DATE NOT NULL,
  
  -- 学習状況統計
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0, -- 今週活動した生徒数
  total_problems_solved INTEGER DEFAULT 0,
  average_accuracy REAL DEFAULT 0.0, -- クラス平均正答率
  average_study_time INTEGER DEFAULT 0, -- 平均学習時間（分）
  
  -- 進捗状況
  on_track_count INTEGER DEFAULT 0, -- 順調な生徒数
  behind_count INTEGER DEFAULT 0, -- 遅れている生徒数
  ahead_count INTEGER DEFAULT 0, -- 進んでいる生徒数
  
  -- 教科別統計（JSON）
  subject_statistics TEXT,
  
  -- 注意が必要な生徒リスト（JSON）
  students_needing_attention TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  UNIQUE(class_id, teacher_id, summary_date)
);

-- 3. 生徒詳細レポート（教師用）
CREATE TABLE IF NOT EXISTS student_detail_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  report_date DATE NOT NULL,
  
  -- 学習状況
  total_study_time INTEGER DEFAULT 0, -- 今週の学習時間（分）
  problems_solved INTEGER DEFAULT 0,
  correct_rate REAL DEFAULT 0.0,
  streak_days INTEGER DEFAULT 0,
  
  -- 強み・弱み
  strong_subjects TEXT, -- JSON
  weak_subjects TEXT, -- JSON
  improvement_areas TEXT, -- JSON
  
  -- 行動パターン
  study_pattern TEXT, -- 'morning', 'afternoon', 'evening', 'late_night'
  consistency_score REAL, -- 学習の一貫性スコア
  engagement_level TEXT, -- 'high', 'medium', 'low'
  
  -- 予測・推奨
  predicted_performance TEXT, -- 予測成績
  recommended_actions TEXT, -- 推奨アクション（JSON）
  
  -- 教師コメント
  teacher_notes TEXT,
  teacher_flags TEXT, -- JSON: 要注意フラグなど
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  UNIQUE(student_id, teacher_id, report_date)
);

-- 4. 宿題管理テーブル
CREATE TABLE IF NOT EXISTS homework_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER,
  assignment_name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  unit_name TEXT,
  
  -- 問題設定
  problem_type TEXT, -- 'multiple_choice', 'short_answer', 'essay'
  difficulty TEXT,
  problem_count INTEGER,
  problem_ids TEXT, -- JSON array: 指定問題のIDリスト
  
  -- 期限設定
  assigned_date DATE NOT NULL,
  due_date DATE NOT NULL,
  estimated_time INTEGER, -- 想定所要時間（分）
  
  -- ターゲット
  target_students TEXT, -- JSON: 対象生徒のIDリスト（nullの場合はクラス全員）
  
  -- ステータス
  is_published INTEGER DEFAULT 0,
  published_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 5. 宿題提出状況テーブル
CREATE TABLE IF NOT EXISTS homework_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homework_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- 提出状況
  status TEXT CHECK(status IN ('not_started', 'in_progress', 'submitted', 'late', 'graded')),
  progress_percentage REAL DEFAULT 0.0,
  
  -- 提出内容
  answers_json TEXT, -- 解答内容（JSON）
  submission_time DATETIME,
  time_spent INTEGER, -- 実際にかかった時間（分）
  
  -- 採点結果
  score INTEGER,
  max_score INTEGER,
  accuracy REAL,
  graded_at DATETIME,
  
  -- フィードバック
  teacher_feedback TEXT,
  ai_feedback TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (homework_id) REFERENCES homework_assignments(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(homework_id, student_id)
);

-- 6. 教師アクションログ
CREATE TABLE IF NOT EXISTS teacher_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'view_report', 'assign_homework', 'send_message', 'grade_assignment'
  target_type TEXT, -- 'student', 'class', 'homework'
  target_id INTEGER,
  action_details TEXT, -- JSON
  action_result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 7. クラス比較分析テーブル
CREATE TABLE IF NOT EXISTS class_comparison (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  comparison_date DATE NOT NULL,
  class_ids TEXT NOT NULL, -- JSON array: 比較対象クラス
  
  -- 比較指標
  metrics_json TEXT, -- JSON: 各種比較指標
  
  -- 分析結果
  insights TEXT, -- 分析結果の要約
  recommendations TEXT, -- 推奨アクション
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_teacher ON teacher_profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_class ON class_learning_summary(class_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_teacher ON class_learning_summary(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_summary_date ON class_learning_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_student_reports_student ON student_detail_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_teacher ON student_detail_reports(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher ON homework_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_class ON homework_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_due ON homework_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_homework ON homework_submissions(homework_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON homework_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON homework_submissions(status);
CREATE INDEX IF NOT EXISTS idx_teacher_actions_teacher ON teacher_actions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_actions_type ON teacher_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_class_comparison_teacher ON class_comparison(teacher_id);
