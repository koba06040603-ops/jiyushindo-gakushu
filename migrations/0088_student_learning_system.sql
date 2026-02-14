-- =====================================================
-- 児童生徒学習システム: 学習計画表・振り返り・粘り強さ・協働学習
-- Phase: 単元内自由進度学習 児童生徒ページ
-- =====================================================

-- =====================================================
-- 1. 単元学習計画（教師が作成した「てびき」に紐づく）
-- =====================================================
CREATE TABLE IF NOT EXISTS unit_study_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  unit_id INTEGER,              -- カリキュラムDB の単元ID
  unit_name TEXT NOT NULL,      -- 単元名
  grade TEXT,
  subject TEXT,
  course_type TEXT DEFAULT 'steady',  -- slow/steady/fast (じっくり/しっかり/ぐんぐん)
  total_hours INTEGER DEFAULT 8,      -- 単元の総時間数
  total_cards INTEGER DEFAULT 6,      -- 学習カード枚数
  total_check_tests INTEGER DEFAULT 1,-- チェックテスト数
  total_selection_tasks INTEGER DEFAULT 6, -- 選択課題数（先生が加除修正）
  selection_task_names TEXT,    -- JSON配列: 選択課題の名前リスト
  unit_goal TEXT,               -- 単元の目標（教師設定）
  personal_goal TEXT,           -- 自分のめあて
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active/completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. 学習計画表の各行（1行＝1時間分）
-- =====================================================
CREATE TABLE IF NOT EXISTS study_plan_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  hour_number INTEGER NOT NULL,      -- 第何時（1, 2, 3...）
  planned_date DATE,                 -- 予定日
  actual_date DATE,                  -- 実施日
  -- はじめの計画（第1時に立てる）
  initial_plan TEXT,                 -- はじめの計画の内容
  -- きょうの計画（毎時間の最初に書く）
  today_plan TEXT,                   -- きょうの計画
  today_goal TEXT,                   -- きょうのめあて
  -- やったこと（授業おわりに記入）
  actual_done TEXT,                  -- やったことのテキスト
  -- 学習進捗の詳細（自動記録＋手動）
  cards_done TEXT,                   -- JSON配列: 完了したカード番号 [1,2,3]
  check_test_done INTEGER DEFAULT 0, -- チェックテスト実施フラグ
  check_test_score REAL,             -- チェックテスト得点
  check_test_max REAL,               -- チェックテスト満点
  selection_tasks_done TEXT,         -- JSON配列: 完了した選択課題番号 [1,3,5]
  -- 時間
  study_minutes INTEGER,             -- 学習にかかった時間（分）
  -- ステータス
  status TEXT DEFAULT 'planned',     -- planned/in_progress/done
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES unit_study_plans(id)
);

-- =====================================================
-- 3. 毎時間の観点別振り返り
-- =====================================================
CREATE TABLE IF NOT EXISTS hourly_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  plan_row_id INTEGER NOT NULL,      -- study_plan_rows.id
  student_id INTEGER NOT NULL,
  hour_number INTEGER NOT NULL,
  -- 観点別振り返り
  content_learned TEXT,              -- ②わかったこと・わからなかったこと
  method_reflection TEXT,            -- ③どうやって学んだか（学び方のふりかえり）
  next_application TEXT,             -- ④つぎにいかすこと
  -- 友だちとの学び
  learned_with_friend INTEGER DEFAULT 0,  -- 友だちと学んだか (0=ひとり, 1=友だちと)
  friend_names TEXT,                 -- 友だちの名前（JSON配列）
  friend_interaction TEXT,           -- 友だちとどんなことをしたか
  friend_interaction_type TEXT,      -- JSON配列: ["taught_by","taught_to","discussed"]
  -- 手ごたえ
  confidence_rating INTEGER DEFAULT 3, -- 1-5 (😰-🤩)
  -- AI評価
  reflection_quality_level INTEGER,  -- AI判定の振り返り質レベル (1-5)
  ai_feedback TEXT,                  -- AIからのフィードバック（JSON）
  ai_theory_references TEXT,         -- AIが参照した理論（JSON配列）
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. 単元全体の振り返り（最終時に記入）
-- =====================================================
CREATE TABLE IF NOT EXISTS unit_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  -- 単元全体の振り返り観点
  goal_achievement TEXT,             -- 単元のめあてはどうだったか
  most_important_learning TEXT,      -- いちばん大事だと思ったこと
  effective_methods TEXT,            -- うまくいった学び方
  planning_reflection TEXT,          -- 計画のしかたについて
  friend_learning TEXT,              -- 友だちとの学びについて
  next_unit_application TEXT,        -- 次の単元にいかしたいこと
  -- AI評価結果
  ai_overall_evaluation TEXT,        -- AI総合評価（JSON）
  metacognition_score REAL,          -- メタ認知力スコア (0-100)
  planning_score REAL,               -- 計画力スコア (0-100)
  method_score REAL,                 -- 学び方の力スコア (0-100)
  collaboration_score REAL,          -- 協働の力スコア (0-100)
  persistence_score REAL,            -- 粘り強さスコア (0-100)
  autonomy_score REAL,               -- 自律性スコア (0-100)
  -- 成長比較（単元開始時との差分）
  growth_data TEXT,                  -- JSON: 各スコアの成長データ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. 粘り強さ測定データ（行動ログから自動計算）
