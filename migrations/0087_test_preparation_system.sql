-- テスト対策計画テーブル
CREATE TABLE IF NOT EXISTS test_preparation_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'テスト対策',
  test_date DATE,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  textbook_company TEXT,
  curriculum_ids TEXT DEFAULT '[]',
  custom_topics TEXT DEFAULT '[]',
  study_schedule TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','archived')),
  total_study_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- テスト対策の学習記録
CREATE TABLE IF NOT EXISTS test_study_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  study_minutes INTEGER DEFAULT 0,
  confidence_before INTEGER DEFAULT 3 CHECK(confidence_before BETWEEN 1 AND 5),
  confidence_after INTEGER CHECK(confidence_after BETWEEN 1 AND 5),
  understanding_level INTEGER CHECK(understanding_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id) ON DELETE CASCADE
);

-- テスト結果フィードバック
CREATE TABLE IF NOT EXISTS test_performance_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score INTEGER,
  max_score INTEGER DEFAULT 100,
  weakness_areas TEXT DEFAULT '[]',
  strength_areas TEXT DEFAULT '[]',
  ai_recommendations TEXT DEFAULT '[]',
  reflection TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id) ON DELETE CASCADE
);

-- メタ認知記録
CREATE TABLE IF NOT EXISTS metacognition_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,
  phase TEXT NOT NULL CHECK(phase IN ('pre_study','during_study','post_study')),
  planned_topics TEXT DEFAULT '[]',
  confidence_level INTEGER DEFAULT 3 CHECK(confidence_level BETWEEN 1 AND 5),
  difficulty_encountered INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  understanding_level INTEGER CHECK(understanding_level BETWEEN 1 AND 5),
  needs_review INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_test_plans_student ON test_preparation_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_test_plans_status ON test_preparation_plans(status);
CREATE INDEX IF NOT EXISTS idx_test_study_logs_plan ON test_study_logs(plan_id);
CREATE INDEX IF NOT EXISTS idx_test_feedback_plan ON test_performance_feedback(plan_id);
CREATE INDEX IF NOT EXISTS idx_metacognition_student ON metacognition_logs(student_id);
