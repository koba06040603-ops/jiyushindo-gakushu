-- 0010_user_authentication.sql
-- ユーザー認証機能のためのマイグレーション

-- usersテーブルに認証関連カラムを追加
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN last_login_at DATETIME;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;

-- emailのユニークインデックスを追加（UNIQUE制約の代わり）
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- セッションテーブルを作成
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  expires_at DATETIME NOT NULL,
  refresh_expires_at DATETIME,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- ロール権限テーブルを作成
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- デフォルト権限を挿入
-- 管理者（admin）: すべての権限
INSERT OR IGNORE INTO role_permissions (role, resource, action) VALUES
  ('admin', 'curriculum', 'create'),
  ('admin', 'curriculum', 'read'),
  ('admin', 'curriculum', 'update'),
  ('admin', 'curriculum', 'delete'),
  ('admin', 'user', 'create'),
  ('admin', 'user', 'read'),
  ('admin', 'user', 'update'),
  ('admin', 'user', 'delete'),
  ('admin', 'progress', 'read'),
  ('admin', 'reports', 'read');

-- 教師（teacher）: カリキュラム編集、進捗閲覧、レポート閲覧
INSERT OR IGNORE INTO role_permissions (role, resource, action) VALUES
  ('teacher', 'curriculum', 'create'),
  ('teacher', 'curriculum', 'read'),
  ('teacher', 'curriculum', 'update'),
  ('teacher', 'curriculum', 'delete'),
  ('teacher', 'progress', 'read'),
  ('teacher', 'reports', 'read');

-- 生徒（student）: 学習カード閲覧、自分の進捗更新
INSERT OR IGNORE INTO role_permissions (role, resource, action) VALUES
  ('student', 'curriculum', 'read'),
  ('student', 'progress', 'create'),
  ('student', 'progress', 'update');

-- 監査ログテーブルを作成
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
