-- Migration 0018: 学習カード個別最適化のためのデータ収集基盤
-- Phase 1: MVP - データ収集テーブルの作成

-- 学習ログテーブル（individual learning log entries）
CREATE TABLE IF NOT EXISTS learning_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 学習者情報
  student_id TEXT NOT NULL,
  unit_id TEXT,  -- curriculum_id as unit_id
  card_id TEXT NOT NULL,
  course_type TEXT NOT NULL,  -- じっくり/しっかり/ぐんぐん
  
  -- 解答データ
  is_correct BOOLEAN NOT NULL DEFAULT 0,
  answer_time_seconds INTEGER NOT NULL DEFAULT 0,
  hint_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  
  -- 学習コンテキスト
  difficulty_level TEXT,  -- easy/medium/hard
  problem_type TEXT,      -- calculation/word_problem/application/etc
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_learning_logs_student_unit 
  ON learning_logs(student_id, unit_id);

CREATE INDEX IF NOT EXISTS idx_learning_logs_created_at 
  ON learning_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_learning_logs_card 
  ON learning_logs(card_id);

-- 学習セッションテーブル（session-level data）
CREATE TABLE IF NOT EXISTS learning_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- セッション情報
  student_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,  -- ユニークなセッションID
  
  -- セッション期間
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  
  -- セッション統計
  total_problems INTEGER DEFAULT 0,
  correct_problems INTEGER DEFAULT 0,
  total_hints_used INTEGER DEFAULT 0,
  total_ai_requests INTEGER DEFAULT 0,
  
  -- 学習スタイル（Phase 9との統合）
  preferred_style TEXT,  -- visual/auditory/kinesthetic
  
  -- セッション状態
  is_active BOOLEAN DEFAULT 1,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_learning_sessions_student 
  ON learning_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_active 
  ON learning_sessions(student_id, is_active);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_id 
  ON learning_sessions(session_id);

-- 学習プロファイルテーブル（学習者の特性分析）
CREATE TABLE IF NOT EXISTS student_learning_profiles (
  student_id TEXT PRIMARY KEY,
  
  -- 理解度レベル
  overall_level TEXT DEFAULT 'beginner',  -- beginner/intermediate/advanced
  confidence_score REAL DEFAULT 0.0,  -- 0.0-1.0
  
  -- 学習スタイル（Phase 9との統合）
  learning_style TEXT,  -- visual/auditory/kinesthetic/mixed
  style_confidence REAL DEFAULT 0.0,  -- 0.0-1.0
  
  -- パフォーマンス指標
  avg_correct_rate REAL DEFAULT 0.0,
  avg_answer_time REAL DEFAULT 0.0,
  preferred_difficulty TEXT DEFAULT 'medium',  -- easy/medium/hard
  
  -- 苦手・得意分野（JSON配列）
  weak_areas TEXT DEFAULT '[]',  -- ["calculation", "word_problem"]
  strong_areas TEXT DEFAULT '[]',  -- ["geometry", "logic"]
  
  -- 学習行動パターン
  hint_dependency_score REAL DEFAULT 0.0,  -- 0.0-1.0 (高いほどヒント依存)
  ai_usage_frequency REAL DEFAULT 0.0,  -- 1日あたりの平均AI使用回数
  
  -- メタデータ
  total_problems_solved INTEGER DEFAULT 0,
  total_learning_time_minutes INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 統計更新日時
  stats_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_student_profiles_level 
  ON student_learning_profiles(overall_level);

CREATE INDEX IF NOT EXISTS idx_student_profiles_updated 
  ON student_learning_profiles(last_updated);

-- カードテンプレートテーブル（基本カードセットのキャッシュ）
CREATE TABLE IF NOT EXISTS card_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- カリキュラム情報
  unit_id TEXT NOT NULL,  -- curriculum_id
  course_type TEXT NOT NULL,  -- じっくり/しっかり/ぐんぐん
  
  -- 難易度・タイプ
  difficulty_level TEXT NOT NULL,  -- easy/medium/hard
  problem_type TEXT NOT NULL,      -- calculation/word_problem/application
  
  -- 問題テンプレート（JSON）
  problem_template TEXT NOT NULL,
  answer_template TEXT NOT NULL,
  hints_template TEXT,  -- JSON配列
  explanation_template TEXT,
  
  -- メタデータ
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  usage_count INTEGER DEFAULT 0,  -- 使用回数
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_card_templates_unit_difficulty 
  ON card_templates(unit_id, difficulty_level);

CREATE INDEX IF NOT EXISTS idx_card_templates_active 
  ON card_templates(unit_id, is_active);

-- 個別化カード生成履歴テーブル
CREATE TABLE IF NOT EXISTS personalized_card_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 生成情報
  student_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  card_id TEXT,  -- 実際に使われた学習カードID（NULLの場合は生成のみ）
  
  -- 生成パラメータ（JSON）
  generation_params TEXT NOT NULL,  -- プロファイル、難易度、問題タイプなど
  
  -- 生成結果
  problem_content TEXT,
  answer_content TEXT,
  hints_content TEXT,
  
  -- 生成品質
  ai_model TEXT,  -- gemini-2.0-flash-exp など
  generation_time_ms INTEGER,
  token_usage INTEGER,
  
  -- 使用状況
  was_used BOOLEAN DEFAULT 0,
  was_completed BOOLEAN DEFAULT 0,
  completion_result TEXT,  -- correct/incorrect/skipped
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_personalized_history_student 
  ON personalized_card_history(student_id, unit_id);

CREATE INDEX IF NOT EXISTS idx_personalized_history_created 
  ON personalized_card_history(created_at);
