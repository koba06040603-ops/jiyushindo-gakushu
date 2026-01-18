-- card_typeの制約を緩和
-- SQLiteではCHECK制約を直接変更できないため、テーブルを再作成

-- 0. 依存するビューを全て削除
DROP VIEW IF EXISTS v_curriculum_completeness;
DROP VIEW IF EXISTS v_student_learning_stats;
DROP VIEW IF EXISTS v_class_progress_summary;
DROP VIEW IF EXISTS v_progress_board;

-- 1. 一時テーブルを作成（制約なし）
CREATE TABLE IF NOT EXISTS learning_cards_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  card_number INTEGER NOT NULL,
  card_title TEXT NOT NULL,
  card_type TEXT NOT NULL,  -- CHECK制約を削除
  new_terms TEXT,
  example_problem TEXT,
  example_solution TEXT,
  problem_description TEXT,
  answer TEXT,
  difficulty_level TEXT CHECK(difficulty_level IN ('basic', 'standard', 'advanced')),
  real_world_connection TEXT,
  textbook_page TEXT,
  hints TEXT,
  visual_support TEXT,
  auditory_support TEXT,
  kinesthetic_support TEXT,
  learning_style_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 2. データをコピー（既存カラム名を使用）
INSERT INTO learning_cards_new (
  id, course_id, card_number, card_title, card_type,
  new_terms, example_problem, example_solution,
  problem_description, difficulty_level, real_world_connection,
  created_at
)
SELECT 
  id, course_id, card_number, card_title, card_type,
  new_terms, example_problem, example_solution,
  problem_content,
  difficulty_level,
  real_world_context,
  created_at
FROM learning_cards;

-- 3. 古いテーブルを削除
DROP TABLE learning_cards;

-- 4. 新しいテーブルをリネーム
ALTER TABLE learning_cards_new RENAME TO learning_cards;

-- 5. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_learning_cards_course_id ON learning_cards(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_card_type ON learning_cards(card_type);