-- =====================================================
CREATE TABLE IF NOT EXISTS persistence_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  hour_number INTEGER,
  -- 5次元の粘り強さ指標
  -- 次元1: 継続性（途中で投げ出さないか）
  task_completion_rate REAL,         -- 開始したカード/課題の完了率
  session_duration_minutes REAL,     -- 学習継続時間
  early_quit_count INTEGER DEFAULT 0,-- 途中離脱回数
  -- 次元2: 挑戦性（難しいものに挑むか）
  difficulty_faced_count INTEGER DEFAULT 0,  -- 難問に直面した回数
  retry_after_failure_count INTEGER DEFAULT 0, -- 不正解後の再挑戦回数
  gave_up_count INTEGER DEFAULT 0,   -- 諦めた回数
  -- 次元3: 回復力（失敗から立ち直れるか）
  error_to_retry_seconds REAL,       -- 間違いから再挑戦までの平均秒数
  performance_after_failure REAL,    -- 失敗後のパフォーマンス変化率
  help_seeking_after_failure INTEGER DEFAULT 0, -- 失敗後にヒント等を求めた回数
  -- 次元4: 自発的深化（求められた以上にやるか）
  extra_tasks_attempted INTEGER DEFAULT 0, -- 追加で取り組んだ課題数
  review_initiated_count INTEGER DEFAULT 0, -- 自発的復習回数
  hint_card_accessed_count INTEGER DEFAULT 0, -- ヒントカード閲覧回数
  -- 次元5: 感情的安定性（困難時の感情制御）
  confidence_during_difficulty INTEGER, -- 難問中の手ごたえ (1-5)
  emotional_recovery_pattern TEXT,   -- JSON: 感情推移パターン
  -- 総合スコア
  persistence_total_score REAL,      -- 粘り強さ総合スコア (0-100)
  -- タイムスタンプ
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. 協働学習記録
-- =====================================================
CREATE TABLE IF NOT EXISTS collaboration_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  hour_number INTEGER,
  partner_name TEXT,                  -- 相手の名前
  partner_student_id INTEGER,        -- 相手のID（わかれば）
  interaction_type TEXT NOT NULL,     -- taught_by/taught_to/discussed/worked_together
  topic TEXT,                         -- 何について
  description TEXT,                   -- 具体的な内容
  helpfulness_rating INTEGER,        -- 役に立ち度 (1-5)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. スキルポートフォリオ（単元ごとのスナップショット）
-- =====================================================
CREATE TABLE IF NOT EXISTS skill_portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  unit_name TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  -- 各スキルスコア (0-100)
  metacognition_score REAL,          -- メタ認知力
  planning_score REAL,               -- 計画力
  self_regulation_score REAL,        -- 自己調整力
  method_diversity_score REAL,       -- 学び方の多様性
  collaboration_score REAL,          -- 協働の力
  persistence_score REAL,            -- 粘り強さ
  autonomy_score REAL,               -- 自律性
  reflection_quality_avg REAL,       -- 振り返りの質（平均レベル）
  -- 成長データ
  previous_portfolio_id INTEGER,     -- 前回のポートフォリオID
  growth_summary TEXT,               -- JSON: 各スコアの前回比
  -- AI総合コメント
  ai_summary TEXT,
  -- 教師コメント
  teacher_comment TEXT,
  -- タイムスタンプ
  snapshot_date DATE DEFAULT (date('now')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- インデックス
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_unit_plans_student ON unit_study_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_unit_plans_status ON unit_study_plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_rows_plan ON study_plan_rows(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_rows_student ON study_plan_rows(student_id);
CREATE INDEX IF NOT EXISTS idx_hourly_ref_plan ON hourly_reflections(plan_id);
CREATE INDEX IF NOT EXISTS idx_hourly_ref_student ON hourly_reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_unit_ref_plan ON unit_reflections(plan_id);
CREATE INDEX IF NOT EXISTS idx_unit_ref_student ON unit_reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_persistence_student ON persistence_metrics(student_id);
CREATE INDEX IF NOT EXISTS idx_persistence_plan ON persistence_metrics(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_student ON collaboration_records(student_id);
CREATE INDEX IF NOT EXISTS idx_collab_plan ON collaboration_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_student ON skill_portfolio(student_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_plan ON skill_portfolio(plan_id);
