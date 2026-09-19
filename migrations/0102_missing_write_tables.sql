-- ============================================================
-- 本番に存在しない「書き込みのあるテーブル」を追加（2026-09-19 第2次）
-- ------------------------------------------------------------
-- 0101 でローカル定義のある59テーブルを同期したが、
-- ローカルにも存在しない（＝どの環境にも無い）テーブルが128件残っていた。
-- そのうち INSERT / UPDATE が実際に行われるものは、動作時に必ず失敗する。
--
-- 特に answer_history は児童の解答保存に使われており（参照36箇所）、
-- 存在しないため解答が保存できていなかった。
--
-- 列はコード内の INSERT 文から逆算して定義している。
-- 読み取り専用のテーブル（problems / progress / cards / learning_profiles 等）は
-- 未実装機能または別名参照の可能性が高いため、本マイグレーションでは作らない。
-- ============================================================

-- 児童の解答履歴（最重要: 参照36箇所・解答保存の本体）
CREATE TABLE IF NOT EXISTS answer_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  card_id INTEGER,
  curriculum_id INTEGER,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  feedback_text TEXT,
  feedback_score REAL,
  time_spent_seconds INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_answer_history_student ON answer_history(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_answer_history_curriculum ON answer_history(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_card ON answer_history(card_id);

-- AI生成問題（参照26箇所）
CREATE TABLE IF NOT EXISTS generated_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER DEFAULT 1,
  student_id INTEGER,
  curriculum_id INTEGER,
  course_id INTEGER,
  grade TEXT,
  subject TEXT,
  unit_name TEXT,
  textbook_company TEXT,
  problem_type TEXT,
  problem_content TEXT,
  problem_description TEXT,
  question TEXT,
  options TEXT,
  answer TEXT,
  correct_answer TEXT,
  explanation TEXT,
  hints TEXT,
  difficulty TEXT,
  difficulty_level TEXT,
  learning_meaning TEXT,
  theory_aligned INTEGER DEFAULT 0,
  theory_codes TEXT,
  generated_by TEXT,
  generation_params TEXT,
  is_approved INTEGER DEFAULT 0,
  is_attempted INTEGER DEFAULT 0,
  is_correct INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_generated_problems_student ON generated_problems(student_id);
CREATE INDEX IF NOT EXISTS idx_generated_problems_curriculum ON generated_problems(curriculum_id);

-- 生徒の解答（セッション単位）
CREATE TABLE IF NOT EXISTS student_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  student_id INTEGER,
  problem_id INTEGER,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_student_answers_student ON student_answers(student_id);

-- AI利用統計
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  learning_card_id INTEGER,
  feature_type TEXT,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_created ON ai_usage_stats(created_at);

-- まちがいノート
CREATE TABLE IF NOT EXISTS mistake_notebook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  subject TEXT,
  unit_name TEXT,
  original_question TEXT,
  original_answer TEXT,
  student_answer TEXT,
  correct_answer TEXT,
  mistake_type TEXT,
  difficulty TEXT,
  mastery_level INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  next_review_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mistake_notebook_student ON mistake_notebook(student_id);

-- テスト結果
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  test_id INTEGER,
  test_type TEXT,
  score REAL,
  max_score REAL,
  percentage REAL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_test_results_student ON test_results(student_id);

-- 友だちの解答（協働学習）
CREATE TABLE IF NOT EXISTS peer_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER,
  answer_text TEXT,
  approach_type TEXT,
  is_public INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_peer_answers_card ON peer_answers(card_id);

-- レコメンド
CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  target_role TEXT,
  recommendation_type TEXT,
  title TEXT,
  description TEXT,
  action_items TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recommendations_student ON recommendations(student_id);

-- 記述式解答
CREATE TABLE IF NOT EXISTS essay_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  answer_text TEXT,
  answer_length INTEGER DEFAULT 0,
  writing_time INTEGER DEFAULT 0,
  is_submitted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_essay_answers_student ON essay_answers(student_id);
