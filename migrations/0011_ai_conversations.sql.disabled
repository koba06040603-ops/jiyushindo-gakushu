-- AI対話履歴テーブル
CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  learning_card_id INTEGER,
  message_type TEXT NOT NULL,  -- 'question' or 'answer'
  message_text TEXT NOT NULL,
  context_data TEXT,  -- JSON format
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE,
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id) ON DELETE SET NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student ON ai_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON ai_conversations(created_at);

-- 自動問題生成履歴テーブル
CREATE TABLE IF NOT EXISTS generated_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  course_id INTEGER,
  problem_description TEXT NOT NULL,
  problem_content TEXT NOT NULL,
  learning_meaning TEXT,
  answer TEXT,
  difficulty_level TEXT,
  generated_by INTEGER NOT NULL,
  generation_params TEXT,
  is_approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_generated_problems_curriculum ON generated_problems(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_generated_problems_course ON generated_problems(course_id);
CREATE INDEX IF NOT EXISTS idx_generated_problems_generated_by ON generated_problems(generated_by);
CREATE INDEX IF NOT EXISTS idx_generated_problems_created ON generated_problems(created_at);
