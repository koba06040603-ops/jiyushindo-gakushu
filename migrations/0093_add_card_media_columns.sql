-- learning_cards テーブルに画像・動画カラムを追加
-- 教師がカードに直接画像や動画を添付できるようにする

-- 問題画像URL
ALTER TABLE learning_cards ADD COLUMN problem_image_url TEXT;

-- 解答画像URL
ALTER TABLE learning_cards ADD COLUMN answer_image_url TEXT;
