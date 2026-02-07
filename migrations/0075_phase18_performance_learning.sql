-- ============================================================
-- Phase 18-3: パフォーマンス最適化 & 学習開始実装
-- ============================================================

-- パフォーマンスログテーブル
CREATE TABLE IF NOT EXISTS performance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time_ms INTEGER NOT NULL,
  cache_hit INTEGER DEFAULT 0, -- 0: miss, 1: hit
  db_queries INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- パフォーマンスログのインデックス
CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint ON performance_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_logs_response_time ON performance_logs(response_time_ms);

-- ============================================================
-- D1クエリ最適化: インデックス追加
-- ============================================================

-- 学習セッションのインデックス（実際に存在するカラムのみ）
CREATE INDEX IF NOT EXISTS idx_learning_sessions_student_id ON learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_start ON learning_sessions(session_start);

-- 学習履歴のインデックス
CREATE INDEX IF NOT EXISTS idx_learning_history_student_id ON learning_history(student_id);

-- ============================================================
-- パフォーマンス統計ビュー
-- ============================================================

-- エンドポイント別パフォーマンスサマリー
CREATE VIEW IF NOT EXISTS v_performance_summary AS
SELECT 
  endpoint,
  COUNT(*) as total_requests,
  AVG(response_time_ms) as avg_response_time,
  MAX(response_time_ms) as max_response_time,
  MIN(response_time_ms) as min_response_time,
  ROUND(SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as cache_hit_rate,
  SUM(CASE WHEN response_time_ms > 200 THEN 1 ELSE 0 END) as slow_requests,
  ROUND(SUM(CASE WHEN response_time_ms <= 200 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as sla_compliance
FROM performance_logs
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY endpoint;

-- 時間帯別パフォーマンス
CREATE VIEW IF NOT EXISTS v_performance_hourly AS
SELECT 
  strftime('%Y-%m-%d %H:00:00', created_at) as hour,
  COUNT(*) as requests,
  AVG(response_time_ms) as avg_response_time,
  ROUND(SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as cache_hit_rate
FROM performance_logs
WHERE created_at >= datetime('now', '-7 days')
GROUP BY hour
ORDER BY hour DESC;

-- ============================================================
-- 学習セッション拡張（適応的難易度調整サポート）
-- ============================================================

-- Note: learning_sessionsテーブルは既に存在するため、ビューは削除してシンプルに

-- ============================================================
-- パフォーマンス最適化設定テーブル
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- デフォルト設定
INSERT OR IGNORE INTO performance_config (config_key, config_value, description) VALUES
  ('cache_ttl_card_metadata', '3600', 'カードメタデータのキャッシュTTL（秒）'),
  ('cache_ttl_student_profile', '600', '生徒プロファイルのキャッシュTTL（秒）'),
  ('cache_ttl_theory_scores', '300', '理論スコアのキャッシュTTL（秒）'),
  ('cache_ttl_recommendations', '180', '推薦カードのキャッシュTTL（秒）'),
  ('api_response_threshold_ms', '200', 'API応答時間の警告閾値（ミリ秒）'),
  ('batch_query_size', '10', 'バッチクエリの最大サイズ'),
  ('adaptive_difficulty_threshold', '0.8', '難易度調整の正答率閾値');

-- ============================================================
-- 完了
-- ============================================================
