-- ============================================
-- Phase 10-1: セキュリティ強化
-- 監査ログテーブルとセキュリティ設定
-- ============================================

-- セキュリティ監査ログテーブル
CREATE TABLE IF NOT EXISTS security_audit_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
);

-- セキュリティ設定テーブル
CREATE TABLE IF NOT EXISTS security_settings (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, setting_key)
);

-- レート制限ログテーブル
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  endpoint TEXT,
  request_count INTEGER DEFAULT 1,
  blocked INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 失敗したログイン試行記録
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  ip_address TEXT,
  attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_school_id ON security_audit_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip ON rate_limit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at ON rate_limit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_username ON failed_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_time ON failed_login_attempts(attempt_time);

-- デフォルトのセキュリティ設定を挿入
INSERT OR IGNORE INTO security_settings (school_id, setting_key, setting_value) VALUES
  (1, 'rate_limit_enabled', 'true'),
  (1, 'rate_limit_max_requests', '100'),
  (1, 'rate_limit_window_ms', '60000'),
  (1, 'csrf_protection_enabled', 'true'),
  (1, 'max_login_attempts', '5'),
  (1, 'login_lockout_duration_minutes', '15'),
  (1, 'password_min_length', '8'),
  (1, 'password_require_uppercase', 'true'),
  (1, 'password_require_lowercase', 'true'),
  (1, 'password_require_numbers', 'true'),
  (1, 'password_require_special', 'false'),
  (1, 'session_timeout_minutes', '1440');

SELECT '✅ Migration: Security tables and settings created' as status;
