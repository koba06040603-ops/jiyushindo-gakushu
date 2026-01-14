-- 0009_progress_board_enhancements.sql
-- 進捗ボード強化のためのマイグレーション

-- student_progressテーブルにヘルプ関連カラムを追加
ALTER TABLE student_progress ADD COLUMN help_requested_at DATETIME;
ALTER TABLE student_progress ADD COLUMN help_resolved_at DATETIME;
ALTER TABLE student_progress ADD COLUMN last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE student_progress ADD COLUMN help_type TEXT; -- ai, teacher, friend, hint

-- インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_student_progress_help_requested 
  ON student_progress(help_requested_at);
CREATE INDEX IF NOT EXISTS idx_student_progress_last_activity 
  ON student_progress(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_student_progress_learning_card_id 
  ON student_progress(learning_card_id);

-- 進捗ボード用ビューを作成
CREATE VIEW IF NOT EXISTS v_progress_board AS
SELECT 
  sp.id,
  sp.student_id,
  sp.learning_card_id as card_id,
  sp.curriculum_id,
  sp.status,
  sp.understanding_level,
  sp.help_type,
  sp.help_requested_at,
  sp.help_resolved_at,
  sp.last_activity_at,
  sp.created_at,
  u.name as student_name,
  u.class_code,
  lc.card_title,
  lc.card_number,
  lc.card_type,
  lc.course_id,
  c.course_level,
  c.course_name,
  cur.unit_name,
  cur.subject,
  cur.grade,
  -- 停滞時間（分）を計算
  CAST((julianday('now') - julianday(sp.last_activity_at)) * 24 * 60 AS INTEGER) as stagnant_minutes,
  -- ヘルプ待ち時間（分）を計算
  CASE 
    WHEN sp.help_requested_at IS NOT NULL AND sp.help_resolved_at IS NULL 
    THEN CAST((julianday('now') - julianday(sp.help_requested_at)) * 24 * 60 AS INTEGER)
    ELSE 0 
  END as help_waiting_minutes,
  -- 指導介入優先度スコア（高いほど優先）
  CASE 
    -- ヘルプ要求中（最優先）
    WHEN sp.help_requested_at IS NOT NULL AND sp.help_resolved_at IS NULL 
    THEN 100 + CAST((julianday('now') - julianday(sp.help_requested_at)) * 24 * 60 AS INTEGER)
    -- 理解度低（20点以下）かつ停滞中
    WHEN sp.understanding_level <= 20 AND CAST((julianday('now') - julianday(sp.last_activity_at)) * 24 * 60 AS INTEGER) > 10
    THEN 80 + CAST((julianday('now') - julianday(sp.last_activity_at)) * 24 * 60 AS INTEGER)
    -- 停滞時間が長い（30分以上）
    WHEN CAST((julianday('now') - julianday(sp.last_activity_at)) * 24 * 60 AS INTEGER) > 30
    THEN 60 + CAST((julianday('now') - julianday(sp.last_activity_at)) * 24 * 60 AS INTEGER)
    -- 理解度低（40点以下）
    WHEN sp.understanding_level <= 40
    THEN 40 + (50 - sp.understanding_level)
    -- 通常
    ELSE 20
  END as intervention_priority
FROM student_progress sp
JOIN users u ON sp.student_id = u.id
JOIN learning_cards lc ON sp.card_id = lc.id
JOIN courses c ON lc.course_id = c.id
JOIN curriculum cur ON sp.curriculum_id = cur.id
WHERE sp.status IN ('in_progress', 'help_needed', 'struggling');

-- 選択問題進捗テーブルを作成
CREATE TABLE IF NOT EXISTS optional_problem_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  optional_problem_id INTEGER NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  started_at DATETIME,
  completed_at DATETIME,
  time_spent INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (optional_problem_id) REFERENCES optional_problems(id),
  UNIQUE(student_id, optional_problem_id)
);

CREATE INDEX IF NOT EXISTS idx_optional_problem_progress_student 
  ON optional_problem_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_optional_problem_progress_curriculum 
  ON optional_problem_progress(curriculum_id);

-- チェックテスト進捗テーブルを作成
CREATE TABLE IF NOT EXISTS check_test_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  problem_number INTEGER NOT NULL,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, failed
  attempts INTEGER DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  UNIQUE(student_id, curriculum_id, problem_number)
);

CREATE INDEX IF NOT EXISTS idx_check_test_progress_student 
  ON check_test_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_check_test_progress_curriculum 
  ON check_test_progress(curriculum_id);
