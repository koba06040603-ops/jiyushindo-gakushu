-- ==========================================
-- Phase 17-19: 深層学習・マルチモーダル・大規模展開
-- ==========================================

-- ===========================================
-- Phase 17: 深層学習モデル
-- ===========================================

-- LSTM/GRU時系列予測モデル
CREATE TABLE IF NOT EXISTS lstm_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  model_type TEXT NOT NULL, -- 'lstm', 'gru', 'bilstm'
  sequence_length INTEGER DEFAULT 10,
  hidden_units INTEGER DEFAULT 64,
  model_params TEXT, -- JSON: weights, biases
  training_accuracy REAL,
  validation_accuracy REAL,
  training_samples INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 時系列学習データ
CREATE TABLE IF NOT EXISTS time_series_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  understanding_level REAL,
  completion_time REAL,
  engagement_score REAL,
  hint_count INTEGER DEFAULT 0,
  emotion_state TEXT, -- 'focused', 'struggling', 'confident'
  session_context TEXT, -- JSON
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_time_series_student ON time_series_data(student_id, timestamp);

-- Transformer自然言語理解
CREATE TABLE IF NOT EXISTS transformer_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT UNIQUE NOT NULL,
  model_type TEXT NOT NULL, -- 'bert', 'gpt', 'custom_transformer'
  vocab_size INTEGER,
  embedding_dim INTEGER DEFAULT 128,
  num_heads INTEGER DEFAULT 4,
  num_layers INTEGER DEFAULT 2,
  model_params TEXT, -- JSON: attention weights
  training_accuracy REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学習テキスト解析結果
CREATE TABLE IF NOT EXISTS text_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  text_input TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'sentiment', 'comprehension', 'misconception'
  analysis_result TEXT, -- JSON
  confidence_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 強化学習エージェント
CREATE TABLE IF NOT EXISTS rl_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  agent_type TEXT NOT NULL, -- 'q_learning', 'dqn', 'policy_gradient'
  state_space_dim INTEGER,
  action_space_dim INTEGER,
  q_table TEXT, -- JSON: state-action values
  policy_params TEXT, -- JSON: policy network weights
  total_episodes INTEGER DEFAULT 0,
  average_reward REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 強化学習エピソード履歴
CREATE TABLE IF NOT EXISTS rl_episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  state_sequence TEXT, -- JSON: array of states
  action_sequence TEXT, -- JSON: array of actions
  reward_sequence TEXT, -- JSON: array of rewards
  total_reward REAL,
  episode_length INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES rl_agents(id)
);

-- ===========================================
-- Phase 18: マルチモーダル学習
-- ===========================================

-- 音声入力データ
CREATE TABLE IF NOT EXISTS voice_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  audio_url TEXT NOT NULL,
  transcription TEXT,
  transcription_confidence REAL,
  language TEXT DEFAULT 'ja',
  duration_seconds REAL,
  emotion_detected TEXT, -- 'happy', 'frustrated', 'neutral'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 手書き認識データ
CREATE TABLE IF NOT EXISTS handwriting_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  image_url TEXT NOT NULL,
  recognized_text TEXT,
  recognition_confidence REAL,
  stroke_data TEXT, -- JSON: array of strokes
  is_correct BOOLEAN,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculums(id)
);

-- 視線追跡データ（将来拡張用）
CREATE TABLE IF NOT EXISTS eye_tracking_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  gaze_x REAL,
  gaze_y REAL,
  fixation_duration_ms INTEGER,
  element_focused TEXT, -- DOM element identifier
  attention_level REAL, -- 0.0 - 1.0
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- マルチモーダル統合分析
CREATE TABLE IF NOT EXISTS multimodal_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  text_features TEXT, -- JSON
  voice_features TEXT, -- JSON
  handwriting_features TEXT, -- JSON
  eye_tracking_features TEXT, -- JSON
  combined_embedding TEXT, -- JSON: multimodal representation
  engagement_score REAL,
  understanding_level REAL,
  intervention_needed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- ===========================================
-- Phase 19: 大規模展開
-- ===========================================

-- 学校情報
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_code TEXT UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  municipality_id INTEGER,
  school_type TEXT, -- 'elementary', 'junior_high', 'combined'
  address TEXT,
  principal_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (municipality_id) REFERENCES municipalities(id)
);

