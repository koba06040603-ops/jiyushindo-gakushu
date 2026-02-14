-- courses テーブル: カリキュラムごとのコース（じっくり/しっかり/ぐんぐん）
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  course_level TEXT NOT NULL DEFAULT 'standard', -- basic, standard, advanced
  description TEXT,
  introduction_problem TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

CREATE INDEX IF NOT EXISTS idx_courses_curriculum_id ON courses(curriculum_id);

-- learning_cards に course_id カラムを追加（既存レコードに影響なし）
-- ALTER TABLE learning_cards ADD COLUMN course_id INTEGER REFERENCES courses(id);
-- NOTE: learning_cards のスキーマが既に別形式の場合、course_id は追加のみ
-- 既にカラムがあればSQLiteはエラーを出すため、try/catchで対応
