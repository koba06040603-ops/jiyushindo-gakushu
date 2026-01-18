-- 学習スタイル対応の拡張マイグレーション

-- learning_cardsテーブルに学習スタイル関連フィールドを追加
ALTER TABLE learning_cards ADD COLUMN learning_style_tags TEXT; -- 'visual,auditory,kinesthetic'
ALTER TABLE learning_cards ADD COLUMN visual_content TEXT; -- 視覚優位向けコンテンツ（図解、色分け説明）
ALTER TABLE learning_cards ADD COLUMN auditory_content TEXT; -- 聴覚優位向けコンテンツ（音声ガイド、リズム）
ALTER TABLE learning_cards ADD COLUMN kinesthetic_content TEXT; -- 体感優位向けコンテンツ（アクティビティ）
ALTER TABLE learning_cards ADD COLUMN multimodal_tips TEXT; -- 複合的なヒント

-- 学習者の学習スタイルプロフィールを保存
CREATE TABLE IF NOT EXISTS learning_style_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  visual_score INTEGER DEFAULT 0, -- 視覚優位スコア (0-100)
  auditory_score INTEGER DEFAULT 0, -- 聴覚優位スコア (0-100)
  kinesthetic_score INTEGER DEFAULT 0, -- 体感優位スコア (0-100)
  dominant_style TEXT, -- 'visual', 'auditory', 'kinesthetic', 'balanced'
  assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 学習スタイル診断結果
CREATE TABLE IF NOT EXISTS learning_style_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  style_indicated TEXT, -- 'visual', 'auditory', 'kinesthetic'
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 学習スタイル別の学習効果追跡
CREATE TABLE IF NOT EXISTS style_based_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  style_used TEXT NOT NULL, -- 'visual', 'auditory', 'kinesthetic', 'mixed'
  understanding_level INTEGER, -- 1-5
  completion_time INTEGER, -- 秒
  help_requested BOOLEAN DEFAULT 0,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- 学習スタイル別のカードレコメンデーション
CREATE TABLE IF NOT EXISTS style_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  recommended_style TEXT NOT NULL, -- 'visual', 'auditory', 'kinesthetic'
  effectiveness_score REAL, -- 0.0-1.0
  based_on_data_points INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_learning_style_profiles_user 
  ON learning_style_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_style_based_performance_student 
  ON style_based_performance(student_id);

CREATE INDEX IF NOT EXISTS idx_style_based_performance_card 
  ON style_based_performance(card_id);

CREATE INDEX IF NOT EXISTS idx_style_recommendations_card 
  ON style_recommendations(card_id);
