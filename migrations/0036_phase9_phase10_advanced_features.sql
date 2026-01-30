-- ============================================================================
-- Phase 9: 適応学習エンジン
-- 学習スタイル自動検出システム
-- 科学的根拠: Fleming (2001), Gardner (1983), Cronbach & Snow (1977)
-- ============================================================================

-- 検出された学習スタイル保存テーブル
CREATE TABLE IF NOT EXISTS detected_learning_styles (
  student_id INTEGER PRIMARY KEY,
  -- VARKスコア
  vark_visual REAL DEFAULT 0,
  vark_auditory REAL DEFAULT 0,
  vark_reading REAL DEFAULT 0,
  vark_kinesthetic REAL DEFAULT 0,
  -- Gardnerスコア
  gardner_linguistic REAL DEFAULT 0,
  gardner_logical REAL DEFAULT 0,
  gardner_spatial REAL DEFAULT 0,
  gardner_bodily REAL DEFAULT 0,
  gardner_musical REAL DEFAULT 0,
  gardner_interpersonal REAL DEFAULT 0,
  gardner_intrapersonal REAL DEFAULT 0,
  gardner_naturalist REAL DEFAULT 0,
  -- 主要スタイル
  dominant_style TEXT NOT NULL CHECK(dominant_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  dominant_intelligence TEXT NOT NULL,
  confidence_level REAL DEFAULT 0 CHECK(confidence_level BETWEEN 0 AND 1),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEXの作成
CREATE INDEX IF NOT EXISTS idx_learning_styles_student ON detected_learning_styles(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_styles_dominant ON detected_learning_styles(dominant_style);

-- ============================================================================
-- Phase 9: ピアチューター機能
-- 科学的根拠: Protégé Effect (Chase et al., 2009)
-- ============================================================================

-- ピアチューターマッチング
CREATE TABLE IF NOT EXISTS peer_tutor_matches (
  match_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tutor_student_id INTEGER NOT NULL,    -- チューター（教える側）
  tutee_student_id INTEGER NOT NULL,    -- チューティー（教わる側）
  subject TEXT NOT NULL,
  unit_name TEXT,
  match_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
  effectiveness_rating INTEGER CHECK(effectiveness_rating BETWEEN 1 AND 5),
  UNIQUE(tutor_student_id, tutee_student_id, subject)
);

-- ピアチュータリングセッション
CREATE TABLE IF NOT EXISTS peer_tutoring_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL,
  session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INTEGER NOT NULL,
  topics_covered TEXT,
  tutor_notes TEXT,
  tutee_feedback TEXT,
  learning_improvement_score REAL,  -- チューティーの学習改善度（0-1）
  tutor_understanding_boost REAL    -- チューターの理解度向上（0-1、Protégé Effect）
);

-- INDEXの作成
CREATE INDEX IF NOT EXISTS idx_peer_tutor_matches_tutor ON peer_tutor_matches(tutor_student_id);
CREATE INDEX IF NOT EXISTS idx_peer_tutor_matches_tutee ON peer_tutor_matches(tutee_student_id);
CREATE INDEX IF NOT EXISTS idx_peer_tutoring_sessions_match ON peer_tutoring_sessions(match_id);

-- ============================================================================
-- Phase 9: マイクロラーニングセッション
-- 科学的根拠: Hug (2005), Mobile Learning Theory
-- ============================================================================

-- マイクロラーニングセッション（5分間学習）
CREATE TABLE IF NOT EXISTS micro_learning_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_end DATETIME,
  session_type TEXT NOT NULL CHECK(session_type IN ('quick_review', 'flashcard', 'mini_quiz', 'concept_check')),
  cards_completed INTEGER DEFAULT 0,
  target_duration_minutes INTEGER DEFAULT 5,
  actual_duration_minutes INTEGER,
  completion_rate REAL,  -- 完了率（0-1）
  focus_score REAL,      -- 集中度スコア（0-1）
  notification_triggered BOOLEAN DEFAULT FALSE,  -- 通知からの起動か
  device_type TEXT       -- 'mobile', 'tablet', 'desktop'
);

-- マイクロラーニング推奨スケジュール
CREATE TABLE IF NOT EXISTS micro_learning_schedule (
  schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  recommended_time TIME NOT NULL,  -- 推奨時刻（例: 07:30, 12:15, 18:00）
  day_of_week INTEGER CHECK(day_of_week BETWEEN 0 AND 6),  -- 0=日曜, 6=土曜
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered DATETIME,
  skip_count INTEGER DEFAULT 0,  -- スキップ回数
  completion_count INTEGER DEFAULT 0
);

-- INDEXの作成
CREATE INDEX IF NOT EXISTS idx_micro_sessions_student ON micro_learning_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_micro_sessions_date ON micro_learning_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_micro_schedule_student ON micro_learning_schedule(student_id);

-- ============================================================================
-- Phase 10: 学校管理者機能
-- ============================================================================

-- 学校マスタ
CREATE TABLE IF NOT EXISTS schools (
  school_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_name TEXT NOT NULL,
  school_code TEXT UNIQUE NOT NULL,
  school_type TEXT CHECK(school_type IN ('elementary', 'junior_high', 'high_school', 'combined')),
  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,
  established_date DATE,
  principal_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学校管理者
CREATE TABLE IF NOT EXISTS school_administrators (
  admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  admin_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'school_admin' CHECK(role IN ('school_admin', 'principal', 'vice_principal')),
  permissions TEXT,  -- JSON形式の権限リスト
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- クラスと学校の関連
CREATE TABLE IF NOT EXISTS school_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  academic_year INTEGER NOT NULL,
  grade_level INTEGER NOT NULL,
  class_number INTEGER,  -- 組番号（1組、2組など）
  homeroom_teacher_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(school_id, class_id)
);

-- INDEXの作成
CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(school_code);
CREATE INDEX IF NOT EXISTS idx_school_admins_school ON school_administrators(school_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_school ON school_classes(school_id);

-- ============================================================================
-- Phase 10: 教育委員会レポート
-- ============================================================================

-- 教育委員会
CREATE TABLE IF NOT EXISTS education_boards (
  board_id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_name TEXT NOT NULL,
  board_code TEXT UNIQUE NOT NULL,
  prefecture TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  superintendent_name TEXT,  -- 教育長名
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 教育委員会と学校の関連
CREATE TABLE IF NOT EXISTS board_schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  school_id INTEGER NOT NULL,
  affiliation_start_date DATE NOT NULL,
  affiliation_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(board_id, school_id)
);

-- 教育委員会レポート
CREATE TABLE IF NOT EXISTS education_board_reports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  report_type TEXT NOT NULL CHECK(report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  total_schools INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  average_sctn_score REAL,
  average_mastery_rate REAL,
  learning_strategy_adoption_rate REAL,
  report_data TEXT,  -- JSON形式の詳細データ
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_by INTEGER  -- 管理者ID
);

-- 学校別統計サマリー
CREATE TABLE IF NOT EXISTS school_statistics_summary (
  summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  total_learning_time_hours REAL DEFAULT 0,
  average_mastery_score REAL DEFAULT 0,
  average_sctn_score REAL DEFAULT 0,
  top_performing_class_id INTEGER,
  at_risk_students_count INTEGER DEFAULT 0,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, period_start, period_end)
);

-- INDEXの作成
CREATE INDEX IF NOT EXISTS idx_education_boards_code ON education_boards(board_code);
CREATE INDEX IF NOT EXISTS idx_board_schools_board ON board_schools(board_id);
CREATE INDEX IF NOT EXISTS idx_board_schools_school ON board_schools(school_id);
CREATE INDEX IF NOT EXISTS idx_board_reports_board ON education_board_reports(board_id);
CREATE INDEX IF NOT EXISTS idx_school_stats_school ON school_statistics_summary(school_id);
CREATE INDEX IF NOT EXISTS idx_school_stats_period ON school_statistics_summary(period_start, period_end);
