-- ユーザーテーブル（教師・児童）
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher', 'student')),
  class_code TEXT NOT NULL,
  student_number INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学校・クラステーブル
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_code TEXT UNIQUE NOT NULL,
  school_name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  class_name TEXT NOT NULL,
  teacher_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- カリキュラムテーブル（学年・教科・教科書会社・単元）
CREATE TABLE IF NOT EXISTS curriculum (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  textbook_company TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  unit_order INTEGER NOT NULL,
  total_hours INTEGER NOT NULL,
  unit_goal TEXT,
  non_cognitive_goal TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- コーステーブル（基礎・標準・発展）
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  course_level TEXT NOT NULL CHECK(course_level IN ('basic', 'standard', 'advanced')),
  course_display_name TEXT NOT NULL,
  selection_question_title TEXT NOT NULL,
  selection_question_content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- 学習カードテーブル
CREATE TABLE IF NOT EXISTS learning_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  card_number INTEGER NOT NULL,
  card_title TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK(card_type IN ('selection', 'main', 'check', 'optional')),
  new_terms TEXT,
  example_problem TEXT,
  example_solution TEXT,
  problem_content TEXT NOT NULL,
  difficulty_level TEXT CHECK(difficulty_level IN ('minimum', 'standard', 'advanced')),
  real_world_context TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ヒントカードテーブル
CREATE TABLE IF NOT EXISTS hint_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learning_card_id INTEGER NOT NULL,
  hint_number INTEGER NOT NULL,
  hint_content TEXT NOT NULL,
  thinking_tool_suggestion TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id)
);

-- 選択問題テーブル（単元終了後の6つの発展問題）
CREATE TABLE IF NOT EXISTS optional_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  problem_number INTEGER NOT NULL,
  problem_title TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  problem_content TEXT NOT NULL,
  problem_category TEXT CHECK(problem_category IN ('creative', 'fieldwork', 'critical', 'social', 'metacognitive', 'other')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- 学習環境デザインテーブル
CREATE TABLE IF NOT EXISTS learning_environment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('creative', 'fieldwork', 'critical', 'social', 'metacognitive', 'other')),
  environment_title TEXT NOT NULL,
  environment_description TEXT NOT NULL,
  materials_needed TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- 学習進捗テーブル
CREATE TABLE IF NOT EXISTS student_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  course_id INTEGER,
  learning_card_id INTEGER,
  status TEXT NOT NULL CHECK(status IN ('not_started', 'in_progress', 'completed')),
  understanding_level INTEGER CHECK(understanding_level BETWEEN 1 AND 5),
  help_requested_from TEXT CHECK(help_requested_from IN ('ai', 'teacher', 'friend', 'hint')),
  help_count INTEGER DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id)
);

-- 学習計画テーブル
CREATE TABLE IF NOT EXISTS learning_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  planned_date DATE NOT NULL,
  actual_date DATE,
  learning_card_id INTEGER,
  reflection_good TEXT,
  reflection_bad TEXT,
  reflection_learned TEXT,
  ai_feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id)
);

-- 評価テーブル（3観点評価）
CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  knowledge_skill TEXT CHECK(knowledge_skill IN ('A', 'B', 'C')),
  thinking_judgment_expression TEXT CHECK(thinking_judgment_expression IN ('A', 'B', 'C')),
  attitude_toward_learning TEXT CHECK(attitude_toward_learning IN ('A', 'B', 'C')),
  non_cognitive_evaluation TEXT,
  teacher_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- 解答テーブル
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learning_card_id INTEGER,
  optional_problem_id INTEGER,
  answer_content TEXT NOT NULL,
  explanation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id),
  FOREIGN KEY (optional_problem_id) REFERENCES optional_problems(id)
);

-- カスタマイズコンテンツテーブル（先生のカスタマイズ用）
CREATE TABLE IF NOT EXISTS custom_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  original_learning_card_id INTEGER,
  original_optional_problem_id INTEGER,
  content_type TEXT NOT NULL CHECK(content_type IN ('learning_card', 'optional_problem', 'hint')),
  custom_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (original_learning_card_id) REFERENCES learning_cards(id),
  FOREIGN KEY (original_optional_problem_id) REFERENCES optional_problems(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_users_class_code ON users(class_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_curriculum_grade_subject ON curriculum(grade, subject);
CREATE INDEX IF NOT EXISTS idx_courses_curriculum ON courses(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_course ON learning_cards(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_curriculum ON student_progress(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
