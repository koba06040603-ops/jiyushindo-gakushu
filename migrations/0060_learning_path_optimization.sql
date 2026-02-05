-- Phase 12-3: 学習経路の動的最適化
-- 習熟度追跡と学習経路管理

-- 習熟度スコアテーブル
CREATE TABLE IF NOT EXISTS mastery_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  mastery_level INTEGER DEFAULT 0, -- 0-100
  confidence REAL DEFAULT 0, -- 0-1
  last_practiced DATETIME,
  practice_count INTEGER DEFAULT 0,
  correct_rate REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (unit_id) REFERENCES curriculum(id),
  UNIQUE(student_id, unit_id)
);

-- 学習経路履歴テーブル
CREATE TABLE IF NOT EXISTS learning_path_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  recommended_units TEXT NOT NULL, -- JSON array of unit IDs
  weak_areas TEXT, -- JSON array of weak unit IDs
  next_milestone_id INTEGER,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 補強計画テーブル
CREATE TABLE IF NOT EXISTS reinforcement_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  weak_unit_id INTEGER NOT NULL,
  root_causes TEXT, -- JSON array of prerequisite issues
  actions TEXT NOT NULL, -- JSON array of reinforcement actions
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (weak_unit_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_mastery_student ON mastery_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_mastery_unit ON mastery_scores(unit_id);
CREATE INDEX IF NOT EXISTS idx_mastery_level ON mastery_scores(mastery_level);
CREATE INDEX IF NOT EXISTS idx_learning_path_student ON learning_path_history(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_subject ON learning_path_history(subject);
CREATE INDEX IF NOT EXISTS idx_reinforcement_student ON reinforcement_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_reinforcement_status ON reinforcement_plans(status);
