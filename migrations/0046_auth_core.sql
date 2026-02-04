-- ============================================
-- Phase 4: 認証システムとマルチテナント - シンプル版
-- ============================================

-- schools, classesテーブルは既に存在するためスキップ

-- デフォルトデータ（schoolsテーブルに既存データがない場合のみ）
INSERT OR IGNORE INTO schools (school_name, school_code, prefecture, city) 
VALUES ('デモ小学校', 'DEMO001', '東京都', '渋谷区');

-- デフォルトクラス（既存データがない場合のみ）
INSERT OR IGNORE INTO classes (class_code, class_name, grade_level, school_year) 
VALUES ('CLS001', '3年1組', 3, 2026);

-- 3. ユーザーテーブル
CREATE TABLE IF NOT EXISTS auth_users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK(user_role IN ('admin', 'teacher', 'student')),
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 教師テーブル
CREATE TABLE IF NOT EXISTS auth_teachers (
  teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  school_id INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. セッションテーブル
CREATE TABLE IF NOT EXISTS auth_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);

-- デモユーザー（パスワード: password123）
INSERT OR IGNORE INTO auth_users (username, password_hash, full_name, user_role) 
VALUES ('teacher1', '$2a$10$rU8kHF2KhqUfj2V6QZqXV.YJ2w.vy6JZYmW7Vu8lB3xKxHx5q4pMG', '山田太郎', 'teacher');

INSERT OR IGNORE INTO auth_teachers (user_id, school_id) VALUES (1, 1);

INSERT OR IGNORE INTO auth_users (username, password_hash, full_name, user_role) 
VALUES ('student1', '$2a$10$rU8kHF2KhqUfj2V6QZqXV.YJ2w.vy6JZYmW7Vu8lB3xKxHx5q4pMG', '田中花子', 'student');
