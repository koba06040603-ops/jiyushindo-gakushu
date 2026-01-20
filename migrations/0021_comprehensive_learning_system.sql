-- ====================================
-- 総合学習評価システム用テーブル
-- ====================================

-- 1. 選択課題の成果物（画像・ファイル）
CREATE TABLE IF NOT EXISTS optional_problem_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  optional_problem_id INTEGER,
  artifact_type TEXT NOT NULL CHECK(artifact_type IN ('photo', 'video', 'document', 'drawing')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  description TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (optional_problem_id) REFERENCES optional_problems(id)
);

-- 2. 自由探究学習の記録
CREATE TABLE IF NOT EXISTS free_inquiry_learning (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  inquiry_title TEXT NOT NULL,
  inquiry_content TEXT,
  related_subjects TEXT,  -- カンマ区切りで教科名（例: '算数,理科,社会'）
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'paused')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 3. 探究学習の成果物
CREATE TABLE IF NOT EXISTS inquiry_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL,
  artifact_type TEXT NOT NULL CHECK(artifact_type IN ('photo', 'video', 'document', 'drawing', 'presentation')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  description TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inquiry_id) REFERENCES free_inquiry_learning(id)
);

-- 4. 教師の見取り（観察コメント）
CREATE TABLE IF NOT EXISTS teacher_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  observation_date DATE NOT NULL,
  observation_type TEXT CHECK(observation_type IN ('learning_attitude', 'collaboration', 'creativity', 'problem_solving', 'general')),
  related_curriculum_id INTEGER,
  related_inquiry_id INTEGER,
  observation_text TEXT NOT NULL,
  non_cognitive_tags TEXT,  -- JSON形式で非認知能力タグ（例: '["grit", "curiosity"]'）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (related_inquiry_id) REFERENCES free_inquiry_learning(id)
);

-- 5. 子どもの振り返り記録
CREATE TABLE IF NOT EXISTS student_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  reflection_date DATE NOT NULL,
  curriculum_id INTEGER,
  inquiry_id INTEGER,
  subject TEXT,  -- 教科名（例: '算数', '国語', '理科'）
  reflection_type TEXT CHECK(reflection_type IN ('daily', 'unit', 'project', 'free')),
  reflection_text TEXT NOT NULL,
  emotion TEXT,  -- 感情（例: 'happy', 'frustrated', 'confident', 'confused'）
  self_evaluation INTEGER CHECK(self_evaluation BETWEEN 1 AND 5),  -- 自己評価（1-5段階）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (inquiry_id) REFERENCES free_inquiry_learning(id)
);

-- 6. 振り返りの教科横断的分析タグ
CREATE TABLE IF NOT EXISTS reflection_analysis_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reflection_id INTEGER NOT NULL,
  tag_category TEXT NOT NULL CHECK(tag_category IN ('linguistic', 'non_cognitive', 'subject_specific', 'cross_curricular')),
  tag_name TEXT NOT NULL,
  tag_value TEXT,
  analyzed_by TEXT,  -- 'ai' or 'teacher'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reflection_id) REFERENCES student_reflections(id)
);

-- 7. 非認知能力の時系列データ
CREATE TABLE IF NOT EXISTS non_cognitive_scores_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  evaluation_date DATE NOT NULL,
  week_number INTEGER,  -- 週番号（例: 1週目、2週目）
  month_number INTEGER, -- 月番号（例: 1月、2月）
  grit_score INTEGER CHECK(grit_score BETWEEN 0 AND 100),
  self_regulation_score INTEGER CHECK(self_regulation_score BETWEEN 0 AND 100),
  collaboration_score INTEGER CHECK(collaboration_score BETWEEN 0 AND 100),
  curiosity_score INTEGER CHECK(curiosity_score BETWEEN 0 AND 100),
  metacognition_score INTEGER CHECK(metacognition_score BETWEEN 0 AND 100),
  calculation_basis TEXT,  -- 計算根拠（JSON形式）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 8. クラス統計データ（平均値の事前計算）
CREATE TABLE IF NOT EXISTS class_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_code TEXT NOT NULL,
  curriculum_id INTEGER NOT NULL,
  calculation_date DATE NOT NULL,
  avg_completion_rate REAL,
  avg_accuracy_rate REAL,
  avg_optional_attempts REAL,
  avg_grit_score REAL,
  avg_self_regulation_score REAL,
  avg_collaboration_score REAL,
  avg_curiosity_score REAL,
  avg_metacognition_score REAL,
  total_students INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_artifacts_student ON optional_problem_artifacts(student_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_student ON free_inquiry_learning(student_id);
CREATE INDEX IF NOT EXISTS idx_observations_student ON teacher_observations(student_id);
CREATE INDEX IF NOT EXISTS idx_observations_date ON teacher_observations(observation_date);
CREATE INDEX IF NOT EXISTS idx_reflections_student ON student_reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_reflections_date ON student_reflections(reflection_date);
CREATE INDEX IF NOT EXISTS idx_noncog_history_student ON non_cognitive_scores_history(student_id);
CREATE INDEX IF NOT EXISTS idx_noncog_history_date ON non_cognitive_scores_history(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_class_stats_class ON class_statistics(class_code);
