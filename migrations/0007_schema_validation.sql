-- スキーマ検証と修正マイグレーション

-- 1. optional_problemsテーブルのproblem_content必須制約の確認
-- 既存データでNULLがあれば空文字列で埋める
UPDATE optional_problems SET problem_content = '' WHERE problem_content IS NULL;
UPDATE optional_problems SET problem_description = '' WHERE problem_description IS NULL;

-- 2. learning_cardsテーブルに不足しているカラムを追加
-- problem_descriptionカラムの追加（既存のproblem_contentから移行）
-- ALTER TABLE learning_cards ADD COLUMN problem_description TEXT DEFAULT '';
-- 既にあるので確認のみ

-- 3. learning_cardsテーブルにanswerカラムを追加（必須）
-- ALTER TABLE learning_cards ADD COLUMN answer TEXT DEFAULT '';
-- 既にあるので確認のみ

-- 4. learning_cardsテーブルにreal_world_connectionカラムを追加
-- ALTER TABLE learning_cards ADD COLUMN real_world_connection TEXT DEFAULT '';
-- 既にあるので確認のみ

-- 5. coursesテーブルにdescriptionカラムを追加（既存の場合はスキップ）
-- ALTER TABLE courses ADD COLUMN description TEXT DEFAULT '';

-- 6. coursesテーブルにcolor_codeカラムを追加（既存の場合はスキップ）
-- ALTER TABLE courses ADD COLUMN color_code TEXT DEFAULT 'blue';

-- 7. coursesテーブルにcourse_nameカラムを追加（既に0005で追加済み）
-- ALTER TABLE courses ADD COLUMN course_name TEXT DEFAULT '';

-- 8. coursesテーブルにintroduction_problemカラムを追加（既に0006で追加済み）
-- ALTER TABLE courses ADD COLUMN introduction_problem TEXT;

-- 9. インデックスの最適化
CREATE INDEX IF NOT EXISTS idx_optional_problems_curriculum ON optional_problems(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_card_number ON learning_cards(card_number);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(course_level);

-- 10. データ整合性チェック用のビュー
CREATE VIEW IF NOT EXISTS v_curriculum_completeness AS
SELECT 
  c.id as curriculum_id,
  c.unit_name,
  COUNT(DISTINCT co.id) as course_count,
  COUNT(DISTINCT lc.id) as card_count,
  COUNT(DISTINCT op.id) as optional_problem_count,
  COUNT(DISTINCT cm.id) as metadata_count
FROM curriculum c
LEFT JOIN courses co ON c.id = co.curriculum_id
LEFT JOIN learning_cards lc ON co.id = lc.course_id
LEFT JOIN optional_problems op ON c.id = op.curriculum_id
LEFT JOIN curriculum_metadata cm ON c.id = cm.curriculum_id
GROUP BY c.id;
