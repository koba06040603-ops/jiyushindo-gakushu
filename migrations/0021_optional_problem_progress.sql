-- Migration 0021: 選択問題の進捗記録と復習の努力評価

-- 選択問題進捗テーブル
CREATE TABLE IF NOT EXISTS optional_problem_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 学習者と問題情報
  student_id TEXT NOT NULL,
  curriculum_id INTEGER NOT NULL,
  optional_problem_id INTEGER NOT NULL,
  
  -- 進捗情報
  status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed')),
  attempts_count INTEGER DEFAULT 0,  -- 挑戦回数
  is_completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  
  -- 評価情報
  understanding_level INTEGER DEFAULT 0 CHECK(understanding_level BETWEEN 0 AND 5),  -- 0-5の理解度
  time_spent_minutes INTEGER DEFAULT 0,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (optional_problem_id) REFERENCES optional_problems(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_optional_progress_student_curriculum 
  ON optional_problem_progress(student_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_optional_progress_problem 
  ON optional_problem_progress(optional_problem_id);

-- 学習カード復習記録テーブル（クリア済みカードの「もう一度練習」を記録）
CREATE TABLE IF NOT EXISTS card_review_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- 学習者とカード情報
  student_id TEXT NOT NULL,
  card_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  
  -- 復習情報
  review_type TEXT DEFAULT 'similar_problem' CHECK(review_type IN ('similar_problem', 'retry', 'self_study')),
  is_already_cleared BOOLEAN DEFAULT 1,  -- このカードは既にクリア済みか
  
  -- 取り組み結果
  is_correct BOOLEAN,
  answer_time_seconds INTEGER DEFAULT 0,
  hint_count INTEGER DEFAULT 0,
  
  -- 評価ポイント（復習の努力を評価）
  effort_points INTEGER DEFAULT 1,  -- 復習1回につき1ポイント
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (card_id) REFERENCES learning_cards(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_card_review_student_card 
  ON card_review_logs(student_id, card_id);

CREATE INDEX IF NOT EXISTS idx_card_review_curriculum 
  ON card_review_logs(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_card_review_created_at 
  ON card_review_logs(created_at);

-- 学習統計ビュー（選択問題と復習を含む総合統計）
CREATE VIEW IF NOT EXISTS student_learning_stats AS
SELECT 
  sp.student_id,
  sp.curriculum_id,
  -- 基本カード進捗
  COUNT(DISTINCT sp.learning_card_id) as completed_cards,
  AVG(sp.understanding_level) as avg_understanding,
  SUM(sp.help_count) as total_help_requests,
  -- 選択問題進捗
  (SELECT COUNT(*) FROM optional_problem_progress opp 
   WHERE opp.student_id = sp.student_id 
   AND opp.curriculum_id = sp.curriculum_id 
   AND opp.is_completed = 1) as completed_optional_problems,
  -- 復習努力
  (SELECT COUNT(*) FROM card_review_logs crl 
   WHERE crl.student_id = sp.student_id 
   AND crl.curriculum_id = sp.curriculum_id) as review_count,
  (SELECT SUM(effort_points) FROM card_review_logs crl 
   WHERE crl.student_id = sp.student_id 
   AND crl.curriculum_id = sp.curriculum_id) as total_effort_points,
  -- タイムスタンプ
  MAX(sp.created_at) as last_activity_at
FROM student_progress sp
GROUP BY sp.student_id, sp.curriculum_id;
