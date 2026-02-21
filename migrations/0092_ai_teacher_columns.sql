-- AI Teacher / ヒント / 先生ヘルプ用カラムの追加
-- learning_cards テーブルに ai_teacher_message, ai_teacher_advice, teacher_help_keywords を追加

ALTER TABLE learning_cards ADD COLUMN ai_teacher_message TEXT DEFAULT '';
ALTER TABLE learning_cards ADD COLUMN ai_teacher_advice TEXT DEFAULT '';
ALTER TABLE learning_cards ADD COLUMN teacher_help_keywords TEXT DEFAULT '';
