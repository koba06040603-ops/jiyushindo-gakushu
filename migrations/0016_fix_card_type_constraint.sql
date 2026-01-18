-- card_typeとdifficulty_levelの制約を緩和
-- SQLiteではCHECK制約を直接変更できないため、テーブルを再作成

-- 0. 外部キー制約を一時的に無効化
PRAGMA foreign_keys = OFF;

-- 1. 依存するビューを全て削除
DROP VIEW IF EXISTS v_curriculum_completeness;
DROP VIEW IF EXISTS v_student_learning_stats;
DROP VIEW IF EXISTS v_class_progress_summary;
DROP VIEW IF EXISTS v_progress_board;

-- 2. 一時テーブルを作成（制約緩和）
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
  difficulty_level TEXT,  -- CHECK制約を削除
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

-- 3. データをコピー（既存カラム名に対応）
INSERT INTO learning_cards_new (
  id, course_id, card_number, card_title, card_type,
  new_terms, example_problem, example_solution,
  problem_description, answer, difficulty_level, real_world_connection,
  textbook_page, hints,
  visual_support, auditory_support, kinesthetic_support, learning_style_notes,
  created_at, updated_at
)
SELECT 
  id, course_id, card_number, card_title, card_type,
  new_terms, example_problem, example_solution,
  problem_content,  -- 本番はproblem_content
  NULL as answer,  -- 本番にはanswerカラムがない
  difficulty_level,
  real_world_context,  -- 本番はreal_world_context
  textbook_page,
  NULL as hints,  -- 本番にはhintsカラムがない
  visual_content,  -- 本番のvisual_content
  auditory_content,  -- 本番のauditory_content
  kinesthetic_content,  -- 本番のkinesthetic_content
  multimodal_tips,  -- 本番のmultimodal_tips
  created_at,
  created_at as updated_at  -- 本番にはupdated_atがない
FROM learning_cards;

-- 4. 古いテーブルを削除
DROP TABLE learning_cards;

-- 5. 新しいテーブルをリネーム
ALTER TABLE learning_cards_new RENAME TO learning_cards;

-- 6. インデックスを再作成
CREATE INDEX IF NOT EXISTS idx_learning_cards_course_id ON learning_cards(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_card_type ON learning_cards(card_type);

-- 7. ビューを再作成
CREATE VIEW IF NOT EXISTS v_progress_board AS
SELECT 
  sp.id,
  sp.student_id,
  u.name as student_name,
  sp.curriculum_id,
  cur.unit_name,
  sp.learning_card_id,
  lc.card_title,
  sp.understanding_level,
  sp.completion_time,
  sp.updated_at
FROM student_progress sp
JOIN users u ON sp.student_id = u.id
JOIN curriculum cur ON sp.curriculum_id = cur.id
LEFT JOIN learning_cards lc ON sp.learning_card_id = lc.id
ORDER BY sp.updated_at DESC;

CREATE VIEW IF NOT EXISTS v_curriculum_completeness AS
SELECT 
  c.id as curriculum_id,
  c.unit_name,
  c.grade,
  c.subject,
  COUNT(DISTINCT co.id) as course_count,
  COUNT(DISTINCT lc.id) as card_count
FROM curriculum c
LEFT JOIN courses co ON c.id = co.curriculum_id
LEFT JOIN learning_cards lc ON co.id = lc.course_id
GROUP BY c.id;

-- 8. 外部キー制約を再度有効化
PRAGMA foreign_keys = ON;
