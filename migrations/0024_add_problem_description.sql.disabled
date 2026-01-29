-- learning_cardsテーブルにproblem_descriptionカラムを追加

-- problem_descriptionカラムが存在しない場合のみ追加
ALTER TABLE learning_cards ADD COLUMN problem_description TEXT DEFAULT '';

-- 既存データのproblem_descriptionにproblem_contentをコピー
UPDATE learning_cards SET problem_description = problem_content WHERE problem_description = '' OR problem_description IS NULL;
