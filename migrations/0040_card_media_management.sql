-- =============================================================================
-- Migration 0040: 学習カードメディア管理機能
-- 学習カードに画像・動画を追加できる機能のためのテーブル
-- =============================================================================

-- 学習カード画像テーブル（既存のvideo_contentsを拡張）
CREATE TABLE IF NOT EXISTS card_images (
  image_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT CHECK(image_type IN ('illustration', 'diagram', 'photo', 'generated')) DEFAULT 'illustration',
  alt_text TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  generation_prompt TEXT, -- AI生成の場合のプロンプト
  generated_by TEXT, -- 生成AI名（gemini, dalle, etc.）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_card_images_card_id ON card_images(card_id);
CREATE INDEX IF NOT EXISTS idx_card_images_active ON card_images(card_id, is_active);

-- 学習カードメディアメタデータテーブル（統合管理）
CREATE TABLE IF NOT EXISTS card_media_metadata (
  metadata_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  media_type TEXT CHECK(media_type IN ('image', 'video', 'audio')) NOT NULL,
  media_id INTEGER NOT NULL, -- card_images.image_id または video_contents.video_id
  file_size_bytes INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- 動画・音声の場合
  uploaded_by INTEGER, -- teacher_id
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES teachers(teacher_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_card_media_card_id ON card_media_metadata(card_id);
CREATE INDEX IF NOT EXISTS idx_card_media_type ON card_media_metadata(card_id, media_type);

-- AI生成画像履歴テーブル
CREATE TABLE IF NOT EXISTS ai_generated_images (
  generation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  card_id INTEGER,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  ai_model TEXT DEFAULT 'gemini-pro-vision',
  image_url TEXT NOT NULL,
  generation_time_ms INTEGER,
  generation_cost REAL, -- クレジット消費量
  generation_params TEXT, -- JSONパラメータ（サイズ、スタイルなど）
  is_used BOOLEAN DEFAULT FALSE, -- カードに使用されたか
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_generated_teacher ON ai_generated_images(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_card ON ai_generated_images(card_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_used ON ai_generated_images(is_used);

-- 学習カード編集履歴テーブル（既存のcurriculum_edit_historyを拡張）
CREATE TABLE IF NOT EXISTS card_edit_history (
  history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  edited_by INTEGER NOT NULL, -- teacher_id
  edit_type TEXT CHECK(edit_type IN ('create', 'update_content', 'add_media', 'remove_media', 'reorder_media')) NOT NULL,
  before_data TEXT, -- JSON
  after_data TEXT, -- JSON
  change_summary TEXT,
  edited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id) ON DELETE CASCADE,
  FOREIGN KEY (edited_by) REFERENCES teachers(teacher_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_card_edit_card_id ON card_edit_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_edit_teacher ON card_edit_history(edited_by);
CREATE INDEX IF NOT EXISTS idx_card_edit_date ON card_edit_history(edited_at);

-- 既存のlearning_cardsテーブルに新しいカラムを追加（存在しない場合のみ）
-- ALTER TABLE learning_cards ADD COLUMN has_media BOOLEAN DEFAULT FALSE;
-- ALTER TABLE learning_cards ADD COLUMN primary_image_url TEXT;
-- ALTER TABLE learning_cards ADD COLUMN media_count INTEGER DEFAULT 0;

-- トリガー: メディア追加時にlearning_cardsを更新
CREATE TRIGGER IF NOT EXISTS update_card_media_count_on_insert
AFTER INSERT ON card_images
WHEN NEW.is_active = TRUE
BEGIN
  UPDATE learning_cards
  SET media_count = (
    SELECT COUNT(*) 
    FROM card_images 
    WHERE card_id = NEW.card_id AND is_active = TRUE
  )
  WHERE card_id = NEW.card_id;
  
  -- 最初の画像をprimary_image_urlに設定
  UPDATE learning_cards
  SET primary_image_url = NEW.image_url
  WHERE card_id = NEW.card_id 
    AND (primary_image_url IS NULL OR primary_image_url = '');
END;

-- トリガー: メディア削除時にlearning_cardsを更新
CREATE TRIGGER IF NOT EXISTS update_card_media_count_on_delete
AFTER UPDATE ON card_images
WHEN NEW.is_active = FALSE AND OLD.is_active = TRUE
BEGIN
  UPDATE learning_cards
  SET media_count = (
    SELECT COUNT(*) 
    FROM card_images 
    WHERE card_id = NEW.card_id AND is_active = TRUE
  )
  WHERE card_id = NEW.card_id;
END;

-- サンプルデータ（オプション）
-- INSERT INTO card_images (card_id, image_url, image_type, alt_text, caption, display_order)
-- VALUES 
--   (1, 'https://example.com/math-diagram.png', 'diagram', '三角形の図', '直角三角形の各辺の関係', 1),
--   (2, 'https://example.com/science-photo.jpg', 'photo', '実験器具', '理科実験で使う器具一覧', 1);

-- 完了メッセージ
SELECT '✅ Migration 0040: 学習カードメディア管理機能 - 完了' as status;
