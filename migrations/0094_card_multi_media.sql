-- 学習カードに複数メディア（画像・動画・音声）を添付可能にする
-- media_items: JSON配列 [{type:"image"|"video"|"audio", url:"...", label:"...", order:0}, ...]

ALTER TABLE learning_cards ADD COLUMN media_items TEXT DEFAULT '[]';
