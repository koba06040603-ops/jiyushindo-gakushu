-- ========================================
-- Phase 12-2: 自動問題生成システム
-- ========================================

-- 生成済み問題テーブル
CREATE TABLE IF NOT EXISTS generated_problems (
  problem_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  subject TEXT NOT NULL,
  unit_name TEXT,
  problem_type TEXT NOT NULL,
  hints TEXT, -- JSON形式
  is_attempted BOOLEAN DEFAULT 0,
  is_correct BOOLEAN DEFAULT 0,
  user_answer TEXT,
  attempted_at DATETIME,
  school_id INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_generated_problems_student_id ON generated_problems(student_id);
CREATE INDEX IF NOT EXISTS idx_generated_problems_subject ON generated_problems(subject);
CREATE INDEX IF NOT EXISTS idx_generated_problems_difficulty ON generated_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_generated_problems_school_id ON generated_problems(school_id);
CREATE INDEX IF NOT EXISTS idx_generated_problems_created_at ON generated_problems(created_at);
