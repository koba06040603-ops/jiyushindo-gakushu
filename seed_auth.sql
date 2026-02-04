-- Phase 4: 認証システムのテストデータ

-- 学校データ（ID 1はすでに存在する可能性があるため、INSERT OR IGNOREを使用）
INSERT OR IGNORE INTO schools (school_id, school_name, school_code, school_type, prefecture, city, is_active)
VALUES (1, '東京都立サンプル小学校', 'SCHOOL001', 'elementary', '東京都', '新宿区', TRUE);

-- クラスデータ
INSERT OR IGNORE INTO classes (class_id, class_code, class_name, grade_level, school_year, is_active)
VALUES 
  (1, 'CLASS2024A', '4年1組', 4, 2024, TRUE),
  (2, 'CLASS2024B', '4年2組', 4, 2024, TRUE);

-- ユーザーデータ（auth_users）
-- パスワードハッシュは bcrypt でハッシュ化（password123）
INSERT OR REPLACE INTO auth_users (user_id, username, password_hash, full_name, user_role, school_id, is_active)
VALUES
  -- 教師（password: password123）
  (1, 'teacher1', '$2b$10$zDwYCyH74.LhE8XaoZlJ1uY5/4/WeTqjEk77aWWaZ7wnZUZUPKN2q', '山田 太郎', 'teacher', 1, TRUE),
  (2, 'teacher2', '$2b$10$zDwYCyH74.LhE8XaoZlJ1uY5/4/WeTqjEk77aWWaZ7wnZUZUPKN2q', '佐藤 花子', 'teacher', 1, TRUE),
  
  -- 学生（password: password123）
  (3, 'student1', '$2b$10$zDwYCyH74.LhE8XaoZlJ1uY5/4/WeTqjEk77aWWaZ7wnZUZUPKN2q', '田中 一郎', 'student', 1, TRUE),
  (4, 'student2', '$2b$10$zDwYCyH74.LhE8XaoZlJ1uY5/4/WeTqjEk77aWWaZ7wnZUZUPKN2q', '鈴木 二郎', 'student', 1, TRUE),
  (5, 'student3', '$2b$10$zDwYCyH74.LhE8XaoZlJ1uY5/4/WeTqjEk77aWWaZ7wnZUZUPKN2q', '高橋 三郎', 'student', 1, TRUE),
  
  -- 管理者（password: password123）
  (7, 'admin1', '$2b$10$zDwYCyH74.LhE8XaoZlJ1uY5/4/WeTqjEk77aWWaZ7wnZUZUPKN2q', '管理者', 'admin', 1, TRUE);

-- 学生とクラスの関連付け（students テーブルにデータを追加）
INSERT OR IGNORE INTO students (student_id, student_name, grade_level, role, is_active)
VALUES
  (3, '田中 一郎', 4, 'student', TRUE),
  (4, '鈴木 二郎', 4, 'student', TRUE),
  (5, '高橋 三郎', 4, 'student', TRUE);

SELECT '✅ Phase 4: 認証システムのテストデータを挿入しました' as status;
