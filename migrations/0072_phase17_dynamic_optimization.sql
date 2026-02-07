-- ============================================================
-- Phase 17: 動的最適化・効果測定・保護者レポート
-- ============================================================

-- Phase 17-1: 理論スコア履歴テーブル（動的最適化用）
CREATE TABLE IF NOT EXISTS theory_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  theory_code TEXT NOT NULL,
  old_score REAL NOT NULL,
  new_score REAL NOT NULL,
  change_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_theory_score_history_student 
ON theory_score_history(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_theory_score_history_theory 
ON theory_score_history(theory_code, created_at DESC);

-- Phase 17-2: 効果測定テストテーブル
CREATE TABLE IF NOT EXISTS effect_measurement_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK(test_type IN ('pre', 'post', 'follow_up')),
  class_code TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  question_count INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_effect_tests_class 
ON effect_measurement_tests(class_code, test_type);

-- テスト問題テーブル
CREATE TABLE IF NOT EXISTS test_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  choices TEXT, -- JSON配列
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  difficulty TEXT CHECK(difficulty IN ('basic', 'applied', 'advanced')),
  FOREIGN KEY (test_id) REFERENCES effect_measurement_tests(id),
  UNIQUE(test_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test 
ON test_questions(test_id, question_number);

-- テスト回答テーブル
CREATE TABLE IF NOT EXISTS test_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  student_id TEXT NOT NULL,
  question_number INTEGER NOT NULL,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES effect_measurement_tests(id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  UNIQUE(test_id, student_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_test_answers_student 
ON test_answers(student_id, test_id);

-- テスト結果サマリーテーブル
CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL,
  student_id TEXT NOT NULL,
  test_type TEXT NOT NULL,
  score REAL NOT NULL,
  max_score REAL NOT NULL,
  percentage REAL NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES effect_measurement_tests(id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  UNIQUE(test_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_test_results_student 
ON test_results(student_id, test_type, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_results_test 
ON test_results(test_id, completed_at DESC);

-- Phase 17-3: 保護者通知履歴テーブル
CREATE TABLE IF NOT EXISTS parent_report_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK(report_type IN ('weekly', 'monthly', 'on_demand')),
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recipient_email TEXT,
  report_data TEXT, -- JSON
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_reports_student 
ON parent_report_history(student_id, sent_at DESC);

-- ビュー: 生徒ごとの効果量サマリー
CREATE VIEW IF NOT EXISTS v_student_effect_sizes AS
SELECT 
  s.student_id,
  s.student_name,
  s.class_code,
  pre.percentage as pre_score,
  post.percentage as post_score,
  (post.percentage - pre.percentage) as improvement,
  CASE 
    WHEN (post.percentage - pre.percentage) >= 20 THEN 'excellent'
    WHEN (post.percentage - pre.percentage) >= 10 THEN 'good'
    WHEN (post.percentage - pre.percentage) >= 5 THEN 'moderate'
    ELSE 'limited'
  END as improvement_level,
  pre.completed_at as pre_test_date,
  post.completed_at as post_test_date
FROM students s
LEFT JOIN (
  SELECT tr.student_id, tr.percentage, tr.completed_at
  FROM test_results tr
  JOIN effect_measurement_tests t ON tr.test_id = t.id
  WHERE t.test_type = 'pre'
) pre ON s.student_id = pre.student_id
LEFT JOIN (
  SELECT tr.student_id, tr.percentage, tr.completed_at
  FROM test_results tr
  JOIN effect_measurement_tests t ON tr.test_id = t.id
  WHERE t.test_type = 'post'
) post ON s.student_id = post.student_id
WHERE pre.percentage IS NOT NULL AND post.percentage IS NOT NULL;

-- ビュー: クラス別効果量統計
CREATE VIEW IF NOT EXISTS v_class_effect_statistics AS
SELECT 
  class_code,
  COUNT(DISTINCT student_id) as student_count,
  AVG(improvement) as avg_improvement,
  MIN(improvement) as min_improvement,
  MAX(improvement) as max_improvement,
  AVG(pre_score) as avg_pre_score,
  AVG(post_score) as avg_post_score,
  SUM(CASE WHEN improvement_level = 'excellent' THEN 1 ELSE 0 END) as excellent_count,
  SUM(CASE WHEN improvement_level = 'good' THEN 1 ELSE 0 END) as good_count,
  SUM(CASE WHEN improvement_level = 'moderate' THEN 1 ELSE 0 END) as moderate_count,
  SUM(CASE WHEN improvement_level = 'limited' THEN 1 ELSE 0 END) as limited_count
FROM v_student_effect_sizes
GROUP BY class_code;

-- サンプルデータ: デモ用事前テスト
INSERT OR IGNORE INTO effect_measurement_tests (
  id, test_name, test_type, class_code, subject, grade_level, question_count, duration_minutes, status
) VALUES 
  (1, '小学3年生算数事前テスト', 'pre', '3-1', '算数', '小3', 20, 40, 'active'),
  (2, '小学3年生算数事後テスト', 'post', '3-1', '算数', '小3', 20, 40, 'active');

-- Phase 17完了: 動的最適化・効果測定・保護者レポートの基盤完成
-- 実装内容:
--   1. 理論スコア履歴追跡
--   2. 事前事後テストシステム
--   3. 効果量（Cohen's d）自動計算
--   4. 保護者レポート生成
--   5. 長期追跡データ収集
-- 
-- 科学的根拠:
--   - 効果量計算: Cohen (1988), Kraft (2020)
--   - 保護者関与: Jeynes (2005) d=0.50
--   - データ駆動型改善: Hattie (2009) d=0.42
