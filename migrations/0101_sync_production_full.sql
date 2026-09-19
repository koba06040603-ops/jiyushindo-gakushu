-- ============================================================
-- 本番DBスキーマの全面同期（2026-09-19）
-- ------------------------------------------------------------
-- 本番106テーブル / ローカル194テーブルと大きく乖離しており、
-- コードが参照する59テーブルが本番に存在しなかった。
-- これが「データの読み込みに失敗しました」系エラーの温床。
--
-- 本ファイルはローカルDBの実定義から生成。全て IF NOT EXISTS / 冪等。
--
-- 注意: answers / hint_cards / optional_problems / users 系は
--       本番とローカルで「意味そのもの」が異なるため列追加しない。
--       これらはアプリ側のスキーマ互換レイヤーで吸収している。
-- ============================================================


-- === 1. 不足テーブルの作成 ===

-- learning_logs
CREATE TABLE IF NOT EXISTS learning_logs (
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
);

-- student_card_answers
CREATE TABLE IF NOT EXISTS student_card_answers (
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
);

-- initial_diagnostics
CREATE TABLE IF NOT EXISTS initial_diagnostics (
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
);

-- study_plan_rows
CREATE TABLE IF NOT EXISTS study_plan_rows (
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
);

-- test_preparation_plans
CREATE TABLE IF NOT EXISTS test_preparation_plans (
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
, all_topics TEXT, ai_schedule TEXT, daily_minutes INTEGER DEFAULT 30);

-- persistence_metrics
CREATE TABLE IF NOT EXISTS persistence_metrics (
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
);

-- mood_checkins
CREATE TABLE IF NOT EXISTS mood_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      curriculum_id INTEGER,
      mood TEXT NOT NULL,
      arousal INTEGER DEFAULT 50,
      valence INTEGER DEFAULT 50,
      note TEXT DEFAULT '',
      affect_state TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

-- spaced_review_schedule
CREATE TABLE IF NOT EXISTS spaced_review_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, card_id INTEGER NOT NULL,
      course_id INTEGER, review_count INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 1, next_review_date TEXT NOT NULL, last_review_date TEXT,
      status TEXT DEFAULT 'pending', source TEXT DEFAULT 'auto_incorrect',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(student_id, card_id)
    );

-- test_performance_feedback
CREATE TABLE IF NOT EXISTS test_performance_feedback (
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
);

-- hourly_reflections
CREATE TABLE IF NOT EXISTS hourly_reflections (
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
);

-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
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
);

-- test_study_logs
CREATE TABLE IF NOT EXISTS test_study_logs (
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
);

-- video_recordings
CREATE TABLE IF NOT EXISTS video_recordings (
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
);

-- chat_conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
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
);

-- unit_study_plans
CREATE TABLE IF NOT EXISTS unit_study_plans (
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
, subject2 TEXT DEFAULT '', unit_name2 TEXT DEFAULT '', total_hours2 INTEGER DEFAULT 0);

-- bookmarked_images
CREATE TABLE IF NOT EXISTS bookmarked_images (
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
    );

-- collaboration_records
CREATE TABLE IF NOT EXISTS collaboration_records (
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
);

-- notification_history
CREATE TABLE IF NOT EXISTS notification_history (
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
);

-- teacher_comments
CREATE TABLE IF NOT EXISTS teacher_comments (
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
);

-- ai_tutor_conversations
CREATE TABLE IF NOT EXISTS ai_tutor_conversations (
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
);

-- comment_reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
  reaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like', 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES teacher_comments(comment_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  UNIQUE(comment_id, student_id) 
);

-- metacognition_logs
CREATE TABLE IF NOT EXISTS metacognition_logs (
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
);

-- performance_metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
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
);

-- security_audit_logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  school_id INTEGER DEFAULT 1
);

-- skill_portfolio
CREATE TABLE IF NOT EXISTS skill_portfolio (
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
);

-- student_progress_comparison
CREATE TABLE IF NOT EXISTS student_progress_comparison (
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
);

-- teacher_bars_ratings
CREATE TABLE IF NOT EXISTS teacher_bars_ratings (
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
);

-- validation_statistics
CREATE TABLE IF NOT EXISTS validation_statistics (
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
);

