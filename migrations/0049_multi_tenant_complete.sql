-- ============================================
-- Phase 5-4: マルチテナント完全実装
-- すべての主要テーブルを作成してschool_id対応
-- 既存テーブルの場合はスキップ
-- ============================================

-- 1. curriculumテーブル作成（school_id対応）
CREATE TABLE IF NOT EXISTS curriculum (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  textbook_company TEXT,
  unit_name TEXT NOT NULL,
  unit_order INTEGER DEFAULT 0,
  total_hours INTEGER DEFAULT 1,
  unit_goal TEXT,
  non_cognitive_goal TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. coursesテーブル作成（school_id対応）
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  curriculum_id INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  course_goal TEXT,
  estimated_minutes INTEGER DEFAULT 45,
  course_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. learning_cardsテーブル作成（school_id対応）
CREATE TABLE IF NOT EXISTS learning_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  course_id INTEGER NOT NULL,
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK(card_type IN ('instruction', 'practice', 'check_test')),
  card_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. problemsテーブル作成（school_id対応）
CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  card_id INTEGER NOT NULL,
  problem_type TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  hint TEXT,
  explanation TEXT,
  difficulty INTEGER DEFAULT 1,
  points INTEGER DEFAULT 1,
  problem_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. student_progressテーブル作成（school_id対応）
CREATE TABLE IF NOT EXISTS student_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  curriculum_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('not_started', 'in_progress', 'completed'))
);

-- 6. learning_logsテーブル作成（school_id対応）
CREATE TABLE IF NOT EXISTS learning_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  problem_id INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  time_spent INTEGER,
  hint_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_curriculum_school_id ON curriculum(school_id);
CREATE INDEX IF NOT EXISTS idx_courses_school_id ON courses(school_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_school_id ON learning_cards(school_id);
CREATE INDEX IF NOT EXISTS idx_problems_school_id ON problems(school_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_school_id ON student_progress(school_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_school_id ON learning_logs(school_id);

-- 複合インデックス（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_curriculum_school_grade ON curriculum(school_id, grade);
CREATE INDEX IF NOT EXISTS idx_courses_school_curriculum ON courses(school_id, curriculum_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_school_student ON student_progress(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_learning_logs_school_student ON learning_logs(school_id, student_id);

SELECT '✅ Migration 0049: Multi-tenant complete - school_id added to all main tables' as status;
