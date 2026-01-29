-- ===================================================================
-- 自己調整学習の3段階サイクル（Zimmerman SRL理論）の実装
-- 作成日: 2026-01-29
-- 参照: COMPLETE_INTEGRATION_MODEL.md, SCTN_NATIONAL_SURVEY_INTEGRATION.md
-- ===================================================================

-- ===================================================================
-- 1. learning_cardsテーブルへの自己調整学習3段階の追加
-- ===================================================================

-- ---------------------------------------------------------------
-- 予見段階（Foresight Phase / 学習前）
-- ---------------------------------------------------------------

-- 今日の学習目標（目標設定支援）
ALTER TABLE learning_cards ADD COLUMN foresight_goal TEXT DEFAULT '';

-- 学習の見通し（計画立案支援）
ALTER TABLE learning_cards ADD COLUMN foresight_plan TEXT DEFAULT '';

-- 動機づけ（なぜこれを学ぶのか）
ALTER TABLE learning_cards ADD COLUMN foresight_motivation TEXT DEFAULT '';

-- 予想される難しさ（自己効力感の醸成）
ALTER TABLE learning_cards ADD COLUMN foresight_difficulty_prediction TEXT DEFAULT '';

-- ---------------------------------------------------------------
-- 遂行段階（Performance Phase / 学習中）
-- ---------------------------------------------------------------

-- 学習方略の提案（反復・精緻化・組織化）
ALTER TABLE learning_cards ADD COLUMN performance_strategies TEXT DEFAULT '';

-- 自己観察（メタ認知的モニタリング）
ALTER TABLE learning_cards ADD COLUMN performance_monitoring TEXT DEFAULT '';

-- 注意の焦点化（集中力維持）
ALTER TABLE learning_cards ADD COLUMN performance_attention TEXT DEFAULT '';

-- ---------------------------------------------------------------
-- 内省段階（Self-Reflection Phase / 学習後）
-- ---------------------------------------------------------------

-- 自己評価の質問（振り返りの構造化）
ALTER TABLE learning_cards ADD COLUMN reflection_questions TEXT DEFAULT '';

-- 原因帰属の指導（内的帰属への誘導）
ALTER TABLE learning_cards ADD COLUMN reflection_attribution TEXT DEFAULT '';

-- 次への改善計画（適応的反応の促進）
ALTER TABLE learning_cards ADD COLUMN reflection_improvement TEXT DEFAULT '';

-- ===================================================================
-- 2. 学習進捗テーブルへの自己調整学習データ追加
-- ===================================================================

-- ---------------------------------------------------------------
-- 予見段階の記録
-- ---------------------------------------------------------------

-- 学習前に立てた目標
ALTER TABLE student_progress ADD COLUMN srl_foresight_goal TEXT;

-- 学習前の計画
ALTER TABLE student_progress ADD COLUMN srl_foresight_plan TEXT;

-- 学習前の自己効力感（1-5）
ALTER TABLE student_progress ADD COLUMN srl_foresight_self_efficacy INTEGER CHECK(srl_foresight_self_efficacy BETWEEN 1 AND 5);

-- ---------------------------------------------------------------
-- 遂行段階の記録
-- ---------------------------------------------------------------

-- 使用した学習方略（JSON配列）
ALTER TABLE student_progress ADD COLUMN srl_performance_strategies TEXT;

-- 理解度モニタリング回数
ALTER TABLE student_progress ADD COLUMN srl_performance_monitoring_count INTEGER DEFAULT 0;

-- 集中力維持スコア（1-5）
ALTER TABLE student_progress ADD COLUMN srl_performance_attention_score INTEGER CHECK(srl_performance_attention_score BETWEEN 1 AND 5);

-- ---------------------------------------------------------------
-- 内省段階の記録
-- ---------------------------------------------------------------

-- 振り返りの深度（1-5）
ALTER TABLE student_progress ADD COLUMN srl_reflection_depth INTEGER CHECK(srl_reflection_depth BETWEEN 1 AND 5);

-- 原因帰属（internal/external/mixed）
ALTER TABLE student_progress ADD COLUMN srl_reflection_attribution TEXT CHECK(srl_reflection_attribution IN ('internal', 'external', 'mixed'));

-- 改善計画の具体性（1-5）
ALTER TABLE student_progress ADD COLUMN srl_reflection_improvement_specificity INTEGER CHECK(srl_reflection_improvement_specificity BETWEEN 1 AND 5);

-- 次への学習意欲（1-5）
ALTER TABLE student_progress ADD COLUMN srl_reflection_next_motivation INTEGER CHECK(srl_reflection_next_motivation BETWEEN 1 AND 5);

