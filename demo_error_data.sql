-- デモ用の誤答データ（AI誤答分析用）
-- カリキュラムID=1（かけ算の筆算）の誤答データ

-- 山田太郎（id=2）の誤答データ - 学習カード3で繰り上がりを忘れる
INSERT OR REPLACE INTO error_history (student_id, curriculum_id, question_type, question_id, question_number, answer_text, correct_answer, is_correct, error_pattern, ai_feedback, submitted_at)
VALUES 
  (2, 1, 'learning_card', 3, 1, '23 × 4 = 82', '23 × 4 = 92', 0, 'くり上がり忘れ', 'くり上がりを忘れています。3×4=12なので、1をくり上げて2×4+1=9になります。正解は92です。', datetime('now', '-3 hours')),
  (2, 1, 'learning_card', 3, 2, '32 × 3 = 96', '32 × 3 = 96', 1, NULL, '正解です！くり上がりを正しく計算できました。', datetime('now', '-2 hours 50 minutes')),
  (2, 1, 'learning_card', 3, 3, '14 × 5 = 60', '14 × 5 = 70', 0, 'くり上がり忘れ', 'くり上がりを忘れています。4×5=20なので、2をくり上げて1×5+2=7になります。正解は70です。', datetime('now', '-2 hours 40 minutes')),
  (2, 1, 'learning_card', 4, 1, '27 × 6 = 142', '27 × 6 = 162', 0, 'くり上がり計算ミス', 'くり上がりの計算が間違っています。7×6=42で4をくり上げ、2×6+4=16です。正解は162です。', datetime('now', '-2 hours')),
  (2, 1, 'learning_card', 5, 1, '123 × 4 = 482', '123 × 4 = 492', 0, 'くり上がり忘れ', '十の位のくり上がりを忘れています。2×4=8、3×4=12(1くり上げ)、1×4+1=5です。', datetime('now', '-1 hour 30 minutes'));

-- 佐藤花子（id=3）の誤答データ - 位の間違いが多い
INSERT OR REPLACE INTO error_history (student_id, curriculum_id, question_type, question_id, question_number, answer_text, correct_answer, is_correct, error_pattern, ai_feedback, submitted_at)
VALUES 
  (3, 1, 'check_test', 1, 1, '25 × 3 = 615', '25 × 3 = 75', 0, '位のずれ', '位（くら）がずれています。5×3=15の5を一の位に、1を十の位にくり上げます。2×3=6にくり上げた1を足して7になります。正解は75です。', datetime('now', '-2 hours 30 minutes')),
  (3, 1, 'check_test', 1, 2, '34 × 2 = 68', '34 × 2 = 68', 1, NULL, '正解です！位を正しく揃えて計算できました。', datetime('now', '-2 hours 20 minutes')),
  (3, 1, 'check_test', 2, 1, '46 × 5 = 2010', '46 × 5 = 230', 0, '位のずれ', '位がずれています。6×5=30の0を一の位、3を十の位にくり上げ。4×5+3=23で、23を百の位と十の位に書きます。', datetime('now', '-1 hour 45 minutes')),
  (3, 1, 'learning_card', 8, 1, '52 × 7 = 354', '52 × 7 = 364', 0, 'くり上がり計算ミス', 'くり上がりの足し算が間違っています。2×7=14(1くり上げ)、5×7+1=36です。正解は364です。', datetime('now', '-1 hour'));

-- 鈴木次郎（id=4）の誤答データ - ほぼ完璧だが応用問題で立式ミス
INSERT OR REPLACE INTO error_history (student_id, curriculum_id, question_type, question_id, question_number, answer_text, correct_answer, is_correct, error_pattern, ai_feedback, submitted_at)
VALUES 
  (4, 1, 'optional', 3, 1, '1個120円のりんごを35個買いました。代金は何円でしょうか。答え：120 + 35 = 155円', '120 × 35 = 4200円', 0, '立式ミス（足し算使用）', '足し算ではなくかけ算を使います。「1個あたり120円」が「35個」なので、120 × 35 = 4200円です。', datetime('now', '-1 hour 15 minutes')),
  (4, 1, 'optional', 3, 2, '1個120円のりんごを35個買いました。代金は何円でしょうか。答え：120 × 35 = 4200円', '120 × 35 = 4200円', 1, NULL, '正解です！かけ算を正しく使えました。文章からかけ算の式を作ることができましたね。', datetime('now', '-1 hour')),
  (4, 1, 'optional', 4, 1, '教室に6列の机があり、各列に8個ずつ椅子があります。答え：6 + 8 = 14個', '6 × 8 = 48個', 0, '立式ミス（足し算使用）', '「6列」それぞれに「8個ずつ」なので、6 × 8 = 48個です。「〜ずつ」という言葉があるときはかけ算を使うことが多いです。', datetime('now', '-50 minutes')),
  (4, 1, 'optional', 4, 2, '教室に6列の机があり、各列に8個ずつ椅子があります。答え：6 × 8 = 48個', '6 × 8 = 48個', 1, NULL, '正解です！「〜ずつ」からかけ算の式を作れました。', datetime('now', '-40 minutes'));
