-- =====================================================
-- 協働学習システム（Collaborative Learning System）
-- =====================================================
-- 
-- 科学的根拠：
-- 1. 社会的構成主義（Vygotsky 1978）
-- 2. 協働学習理論（Johnson & Johnson 1989）
-- 3. ピア評価効果（Topping 1998）
-- 4. 多様な視点の重要性（Slavin 1996）
--
-- 目的：
-- - 友達の回答比較による多様な解法理解
-- - ピア評価による批判的思考力育成
-- - 相互フィードバックによる学習深化
-- - 協働的な学びの促進
--
-- 作成日: 2026-01-29
-- =====================================================

-- =====================================================
-- 1. 学生回答共有テーブル
-- =====================================================
-- 学生が自分の回答を共有するためのテーブル
CREATE TABLE IF NOT EXISTS student_answer_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    curriculum_id INTEGER NOT NULL,
    
    -- 回答情報
    answer_text TEXT NOT NULL,
    answer_image_url TEXT,
    solution_approach TEXT,  -- 解法アプローチの説明
    
    -- 共有設定
    share_scope TEXT NOT NULL DEFAULT 'class' CHECK(share_scope IN (
        'class',      -- クラス内共有
        'group',      -- グループ内共有
        'public',     -- 全体公開
        'private'     -- 非公開
    )),
    
    -- メタデータ
    is_correct INTEGER,
    difficulty_rating INTEGER CHECK(difficulty_rating BETWEEN 1 AND 5),
    confidence_level INTEGER CHECK(confidence_level BETWEEN 1 AND 5),
    time_spent_seconds INTEGER,
    
    -- 統計
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- 状態
    is_approved INTEGER DEFAULT 0,  -- 教師承認
    is_featured INTEGER DEFAULT 0,  -- 優秀回答
    
    -- メタデータ
    shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id),
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_answer_shares_card 
    ON student_answer_shares(card_id);

CREATE INDEX IF NOT EXISTS idx_answer_shares_student 
    ON student_answer_shares(student_id);

CREATE INDEX IF NOT EXISTS idx_answer_shares_scope 
    ON student_answer_shares(share_scope);

CREATE INDEX IF NOT EXISTS idx_answer_shares_featured 
    ON student_answer_shares(is_featured);

-- =====================================================
-- 2. 回答比較セッションテーブル
-- =====================================================
-- 学生が複数の回答を比較するセッション
CREATE TABLE IF NOT EXISTS answer_comparison_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    
    -- 比較対象の回答
    compared_answer_ids TEXT NOT NULL,  -- JSON配列: [1, 2, 3]
    
    -- 学生の分析
    identified_differences TEXT,  -- 違いの認識
    identified_similarities TEXT, -- 共通点の認識
    preferred_approach TEXT,      -- 好む解法
    learned_insights TEXT,        -- 学んだこと
    
    -- 評価
    comparison_quality_score REAL,  -- 比較の質（AI評価）
    
    -- メタデータ
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_seconds INTEGER,
    
    -- 外部キー
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_comparison_student 
    ON answer_comparison_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_comparison_card 
    ON answer_comparison_sessions(card_id);

