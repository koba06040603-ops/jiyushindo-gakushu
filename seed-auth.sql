-- デモ用ユーザーを作成
-- パスワードは 'demo123' (SHA-256ハッシュ)

-- 教師アカウント
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, class_code, is_active, student_number) VALUES
(100, '田中先生', 'demo@school.jp', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'teacher', 'CLASS2024A', 1, NULL);

-- 児童アカウント
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, class_code, is_active, student_number) VALUES
(101, '山田太郎', 'student1@school.jp', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'student', 'CLASS2024A', 1, 1),
(102, '鈴木花子', 'student2@school.jp', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'student', 'CLASS2024A', 1, 2),
(103, '佐藤次郎', 'student3@school.jp', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'student', 'CLASS2024A', 1, 3);

-- 管理者アカウント
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, class_code, is_active, student_number) VALUES
(200, '管理者', 'admin@school.jp', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'admin', 'ADMIN', 1, NULL);
