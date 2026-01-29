-- =====================================================
-- 検索練習システム（Retrieval Practice System）
-- =====================================================
-- 
-- 科学的根拠：
-- 1. Testing Effect（テスト効果）- Roediger & Karpicke (2006)
-- 2. Retrieval-induced Facilitation（検索誘発促進）
-- 3. Desirable Difficulties（望ましい困難）- Bjork (1994)
--
-- 目的：
-- - 能動的想起による記憶強化
-- - 再学習より検索練習の優先
-- - 困難度調整による最適学習
--
-- 作成日: 2026-01-29
-- =====================================================

-- =====================================================
-- 1. 検索練習セッションテーブル
-- =====================================================
-- 各検索練習セッションの記録
CREATE TABLE IF NOT EXISTS retrieval_practice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    curriculum_id INTEGER NOT NULL,
    
    -- セッション情報
    session_type TEXT NOT NULL CHECK(session_type IN (
        'flashcard',        -- フラッシュカード
        'quiz',             -- クイズ
        'recall',           -- 自由想起
        'cued_recall',      -- 手がかり想起
        'recognition'       -- 再認テスト
    )),
    
    -- セッション設定
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    correct_retrievals INTEGER NOT NULL DEFAULT 0,
    incorrect_retrievals INTEGER NOT NULL DEFAULT 0,
    
    -- 困難度設定
    difficulty_level INTEGER NOT NULL DEFAULT 2 CHECK(difficulty_level BETWEEN 1 AND 5),
    retrieval_delay_minutes INTEGER DEFAULT 0,  -- 学習からの経過時間
    
    -- タイミング
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    total_duration_seconds INTEGER,
    
    -- パフォーマンス指標
    success_rate REAL DEFAULT 0.0,
    average_response_time REAL DEFAULT 0.0,
    confidence_score REAL DEFAULT 0.0,  -- 平均自信度
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_retrieval_sessions_student 
    ON retrieval_practice_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_sessions_curriculum 
    ON retrieval_practice_sessions(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_sessions_date 
    ON retrieval_practice_sessions(started_at);

-- =====================================================
-- 2. 検索練習アイテムテーブル
-- =====================================================
-- 各検索練習の詳細記録
CREATE TABLE IF NOT EXISTS retrieval_practice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 検索情報
    retrieval_attempt_number INTEGER NOT NULL DEFAULT 1,
    was_successful INTEGER NOT NULL CHECK(was_successful IN (0, 1)),
    
    -- 想起プロセス
    retrieval_cue TEXT,              -- 手がかり情報
    student_response TEXT,           -- 学生の回答
    correct_answer TEXT,             -- 正解
    partial_credit REAL DEFAULT 0.0, -- 部分点（0.0-1.0）
    
    -- パフォーマンス
    response_time_seconds INTEGER,
    confidence_level INTEGER CHECK(confidence_level BETWEEN 1 AND 5),
    difficulty_rating INTEGER CHECK(difficulty_rating BETWEEN 1 AND 5),
    
    -- 想起の質
    recall_quality TEXT CHECK(recall_quality IN (
        'complete',         -- 完全想起
        'partial',          -- 部分想起
        'recognized',       -- 再認のみ
        'failed',           -- 失敗
        'guessed'           -- 推測
    )),
    
    -- 使用した方略
    retrieval_strategy TEXT CHECK(retrieval_strategy IN (
        'direct_recall',    -- 直接想起
        'elaboration',      -- 精緻化
        'association',      -- 連想
        'reconstruction',   -- 再構成
        'recognition'       -- 再認
    )),
    
    -- フィードバック
    feedback_viewed INTEGER DEFAULT 0,
    feedback_helpful INTEGER CHECK(feedback_helpful BETWEEN 1 AND 5),
    
    -- 自己調整学習統合
    srl_stage TEXT CHECK(srl_stage IN ('foresight', 'performance', 'reflection')),
    metacognitive_judgment TEXT,  -- メタ認知的判断
    
    -- タイミング
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (session_id) REFERENCES retrieval_practice_sessions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_retrieval_items_session 
    ON retrieval_practice_items(session_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_items_student_card 
    ON retrieval_practice_items(student_id, card_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_items_quality 
    ON retrieval_practice_items(recall_quality);

-- =====================================================
-- 3. 検索強度トラッキングテーブル
-- =====================================================
-- 各カードの検索強度（Retrieval Strength）を追跡
CREATE TABLE IF NOT EXISTS retrieval_strength_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 検索強度指標
    retrieval_strength REAL NOT NULL DEFAULT 0.0 CHECK(retrieval_strength BETWEEN 0.0 AND 1.0),
    storage_strength REAL NOT NULL DEFAULT 0.0 CHECK(storage_strength BETWEEN 0.0 AND 1.0),
    
    -- 検索履歴統計
    total_retrieval_attempts INTEGER NOT NULL DEFAULT 0,
    successful_retrievals INTEGER NOT NULL DEFAULT 0,
    failed_retrievals INTEGER NOT NULL DEFAULT 0,
    
    -- 最終検索情報
    last_retrieval_success INTEGER CHECK(last_retrieval_success IN (0, 1)),
    last_retrieval_quality TEXT,
    last_retrieval_at DATETIME,
    
    -- 困難度履歴
    consecutive_successes INTEGER NOT NULL DEFAULT 0,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    longest_success_streak INTEGER NOT NULL DEFAULT 0,
    
    -- 時間的要因
    days_since_last_study INTEGER,
    optimal_next_retrieval_date DATETIME,
    
    -- パフォーマンス指標
    average_retrieval_time REAL DEFAULT 0.0,
    average_confidence REAL DEFAULT 0.0,
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id),
    
    -- ユニーク制約
    UNIQUE(student_id, card_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_retrieval_strength_student 
    ON retrieval_strength_tracking(student_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_strength_card 
    ON retrieval_strength_tracking(card_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_strength_value 
    ON retrieval_strength_tracking(retrieval_strength);

-- =====================================================
-- 4. 検索練習推奨テーブル
-- =====================================================
-- AIによる検索練習推奨
CREATE TABLE IF NOT EXISTS retrieval_practice_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 推奨情報
    recommendation_type TEXT NOT NULL CHECK(recommendation_type IN (
        'immediate',        -- 即時検索
        'delayed',          -- 遅延検索
        'spaced',           -- 間隔検索
        'massed',           -- 集中検索
        'interleaved'       -- 交互配置
    )),
    
    -- 推奨理由
    reason TEXT NOT NULL CHECK(reason IN (
        'low_retrieval_strength',    -- 低検索強度
        'optimal_timing',             -- 最適タイミング
        'forgetting_risk',            -- 忘却リスク
        'consolidation',              -- 記憶固定
        'discrimination_practice'     -- 弁別練習
    )),
    
    -- 優先度
    priority_score REAL NOT NULL DEFAULT 0.0,
    urgency_level TEXT CHECK(urgency_level IN ('low', 'medium', 'high', 'critical')),
    
    -- 推奨困難度
    recommended_difficulty INTEGER CHECK(recommended_difficulty BETWEEN 1 AND 5),
    recommended_delay_minutes INTEGER,
    
    -- ステータス
    is_completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    actual_performance REAL,
    
    -- 推奨日時
    recommended_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_retrieval_recommendations_student 
    ON retrieval_practice_recommendations(student_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_recommendations_priority 
    ON retrieval_practice_recommendations(priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_retrieval_recommendations_status 
    ON retrieval_practice_recommendations(is_completed);

-- =====================================================
-- ビュー：学生別検索練習サマリー
-- =====================================================
CREATE VIEW IF NOT EXISTS v_student_retrieval_summary AS
SELECT 
    student_id,
    COUNT(DISTINCT session_id) as total_sessions,
    SUM(total_items) as total_items_practiced,
    SUM(correct_retrievals) as total_correct,
    SUM(incorrect_retrievals) as total_incorrect,
    AVG(success_rate) as avg_success_rate,
    AVG(average_response_time) as avg_response_time,
    AVG(confidence_score) as avg_confidence,
    MAX(started_at) as last_practice_date
FROM retrieval_practice_sessions
GROUP BY student_id;

-- =====================================================
-- ビュー：検索強度が低いカード
-- =====================================================
CREATE VIEW IF NOT EXISTS v_low_retrieval_strength_cards AS
SELECT 
    rst.student_id,
    rst.card_id,
    lc.card_title,
    rst.retrieval_strength,
    rst.storage_strength,
    rst.total_retrieval_attempts,
    rst.successful_retrievals,
    rst.last_retrieval_at,
    JULIANDAY('now') - JULIANDAY(rst.last_retrieval_at) as days_since_last_retrieval
FROM retrieval_strength_tracking rst
JOIN learning_cards lc ON rst.card_id = lc.id
WHERE rst.retrieval_strength < 0.5
    OR (rst.last_retrieval_at IS NOT NULL 
        AND JULIANDAY('now') - JULIANDAY(rst.last_retrieval_at) > 7)
ORDER BY rst.retrieval_strength ASC, days_since_last_retrieval DESC;

-- =====================================================
-- 完了メッセージ
-- =====================================================
-- 検索練習システムのデータベース設計完了
-- 
-- 実装済み機能：
-- 1. 検索練習セッション管理（5種類）
-- 2. 詳細な想起プロセス記録
-- 3. 検索強度・記憶強度トラッキング
-- 4. AI推奨システム基盤
-- 5. パフォーマンス分析ビュー
--
-- 科学的根拠：
-- - Testing Effect（Roediger & Karpicke, 2006）
-- - Desirable Difficulties（Bjork, 1994）
-- - New Theory of Disuse（Bjork & Bjork, 1992）
--
-- 次のステップ：
-- - 検索練習アルゴリズムの実装
-- - APIエンドポイントの作成
-- - フロントエンドUI実装
-- =====================================================
