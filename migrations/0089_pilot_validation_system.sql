-- =====================================================
-- 0089: パイロット検証システム
-- Phase B: 妥当性検証のためのデータ収集基盤
-- =====================================================
-- 1. 教師BARS評定テーブル
-- 2. 動画録画テーブル
-- 3. 信頼性・妥当性統計テーブル
-- =====================================================

-- =====================================================
-- 1. 教師BARS評定（行動アンカー付き評定尺度）
-- 教師が同じ5次元をシステムとは独立に評定する
-- → システムスコアとの相関で収束的妥当性を検証
-- =====================================================
CREATE TABLE IF NOT EXISTS teacher_bars_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,                    -- 単元計画ID（任意）
  hour_number INTEGER,                -- 時限（任意）
  -- 5次元 BARS評定 (1-5スケール)
  -- 各レベルに行動アンカー記述が対応
  continuity_rating INTEGER NOT NULL CHECK(continuity_rating BETWEEN 1 AND 5),
  challenge_rating INTEGER NOT NULL CHECK(challenge_rating BETWEEN 1 AND 5),
  recovery_rating INTEGER NOT NULL CHECK(recovery_rating BETWEEN 1 AND 5),
  deepening_rating INTEGER NOT NULL CHECK(deepening_rating BETWEEN 1 AND 5),
  emotional_stability_rating INTEGER NOT NULL CHECK(emotional_stability_rating BETWEEN 1 AND 5),
  -- 自由記述（行動の具体的エビデンス）
  continuity_evidence TEXT,
  challenge_evidence TEXT,
  recovery_evidence TEXT,
  deepening_evidence TEXT,
  emotional_stability_evidence TEXT,
  -- 総合所見
  overall_comment TEXT,
  -- 録画を参照したかどうか
  video_referenced INTEGER DEFAULT 0, -- 0=なし, 1=あり
  video_recording_id INTEGER,         -- 参照した録画のID
  -- メタデータ
  rating_context TEXT,                -- 'in_class'|'after_class'|'video_review'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 検索用インデックス
CREATE INDEX IF NOT EXISTS idx_bars_student ON teacher_bars_ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_bars_teacher ON teacher_bars_ratings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bars_plan ON teacher_bars_ratings(plan_id);
CREATE INDEX IF NOT EXISTS idx_bars_student_plan ON teacher_bars_ratings(student_id, plan_id);

-- =====================================================
-- 2. 動画録画テーブル
-- 学習カード開始時に自動録画（480p+音声、最大10分）
-- R2に保存、60日で自動削除
-- =====================================================
CREATE TABLE IF NOT EXISTS video_recordings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,
  hour_number INTEGER,
  -- R2保存情報
  r2_key TEXT NOT NULL,               -- R2オブジェクトキー
  file_size_bytes INTEGER,            -- ファイルサイズ
  duration_seconds INTEGER,           -- 録画時間（秒）
  -- 録画設定
  resolution TEXT DEFAULT '480p',     -- '480p'|'720p'
  has_audio INTEGER DEFAULT 1,        -- 音声あり
  has_video INTEGER DEFAULT 1,        -- 映像あり
  mime_type TEXT DEFAULT 'video/webm',
  -- 粘り強さデータとの紐付け
  persistence_metric_id INTEGER,      -- persistence_metricsのID
  -- ステータス
  status TEXT DEFAULT 'recording',    -- 'recording'|'uploaded'|'processing'|'analyzed'|'expired'
  upload_completed_at DATETIME,
  -- AI分析結果（将来Gemini連携用）
  ai_analysis_json TEXT,              -- Gemini分析結果JSON
  analyzed_at DATETIME,
  -- 削除管理
  expires_at DATETIME,                -- 自動削除予定日（60日後）
  deleted_at DATETIME,
  -- メタデータ
  recording_trigger TEXT DEFAULT 'card_start', -- 'card_start'|'manual'|'teacher_request'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_video_student ON video_recordings(student_id);
CREATE INDEX IF NOT EXISTS idx_video_plan ON video_recordings(plan_id);
CREATE INDEX IF NOT EXISTS idx_video_status ON video_recordings(status);
CREATE INDEX IF NOT EXISTS idx_video_expires ON video_recordings(expires_at);
CREATE INDEX IF NOT EXISTS idx_video_r2key ON video_recordings(r2_key);

-- =====================================================
-- 3. 妥当性・信頼性統計キャッシュ
-- Cronbach α、相関係数等の算出結果を保存
-- =====================================================
CREATE TABLE IF NOT EXISTS validation_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_type TEXT NOT NULL,            -- 'cronbach_alpha'|'inter_rater'|'convergent_validity'|'factor_analysis'
  dimension TEXT,                     -- 'overall'|'continuity'|'challenge'|'recovery'|'deepening'|'emotional_stability'
  -- 統計値
  value REAL NOT NULL,
  confidence_interval_low REAL,
  confidence_interval_high REAL,
  sample_size INTEGER NOT NULL,
  -- 計算パラメータ
  parameters_json TEXT,               -- 計算に使用したパラメータ
  -- メタデータ
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME                -- 再計算が必要な期限
);

CREATE INDEX IF NOT EXISTS idx_validation_type ON validation_statistics(stat_type);

-- =====================================================
-- 4. 録画設定テーブル（クラス単位）
-- =====================================================
CREATE TABLE IF NOT EXISTS recording_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER,
  teacher_id INTEGER NOT NULL,
  -- 録画ポリシー
  auto_record_on_card_start INTEGER DEFAULT 1, -- 学習カード開始時に自動録画
  max_duration_seconds INTEGER DEFAULT 600,    -- 最大10分
  resolution TEXT DEFAULT '480p',
  record_audio INTEGER DEFAULT 1,
  record_video INTEGER DEFAULT 1,
  -- 頻度制御
  record_frequency TEXT DEFAULT 'every_time',  -- 'every_time'|'every_other'|'teacher_selected'
  -- 保持期間
  retention_days INTEGER DEFAULT 60,
  -- 保護者同意
  parental_consent_required INTEGER DEFAULT 1,
  consent_form_sent INTEGER DEFAULT 0,
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. 保護者同意テーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS recording_consent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  parent_name TEXT,
  consent_given INTEGER DEFAULT 0,    -- 0=未回答, 1=同意, -1=不同意
  consent_date DATETIME,
  consent_method TEXT,                -- 'online'|'paper'|'verbal'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consent_student ON recording_consent(student_id);
