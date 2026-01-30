-- ========================================
-- 分散学習システム（Spaced Learning System）
-- ========================================
-- 作成日: 2026-01-29
-- 理論基盤: Ebbinghaus忘却曲線、Leitnerシステム、SuperMemo SM-2アルゴリズム
-- 統合: Zimmerman自己調整学習（予見・遂行・内省）
--
-- 科学的根拠:
-- 1. 忘却曲線: Hermann Ebbinghaus (1885)
--    - 学習直後から記憶は指数関数的に減衰
--    - 復習により記憶定着が強化される
--
-- 2. 間隔効果: Cepeda et al. (2006) メタ分析
--    - 適切な間隔を空けた復習が長期記憶に最も効果的
--    - 推奨間隔: 1日 → 3日 → 7日 → 14日 → 30日
--
-- 3. 困難度理論: Bjork (1994)
--    - 適度な困難さ（desirable difficulty）が学習を促進
--    - 忘れかけた頃に復習することで記憶が強化される
--
-- 4. 自己調整学習との統合:
--    - 予見段階: 復習計画の立案
--    - 遂行段階: 復習の実行と進捗モニタリング
--    - 内省段階: 復習効果の評価と計画修正
-- ========================================

-- ----------------------------------------
-- 1. 学習項目マスタリーテーブル
-- ----------------------------------------
-- 各学習カードの習熟度を管理
-- Leitnerシステムの「箱」の概念を採用
CREATE TABLE IF NOT EXISTS learning_item_mastery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 対象
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 習熟度レベル（Leitnerの箱）
    -- 1: 未学習 (Not Started)
    -- 2: 学習中 (Learning) - 短い間隔で復習
    -- 3: 定着中 (Reviewing) - 中程度の間隔
    -- 4: 習熟 (Proficient) - 長い間隔
    -- 5: 完全習得 (Mastered) - 復習不要
    mastery_level INTEGER NOT NULL DEFAULT 1 CHECK(mastery_level >= 1 AND mastery_level <= 5),
    
    -- SuperMemo SM-2 パラメータ
    -- 容易度係数 (Ease Factor): 2.5がデフォルト
    ease_factor REAL NOT NULL DEFAULT 2.5 CHECK(ease_factor >= 1.3),
    
    -- 連続正解回数
    consecutive_correct INTEGER NOT NULL DEFAULT 0,
    
    -- 間隔日数（次の復習までの日数）
    interval_days REAL NOT NULL DEFAULT 1.0,
    
    -- 復習予定日時
    next_review_date DATETIME NOT NULL,
    
    -- 最終学習日時
    last_studied_at DATETIME,
    
    -- 学習回数統計
    total_reviews INTEGER NOT NULL DEFAULT 0,
    correct_reviews INTEGER NOT NULL DEFAULT 0,
    
    -- 平均正答率 (0.0-1.0)
    avg_accuracy REAL DEFAULT 0.0 CHECK(avg_accuracy >= 0.0 AND avg_accuracy <= 1.0),
    
    -- 平均回答時間（秒）
    avg_response_time REAL DEFAULT 0.0,
    
    -- タイムスタンプ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES learning_cards(id) ON DELETE CASCADE,
    
    -- ユニーク制約
    UNIQUE(student_id, card_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_mastery_student_next_review 
    ON learning_item_mastery(student_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_mastery_student_level 
    ON learning_item_mastery(student_id, mastery_level);
CREATE INDEX IF NOT EXISTS idx_mastery_card 
    ON learning_item_mastery(card_id);

-- ----------------------------------------
-- 2. 復習履歴テーブル
-- ----------------------------------------
-- 各復習セッションの詳細記録
CREATE TABLE IF NOT EXISTS review_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 対象
    mastery_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 復習時の状態
    mastery_level_before INTEGER NOT NULL,
    mastery_level_after INTEGER NOT NULL,
    interval_days_before REAL NOT NULL,
    interval_days_after REAL NOT NULL,
    
    -- パフォーマンス
    -- 品質評価 (0-5): SuperMemo SM-2の品質指標
    -- 0: 完全に忘れた (Complete blackout)
    -- 1: 不正解だが少し思い出せた (Incorrect, but familiar)
    -- 2: 不正解、でも簡単に思い出せた (Incorrect, easy to recall)
    -- 3: 正解、でも困難 (Correct with difficulty)
    -- 4: 正解、少し迷った (Correct with hesitation)
    -- 5: 完璧 (Perfect response)
    quality_rating INTEGER NOT NULL CHECK(quality_rating >= 0 AND quality_rating <= 5),
    
    -- 正誤
    is_correct INTEGER NOT NULL CHECK(is_correct IN (0, 1)),
    
    -- 回答時間（秒）
    response_time REAL,
    
    -- 復習タイプ
    -- 'scheduled': 予定された復習
    -- 'manual': 手動復習（児童が自主的に選択）
    -- 'adaptive': 適応的復習（システムが推奨）
    review_type TEXT NOT NULL CHECK(review_type IN ('scheduled', 'manual', 'adaptive')),
    
    -- 復習日時
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 自己調整学習の段階
    -- 'foresight': 予見段階（復習計画）
    -- 'performance': 遂行段階（復習実行）
    -- 'reflection': 内省段階（復習後の振り返り）
    srl_stage TEXT CHECK(srl_stage IN ('foresight', 'performance', 'reflection')),
    
    -- 学習方略（使用した方略）
    learning_strategy TEXT,
    
    -- メモ・振り返り
    reflection_note TEXT,
    
    -- 外部キー制約
    FOREIGN KEY (mastery_id) REFERENCES learning_item_mastery(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES learning_cards(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_review_mastery 
    ON review_history(mastery_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_student_date 
    ON review_history(student_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_card 
    ON review_history(card_id);

-- ----------------------------------------
-- 3. 復習スケジュールテーブル
-- ----------------------------------------
-- 日次・週次の復習予定を管理
CREATE TABLE IF NOT EXISTS review_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 対象
    student_id INTEGER NOT NULL,
    
    -- スケジュール日付
    schedule_date DATE NOT NULL,
    
    -- 予定復習項目数
    scheduled_items_count INTEGER NOT NULL DEFAULT 0,
    
    -- 完了復習項目数
    completed_items_count INTEGER NOT NULL DEFAULT 0,
    
    -- 新規学習項目数
    new_items_count INTEGER NOT NULL DEFAULT 0,
    
    -- 推定所要時間（分）
    estimated_duration_minutes INTEGER,
    
    -- 実際の所要時間（分）
    actual_duration_minutes INTEGER,
    
    -- 完了フラグ
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
    
    -- 完了日時
    completed_at DATETIME,
    
    -- タイムスタンプ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- ユニーク制約
    UNIQUE(student_id, schedule_date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_schedule_student_date 
    ON review_schedule(student_id, schedule_date);

-- ----------------------------------------
-- 4. 分散学習設定テーブル
-- ----------------------------------------
-- 児童ごとの分散学習パラメータ
CREATE TABLE IF NOT EXISTS spaced_learning_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 対象
    student_id INTEGER NOT NULL,
    
    -- 1日あたりの新規学習項目数
    daily_new_items INTEGER NOT NULL DEFAULT 5 CHECK(daily_new_items >= 1 AND daily_new_items <= 20),
    
    -- 1日あたりの復習項目数上限
    daily_review_limit INTEGER NOT NULL DEFAULT 20 CHECK(daily_review_limit >= 5 AND daily_review_limit <= 100),
    
    -- 間隔設定（日数）
    -- Level 1→2: 学習直後
    interval_level_1_to_2 REAL NOT NULL DEFAULT 1.0,
    
    -- Level 2→3: 短期記憶の定着
    interval_level_2_to_3 REAL NOT NULL DEFAULT 3.0,
    
    -- Level 3→4: 中期記憶の定着
    interval_level_3_to_4 REAL NOT NULL DEFAULT 7.0,
    
    -- Level 4→5: 長期記憶の定着
    interval_level_4_to_5 REAL NOT NULL DEFAULT 14.0,
    
    -- Level 5の維持復習間隔
    interval_level_5_maintenance REAL NOT NULL DEFAULT 30.0,
    
    -- 自己調整学習レベルに応じた調整係数
    -- novice: より短い間隔、より多くの復習
    -- developing: 標準間隔
    -- proficient: より長い間隔、自律的な復習
    srl_adjustment_factor REAL NOT NULL DEFAULT 1.0 CHECK(srl_adjustment_factor >= 0.5 AND srl_adjustment_factor <= 2.0),
    
    -- 通知設定
    enable_daily_reminder INTEGER NOT NULL DEFAULT 1 CHECK(enable_daily_reminder IN (0, 1)),
    reminder_time TEXT DEFAULT '19:00', -- HH:MM形式
    
    -- 学習スタイル適応
    -- visual/auditory/kinestheticに応じた復習方法の調整
    learning_style_preference TEXT,
    
    -- タイムスタンプ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- ユニーク制約
    UNIQUE(student_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_spaced_settings_student 
    ON spaced_learning_settings(student_id);

-- ----------------------------------------
-- 5. 分散学習統計テーブル
-- ----------------------------------------
-- 週次・月次の統計データ
CREATE TABLE IF NOT EXISTS spaced_learning_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 対象
    student_id INTEGER NOT NULL,
    
    -- 期間
    period_type TEXT NOT NULL CHECK(period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- 学習統計
    total_reviews INTEGER NOT NULL DEFAULT 0,
    correct_reviews INTEGER NOT NULL DEFAULT 0,
    accuracy_rate REAL CHECK(accuracy_rate >= 0.0 AND accuracy_rate <= 1.0),
    
    -- 習熟度分布
    mastery_level_1_count INTEGER NOT NULL DEFAULT 0, -- 未学習
    mastery_level_2_count INTEGER NOT NULL DEFAULT 0, -- 学習中
    mastery_level_3_count INTEGER NOT NULL DEFAULT 0, -- 定着中
    mastery_level_4_count INTEGER NOT NULL DEFAULT 0, -- 習熟
    mastery_level_5_count INTEGER NOT NULL DEFAULT 0, -- 完全習得
    
    -- 新規学習項目数
    new_items_learned INTEGER NOT NULL DEFAULT 0,
    
    -- 完全習得に到達した項目数
    items_mastered INTEGER NOT NULL DEFAULT 0,
    
    -- 平均復習間隔（日）
    avg_review_interval REAL,
    
    -- 学習時間（分）
    total_study_time_minutes INTEGER NOT NULL DEFAULT 0,
    
    -- 自己調整学習スコアの変化
    srl_score_change REAL,
    
    -- タイムスタンプ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- ユニーク制約
    UNIQUE(student_id, period_type, period_start)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_spaced_stats_student_period 
    ON spaced_learning_stats(student_id, period_type, period_start);

-- ----------------------------------------
-- 6. 復習推奨テーブル
-- ----------------------------------------
-- AIによる復習推奨（適応的復習）
CREATE TABLE IF NOT EXISTS review_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 対象
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 推奨理由
    -- 'forgetting_risk': 忘却リスクが高い
    -- 'foundation_weak': 基礎が弱い
    -- 'prerequisite': 次の学習の前提知識
    -- 'error_pattern': エラーパターンの改善
    recommendation_reason TEXT NOT NULL,
    
    -- 優先度 (1-5, 5が最高)
    priority INTEGER NOT NULL CHECK(priority >= 1 AND priority <= 5),
    
    -- 推奨メッセージ
    message TEXT,
    
    -- 推奨日時
    recommended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 期限
    expires_at DATETIME,
    
    -- 実行状況
    is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
    completed_at DATETIME,
    
    -- 外部キー制約
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES learning_cards(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_recommendations_student 
    ON review_recommendations(student_id, is_completed, priority);

-- ----------------------------------------
-- デフォルトデータ挿入トリガー
-- ----------------------------------------
-- 新規児童登録時に自動的に分散学習設定を作成
CREATE TRIGGER IF NOT EXISTS create_default_spaced_settings
AFTER INSERT ON users
WHEN NEW.role = 'student'
BEGIN
    INSERT INTO spaced_learning_settings (student_id)
    VALUES (NEW.id);
END;

-- ----------------------------------------
-- 更新時刻自動更新トリガー
-- ----------------------------------------
CREATE TRIGGER IF NOT EXISTS update_mastery_timestamp
AFTER UPDATE ON learning_item_mastery
FOR EACH ROW
BEGIN
    UPDATE learning_item_mastery 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_schedule_timestamp
AFTER UPDATE ON review_schedule
FOR EACH ROW
BEGIN
    UPDATE review_schedule 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_spaced_settings_timestamp
AFTER UPDATE ON spaced_learning_settings
FOR EACH ROW
BEGIN
    UPDATE spaced_learning_settings 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