-- ===================================================================
-- 3. 自己調整学習プロファイルテーブル（統合診断用）
-- ===================================================================
CREATE TABLE IF NOT EXISTS srl_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  
  -- ---------------------------------------------------------------
  -- 予見段階（Foresight Phase）
  -- ---------------------------------------------------------------
  
  -- 目標設定能力（0-100）
  foresight_goal_setting_ability INTEGER DEFAULT 50 CHECK(foresight_goal_setting_ability BETWEEN 0 AND 100),
  
  -- 計画能力（0-100）
  foresight_planning_ability INTEGER DEFAULT 50 CHECK(foresight_planning_ability BETWEEN 0 AND 100),
  
  -- 自己効力感（0-100）
  foresight_self_efficacy INTEGER DEFAULT 50 CHECK(foresight_self_efficacy BETWEEN 0 AND 100),
  
  -- 課題価値認識（0-100）
  foresight_task_value_perception INTEGER DEFAULT 50 CHECK(foresight_task_value_perception BETWEEN 0 AND 100),
  
  -- ---------------------------------------------------------------
  -- 遂行段階（Performance Phase）
  -- ---------------------------------------------------------------
  
  -- 注意制御（0-100）
  performance_attention_control INTEGER DEFAULT 50 CHECK(performance_attention_control BETWEEN 0 AND 100),
  
  -- 学習方略使用（0-100）
  performance_learning_strategy_use INTEGER DEFAULT 50 CHECK(performance_learning_strategy_use BETWEEN 0 AND 100),
  
  -- メタ認知的モニタリング（0-100）
  performance_metacognitive_monitoring INTEGER DEFAULT 50 CHECK(performance_metacognitive_monitoring BETWEEN 0 AND 100),
  
  -- ---------------------------------------------------------------
  -- 内省段階（Self-Reflection Phase）
  -- ---------------------------------------------------------------
  
  -- 自己評価能力（0-100）
  reflection_self_evaluation_ability INTEGER DEFAULT 50 CHECK(reflection_self_evaluation_ability BETWEEN 0 AND 100),
  
  -- 原因帰属パターン（internal/external/mixed）
  reflection_attribution_pattern TEXT DEFAULT 'mixed' CHECK(reflection_attribution_pattern IN ('internal', 'external', 'mixed')),
  
  -- 適応的反応（0-100）
  reflection_adaptive_response INTEGER DEFAULT 50 CHECK(reflection_adaptive_response BETWEEN 0 AND 100),
  
  -- ---------------------------------------------------------------
  -- 総合判定
  -- ---------------------------------------------------------------
  
  -- 自己調整学習レベル（novice/developing/proficient）
  srl_level TEXT DEFAULT 'developing' CHECK(srl_level IN ('novice', 'developing', 'proficient')),
  
  -- 総合スコア（0-100）
  overall_score INTEGER DEFAULT 50 CHECK(overall_score BETWEEN 0 AND 100),
  
  -- ---------------------------------------------------------------
  -- メタデータ
  -- ---------------------------------------------------------------
  diagnosed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- 自己調整学習プロファイルのインデックス
CREATE INDEX IF NOT EXISTS idx_srl_profiles_student ON srl_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_srl_profiles_level ON srl_profiles(srl_level);
CREATE INDEX IF NOT EXISTS idx_srl_profiles_diagnosed ON srl_profiles(diagnosed_at);

-- ===================================================================
-- 4. 学習方略使用履歴テーブル
-- ===================================================================
CREATE TABLE IF NOT EXISTS learning_strategy_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  
  -- 学習方略の種類
  strategy_type TEXT NOT NULL CHECK(strategy_type IN (
    'repetition',       -- 反復方略
    'elaboration',      -- 精緻化方略
    'organization',     -- 組織化方略
    'metacognitive',    -- メタ認知的方略
    'motivation',       -- 動機づけ方略
    'environmental'     -- 環境調整方略
  )),
  
  -- 具体的な方略名
  strategy_name TEXT NOT NULL,
  
  -- 使用結果（効果的だったか）
  effectiveness_rating INTEGER CHECK(effectiveness_rating BETWEEN 1 AND 5),
  
  -- 備考
  notes TEXT,
  
  -- メタデータ
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- 学習方略使用履歴のインデックス
CREATE INDEX IF NOT EXISTS idx_strategy_history_student ON learning_strategy_history(student_id);
CREATE INDEX IF NOT EXISTS idx_strategy_history_card ON learning_strategy_history(card_id);
CREATE INDEX IF NOT EXISTS idx_strategy_history_type ON learning_strategy_history(strategy_type);
CREATE INDEX IF NOT EXISTS idx_strategy_history_used_at ON learning_strategy_history(used_at);

-- ===================================================================
-- 5. 初期データ挿入：デモ用の自己調整学習プロファイル
-- ===================================================================

-- 注意: ユーザーが存在する場合のみ挿入してください
-- デモデータは後でAPIから挿入することを推奨

