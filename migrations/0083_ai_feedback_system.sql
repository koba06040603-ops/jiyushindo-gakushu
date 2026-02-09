-- Phase 12-4: AIフィードバックシステム
-- answer_historyテーブル: 解答履歴とフィードバック保存

-- 解答履歴テーブル
CREATE TABLE IF NOT EXISTS answer_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER NOT NULL,
  student_answer TEXT NOT NULL,
  is_correct INTEGER DEFAULT 0,
  feedback_text TEXT,
  feedback_score INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (problem_id) REFERENCES generated_problems(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_answer_history_student ON answer_history(student_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_problem ON answer_history(problem_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_created ON answer_history(created_at);
