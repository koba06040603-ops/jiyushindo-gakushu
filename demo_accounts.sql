-- デモアカウント作成用SQL
-- パスワードはすべて "demo2024" (SHA-256ハッシュ化済み)
-- ハッシュ値: 3fb59388d9fcc5f7b965bc0f1747bea74c0f59102e733e1a7279911899e2879b

-- 1. 教師アカウント（先生用）
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, class_code, is_active, created_at)
VALUES (
  1001,
  '田中 太郎（教師）',
  'teacher@demo.local',
  '3fb59388d9fcc5f7b965bc0f1747bea74c0f59102e733e1a7279911899e2879b',
  'teacher',
  'DEMO_CLASS_2024',
  1,
  datetime('now')
);

-- 2. 生徒アカウント（高理解度）
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, class_code, student_number, is_active, created_at)
VALUES (
  2001,
  '佐藤 花子（生徒）',
  'student1@demo.local',
  '3fb59388d9fcc5f7b965bc0f1747bea74c0f59102e733e1a7279911899e2879b',
  'student',
  'DEMO_CLASS_2024',
  '001',
  1,
  datetime('now')
);

-- 3. 生徒アカウント（中理解度）
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, class_code, student_number, is_active, created_at)
VALUES (
  2002,
  '鈴木 一郎（生徒）',
  'student2@demo.local',
  '3fb59388d9fcc5f7b965bc0f1747bea74c0f59102e733e1a7279911899e2879b',
  'student',
  'DEMO_CLASS_2024',
  '002',
  1,
  datetime('now')
);

-- 4. コーディネーターアカウント（教育改革担当者用）
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, class_code, is_active, created_at)
VALUES (
  3001,
  '山田 次郎（コーディネーター）',
  'coordinator@demo.local',
  '3fb59388d9fcc5f7b965bc0f1747bea74c0f59102e733e1a7279911899e2879b',
  'coordinator',
  'ALL_SCHOOLS',
  1,
  datetime('now')
);

-- デモクラス作成
INSERT OR IGNORE INTO classes (id, class_name, class_code, teacher_id, school_year, is_active, created_at)
VALUES (
  101,
  'デモクラス 2024年度',
  'DEMO_CLASS_2024',
  1001,
  2024,
  1,
  datetime('now')
);

-- サンプル学習カリキュラム
INSERT OR IGNORE INTO curriculums (id, title, subject, grade_level, description, learning_objectives, is_active, created_at)
VALUES (
  1,
  '算数：分数の計算',
  '算数',
  5,
  '分数の足し算・引き算・掛け算・割り算を学びます',
  '分数の四則演算を理解し、正確に計算できるようになる',
  1,
  datetime('now')
);

-- サンプル学習カード
INSERT OR IGNORE INTO learning_cards (id, curriculum_id, card_number, title, content, difficulty_level, estimated_time, is_active, created_at)
VALUES (
  1,
  1,
  1,
  '分数とは何か',
  '# 分数とは何か

## 分数の基本
分数とは、1つのものをいくつかに分けた「いくつか分」を表す数です。

例: 1/2（にぶんのいち）= ケーキを2つに分けた1つ分

## 練習問題
1. ピザを4等分したとき、1切れは全体の何分のいくつですか？
2. 10個のりんごのうち、3個は全体の何分のいくつですか？',
  1,
  15,
  1,
  datetime('now')
);

-- サンプル進捗データ（生徒1）
INSERT OR IGNORE INTO student_progress (student_id, card_id, understanding_level, completion_time, help_count, notes, completed_at)
VALUES (
  2001,
  1,
  5,
  12,
  0,
  '完璧に理解できました！',
  datetime('now', '-1 day')
);

-- サンプル進捗データ（生徒2）
INSERT OR IGNORE INTO student_progress (student_id, card_id, understanding_level, completion_time, help_count, notes, completed_at)
VALUES (
  2002,
  1,
  3,
  25,
  2,
  '少し難しかったです',
  datetime('now', '-1 day')
);
