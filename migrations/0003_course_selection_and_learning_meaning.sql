-- コース選択問題とチェックテスト、学習意味を保存するためのマイグレーション

-- optional_problemsテーブルに新しいカラムを追加
ALTER TABLE optional_problems ADD COLUMN difficulty_level TEXT DEFAULT 'medium';
ALTER TABLE optional_problems ADD COLUMN learning_meaning TEXT DEFAULT '';

-- カリキュラムメタデータテーブル（コース選択問題とチェックテストを保存）
CREATE TABLE IF NOT EXISTS curriculum_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  metadata_key TEXT NOT NULL,
  metadata_value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  UNIQUE(curriculum_id, metadata_key)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_metadata_curriculum_id ON curriculum_metadata(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_metadata_key ON curriculum_metadata(metadata_key);

-- coursesテーブルに新しいカラムを追加（コースのラベル）
ALTER TABLE courses ADD COLUMN course_label TEXT DEFAULT '';

-- learning_cardsテーブルに教科書ページを追加
ALTER TABLE learning_cards ADD COLUMN textbook_page TEXT DEFAULT '';
