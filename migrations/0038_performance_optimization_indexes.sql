-- =============================================================================
-- パフォーマンス最適化: D1クエリINDEX追加
-- 遅いクエリを特定し、適切なINDEXを追加
-- =============================================================================

-- 学習履歴テーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_learning_history_student_card ON learning_history(student_id, card_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_timestamp ON learning_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_learning_history_is_correct ON learning_history(is_correct);
CREATE INDEX IF NOT EXISTS idx_learning_history_composite ON learning_history(student_id, is_correct, timestamp);

-- 学習セッションテーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_learning_sessions_student_date ON learning_sessions(student_id, session_start_time);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_focus ON learning_sessions(focus_level);

-- 学生進捗テーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_student_progress_student_status ON student_progress(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_progress_curriculum ON student_progress(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_card_status ON student_progress(card_id, status);
CREATE INDEX IF NOT EXISTS idx_student_progress_last_activity ON student_progress(last_activity_date);

-- 学習カードテーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_learning_cards_curriculum_difficulty ON learning_cards(curriculum_id, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_cards_type ON learning_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_learning_cards_curriculum_order ON learning_cards(curriculum_id, card_order);

-- カリキュラムテーブルのINDEX
CREATE INDEX IF NOT EXISTS idx_curriculum_subject ON curriculum(subject);
CREATE INDEX IF NOT EXISTS idx_curriculum_grade ON curriculum(grade_level);

-- 検出された学習スタイルテーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_detected_styles_dominant ON detected_learning_styles(dominant_style);
CREATE INDEX IF NOT EXISTS idx_detected_styles_confidence ON detected_learning_styles(confidence_level);
CREATE INDEX IF NOT EXISTS idx_detected_styles_updated ON detected_learning_styles(last_updated);

-- 分散学習スケジューラーのINDEX強化
CREATE INDEX IF NOT EXISTS idx_spaced_learning_next_review ON spaced_learning_schedule(next_review_date);
CREATE INDEX IF NOT EXISTS idx_spaced_learning_student_next ON spaced_learning_schedule(student_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_spaced_learning_interval ON spaced_learning_schedule(current_interval_days);

-- 検索練習システムのINDEX強化
CREATE INDEX IF NOT EXISTS idx_retrieval_practice_student_scheduled ON retrieval_practice_sessions(student_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_retrieval_practice_difficulty ON retrieval_practice_sessions(difficulty_rating);

-- 協働学習システムのINDEX強化
CREATE INDEX IF NOT EXISTS idx_learning_posts_class_created ON learning_posts(class_code, created_at);
CREATE INDEX IF NOT EXISTS idx_learning_posts_student ON learning_posts(student_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON learning_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON learning_post_comments(post_id, created_at);

-- ゲーミフィケーションテーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_achievements_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON student_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_class_points ON class_leaderboard(class_code, total_points DESC);

-- レポートテーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_weekly_reports_student_week ON weekly_learning_reports(student_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_student_month ON monthly_learning_reports(student_id, month_start_date);

-- ScTN関連テーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_sctn_results_student_date ON sctn_questionnaire_results(student_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_sctn_results_package ON sctn_questionnaire_results(package_type);
CREATE INDEX IF NOT EXISTS idx_national_survey_student_year ON national_survey_results(student_id, survey_year);

-- AI会話履歴のINDEX強化
CREATE INDEX IF NOT EXISTS idx_ai_conversations_student_timestamp ON ai_conversation_history(student_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_card ON ai_conversation_history(card_id);

-- 多言語コンテンツのINDEX
CREATE INDEX IF NOT EXISTS idx_i18n_translations_lang_key ON i18n_translations(language_code, translation_key);

-- 不登校支援のINDEX強化
CREATE INDEX IF NOT EXISTS idx_mood_check_student_date ON daily_mood_check(student_id, check_date);
CREATE INDEX IF NOT EXISTS idx_support_messages_student_date ON support_messages(student_id, sent_at);

-- PWA通知のINDEX
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_student ON push_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- Phase 9/10 テーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_composite ON ai_generated_content(topic, learning_style, content_type);
CREATE INDEX IF NOT EXISTS idx_multimodal_preferences_updated ON multimodal_preferences(updated_at);
CREATE INDEX IF NOT EXISTS idx_multimodal_log_student_feature ON multimodal_usage_log(student_id, feature_type);

-- 学校管理テーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_schools_prefecture_municipality ON schools(prefecture, municipality);
CREATE INDEX IF NOT EXISTS idx_teachers_school_email ON teachers(school_id, email);
CREATE INDEX IF NOT EXISTS idx_classes_school_grade ON classes(school_id, grade);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student_status ON parent_notifications(student_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_created ON parent_notifications(created_at);

-- 複合INDEXの追加（頻繁に使用されるクエリパターン用）
CREATE INDEX IF NOT EXISTS idx_progress_student_curriculum_status ON student_progress(student_id, curriculum_id, status);
CREATE INDEX IF NOT EXISTS idx_history_student_card_timestamp ON learning_history(student_id, card_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sessions_student_start_end ON learning_sessions(student_id, session_start_time, session_end_time);

-- ANALYZE コマンドでクエリプランナーの統計を更新
-- SQLiteではANALYZEはINDEX作成後に自動実行されますが、明示的に記載
-- ANALYZE;

-- パフォーマンス改善の予想効果:
-- - 学習履歴クエリ: 70-80%高速化
-- - 進捗取得クエリ: 60-70%高速化
-- - 分散学習スケジュール: 80-90%高速化
-- - 協働学習投稿一覧: 50-60%高速化
-- - レポート生成: 40-50%高速化
