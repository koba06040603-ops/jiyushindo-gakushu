-- 学習計画表の拡張

-- learning_plansテーブルに新しいフィールドを追加
ALTER TABLE learning_plans ADD COLUMN hour_number INTEGER DEFAULT 1;
ALTER TABLE learning_plans ADD COLUMN subject TEXT DEFAULT '算数';
ALTER TABLE learning_plans ADD COLUMN learning_content TEXT DEFAULT '';

-- 単元全体の振り返りを保存するテーブル
CREATE TABLE IF NOT EXISTS unit_reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  reflection_good TEXT,
  reflection_bad TEXT,
  reflection_learned TEXT,
  ai_feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_learning_plans_student_curriculum 
  ON learning_plans(student_id, curriculum_id);

CREATE INDEX IF NOT EXISTS idx_unit_reflections_student_curriculum 
  ON unit_reflections(student_id, curriculum_id);
