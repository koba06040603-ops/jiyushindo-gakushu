-- ============================================================
-- 本番に存在しない「書き込みのあるテーブル」を追加（2026-09-19 第3次）
-- ------------------------------------------------------------
-- 0101（ローカル定義59件）、0102（主要な手書き定義9件）に続く残り。
-- これらはローカルDBにも存在しなかったため、
-- コード内の INSERT / UPDATE 文から列を逆算して自動生成した。
--
-- 列の型はサフィックスから推定（_id/_count/is_* → INTEGER,
-- _at/_date → DATETIME, rate/ratio → REAL, その他 TEXT）。
-- 実データが入る前の空テーブルのため、将来仕様が固まった段階で
-- 正式なマイグレーションに置き換えてよい。
--
-- 目的は「テーブル不在による実行時エラーの解消」であり、
-- 型の厳密性より可用性を優先している。
-- ============================================================

CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_name TEXT,
  student_id INTEGER,
  variant_name TEXT,
  class_code TEXT,
  assigned_at DATETIME,
  experiment_id INTEGER,
  variant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_test_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_name TEXT,
  student_id INTEGER,
  variant_name TEXT,
  event_type TEXT,
  event_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_test_experiments (
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
);

CREATE TABLE IF NOT EXISTS ab_test_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER,
  student_id INTEGER,
  metric_name TEXT,
  metric_value TEXT,
  recorded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_test_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  experiment_id INTEGER,
  variant_name TEXT,
  description TEXT,
  config_json TEXT,
  allocation_percentage REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_feedback_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  problem_id INTEGER,
  is_correct INTEGER DEFAULT 0,
  score TEXT,
  feedback_text TEXT,
  suggestions TEXT,
  explanation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_feedback_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  conversation_id INTEGER,
  usage_stat_id INTEGER,
  rating TEXT,
  feedback_comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_generated_problems (
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
);

CREATE TABLE IF NOT EXISTS ai_personalization_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  action_type TEXT,
  input_theories TEXT,
  theory_scores TEXT,
  recommendation TEXT,
  ai_rationale REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  prediction_type TEXT,
  prediction_data TEXT,
  confidence_level INTEGER,
  prediction_date DATETIME,
  target_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  item_id INTEGER,
  response_value TEXT,
  response_time_seconds INTEGER,
  session_id INTEGER,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER,
  student_id INTEGER,
  teacher_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_theory_alignment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER,
  theory_code TEXT,
  alignment_strength TEXT,
  design_rationale REAL,
  expected_effect TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_comparison (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  comparison_date DATETIME,
  class_ids TEXT,
  metrics_json TEXT,
  insights TEXT,
  recommendations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cross_school_analytics (
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
);

CREATE TABLE IF NOT EXISTS cross_subject_evaluations (
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
);

CREATE TABLE IF NOT EXISTS csrf_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  original_learning_card_id INTEGER,
  original_optional_problem_id INTEGER,
  content_type TEXT,
  custom_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_sharing_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  shared_with_user_id INTEGER,
  permission_type TEXT,
  granted_by_user_id INTEGER,
  consent_date DATETIME,
  is_active INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discrimination_ability_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  session_id INTEGER,
  source_concept TEXT,
  identified_concept TEXT,
  is_correct_identification INTEGER DEFAULT 0,
  response_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS effect_measurement_tests (
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
);

CREATE TABLE IF NOT EXISTS elaboration_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  concept TEXT,
  prompt_type TEXT,
  student_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS encouragement_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  message_type TEXT,
  message_text TEXT,
  shown TEXT,
  shown_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  card_id INTEGER,
  error_type TEXT,
  root_cause TEXT,
  severity TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS essay_grading (
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
);

CREATE TABLE IF NOT EXISTS handwriting_inputs (
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
);

CREATE TABLE IF NOT EXISTS homework_assignments (
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
);

CREATE TABLE IF NOT EXISTS interleaved_practice_problems (
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
);

CREATE TABLE IF NOT EXISTS learning_behavior_logs (
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
);

CREATE TABLE IF NOT EXISTS learning_path_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  subject TEXT,
  recommended_units TEXT,
  weak_areas TEXT,
  next_milestone_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metacognition_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  card_id INTEGER,
  session_id INTEGER,
  predicted_performance TEXT,
  actual_performance TEXT,
  metacognition_gap TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_models (
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
);

CREATE TABLE IF NOT EXISTS ml_predictions (
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
);

CREATE TABLE IF NOT EXISTS ml_training_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  model_type TEXT,
  training_data TEXT,
  performance_before TEXT,
  performance_after TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_learning_reports (
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
);

CREATE TABLE IF NOT EXISTS non_cognitive_evaluations (
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
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  notification_type TEXT,
  title TEXT,
  message TEXT,
  priority INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  additional_data TEXT
);

CREATE TABLE IF NOT EXISTS optional_problem_progress (
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
);

CREATE TABLE IF NOT EXISTS optional_problem_submissions (
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
);

CREATE TABLE IF NOT EXISTS parent_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  parent_email TEXT,
  notification_type TEXT,
  subject TEXT,
  message TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME
);