-- =====================================================
-- 3. ピア評価テーブル
-- =====================================================
-- 学生同士の相互評価
CREATE TABLE IF NOT EXISTS peer_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evaluator_id INTEGER NOT NULL,      -- 評価する学生
    answer_share_id INTEGER NOT NULL,   -- 評価対象の回答
    evaluated_student_id INTEGER NOT NULL,  -- 評価される学生
    
    -- 評価項目
    clarity_score INTEGER CHECK(clarity_score BETWEEN 1 AND 5),      -- 明確さ
    correctness_score INTEGER CHECK(correctness_score BETWEEN 1 AND 5), -- 正確さ
    creativity_score INTEGER CHECK(creativity_score BETWEEN 1 AND 5), -- 創造性
    completeness_score INTEGER CHECK(completeness_score BETWEEN 1 AND 5), -- 完全性
    
    -- 総合評価
    overall_rating INTEGER CHECK(overall_rating BETWEEN 1 AND 5),
    is_helpful INTEGER DEFAULT 0,  -- 役に立ったか
    
    -- フィードバック
    positive_feedback TEXT,  -- 良い点
    improvement_feedback TEXT,  -- 改善点
    questions TEXT,  -- 質問
    
    -- メタデータ
    evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    FOREIGN KEY (answer_share_id) REFERENCES student_answer_shares(id),
    FOREIGN KEY (evaluated_student_id) REFERENCES users(id),
    
    -- ユニーク制約（1人1回のみ評価）
    UNIQUE(evaluator_id, answer_share_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_peer_eval_evaluator 
    ON peer_evaluations(evaluator_id);

CREATE INDEX IF NOT EXISTS idx_peer_eval_answer 
    ON peer_evaluations(answer_share_id);

CREATE INDEX IF NOT EXISTS idx_peer_eval_evaluated 
    ON peer_evaluations(evaluated_student_id);

-- =====================================================
-- 4. 相互フィードバックテーブル
-- =====================================================
-- 学生間のフィードバック交換
CREATE TABLE IF NOT EXISTS peer_feedback_exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    answer_share_id INTEGER,
    
    -- フィードバック内容
    feedback_type TEXT NOT NULL CHECK(feedback_type IN (
        'praise',         -- 称賛
        'suggestion',     -- 提案
        'question',       -- 質問
        'clarification',  -- 明確化要求
        'alternative'     -- 別解提示
    )),
    
    feedback_text TEXT NOT NULL,
    
    -- 返信
    reply_text TEXT,
    reply_at DATETIME,
    
    -- 評価
    is_helpful INTEGER DEFAULT 0,
    helpfulness_rating INTEGER CHECK(helpfulness_rating BETWEEN 1 AND 5),
    
    -- 状態
    is_read INTEGER DEFAULT 0,
    is_resolved INTEGER DEFAULT 0,
    
    -- メタデータ
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外部キー
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (answer_share_id) REFERENCES student_answer_shares(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_feedback_sender 
    ON peer_feedback_exchanges(sender_id);

CREATE INDEX IF NOT EXISTS idx_feedback_receiver 
    ON peer_feedback_exchanges(receiver_id);

CREATE INDEX IF NOT EXISTS idx_feedback_read 
    ON peer_feedback_exchanges(is_read);

-- =====================================================
-- 5. 協働学習グループテーブル
-- =====================================================
-- 学習グループの管理
CREATE TABLE IF NOT EXISTS collaborative_learning_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curriculum_id INTEGER NOT NULL,
    group_name TEXT NOT NULL,
    
    -- グループ設定
    group_type TEXT NOT NULL CHECK(group_type IN (
        'ability_mixed',   -- 習熟度混合
        'ability_similar', -- 習熟度類似
        'interest_based',  -- 興味関心別
        'random'           -- ランダム
    )),
    
    max_members INTEGER DEFAULT 4,
    
    -- メタデータ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    
    -- 外部キー
    FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

CREATE TABLE IF NOT EXISTS collaborative_group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    role TEXT CHECK(role IN ('leader', 'member', 'facilitator')),
    
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (group_id) REFERENCES collaborative_learning_groups(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE(group_id, student_id)
);

-- =====================================================
-- 6. 協働学習活動記録テーブル
-- =====================================================
-- グループ活動の記録
CREATE TABLE IF NOT EXISTS collaborative_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    card_id INTEGER NOT NULL,
    
    -- 活動情報
    activity_type TEXT NOT NULL CHECK(activity_type IN (
        'group_discussion',  -- グループ討議
        'peer_teaching',     -- ピアティーチング
        'joint_problem_solving',  -- 共同問題解決
        'peer_review'        -- 相互レビュー
    )),
    
    -- 参加者
    participant_ids TEXT NOT NULL,  -- JSON配列
    
    -- 成果
    group_solution TEXT,
    consensus_reached INTEGER DEFAULT 0,
    
    -- 評価
    collaboration_quality_score REAL,
    individual_contribution_scores TEXT,  -- JSON: {"user_id": score}
    
    -- メタデータ
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_seconds INTEGER,
    
    -- 外部キー
    FOREIGN KEY (group_id) REFERENCES collaborative_learning_groups(id),
    FOREIGN KEY (card_id) REFERENCES learning_cards(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_collab_activities_group 
    ON collaborative_activities(group_id);

CREATE INDEX IF NOT EXISTS idx_collab_activities_card 
    ON collaborative_activities(card_id);

-- =====================================================
-- ビュー作成：学生ごとの協働学習サマリー
-- =====================================================
CREATE VIEW IF NOT EXISTS v_student_collaborative_summary AS
SELECT 
    s.id as student_id,
    COUNT(DISTINCT as2.id) as answers_shared,
    SUM(as2.helpful_count) as total_helpful_received,
    COUNT(DISTINCT pe.id) as evaluations_given,
    AVG(pe.overall_rating) as avg_rating_given,
    COUNT(DISTINCT pe2.id) as evaluations_received,
    AVG(pe2.overall_rating) as avg_rating_received,
    COUNT(DISTINCT pf.id) as feedback_sent,
    COUNT(DISTINCT pf2.id) as feedback_received
FROM users s
LEFT JOIN student_answer_shares as2 ON s.id = as2.student_id
LEFT JOIN peer_evaluations pe ON s.id = pe.evaluator_id
LEFT JOIN peer_evaluations pe2 ON s.id = pe2.evaluated_student_id
LEFT JOIN peer_feedback_exchanges pf ON s.id = pf.sender_id
LEFT JOIN peer_feedback_exchanges pf2 ON s.id = pf2.receiver_id
WHERE s.role = 'student'
GROUP BY s.id;

-- =====================================================
-- ビュー作成：優秀回答一覧
-- =====================================================
CREATE VIEW IF NOT EXISTS v_featured_answers AS
SELECT 
    as2.id,
    as2.card_id,
    as2.student_id,
    u.name as student_name,
    as2.answer_text,
    as2.solution_approach,
    as2.helpful_count,
    as2.view_count,
    AVG(pe.overall_rating) as avg_rating,
    COUNT(DISTINCT pe.id) as rating_count
FROM student_answer_shares as2
JOIN users u ON as2.student_id = u.id
LEFT JOIN peer_evaluations pe ON as2.id = pe.answer_share_id
WHERE as2.is_featured = 1
    OR as2.is_approved = 1
GROUP BY as2.id
ORDER BY avg_rating DESC, as2.helpful_count DESC;

-- =====================================================
-- ビュー作成：カードごとの協働学習状況
-- =====================================================
CREATE VIEW IF NOT EXISTS v_card_collaborative_stats AS
SELECT 
    card_id,
    COUNT(DISTINCT student_id) as students_shared,
    COUNT(*) as total_answers,
    AVG(helpful_count) as avg_helpfulness,
    SUM(view_count) as total_views,
    COUNT(DISTINCT CASE WHEN is_featured = 1 THEN id END) as featured_count
FROM student_answer_shares
GROUP BY card_id;

-- =====================================================
-- 完了メッセージ
-- =====================================================
-- 協働学習システムのデータベース設計完了
-- 
-- 実装済み機能：
-- 1. 回答共有システム（4種類の共有範囲）
-- 2. 回答比較セッション
-- 3. ピア評価（5段階評価×4項目）
-- 4. 相互フィードバック交換
-- 5. 協働学習グループ管理
-- 6. 協働活動記録
-- 7. 統計分析用ビュー（3種類）
--
-- 次のステップ：
-- - APIエンドポイントの実装
-- - フロントエンドUIの作成
-- - グループ編成アルゴリズムの実装
-- =====================================================
