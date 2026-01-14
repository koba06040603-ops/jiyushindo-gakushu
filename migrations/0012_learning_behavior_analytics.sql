-- Phase 9: 学習パターン分析のためのデータベーススキーマ
-- 実装日: 2026-01-14

-- 1. 学習行動ログテーブル（詳細な行動記録）
CREATE TABLE IF NOT EXISTS learning_behavior_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  learning_card_id INTEGER,
  
  -- 行動の種類
  action_type TEXT NOT NULL, -- 'page_view', 'click', 'help_request', 'answer_submit', 'hint_view', 'ai_question', etc.
  action_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- セッション情報
  session_id TEXT,
  session_duration INTEGER, -- セッション全体の秒数
  
  -- 詳細情報
  page_element TEXT, -- どの要素を操作したか（'visual_hint', 'audio_guide', 'interactive_tool', etc.）
  element_type TEXT, -- 'text', 'image', 'video', 'audio', 'interactive'
  interaction_duration INTEGER, -- この操作の滞在時間（秒）
  
  -- 結果
  success BOOLEAN, -- 操作が成功したか
  error_message TEXT, -- エラーがあった場合
  
  -- 学習コンテキスト
  current_understanding_level INTEGER, -- その時点の理解度（1-5）
  previous_card_id INTEGER, -- 直前に見ていたカード
  next_card_id INTEGER, -- 次に見たカード
  
  -- メタデータ（JSON形式）
  metadata TEXT, -- 追加情報（クリック座標、スクロール位置、など）
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id)
);

-- インデックス作成（分析クエリの高速化）
CREATE INDEX IF NOT EXISTS idx_behavior_student_timestamp 
  ON learning_behavior_logs(student_id, action_timestamp);
CREATE INDEX IF NOT EXISTS idx_behavior_action_type 
  ON learning_behavior_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_behavior_session 
  ON learning_behavior_logs(session_id);

-- 2. 学習プロファイルテーブル（分析結果を保存）
CREATE TABLE IF NOT EXISTS learning_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  
  -- プロファイル情報
  profile_type TEXT DEFAULT 'comprehensive', -- 'time', 'style', 'comprehension', 'help', 'progress', 'engagement', 'comprehensive'
  profile_version INTEGER DEFAULT 1,
  
  -- 分析結果（JSON形式）
  profile_data TEXT NOT NULL, -- 6つの分析結果を統合したJSON
  
  -- 統計情報
  overall_score REAL, -- 総合スコア（0.0-100.0）
  confidence_level TEXT, -- 'low', 'medium', 'high'
  
  -- タイムスタンプ
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- プロファイルの有効期限（定期的に再生成）
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  UNIQUE(student_id, curriculum_id, profile_type)
);

CREATE INDEX IF NOT EXISTS idx_profile_student 
  ON learning_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profile_expires 
  ON learning_profiles(expires_at);

-- 3. 個別最適化プランテーブル
CREATE TABLE IF NOT EXISTS personalized_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  profile_id INTEGER NOT NULL,
  
  -- プラン情報
  plan_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  plan_data TEXT NOT NULL, -- JSON形式で詳細なプランを保存
  
  -- ステータス
  status TEXT DEFAULT 'active', -- 'draft', 'active', 'completed', 'expired'
  effectiveness_score REAL, -- このプランの効果スコア（0.0-1.0）
  
  -- 目標
  target_cards INTEGER, -- 目標カード数
  target_understanding_level REAL, -- 目標理解度
  
  -- 実績
  actual_cards INTEGER DEFAULT 0,
  actual_understanding_level REAL,
  
  -- タイムスタンプ
  start_date DATE,
  end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id),
  FOREIGN KEY (profile_id) REFERENCES learning_profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_plan_student_status 
  ON personalized_plans(student_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_dates 
  ON personalized_plans(start_date, end_date);

-- 4. 適応型学習カードテーブル
CREATE TABLE IF NOT EXISTS adapted_learning_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_card_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- 適応情報
  learning_style TEXT NOT NULL, -- 'visual', 'auditory', 'kinesthetic', 'mixed'
  adaptation_type TEXT, -- 'full', 'partial', 'minimal'
  adaptation_version INTEGER DEFAULT 1,
  
  -- 適応後のコンテンツ（JSON形式）
  adapted_content TEXT NOT NULL,
  
  -- 効果測定
  effectiveness_score REAL, -- この適応の効果（0.0-1.0）
  usage_count INTEGER DEFAULT 0,
  average_completion_time INTEGER, -- 平均完了時間（秒）
  average_understanding_level REAL, -- 平均理解度
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  
  FOREIGN KEY (original_card_id) REFERENCES learning_cards(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE(original_card_id, student_id, learning_style)
);

CREATE INDEX IF NOT EXISTS idx_adapted_card_student 
  ON adapted_learning_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_adapted_card_original 
  ON adapted_learning_cards(original_card_id);

-- 5. 学習パターン分析結果テーブル（個別の分析結果を保存）
CREATE TABLE IF NOT EXISTS pattern_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  
  -- 分析タイプ
  pattern_type TEXT NOT NULL, -- 'time', 'style', 'comprehension', 'help_seeking', 'progress_speed', 'engagement'
  
  -- 分析結果（JSON形式）
  analysis_data TEXT NOT NULL,
  
  -- 統計情報
  confidence_score REAL, -- 信頼度スコア（0.0-1.0）
  sample_size INTEGER, -- 分析に使用したデータ数
  
  -- タイムスタンプ
  analysis_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_student_type 
  ON pattern_analysis_results(student_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_date 
  ON pattern_analysis_results(analysis_date);

-- 6. AI予測結果テーブル
CREATE TABLE IF NOT EXISTS ai_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  
  -- 予測タイプ
  prediction_type TEXT NOT NULL, -- 'next_week', 'next_month', 'next_3_months', 'struggling_point', 'optimal_time'
  
  -- 予測結果（JSON形式）
  prediction_data TEXT NOT NULL,
  
  -- 信頼度
  confidence_level REAL, -- 0.0-1.0
  
  -- 実績（後で検証用）
  actual_result TEXT, -- 実際の結果（JSON形式）
  prediction_accuracy REAL, -- 予測精度（0.0-1.0）
  
  -- タイムスタンプ
  prediction_date DATE,
  target_date DATE, -- 予測対象の日付
  verified_at DATETIME, -- 検証日時
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

CREATE INDEX IF NOT EXISTS idx_prediction_student 
  ON ai_predictions(student_id, target_date);
CREATE INDEX IF NOT EXISTS idx_prediction_verification 
  ON ai_predictions(verified_at);

-- 7. 教師・保護者向け推奨事項テーブル
CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  
  -- 推奨対象
  target_role TEXT NOT NULL, -- 'teacher', 'parent', 'student'
  
  -- 推奨タイプ
  recommendation_type TEXT NOT NULL, -- 'intervention', 'encouragement', 'adjustment', 'challenge'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- 推奨内容
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_items TEXT, -- JSON配列形式
  
  -- ステータス
  status TEXT DEFAULT 'pending', -- 'pending', 'acknowledged', 'in_progress', 'completed', 'dismissed'
  
  -- 効果測定
  effectiveness_rating INTEGER, -- 1-5の評価
  feedback TEXT,
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at DATETIME,
  completed_at DATETIME,
  expires_at DATETIME,
  
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_target 
  ON recommendations(target_role, status);
CREATE INDEX IF NOT EXISTS idx_recommendation_priority 
  ON recommendations(priority, status);
CREATE INDEX IF NOT EXISTS idx_recommendation_expires 
  ON recommendations(expires_at);
