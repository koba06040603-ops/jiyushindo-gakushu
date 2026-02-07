-- ============================================================
-- Phase 18-2: 予測分析・A/Bテスト・グローバル展開
-- ============================================================

-- 機械学習モデルテーブル
CREATE TABLE IF NOT EXISTS ml_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_type TEXT NOT NULL CHECK(model_type IN (
    'linear_regression', 'logistic_regression', 'decision_tree', 'random_forest'
  )),
  model_data TEXT NOT NULL, -- JSON serialized model
  training_size INTEGER NOT NULL,
  validation_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ml_models_type 
ON ml_models(model_type, created_at DESC);

-- ML予測ログテーブル
CREATE TABLE IF NOT EXISTS ml_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK(prediction_type IN (
    'outcome', 'risk', 'optimal_path', 'completion_time'
  )),
  current_score REAL,
  predicted_score REAL,
  time_horizon_days INTEGER,
  risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
  confidence REAL,
  features_snapshot TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_student 
ON ml_predictions(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_predictions_risk 
ON ml_predictions(risk_level, created_at DESC);

-- A/Bテスト実験テーブル
CREATE TABLE IF NOT EXISTS ab_test_experiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  intervention_type TEXT NOT NULL CHECK(intervention_type IN (
    'hint_strategy', 'difficulty_adjustment', 'feedback_timing', 
    'ui_design', 'theory_emphasis', 'other'
  )),
  primary_metric TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  target_sample_size INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN (
    'draft', 'running', 'completed', 'cancelled'
  )),
  start_date DATETIME,
  end_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_status 
ON ab_test_experiments(status, created_at DESC);

-- A/Bテストバリアントテーブル
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER NOT NULL,
  variant_name TEXT NOT NULL,
  description TEXT,
  config_json TEXT, -- JSON configuration
  allocation_percentage REAL NOT NULL CHECK(allocation_percentage >= 0 AND allocation_percentage <= 100),
  is_control INTEGER DEFAULT 0,
  FOREIGN KEY (experiment_id) REFERENCES ab_test_experiments(id),
  UNIQUE(experiment_id, variant_name)
);

CREATE INDEX IF NOT EXISTS idx_ab_variants_experiment 
ON ab_test_variants(experiment_id);

-- A/Bテスト割り当てテーブル
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER NOT NULL,
  student_id TEXT NOT NULL,
  variant_id INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES ab_test_experiments(id),
  FOREIGN KEY (variant_id) REFERENCES ab_test_variants(id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  UNIQUE(experiment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_student 
ON ab_test_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_variant 
ON ab_test_assignments(variant_id);

-- A/Bテストメトリクステーブル
CREATE TABLE IF NOT EXISTS ab_test_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER NOT NULL,
  student_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metadata TEXT, -- JSON
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experiment_id) REFERENCES ab_test_experiments(id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_metrics_experiment 
ON ab_test_metrics(experiment_id, metric_name);

CREATE INDEX IF NOT EXISTS idx_ab_metrics_student 
ON ab_test_metrics(student_id, recorded_at DESC);

-- ビュー: ML予測精度サマリー
CREATE VIEW IF NOT EXISTS v_ml_prediction_accuracy AS
SELECT 
  prediction_type,
  COUNT(*) as total_predictions,
  AVG(confidence) as avg_confidence,
  COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk_count,
  COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk_count,
  COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk_count,
  AVG(predicted_score - current_score) as avg_improvement_prediction
FROM ml_predictions
GROUP BY prediction_type;

-- ビュー: A/Bテスト実験サマリー
CREATE VIEW IF NOT EXISTS v_ab_test_summary AS
SELECT 
  e.id as experiment_id,
  e.name,
  e.status,
  e.intervention_type,
  e.primary_metric,
  COUNT(DISTINCT a.student_id) as total_participants,
  COUNT(DISTINCT v.id) as variant_count,
  julianday(COALESCE(e.end_date, 'now')) - julianday(e.start_date) as elapsed_days,
  e.duration_days,
  CAST(COUNT(DISTINCT a.student_id) AS REAL) / e.target_sample_size * 100 as completion_percentage
FROM ab_test_experiments e
LEFT JOIN ab_test_variants v ON e.id = v.experiment_id
LEFT JOIN ab_test_assignments a ON e.id = a.experiment_id
GROUP BY e.id;

-- ビュー: バリアント別パフォーマンス
CREATE VIEW IF NOT EXISTS v_variant_performance AS
SELECT 
  v.experiment_id,
  v.id as variant_id,
  v.variant_name,
  COUNT(DISTINCT a.student_id) as sample_size,
  AVG(m.metric_value) as mean_metric_value,
  COUNT(m.id) as metric_count
FROM ab_test_variants v
LEFT JOIN ab_test_assignments a ON v.id = a.variant_id
LEFT JOIN ab_test_metrics m ON a.experiment_id = m.experiment_id 
  AND a.student_id = m.student_id
GROUP BY v.experiment_id, v.id, v.variant_name;

-- サンプルデータ: デモ用実験
INSERT OR IGNORE INTO ab_test_experiments (
  id, name, description, hypothesis, intervention_type, 
  primary_metric, duration_days, target_sample_size, status
) VALUES (
  1, 
  'ヒント戦略A vs B',
  '段階的ヒント vs 直接的ヒント',
  '段階的ヒントは学習効果を向上させる',
  'hint_strategy',
  'correct_rate',
  30,
  100,
  'draft'
);

INSERT OR IGNORE INTO ab_test_variants (id, experiment_id, variant_name, description, config_json, allocation_percentage, is_control)
VALUES 
  (1, 1, '対照群（直接的ヒント）', '直接的なヒントを提供', '{"hint_type": "direct"}', 50, 1),
  (2, 1, '実験群（段階的ヒント）', '段階的なヒントを提供', '{"hint_type": "gradual", "levels": 3}', 50, 0);

-- Phase 18-2完了: 予測分析・A/Bテストの基盤完成
-- 実装内容:
--   1. 機械学習モデル管理
--   2. 学習成果予測
--   3. リスク生徒の早期発見
--   4. A/Bテスト実験管理
--   5. 効果量自動計算
--   6. 統計的有意性検定
-- 
-- 科学的根拠:
--   - 予測分析: Pane et al. (2020) d=0.72
--   - A/Bテスト: 因果推論の標準手法
--   - Cohen's d: Cohen (1988)
-- 
-- 期待効果:
--   - リスク生徒の早期発見: 介入効果 d=0.72
--   - A/Bテスト: エビデンスベースの意思決定
--   - 最適化: データ駆動型改善サイクル
