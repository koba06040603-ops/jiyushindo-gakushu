-- Phase 17A: メディアタグ管理テーブル
-- 作成日時: 2026-01-30

-- タグマスターテーブル
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- 'subject', 'theme', 'skill', 'difficulty', etc.
  color TEXT, -- UI表示用カラーコード
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- メディアファイル管理テーブル
CREATE TABLE IF NOT EXISTS media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL UNIQUE, -- R2のキー（images/xxx.jpg, videos/xxx.mp4）
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  file_size INTEGER, -- バイト数
  mime_type TEXT,
  title TEXT,
  description TEXT,
  ai_generated_tags TEXT, -- AI生成タグのJSON配列
  ai_description TEXT, -- AI生成の説明
  ai_category TEXT, -- AI生成のカテゴリ
  uploaded_by TEXT, -- ユーザーID（将来実装）
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- メディアとタグの多対多関係テーブル
CREATE TABLE IF NOT EXISTS media_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(media_id, tag_id) -- 同じタグを複数回付けられないように
);

-- インデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_media_files_r2_key ON media_files(r2_key);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_at ON media_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_media_tags_media_id ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag_id ON media_tags(tag_id);

-- 初期タグデータ（よく使われるタグを事前登録）
INSERT OR IGNORE INTO tags (name, category, color) VALUES
  -- 教科
  ('算数', 'subject', '#3B82F6'),
  ('国語', 'subject', '#10B981'),
  ('理科', 'subject', '#F59E0B'),
  ('社会', 'subject', '#EF4444'),
  ('英語', 'subject', '#8B5CF6'),
  ('音楽', 'subject', '#EC4899'),
  ('図工', 'subject', '#06B6D4'),
  ('体育', 'subject', '#84CC16'),
  
  -- テーマ
  ('計算', 'theme', '#60A5FA'),
  ('図形', 'theme', '#34D399'),
  ('文法', 'theme', '#FBBF24'),
  ('実験', 'theme', '#F87171'),
  ('地理', 'theme', '#A78BFA'),
  ('歴史', 'theme', '#F472B6'),
  
  -- スキル
  ('思考力', 'skill', '#38BDF8'),
  ('表現力', 'skill', '#4ADE80'),
  ('読解力', 'skill', '#FACC15'),
  ('観察力', 'skill', '#FB923C'),
  
  -- 難易度
  ('基礎', 'difficulty', '#22C55E'),
  ('標準', 'difficulty', '#3B82F6'),
  ('発展', 'difficulty', '#EF4444')
;

-- トリガー: updated_at自動更新
CREATE TRIGGER IF NOT EXISTS update_tags_timestamp 
AFTER UPDATE ON tags
BEGIN
  UPDATE tags SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_media_files_timestamp 
AFTER UPDATE ON media_files
BEGIN
  UPDATE media_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
