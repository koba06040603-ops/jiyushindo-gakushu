-- =====================================================
-- 週次・月次レポートシステム（Weekly/Monthly Report System）
-- =====================================================
-- 
-- 目的：
-- - ScTNスコアの経年変化追跡
-- - 分散学習進捗の可視化
-- - 学習方略効果の分析
-- - 習熟度推移の記録
-- - PDF出力機能
--
-- 作成日: 2026-01-29
-- =====================================================

-- =====================================================
-- 1. 週次レポートテーブル
-- =====================================================
-- 毎週の学習状況を集計
CREATE TABLE IF NOT EXISTS weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    curriculum_id INTEGER,
    
    -- 期間
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    week_number INTEGER,  -- 年内の週番号
    year INTEGER NOT NULL,
    
    -- 学習時間
    total_study_time_minutes INTEGER DEFAULT 0,
    avg_daily_study_time_minutes REAL DEFAULT 0,
    study_days_count INTEGER DEFAULT 0,
    
    -- 学習カード進捗
    cards_completed INTEGER DEFAULT 0,
    cards_in_progress INTEGER DEFAULT 0,
    total_problems_attempted INTEGER DEFAULT 0,
    total_problems_correct INTEGER DEFAULT 0,
    overall_accuracy REAL DEFAULT 0,
    
    -- 分散学習統計
    spaced_reviews_completed INTEGER DEFAULT 0,
    spaced_reviews_on_time INTEGER DEFAULT 0,
    avg_mastery_level REAL DEFAULT 0,
    avg_leitner_box REAL DEFAULT 0,
    
    -- ScTNスコア（週末測定）
    sctn_learning_motivation REAL,
    sctn_self_regulation REAL,
    sctn_collaborative_learning REAL,
    sctn_self_efficacy REAL,
    sctn_overall_score REAL,
    
    -- 学習方略使用
    strategy_spaced_practice_count INTEGER DEFAULT 0,
    strategy_retrieval_practice_count INTEGER DEFAULT 0,
    strategy_interleaved_practice_count INTEGER DEFAULT 0,
    strategy_elaboration_count INTEGER DEFAULT 0,
    strategy_effectiveness_avg REAL,
    
    -- 協働学習
    peer_evaluations_given INTEGER DEFAULT 0,
    peer_evaluations_received INTEGER DEFAULT 0,
    feedback_exchanges INTEGER DEFAULT 0,
    collaboration_score REAL,
    
    -- AI先生利用
    ai_conversations_count INTEGER DEFAULT 0,
    ai_questions_count INTEGER DEFAULT 0,
    
    -- メタデータ
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_finalized INTEGER DEFAULT 0,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
    
    -- ユニーク制約
    UNIQUE(student_id, week_start_date, curriculum_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_weekly_student 
    ON weekly_reports(student_id);

CREATE INDEX IF NOT EXISTS idx_weekly_date 
    ON weekly_reports(week_start_date);

CREATE INDEX IF NOT EXISTS idx_weekly_year_week 
    ON weekly_reports(year, week_number);

-- =====================================================
-- 2. 月次レポートテーブル
-- =====================================================
-- 毎月の学習状況を集計
CREATE TABLE IF NOT EXISTS monthly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    curriculum_id INTEGER,
    
    -- 期間
    month INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    month_start_date DATE NOT NULL,
    month_end_date DATE NOT NULL,
    
    -- 学習時間
    total_study_time_minutes INTEGER DEFAULT 0,
    avg_daily_study_time_minutes REAL DEFAULT 0,
    study_days_count INTEGER DEFAULT 0,
    consistency_score REAL,  -- 学習継続性スコア
    
    -- 学習進捗
    cards_completed INTEGER DEFAULT 0,
    units_completed INTEGER DEFAULT 0,
    total_problems_attempted INTEGER DEFAULT 0,
    total_problems_correct INTEGER DEFAULT 0,
    overall_accuracy REAL DEFAULT 0,
    
    -- 分散学習統計
    spaced_reviews_total INTEGER DEFAULT 0,
    spaced_reviews_on_time_rate REAL DEFAULT 0,
    avg_mastery_level REAL DEFAULT 0,
    mastery_improvement REAL,  -- 前月比改善
    cards_mastered_count INTEGER DEFAULT 0,
    
    -- ScTNスコア（月末測定）
    sctn_learning_motivation REAL,
    sctn_self_regulation REAL,
    sctn_mutual_regulation REAL,
    sctn_collaborative_learning REAL,
    sctn_self_efficacy REAL,
    sctn_acceptance_of_others REAL,
    sctn_overall_score REAL,
    sctn_growth_rate REAL,  -- 前月比成長率
    
    -- 学習方略効果
    strategy_usage_distribution TEXT,  -- JSON: {"spaced": 40, "retrieval": 30, ...}
    most_effective_strategy TEXT,
    strategy_effectiveness_scores TEXT,  -- JSON: {"spaced": 0.85, ...}
    
    -- 協働学習統計
    peer_interactions_count INTEGER DEFAULT 0,
    avg_peer_evaluation_score REAL,
    collaboration_quality_score REAL,
    
    -- 非認知能力
    persistence_score REAL,
    self_control_score REAL,
    growth_mindset_score REAL,
    
    -- 全国学調対応項目
    national_survey_q20_self_regulation INTEGER,
    national_survey_q30_self_initiated_learning INTEGER,
    national_survey_q33_collaborative_thinking INTEGER,
    
    -- 達成と課題
    achievements TEXT,  -- JSON配列
    challenges TEXT,    -- JSON配列
    recommendations TEXT,  -- JSON配列
    
    -- メタデータ
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_finalized INTEGER DEFAULT 0,
    pdf_generated INTEGER DEFAULT 0,
    pdf_url TEXT,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
    
    -- ユニーク制約
    UNIQUE(student_id, year, month, curriculum_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_monthly_student 
    ON monthly_reports(student_id);

CREATE INDEX IF NOT EXISTS idx_monthly_year_month 
    ON monthly_reports(year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_pdf 
    ON monthly_reports(pdf_generated);

-- =====================================================
-- 3. レポートスナップショットテーブル
-- =====================================================
-- 特定時点のデータスナップショット
CREATE TABLE IF NOT EXISTS report_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    snapshot_type TEXT NOT NULL CHECK(snapshot_type IN (
        'weekly',
        'monthly',
        'semester',
        'annual'
    )),
    
    -- スナップショットデータ（JSON）
    snapshot_data TEXT NOT NULL,  -- 全データをJSON化
    
    -- メタデータ
    snapshot_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_snapshot_student 
    ON report_snapshots(student_id);

CREATE INDEX IF NOT EXISTS idx_snapshot_type_date 
    ON report_snapshots(snapshot_type, snapshot_date);

-- =====================================================
-- 4. 経年変化追跡テーブル
-- =====================================================
-- 長期的な変化を追跡
CREATE TABLE IF NOT EXISTS longitudinal_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    metric_name TEXT NOT NULL,
    
    -- 測定値
    measurement_value REAL NOT NULL,
    measurement_date DATE NOT NULL,
    
    -- 変化率
    change_from_previous REAL,
    change_from_baseline REAL,
    
    -- トレンド
    trend TEXT CHECK(trend IN ('improving', 'stable', 'declining', 'fluctuating')),
    
    -- メタデータ
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_longitudinal_student 
    ON longitudinal_tracking(student_id);

CREATE INDEX IF NOT EXISTS idx_longitudinal_metric 
    ON longitudinal_tracking(metric_name);

CREATE INDEX IF NOT EXISTS idx_longitudinal_date 
    ON longitudinal_tracking(measurement_date);

-- =====================================================
-- ビュー作成：学生の学習トレンド
-- =====================================================
CREATE VIEW IF NOT EXISTS v_student_learning_trends AS
SELECT 
    student_id,
    year,
    month,
    total_study_time_minutes,
    overall_accuracy,
    avg_mastery_level,
    sctn_overall_score,
    LAG(sctn_overall_score) OVER (PARTITION BY student_id ORDER BY year, month) as prev_sctn_score,
    sctn_overall_score - LAG(sctn_overall_score) OVER (PARTITION BY student_id ORDER BY year, month) as sctn_growth,
    collaboration_quality_score,
    consistency_score
FROM monthly_reports
WHERE is_finalized = 1
ORDER BY student_id, year, month;

-- =====================================================
-- ビュー作成：クラス平均推移
-- =====================================================
CREATE VIEW IF NOT EXISTS v_class_average_trends AS
SELECT 
    year,
    month,
    COUNT(DISTINCT student_id) as student_count,
    AVG(total_study_time_minutes) as avg_study_time,
    AVG(overall_accuracy) as avg_accuracy,
    AVG(avg_mastery_level) as avg_mastery,
    AVG(sctn_overall_score) as avg_sctn_score,
    AVG(collaboration_quality_score) as avg_collaboration
FROM monthly_reports
WHERE is_finalized = 1
GROUP BY year, month
ORDER BY year, month;

-- =====================================================
-- ビュー作成：ScTNスコア詳細推移
-- =====================================================
CREATE VIEW IF NOT EXISTS v_sctn_score_details AS
SELECT 
    student_id,
    year,
    month,
    sctn_learning_motivation,
    sctn_self_regulation,
    sctn_mutual_regulation,
    sctn_collaborative_learning,
    sctn_self_efficacy,
    sctn_acceptance_of_others,
    sctn_overall_score,
    sctn_growth_rate
FROM monthly_reports
WHERE is_finalized = 1
    AND sctn_overall_score IS NOT NULL
ORDER BY student_id, year, month;

-- =====================================================
-- 完了メッセージ
-- =====================================================
-- 週次・月次レポートシステムのデータベース設計完了
-- 
-- 実装済み機能：
-- 1. 週次レポート（学習時間・進捗・ScTNスコア）
-- 2. 月次レポート（経年変化・効果分析・PDF出力）
-- 3. スナップショット機能
-- 4. 経年変化追跡
-- 5. トレンド分析用ビュー（3種類）
--
-- 測定指標：
-- - 学習時間・進捗
-- - 分散学習効果
-- - ScTNスコア（7項目）
-- - 学習方略効果
-- - 協働学習状況
-- - 非認知能力
--
-- 次のステップ：
-- - データ集計ロジックの実装
-- - グラフ生成機能の実装
-- - PDF出力機能の実装
-- =====================================================