-- assistant_personalities
CREATE TABLE IF NOT EXISTS assistant_personalities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  tone TEXT DEFAULT 'friendly',
  emoji_usage INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0
);

-- class_statistics
CREATE TABLE IF NOT EXISTS class_statistics (
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
);

-- collaborative_sessions
CREATE TABLE IF NOT EXISTS collaborative_sessions (
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
);

-- comment_templates
CREATE TABLE IF NOT EXISTS comment_templates (
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
);

-- error_logs
CREATE TABLE IF NOT EXISTS error_logs (
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
);

-- notification_settings
CREATE TABLE IF NOT EXISTS notification_settings (
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
);

-- recording_consent
CREATE TABLE IF NOT EXISTS recording_consent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  parent_name TEXT,
  consent_given INTEGER DEFAULT 0,    
  consent_date DATETIME,
  consent_method TEXT,                
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- teacher_feedback
CREATE TABLE IF NOT EXISTS teacher_feedback (
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
);

-- weekly_summaries
CREATE TABLE IF NOT EXISTS weekly_summaries (
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
);

-- assistant_faq
CREATE TABLE IF NOT EXISTS assistant_faq (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- export_history
CREATE TABLE IF NOT EXISTS export_history (
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
);

-- metacognition_self_analysis
CREATE TABLE IF NOT EXISTS metacognition_self_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        card_id INTEGER,
        card_page INTEGER,
        error_reason TEXT NOT NULL,
        consecutive_errors INTEGER DEFAULT 0,
        scaffold_level REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

-- personalized_course_metadata
CREATE TABLE IF NOT EXISTS personalized_course_metadata (
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
      );

-- recording_settings
CREATE TABLE IF NOT EXISTS recording_settings (
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
);

-- session_participants
CREATE TABLE IF NOT EXISTS session_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  is_active INTEGER DEFAULT 1,
  UNIQUE(session_id, student_id)
);

-- session_reflections
CREATE TABLE IF NOT EXISTS session_reflections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        reflection_level TEXT NOT NULL,
        total_answered INTEGER DEFAULT 0,
        total_correct INTEGER DEFAULT 0,
        scaffold_level REAL DEFAULT 1.0,
        card_page INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

-- student_assistant_settings
CREATE TABLE IF NOT EXISTS student_assistant_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  personality_id INTEGER DEFAULT 1,
  preferred_language TEXT DEFAULT 'ja',
  help_level TEXT DEFAULT 'medium',
  motivation_frequency TEXT DEFAULT 'normal',
  UNIQUE(student_id)
);

-- system_health_checks
CREATE TABLE IF NOT EXISTS system_health_checks (
  check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_type TEXT NOT NULL, 
  status TEXT NOT NULL, 
  response_time_ms INTEGER,
  details TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- voice_recognition_settings
CREATE TABLE IF NOT EXISTS voice_recognition_settings (
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
);

-- anonymization_mapping
CREATE TABLE IF NOT EXISTS anonymization_mapping (
  mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  export_id INTEGER NOT NULL,
  original_student_id INTEGER NOT NULL,
  anonymous_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (export_id) REFERENCES export_history(export_id) ON DELETE CASCADE,
  FOREIGN KEY (original_student_id) REFERENCES users(user_id)
);

-- chat_analytics
CREATE TABLE IF NOT EXISTS chat_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  question_category TEXT NOT NULL,
  sentiment TEXT,
  response_helpful INTEGER,
  session_date DATE DEFAULT (date('now'))
);

-- chat_feedback
CREATE TABLE IF NOT EXISTS chat_feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  rating INTEGER,
  feedback_type TEXT,
  feedback_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

-- chat_quick_replies
CREATE TABLE IF NOT EXISTS chat_quick_replies (
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
);

-- chat_statistics
CREATE TABLE IF NOT EXISTS chat_statistics (
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
);

-- class_heatmap_data
CREATE TABLE IF NOT EXISTS class_heatmap_data (
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
);

-- comment_statistics
CREATE TABLE IF NOT EXISTS comment_statistics (
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
);

-- feedback_templates
CREATE TABLE IF NOT EXISTS feedback_templates (
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
);

-- student_profile_integrated
CREATE TABLE IF NOT EXISTS student_profile_integrated (
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
);

-- voice_commands
CREATE TABLE IF NOT EXISTS voice_commands (
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
);

