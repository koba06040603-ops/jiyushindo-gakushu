-- 0095: Fix missing tables and columns
-- learning_logs table (referenced in code but never created)
CREATE TABLE IF NOT EXISTS learning_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER,
  student_id INTEGER NOT NULL,
  unit_id INTEGER,
  card_id INTEGER,
  course_type TEXT DEFAULT 'unknown',
  is_correct INTEGER DEFAULT 0,
  answer_time_seconds REAL DEFAULT 0,
  hint_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'medium',
  problem_type TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_logs_student ON learning_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_unit ON learning_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_card ON learning_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_created ON learning_logs(created_at);

-- Add missing columns to learning_sessions
ALTER TABLE learning_sessions ADD COLUMN unit_id INTEGER;
ALTER TABLE learning_sessions ADD COLUMN session_id TEXT;
ALTER TABLE learning_sessions ADD COLUMN started_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE learning_sessions ADD COLUMN is_active INTEGER DEFAULT 0;
