-- ========================================
-- Phase 12-1: AIチューター会話履歴テーブル
-- ========================================

-- AIチューター会話履歴テーブル
CREATE TABLE IF NOT EXISTS ai_tutor_conversations (
  conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  subject TEXT,
  unit_name TEXT,
  ai_source TEXT NOT NULL CHECK(ai_source IN ('workers-ai', 'huggingface', 'rule-based')),
  confidence REAL NOT NULL DEFAULT 0.0,
  feedback_rating INTEGER CHECK(feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  school_id INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_ai_tutor_student_id ON ai_tutor_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_created_at ON ai_tutor_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_subject ON ai_tutor_conversations(subject);
CREATE INDEX IF NOT EXISTS idx_ai_tutor_school_id ON ai_tutor_conversations(school_id);
