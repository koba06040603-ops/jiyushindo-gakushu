-- =============================================================================
-- パフォーマンス最適化: D1クエリINDEX追加（簡潔版）
-- 実在するテーブルのみINDEXを作成
-- =============================================================================

-- 学習履歴テーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_learning_history_student_card ON learning_history(student_id, card_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_timestamp ON learning_history(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_history_is_correct ON learning_history(is_correct);
CREATE INDEX IF NOT EXISTS idx_learning_history_composite ON learning_history(student_id, is_correct, created_at);

-- 学習セッションテーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_learning_sessions_student_date ON learning_sessions(student_id, session_start);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_focus ON learning_sessions(focus_level);

-- 学生進捗テーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_student_progress_student_status ON student_progress(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_progress_card_status ON student_progress(card_id, status);
CREATE INDEX IF NOT EXISTS idx_student_progress_last_activity ON student_progress(last_attempt_date);

-- 学習カードテーブルのINDEX強化
CREATE INDEX IF NOT EXISTS idx_learning_cards_type ON learning_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_learning_cards_grade_subject ON learning_cards(grade_level, subject);

-- 学生テーブルのINDEX
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade_level);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- エラー履歴のINDEX
CREATE INDEX IF NOT EXISTS idx_error_history_student_card ON error_history(student_id, card_id);

-- 学習計画のINDEX
CREATE INDEX IF NOT EXISTS idx_learning_plans_student ON learning_plans(student_id);

-- 学習振り返りのINDEX  
CREATE INDEX IF NOT EXISTS idx_learning_reflections_student ON learning_reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_reflections_session ON learning_reflections(session_id);

-- Phase 9/10 テーブルのINDEX強化（実在するテーブルのみ）
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_topic ON ai_generated_content(topic);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_style ON ai_generated_content(learning_style);
CREATE INDEX IF NOT EXISTS idx_multimodal_preferences_student ON multimodal_preferences(student_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_log_student ON multimodal_usage_log(student_id);

-- パフォーマンス改善の予想効果:
-- - 学習履歴クエリ: 70-80%高速化
-- - 進捗取得クエリ: 60-70%高速化
-- - 学習カード検索: 50-60%高速化
