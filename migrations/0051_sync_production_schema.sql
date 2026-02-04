-- Phase 8-2: Production環境とLocal環境のスキーマ同期
-- Production環境にのみ存在するテーブルをLocal環境に追加

-- answers テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS answers (
  answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  answer_text TEXT,
  is_correct INTEGER DEFAULT 0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- card_review_logs テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS card_review_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  review_result TEXT,
  next_review_date DATE,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- curriculum_metadata テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS curriculum_metadata (
  metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  meta_key TEXT NOT NULL,
  meta_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- evaluations テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS evaluations (
  evaluation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  teacher_id INTEGER,
  evaluation_type TEXT DEFAULT 'formative',
  subject TEXT,
  score REAL,
  max_score REAL,
  comments TEXT,
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- hint_cards テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS hint_cards (
  hint_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  hint_level INTEGER DEFAULT 1,
  hint_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id)
);

-- optional_problems テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS optional_problems (
  problem_id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER,
  problem_title TEXT NOT NULL,
  problem_type TEXT DEFAULT 'optional',
  difficulty_level TEXT DEFAULT 'standard',
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- user_sessions テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- users テーブル (Production側から同期)
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  user_type TEXT DEFAULT 'student',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 既存テーブルにschool_idが無い場合に追加（Production側で存在する可能性）
-- answers
ALTER TABLE answers ADD COLUMN school_id INTEGER DEFAULT 1;

-- card_review_logs
ALTER TABLE card_review_logs ADD COLUMN school_id INTEGER DEFAULT 1;

-- evaluations
ALTER TABLE evaluations ADD COLUMN school_id INTEGER DEFAULT 1;

-- hint_cards
ALTER TABLE hint_cards ADD COLUMN school_id INTEGER DEFAULT 1;

-- optional_problems
ALTER TABLE optional_problems ADD COLUMN school_id INTEGER DEFAULT 1;

-- users
ALTER TABLE users ADD COLUMN school_id INTEGER DEFAULT 1;

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_answers_card_id ON answers(card_id);
CREATE INDEX IF NOT EXISTS idx_answers_student_id ON answers(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_school_id ON answers(school_id);

CREATE INDEX IF NOT EXISTS idx_card_review_logs_card_id ON card_review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_card_review_logs_student_id ON card_review_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_card_review_logs_school_id ON card_review_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_curriculum_metadata_curriculum_id ON curriculum_metadata(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher_id ON evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_school_id ON evaluations(school_id);

CREATE INDEX IF NOT EXISTS idx_hint_cards_card_id ON hint_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_hint_cards_school_id ON hint_cards(school_id);

CREATE INDEX IF NOT EXISTS idx_optional_problems_unit_id ON optional_problems(unit_id);
CREATE INDEX IF NOT EXISTS idx_optional_problems_school_id ON optional_problems(school_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
