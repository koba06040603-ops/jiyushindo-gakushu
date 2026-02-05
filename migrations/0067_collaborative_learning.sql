-- Phase 21-2: リアルタイム協働学習機能

-- 学習セッションテーブル
CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL,
  creator_student_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  max_participants INTEGER DEFAULT 10,
  status TEXT DEFAULT 'waiting',
  start_time DATETIME,
  end_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- セッション参加者テーブル
CREATE TABLE IF NOT EXISTS session_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  is_active INTEGER DEFAULT 1,
  UNIQUE(session_id, student_id)
);

-- セッション内チャットメッセージ
CREATE TABLE IF NOT EXISTS session_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- セッション内問題テーブル
CREATE TABLE IF NOT EXISTS session_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  problem_order INTEGER NOT NULL,
  problem_text TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options TEXT,
  points INTEGER DEFAULT 10,
  time_limit INTEGER DEFAULT 60,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- セッション内回答履歴
CREATE TABLE IF NOT EXISTS session_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  problem_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  is_correct INTEGER DEFAULT 0,
  time_taken INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
