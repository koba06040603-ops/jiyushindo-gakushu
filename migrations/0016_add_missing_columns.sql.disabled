-- learning_cardsテーブルに不足しているカラムを追加

-- answerカラムを追加
ALTER TABLE learning_cards ADD COLUMN answer TEXT DEFAULT '';

-- NULL値を空文字列に統一
UPDATE learning_cards SET answer = '' WHERE answer IS NULL;
UPDATE learning_cards SET problem_description = '' WHERE problem_description IS NULL;
UPDATE learning_cards SET real_world_connection = '' WHERE real_world_connection IS NULL;

-- 既存データの移行（problem_content → problem_description）
-- problem_descriptionが空の場合のみコピー
UPDATE learning_cards 
SET problem_description = problem_content 
WHERE (problem_description IS NULL OR problem_description = '') 
  AND problem_content IS NOT NULL 
  AND problem_content != '';
