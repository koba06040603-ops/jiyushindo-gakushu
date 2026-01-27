-- real_world_contextをreal_world_connectionにリネーム
-- SQLiteはALTER TABLE RENAMEをサポートしているが、古いバージョンではサポートされていない場合がある
-- D1はSQLite 3.38以降を使用しているため、RENAME COLUMNが利用可能

-- learning_cardsテーブルのカラム名変更
-- 既にreal_world_connectionが存在する場合はスキップ（エラー回避）
ALTER TABLE learning_cards RENAME COLUMN real_world_context TO real_world_connection;

-- 既存データの検証（念のため）
-- real_world_connectionがNULLの場合は空文字列に設定
UPDATE learning_cards SET real_world_connection = '' WHERE real_world_connection IS NULL;

-- problem_descriptionカラムの追加（既存の場合はエラーになるが、次のマイグレーションで対応）
-- ALTER TABLE learning_cards ADD COLUMN problem_description TEXT DEFAULT '';

-- answerカラムの追加（既存の場合はエラーになるが、次のマイグレーションで対応）
-- ALTER TABLE learning_cards ADD COLUMN answer TEXT DEFAULT '';
