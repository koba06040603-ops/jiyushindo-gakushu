-- Phase 3: 選択課題の成果物管理テーブルの追加

-- 選択課題の成果物（画像・ファイル）
CREATE TABLE IF NOT EXISTS optional_problem_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  optional_problem_id INTEGER NOT NULL,
  submission_type TEXT NOT NULL CHECK(submission_type IN ('image', 'text', 'file')),
  file_url TEXT,
  file_name TEXT,
  description TEXT,
  self_evaluation INTEGER CHECK(self_evaluation >= 1 AND self_evaluation <= 5),
  self_comment TEXT,
  teacher_comment TEXT,
  teacher_evaluation INTEGER CHECK(teacher_evaluation >= 1 AND teacher_evaluation <= 5),
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (optional_problem_id) REFERENCES optional_problems(id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_student ON optional_problem_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_curriculum ON optional_problem_submissions(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON optional_problem_submissions(optional_problem_id);

-- 教科横断評価テーブル (より詳細な非認知能力評価)
CREATE TABLE IF NOT EXISTS cross_subject_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  evaluation_period_start DATE NOT NULL,
  evaluation_period_end DATE NOT NULL,
  
  -- 教科横断的なスキル
  reading_comprehension INTEGER CHECK(reading_comprehension >= 0 AND reading_comprehension <= 100),
  writing_expression INTEGER CHECK(writing_expression >= 0 AND writing_expression <= 100),
  logical_thinking INTEGER CHECK(logical_thinking >= 0 AND logical_thinking <= 100),
  creative_thinking INTEGER CHECK(creative_thinking >= 0 AND creative_thinking <= 100),
  problem_solving INTEGER CHECK(problem_solving >= 0 AND problem_solving <= 100),
  
  -- 非認知能力（より詳細）
  persistence_score INTEGER CHECK(persistence_score >= 0 AND persistence_score <= 100),
  self_regulation_score INTEGER CHECK(self_regulation_score >= 0 AND self_regulation_score <= 100),
  collaboration_score INTEGER CHECK(collaboration_score >= 0 AND collaboration_score <= 100),
  curiosity_score INTEGER CHECK(curiosity_score >= 0 AND curiosity_score <= 100),
  metacognition_score INTEGER CHECK(metacognition_score >= 0 AND metacognition_score <= 100),
  growth_mindset_score INTEGER CHECK(growth_mindset_score >= 0 AND growth_mindset_score <= 100),
  
  -- 総合コメント
  overall_comment TEXT,
  strengths TEXT,
  areas_for_growth TEXT,
  recommendations TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cross_eval_student ON cross_subject_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_cross_eval_period ON cross_subject_evaluations(evaluation_period_start, evaluation_period_end);

-- 振り返りと観察の関連付け
CREATE TABLE IF NOT EXISTS reflection_observation_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reflection_id INTEGER NOT NULL,
  observation_id INTEGER NOT NULL,
  link_type TEXT DEFAULT 'supports',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reflection_id) REFERENCES student_reflections(id) ON DELETE CASCADE,
  FOREIGN KEY (observation_id) REFERENCES teacher_observations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_reflection ON reflection_observation_links(reflection_id);
CREATE INDEX IF NOT EXISTS idx_links_observation ON reflection_observation_links(observation_id);
