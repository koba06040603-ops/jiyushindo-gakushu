-- Migration 0014: 深層学習・マルチモーダル・大規模展開
-- Phase 17-19: Advanced ML + Multimodal + Large Scale Deployment

-- ==============================================
-- Phase 17: 深層学習モデル
-- ==============================================

-- LSTM/GRU時系列予測モデル
CREATE TABLE IF NOT EXISTS lstm_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  model_type TEXT NOT NULL, -- 'lstm', 'gru', 'bidirectional_lstm'
  architecture TEXT NOT NULL, -- JSON: layer configurations
  weights_data TEXT, -- JSON: model weights (compressed)
  sequence_length INTEGER DEFAULT 10, -- 時系列の長さ
  prediction_horizon INTEGER DEFAULT 5, -- 予測する未来の長さ
  training_samples INTEGER DEFAULT 0,
  validation_loss REAL,
  test_accuracy REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Transformer自然言語理解モデル
CREATE TABLE IF NOT EXISTS transformer_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  class_code TEXT,
  model_type TEXT NOT NULL, -- 'bert_small', 'distilbert', 'student_qa'
  vocabulary_size INTEGER DEFAULT 5000,
  embedding_dim INTEGER DEFAULT 128,
  num_heads INTEGER DEFAULT 4,
  num_layers INTEGER DEFAULT 2,
  model_params TEXT, -- JSON: 完全なモデルパラメータ
  trained_on_messages INTEGER DEFAULT 0,
  perplexity REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 強化学習エージェント
CREATE TABLE IF NOT EXISTS rl_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  agent_type TEXT NOT NULL, -- 'dqn', 'policy_gradient', 'actor_critic'
  state_space_dim INTEGER NOT NULL,
  action_space_dim INTEGER NOT NULL,
  q_table TEXT, -- JSON: Q値テーブルまたはネットワーク重み
  total_episodes INTEGER DEFAULT 0,
  total_rewards REAL DEFAULT 0,
  epsilon REAL DEFAULT 1.0, -- 探索率
  learning_rate REAL DEFAULT 0.001,
  discount_factor REAL DEFAULT 0.95,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 強化学習エピソード履歴
CREATE TABLE IF NOT EXISTS rl_episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  total_reward REAL NOT NULL,
  steps_taken INTEGER NOT NULL,
  final_understanding REAL,
  actions_taken TEXT, -- JSON: 行動の系列
  states_visited TEXT, -- JSON: 状態の系列
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES rl_agents(id)
);

-- ==============================================
-- Phase 18: マルチモーダル学習
-- ==============================================

-- 音声入力データ
CREATE TABLE IF NOT EXISTS voice_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER,
  audio_blob_url TEXT, -- Cloudflare R2 URL
  audio_duration_seconds REAL,
  transcription TEXT, -- 音声認識結果
  transcription_confidence REAL,
  language_detected TEXT DEFAULT 'ja',
  emotion_detected TEXT, -- 'happy', 'frustrated', 'confused', 'confident'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- 手書き認識データ
CREATE TABLE IF NOT EXISTS handwriting_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER,
  image_blob_url TEXT, -- Cloudflare R2 URL
  strokes_data TEXT, -- JSON: ストロークの座標データ
  recognized_text TEXT,
  recognition_confidence REAL,
  writing_speed REAL, -- 文字/分
  stroke_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- 視線追跡データ（オプション）
CREATE TABLE IF NOT EXISTS eye_tracking_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER,
  session_id TEXT NOT NULL,
  gaze_points TEXT, -- JSON: [{x, y, timestamp, duration}]
  fixation_count INTEGER,
  average_fixation_duration REAL,
  saccade_count INTEGER,
  attention_heatmap_url TEXT, -- ヒートマップ画像URL
  cognitive_load_score REAL, -- 0-1: 認知負荷の推定
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- ==============================================
-- Phase 19: 大規模展開
-- ==============================================

-- 学校マスタ
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_code TEXT UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  school_type TEXT NOT NULL, -- 'elementary', 'junior_high', 'high'
  prefecture TEXT NOT NULL,
  municipality TEXT NOT NULL,
  address TEXT,
  principal_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  trial_start_date DATE,
  contract_end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 自治体マスタ
