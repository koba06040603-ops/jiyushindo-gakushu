-- テスト対策プランシステム + メタ認知支援テーブル
-- Phase: Task 2 - テスト対策と学習システムの連携

-- テスト対策プラン
CREATE TABLE IF NOT EXISTS test_preparation_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'テスト対策',
  test_date DATE,
  grade TEXT,
  subject TEXT,
  textbook_company TEXT,
  curriculum_ids TEXT,     -- JSON配列: [123, 456, 789]
  custom_topics TEXT,      -- JSON配列: ["追加項目1", "追加項目2"]
  all_topics TEXT,         -- JSON配列: 全学習項目（DBからの単元名+カスタム項目）
  ai_schedule TEXT,        -- JSON: AI生成の学習スケジュール
  daily_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active',  -- active, in_progress, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- テスト対策の学習ログ
CREATE TABLE IF NOT EXISTS test_study_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  study_minutes INTEGER DEFAULT 0,
  confidence_before INTEGER DEFAULT 3,   -- 1-5
  confidence_after INTEGER DEFAULT 3,    -- 1-5
  understanding_level INTEGER DEFAULT 3, -- 1-5
  focus_level INTEGER,                   -- 1-5 集中度
  fatigue_level INTEGER,                 -- 1-5 疲労度
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id)
);

-- テスト結果フィードバック
CREATE TABLE IF NOT EXISTS test_performance_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score REAL,
  max_score REAL DEFAULT 100,
  weakness_areas TEXT,       -- JSON配列
  strength_areas TEXT,       -- JSON配列
  reflection TEXT,           -- 自由記述の振り返り
  ai_recommendations TEXT,   -- JSON配列: AI生成の改善提案
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id)
);

-- メタ認知ログ
CREATE TABLE IF NOT EXISTS metacognition_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,
  phase TEXT NOT NULL,         -- pre_study, during_study, post_study
  planned_topics TEXT,         -- JSON配列
  confidence_level INTEGER,    -- 1-5
  difficulty_encountered INTEGER DEFAULT 0,
  time_spent_minutes INTEGER,
  understanding_level INTEGER,
  needs_review INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_test_plans_student ON test_preparation_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_test_plans_status ON test_preparation_plans(status);
CREATE INDEX IF NOT EXISTS idx_test_study_logs_plan ON test_study_logs(plan_id);
CREATE INDEX IF NOT EXISTS idx_test_study_logs_student ON test_study_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_test_feedback_plan ON test_performance_feedback(plan_id);
CREATE INDEX IF NOT EXISTS idx_metacognition_student ON metacognition_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_metacognition_plan ON metacognition_logs(plan_id);
