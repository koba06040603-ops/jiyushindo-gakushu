-- デモ用進捗データ投入スクリプト
-- CLASS2024Aの児童用進捗データ

-- まず、CLASS2024Aの児童を確認
-- id: 2 (山田太郎), 3 (佐藤花子), 4 (鈴木一郎) を想定

-- カリキュラムID=1 (かけ算の筆算) の進捗データ

-- 山田太郎 (id=2): じっくりコース、3枚目、ヘルプ要請中
INSERT OR REPLACE INTO student_progress (student_id, curriculum_id, course_id, learning_card_id, status, understanding_level, help_requested_from, help_count, created_at, last_activity_at)
VALUES 
  (2, 1, 1, 1, 'completed', 3, NULL, 0, datetime('now', '-2 hours'), datetime('now', '-2 hours')),
  (2, 1, 1, 2, 'completed', 3, NULL, 0, datetime('now', '-1 hours'), datetime('now', '-1 hours')),
  (2, 1, 1, 3, 'in_progress', 3, 'teacher', 3, datetime('now', '-10 minutes'), datetime('now', '-10 minutes'));

-- 佐藤花子 (id=3): しっかりコース、2枚目、停滞中
INSERT OR REPLACE INTO student_progress (student_id, curriculum_id, course_id, learning_card_id, status, understanding_level, help_requested_from, help_count, created_at, last_activity_at)
VALUES 
  (3, 1, 2, 7, 'completed', 2, 'ai', 2, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
  (3, 1, 2, 8, 'in_progress', 2, NULL, 2, datetime('now', '-40 minutes'), datetime('now', '-40 minutes'));

-- 鈴木一郎 (id=4): ぐんぐんコース、5枚目、順調
INSERT OR REPLACE INTO student_progress (student_id, curriculum_id, course_id, learning_card_id, status, understanding_level, help_requested_from, help_count, created_at, last_activity_at)
VALUES 
  (4, 1, 3, 13, 'completed', 5, NULL, 0, datetime('now', '-5 hours'), datetime('now', '-5 hours')),
  (4, 1, 3, 14, 'completed', 5, NULL, 0, datetime('now', '-4 hours'), datetime('now', '-4 hours')),
  (4, 1, 3, 15, 'completed', 5, NULL, 0, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
  (4, 1, 3, 16, 'completed', 4, NULL, 0, datetime('now', '-2 hours'), datetime('now', '-2 hours')),
  (4, 1, 3, 17, 'in_progress', 4, NULL, 0, datetime('now', '-30 minutes'), datetime('now', '-5 minutes'));

-- チェックテスト進捗データ
INSERT OR REPLACE INTO check_test_progress (student_id, curriculum_id, problem_number, status, attempts, completed_at, created_at)
VALUES
  -- 山田太郎
  (2, 1, 1, 'completed', 1, datetime('now', '-2 hours'), datetime('now', '-2 hours')),
  (2, 1, 2, 'in_progress', 1, NULL, datetime('now', '-15 minutes')),
  
  -- 佐藤花子
  (3, 1, 1, 'completed', 2, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
  
  -- 鈴木一郎
  (4, 1, 1, 'completed', 1, datetime('now', '-5 hours'), datetime('now', '-5 hours')),
  (4, 1, 2, 'completed', 1, datetime('now', '-4 hours'), datetime('now', '-4 hours')),
  (4, 1, 3, 'completed', 1, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
  (4, 1, 4, 'completed', 1, datetime('now', '-2 hours'), datetime('now', '-2 hours')),
  (4, 1, 5, 'in_progress', 1, NULL, datetime('now', '-30 minutes'));

-- 選択問題進捗データ
INSERT OR REPLACE INTO optional_problem_progress (student_id, curriculum_id, optional_problem_id, status, started_at, completed_at, time_spent, created_at)
VALUES
  -- 山田太郎 (問題ID 1-3)
  (2, 1, 1, 'completed', datetime('now', '-2 hours 10 minutes'), datetime('now', '-2 hours'), 600, datetime('now', '-2 hours')),
  (2, 1, 2, 'completed', datetime('now', '-1 hours 40 minutes'), datetime('now', '-1 hours 30 minutes'), 600, datetime('now', '-1 hours 30 minutes')),
  (2, 1, 3, 'in_progress', datetime('now', '-20 minutes'), NULL, 1200, datetime('now', '-20 minutes')),
  
  -- 佐藤花子 (問題ID 1)
  (3, 1, 1, 'completed', datetime('now', '-3 hours 15 minutes'), datetime('now', '-3 hours'), 900, datetime('now', '-3 hours')),
  
  -- 鈴木一郎 (問題ID 1-5)
  (4, 1, 1, 'completed', datetime('now', '-5 hours 10 minutes'), datetime('now', '-5 hours'), 600, datetime('now', '-5 hours')),
  (4, 1, 2, 'completed', datetime('now', '-4 hours 40 minutes'), datetime('now', '-4 hours 30 minutes'), 600, datetime('now', '-4 hours 30 minutes')),
  (4, 1, 3, 'completed', datetime('now', '-4 hours 10 minutes'), datetime('now', '-4 hours'), 600, datetime('now', '-4 hours')),
  (4, 1, 4, 'completed', datetime('now', '-3 hours 40 minutes'), datetime('now', '-3 hours 30 minutes'), 600, datetime('now', '-3 hours 30 minutes')),
  (4, 1, 5, 'in_progress', datetime('now', '-1 hour 10 minutes'), NULL, 600, datetime('now', '-1 hour'));

