-- ============================================
-- Phase 10-2: パフォーマンス監視
-- パフォーマンス指標テーブル
-- ============================================

-- パフォーマンスメトリクステーブル
CREATE TABLE IF NOT EXISTS performance_metrics (
  metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL, -- 'api_response_time', 'page_load_time', 'db_query_time'
  endpoint TEXT,
  response_time_ms INTEGER,
  status_code INTEGER,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
);

-- エラーログテーブル
CREATE TABLE IF NOT EXISTS error_logs (
  error_id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL, -- 'javascript', 'api', 'database', 'network'
  error_message TEXT,
  stack_trace TEXT,
  endpoint TEXT,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
);

-- システムヘルスチェックテーブル
CREATE TABLE IF NOT EXISTS system_health_checks (
  check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_type TEXT NOT NULL, -- 'database', 'api', 'cache', 'storage'
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  details TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- アラート設定テーブル
CREATE TABLE IF NOT EXISTS alert_settings (
  alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'error_rate', 'response_time', 'downtime'
  threshold_value REAL,
  notification_type TEXT DEFAULT 'email', -- 'email', 'webhook'
  notification_target TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_school_id ON performance_metrics(school_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_school_id ON error_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_type ON system_health_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON system_health_checks(checked_at);

-- デフォルトのアラート設定
INSERT OR IGNORE INTO alert_settings (alert_id, alert_name, alert_type, threshold_value, notification_type, school_id) VALUES
  (1, '高エラー率アラート', 'error_rate', 5.0, 'email', 1),
  (2, '応答時間アラート', 'response_time', 1000.0, 'email', 1),
  (3, 'ダウンタイムアラート', 'downtime', 60.0, 'email', 1);

SELECT '✅ Migration: Performance monitoring tables created' as status;
