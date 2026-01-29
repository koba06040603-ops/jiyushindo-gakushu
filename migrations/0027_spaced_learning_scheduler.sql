-- =====================================================
-- 分散学習スケジューラー（Spaced Practice Scheduler）
-- =====================================================
-- 
-- 科学的根拠：
-- 1. Ebbinghaus忘却曲線理論（1885）
-- 2. Leitnerシステム（1972）
-- 3. SuperMemo SM-2アルゴリズム（1988）
-- 4. 認知心理学研究に基づく最適間隔
--
-- 目的：
-- - 学習カードの最適な復習タイミングを管理
-- - 忘却曲線に基づく効果的な記憶定着
-- - 自己調整学習の「遂行」「内省」段階と連動
--
-- 作成日: 2026-01-29
-- =====================================================

-- =====================================================
-- 1. 分散学習スケジュールテーブル
-- =====================================================
-- 各学習カードの復習スケジュールを管理
CREATE TABLE IF NOT EXISTS spaced_learning_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 学習状態
    learning_stage TEXT NOT NULL DEFAULT 'new' CHECK(learning_stage IN (
        'new',          -- 未学習
        'learning',     -- 学習中
        'review',       -- 復習期
        'mastered'      -- 習得済み
    )),
    
    -- Leitnerボックスシステム（1-5段階）
    leitner_box INTEGER NOT NULL DEFAULT 1 CHECK(leitner_box BETWEEN 1 AND 5),
    
    -- 習熟度（0.0-1.0）
    mastery_level REAL NOT NULL DEFAULT 0.0 CHECK(mastery_level BETWEEN 0.0 AND 1.0),
    
    -- 学習回数
    study_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    
    -- 最新の学習結果
    last_result TEXT CHECK(last_result IN ('correct', 'incorrect', 'partial', NULL)),
    last_studied_at DATETIME,
    
    -- 復習スケジュール
    next_review_date DATETIME NOT NULL,
    review_interval_days REAL NOT NULL DEFAULT 1.0,  -- 次回復習までの日数
    
    -- SuperMemo SM-2パラメータ
    easiness_factor REAL NOT NULL DEFAULT 2.5 CHECK(easiness_factor BETWEEN 1.3 AND 3.0),
    repetition_number INTEGER NOT NULL DEFAULT 0,
    
    -- 自己調整学習との連動
    srl_foresight_score INTEGER DEFAULT 0 CHECK(srl_foresight_score BETWEEN 0 AND 100),
    srl_performance_score INTEGER DEFAULT 0 CHECK(srl_performance_score BETWEEN 0 AND 100),
    srl_reflection_score INTEGER DEFAULT 0 CHECK(srl_reflection_score BETWEEN 0 AND 100),
    
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
CREATE INDEX IF NOT EXISTS idx_spaced_student_next_review 
    ON spaced_learning_schedule(student_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_spaced_stage 
    ON spaced_learning_schedule(learning_stage);

CREATE INDEX IF NOT EXISTS idx_spaced_leitner 
    ON spaced_learning_schedule(leitner_box);

CREATE INDEX IF NOT EXISTS idx_spaced_mastery 
    ON spaced_learning_schedule(mastery_level);

-- =====================================================
-- 2. 分散学習履歴テーブル
-- =====================================================
-- 各復習セッションの詳細記録
CREATE TABLE IF NOT EXISTS spaced_learning_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 学習セッション情報
    session_type TEXT NOT NULL CHECK(session_type IN (
        'initial',      -- 初回学習
        'review',       -- 定期復習
        'intensive',    -- 集中復習
        'test'          -- テスト
    )),
    
    -- 学習結果
    result TEXT NOT NULL CHECK(result IN ('correct', 'incorrect', 'partial')),
    response_time_seconds INTEGER,
    difficulty_rating INTEGER CHECK(difficulty_rating BETWEEN 1 AND 5),
    confidence_level INTEGER CHECK(confidence_level BETWEEN 1 AND 5),
    
    -- 復習間隔情報
    days_since_last_review REAL,
    scheduled_date DATETIME,
    actual_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    was_on_time INTEGER DEFAULT 1,  -- 予定通りか？
    
    -- 変化した値（履歴追跡用）
    old_leitner_box INTEGER,
    new_leitner_box INTEGER,
    old_mastery_level REAL,
    new_mastery_level REAL,
    old_easiness_factor REAL,
    new_easiness_factor REAL,
    
    -- 自己調整学習の記録
    srl_stage TEXT CHECK(srl_stage IN ('foresight', 'performance', 'reflection', NULL)),
    srl_strategy_used TEXT,  -- 使用した学習方略
    srl_notes TEXT,          -- 自己評価メモ
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (schedule_id) REFERENCES spaced_learning_schedule(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_history_schedule 
    ON spaced_learning_history(schedule_id);

CREATE INDEX IF NOT EXISTS idx_history_student_date 
    ON spaced_learning_history(student_id, actual_date);

CREATE INDEX IF NOT EXISTS idx_history_result 
    ON spaced_learning_history(result);

-- =====================================================
-- 3. 復習推奨アルゴリズム設定テーブル
-- =====================================================
-- システム全体の分散学習パラメータ設定
CREATE TABLE IF NOT EXISTS spaced_learning_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_name TEXT NOT NULL UNIQUE,
    
    -- Leitnerボックス別の復習間隔（日数）
    box1_interval_days REAL NOT NULL DEFAULT 1.0,    -- 1日後
    box2_interval_days REAL NOT NULL DEFAULT 3.0,    -- 3日後
    box3_interval_days REAL NOT NULL DEFAULT 7.0,    -- 1週間後
    box4_interval_days REAL NOT NULL DEFAULT 14.0,   -- 2週間後
    box5_interval_days REAL NOT NULL DEFAULT 30.0,   -- 1ヶ月後
    
    -- 習熟度判定基準
    mastery_threshold REAL NOT NULL DEFAULT 0.8,     -- 習得と判定する閾値
    learning_threshold REAL NOT NULL DEFAULT 0.5,    -- 学習中と判定する閾値
    
    -- SuperMemo SM-2設定
    min_easiness_factor REAL NOT NULL DEFAULT 1.3,
    max_easiness_factor REAL NOT NULL DEFAULT 3.0,
    default_easiness_factor REAL NOT NULL DEFAULT 2.5,
    
    -- 連続正解で次のボックスへ移動する回数
    correct_streak_to_advance INTEGER NOT NULL DEFAULT 2,
    
    -- メタデータ
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- デフォルト設定を挿入
INSERT OR IGNORE INTO spaced_learning_config (
    config_name,
    box1_interval_days,
    box2_interval_days,
    box3_interval_days,
    box4_interval_days,
    box5_interval_days,
    mastery_threshold,
    learning_threshold,
    correct_streak_to_advance
) VALUES (
    'default',
    1.0,   -- Box 1: 1日後
    3.0,   -- Box 2: 3日後
    7.0,   -- Box 3: 1週間後
    14.0,  -- Box 4: 2週間後
    30.0,  -- Box 5: 1ヶ月後
    0.8,   -- 80%以上で習得
    0.5,   -- 50%以上で学習中
    2      -- 2回連続正解で昇格
);

-- =====================================================
-- 4. 日次復習推奨テーブル
-- =====================================================
-- 各学生の日次復習推奨カード一覧（キャッシュ用）
CREATE TABLE IF NOT EXISTS daily_review_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    recommendation_date DATE NOT NULL,
    
    -- 推奨カード情報
    card_id INTEGER NOT NULL,
    priority_score REAL NOT NULL DEFAULT 0.0,  -- 優先度スコア（高いほど重要）
    
    -- 推奨理由
    reason TEXT CHECK(reason IN (
        'scheduled',        -- スケジュール通り
        'overdue',          -- 期限超過
        'struggling',       -- 苦手
        'reinforcement',    -- 強化推奨
        'srl_performance'   -- SRL遂行段階支援
    )),
    
    -- 状態
    is_completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id),
    
    -- ユニーク制約
    UNIQUE(student_id, recommendation_date, card_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_daily_student_date 
    ON daily_review_recommendations(student_id, recommendation_date);

CREATE INDEX IF NOT EXISTS idx_daily_priority 
    ON daily_review_recommendations(priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_daily_completed 
    ON daily_review_recommendations(is_completed);

-- =====================================================
-- 5. 学習方略効果測定テーブル（拡張）
-- =====================================================
-- 既存の strategy_usage_history を分散学習と連携
-- 分散学習の効果を学習方略と組み合わせて測定

-- 既存テーブルにカラム追加（存在しない場合のみ）
-- ALTER TABLE strategy_usage_history ADD COLUMN spaced_review_type TEXT;
-- ALTER TABLE strategy_usage_history ADD COLUMN days_since_last_review REAL;

-- =====================================================
-- ビュー作成：学生ごとの分散学習サマリー
-- =====================================================
CREATE VIEW IF NOT EXISTS v_student_spaced_learning_summary AS
SELECT 
    student_id,
    COUNT(*) as total_cards,
    SUM(CASE WHEN learning_stage = 'new' THEN 1 ELSE 0 END) as new_cards,
    SUM(CASE WHEN learning_stage = 'learning' THEN 1 ELSE 0 END) as learning_cards,
    SUM(CASE WHEN learning_stage = 'review' THEN 1 ELSE 0 END) as review_cards,
    SUM(CASE WHEN learning_stage = 'mastered' THEN 1 ELSE 0 END) as mastered_cards,
    AVG(mastery_level) as avg_mastery_level,
    AVG(leitner_box) as avg_leitner_box,
    SUM(CASE WHEN next_review_date <= datetime('now') THEN 1 ELSE 0 END) as due_for_review,
    AVG(srl_foresight_score) as avg_srl_foresight,
    AVG(srl_performance_score) as avg_srl_performance,
    AVG(srl_reflection_score) as avg_srl_reflection
FROM spaced_learning_schedule
GROUP BY student_id;

-- =====================================================
-- ビュー作成：期限切れ復習カード一覧
-- =====================================================
CREATE VIEW IF NOT EXISTS v_overdue_reviews AS
SELECT 
    sls.student_id,
    sls.card_id,
    lc.card_title,
    lc.card_number,
    sls.learning_stage,
    sls.leitner_box,
    sls.mastery_level,
    sls.next_review_date,
    JULIANDAY('now') - JULIANDAY(sls.next_review_date) as days_overdue,
    sls.last_studied_at,
    sls.study_count
FROM spaced_learning_schedule sls
JOIN learning_cards lc ON sls.card_id = lc.id
WHERE sls.next_review_date <= datetime('now')
    AND sls.learning_stage != 'mastered'
ORDER BY days_overdue DESC;

-- =====================================================
-- 完了メッセージ
-- =====================================================
-- 分散学習スケジューラーのデータベース設計完了
-- 
-- 実装済み機能：
-- 1. Leitnerボックスシステム（5段階）
-- 2. SuperMemo SM-2アルゴリズムパラメータ
-- 3. 忘却曲線に基づく復習間隔管理
-- 4. 自己調整学習（SRL）スコアとの連動
-- 5. 日次復習推奨システム
-- 6. 学習履歴の詳細追跡
-- 7. 効果測定用ビュー
--
-- 次のステップ：
-- - 復習間隔計算アルゴリズムの実装
-- - APIエンドポイントの作成
-- - フロントエンド統合
-- =====================================================
