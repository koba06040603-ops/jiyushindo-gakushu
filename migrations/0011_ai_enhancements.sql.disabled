-- 0011_ai_enhancements.sql
-- AI機能拡張のためのマイグレーション

-- AI対話履歴テーブル
CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  learning_card_id INTEGER,
  session_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK(message_type IN ('question', 'answer')),
  message_text TEXT NOT NULL,
  context_data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_student ON ai_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_card ON ai_conversations(learning_card_id);

-- 自動生成された問題テーブル
CREATE TABLE IF NOT EXISTS ai_generated_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  course_id INTEGER,
  problem_type TEXT NOT NULL CHECK(problem_type IN ('intro', 'practice', 'challenge', 'check_test', 'optional')),
  problem_title TEXT NOT NULL,
  problem_content TEXT NOT NULL,
  problem_solution TEXT,
  difficulty_level INTEGER DEFAULT 2 CHECK(difficulty_level BETWEEN 1 AND 4),
  generated_by TEXT DEFAULT 'gemini',
  generation_prompt TEXT,
  is_approved INTEGER DEFAULT 0,
  approved_by INTEGER,
  approved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_curriculum ON ai_generated_problems(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_course ON ai_generated_problems(course_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_approved ON ai_generated_problems(is_approved);

-- AI使用統計テーブル
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  learning_card_id INTEGER,
  feature_type TEXT NOT NULL CHECK(feature_type IN ('teacher', 'reflection', 'problem_generation')),
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_student ON ai_usage_stats(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_stats(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_stats(created_at);

-- AIフィードバック品質評価テーブル
CREATE TABLE IF NOT EXISTS ai_feedback_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  conversation_id INTEGER,
  usage_stat_id INTEGER,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id),
  FOREIGN KEY (usage_stat_id) REFERENCES ai_usage_stats(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_student ON ai_feedback_ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback_ratings(rating);