-- voice_input_history
CREATE TABLE IF NOT EXISTS voice_input_history (
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
);

-- voice_recognition_errors
CREATE TABLE IF NOT EXISTS voice_recognition_errors (
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
);


-- === 2. 不足カラムの追加（再実行時は duplicate column エラーになるが無視可） ===

ALTER TABLE card_review_logs ADD COLUMN next_review_date DATE;

ALTER TABLE card_review_logs ADD COLUMN review_result TEXT;

ALTER TABLE card_review_logs ADD COLUMN reviewed_at DATETIME;

ALTER TABLE card_review_logs ADD COLUMN school_id INTEGER;

ALTER TABLE evaluations ADD COLUMN comments TEXT;

ALTER TABLE evaluations ADD COLUMN evaluated_at DATETIME;

ALTER TABLE evaluations ADD COLUMN evaluation_type TEXT;

ALTER TABLE evaluations ADD COLUMN max_score REAL;

ALTER TABLE evaluations ADD COLUMN school_id INTEGER;

ALTER TABLE evaluations ADD COLUMN score REAL;

ALTER TABLE evaluations ADD COLUMN subject TEXT;

ALTER TABLE evaluations ADD COLUMN teacher_id INTEGER;

ALTER TABLE learning_sessions ADD COLUMN correct_answers INTEGER;

ALTER TABLE learning_sessions ADD COLUMN duration_seconds INTEGER;

ALTER TABLE learning_sessions ADD COLUMN is_active INTEGER;

ALTER TABLE learning_sessions ADD COLUMN problems_solved INTEGER;

ALTER TABLE learning_sessions ADD COLUMN started_at DATETIME;

ALTER TABLE learning_sessions ADD COLUMN subject TEXT;

ALTER TABLE learning_sessions ADD COLUMN unit_id INTEGER;

ALTER TABLE parent_student_relations ADD COLUMN is_active INTEGER;

ALTER TABLE parent_student_relations ADD COLUMN is_primary INTEGER;


-- === 3. インデックス ===

CREATE INDEX IF NOT EXISTS idx_sca_student ON student_card_answers(student_id);

