PRAGMA foreign_keys=OFF;

-- Drop problematic triggers temporarily
DROP TRIGGER IF EXISTS update_card_media_count_on_insert;
DROP TRIGGER IF EXISTS update_card_media_count_on_delete;
DROP TRIGGER IF EXISTS notify_learning_start;
DROP TRIGGER IF EXISTS notify_learning_end;
DROP TRIGGER IF EXISTS update_video_stats_on_complete;

-- Swap tables
DROP TABLE IF EXISTS learning_cards_backup;
ALTER TABLE learning_cards RENAME TO learning_cards_backup;
ALTER TABLE learning_cards_new RENAME TO learning_cards;
DROP TABLE learning_cards_backup;

PRAGMA foreign_keys=ON;