-- 自治体情報
CREATE TABLE IF NOT EXISTS municipalities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  municipality_code TEXT UNIQUE NOT NULL,
  municipality_name TEXT NOT NULL,
  prefecture TEXT,
  superintendent_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  total_schools INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- データ共有設定
CREATE TABLE IF NOT EXISTS data_sharing_agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  data_coordinator_id INTEGER NOT NULL, -- あなた（教育改革担当者）
  sharing_scope TEXT NOT NULL, -- 'anonymized_only', 'aggregate_only', 'full_with_consent'
  consent_obtained BOOLEAN DEFAULT 0,
  consent_document_url TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (data_coordinator_id) REFERENCES users(id)
);

-- 匿名化マッピング（プライバシー保護）
CREATE TABLE IF NOT EXISTS anonymization_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  real_student_id INTEGER NOT NULL,
  anonymous_id TEXT UNIQUE NOT NULL,
  school_id INTEGER NOT NULL,
  mapping_key TEXT NOT NULL, -- 暗号化キー（実際は環境変数で管理）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (real_student_id) REFERENCES users(id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_anon_mapping ON anonymization_mapping(anonymous_id);

-- クロススクール分析
CREATE TABLE IF NOT EXISTS cross_school_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_date DATE NOT NULL,
  municipality_id INTEGER,
  school_ids TEXT, -- JSON: array of school IDs
  total_students INTEGER,
  average_understanding REAL,
  average_completion_time REAL,
  average_engagement REAL,
  top_performing_schools TEXT, -- JSON
  struggling_schools TEXT, -- JSON
  recommendations TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (municipality_id) REFERENCES municipalities(id)
);

-- 研究論文用データセット
CREATE TABLE IF NOT EXISTS research_datasets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_name TEXT UNIQUE NOT NULL,
  researcher_id INTEGER NOT NULL,
  description TEXT,
  data_collection_start DATE,
  data_collection_end DATE,
  total_records INTEGER,
  schools_included TEXT, -- JSON: array of school_codes
  anonymization_level TEXT, -- 'full', 'partial', 'aggregated'
  export_format TEXT, -- 'csv', 'json', 'parquet'
  download_url TEXT,
  citation_info TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (researcher_id) REFERENCES users(id)
);

-- システム使用統計（全国規模）
CREATE TABLE IF NOT EXISTS system_usage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  school_id INTEGER,
  active_students INTEGER DEFAULT 0,
  active_teachers INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_cards_completed INTEGER DEFAULT 0,
  average_session_duration REAL,
  system_uptime_percentage REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON system_usage_stats(date, school_id);

-- 教育効果測定（標準化テスト連携）
CREATE TABLE IF NOT EXISTS standardized_test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  test_name TEXT NOT NULL, -- '全国学力テスト', '県学力診断テスト'
  test_date DATE,
  subject TEXT, -- '国語', '算数', '理科'
  score REAL,
  percentile REAL,
  national_average REAL,
  school_average REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- システム効果と標準化テストの相関分析
CREATE TABLE IF NOT EXISTS effectiveness_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_date DATE NOT NULL,
  school_id INTEGER NOT NULL,
  subject TEXT,
  system_usage_correlation REAL, -- システム使用時間と成績の相関
  improvement_rate REAL, -- 前年比改善率
  effect_size REAL, -- Cohen's d
  statistical_significance REAL, -- p-value
  analysis_details TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- ===========================================
-- 初期データ投入
-- ===========================================

-- サンプル自治体（あなたの村）
INSERT OR IGNORE INTO municipalities (municipality_code, municipality_name, prefecture, superintendent_name)
VALUES ('VILLAGE_001', '○○村教育委員会', '○○県', '教育長名');

-- サンプル学校
INSERT OR IGNORE INTO schools (school_code, school_name, municipality_id, school_type)
VALUES ('SCHOOL_ELEM_001', '○○村立○○小学校', 1, 'elementary');

INSERT OR IGNORE INTO schools (school_code, school_name, municipality_id, school_type)
VALUES ('SCHOOL_JH_001', '○○村立○○中学校', 1, 'junior_high');
