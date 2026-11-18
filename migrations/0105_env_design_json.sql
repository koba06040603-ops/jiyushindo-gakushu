-- 学習環境デザインを「3機能×事例」の項目（JSON）で保存する列を追加
ALTER TABLE learning_environment_designs ADD COLUMN design_json TEXT DEFAULT '';
