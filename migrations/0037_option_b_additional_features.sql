-- =============================================================================
-- Option B: 追加機能マイグレーション
-- AI生成コンテンツ + マルチモーダル学習
-- =============================================================================

-- AI生成コンテンツテーブル
CREATE TABLE IF NOT EXISTS ai_generated_content (
  content_id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  learning_style TEXT NOT NULL CHECK(learning_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  content_type TEXT NOT NULL CHECK(content_type IN ('problem', 'explanation', 'hint', 'real_world')),
  grade_level INTEGER NOT NULL CHECK(grade_level BETWEEN 1 AND 12),
  difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  visual_elements TEXT,
  audio_script TEXT,
  practice_activity TEXT,
  reading_notes TEXT,
  model TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_content_topic ON ai_generated_content(topic);
CREATE INDEX IF NOT EXISTS idx_ai_content_style ON ai_generated_content(learning_style);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_grade ON ai_generated_content(grade_level);
CREATE INDEX IF NOT EXISTS idx_ai_content_generated ON ai_generated_content(generated_at);

-- マルチモーダル学習設定テーブル
CREATE TABLE IF NOT EXISTS multimodal_preferences (
  student_id INTEGER PRIMARY KEY,
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_rate REAL DEFAULT 1.0 CHECK(tts_rate BETWEEN 0.1 AND 10),
  tts_pitch REAL DEFAULT 1.0 CHECK(tts_pitch BETWEEN 0 AND 2),
  tts_volume REAL DEFAULT 1.0 CHECK(tts_volume BETWEEN 0 AND 1),
  tts_language TEXT DEFAULT 'ja-JP',
  color_scheme TEXT DEFAULT 'light' CHECK(color_scheme IN ('light', 'dark', 'high-contrast')),
  font_size INTEGER DEFAULT 16 CHECK(font_size BETWEEN 12 AND 32),
  line_height REAL DEFAULT 1.6,
  letter_spacing TEXT DEFAULT '0.05em',
  image_zoom_enabled BOOLEAN DEFAULT TRUE,
  text_highlight_color TEXT DEFAULT 'yellow',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_multimodal_student ON multimodal_preferences(student_id);

-- マルチモーダル学習利用ログ
CREATE TABLE IF NOT EXISTS multimodal_usage_log (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  feature_type TEXT NOT NULL CHECK(feature_type IN ('tts', 'stt', 'image_zoom', 'color_scheme', 'font_size')),
  feature_value TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_multimodal_log_student ON multimodal_usage_log(student_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_log_feature ON multimodal_usage_log(feature_type);
CREATE INDEX IF NOT EXISTS idx_multimodal_log_timestamp ON multimodal_usage_log(timestamp);
