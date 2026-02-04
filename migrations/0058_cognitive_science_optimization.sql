-- Phase 15: 認知科学ベースの学習最適化
-- 間隔反復学習、検索練習、交互学習のサポート

-- 間隔反復学習カード
CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
  card_id TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('concept', 'problem', 'vocabulary')),
  content_id TEXT NOT NULL,
  content_title TEXT NOT NULL,
  easiness_factor REAL DEFAULT 2.5 CHECK(easiness_factor >= 1.3),
  interval INTEGER DEFAULT 1 CHECK(interval >= 0),
  repetitions INTEGER DEFAULT 0 CHECK(repetitions >= 0),
  next_review_date TEXT NOT NULL,
  last_review_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_sr_student_next_review 
ON spaced_repetition_cards(student_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_sr_content 
ON spaced_repetition_cards(content_type, content_id);

-- 復習履歴
CREATE TABLE IF NOT EXISTS review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  student_id INTEGER NOT NULL,
  quality INTEGER NOT NULL CHECK(quality BETWEEN 0 AND 5),
  easiness_factor REAL NOT NULL,
  interval INTEGER NOT NULL,
  review_date TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES spaced_repetition_cards(card_id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_review_history_student 
ON review_history(student_id, review_date);

-- 検索練習セッション
CREATE TABLE IF NOT EXISTS retrieval_practice_sessions (
  session_id TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  question_count INTEGER DEFAULT 0,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_rp_sessions_student 
ON retrieval_practice_sessions(student_id, started_at);

-- 交互学習セッション
CREATE TABLE IF NOT EXISTS interleaving_sessions (
  session_id TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL,
  subjects TEXT NOT NULL, -- JSON配列
  problem_count INTEGER DEFAULT 0,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_interleaving_sessions_student 
ON interleaving_sessions(student_id, started_at);

-- 精緻化プロンプト
CREATE TABLE IF NOT EXISTS elaboration_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  concept TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK(prompt_type IN ('explain', 'example', 'analogy', 'application')),
  student_response TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_elaboration_student 
ON elaboration_prompts(student_id, created_at);
