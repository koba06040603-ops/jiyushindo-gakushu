-- 個人レポート用の誤答履歴テーブル
CREATE TABLE IF NOT EXISTS error_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK(question_type IN ('learning_card', 'check_test', 'optional')),
  question_id INTEGER NOT NULL,
  question_number INTEGER,
  answer_text TEXT NOT NULL,
  correct_answer TEXT,
  is_correct INTEGER NOT NULL DEFAULT 0,
  error_pattern TEXT,
  ai_feedback TEXT,
  teacher_comment TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_error_history_student ON error_history(student_id);
CREATE INDEX IF NOT EXISTS idx_error_history_curriculum ON error_history(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_error_history_type ON error_history(question_type);
