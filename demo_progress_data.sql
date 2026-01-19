-- デモ用進捗データ投入スクリプト（修正版）
-- CLASS2024Aの児童用進捗データ
-- ルール:
--  1. 各コースは6枚の学習カード
--  2. 学習カード6枚全て完了後、チェックテストに進める
--  3. チェックテスト全て完了後、選択問題に進める

-- カリキュラムID=1 (かけ算の筆算) の進捗データ

-- ============================================================
-- 山田太郎 (id=2): じっくりコース
-- 学習カード: 5/6枚完了、6枚目に取り組み中
-- チェックテスト: まだ開始できない（学習カード未完了のため）
-- 選択問題: まだ開始できない
-- ============================================================
INSERT OR REPLACE INTO student_progress (student_id, curriculum_id, course_id, learning_card_id, status, understanding_level, help_requested_from, help_count, created_at, last_activity_at)
VALUES 
  -- じっくりコース: learning_card_id 1-6
  (2, 1, 1, 1, 'completed', 3, NULL, 0, datetime('now', '-5 hours'), datetime('now', '-5 hours')),
  (2, 1, 1, 2, 'completed', 3, NULL, 0, datetime('now', '-4 hours'), datetime('now', '-4 hours')),
  (2, 1, 1, 3, 'completed', 3, 'peer', 1, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
  (2, 1, 1, 4, 'completed', 3, NULL, 0, datetime('now', '-2 hours'), datetime('now', '-2 hours')),
  (2, 1, 1, 5, 'completed', 3, 'teacher', 2, datetime('now', '-1 hours'), datetime('now', '-1 hours')),
  (2, 1, 1, 6, 'in_progress', 3, 'teacher', 3, datetime('now', '-30 minutes'), datetime('now', '-5 minutes'));

-- チェックテスト: まだ開始できない（学習カード6枚未完了）
-- 選択問題: まだ開始できない

-- ============================================================
-- 佐藤花子 (id=3): しっかりコース
-- 学習カード: 6/6枚完了
-- チェックテスト: 2/5問完了、3問目に取り組み中
-- 選択問題: まだ開始できない（チェックテスト未完了のため）
-- ============================================================
INSERT OR REPLACE INTO student_progress (student_id, curriculum_id, course_id, learning_card_id, status, understanding_level, help_requested_from, help_count, created_at, last_activity_at)
VALUES 
  -- しっかりコース: learning_card_id 7-12
  (3, 1, 2, 7, 'completed', 4, NULL, 0, datetime('now', '-6 hours'), datetime('now', '-6 hours')),
  (3, 1, 2, 8, 'completed', 4, 'ai', 1, datetime('now', '-5 hours'), datetime('now', '-5 hours')),
  (3, 1, 2, 9, 'completed', 3, NULL, 0, datetime('now', '-4 hours'), datetime('now', '-4 hours')),
  (3, 1, 2, 10, 'completed', 4, 'ai', 2, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
  (3, 1, 2, 11, 'completed', 3, NULL, 0, datetime('now', '-2 hours'), datetime('now', '-2 hours')),
  (3, 1, 2, 12, 'completed', 4, NULL, 0, datetime('now', '-1 hours'), datetime('now', '-1 hours'));

-- チェックテスト: 学習カード完了後に開始
INSERT OR REPLACE INTO check_test_progress (student_id, curriculum_id, problem_number, status, attempts, completed_at, created_at)
VALUES
  (3, 1, 1, 'completed', 1, datetime('now', '-50 minutes'), datetime('now', '-50 minutes')),
  (3, 1, 2, 'completed', 2, datetime('now', '-40 minutes'), datetime('now', '-40 minutes')),
  (3, 1, 3, 'in_progress', 1, NULL, datetime('now', '-30 minutes'));

-- 選択問題: まだ開始できない（チェックテスト未完了）

-- ============================================================
-- 鈴木次郎 (id=4): ぐんぐんコース
-- 学習カード: 6/6枚完了
-- チェックテスト: 5/5問完了
-- 選択問題: 3/5問完了、4問目に取り組み中（順調）
-- ============================================================
INSERT OR REPLACE INTO student_progress (student_id, curriculum_id, course_id, learning_card_id, status, understanding_level, help_requested_from, help_count, created_at, last_activity_at)
VALUES 
  -- ぐんぐんコース: learning_card_id 13-18
  (4, 1, 3, 13, 'completed', 5, NULL, 0, datetime('now', '-7 hours'), datetime('now', '-7 hours')),
  (4, 1, 3, 14, 'completed', 5, NULL, 0, datetime('now', '-6 hours'), datetime('now', '-6 hours')),
  (4, 1, 3, 15, 'completed', 5, NULL, 0, datetime('now', '-5 hours'), datetime('now', '-5 hours')),
  (4, 1, 3, 16, 'completed', 5, NULL, 0, datetime('now', '-4 hours'), datetime('now', '-4 hours')),
  (4, 1, 3, 17, 'completed', 4, NULL, 0, datetime('now', '-3 hours'), datetime('now', '-3 hours')),
  (4, 1, 3, 18, 'completed', 5, NULL, 0, datetime('now', '-2 hours'), datetime('now', '-2 hours'));

-- チェックテスト: 学習カード完了後、全問クリア
INSERT OR REPLACE INTO check_test_progress (student_id, curriculum_id, problem_number, status, attempts, completed_at, created_at)
VALUES
  (4, 1, 1, 'completed', 1, datetime('now', '-1 hours 50 minutes'), datetime('now', '-1 hours 50 minutes')),
  (4, 1, 2, 'completed', 1, datetime('now', '-1 hours 40 minutes'), datetime('now', '-1 hours 40 minutes')),
  (4, 1, 3, 'completed', 1, datetime('now', '-1 hours 30 minutes'), datetime('now', '-1 hours 30 minutes')),
  (4, 1, 4, 'completed', 1, datetime('now', '-1 hours 20 minutes'), datetime('now', '-1 hours 20 minutes')),
  (4, 1, 5, 'completed', 1, datetime('now', '-1 hours 10 minutes'), datetime('now', '-1 hours 10 minutes'));

-- 選択問題: チェックテスト完了後に開始可能
INSERT OR REPLACE INTO optional_problem_progress (student_id, curriculum_id, optional_problem_id, status, started_at, completed_at, time_spent, created_at)
VALUES
  (4, 1, 1, 'completed', datetime('now', '-1 hours'), datetime('now', '-55 minutes'), 300, datetime('now', '-55 minutes')),
  (4, 1, 2, 'completed', datetime('now', '-50 minutes'), datetime('now', '-45 minutes'), 300, datetime('now', '-45 minutes')),
  (4, 1, 3, 'completed', datetime('now', '-40 minutes'), datetime('now', '-35 minutes'), 300, datetime('now', '-35 minutes')),
  (4, 1, 4, 'in_progress', datetime('now', '-30 minutes'), NULL, 1800, datetime('now', '-30 minutes'));
