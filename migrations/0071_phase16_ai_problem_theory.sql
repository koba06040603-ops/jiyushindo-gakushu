-- Phase 16: レベル5理論体系のAI問題生成統合
-- ============================================================

-- generated_problemsテーブルに12理論関連カラムを追加
ALTER TABLE generated_problems ADD COLUMN theory_aligned INTEGER DEFAULT 0;
ALTER TABLE generated_problems ADD COLUMN theory_codes TEXT; -- JSON配列 例: ["F1", "F5", "F6"]

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_generated_problems_theory_aligned 
  ON generated_problems(theory_aligned);
CREATE INDEX IF NOT EXISTS idx_generated_problems_student_theory 
  ON generated_problems(student_id, theory_aligned);
