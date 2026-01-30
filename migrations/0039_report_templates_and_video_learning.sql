-- =============================================================================
-- Migration 0039: カスタマイズ可能なレポートテンプレート & 動画学習コンテンツ統合
-- Date: 2026-01-30
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. カスタマイズ可能なレポートテンプレート
-- -----------------------------------------------------------------------------

-- レポートテンプレート定義テーブル
CREATE TABLE IF NOT EXISTS report_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK(template_type IN ('weekly', 'monthly', 'term', 'custom')),
  created_by INTEGER NOT NULL, -- 教師ID（teachers.teacher_idを参照）
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- テンプレートセクション定義テーブル
CREATE TABLE IF NOT EXISTS report_template_sections (
  section_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  section_key TEXT NOT NULL, -- 'summary', 'charts', 'comparison', 'prediction', etc.
  section_title TEXT NOT NULL,
  section_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  section_config TEXT, -- JSON設定（グラフタイプ、表示項目など）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES report_templates(template_id) ON DELETE CASCADE
);

-- テンプレート共有設定テーブル
CREATE TABLE IF NOT EXISTS report_template_shares (
  share_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  shared_with_user_id INTEGER, -- 共有先ユーザーID
  shared_with_school_id INTEGER,
  permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES report_templates(template_id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_school_id) REFERENCES schools(school_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON report_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_report_template_sections_template_id ON report_template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_report_template_shares_template_id ON report_template_shares(template_id);

-- -----------------------------------------------------------------------------
-- 2. 動画学習コンテンツ統合
-- -----------------------------------------------------------------------------

-- 動画コンテンツテーブル
CREATE TABLE IF NOT EXISTS video_contents (
  video_id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  video_title TEXT NOT NULL,
  video_url TEXT NOT NULL, -- YouTube URL, Vimeo URL, or Cloudflare Stream URL
  video_platform TEXT NOT NULL CHECK(video_platform IN ('youtube', 'vimeo', 'cloudflare_stream', 'custom')),
  video_duration_seconds INTEGER,
  thumbnail_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES learning_cards(card_id) ON DELETE CASCADE
);

-- 動画視聴履歴テーブル
CREATE TABLE IF NOT EXISTS video_watch_history (
  watch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  session_id TEXT, -- 学習セッションID
  watch_start_time DATETIME NOT NULL,
  watch_end_time DATETIME,
  watch_duration_seconds INTEGER DEFAULT 0, -- 実際に視聴した時間
  completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 完了率 (0.00 - 100.00)
  playback_speed DECIMAL(3,2) DEFAULT 1.00, -- 再生速度 (0.25, 0.5, 1.0, 1.5, 2.0)
  paused_count INTEGER DEFAULT 0, -- 一時停止回数
  rewind_count INTEGER DEFAULT 0, -- 巻き戻し回数
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES video_contents(video_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 動画内インタラクション（クイズ・質問）テーブル
CREATE TABLE IF NOT EXISTS video_interactions (
  interaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  interaction_type TEXT NOT NULL CHECK(interaction_type IN ('quiz', 'question', 'pause_point', 'hotspot')),
  interaction_time_seconds INTEGER NOT NULL, -- 動画内の表示タイミング
  interaction_data TEXT NOT NULL, -- JSON形式（質問内容、選択肢、正解など）
  is_required BOOLEAN DEFAULT FALSE, -- 必須インタラクションか
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES video_contents(video_id) ON DELETE CASCADE
);

-- 動画インタラクション回答履歴
CREATE TABLE IF NOT EXISTS video_interaction_responses (
  response_id INTEGER PRIMARY KEY AUTOINCREMENT,
  interaction_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  watch_id INTEGER NOT NULL,
  response_data TEXT NOT NULL, -- JSON形式（回答内容）
  is_correct BOOLEAN,
  response_time DATETIME NOT NULL,
  FOREIGN KEY (interaction_id) REFERENCES video_interactions(interaction_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (watch_id) REFERENCES video_watch_history(watch_id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_video_contents_card_id ON video_contents(card_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_history_video_id ON video_watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_video_watch_history_student_id ON video_watch_history(student_id);
CREATE INDEX IF NOT EXISTS idx_video_interactions_video_id ON video_interactions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_interaction_responses_interaction_id ON video_interaction_responses(interaction_id);
CREATE INDEX IF NOT EXISTS idx_video_interaction_responses_student_id ON video_interaction_responses(student_id);

-- -----------------------------------------------------------------------------
-- 3. デフォルトレポートテンプレート挿入
-- -----------------------------------------------------------------------------

-- デフォルト週次レポートテンプレート
INSERT OR IGNORE INTO report_templates (template_id, template_name, template_type, created_by, is_public, is_default)
VALUES (1, '標準週次レポート', 'weekly', 1, TRUE, TRUE);

INSERT OR IGNORE INTO report_template_sections (template_id, section_key, section_title, section_order, is_enabled)
VALUES 
  (1, 'summary', '学習サマリー', 1, TRUE),
  (1, 'parent_message', '保護者向けメッセージ', 2, TRUE),
  (1, 'learning_style', '学習スタイル分析', 3, TRUE),
  (1, 'charts', 'グラフ・チャート', 4, TRUE),
  (1, 'subject_performance', '教科別パフォーマンス', 5, TRUE),
  (1, 'comparison', '比較分析', 6, TRUE),
  (1, 'prediction', 'AI予測', 7, TRUE),
  (1, 'achievements', '達成実績', 8, TRUE),
  (1, 'challenges', '改善ポイント', 9, TRUE),
  (1, 'ai_interactions', 'AI教師とのやりとり', 10, TRUE);

-- デフォルト月次レポートテンプレート
INSERT OR IGNORE INTO report_templates (template_id, template_name, template_type, created_by, is_public, is_default)
VALUES (2, '標準月次レポート', 'monthly', 1, TRUE, TRUE);

INSERT OR IGNORE INTO report_template_sections (template_id, section_key, section_title, section_order, is_enabled)
VALUES 
  (2, 'summary', '学習サマリー', 1, TRUE),
  (2, 'parent_message', '保護者向けメッセージ', 2, TRUE),
  (2, 'learning_style', '学習スタイル分析', 3, TRUE),
  (2, 'charts', 'グラフ・チャート', 4, TRUE),
  (2, 'subject_performance', '教科別パフォーマンス', 5, TRUE),
  (2, 'comparison', '比較分析', 6, TRUE),
  (2, 'prediction', 'AI予測', 7, TRUE),
  (2, 'achievements', '達成実績', 8, TRUE),
  (2, 'challenges', '改善ポイント', 9, TRUE),
  (2, 'ai_interactions', 'AI教師とのやりとり', 10, TRUE);
