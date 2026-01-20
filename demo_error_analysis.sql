-- デモ用誤答分析データ（山田太郎のみ）
-- 山田太郎のID: 3（demo_data.sqlより）

-- 既存のエラーデータをクリア
DELETE FROM error_history WHERE student_id = 3;

-- かけ算の筆算（curriculum_id = 1）でのエラーデータ
-- パターン1: 繰り上がりの忘れ（最も多いエラー）
INSERT INTO error_history (student_id, curriculum_id, question_type, question_id, question_number, answer_text, correct_answer, is_correct, error_pattern, submitted_at)
VALUES 
  (3, 1, 'learning_card', 1, 1, '82', '92', 0, '繰り上がりの忘れ', datetime('now', '-5 days', '-2 hours')),
  (3, 1, 'learning_card', 2, 1, '186', '246', 0, '繰り上がりの忘れ', datetime('now', '-5 days', '-1 hour')),
  (3, 1, 'check_test', 0, 3, '144', '184', 0, '繰り上がりの忘れ', datetime('now', '-4 days', '-3 hours')),
  (3, 1, 'learning_card', 3, 1, '208', '248', 0, '繰り上がりの忘れ', datetime('now', '-3 days', '-2 hours')),
  (3, 1, 'learning_card', 4, 1, '276', '336', 0, '繰り上がりの忘れ', datetime('now', '-2 days', '-1 hour'));

-- パターン2: 位取りのミス
INSERT INTO error_history (student_id, curriculum_id, question_type, question_id, question_number, answer_text, correct_answer, is_correct, error_pattern, submitted_at)
VALUES 
  (3, 1, 'learning_card', 1, 2, '414', '644', 0, '位取りのミス', datetime('now', '-5 days', '-1 hour')),
  (3, 1, 'learning_card', 2, 2, '352', '532', 0, '位取りのミス', datetime('now', '-4 days', '-2 hours')),
  (3, 1, 'check_test', 0, 4, '189', '369', 0, '位取りのミス', datetime('now', '-3 days', '-1 hour'));

-- パターン3: 計算の順序間違い
INSERT INTO error_history (student_id, curriculum_id, question_type, question_id, question_number, answer_text, correct_answer, is_correct, error_pattern, submitted_at)
VALUES 
  (3, 1, 'learning_card', 3, 2, '128', '138', 0, '計算の順序間違い', datetime('now', '-4 days', '-3 hours')),
  (3, 1, 'learning_card', 4, 2, '156', '166', 0, '計算の順序間違い', datetime('now', '-2 days', '-2 hours'));

-- 正解データも追加（正答率を計算するため）
INSERT INTO error_history (student_id, curriculum_id, question_type, question_id, question_number, answer_text, correct_answer, is_correct, error_pattern, submitted_at)
VALUES 
  -- 5日前: 2問正解
  (3, 1, 'learning_card', 1, 3, '69', '69', 1, NULL, datetime('now', '-5 days', '-30 minutes')),
  (3, 1, 'learning_card', 1, 4, '84', '84', 1, NULL, datetime('now', '-5 days', '-15 minutes')),
  
  -- 4日前: 3問正解
  (3, 1, 'learning_card', 2, 3, '138', '138', 1, NULL, datetime('now', '-4 days', '-30 minutes')),
  (3, 1, 'learning_card', 2, 4, '104', '104', 1, NULL, datetime('now', '-4 days', '-20 minutes')),
  (3, 1, 'check_test', 0, 1, '56', '56', 1, NULL, datetime('now', '-4 days', '-10 minutes')),
  
  -- 3日前: 4問正解（改善の兆し）
  (3, 1, 'learning_card', 3, 3, '276', '276', 1, NULL, datetime('now', '-3 days', '-40 minutes')),
  (3, 1, 'learning_card', 3, 4, '368', '368', 1, NULL, datetime('now', '-3 days', '-30 minutes')),
  (3, 1, 'check_test', 0, 2, '112', '112', 1, NULL, datetime('now', '-3 days', '-20 minutes')),
  (3, 1, 'learning_card', 4, 3, '207', '207', 1, NULL, datetime('now', '-3 days', '-10 minutes')),
  
  -- 2日前: 5問正解（さらに改善）
  (3, 1, 'learning_card', 4, 4, '414', '414', 1, NULL, datetime('now', '-2 days', '-50 minutes')),
  (3, 1, 'learning_card', 5, 1, '552', '552', 1, NULL, datetime('now', '-2 days', '-40 minutes')),
  (3, 1, 'learning_card', 5, 2, '828', '828', 1, NULL, datetime('now', '-2 days', '-30 minutes')),
  (3, 1, 'learning_card', 5, 3, '736', '736', 1, NULL, datetime('now', '-2 days', '-20 minutes')),
  (3, 1, 'check_test', 0, 5, '345', '345', 1, NULL, datetime('now', '-2 days', '-10 minutes')),
  
  -- 1日前: 6問正解（大きく改善）
  (3, 1, 'learning_card', 6, 1, '644', '644', 1, NULL, datetime('now', '-1 day', '-60 minutes')),
  (3, 1, 'learning_card', 6, 2, '966', '966', 1, NULL, datetime('now', '-1 day', '-50 minutes')),
  (3, 1, 'learning_card', 6, 3, '828', '828', 1, NULL, datetime('now', '-1 day', '-40 minutes')),
  (3, 1, 'learning_card', 6, 4, '1104', '1104', 1, NULL, datetime('now', '-1 day', '-30 minutes')),
  (3, 1, 'check_test', 0, 6, '483', '483', 1, NULL, datetime('now', '-1 day', '-20 minutes')),
  (3, 1, 'check_test', 0, 7, '552', '552', 1, NULL, datetime('now', '-1 day', '-10 minutes'));
