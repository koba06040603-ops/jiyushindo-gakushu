-- =====================================================
-- 交互配置練習システム（Interleaved Practice System）
-- =====================================================
-- 
-- 科学的根拠：
-- 1. 区別効果（Discrimination Effect） - Kornell & Bjork (2008)
-- 2. 転移促進効果 - Rohrer & Taylor (2007)
-- 3. 概念間の識別能力向上 - Birnbaum et al. (2013)
--
-- 目的：
-- - 異なる概念・問題タイプの混合学習
-- - 概念間の識別能力向上
-- - 転移学習の促進
-- - 長期保持の強化
--
-- 作成日: 2026-01-29
-- =====================================================

-- =====================================================
-- 1. 交互配置練習セッションテーブル
-- =====================================================
-- 各交互配置練習セッションを記録
CREATE TABLE IF NOT EXISTS interleaved_practice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    curriculum_id INTEGER NOT NULL,
    
    -- セッション情報
    session_name TEXT,
    session_type TEXT NOT NULL CHECK(session_type IN (
        'unit_review',        -- 単元復習
        'concept_mix',        -- 概念混合
        'problem_type_mix',   -- 問題タイプ混合
        'multi_unit'          -- 複数単元横断
    )),
    
    -- 混合設定
    interleaving_strategy TEXT NOT NULL CHECK(interleaving_strategy IN (
        'random',        -- ランダム混合
        'blocked_mixed', -- ブロック化混合
        'adaptive',      -- 適応的混合
        'systematic'     -- 系統的混合
    )),
    
    -- セッション統計
    total_problems INTEGER DEFAULT 0,
    completed_problems INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    
    -- パフォーマンス指標
    overall_accuracy REAL,
    discrimination_score REAL,  -- 概念識別スコア
    transfer_score REAL,        -- 転移スコア
    
    -- 時間統計
    total_time_seconds INTEGER,
    avg_problem_time_seconds REAL,
    
    -- メタデータ
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    is_completed INTEGER DEFAULT 0,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_interleaved_student 
    ON interleaved_practice_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_interleaved_curriculum 
    ON interleaved_practice_sessions(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_interleaved_completed 
    ON interleaved_practice_sessions(is_completed);

-- =====================================================
-- 2. 交互配置問題記録テーブル
-- =====================================================
-- セッション内の個別問題記録
CREATE TABLE IF NOT EXISTS interleaved_practice_problems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 問題情報
    problem_sequence INTEGER NOT NULL,  -- セッション内の順序
    concept_category TEXT NOT NULL,      -- 概念カテゴリ
    problem_type TEXT NOT NULL,          -- 問題タイプ
    difficulty_level INTEGER CHECK(difficulty_level BETWEEN 1 AND 5),
    
    -- 前後の問題（文脈）
    previous_concept_category TEXT,
    next_concept_category TEXT,
    
    -- 学生の回答
    student_answer TEXT,
    is_correct INTEGER,
    response_time_seconds INTEGER,
    
    -- 識別判断
    concept_identified_correctly INTEGER,  -- 概念を正しく識別したか
    strategy_applied_correctly INTEGER,    -- 正しい方略を使ったか
    
    -- 困難度
    perceived_difficulty INTEGER CHECK(perceived_difficulty BETWEEN 1 AND 5),
    actual_difficulty_rating REAL,
    
    -- フィードバック
    feedback_provided TEXT,
    misconception_identified TEXT,  -- 誤概念の特定
    
    -- メタデータ
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    
    -- 外部キー
    FOREIGN KEY (session_id) REFERENCES interleaved_practice_sessions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_interleaved_problems_session 
    ON interleaved_practice_problems(session_id);

CREATE INDEX IF NOT EXISTS idx_interleaved_problems_student 
    ON interleaved_practice_problems(student_id);

CREATE INDEX IF NOT EXISTS idx_interleaved_problems_sequence 
    ON interleaved_practice_problems(session_id, problem_sequence);

-- =====================================================
-- 3. 概念混合設定テーブル
-- =====================================================
-- カリキュラムごとの概念混合設定
CREATE TABLE IF NOT EXISTS concept_interleaving_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curriculum_id INTEGER NOT NULL,
    
    -- 混合対象概念
    concept_groups TEXT NOT NULL,  -- JSON配列: [["概念A", "概念B"], ["概念C", "概念D"]]
    
    -- 混合比率
    mixing_ratios TEXT,  -- JSON: {"概念A": 0.3, "概念B": 0.3, ...}
    
    -- 最小間隔設定
    min_spacing_problems INTEGER DEFAULT 1,  -- 同じ概念間の最小問題数
    max_consecutive_same INTEGER DEFAULT 2,  -- 同じ概念の最大連続数
    
    -- 適応的調整
    adaptive_adjustment INTEGER DEFAULT 1,
    difficulty_adaptation INTEGER DEFAULT 1,
    
    -- 推奨設定
    recommended_session_length INTEGER DEFAULT 20,  -- 推奨問題数
    recommended_time_minutes INTEGER DEFAULT 30,    -- 推奨時間
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    
    -- 外部キー
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
    
    -- ユニーク制約
    UNIQUE(curriculum_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_concept_config_curriculum 
    ON concept_interleaving_config(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_concept_config_active 
    ON concept_interleaving_config(is_active);

-- =====================================================
-- 4. 識別能力追跡テーブル
-- =====================================================
-- 学生の概念識別能力を追跡
CREATE TABLE IF NOT EXISTS discrimination_ability_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    curriculum_id INTEGER NOT NULL,
    
    -- 概念ペア
    concept_a TEXT NOT NULL,
    concept_b TEXT NOT NULL,
    
    -- 識別能力指標
    discrimination_accuracy REAL DEFAULT 0.0,  -- 識別正答率
    confusion_rate REAL DEFAULT 0.0,           -- 混同率
    
    -- 学習進捗
    practice_count INTEGER DEFAULT 0,
    correct_discrimination_count INTEGER DEFAULT 0,
    incorrect_discrimination_count INTEGER DEFAULT 0,
    
    -- 最近のパフォーマンス
    recent_accuracy REAL,  -- 最近5回の正答率
    improvement_trend REAL, -- 改善傾向
    
    -- メタデータ
    first_practiced_at DATETIME,
    last_practiced_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
    
    -- ユニーク制約
    UNIQUE(student_id, curriculum_id, concept_a, concept_b)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_discrimination_student 
    ON discrimination_ability_tracking(student_id);

CREATE INDEX IF NOT EXISTS idx_discrimination_curriculum 
    ON discrimination_ability_tracking(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_discrimination_concepts 
    ON discrimination_ability_tracking(concept_a, concept_b);

-- =====================================================
-- 5. 転移学習効果測定テーブル
-- =====================================================
-- 交互配置練習による転移効果を測定
CREATE TABLE IF NOT EXISTS transfer_learning_effects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    curriculum_id INTEGER NOT NULL,
    
    -- ソース概念（学習した概念）
    source_concepts TEXT NOT NULL,  -- JSON配列
    
    -- ターゲット概念（転移先の概念）
    target_concept TEXT NOT NULL,
    
    -- ベースライン測定
    baseline_score REAL,
    baseline_measured_at DATETIME,
    
    -- 交互配置練習後の測定
    post_interleaving_score REAL,
    post_interleaving_measured_at DATETIME,
    
    -- 転移効果
    transfer_gain REAL,
    transfer_efficiency REAL,  -- 転移効率
    
    -- 保持測定（1週間後）
    retention_score REAL,
    retention_measured_at DATETIME,
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_transfer_student 
    ON transfer_learning_effects(student_id);

CREATE INDEX IF NOT EXISTS idx_transfer_curriculum 
    ON transfer_learning_effects(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_transfer_target 
    ON transfer_learning_effects(target_concept);

-- =====================================================
-- ビュー作成：学生ごとの交互配置練習サマリー
-- =====================================================
CREATE VIEW IF NOT EXISTS v_student_interleaved_summary AS
SELECT 
    s.student_id,
    COUNT(DISTINCT s.id) as total_sessions,
    SUM(s.completed_problems) as total_problems_completed,
    AVG(s.overall_accuracy) as avg_accuracy,
    AVG(s.discrimination_score) as avg_discrimination,
    AVG(s.transfer_score) as avg_transfer,
    COUNT(DISTINCT p.concept_category) as concepts_practiced,
    AVG(p.response_time_seconds) as avg_response_time
FROM interleaved_practice_sessions s
LEFT JOIN interleaved_practice_problems p ON s.id = p.session_id
WHERE s.is_completed = 1
    AND s.started_at >= DATE('now', '-30 days')
GROUP BY s.student_id;

-- =====================================================
-- ビュー作成：概念混同マトリックス
-- =====================================================
CREATE VIEW IF NOT EXISTS v_concept_confusion_matrix AS
SELECT 
    student_id,
    curriculum_id,
    concept_category as actual_concept,
    previous_concept_category as confused_with,
    COUNT(*) as confusion_count,
    AVG(CASE WHEN is_correct = 0 THEN 1.0 ELSE 0.0 END) as error_rate
FROM interleaved_practice_problems
WHERE previous_concept_category IS NOT NULL
    AND previous_concept_category != concept_category
GROUP BY student_id, curriculum_id, concept_category, previous_concept_category
HAVING COUNT(*) >= 3;

-- =====================================================
-- ビュー作成：交互配置練習の効果分析
-- =====================================================
CREATE VIEW IF NOT EXISTS v_interleaved_effectiveness AS
SELECT 
    curriculum_id,
    interleaving_strategy,
    COUNT(DISTINCT student_id) as student_count,
    COUNT(*) as session_count,
    AVG(overall_accuracy) as avg_accuracy,
    AVG(discrimination_score) as avg_discrimination,
    AVG(transfer_score) as avg_transfer,
    AVG(total_time_seconds / 60.0) as avg_duration_minutes,
    SUM(CASE WHEN discrimination_score >= 0.8 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as high_discrimination_rate
FROM interleaved_practice_sessions
WHERE is_completed = 1
GROUP BY curriculum_id, interleaving_strategy;

-- =====================================================
-- 完了メッセージ
-- =====================================================
-- 交互配置練習システムのデータベース設計完了
-- 
-- 実装済み機能：
-- 1. 4種類の交互配置戦略（ランダム・ブロック化・適応的・系統的）
-- 2. 概念識別能力の追跡
-- 3. 転移学習効果の測定
-- 4. 混同マトリックスの生成
-- 5. カリキュラム別設定管理
-- 6. 効果分析用ビュー（3種類）
--
-- 次のステップ：
-- - スケジューリングアルゴリズムの実装
-- - APIエンドポイントの実装
-- - フロントエンドUIの作成
-- =====================================================
