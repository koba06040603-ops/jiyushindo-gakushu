-- Phase 15 & 16: 機械学習 + A/Bテスト基盤
-- 実装日: 2026-01-14

-- 1. A/Bテスト実験定義テーブル
CREATE TABLE IF NOT EXISTS ab_experiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- 実験設定
  hypothesis TEXT, -- 仮説
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'cancelled'
  
  -- 対象
  target_population TEXT, -- 'all', 'class_code', 'grade_level', 'learning_style'
  target_criteria TEXT, -- JSON形式の詳細条件
  
  -- 介入内容
  control_variant TEXT NOT NULL, -- 対照群の説明（JSON）
  treatment_variant TEXT NOT NULL, -- 介入群の説明（JSON）
  
  -- サンプルサイズ
  required_sample_size INTEGER,
  actual_sample_size INTEGER DEFAULT 0,
  
  -- 主要評価指標
  primary_outcome TEXT NOT NULL, -- 'understanding_level', 'completion_rate', 'engagement', etc.
  secondary_outcomes TEXT, -- JSON配列
  
  -- 統計設定
  alpha REAL DEFAULT 0.05, -- 有意水準
  power REAL DEFAULT 0.8, -- 検出力
  effect_size REAL, -- 期待される効果量
  
  -- メタデータ
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 2. A/Bテスト参加者割り当てテーブル
CREATE TABLE IF NOT EXISTS ab_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- 割り当て
  variant TEXT NOT NULL, -- 'control', 'treatment'
  assignment_method TEXT DEFAULT 'random', -- 'random', 'stratified', 'matched'
  assignment_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 層化変数（マッチング用）
  baseline_understanding REAL,
  baseline_learning_style TEXT,
  baseline_engagement TEXT,
  stratification_key TEXT, -- JSON形式
  
  -- ステータス
  participation_status TEXT DEFAULT 'active', -- 'active', 'dropped_out', 'completed'
  dropout_reason TEXT,
  dropout_timestamp DATETIME,
  
  FOREIGN KEY (experiment_id) REFERENCES ab_experiments(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE(experiment_id, student_id)
);

-- 3. A/Bテスト測定結果テーブル
CREATE TABLE IF NOT EXISTS ab_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER NOT NULL,
  participant_id INTEGER NOT NULL,
  
  -- 測定情報
  measurement_type TEXT NOT NULL, -- 'baseline', 'interim', 'final'
  measurement_date DATE NOT NULL,
  measurement_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- アウトカム測定値
  primary_outcome_value REAL,
  secondary_outcomes_values TEXT, -- JSON形式
  
  -- 追加データ
  session_duration INTEGER, -- 秒
  cards_completed INTEGER,
  understanding_level REAL,
  engagement_score REAL,
  help_requests INTEGER,
  
  -- メタデータ
  measurement_context TEXT, -- JSON形式（測定時の状況）
  
  FOREIGN KEY (experiment_id) REFERENCES ab_experiments(id),
  FOREIGN KEY (participant_id) REFERENCES ab_participants(id)
);

-- 4. A/Bテスト統計分析結果テーブル
CREATE TABLE IF NOT EXISTS ab_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER NOT NULL,
  
  -- 分析情報
  analysis_type TEXT NOT NULL, -- 'interim', 'final', 'post_hoc'
  analysis_date DATE NOT NULL,
  analysis_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- サンプルサイズ
  control_n INTEGER,
  treatment_n INTEGER,
  
  -- 記述統計
  control_mean REAL,
  control_sd REAL,
  control_median REAL,
  treatment_mean REAL,
  treatment_sd REAL,
  treatment_median REAL,
  
  -- 効果量
  effect_size REAL, -- Cohen's d
  effect_size_ci_lower REAL,
  effect_size_ci_upper REAL,
  
  -- 統計的検定結果
  test_statistic REAL,
  p_value REAL,
  confidence_level REAL DEFAULT 0.95,
  
  -- 判定
  is_significant BOOLEAN,
  conclusion TEXT, -- 'reject_null', 'fail_to_reject', 'inconclusive'
  practical_significance TEXT, -- 実務的有意性の判断
  
  -- 詳細結果（JSON）
  detailed_results TEXT,
  
  -- 分析者
  analyzed_by INTEGER,
  
  FOREIGN KEY (experiment_id) REFERENCES ab_experiments(id),
  FOREIGN KEY (analyzed_by) REFERENCES users(id)
);

-- 5. 機械学習モデルテーブル
CREATE TABLE IF NOT EXISTS ml_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL, -- 'regression', 'classification', 'time_series', 'neural_network'
  description TEXT,
  
  -- モデル情報
  architecture TEXT, -- JSON形式でモデル構造を保存
  hyperparameters TEXT, -- JSON形式
  
  -- 学習データ
  training_dataset_size INTEGER,
  validation_dataset_size INTEGER,
  test_dataset_size INTEGER,
  
  -- パフォーマンス指標
  accuracy REAL,
  precision_score REAL,
  recall REAL,
  f1_score REAL,
  mse REAL, -- Mean Squared Error
  mae REAL, -- Mean Absolute Error
  r_squared REAL,
  
  -- バージョン管理
  version TEXT,
  parent_model_id INTEGER,
  
  -- ステータス
  status TEXT DEFAULT 'training', -- 'training', 'ready', 'deployed', 'deprecated'
  deployed_at DATETIME,
  
  -- メタデータ
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_model_id) REFERENCES ml_models(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 6. 機械学習予測履歴テーブル
CREATE TABLE IF NOT EXISTS ml_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- 予測情報
  prediction_type TEXT NOT NULL, -- 'understanding', 'dropout_risk', 'optimal_path', 'intervention_need'
  prediction_value REAL,
  prediction_class TEXT, -- 分類タスクの場合
  confidence REAL,
  
  -- 入力特徴量
  input_features TEXT, -- JSON形式
  
  -- 予測結果詳細
  prediction_details TEXT, -- JSON形式
  
  -- 実績（検証用）
  actual_value REAL,
  actual_class TEXT,
  prediction_error REAL,
  
  -- タイムスタンプ
  prediction_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  actual_timestamp DATETIME, -- 実績が判明した日時
  
  FOREIGN KEY (model_id) REFERENCES ml_models(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 7. モデル学習ログテーブル
CREATE TABLE IF NOT EXISTS ml_training_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  
  -- エポック情報
  epoch INTEGER,
  batch INTEGER,
  
  -- 損失関数
  training_loss REAL,
  validation_loss REAL,
  
  -- メトリクス
  metrics TEXT, -- JSON形式
  
  -- タイムスタンプ
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (model_id) REFERENCES ml_models(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_experiments(status, start_date);
CREATE INDEX IF NOT EXISTS idx_ab_participants_experiment ON ab_participants(experiment_id, variant);
CREATE INDEX IF NOT EXISTS idx_ab_measurements_experiment ON ab_measurements(experiment_id, measurement_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_student ON ml_predictions(student_id, prediction_timestamp);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model ON ml_predictions(model_id, prediction_timestamp);
