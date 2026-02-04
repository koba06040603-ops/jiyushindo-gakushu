-- Phase 4-6: 権限管理システム

-- 権限テーブル
CREATE TABLE IF NOT EXISTS permissions (
  permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
  permission_name TEXT UNIQUE NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ロール権限マッピングテーブル
CREATE TABLE IF NOT EXISTS role_permissions (
  role_permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_role TEXT NOT NULL CHECK(user_role IN ('admin', 'teacher', 'student')),
  permission_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_role, permission_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(user_role);

-- デフォルト権限の挿入
INSERT OR IGNORE INTO permissions (permission_name, description, resource, action) VALUES
  -- カリキュラム権限
  ('curriculum:read', 'カリキュラムの閲覧', 'curriculum', 'read'),
  ('curriculum:write', 'カリキュラムの編集', 'curriculum', 'write'),
  ('curriculum:delete', 'カリキュラムの削除', 'curriculum', 'delete'),
  
  -- 学生管理権限
  ('students:read', '学生情報の閲覧', 'students', 'read'),
  ('students:write', '学生情報の編集', 'students', 'write'),
  
  -- レポート権限
  ('reports:read', 'レポートの閲覧', 'reports', 'read'),
  ('reports:write', 'レポートの作成', 'reports', 'write'),
  
  -- 学習記録権限
  ('learning:read', '学習記録の閲覧', 'learning', 'read'),
  ('learning:write', '学習記録の作成', 'learning', 'write'),
  
  -- ユーザー管理権限（管理者のみ）
  ('users:read', 'ユーザー一覧の閲覧', 'users', 'read'),
  ('users:write', 'ユーザーの作成・編集', 'users', 'write'),
  ('users:delete', 'ユーザーの削除', 'users', 'delete');

-- ロール別のデフォルト権限マッピング
-- 管理者: すべての権限
INSERT OR IGNORE INTO role_permissions (user_role, permission_id)
SELECT 'admin', permission_id FROM permissions;

-- 教師: カリキュラム・学生・レポート・学習記録の全権限
INSERT OR IGNORE INTO role_permissions (user_role, permission_id)
SELECT 'teacher', permission_id FROM permissions 
WHERE permission_name IN (
  'curriculum:read', 'curriculum:write',
  'students:read', 'students:write',
  'reports:read', 'reports:write',
  'learning:read', 'learning:write'
);

-- 学生: カリキュラム閲覧、学習記録の全権限
INSERT OR IGNORE INTO role_permissions (user_role, permission_id)
SELECT 'student', permission_id FROM permissions 
WHERE permission_name IN (
  'curriculum:read',
  'learning:read', 'learning:write'
);

SELECT '✅ Migration 0048: permissions system created successfully' as status;