CREATE TABLE IF NOT EXISTS municipalities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  municipality_code TEXT UNIQUE NOT NULL,
  municipality_name TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  education_superintendent TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  total_schools INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教師マスタ（拡張）
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  school_id INTEGER NOT NULL,
  teacher_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'homeroom_teacher', 'coordinator', 'principal', 'vice_principal'
  grade_level TEXT, -- '1', '2', '3', '4', '5', '6', 'all'
  subjects TEXT, -- JSON: ['math', 'science', 'japanese']
  is_coordinator BOOLEAN DEFAULT 0, -- あなたのような教育改革担当者
  managed_schools TEXT, -- JSON: [school_id1, school_id2] コーディネーターが担当する学校
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- データ共有設定
CREATE TABLE IF NOT EXISTS data_sharing_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  shared_with_user_id INTEGER NOT NULL, -- コーディネーター等
  permission_type TEXT NOT NULL, -- 'view', 'analyze', 'export'
  granted_by_user_id INTEGER NOT NULL, -- 担任教師
  consent_date DATETIME NOT NULL,
  expiry_date DATETIME,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id),
  FOREIGN KEY (granted_by_user_id) REFERENCES users(id)
);

-- クロススクール分析結果
CREATE TABLE IF NOT EXISTS cross_school_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_type TEXT NOT NULL, -- 'municipality', 'prefecture', 'national'
  scope_identifier TEXT NOT NULL, -- municipality_code, prefecture, 'national'
  total_students INTEGER,
  total_schools INTEGER,
  avg_understanding REAL,
  avg_engagement REAL,
  top_performing_schools TEXT, -- JSON: [school_ids]
  struggling_schools TEXT, -- JSON: [school_ids]
  common_patterns TEXT, -- JSON: 共通する学習パターン
  recommendations TEXT, -- JSON: 改善推奨事項
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 不登校児童サポート記録
CREATE TABLE IF NOT EXISTS truancy_support_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  support_type TEXT NOT NULL, -- 'home_learning', 'online_only', 'flexible_schedule'
  last_school_attendance_date DATE,
  online_learning_frequency TEXT, -- 'daily', 'weekly', 'irregular'
  engagement_level TEXT, -- 'high', 'medium', 'low'
  progress_notes TEXT,
  support_coordinator_id INTEGER, -- あなたのようなサポート担当者
  family_contact_frequency TEXT,
  reintegration_plan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (support_coordinator_id) REFERENCES users(id)
);

-- グローバル展開（多言語・多文化対応）
CREATE TABLE IF NOT EXISTS global_deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code TEXT NOT NULL, -- 'JP', 'US', 'IN', etc.
  region TEXT,
  organization_name TEXT NOT NULL,
  organization_type TEXT, -- 'school', 'ngo', 'government'
  primary_language TEXT NOT NULL,
  secondary_languages TEXT, -- JSON: ['en', 'es']
  total_users INTEGER DEFAULT 0,
  deployment_status TEXT DEFAULT 'pilot', -- 'pilot', 'active', 'suspended'
  local_coordinator_email TEXT,
  timezone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 研究論文トラッキング
CREATE TABLE IF NOT EXISTS research_publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  authors TEXT NOT NULL, -- あなたの名前も含む
  publication_type TEXT NOT NULL, -- 'journal', 'conference', 'report'
  publication_venue TEXT,
  publication_date DATE,
  doi TEXT,
  abstract TEXT,
  keywords TEXT, -- JSON: ['personalized learning', 'AI', 'evidence-based']
  data_collection_period_start DATE,
  data_collection_period_end DATE,
  sample_size INTEGER,
  schools_involved TEXT, -- JSON: [school_ids]
  key_findings TEXT,
  citation_count INTEGER DEFAULT 0,
  pdf_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_lstm_models_student ON lstm_models(student_id);
CREATE INDEX IF NOT EXISTS idx_transformer_models_class ON transformer_models(class_code);
CREATE INDEX IF NOT EXISTS idx_rl_agents_student ON rl_agents(student_id);
CREATE INDEX IF NOT EXISTS idx_voice_inputs_student ON voice_inputs(student_id);
CREATE INDEX IF NOT EXISTS idx_handwriting_inputs_student ON handwriting_inputs(student_id);
CREATE INDEX IF NOT EXISTS idx_eye_tracking_student ON eye_tracking_data(student_id);
CREATE INDEX IF NOT EXISTS idx_schools_municipality ON schools(municipality);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_coordinator ON teachers(is_coordinator);
CREATE INDEX IF NOT EXISTS idx_data_sharing_student ON data_sharing_permissions(student_id);
CREATE INDEX IF NOT EXISTS idx_data_sharing_shared_with ON data_sharing_permissions(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_truancy_support_student ON truancy_support_records(student_id);
CREATE INDEX IF NOT EXISTS idx_global_deployments_country ON global_deployments(country_code);
