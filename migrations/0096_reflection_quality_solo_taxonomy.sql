-- =============================================================================
-- 0096: 振り返り質的5段階レベル（SOLO Taxonomy × メタ認知 × 自己調整学習）
-- 
-- 前田康裕教授（熊本大学）の研究、EEF（英国教育基金）メタ認知ガイダンス、
-- SOLO Taxonomy、TOCO-TON「自ら学ぶ力の8つの力」を統合した
-- 振り返り記述の質的評価システム
--
-- 7つの観点スコア（各0-3）→ 合計0-21 → L1-L5変換
-- L1(0-3):感想 / L2(4-7):事実記述 / L3(8-11):関連づけ / L4(12-16):メタ認知 / L5(17-21):転移・価値化
-- =============================================================================

-- hourly_reflections テーブルに7観点スコアカラムを追加
ALTER TABLE hourly_reflections ADD COLUMN solo_level INTEGER DEFAULT NULL;
ALTER TABLE hourly_reflections ADD COLUMN solo_total_score INTEGER DEFAULT NULL;
ALTER TABLE hourly_reflections ADD COLUMN score_specificity INTEGER DEFAULT NULL;  -- 記述の具体性 0-3
ALTER TABLE hourly_reflections ADD COLUMN score_causality INTEGER DEFAULT NULL;    -- 因果関係・論理構造 0-3
ALTER TABLE hourly_reflections ADD COLUMN score_others INTEGER DEFAULT NULL;       -- 他者への言及 0-3
ALTER TABLE hourly_reflections ADD COLUMN score_metacognition INTEGER DEFAULT NULL; -- 自己の学び方への言及 0-3
ALTER TABLE hourly_reflections ADD COLUMN score_planning INTEGER DEFAULT NULL;      -- 次の行動への言及 0-3
ALTER TABLE hourly_reflections ADD COLUMN score_cross_subject INTEGER DEFAULT NULL; -- 教科横断・過去学習との接続 0-3
ALTER TABLE hourly_reflections ADD COLUMN score_transfer INTEGER DEFAULT NULL;      -- 社会・生活・自己成長への接続 0-3

-- 振り返りレベル成長履歴テーブル
CREATE TABLE IF NOT EXISTS reflection_level_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    plan_id INTEGER,
    hour_number INTEGER,
    reflection_id INTEGER,
    solo_level INTEGER NOT NULL DEFAULT 1,
    solo_total_score INTEGER NOT NULL DEFAULT 0,
    score_specificity INTEGER DEFAULT 0,
    score_causality INTEGER DEFAULT 0,
    score_others INTEGER DEFAULT 0,
    score_metacognition INTEGER DEFAULT 0,
    score_planning INTEGER DEFAULT 0,
    score_cross_subject INTEGER DEFAULT 0,
    score_transfer INTEGER DEFAULT 0,
    ai_level_feedback TEXT,
    ai_upgrade_suggestion TEXT,
    subject TEXT,
    unit_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reflection_level_history_student 
    ON reflection_level_history(student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reflection_level_history_plan 
    ON reflection_level_history(plan_id);
