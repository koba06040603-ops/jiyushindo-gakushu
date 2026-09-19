/**
 * 本番DBスキーマ同期定義（2026-09-19 生成）
 * ============================================================
 * 【背景】
 * 本番106テーブル / ローカル194テーブルと大きく乖離しており、
 * コードが参照する59テーブルが本番に存在しなかった。
 * これが「データの読み込みに失敗しました」系エラーの根本原因。
 *
 * 本番D1にはAPIトークンの権限が無く wrangler から直接
 * マイグレーションを適用できないため、アプリ経由で実行する。
 * 定義はローカルDBの実スキーマから自動生成し、全て冪等
 * （CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS）。
 *
 * 【対象外】
 * answers / hint_cards / optional_problems / users / user_sessions /
 * auth_users は本番とローカルで「テーブルの意味」自体が異なるため、
 * 列追加はせずアプリ側のスキーマ互換レイヤーで吸収している。
 * （例: 本番 answers = 模範解答マスタ / ローカル answers = 解答履歴）
 *
 * 対応する SQL ファイル: migrations/0101_sync_production_full.sql
 */

const SCHEMA_SYNC_CREATES: string[] = [
  `CREATE TABLE IF NOT EXISTS learning_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER,
  student_id INTEGER NOT NULL,
  unit_id INTEGER,
  card_id INTEGER,
  course_type TEXT DEFAULT 'unknown',
  is_correct INTEGER DEFAULT 0,
  answer_time_seconds REAL DEFAULT 0,
  hint_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'medium',
  problem_type TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_card_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  card_id INTEGER,
  plan_id INTEGER,
  hour_number INTEGER,
  is_correct INTEGER DEFAULT 0,  
  answer_time_seconds INTEGER DEFAULT 0,
  content_type TEXT DEFAULT 'card',  
  problem_number INTEGER,  
  hint_used INTEGER DEFAULT 0,
  difficulty_felt TEXT,  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS initial_diagnostics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER,
  unit_name TEXT,
  subject TEXT,
  grade TEXT,
  
  learning_style_dominant TEXT DEFAULT 'balanced',  
  learning_style_counts TEXT,  
  
  resilience INTEGER DEFAULT 3,  
  error_strategy TEXT DEFAULT 'hint',  
  
  preferred_pace TEXT DEFAULT 'steady',  
  session_length TEXT DEFAULT 'medium',  
  
  prior_knowledge INTEGER DEFAULT 3,  
  subject_affinity INTEGER DEFAULT 3,  
  
  raw_answers TEXT,  
  
  ai_profile_summary TEXT,  
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS study_plan_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  hour_number INTEGER NOT NULL,      
  planned_date DATE,                 
  actual_date DATE,                  
  
  initial_plan TEXT,                 
  
  today_plan TEXT,                   
  today_goal TEXT,                   
  
  actual_done TEXT,                  
  
  cards_done TEXT,                   
  check_test_done INTEGER DEFAULT 0, 
  check_test_score REAL,             
  check_test_max REAL,               
  selection_tasks_done TEXT,         
  
  study_minutes INTEGER,             
  
  status TEXT DEFAULT 'planned',     
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, subject TEXT DEFAULT '',
  FOREIGN KEY (plan_id) REFERENCES unit_study_plans(id)
)`,
  `CREATE TABLE IF NOT EXISTS test_preparation_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'テスト対策',
  test_date DATE,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  textbook_company TEXT,
  curriculum_ids TEXT DEFAULT '[]',
  custom_topics TEXT DEFAULT '[]',
  study_schedule TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','archived')),
  total_study_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, all_topics TEXT, ai_schedule TEXT, daily_minutes INTEGER DEFAULT 30)`,
  `CREATE TABLE IF NOT EXISTS persistence_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  hour_number INTEGER,
  
  
  task_completion_rate REAL,         
  session_duration_minutes REAL,     
  early_quit_count INTEGER DEFAULT 0,
  
  difficulty_faced_count INTEGER DEFAULT 0,  
  retry_after_failure_count INTEGER DEFAULT 0, 
  gave_up_count INTEGER DEFAULT 0,   
  
  error_to_retry_seconds REAL,       
  performance_after_failure REAL,    
  help_seeking_after_failure INTEGER DEFAULT 0, 
  
  extra_tasks_attempted INTEGER DEFAULT 0, 
  review_initiated_count INTEGER DEFAULT 0, 
  hint_card_accessed_count INTEGER DEFAULT 0, 
  
  confidence_during_difficulty INTEGER, 
  emotional_recovery_pattern TEXT,   
  
  persistence_total_score REAL,      
  
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS mood_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      curriculum_id INTEGER,
      mood TEXT NOT NULL,
      arousal INTEGER DEFAULT 50,
      valence INTEGER DEFAULT 50,
      note TEXT DEFAULT '',
      affect_state TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  `CREATE TABLE IF NOT EXISTS spaced_review_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, card_id INTEGER NOT NULL,
      course_id INTEGER, review_count INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 1, next_review_date TEXT NOT NULL, last_review_date TEXT,
      status TEXT DEFAULT 'pending', source TEXT DEFAULT 'auto_incorrect',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(student_id, card_id)
    )`,
  `CREATE TABLE IF NOT EXISTS test_performance_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  score INTEGER,
  max_score INTEGER DEFAULT 100,
  weakness_areas TEXT DEFAULT '[]',
  strength_areas TEXT DEFAULT '[]',
  ai_recommendations TEXT DEFAULT '[]',
  reflection TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id) ON DELETE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS hourly_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  plan_row_id INTEGER NOT NULL,      
  student_id INTEGER NOT NULL,
  hour_number INTEGER NOT NULL,
  
  content_learned TEXT,              
  method_reflection TEXT,            
  next_application TEXT,             
  
  learned_with_friend INTEGER DEFAULT 0,  
  friend_names TEXT,                 
  friend_interaction TEXT,           
  friend_interaction_type TEXT,      
  
  confidence_rating INTEGER DEFAULT 3, 
  
  reflection_quality_level INTEGER,  
  ai_feedback TEXT,                  
  ai_theory_references TEXT,         
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  topic TEXT,
  question_type TEXT,
  ai_model TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_used INTEGER,
  response_time_ms INTEGER,
  has_attachment INTEGER DEFAULT 0,
  attachment_url TEXT,
  is_helpful INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS test_study_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  study_minutes INTEGER DEFAULT 0,
  confidence_before INTEGER DEFAULT 3 CHECK(confidence_before BETWEEN 1 AND 5),
  confidence_after INTEGER CHECK(confidence_after BETWEEN 1 AND 5),
  understanding_level INTEGER CHECK(understanding_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, focus_level INTEGER, fatigue_level INTEGER,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id) ON DELETE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS video_recordings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,
  hour_number INTEGER,
  
  r2_key TEXT NOT NULL,               
  file_size_bytes INTEGER,            
  duration_seconds INTEGER,           
  
  resolution TEXT DEFAULT '480p',     
  has_audio INTEGER DEFAULT 1,        
  has_video INTEGER DEFAULT 1,        
  mime_type TEXT DEFAULT 'video/webm',
  
  persistence_metric_id INTEGER,      
  
  status TEXT DEFAULT 'recording',    
  upload_completed_at DATETIME,
  
  ai_analysis_json TEXT,              
  analyzed_at DATETIME,
  
  expires_at DATETIME,                
  deleted_at DATETIME,
  
  recording_trigger TEXT DEFAULT 'card_start', 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  title TEXT,
  subject TEXT,
  grade TEXT,
  message_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
)`,
  `CREATE TABLE IF NOT EXISTS unit_study_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  unit_id INTEGER,              
  unit_name TEXT NOT NULL,      
  grade TEXT,
  subject TEXT,
  course_type TEXT DEFAULT 'steady',  
  total_hours INTEGER DEFAULT 8,      
  total_cards INTEGER DEFAULT 6,      
  total_check_tests INTEGER DEFAULT 1,
  total_selection_tasks INTEGER DEFAULT 6, 
  selection_task_names TEXT,    
  unit_goal TEXT,               
  personal_goal TEXT,           
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
, subject2 TEXT DEFAULT '', unit_name2 TEXT DEFAULT '', total_hours2 INTEGER DEFAULT 0)`,
  `CREATE TABLE IF NOT EXISTS bookmarked_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      card_id INTEGER,
      image_url TEXT NOT NULL,
      image_type TEXT DEFAULT 'nb2_illustration',
      title TEXT,
      description TEXT,
      page_num INTEGER,
      is_favorite INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  `CREATE TABLE IF NOT EXISTS collaboration_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  hour_number INTEGER,
  partner_name TEXT,                  
  partner_student_id INTEGER,        
  interaction_type TEXT NOT NULL,     
  topic TEXT,                         
  description TEXT,                   
  helpfulness_rating INTEGER,        
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS notification_history (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL,        
  student_id INTEGER,                   
  
  
  notification_type TEXT NOT NULL,      
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,                           
  
  
  delivery_method TEXT NOT NULL,       
  
  
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  is_sent INTEGER DEFAULT 0,           
  sent_at DATETIME,
  
  
  priority TEXT DEFAULT 'normal',      
  
  
  action_url TEXT,                     
  
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,                 
  
  FOREIGN KEY (recipient_id) REFERENCES users(user_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS teacher_comments (
  comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'general', 
  target_type TEXT, 
  target_id INTEGER, 
  subject TEXT, 
  unit_name TEXT, 
  comment_text TEXT NOT NULL,
  sentiment TEXT DEFAULT 'positive', 
  is_read INTEGER DEFAULT 0, 
  read_at DATETIME, 
  is_pinned INTEGER DEFAULT 0, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS ai_tutor_conversations (
  conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  subject TEXT,
  unit_name TEXT,
  ai_source TEXT NOT NULL CHECK(ai_source IN ('workers-ai', 'huggingface', 'rule-based')),
  confidence REAL NOT NULL DEFAULT 0.0,
  feedback_rating INTEGER CHECK(feedback_rating BETWEEN 1 AND 5),
  feedback_comment TEXT,
  school_id INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS comment_reactions (
  reaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like', 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES teacher_comments(comment_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  UNIQUE(comment_id, student_id) 
)`,
  `CREATE TABLE IF NOT EXISTS metacognition_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,
  phase TEXT NOT NULL CHECK(phase IN ('pre_study','during_study','post_study')),
  planned_topics TEXT DEFAULT '[]',
  confidence_level INTEGER DEFAULT 3 CHECK(confidence_level BETWEEN 1 AND 5),
  difficulty_encountered INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  understanding_level INTEGER CHECK(understanding_level BETWEEN 1 AND 5),
  needs_review INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES test_preparation_plans(id) ON DELETE SET NULL
)`,
  `CREATE TABLE IF NOT EXISTS performance_metrics (
  metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL, 
  endpoint TEXT,
  response_time_ms INTEGER,
  status_code INTEGER,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS security_audit_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS skill_portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  unit_name TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  
  metacognition_score REAL,          
  planning_score REAL,               
  self_regulation_score REAL,        
  method_diversity_score REAL,       
  collaboration_score REAL,          
  persistence_score REAL,            
  autonomy_score REAL,               
  reflection_quality_avg REAL,       
  
  previous_portfolio_id INTEGER,     
  growth_summary TEXT,               
  
  ai_summary TEXT,
  
  teacher_comment TEXT,
  
  snapshot_date DATE DEFAULT (date('now')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_progress_comparison (
  comparison_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  class_code TEXT NOT NULL,
  comparison_date DATE NOT NULL,
  
  
  total_problems INTEGER DEFAULT 0,
  accuracy_rate REAL DEFAULT 0,
  study_minutes INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0,
  
  
  class_rank INTEGER,
  class_percentile REAL,
  
  
  grade_rank INTEGER,
  grade_percentile REAL,
  
  
  vs_class_avg_accuracy REAL, 
  vs_class_avg_problems REAL,
  vs_class_avg_minutes REAL,
  
  
  subject_ranks TEXT, 
  
  
  mastery_level TEXT DEFAULT 'intermediate', 
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  UNIQUE(student_id, comparison_date)
)`,
  `CREATE TABLE IF NOT EXISTS teacher_bars_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  plan_id INTEGER,                    
  hour_number INTEGER,                
  
  
  continuity_rating INTEGER NOT NULL CHECK(continuity_rating BETWEEN 1 AND 5),
  challenge_rating INTEGER NOT NULL CHECK(challenge_rating BETWEEN 1 AND 5),
  recovery_rating INTEGER NOT NULL CHECK(recovery_rating BETWEEN 1 AND 5),
  deepening_rating INTEGER NOT NULL CHECK(deepening_rating BETWEEN 1 AND 5),
  emotional_stability_rating INTEGER NOT NULL CHECK(emotional_stability_rating BETWEEN 1 AND 5),
  
  continuity_evidence TEXT,
  challenge_evidence TEXT,
  recovery_evidence TEXT,
  deepening_evidence TEXT,
  emotional_stability_evidence TEXT,
  
  overall_comment TEXT,
  
  video_referenced INTEGER DEFAULT 0, 
  video_recording_id INTEGER,         
  
  rating_context TEXT,                
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS validation_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_type TEXT NOT NULL,            
  dimension TEXT,                     
  
  value REAL NOT NULL,
  confidence_interval_low REAL,
  confidence_interval_high REAL,
  sample_size INTEGER NOT NULL,
  
  parameters_json TEXT,               
  
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME                
)`,
  `CREATE TABLE IF NOT EXISTS assistant_personalities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  tone TEXT DEFAULT 'friendly',
  emoji_usage INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0
)`,
  `CREATE TABLE IF NOT EXISTS class_statistics (
  stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  class_code TEXT NOT NULL,
  grade TEXT NOT NULL,
  stat_date DATE NOT NULL,
  stat_period TEXT NOT NULL DEFAULT 'daily', 
  
  
  total_students INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  inactive_students INTEGER DEFAULT 0,
  
  
  total_problems_solved INTEGER DEFAULT 0,
  avg_problems_per_student REAL DEFAULT 0,
  total_study_minutes INTEGER DEFAULT 0,
  avg_study_minutes_per_student REAL DEFAULT 0,
  
  
  overall_accuracy REAL DEFAULT 0,
  accuracy_std_dev REAL DEFAULT 0,
  median_accuracy REAL DEFAULT 0,
  
  
  subject_stats TEXT, 
  
  
  mastery_distribution TEXT, 
  
  
  top_performers TEXT, 
  most_improved TEXT,  
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(class_code, stat_date, stat_period)
)`,
  `CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL,
  creator_student_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  max_participants INTEGER DEFAULT 10,
  status TEXT DEFAULT 'waiting',
  start_time DATETIME,
  end_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS comment_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER, 
  template_name TEXT NOT NULL,
  template_category TEXT DEFAULT 'encouragement', 
  template_text TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS error_logs (
  error_id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL, 
  error_message TEXT,
  stack_trace TEXT,
  endpoint TEXT,
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'error', 
  resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS notification_settings (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'parent', 
  
  
  learning_start INTEGER DEFAULT 1,      
  learning_end INTEGER DEFAULT 1,        
  achievement INTEGER DEFAULT 1,         
  badge_earned INTEGER DEFAULT 1,        
  weakness_found INTEGER DEFAULT 1,      
  milestone_reached INTEGER DEFAULT 1,   
  weekly_summary INTEGER DEFAULT 1,      
  monthly_summary INTEGER DEFAULT 1,     
  
  
  in_app_notification INTEGER DEFAULT 1,  
  email_notification INTEGER DEFAULT 1,   
  push_notification INTEGER DEFAULT 0,    
  
  
  quiet_hours_start TIME,                
  quiet_hours_end TIME,                  
  
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS recording_consent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  parent_name TEXT,
  consent_given INTEGER DEFAULT 0,    
  consent_date DATETIME,
  consent_method TEXT,                
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS teacher_feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  
  
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  
  
  feedback_type TEXT NOT NULL, 
  comment_text TEXT NOT NULL,
  
  
  related_subject TEXT,
  related_unit TEXT,
  related_problem_id INTEGER,
  related_session_id INTEGER,
  
  
  is_visible_to_student INTEGER DEFAULT 1,
  is_visible_to_parent INTEGER DEFAULT 1,
  is_private_note INTEGER DEFAULT 0, 
  
  
  tags TEXT, 
  
  
  priority TEXT DEFAULT 'normal', 
  requires_followup INTEGER DEFAULT 0,
  followup_deadline DATE,
  
  
  status TEXT DEFAULT 'active', 
  resolved_at DATETIME,
  resolved_by INTEGER,
  
  
  read_by_student_at DATETIME,
  read_by_parent_at DATETIME,
  
  
  attachment_url TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (teacher_id) REFERENCES users(user_id),
  FOREIGN KEY (resolved_by) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS weekly_summaries (
  summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  parent_id INTEGER,
  
  
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  
  
  total_study_time INTEGER DEFAULT 0,      
  total_problems_solved INTEGER DEFAULT 0, 
  correct_rate REAL DEFAULT 0,            
  streak_days INTEGER DEFAULT 0,          
  
  
  subject_stats TEXT,                     
  
  
  badges_earned INTEGER DEFAULT 0,
  achievements TEXT,                      
  
  
  weak_areas TEXT,                       
  improvement_areas TEXT,                
  
  
  ai_recommendations TEXT,               
  
  
  is_sent INTEGER DEFAULT 0,
  sent_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (parent_id) REFERENCES users(user_id),
  UNIQUE(student_id, year, week_number)
)`,
  `CREATE TABLE IF NOT EXISTS assistant_faq (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS export_history (
  export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  exported_by INTEGER NOT NULL,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL,
  date_from DATE,
  date_to DATE,
  grade TEXT,
  class_code TEXT,
  subjects TEXT,
  is_anonymized INTEGER DEFAULT 0,
  anonymization_level TEXT,
  record_count INTEGER DEFAULT 0,
  file_size INTEGER DEFAULT 0,
  file_url TEXT,
  purpose TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (exported_by) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS metacognition_self_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        card_id INTEGER,
        card_page INTEGER,
        error_reason TEXT NOT NULL,
        consecutive_errors INTEGER DEFAULT 0,
        scaffold_level REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
  `CREATE TABLE IF NOT EXISTS personalized_course_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        curriculum_id INTEGER,
        student_id INTEGER,
        analysis_summary TEXT DEFAULT '',
        recommended_approach TEXT DEFAULT '',
        archetype_id TEXT DEFAULT '',
        archetype_name TEXT DEFAULT '',
        v4_axes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
  `CREATE TABLE IF NOT EXISTS recording_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER,
  teacher_id INTEGER NOT NULL,
  
  auto_record_on_card_start INTEGER DEFAULT 1, 
  max_duration_seconds INTEGER DEFAULT 600,    
  resolution TEXT DEFAULT '480p',
  record_audio INTEGER DEFAULT 1,
  record_video INTEGER DEFAULT 1,
  
  record_frequency TEXT DEFAULT 'every_time',  
  
  retention_days INTEGER DEFAULT 60,
  
  parental_consent_required INTEGER DEFAULT 1,
  consent_form_sent INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS session_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  is_active INTEGER DEFAULT 1,
  UNIQUE(session_id, student_id)
)`,
  `CREATE TABLE IF NOT EXISTS session_reflections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        reflection_level TEXT NOT NULL,
        total_answered INTEGER DEFAULT 0,
        total_correct INTEGER DEFAULT 0,
        scaffold_level REAL DEFAULT 1.0,
        card_page INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
  `CREATE TABLE IF NOT EXISTS student_assistant_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  personality_id INTEGER DEFAULT 1,
  preferred_language TEXT DEFAULT 'ja',
  help_level TEXT DEFAULT 'medium',
  motivation_frequency TEXT DEFAULT 'normal',
  UNIQUE(student_id)
)`,
  `CREATE TABLE IF NOT EXISTS system_health_checks (
  check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_type TEXT NOT NULL, 
  status TEXT NOT NULL, 
  response_time_ms INTEGER,
  details TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS voice_recognition_settings (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  
  is_enabled INTEGER DEFAULT 1,
  auto_start_recognition INTEGER DEFAULT 0,
  continuous_recognition INTEGER DEFAULT 0,
  
  
  recognition_language TEXT DEFAULT 'ja-JP',
  alternate_languages TEXT, 
  
  
  voice_feedback_enabled INTEGER DEFAULT 1, 
  voice_speed REAL DEFAULT 1.0, 
  voice_pitch REAL DEFAULT 1.0,
  
  
  filter_inappropriate_content INTEGER DEFAULT 1,
  profanity_filter INTEGER DEFAULT 1,
  
  
  show_waveform INTEGER DEFAULT 1,
  show_transcription INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS anonymization_mapping (
  mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id INTEGER NOT NULL,
  original_student_id INTEGER NOT NULL,
  anonymous_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (export_id) REFERENCES export_history(export_id) ON DELETE CASCADE,
  FOREIGN KEY (original_student_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS chat_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question_category TEXT NOT NULL,
  sentiment TEXT,
  response_helpful INTEGER,
  session_date DATE DEFAULT (date('now'))
)`,
  `CREATE TABLE IF NOT EXISTS chat_feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  rating INTEGER,
  feedback_type TEXT,
  feedback_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS chat_quick_replies (
  reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  grade TEXT,
  category TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS chat_statistics (
  stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER,
  stat_date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  messages_by_subject TEXT,
  avg_response_time_ms REAL,
  helpful_rate REAL,
  total_tokens_used INTEGER,
  peak_hour INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, stat_date)
)`,
  `CREATE TABLE IF NOT EXISTS class_heatmap_data (
  heatmap_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  class_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  unit TEXT NOT NULL,
  stat_date DATE NOT NULL,
  
  
  
  
  student_scores TEXT NOT NULL,
  
  
  avg_score REAL DEFAULT 0,
  min_score REAL DEFAULT 0,
  max_score REAL DEFAULT 0,
  std_dev REAL DEFAULT 0,
  
  
  difficulty_level TEXT DEFAULT 'standard',
  total_problems INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(class_code, subject, unit, stat_date)
)`,
  `CREATE TABLE IF NOT EXISTS comment_statistics (
  stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER NOT NULL,
  stat_date DATE NOT NULL,
  total_comments INTEGER DEFAULT 0,
  comments_by_type TEXT, 
  comments_by_sentiment TEXT, 
  avg_response_time_minutes REAL, 
  student_read_rate REAL, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id),
  UNIQUE(teacher_id, stat_date)
)`,
  `CREATE TABLE IF NOT EXISTS feedback_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER,
  
  
  template_name TEXT NOT NULL,
  category TEXT NOT NULL, 
  
  
  template_text TEXT NOT NULL, 
  
  
  applicable_subjects TEXT, 
  applicable_grades TEXT,
  
  
  usage_count INTEGER DEFAULT 0,
  last_used_at DATETIME,
  
  
  is_public INTEGER DEFAULT 0, 
  is_active INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS student_profile_integrated (
  student_id INTEGER NOT NULL,
  assessment_date DATE NOT NULL,
  
  
  
  knowledge_skill_level INTEGER CHECK(knowledge_skill_level BETWEEN 1 AND 5),
  thinking_expression_level INTEGER CHECK(thinking_expression_level BETWEEN 1 AND 5),
  learning_attitude_level INTEGER CHECK(learning_attitude_level BETWEEN 1 AND 5),
  
  
  
  metacognition_level INTEGER CHECK(metacognition_level BETWEEN 1 AND 5),
  learning_strategy_level INTEGER CHECK(learning_strategy_level BETWEEN 1 AND 5),
  goal_setting_level INTEGER CHECK(goal_setting_level BETWEEN 1 AND 5),
  
  
  dialogue_level INTEGER CHECK(dialogue_level BETWEEN 1 AND 5),
  collaboration_level INTEGER CHECK(collaboration_level BETWEEN 1 AND 5),
  
  
  social_perspective_level INTEGER CHECK(social_perspective_level BETWEEN 1 AND 5),
  
  
  linguistic_intelligence INTEGER CHECK(linguistic_intelligence BETWEEN 1 AND 10),
  logical_mathematical_intelligence INTEGER CHECK(logical_mathematical_intelligence BETWEEN 1 AND 10),
  spatial_intelligence INTEGER CHECK(spatial_intelligence BETWEEN 1 AND 10),
  bodily_kinesthetic_intelligence INTEGER CHECK(bodily_kinesthetic_intelligence BETWEEN 1 AND 10),
  musical_intelligence INTEGER CHECK(musical_intelligence BETWEEN 1 AND 10),
  interpersonal_intelligence INTEGER CHECK(interpersonal_intelligence BETWEEN 1 AND 10),
  intrapersonal_intelligence INTEGER CHECK(intrapersonal_intelligence BETWEEN 1 AND 10),
  naturalistic_intelligence INTEGER CHECK(naturalistic_intelligence BETWEEN 1 AND 10),
  
  
  
  dominant_intelligences TEXT,
  
  
  overall_profile_summary TEXT,
  
  
  learning_advice TEXT,
  
  
  
  confidence_score REAL CHECK(confidence_score BETWEEN 0.0 AND 1.0),
  
  
  data_source TEXT CHECK(data_source IN ('initial_diagnosis', 'monthly_update', 'unit_review', 'semester_review')),
  
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (student_id, assessment_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
)`,
  `CREATE TABLE IF NOT EXISTS voice_commands (
  command_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  
  
  command_name TEXT NOT NULL,
  command_patterns TEXT NOT NULL, 
  
  
  action_type TEXT NOT NULL, 
  action_target TEXT NOT NULL, 
  
  
  applicable_pages TEXT, 
  
  
  description TEXT,
  example_usage TEXT,
  
  
  usage_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(school_id, command_name)
)`,
  `CREATE TABLE IF NOT EXISTS voice_input_history (
  voice_input_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  
  
  input_type TEXT NOT NULL, 
  input_context TEXT, 
  
  
  audio_url TEXT, 
  audio_duration_ms INTEGER,
  
  
  recognized_text TEXT NOT NULL,
  confidence_score REAL, 
  language TEXT DEFAULT 'ja-JP',
  
  
  processed_result TEXT, 
  was_successful INTEGER DEFAULT 1,
  error_message TEXT,
  
  
  device_type TEXT,
  browser_type TEXT,
  
  
  response_time_ms INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id)
)`,
  `CREATE TABLE IF NOT EXISTS voice_recognition_errors (
  error_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER,
  voice_input_id INTEGER,
  
  
  error_type TEXT NOT NULL, 
  error_code TEXT,
  error_message TEXT,
  
  
  browser_type TEXT,
  device_type TEXT,
  os_type TEXT,
  
  
  attempted_language TEXT,
  audio_duration_ms INTEGER,
  
  
  stack_trace TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (voice_input_id) REFERENCES voice_input_history(voice_input_id)
)`,
]

const SCHEMA_SYNC_ALTERS: string[] = [
  `ALTER TABLE card_review_logs ADD COLUMN next_review_date DATE`,
  `ALTER TABLE card_review_logs ADD COLUMN review_result TEXT`,
  `ALTER TABLE card_review_logs ADD COLUMN reviewed_at DATETIME`,
  `ALTER TABLE card_review_logs ADD COLUMN school_id INTEGER`,
  `ALTER TABLE evaluations ADD COLUMN comments TEXT`,
  `ALTER TABLE evaluations ADD COLUMN evaluated_at DATETIME`,
  `ALTER TABLE evaluations ADD COLUMN evaluation_type TEXT`,
  `ALTER TABLE evaluations ADD COLUMN max_score REAL`,
  `ALTER TABLE evaluations ADD COLUMN school_id INTEGER`,
  `ALTER TABLE evaluations ADD COLUMN score REAL`,
  `ALTER TABLE evaluations ADD COLUMN subject TEXT`,
  `ALTER TABLE evaluations ADD COLUMN teacher_id INTEGER`,
  `ALTER TABLE learning_sessions ADD COLUMN correct_answers INTEGER`,
  `ALTER TABLE learning_sessions ADD COLUMN duration_seconds INTEGER`,
  `ALTER TABLE learning_sessions ADD COLUMN is_active INTEGER`,
  `ALTER TABLE learning_sessions ADD COLUMN problems_solved INTEGER`,
  `ALTER TABLE learning_sessions ADD COLUMN started_at DATETIME`,
  `ALTER TABLE learning_sessions ADD COLUMN subject TEXT`,
  `ALTER TABLE learning_sessions ADD COLUMN unit_id INTEGER`,
  `ALTER TABLE parent_student_relations ADD COLUMN is_active INTEGER`,
  `ALTER TABLE parent_student_relations ADD COLUMN is_primary INTEGER`,
]

const SCHEMA_SYNC_INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_sca_student ON student_card_answers(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sca_student_curriculum ON student_card_answers(student_id, curriculum_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sca_card ON student_card_answers(card_id)`,
  `CREATE INDEX IF NOT EXISTS idx_initial_diag_student ON initial_diagnostics(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_initial_diag_student_curriculum ON initial_diagnostics(student_id, curriculum_id)`,
  `CREATE INDEX IF NOT EXISTS idx_plan_rows_plan ON study_plan_rows(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_plan_rows_student ON study_plan_rows(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_test_plans_student ON test_preparation_plans(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_test_plans_status ON test_preparation_plans(status)`,
  `CREATE INDEX IF NOT EXISTS idx_persistence_student ON persistence_metrics(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_persistence_plan ON persistence_metrics(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_test_feedback_plan ON test_performance_feedback(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_hourly_ref_plan ON hourly_reflections(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_hourly_ref_student ON hourly_reflections(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_test_study_logs_plan ON test_study_logs(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_test_study_logs_student ON test_study_logs(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_video_student ON video_recordings(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_video_plan ON video_recordings(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_video_status ON video_recordings(status)`,
  `CREATE INDEX IF NOT EXISTS idx_video_expires ON video_recordings(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_video_r2key ON video_recordings(r2_key)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_conversations_student ON chat_conversations(student_id, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_unit_plans_student ON unit_study_plans(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_unit_plans_status ON unit_study_plans(status)`,
  `CREATE INDEX IF NOT EXISTS idx_collab_student ON collaboration_records(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_collab_plan ON collaboration_records(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_notification_history_student ON notification_history(student_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON notification_history(recipient_id, is_read, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_comments_student ON teacher_comments(student_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_comments_teacher ON teacher_comments(teacher_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_comments_target ON teacher_comments(target_type, target_id)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_comments_unread ON teacher_comments(student_id, is_read, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_tutor_student_id ON ai_tutor_conversations(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_tutor_created_at ON ai_tutor_conversations(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_tutor_subject ON ai_tutor_conversations(subject)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_tutor_school_id ON ai_tutor_conversations(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comment_reactions_student ON comment_reactions(student_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_metacognition_student ON metacognition_logs(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_metacognition_plan ON metacognition_logs(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type)`,
  `CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint)`,
  `CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_performance_metrics_school_id ON performance_metrics(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_security_audit_logs_school_id ON security_audit_logs(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_portfolio_student ON skill_portfolio(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_portfolio_plan ON skill_portfolio(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_progress_comparison_student ON student_progress_comparison(student_id, comparison_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_progress_comparison_class ON student_progress_comparison(class_code, comparison_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_bars_student ON teacher_bars_ratings(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bars_teacher ON teacher_bars_ratings(teacher_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bars_plan ON teacher_bars_ratings(plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_bars_student_plan ON teacher_bars_ratings(student_id, plan_id)`,
  `CREATE INDEX IF NOT EXISTS idx_validation_type ON validation_statistics(stat_type)`,
  `CREATE INDEX IF NOT EXISTS idx_class_stats_class_date ON class_statistics(class_code, stat_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_class_stats_grade_date ON class_statistics(grade, stat_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_comment_templates_teacher ON comment_templates(teacher_id, template_category)`,
  `CREATE INDEX IF NOT EXISTS idx_comment_templates_usage ON comment_templates(usage_count DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type)`,
  `CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity)`,
  `CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved)`,
  `CREATE INDEX IF NOT EXISTS idx_error_logs_school_id ON error_logs(school_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_consent_student ON recording_consent(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_feedback_student ON teacher_feedback(student_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_feedback_teacher ON teacher_feedback(teacher_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_feedback_status ON teacher_feedback(status, priority, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_teacher_feedback_followup ON teacher_feedback(requires_followup, followup_deadline)`,
  `CREATE INDEX IF NOT EXISTS idx_weekly_summaries_student ON weekly_summaries(student_id, year DESC, week_number DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_weekly_summaries_parent ON weekly_summaries(parent_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_export_history_school ON export_history(school_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(exported_by, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_system_health_checks_type ON system_health_checks(check_type)`,
  `CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status)`,
  `CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON system_health_checks(checked_at)`,
  `CREATE INDEX IF NOT EXISTS idx_anonymization_mapping_export ON anonymization_mapping(export_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_feedback_message ON chat_feedback(message_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_quick_replies_subject ON chat_quick_replies(subject, grade, display_order)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_statistics_student_date ON chat_statistics(student_id, stat_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_heatmap_class_subject ON class_heatmap_data(class_code, subject, stat_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_comment_statistics_teacher_date ON comment_statistics(teacher_id, stat_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_templates_category ON feedback_templates(category, is_public)`,
  `CREATE INDEX IF NOT EXISTS idx_profile_student_date 
  ON student_profile_integrated(student_id, assessment_date DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_profile_date 
  ON student_profile_integrated(assessment_date)`,
  `CREATE INDEX IF NOT EXISTS idx_profile_data_source 
  ON student_profile_integrated(data_source)`,
  `CREATE INDEX IF NOT EXISTS idx_voice_commands_active ON voice_commands(is_active, action_type)`,
  `CREATE INDEX IF NOT EXISTS idx_voice_input_student ON voice_input_history(student_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_voice_input_type ON voice_input_history(input_type, was_successful)`,
  `CREATE INDEX IF NOT EXISTS idx_voice_errors_type ON voice_recognition_errors(error_type, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_voice_errors_student ON voice_recognition_errors(student_id, created_at DESC)`,
]
// === 第2次同期: 書き込みのある欠損テーブル（migrations/0102） ===
const SCHEMA_SYNC_ROUND2: string[] = [
  `CREATE TABLE IF NOT EXISTS answer_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  card_id INTEGER,
  curriculum_id INTEGER,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  feedback_text TEXT,
  feedback_score REAL,
  time_spent_seconds INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_answer_history_student ON answer_history(student_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_answer_history_curriculum ON answer_history(curriculum_id)`,
  `CREATE INDEX IF NOT EXISTS idx_answer_history_card ON answer_history(card_id)`,
  `CREATE TABLE IF NOT EXISTS generated_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER DEFAULT 1,
  student_id INTEGER,
  curriculum_id INTEGER,
  course_id INTEGER,
  grade TEXT,
  subject TEXT,
  unit_name TEXT,
  textbook_company TEXT,
  problem_type TEXT,
  problem_content TEXT,
  problem_description TEXT,
  question TEXT,
  options TEXT,
  answer TEXT,
  correct_answer TEXT,
  explanation TEXT,
  hints TEXT,
  difficulty TEXT,
  difficulty_level TEXT,
  learning_meaning TEXT,
  theory_aligned INTEGER DEFAULT 0,
  theory_codes TEXT,
  generated_by TEXT,
  generation_params TEXT,
  is_approved INTEGER DEFAULT 0,
  is_attempted INTEGER DEFAULT 0,
  is_correct INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
)`,
  `CREATE INDEX IF NOT EXISTS idx_generated_problems_student ON generated_problems(student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_generated_problems_curriculum ON generated_problems(curriculum_id)`,
  `CREATE TABLE IF NOT EXISTS student_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  student_id INTEGER,
  problem_id INTEGER,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_student_answers_student ON student_answers(student_id)`,
  `CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  learning_card_id INTEGER,
  feature_type TEXT,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_created ON ai_usage_stats(created_at)`,
  `CREATE TABLE IF NOT EXISTS mistake_notebook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  subject TEXT,
  unit_name TEXT,
  original_question TEXT,
  original_answer TEXT,
  student_answer TEXT,
  correct_answer TEXT,
  mistake_type TEXT,
  difficulty TEXT,
  mastery_level INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  next_review_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_mistake_notebook_student ON mistake_notebook(student_id)`,
  `CREATE TABLE IF NOT EXISTS test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  test_id INTEGER,
  test_type TEXT,
  score REAL,
  max_score REAL,
  percentage REAL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_test_results_student ON test_results(student_id)`,
  `CREATE TABLE IF NOT EXISTS peer_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  card_id INTEGER,
  answer_text TEXT,
  approach_type TEXT,
  is_public INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_peer_answers_card ON peer_answers(card_id)`,
  `CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  target_role TEXT,
  recommendation_type TEXT,
  title TEXT,
  description TEXT,
  action_items TEXT,
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_recommendations_student ON recommendations(student_id)`,
  `CREATE TABLE IF NOT EXISTS essay_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  answer_text TEXT,
  answer_length INTEGER DEFAULT 0,
  writing_time INTEGER DEFAULT 0,
  is_submitted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE INDEX IF NOT EXISTS idx_essay_answers_student ON essay_answers(student_id)`,
]

// === 第3次同期: INSERT/UPDATE 文から逆算生成した欠損テーブル（migrations/0103） ===
const SCHEMA_SYNC_ROUND3: string[] = [
  `CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_name TEXT,
  student_id INTEGER,
  variant_name TEXT,
  class_code TEXT,
  assigned_at DATETIME,
  experiment_id INTEGER,
  variant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ab_test_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_name TEXT,
  student_id INTEGER,
  variant_name TEXT,
  event_type TEXT,
  event_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ab_test_experiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  hypothesis TEXT,
  intervention_type TEXT,
  primary_metric TEXT,
  duration_days REAL,
  target_sample_size TEXT,
  status TEXT,
  start_date DATETIME,
  end_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ab_test_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER,
  student_id INTEGER,
  metric_name TEXT,
  metric_value TEXT,
  recorded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ab_test_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER,
  variant_name TEXT,
  description TEXT,
  config_json TEXT,
  allocation_percentage REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ai_feedback_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  problem_id INTEGER,
  is_correct INTEGER DEFAULT 0,
  score TEXT,
  feedback_text TEXT,
  suggestions TEXT,
  explanation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ai_feedback_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  conversation_id INTEGER,
  usage_stat_id INTEGER,
  rating TEXT,
  feedback_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ai_generated_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER,
  course_id INTEGER,
  problem_type TEXT,
  problem_title TEXT,
  problem_content TEXT,
  problem_solution TEXT,
  difficulty_level INTEGER,
  generation_prompt REAL,
  is_approved INTEGER DEFAULT 0,
  approved_by TEXT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ai_personalization_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  action_type TEXT,
  input_theories TEXT,
  theory_scores TEXT,
  recommendation TEXT,
  ai_rationale REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ai_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  prediction_type TEXT,
  prediction_data TEXT,
  confidence_level INTEGER,
  prediction_date DATETIME,
  target_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS assessment_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  item_id INTEGER,
  response_value TEXT,
  response_time_seconds INTEGER,
  session_id INTEGER,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS card_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER,
  student_id INTEGER,
  teacher_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS card_theory_alignment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER,
  theory_code TEXT,
  alignment_strength TEXT,
  design_rationale REAL,
  expected_effect TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS class_comparison (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  comparison_date DATETIME,
  class_ids TEXT,
  metrics_json TEXT,
  insights TEXT,
  recommendations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS cross_school_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_date DATETIME,
  municipality_id INTEGER,
  school_ids TEXT,
  total_students TEXT,
  average_understanding REAL,
  average_completion_time DATETIME,
  average_engagement REAL,
  top_performing_schools TEXT,
  struggling_schools TEXT,
  recommendations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  analysis_type TEXT,
  scope_identifier TEXT,
  total_schools TEXT,
  avg_understanding REAL,
  generated_at DATETIME
)`,
  `CREATE TABLE IF NOT EXISTS cross_subject_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  evaluation_period_start TEXT,
  evaluation_period_end TEXT,
  reading_comprehension TEXT,
  writing_expression TEXT,
  logical_thinking TEXT,
  creative_thinking TEXT,
  problem_solving TEXT,
  persistence_score INTEGER,
  self_regulation_score INTEGER,
  collaboration_score INTEGER,
  curiosity_score INTEGER,
  metacognition_score INTEGER,
  growth_mindset_score INTEGER,
  overall_comment TEXT,
  strengths TEXT,
  areas_for_growth TEXT,
  recommendations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS csrf_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS custom_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  original_learning_card_id INTEGER,
  original_optional_problem_id INTEGER,
  content_type TEXT,
  custom_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS data_sharing_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  shared_with_user_id INTEGER,
  permission_type TEXT,
  granted_by_user_id INTEGER,
  consent_date DATETIME,
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS discrimination_ability_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  session_id INTEGER,
  source_concept TEXT,
  identified_concept TEXT,
  is_correct_identification INTEGER DEFAULT 0,
  response_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS effect_measurement_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_name TEXT,
  test_type TEXT,
  class_code TEXT,
  subject TEXT,
  grade_level INTEGER,
  question_count INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS elaboration_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  concept TEXT,
  prompt_type TEXT,
  student_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS encouragement_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  message_type TEXT,
  message_text TEXT,
  shown TEXT,
  shown_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS error_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  card_id INTEGER,
  error_type TEXT,
  root_cause TEXT,
  severity TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS essay_grading (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answer_id INTEGER,
  student_id INTEGER,
  total_score INTEGER,
  grade_level INTEGER,
  content_score INTEGER,
  logic_score INTEGER,
  grammar_score INTEGER,
  completeness_score INTEGER,
  overall_feedback TEXT,
  content_feedback TEXT,
  logic_feedback TEXT,
  grammar_feedback TEXT,
  improvement_suggestions TEXT,
  strengths TEXT,
  weaknesses TEXT,
  key_concepts_covered TEXT,
  missing_concepts TEXT,
  ai_model TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS handwriting_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  image_url TEXT,
  recognized_text TEXT,
  recognition_confidence REAL,
  stroke_data TEXT,
  is_correct INTEGER DEFAULT 0,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS homework_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  class_id INTEGER,
  assignment_name TEXT,
  description TEXT,
  subject TEXT,
  unit_name TEXT,
  problem_type TEXT,
  difficulty TEXT,
  problem_count INTEGER DEFAULT 0,
  problem_ids TEXT,
  assigned_date DATETIME,
  due_date DATETIME,
  estimated_time DATETIME,
  target_students TEXT,
  is_published INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS interleaved_practice_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  card_id INTEGER,
  problem_order TEXT,
  is_correct INTEGER DEFAULT 0,
  response_time DATETIME,
  identified_concept TEXT,
  confused_concepts TEXT,
  answered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS learning_behavior_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  learning_card_id INTEGER,
  action_type TEXT,
  action_timestamp TEXT,
  session_id INTEGER,
  session_duration REAL,
  page_element TEXT,
  element_type TEXT,
  metadata TEXT,
  current_understanding_level INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS learning_path_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  subject TEXT,
  recommended_units TEXT,
  weak_areas TEXT,
  next_milestone_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS metacognition_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  card_id INTEGER,
  session_id INTEGER,
  predicted_performance TEXT,
  actual_performance TEXT,
  metacognition_gap TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS ml_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  model_type TEXT,
  model_params TEXT,
  training_samples TEXT,
  performance_metrics TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  model_data TEXT,
  training_size TEXT
)`,
  `CREATE TABLE IF NOT EXISTS ml_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  model_type TEXT,
  input_features TEXT,
  prediction_result TEXT,
  confidence_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  prediction_type TEXT,
  current_score INTEGER,
  predicted_score INTEGER,
  time_horizon_days TEXT,
  risk_level INTEGER
)`,
  `CREATE TABLE IF NOT EXISTS ml_training_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  model_type TEXT,
  training_data TEXT,
  performance_before TEXT,
  performance_after TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS monthly_learning_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  month_start_date DATETIME,
  month_end_date DATETIME,
  total_study_time DATETIME,
  cards_mastered TEXT,
  average_accuracy REAL,
  sctn_overall_growth TEXT,
  collaboration_score INTEGER,
  spaced_learning_effectiveness TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS non_cognitive_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  self_regulation TEXT,
  self_regulation_comment TEXT,
  motivation TEXT,
  motivation_comment TEXT,
  collaboration REAL,
  collaboration_comment REAL,
  metacognition TEXT,
  metacognition_comment TEXT,
  creativity TEXT,
  creativity_comment TEXT,
  curiosity TEXT,
  curiosity_comment TEXT,
  self_esteem TEXT,
  self_esteem_comment TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  notification_type TEXT,
  title TEXT,
  message TEXT,
  priority INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  additional_data TEXT
)`,
  `CREATE TABLE IF NOT EXISTS optional_problem_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  optional_problem_id INTEGER,
  curriculum_id INTEGER,
  answer_text TEXT,
  status TEXT,
  attempts_count INTEGER DEFAULT 0,
  understanding_level INTEGER,
  time_spent_minutes INTEGER,
  is_completed INTEGER DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS optional_problem_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  optional_problem_id INTEGER,
  submission_type TEXT,
  file_url TEXT,
  file_name TEXT,
  description TEXT,
  self_evaluation TEXT,
  self_comment TEXT,
  submitted_at DATETIME,
  teacher_comment TEXT,
  teacher_evaluation TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS parent_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  parent_email TEXT,
  notification_type TEXT,
  subject TEXT,
  message TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME
)`,
  `CREATE TABLE IF NOT EXISTS pattern_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  pattern_type TEXT,
  analysis_data TEXT,
  confidence_score INTEGER,
  sample_size TEXT,
  analysis_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS peer_answer_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viewer_id INTEGER,
  answer_id INTEGER,
  view_duration REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS peer_help_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER,
  helper_id INTEGER,
  curriculum_id INTEGER,
  learning_card_id INTEGER,
  message TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME
)`,
  `CREATE TABLE IF NOT EXISTS peer_helpful_marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  answer_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS performance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT,
  method TEXT,
  response_time_ms INTEGER,
  cache_hit TEXT,
  db_queries TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS personalized_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  profile_id INTEGER,
  plan_type TEXT,
  plan_data TEXT,
  status TEXT,
  start_date DATETIME,
  end_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS point_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  points TEXT,
  source TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS realtime_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  class_code TEXT,
  session_id INTEGER,
  connection_status TEXT,
  disconnected_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS reflection_level_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  plan_id INTEGER,
  hour_number TEXT,
  reflection_id INTEGER,
  solo_level INTEGER,
  solo_total_score INTEGER,
  score_specificity TEXT,
  score_causality TEXT,
  score_others TEXT,
  score_metacognition TEXT,
  score_planning TEXT,
  score_cross_subject TEXT,
  score_transfer TEXT,
  ai_level_feedback TEXT,
  ai_upgrade_suggestion TEXT,
  subject TEXT,
  unit_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS reinforcement_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  weak_unit_id INTEGER,
  root_causes TEXT,
  actions TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS research_datasets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dataset_name TEXT,
  researcher_id INTEGER,
  description TEXT,
  data_collection_start TEXT,
  data_collection_end TEXT,
  schools_included TEXT,
  anonymization_level INTEGER,
  export_format TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS research_publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  authors TEXT,
  publication_type TEXT,
  publication_venue TEXT,
  abstract TEXT,
  keywords TEXT,
  sample_size TEXT,
  key_findings TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER,
  student_id INTEGER,
  quality TEXT,
  easiness_factor TEXT,
  interval TEXT,
  review_date DATETIME,
  mistake_id INTEGER,
  review_type TEXT,
  is_correct INTEGER DEFAULT 0,
  confidence_level INTEGER,
  time_spent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS rl_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  agent_type TEXT,
  state_space_dim TEXT,
  action_space_dim TEXT,
  q_table TEXT,
  total_episodes TEXT,
  average_reward REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS similar_problems_generated (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mistake_id INTEGER,
  student_id INTEGER,
  generated_problem_id INTEGER,
  generation_method REAL,
  similarity_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS spaced_learning_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  card_id INTEGER,
  learning_stage TEXT,
  leitner_box TEXT,
  mastery_level INTEGER,
  study_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  next_review_date DATETIME,
  review_interval_days TEXT,
  easiness_factor TEXT,
  repetition_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_result TEXT,
  last_studied_at DATETIME,
  srl_foresight_score INTEGER,
  srl_performance_score INTEGER,
  srl_reflection_score INTEGER
)`,
  `CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER,
  student_id INTEGER,
  content_type TEXT,
  content_id INTEGER,
  content_title TEXT,
  easiness_factor TEXT,
  interval TEXT,
  repetitions TEXT,
  next_review_date DATETIME,
  last_review_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_learning_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  learning_style TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_learning_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  overall_level INTEGER,
  avg_correct_rate REAL,
  avg_answer_time DATETIME,
  preferred_difficulty TEXT,
  weak_areas TEXT,
  strong_areas TEXT,
  hint_dependency_score INTEGER,
  total_problems_solved TEXT,
  last_updated TEXT,
  stats_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  total_points TEXT,
  current_level INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  level_up_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  reflection_date DATETIME,
  reflection_type TEXT,
  what_learned TEXT,
  what_understood TEXT,
  what_difficult TEXT,
  what_enjoyed TEXT,
  next_goals TEXT,
  mood_rating TEXT,
  effort_rating TEXT,
  understanding_rating TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_theory_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  theory_code TEXT,
  dimension TEXT,
  score TEXT,
  confidence REAL,
  sample_size TEXT,
  last_assessed TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS student_theory_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS teacher_customization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER,
  teacher_id INTEGER,
  teaching_philosophy TEXT,
  custom_unit_goal TEXT,
  custom_non_cognitive_goal TEXT,
  teaching_notes TEXT,
  gamification_enabled TEXT,
  badge_system_enabled TEXT,
  narrative_enabled TEXT,
  story_theme TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS teacher_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  student_id INTEGER,
  message TEXT,
  priority INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS teacher_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  observation_date DATETIME,
  observation_type TEXT,
  observation_text TEXT,
  context TEXT,
  related_activity TEXT,
  non_cognitive_tags TEXT,
  is_positive INTEGER DEFAULT 0,
  is_shared_with_parents INTEGER DEFAULT 0,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS test_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER,
  student_id INTEGER,
  question_number TEXT,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  points_earned TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS test_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER,
  question_number TEXT,
  question_text TEXT,
  choices TEXT,
  correct_answer TEXT,
  points TEXT,
  difficulty TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS text_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  text_input TEXT,
  analysis_type TEXT,
  analysis_result TEXT,
  confidence_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS theory_mastery_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  theory_code TEXT,
  score TEXT,
  confidence REAL,
  last_updated TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS theory_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  theory_code TEXT,
  old_score INTEGER,
  new_score INTEGER,
  change_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS three_point_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  knowledge_skill TEXT,
  knowledge_skill_comment TEXT,
  thinking_judgment TEXT,
  thinking_judgment_comment TEXT,
  attitude TEXT,
  attitude_comment TEXT,
  overall_comment TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS time_series_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  understanding_level INTEGER,
  completion_time DATETIME,
  engagement_score INTEGER,
  hint_count INTEGER DEFAULT 0,
  emotion_state TEXT,
  session_context TEXT,
  timestamp TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS truancy_support_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  support_type TEXT,
  progress_notes TEXT,
  support_coordinator_id INTEGER,
  engagement_level INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  badge_key TEXT,
  progress TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  email TEXT,
  message TEXT,
  user_id INTEGER,
  user_name TEXT,
  user_role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS voice_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  audio_url TEXT,
  transcription TEXT,
  transcription_confidence REAL,
  language TEXT,
  duration_seconds INTEGER,
  emotion_detected TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS weekly_learning_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  week_start_date DATETIME,
  week_end_date DATETIME,
  total_study_time DATETIME,
  cards_reviewed TEXT,
  average_accuracy REAL,
  sctn_metacognition_score INTEGER,
  sctn_self_regulation_score INTEGER,
  spaced_learning_reviews TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`,
]

export { SCHEMA_SYNC_CREATES, SCHEMA_SYNC_ALTERS, SCHEMA_SYNC_INDEXES, SCHEMA_SYNC_ROUND2, SCHEMA_SYNC_ROUND3 }
