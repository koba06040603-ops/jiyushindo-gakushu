-- Phase 21-3: AI学習アシスタント（チャットボット）

-- チャット会話テーブル
CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  conversation_title TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- チャットメッセージテーブル
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AIアシスタントのパーソナリティ設定
CREATE TABLE IF NOT EXISTS assistant_personalities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  tone TEXT DEFAULT 'friendly',
  emoji_usage INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0
);

-- 生徒ごとのAIアシスタント設定
CREATE TABLE IF NOT EXISTS student_assistant_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  personality_id INTEGER DEFAULT 1,
  preferred_language TEXT DEFAULT 'ja',
  help_level TEXT DEFAULT 'medium',
  motivation_frequency TEXT DEFAULT 'normal',
  UNIQUE(student_id)
);

-- よくある質問（FAQ）テーブル
CREATE TABLE IF NOT EXISTS assistant_faq (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- チャットログの分析用テーブル
CREATE TABLE IF NOT EXISTS chat_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question_category TEXT NOT NULL,
  sentiment TEXT,
  response_helpful INTEGER,
  session_date DATE DEFAULT (date('now'))
);
