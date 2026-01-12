-- Phase 5: 先生カスタマイズモード用テーブル

-- 3観点評価（ABC評価）
CREATE TABLE IF NOT EXISTS three_point_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  -- 知識・技能
  knowledge_skill TEXT CHECK(knowledge_skill IN ('A', 'B', 'C', '')),
  knowledge_skill_comment TEXT,
  -- 思考・判断・表現
  thinking_judgment TEXT CHECK(thinking_judgment IN ('A', 'B', 'C', '')),
  thinking_judgment_comment TEXT,
  -- 主体的に学習に取り組む態度
  attitude TEXT CHECK(attitude IN ('A', 'B', 'C', '')),
  attitude_comment TEXT,
  -- 総合所見
  overall_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- 非認知能力評価（7つの項目）
CREATE TABLE IF NOT EXISTS non_cognitive_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  -- 自己調整能力（1-5段階）
  self_regulation INTEGER CHECK(self_regulation BETWEEN 1 AND 5),
  self_regulation_comment TEXT,
  -- 意欲・粘り強さ
  motivation INTEGER CHECK(motivation BETWEEN 1 AND 5),
  motivation_comment TEXT,
  -- 協働性
  collaboration INTEGER CHECK(collaboration BETWEEN 1 AND 5),
  collaboration_comment TEXT,
  -- メタ認知
  metacognition INTEGER CHECK(metacognition BETWEEN 1 AND 5),
  metacognition_comment TEXT,
  -- 創造性
  creativity INTEGER CHECK(creativity BETWEEN 1 AND 5),
  creativity_comment TEXT,
  -- 好奇心
  curiosity INTEGER CHECK(curiosity BETWEEN 1 AND 5),
  curiosity_comment TEXT,
  -- 自己肯定感
  self_esteem INTEGER CHECK(self_esteem BETWEEN 1 AND 5),
  self_esteem_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- 学習環境デザイン（6観点）
CREATE TABLE IF NOT EXISTS learning_environment_designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  -- 表現・クリエイティブ活動
  expression_creative TEXT,
  expression_creative_enabled BOOLEAN DEFAULT 0,
  -- 調査・フィールドワーク
  research_fieldwork TEXT,
  research_fieldwork_enabled BOOLEAN DEFAULT 0,
  -- 多角的考察・クリティカルシンキング
  critical_thinking TEXT,
  critical_thinking_enabled BOOLEAN DEFAULT 0,
  -- 社会貢献・デザイン思考
  social_contribution TEXT,
  social_contribution_enabled BOOLEAN DEFAULT 0,
  -- メタ認知・振り返り
  metacognition_reflection TEXT,
  metacognition_reflection_enabled BOOLEAN DEFAULT 0,
  -- 問いの生成
  question_generation TEXT,
  question_generation_enabled BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- 先生の指導方針・カスタマイズ設定
CREATE TABLE IF NOT EXISTS teacher_customization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  -- 先生の願い・指導方針
  teaching_philosophy TEXT,
  -- カスタム単元目標
  custom_unit_goal TEXT,
  -- カスタム非認知目標
  custom_non_cognitive_goal TEXT,
  -- 指導上の留意点
  teaching_notes TEXT,
  -- ゲーミフィケーション設定
  gamification_enabled BOOLEAN DEFAULT 0,
  badge_system_enabled BOOLEAN DEFAULT 0,
  -- ナラティブ機能設定
  narrative_enabled BOOLEAN DEFAULT 0,
  story_theme TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- ゲーミフィケーション：バッジ・達成
CREATE TABLE IF NOT EXISTS student_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  badge_type TEXT NOT NULL, -- 'completion', 'help_giver', 'perseverance', 'creativity'
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- ナラティブ：学習ストーリー
CREATE TABLE IF NOT EXISTS learning_narratives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  story_content TEXT NOT NULL,
  milestone_reached BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_three_point_eval_student ON three_point_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_three_point_eval_curriculum ON three_point_evaluations(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_non_cognitive_student ON non_cognitive_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_non_cognitive_curriculum ON non_cognitive_evaluations(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_env_design_curriculum ON learning_environment_designs(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_teacher_custom_curriculum ON teacher_customization(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_narratives_student ON learning_narratives(student_id);