CREATE TABLE IF NOT EXISTS pattern_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  curriculum_id INTEGER,
  pattern_type TEXT,
  analysis_data TEXT,
  confidence_score INTEGER,
  sample_size TEXT,
  analysis_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS peer_answer_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  viewer_id INTEGER,
  answer_id INTEGER,
  view_duration REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS peer_help_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER,
  helper_id INTEGER,
  curriculum_id INTEGER,
  learning_card_id INTEGER,
  message TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME
);

CREATE TABLE IF NOT EXISTS peer_helpful_marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  answer_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT,
  method TEXT,
  response_time_ms INTEGER,
  cache_hit TEXT,
  db_queries TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personalized_plans (
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
);

CREATE TABLE IF NOT EXISTS point_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  points TEXT,
  source TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS realtime_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  class_code TEXT,
  session_id INTEGER,
  connection_status TEXT,
  disconnected_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reflection_level_history (
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
);

CREATE TABLE IF NOT EXISTS reinforcement_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  weak_unit_id INTEGER,
  root_causes TEXT,
  actions TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS research_datasets (
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
);

CREATE TABLE IF NOT EXISTS research_publications (
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
);

CREATE TABLE IF NOT EXISTS review_history (
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
);

CREATE TABLE IF NOT EXISTS rl_agents (
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
);

CREATE TABLE IF NOT EXISTS similar_problems_generated (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mistake_id INTEGER,
  student_id INTEGER,
  generated_problem_id INTEGER,
  generation_method REAL,
  similarity_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spaced_learning_schedule (
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
);

CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
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
);

CREATE TABLE IF NOT EXISTS student_learning_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  learning_style TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_learning_profiles (
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
);

CREATE TABLE IF NOT EXISTS student_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  total_points TEXT,
  current_level INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  level_up_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_reflections (
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
);

CREATE TABLE IF NOT EXISTS student_theory_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  theory_code TEXT,
  dimension TEXT,
  score TEXT,
  confidence REAL,
  sample_size TEXT,
  last_assessed TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_theory_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_customization (
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
);

CREATE TABLE IF NOT EXISTS teacher_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER,
  student_id INTEGER,
  message TEXT,
  priority INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_observations (
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
);

CREATE TABLE IF NOT EXISTS test_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER,
  student_id INTEGER,
  question_number TEXT,
  student_answer TEXT,
  is_correct INTEGER DEFAULT 0,
  points_earned TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER,
  question_number TEXT,
  question_text TEXT,
  choices TEXT,
  correct_answer TEXT,
  points TEXT,
  difficulty TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS text_analysis_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  text_input TEXT,
  analysis_type TEXT,
  analysis_result TEXT,
  confidence_score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theory_mastery_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  theory_code TEXT,
  score TEXT,
  confidence REAL,
  last_updated TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS theory_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  theory_code TEXT,
  old_score INTEGER,
  new_score INTEGER,
  change_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS three_point_evaluations (
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
);

CREATE TABLE IF NOT EXISTS time_series_data (
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
);

CREATE TABLE IF NOT EXISTS truancy_support_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  support_type TEXT,
  progress_notes TEXT,
  support_coordinator_id INTEGER,
  engagement_level INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  badge_key TEXT,
  progress TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  email TEXT,
  message TEXT,
  user_id INTEGER,
  user_name TEXT,
  user_role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voice_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  audio_url TEXT,
  transcription TEXT,
  transcription_confidence REAL,
  language TEXT,
  duration_seconds INTEGER,
  emotion_detected TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_learning_reports (
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
);
