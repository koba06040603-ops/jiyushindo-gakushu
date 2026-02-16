-- ====================================================================
-- 初期診断（個別最適化アンケート）結果テーブル
-- 児童が単元開始時に回答する VARK学習スタイル / 非認知能力 / 自己調整 / レディネス
-- この結果は問題生成AIプロンプトに注入され、個別最適化の起点となる
-- ====================================================================

CREATE TABLE IF NOT EXISTS initial_diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  unit_name TEXT,
  subject TEXT,
  grade TEXT,
  -- VARK学習スタイル
  learning_style_dominant TEXT DEFAULT 'balanced',  -- visual/auditory/kinesthetic/read_write/balanced
  learning_style_counts TEXT,  -- JSON: {"visual":2,"kinesthetic":1,...}
  -- 非認知能力
  resilience INTEGER DEFAULT 3,  -- 1-5 チャレンジ度
  error_strategy TEXT DEFAULT 'hint',  -- retry/hint/friend/skip
  -- 自己調整
  preferred_pace TEXT DEFAULT 'steady',  -- slow/steady/fast
  session_length TEXT DEFAULT 'medium',  -- short/medium/long
  -- レディネス
  prior_knowledge INTEGER DEFAULT 3,  -- 1-5 既有知識
  subject_affinity INTEGER DEFAULT 3,  -- 1-5 教科好感度
  -- 全回答データ（RAW）
  raw_answers TEXT,  -- JSON: {"ls1":"visual","ls2":"kinesthetic","nc1":4,...}
  -- AI分析結果
  ai_profile_summary TEXT,  -- AI生成の児童プロフィール要約
  -- メタ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_initial_diag_student ON initial_diagnostics(student_id);
CREATE INDEX IF NOT EXISTS idx_initial_diag_student_curriculum ON initial_diagnostics(student_id, curriculum_id);

-- ====================================================================
-- 児童解答記録テーブル（student-home.htmlから直接記録）
-- learning_logs や retrieval_practice_log とは別に、
-- カード単位の正誤・時間を簡潔に記録し、適応的出題に利用
-- ====================================================================

CREATE TABLE IF NOT EXISTS student_card_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  card_id INTEGER,
  plan_id INTEGER,
  hour_number INTEGER,
  is_correct INTEGER DEFAULT 0,  -- 0=不正解, 1=正解
  answer_time_seconds INTEGER DEFAULT 0,
  content_type TEXT DEFAULT 'card',  -- card/check_test/selection_task
  problem_number INTEGER,  -- チェックテスト問題番号
  hint_used INTEGER DEFAULT 0,
  difficulty_felt TEXT,  -- easy/medium/hard（児童の主観）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sca_student ON student_card_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_sca_student_curriculum ON student_card_answers(student_id, curriculum_id);
CREATE INDEX IF NOT EXISTS idx_sca_card ON student_card_answers(card_id);
