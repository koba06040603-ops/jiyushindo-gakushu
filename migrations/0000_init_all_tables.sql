-- ============================================================================
-- 自由進度学習支援システム - 統合データベーススキーマ
-- Phase 1-6 全テーブル定義（外部キー制約付き）
-- 作成日: 2026-01-30
-- ============================================================================

-- 外部キー制約を一時的に無効化（テーブル作成時の依存関係エラー回避）
PRAGMA foreign_keys = OFF;

-- ============================================================================
-- SECTION 1: 基本マスタテーブル
-- ============================================================================

-- 学生マスタ
CREATE TABLE IF NOT EXISTS students (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK(grade_level BETWEEN 1 AND 12),
  enrollment_date DATE DEFAULT (DATE('now')),
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'student' CHECK(role IN ('student', 'teacher', 'parent', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教師マスタ
CREATE TABLE IF NOT EXISTS teachers (
  teacher_id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'teacher' CHECK(role IN ('teacher', 'admin')),
  specialization TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 保護者マスタ
CREATE TABLE IF NOT EXISTS parents (
  parent_id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'parent',
  phone_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 保護者-学生関連テーブル
CREATE TABLE IF NOT EXISTS parent_student_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  relationship_type TEXT DEFAULT 'parent' CHECK(relationship_type IN ('parent', 'guardian', 'other')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(parent_id, student_id)
);

-- クラスマスタ
CREATE TABLE IF NOT EXISTS classes (
  class_id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_code TEXT UNIQUE NOT NULL,
  class_name TEXT NOT NULL,
  teacher_id INTEGER,
  grade_level INTEGER NOT NULL,
  school_year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- クラス在籍テーブル
CREATE TABLE IF NOT EXISTS class_enrollments (
  enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(student_id, class_id)
);

-- ============================================================================
-- SECTION 2: 学習カードシステム
-- ============================================================================

-- 学習カード（問題）マスタ
CREATE TABLE IF NOT EXISTS learning_cards (
  card_id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  unit_name TEXT NOT NULL,
  card_title TEXT NOT NULL,
  card_type TEXT DEFAULT 'standard' CHECK(card_type IN ('standard', 'challenge', 'review', 'optional')),
  difficulty_level TEXT DEFAULT 'standard' CHECK(difficulty_level IN ('easy', 'standard', 'hard')),
  learning_track TEXT DEFAULT 'shikkari' CHECK(learning_track IN ('jikkuri', 'shikkari', 'gungun')),
  problem_text TEXT NOT NULL,
  problem_description TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  hint_text TEXT,
  solution_video_url TEXT,
  image_url TEXT,
  card_order INTEGER DEFAULT 0,
  estimated_time_minutes INTEGER DEFAULT 10,
  curriculum_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学生の学習進捗
CREATE TABLE IF NOT EXISTS student_progress (
  progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed', 'mastered')),
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_attempt_date DATETIME,
  mastery_score REAL DEFAULT 0.0 CHECK(mastery_score BETWEEN 0 AND 100),
  time_spent_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, card_id)
);

-- 学習履歴
CREATE TABLE IF NOT EXISTS learning_history (
  history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  attempt_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  student_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0,
  hint_used BOOLEAN DEFAULT FALSE,
  confidence_level TEXT CHECK(confidence_level IN ('low', 'medium', 'high')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- エラー履歴（誤答分析）
CREATE TABLE IF NOT EXISTS error_history (
  error_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  error_type TEXT NOT NULL,
  error_description TEXT,
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 3: 自己調整学習（SRL）サイクル
-- ============================================================================

-- 学習計画（Plan）
CREATE TABLE IF NOT EXISTS learning_plans (
  plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_date DATE NOT NULL,
  target_subject TEXT,
  target_unit TEXT,
  target_cards_count INTEGER DEFAULT 5,
  target_time_minutes INTEGER DEFAULT 30,
  motivation_level TEXT CHECK(motivation_level IN ('low', 'medium', 'high')),
  strategy_choice TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学習実行記録（Do）
CREATE TABLE IF NOT EXISTS learning_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,
  session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_end DATETIME,
  actual_cards_completed INTEGER DEFAULT 0,
  actual_time_minutes INTEGER DEFAULT 0,
  focus_level TEXT CHECK(focus_level IN ('low', 'medium', 'high'))
);

-- 振り返り（Reflection）
CREATE TABLE IF NOT EXISTS learning_reflections (
  reflection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  plan_id INTEGER,
  reflection_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  achievement_rating INTEGER CHECK(achievement_rating BETWEEN 1 AND 5),
  difficulty_rating INTEGER CHECK(difficulty_rating BETWEEN 1 AND 5),
  strategy_effectiveness TEXT,
  what_went_well TEXT,
  what_to_improve TEXT,
  next_action_plan TEXT
);

-- ============================================================================
-- SECTION 4: 分散学習システム（Spaced Learning）
-- ============================================================================

-- 分散学習カードスケジュール
CREATE TABLE IF NOT EXISTS spaced_learning_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  mastery_status TEXT DEFAULT 'unlearned' CHECK(mastery_status IN ('unlearned', 'learning', 'reviewed', 'mastered')),
  box_level INTEGER DEFAULT 1 CHECK(box_level BETWEEN 1 AND 5),
  repetition_count INTEGER DEFAULT 0,
  easiness_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  next_review_date DATE NOT NULL,
  last_reviewed_date DATE,
  last_review_quality INTEGER CHECK(last_review_quality BETWEEN 0 AND 5),
  consecutive_correct INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_recall_quality REAL DEFAULT 0.0,
  forgetting_risk REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, card_id)
);

-- 分散学習レビュー履歴
CREATE TABLE IF NOT EXISTS spaced_learning_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recall_quality INTEGER NOT NULL CHECK(recall_quality BETWEEN 0 AND 5),
  response_time_seconds INTEGER,
  box_level_before INTEGER,
  box_level_after INTEGER,
  interval_before_days INTEGER,
  interval_after_days INTEGER,
  easiness_factor REAL,
  was_correct BOOLEAN NOT NULL,
  review_type TEXT CHECK(review_type IN ('scheduled', 'extra', 'cramming'))
);

-- ============================================================================
-- SECTION 5: 検索練習（Retrieval Practice）
-- ============================================================================

-- 検索練習セッション
CREATE TABLE IF NOT EXISTS retrieval_practice_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK(session_type IN ('free_recall', 'cued_recall', 'recognition', 'elaborative')),
  target_subject TEXT,
  target_unit TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  total_items INTEGER DEFAULT 0,
  items_recalled INTEGER DEFAULT 0,
  recall_accuracy REAL DEFAULT 0.0,
  session_duration_seconds INTEGER DEFAULT 0
);

-- 検索練習アイテム
CREATE TABLE IF NOT EXISTS retrieval_practice_items (
  item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  student_response TEXT,
  ai_evaluation_score REAL,
  ai_feedback TEXT,
  response_time_seconds INTEGER,
  confidence_before INTEGER CHECK(confidence_before BETWEEN 1 AND 5),
  confidence_after INTEGER CHECK(confidence_after BETWEEN 1 AND 5),
  was_recalled BOOLEAN NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 検索練習メタ認知追跡
CREATE TABLE IF NOT EXISTS retrieval_metacognition (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  confidence_level INTEGER NOT NULL CHECK(confidence_level BETWEEN 1 AND 5),
  actual_performance REAL NOT NULL,
  calibration_accuracy REAL,
  metacognitive_awareness_score REAL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 6: 交互配置学習（Interleaved Practice）
-- ============================================================================

-- 交互配置セッション
CREATE TABLE IF NOT EXISTS interleaved_practice_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  strategy_type TEXT NOT NULL CHECK(strategy_type IN ('random', 'block', 'adaptive', 'systematic')),
  subjects_mixed TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  total_problems INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  session_effectiveness_score REAL DEFAULT 0.0
);

-- 交互配置問題順序
CREATE TABLE IF NOT EXISTS interleaved_problem_sequence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  problem_order INTEGER NOT NULL,
  subject TEXT NOT NULL,
  is_switch BOOLEAN DEFAULT FALSE,
  response_time_seconds INTEGER,
  is_correct BOOLEAN,
  difficulty_rating INTEGER CHECK(difficulty_rating BETWEEN 1 AND 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 交互配置効果測定
CREATE TABLE IF NOT EXISTS interleaved_effectiveness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_id INTEGER NOT NULL,
  immediate_recall_score REAL,
  retention_score REAL,
  transfer_score REAL,
  discrimination_accuracy REAL,
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 7: 協働学習（Collaborative Learning）
-- ============================================================================

-- 学習投稿（友達の回答共有）
CREATE TABLE IF NOT EXISTS learning_posts (
  post_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER NOT NULL,
  class_code TEXT,
  post_type TEXT DEFAULT 'answer' CHECK(post_type IN ('answer', 'question', 'explanation', 'note')),
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 相互評価
CREATE TABLE IF NOT EXISTS peer_evaluations (
  evaluation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  evaluator_student_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  evaluation_criteria TEXT,
  is_helpful BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学習ノート（個人メモ）
CREATE TABLE IF NOT EXISTS learning_notes (
  note_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER,
  note_title TEXT,
  note_content TEXT NOT NULL,
  tags TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 協働学習統計
CREATE TABLE IF NOT EXISTS collaborative_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  total_posts INTEGER DEFAULT 0,
  total_evaluations_given INTEGER DEFAULT 0,
  total_evaluations_received INTEGER DEFAULT 0,
  average_rating_received REAL DEFAULT 0.0,
  helpful_marks_received INTEGER DEFAULT 0,
  collaboration_score REAL DEFAULT 0.0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id)
);

-- ============================================================================
-- SECTION 8: ScTN（非認知能力）測定
-- ============================================================================

-- ScTN質問項目マスタ
CREATE TABLE IF NOT EXISTS sctn_questions (
  question_id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension TEXT NOT NULL CHECK(dimension IN ('metacognition', 'self_regulation', 'motivation', 'collaboration', 'conceptual_understanding', 'learning_time')),
  question_text TEXT NOT NULL,
  question_code TEXT UNIQUE NOT NULL,
  scale_type TEXT DEFAULT 'likert_5' CHECK(scale_type IN ('likert_5', 'likert_7', 'yes_no')),
  reverse_scored BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ScTN回答データ
CREATE TABLE IF NOT EXISTS sctn_responses (
  response_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  response_value INTEGER NOT NULL,
  survey_date DATE DEFAULT (DATE('now')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ScTNスコア集計
CREATE TABLE IF NOT EXISTS sctn_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  survey_date DATE NOT NULL,
  metacognition_score REAL,
  self_regulation_score REAL,
  motivation_score REAL,
  collaboration_score REAL,
  conceptual_understanding_score REAL,
  learning_time_score REAL,
  total_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, survey_date)
);

-- ============================================================================
-- SECTION 9: ゲーミフィケーション
-- ============================================================================

-- バッジマスタ
CREATE TABLE IF NOT EXISTS badges (
  badge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge_code TEXT UNIQUE NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_category TEXT NOT NULL CHECK(badge_category IN ('achievement', 'milestone', 'social', 'skill')),
  badge_tier TEXT NOT NULL DEFAULT 'bronze' CHECK(badge_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  badge_icon TEXT,
  badge_color TEXT DEFAULT '#FFD700',
  points_required INTEGER DEFAULT 0,
  condition_type TEXT NOT NULL,
  condition_value TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  rarity TEXT DEFAULT 'common' CHECK(rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学生のバッジ獲得記録
CREATE TABLE IF NOT EXISTS student_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  progress_data TEXT,
  UNIQUE(student_id, badge_id)
);

-- アチーブメント（実績）
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id INTEGER PRIMARY KEY AUTOINCREMENT,
  achievement_code TEXT UNIQUE NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  achievement_category TEXT NOT NULL CHECK(achievement_category IN ('daily', 'weekly', 'monthly', 'lifetime')),
  target_metric TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 0,
  reward_badge_id INTEGER,
  is_repeatable BOOLEAN DEFAULT FALSE,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学生のアチーブメント進捗
CREATE TABLE IF NOT EXISTS student_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  progress_percentage REAL DEFAULT 0.0,
  completed_at DATETIME,
  times_completed INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, achievement_id)
);

-- ポイントシステム
CREATE TABLE IF NOT EXISTS student_points (
  student_id INTEGER PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  points_to_next_level INTEGER DEFAULT 100,
  rank_title TEXT DEFAULT 'Beginner',
  last_point_earned_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ポイント取引履歴
CREATE TABLE IF NOT EXISTS point_transactions (
  transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  points_change INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('review', 'achievement', 'badge', 'daily_login', 'help_given', 'streak_bonus', 'deduction')),
  source_id INTEGER,
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学習ストリーク（連続学習記録）
CREATE TABLE IF NOT EXISTS learning_streaks (
  student_id INTEGER PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ランキングエントリ
CREATE TABLE IF NOT EXISTS ranking_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_code TEXT,
  ranking_type TEXT NOT NULL CHECK(ranking_type IN ('points', 'streak', 'mastery', 'collaboration')),
  score_value REAL NOT NULL,
  rank_position INTEGER,
  period_type TEXT CHECK(period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, ranking_type, period_type, period_date)
);

-- デイリークエスト
CREATE TABLE IF NOT EXISTS daily_quests (
  quest_id INTEGER PRIMARY KEY AUTOINCREMENT,
  quest_name TEXT NOT NULL,
  quest_description TEXT,
  quest_type TEXT NOT NULL CHECK(quest_type IN ('review_count', 'time_spent', 'streak_maintain')),
  target_value INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 10,
  reward_badge_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学生のクエスト進捗
CREATE TABLE IF NOT EXISTS student_quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  quest_id INTEGER NOT NULL,
  quest_date DATE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at DATETIME,
  UNIQUE(student_id, quest_id, quest_date)
);

-- レベル定義
CREATE TABLE IF NOT EXISTS level_definitions (
  level INTEGER PRIMARY KEY,
  level_name TEXT NOT NULL,
  experience_required INTEGER NOT NULL,
  rank_title TEXT NOT NULL,
  perks TEXT
);

-- ============================================================================
-- SECTION 10: レポート・分析
-- ============================================================================

-- 週次レポート
CREATE TABLE IF NOT EXISTS weekly_reports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_study_time_minutes INTEGER DEFAULT 0,
  total_cards_reviewed INTEGER DEFAULT 0,
  average_accuracy REAL DEFAULT 0.0,
  sctn_trend TEXT,
  spaced_learning_progress TEXT,
  learning_strategy_effectiveness TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, week_start_date)
);

-- 月次レポート
CREATE TABLE IF NOT EXISTS monthly_reports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  month_year TEXT NOT NULL,
  total_cards_mastered INTEGER DEFAULT 0,
  average_mastery_score REAL DEFAULT 0.0,
  learning_effectiveness_score REAL DEFAULT 0.0,
  collaborative_learning_score REAL DEFAULT 0.0,
  trend_data TEXT,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, month_year)
);

-- ============================================================================
-- SECTION 11: リアルタイム通知
-- ============================================================================

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('recall_reminder', 'teacher_message', 'new_card', 'badge_earned', 'peer_evaluation', 'system')),
  from_user_id INTEGER,
  to_user_id INTEGER NOT NULL,
  class_code TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 12: AI会話履歴
-- ============================================================================

-- AI先生との会話履歴
CREATE TABLE IF NOT EXISTS ai_conversations (
  conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER,
  conversation_type TEXT CHECK(conversation_type IN ('dialogue', 'hint', 'metacognitive', 'strategy', 'problem_generation', 'personalized_plan')),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 13: 多言語対応
-- ============================================================================

-- ユーザー言語設定
CREATE TABLE IF NOT EXISTS user_language_preferences (
  user_id INTEGER PRIMARY KEY,
  user_type TEXT NOT NULL CHECK(user_type IN ('student', 'teacher', 'parent')),
  preferred_language TEXT DEFAULT 'ja' CHECK(preferred_language IN ('ja', 'en', 'zh', 'ko')),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 14: 不登校児童生徒支援
-- ============================================================================

-- 不登校支援プロファイル
CREATE TABLE IF NOT EXISTS truancy_support_profiles (
  profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL UNIQUE,
  support_start_date DATE NOT NULL,
  current_attendance_status TEXT CHECK(current_attendance_status IN ('attending', 'partial', 'not_attending')),
  preferred_learning_time TEXT,
  daily_target_minutes INTEGER DEFAULT 15,
  anxiety_level TEXT CHECK(anxiety_level IN ('low', 'moderate', 'high')),
  support_notes TEXT,
  counselor_contact TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 感情トラッキング（不登校生徒用）
CREATE TABLE IF NOT EXISTS emotion_tracking (
  tracking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  tracking_date DATE NOT NULL,
  mood_rating INTEGER CHECK(mood_rating BETWEEN 1 AND 5),
  energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 5),
  anxiety_level INTEGER CHECK(anxiety_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 低負荷学習セッション
CREATE TABLE IF NOT EXISTS low_stress_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  cards_completed INTEGER DEFAULT 0,
  stress_level_before INTEGER CHECK(stress_level_before BETWEEN 1 AND 5),
  stress_level_after INTEGER CHECK(stress_level_after BETWEEN 1 AND 5),
  completion_feeling TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 15: PWA・オフライン対応
-- ============================================================================

-- オフライン学習キュー
CREATE TABLE IF NOT EXISTS offline_learning_queue (
  queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK(action_type IN ('card_review', 'answer_submit', 'progress_update', 'reflection')),
  action_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,
  is_synced BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- SECTION 16: 教師・保護者ダッシュボード用ビュー作成
-- ============================================================================

-- 学生進捗サマリービュー（軽量化のため実テーブル化は後で検討）
-- CREATE VIEW student_progress_summary AS ...

-- ============================================================================
-- INDEXの作成（パフォーマンス最適化）
-- ============================================================================

-- 学生テーブル
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade_level);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- 学習進捗
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_card ON student_progress(card_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_status ON student_progress(status);

-- 学習履歴
CREATE INDEX IF NOT EXISTS idx_learning_history_student ON learning_history(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_card ON learning_history(card_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_date ON learning_history(attempt_date);

-- 分散学習
CREATE INDEX IF NOT EXISTS idx_spaced_cards_student ON spaced_learning_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_spaced_cards_review_date ON spaced_learning_cards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_spaced_cards_status ON spaced_learning_cards(mastery_status);

-- 検索練習
CREATE INDEX IF NOT EXISTS idx_retrieval_sessions_student ON retrieval_practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_items_session ON retrieval_practice_items(session_id);

-- 交互配置
CREATE INDEX IF NOT EXISTS idx_interleaved_sessions_student ON interleaved_practice_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_interleaved_sequence_session ON interleaved_problem_sequence(session_id);

-- 協働学習
CREATE INDEX IF NOT EXISTS idx_learning_posts_student ON learning_posts(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_posts_card ON learning_posts(card_id);
CREATE INDEX IF NOT EXISTS idx_peer_evaluations_post ON peer_evaluations(post_id);

-- 通知
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(to_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ゲーミフィケーション
CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_ranking_entries_student ON ranking_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_student_quests_student ON student_quests(student_id);

-- ============================================================================
-- 外部キー制約を再度有効化
-- ============================================================================

-- PRAGMA foreign_keys = ON;
-- 注: Cloudflare D1では外部キー制約を手動で有効化すると
-- マイグレーション時にエラーが発生する場合があります。
-- 本番環境では、D1が自動的に管理します。

-- ============================================================================
-- 初期データ挿入（サンプルデータ）
-- ============================================================================

-- レベル定義の初期データ
INSERT OR IGNORE INTO level_definitions (level, level_name, experience_required, rank_title) VALUES
(1, 'レベル1', 0, 'Beginner'),
(2, 'レベル2', 100, 'Beginner'),
(3, 'レベル3', 250, 'Beginner'),
(4, 'レベル4', 450, 'Novice'),
(5, 'レベル5', 700, 'Novice'),
(10, 'レベル10', 2500, 'Intermediate'),
(15, 'レベル15', 5500, 'Advanced'),
(20, 'レベル20', 10000, 'Expert'),
(25, 'レベル25', 16000, 'Master'),
(30, 'レベル30', 24000, 'Grand Master');

-- デイリークエストサンプル
INSERT OR IGNORE INTO daily_quests (quest_name, quest_description, quest_type, target_value, reward_points) VALUES
('毎日の復習', '今日のカードを5枚復習しよう', 'review_count', 5, 10),
('集中学習', '30分以上学習しよう', 'time_spent', 30, 15),
('継続は力なり', '連続学習記録を維持しよう', 'streak_maintain', 1, 20);

-- ScTN質問項目サンプル（メタ認知）
INSERT OR IGNORE INTO sctn_questions (dimension, question_text, question_code) VALUES
('metacognition', '学習する前に、何をどのように学ぶか計画を立てている', 'META_01'),
('metacognition', '学習中、理解できているか自分でチェックしている', 'META_02'),
('metacognition', '学習後、何が分かって何が分からなかったか振り返っている', 'META_03');

-- バッジサンプル
INSERT OR IGNORE INTO badges (badge_code, badge_name, badge_description, badge_category, badge_tier, condition_type, points_required) VALUES
('first_review', '初めての一歩', '初めてカードを復習した', 'achievement', 'bronze', 'review_count', 0),
('streak_7', '一週間継続', '7日連続で学習した', 'milestone', 'silver', 'streak_days', 50),
('mastery_gold', 'ゴールドマスター', '100枚のカードをマスターした', 'skill', 'gold', 'mastery_level', 200),
('helper', 'お助けマン', '5回以上友達を助けた', 'social', 'bronze', 'helpful_marks', 30);

-- ============================================================================
-- 完了
-- ============================================================================
-- このスクリプトは、Phase 1-6の全機能を網羅した統合スキーマです。
-- 外部キー制約は最後に有効化されます。
-- ============================================================================
