-- ============================================
-- Phase 3-1: 学習履歴記録システム - データベース設計
-- ケース10-12（検索練習コンテンツ）の学習活動記録
-- ============================================

-- 検索練習学習ログテーブル
CREATE TABLE IF NOT EXISTS retrieval_practice_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('frequent_problems', 'application_problems', 'review_checklist')),
  problem_id INTEGER, -- 問題番号（frequent/application用）
  item_id INTEGER, -- チェックリスト項目番号（review用）
  
  -- 学習活動詳細
  is_correct INTEGER DEFAULT 0, -- 正解フラグ（1=正解、0=不正解、NULL=未回答）
  answer_time_seconds INTEGER, -- 回答時間（秒）
  hint_used INTEGER DEFAULT 0, -- ヒント使用フラグ（1=使用、0=未使用）
  attempt_count INTEGER DEFAULT 1, -- 試行回数
  
  -- 学習コンテキスト
  session_id TEXT, -- 学習セッションID
  device_type TEXT, -- デバイスタイプ（desktop/tablet/mobile）
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成（クエリパフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_retrieval_practice_log_student 
  ON retrieval_practice_log(student_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_practice_log_curriculum 
  ON retrieval_practice_log(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_practice_log_content_type 
  ON retrieval_practice_log(content_type);

CREATE INDEX IF NOT EXISTS idx_retrieval_practice_log_created 
  ON retrieval_practice_log(created_at DESC);

-- 複合インデックス（頻繁に使用されるクエリ用）
CREATE INDEX IF NOT EXISTS idx_retrieval_practice_log_student_curriculum 
  ON retrieval_practice_log(student_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_practice_log_student_content 
  ON retrieval_practice_log(student_id, content_type);

-- ============================================
-- 学習統計集計ビュー（パフォーマンス最適化用）
-- ============================================

-- 学生別統計ビュー
CREATE VIEW IF NOT EXISTS v_retrieval_practice_student_stats AS
SELECT 
  student_id,
  curriculum_id,
  content_type,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
  ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy_rate,
  AVG(answer_time_seconds) as avg_answer_time,
  SUM(hint_used) as total_hints_used,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM retrieval_practice_log
WHERE is_correct IS NOT NULL
GROUP BY student_id, curriculum_id, content_type;

-- カリキュラム別統計ビュー
CREATE VIEW IF NOT EXISTS v_retrieval_practice_curriculum_stats AS
SELECT 
  curriculum_id,
  content_type,
  COUNT(DISTINCT student_id) as unique_students,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
  ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as avg_accuracy,
  AVG(answer_time_seconds) as avg_time,
  MIN(created_at) as first_activity,
  MAX(created_at) as last_activity
FROM retrieval_practice_log
WHERE is_correct IS NOT NULL
GROUP BY curriculum_id, content_type;

-- ============================================
-- テストデータ挿入（開発・デバッグ用）
-- ============================================

-- 学生1のテストデータ
INSERT OR IGNORE INTO retrieval_practice_log 
  (student_id, curriculum_id, content_type, problem_id, is_correct, answer_time_seconds, hint_used, session_id)
VALUES 
  (1, 1, 'frequent_problems', 1, 1, 45, 0, 'session_001'),
  (1, 1, 'frequent_problems', 2, 1, 38, 1, 'session_001'),
  (1, 1, 'frequent_problems', 3, 0, 62, 1, 'session_001'),
  (1, 1, 'application_problems', 1, 1, 120, 0, 'session_001'),
  (1, 1, 'application_problems', 2, 0, 95, 1, 'session_001'),
  (1, 1, 'review_checklist', 1, 1, 30, 0, 'session_001'),
  (1, 1, 'review_checklist', 2, 1, 25, 0, 'session_001');

-- マイグレーション完了ログ
-- SELECT '✅ Migration 0045: retrieval_practice_log table created successfully' as status;
