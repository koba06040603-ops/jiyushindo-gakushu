-- ============================================
-- Phase 14: ゲーミフィケーションシステム
-- ============================================

-- 1. バッジ定義テーブル
CREATE TABLE IF NOT EXISTS badge_definitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    badge_key TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- 'habit', 'challenge', 'special', 'subject', 'milestone'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- emoji or icon class
    condition_type TEXT NOT NULL, -- 'count', 'streak', 'time', 'accuracy', 'custom'
    condition_value INTEGER NOT NULL,
    points_reward INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. ユーザーバッジ獲得テーブル
CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    badge_key TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0, -- 進捗（未獲得バッジ用）
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE(student_id, badge_key)
);

-- 3. ポイント履歴テーブル
CREATE TABLE IF NOT EXISTS point_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    source TEXT NOT NULL, -- 'problem_solved', 'correct_answer', 'streak', 'login', 'badge', 'challenge'
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 4. レベルシステムテーブル
CREATE TABLE IF NOT EXISTS student_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE NOT NULL,
    current_level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    level_up_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 5. 学習ストリーク（連続記録）テーブル
CREATE TABLE IF NOT EXISTS learning_streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 6. デイリーチャレンジテーブル
CREATE TABLE IF NOT EXISTS daily_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_date DATE NOT NULL,
    challenge_type TEXT NOT NULL, -- 'solve_count', 'accuracy', 'subject_focus', 'tutor_question', 'study_time'
    challenge_goal INTEGER NOT NULL,
    challenge_description TEXT NOT NULL,
    points_reward INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_date)
);

-- 7. ユーザーチャレンジ進捗テーブル
CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id),
    UNIQUE(student_id, challenge_id)
);

-- 8. 励ましメッセージ履歴テーブル
CREATE TABLE IF NOT EXISTS encouragement_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    message_type TEXT NOT NULL, -- 'start', 'correct', 'incorrect', 'long_study', 'level_up', 'streak'
    message_text TEXT NOT NULL,
    shown BOOLEAN DEFAULT 0,
    shown_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ============================================
-- インデックス作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_badges_student ON user_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned ON user_badges(student_id, earned_at);
CREATE INDEX IF NOT EXISTS idx_point_history_student ON point_history(student_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created ON point_history(created_at);
CREATE INDEX IF NOT EXISTS idx_student_levels_points ON student_levels(total_points);
CREATE INDEX IF NOT EXISTS idx_streaks_student ON learning_streaks(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_user_challenge_student ON user_challenge_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_encouragement_student ON encouragement_messages(student_id, shown);

-- ============================================
-- バッジ定義の初期データ挿入
-- ============================================

-- チャレンジバッジ
INSERT OR IGNORE INTO badge_definitions (badge_key, category, name, description, icon, condition_type, condition_value, points_reward) VALUES
('challenge_hard_first', 'challenge', '難問挑戦者', '発展問題に初めて挑戦しました', '🎯', 'count', 1, 50),
('challenge_hard_10', 'challenge', '難問クリア', '発展問題を10問正解しました', '💪', 'count', 10, 200),
('challenge_weak_overcome', 'challenge', '苦手克服', '苦手分野で10問正解しました', '🌱', 'count', 10, 150),
('challenge_review_master', 'challenge', '復習王', '間違えた問題を5問復習しました', '📚', 'count', 5, 100);

-- 特別バッジ
INSERT OR IGNORE INTO badge_definitions (badge_key, category, name, description, icon, condition_type, condition_value, points_reward) VALUES
('special_questioner', 'special', '質問者', 'AIチューターに10回質問しました', '❓', 'count', 10, 100),
('special_explorer', 'special', '探求者', 'AIチューターに50回質問しました', '🔍', 'count', 50, 300),
('special_improvement', 'special', '向上心', '学習アドバイスを10回確認しました', '📈', 'count', 10, 100),
('special_self_analysis', 'special', '自己分析', '学習レポートを10回確認しました', '📊', 'count', 10, 100);

-- 学習習慣バッジ
INSERT OR IGNORE INTO badge_definitions (badge_key, category, name, description, icon, condition_type, condition_value, points_reward) VALUES
('habit_first_step', 'habit', '初めの一歩', '初めて問題を解きました', '👣', 'count', 1, 10),
('habit_streak_3', 'habit', '継続の力', '3日連続でログインしました', '🔥', 'streak', 3, 50),
('habit_streak_7', 'habit', '努力の証', '7日連続でログインしました', '💎', 'streak', 7, 150),
('habit_streak_30', 'habit', '習慣化マスター', '30日連続でログインしました', '👑', 'streak', 30, 500);

-- 問題解決バッジ
INSERT OR IGNORE INTO badge_definitions (badge_key, category, name, description, icon, condition_type, condition_value, points_reward) VALUES
('solve_first_correct', 'milestone', '初正解', '初めて正解しました', '✨', 'count', 1, 20),
('solve_10', 'milestone', '10問クリア', '10問正解しました', '⭐', 'count', 10, 50),
('solve_50', 'milestone', '50問クリア', '50問正解しました', '🌟', 'count', 50, 150),
('solve_100', 'milestone', '100問クリア', '100問正解しました', '💫', 'count', 100, 300),
('solve_perfect_10', 'milestone', 'パーフェクト', '10問連続で正解しました', '🏆', 'count', 10, 200);

-- 教科別バッジ
INSERT OR IGNORE INTO badge_definitions (badge_key, category, name, description, icon, condition_type, condition_value, points_reward) VALUES
('subject_math_100', 'subject', '数学マスター', '数学の問題を100問正解しました', '🔢', 'count', 100, 300),
('subject_japanese_100', 'subject', '国語の達人', '国語の問題を100問正解しました', '📖', 'count', 100, 300),
('subject_science_100', 'subject', '理科博士', '理科の問題を100問正解しました', '🔬', 'count', 100, 300),
('subject_social_100', 'subject', '社会通', '社会の問題を100問正解しました', '🌍', 'count', 100, 300),
('subject_english_100', 'subject', '英語の星', '英語の問題を100問正解しました', '🌐', 'count', 100, 300);