CREATE INDEX IF NOT EXISTS idx_sca_student_curriculum ON student_card_answers(student_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_sca_card ON student_card_answers(card_id);

CREATE INDEX IF NOT EXISTS idx_initial_diag_student ON initial_diagnostics(student_id);

CREATE INDEX IF NOT EXISTS idx_initial_diag_student_curriculum ON initial_diagnostics(student_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_plan_rows_plan ON study_plan_rows(plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_rows_student ON study_plan_rows(student_id);

CREATE INDEX IF NOT EXISTS idx_test_plans_student ON test_preparation_plans(student_id);

CREATE INDEX IF NOT EXISTS idx_test_plans_status ON test_preparation_plans(status);

CREATE INDEX IF NOT EXISTS idx_persistence_student ON persistence_metrics(student_id);

CREATE INDEX IF NOT EXISTS idx_persistence_plan ON persistence_metrics(plan_id);

CREATE INDEX IF NOT EXISTS idx_test_feedback_plan ON test_performance_feedback(plan_id);

CREATE INDEX IF NOT EXISTS idx_hourly_ref_plan ON hourly_reflections(plan_id);

CREATE INDEX IF NOT EXISTS idx_hourly_ref_student ON hourly_reflections(student_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_test_study_logs_plan ON test_study_logs(plan_id);

CREATE INDEX IF NOT EXISTS idx_test_study_logs_student ON test_study_logs(student_id);

CREATE INDEX IF NOT EXISTS idx_video_student ON video_recordings(student_id);

CREATE INDEX IF NOT EXISTS idx_video_plan ON video_recordings(plan_id);

CREATE INDEX IF NOT EXISTS idx_video_status ON video_recordings(status);

CREATE INDEX IF NOT EXISTS idx_video_expires ON video_recordings(expires_at);

CREATE INDEX IF NOT EXISTS idx_video_r2key ON video_recordings(r2_key);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_student ON chat_conversations(student_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_unit_plans_student ON unit_study_plans(student_id);

CREATE INDEX IF NOT EXISTS idx_unit_plans_status ON unit_study_plans(status);

CREATE INDEX IF NOT EXISTS idx_collab_student ON collaboration_records(student_id);

CREATE INDEX IF NOT EXISTS idx_collab_plan ON collaboration_records(plan_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_student ON notification_history(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON notification_history(recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_comments_student ON teacher_comments(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_comments_teacher ON teacher_comments(teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_comments_target ON teacher_comments(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_teacher_comments_unread ON teacher_comments(student_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_student_id ON ai_tutor_conversations(student_id);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_created_at ON ai_tutor_conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_subject ON ai_tutor_conversations(subject);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_school_id ON ai_tutor_conversations(school_id);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_student ON comment_reactions(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_metacognition_student ON metacognition_logs(student_id);

CREATE INDEX IF NOT EXISTS idx_metacognition_plan ON metacognition_logs(plan_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_school_id ON performance_metrics(school_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON security_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_school_id ON security_audit_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_student ON skill_portfolio(student_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_plan ON skill_portfolio(plan_id);

CREATE INDEX IF NOT EXISTS idx_progress_comparison_student ON student_progress_comparison(student_id, comparison_date DESC);

CREATE INDEX IF NOT EXISTS idx_progress_comparison_class ON student_progress_comparison(class_code, comparison_date DESC);

CREATE INDEX IF NOT EXISTS idx_bars_student ON teacher_bars_ratings(student_id);

CREATE INDEX IF NOT EXISTS idx_bars_teacher ON teacher_bars_ratings(teacher_id);

CREATE INDEX IF NOT EXISTS idx_bars_plan ON teacher_bars_ratings(plan_id);

CREATE INDEX IF NOT EXISTS idx_bars_student_plan ON teacher_bars_ratings(student_id, plan_id);

CREATE INDEX IF NOT EXISTS idx_validation_type ON validation_statistics(stat_type);

CREATE INDEX IF NOT EXISTS idx_class_stats_class_date ON class_statistics(class_code, stat_date DESC);

CREATE INDEX IF NOT EXISTS idx_class_stats_grade_date ON class_statistics(grade, stat_date DESC);

CREATE INDEX IF NOT EXISTS idx_comment_templates_teacher ON comment_templates(teacher_id, template_category);

CREATE INDEX IF NOT EXISTS idx_comment_templates_usage ON comment_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_error_logs_school_id ON error_logs(school_id);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_consent_student ON recording_consent(student_id);

CREATE INDEX IF NOT EXISTS idx_teacher_feedback_student ON teacher_feedback(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_feedback_teacher ON teacher_feedback(teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_feedback_status ON teacher_feedback(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_feedback_followup ON teacher_feedback(requires_followup, followup_deadline);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_student ON weekly_summaries(student_id, year DESC, week_number DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_parent ON weekly_summaries(parent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_history_school ON export_history(school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_history_user ON export_history(exported_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_type ON system_health_checks(check_type);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON system_health_checks(checked_at);

CREATE INDEX IF NOT EXISTS idx_anonymization_mapping_export ON anonymization_mapping(export_id);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_message ON chat_feedback(message_id);

CREATE INDEX IF NOT EXISTS idx_chat_quick_replies_subject ON chat_quick_replies(subject, grade, display_order);

CREATE INDEX IF NOT EXISTS idx_chat_statistics_student_date ON chat_statistics(student_id, stat_date DESC);

CREATE INDEX IF NOT EXISTS idx_heatmap_class_subject ON class_heatmap_data(class_code, subject, stat_date DESC);

CREATE INDEX IF NOT EXISTS idx_comment_statistics_teacher_date ON comment_statistics(teacher_id, stat_date DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_templates_category ON feedback_templates(category, is_public);

CREATE INDEX IF NOT EXISTS idx_profile_student_date 
  ON student_profile_integrated(student_id, assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_profile_date 
  ON student_profile_integrated(assessment_date);

CREATE INDEX IF NOT EXISTS idx_profile_data_source 
  ON student_profile_integrated(data_source);

CREATE INDEX IF NOT EXISTS idx_voice_commands_active ON voice_commands(is_active, action_type);

CREATE INDEX IF NOT EXISTS idx_voice_input_student ON voice_input_history(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_input_type ON voice_input_history(input_type, was_successful);

CREATE INDEX IF NOT EXISTS idx_voice_errors_type ON voice_recognition_errors(error_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_errors_student ON voice_recognition_errors(student_id, created_at DESC);
