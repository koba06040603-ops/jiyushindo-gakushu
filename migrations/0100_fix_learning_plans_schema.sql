-- ============================================================
-- 学習計画表（学習のてびき）のスキーマ不整合を修正
-- ------------------------------------------------------------
-- 【障害】/landing で「データの読み込みに失敗しました」
--   GET /api/learning-plan/:studentId/:curriculumId が 500
--   → learning_plans に curriculum_id / planned_date が存在しない
--   → unit_reflections テーブル自体が本番に存在しない（migration 0088 未適用）
--
-- 本番・ローカルの learning_plans 実態（両方とも同じ）:
--   plan_id, student_id, plan_date, target_subject, target_unit,
--   target_cards_count, target_time_minutes, motivation_level,
--   strategy_choice, created_at
--
-- コードが要求するカラム:
--   curriculum_id, hour_number, subject, planned_date,
--   learning_content, reflection_good, reflection_bad,
--   reflection_learned, ai_feedback
--
-- 既存の「1日の学習計画」機能（plan_date / target_* 系）は残したまま、
-- 「単元の学習のてびき」用カラムを追加する方針とする（破壊的変更を避ける）。
-- ============================================================

-- 1. learning_plans に不足カラムを追加
-- 注: D1/SQLite は ALTER TABLE ADD COLUMN に IF NOT EXISTS が使えないため、
--     再適用時は「duplicate column name」エラーになるが無視してよい。
ALTER TABLE learning_plans ADD COLUMN curriculum_id INTEGER;
ALTER TABLE learning_plans ADD COLUMN hour_number INTEGER;
ALTER TABLE learning_plans ADD COLUMN subject TEXT;
ALTER TABLE learning_plans ADD COLUMN planned_date DATE;
ALTER TABLE learning_plans ADD COLUMN learning_content TEXT;
ALTER TABLE learning_plans ADD COLUMN reflection_good TEXT;
ALTER TABLE learning_plans ADD COLUMN reflection_bad TEXT;
ALTER TABLE learning_plans ADD COLUMN reflection_learned TEXT;
ALTER TABLE learning_plans ADD COLUMN ai_feedback TEXT;

CREATE INDEX IF NOT EXISTS idx_learning_plans_curriculum
  ON learning_plans(student_id, curriculum_id);

-- 2. unit_reflections（単元全体の振り返り）
--    migration 0088 の定義に、コードが使う curriculum_id / reflection_* を統合した形で作成。
--    plan_id は 0088 では NOT NULL だったが、単元単位の保存では未指定のため NULL 許容にする。
CREATE TABLE IF NOT EXISTS unit_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,

  -- 単元の学習のてびき（3観点の振り返り）
  reflection_good TEXT,              -- うまくいったこと
  reflection_bad TEXT,               -- むずかしかったこと
  reflection_learned TEXT,           -- わかったこと

  -- migration 0088 由来の詳細観点（AI評価フローで使用）
  goal_achievement TEXT,             -- 単元のめあてはどうだったか
  most_important_learning TEXT,      -- いちばん大事だと思ったこと
  effective_methods TEXT,            -- うまくいった学び方
  planning_reflection TEXT,          -- 計画のしかたについて
  friend_learning TEXT,              -- 友だちとの学びについて
  next_unit_application TEXT,        -- 次の単元にいかしたいこと

  -- AI評価結果
  ai_overall_evaluation TEXT,        -- AI総合評価（JSON）
  metacognition_score REAL,          -- メタ認知力 (0-100)
  planning_score REAL,               -- 計画力 (0-100)
  method_score REAL,                 -- 学び方の力 (0-100)
  collaboration_score REAL,          -- 協働の力 (0-100)
  persistence_score REAL,            -- 粘り強さ (0-100)
  autonomy_score REAL,               -- 自律性 (0-100)
  growth_data TEXT,                  -- JSON: 各スコアの成長データ

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 既に migration 0088 版の unit_reflections が存在する環境向けの追補
--    （CREATE TABLE IF NOT EXISTS は既存テーブルに列を足さないため個別に ALTER する）
--    未適用環境では上の CREATE TABLE で既に列があるため duplicate エラーになるが無視してよい。
ALTER TABLE unit_reflections ADD COLUMN curriculum_id INTEGER;
ALTER TABLE unit_reflections ADD COLUMN reflection_good TEXT;
ALTER TABLE unit_reflections ADD COLUMN reflection_bad TEXT;
ALTER TABLE unit_reflections ADD COLUMN reflection_learned TEXT;

-- 4. 0088 版は plan_id が NOT NULL だが、単元単位の振り返り保存では plan_id を持たない。
--    SQLite は列の NOT NULL 制約を後から外せないため、テーブルを作り直して移行する。
--    （既に NULL 許容で作られた環境では、この一連の処理は実質的に無害な再構築になる）
CREATE TABLE IF NOT EXISTS unit_reflections_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER,                   -- NULL 許容（単元単位の保存では未指定）
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  reflection_good TEXT,
  reflection_bad TEXT,
  reflection_learned TEXT,
  goal_achievement TEXT,
  most_important_learning TEXT,
  effective_methods TEXT,
  planning_reflection TEXT,
  friend_learning TEXT,
  next_unit_application TEXT,
  ai_overall_evaluation TEXT,
  metacognition_score REAL,
  planning_score REAL,
  method_score REAL,
  collaboration_score REAL,
  persistence_score REAL,
  autonomy_score REAL,
  growth_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO unit_reflections_new (
  id, plan_id, student_id, curriculum_id,
  reflection_good, reflection_bad, reflection_learned,
  goal_achievement, most_important_learning, effective_methods,
  planning_reflection, friend_learning, next_unit_application,
  ai_overall_evaluation, metacognition_score, planning_score, method_score,
  collaboration_score, persistence_score, autonomy_score, growth_data, created_at
)
SELECT
  id, plan_id, student_id, curriculum_id,
  reflection_good, reflection_bad, reflection_learned,
  goal_achievement, most_important_learning, effective_methods,
  planning_reflection, friend_learning, next_unit_application,
  ai_overall_evaluation, metacognition_score, planning_score, method_score,
  collaboration_score, persistence_score, autonomy_score, growth_data, created_at
FROM unit_reflections;

DROP TABLE unit_reflections;
ALTER TABLE unit_reflections_new RENAME TO unit_reflections;

CREATE INDEX IF NOT EXISTS idx_unit_reflections_student
  ON unit_reflections(student_id, curriculum_id);
CREATE INDEX IF NOT EXISTS idx_unit_reflections_plan
  ON unit_reflections(plan_id);
