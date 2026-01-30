-- Phase 9: 学習スタイル対応のためのテーブル

-- 生徒の学習スタイル設定
CREATE TABLE IF NOT EXISTS student_learning_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  learning_style TEXT NOT NULL CHECK(learning_style IN ('visual', 'auditory', 'kinesthetic')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id)
);

-- 学習スタイル別の問題生成履歴
CREATE TABLE IF NOT EXISTS styled_problem_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  original_card_id INTEGER NOT NULL,
  learning_style TEXT NOT NULL,
  styled_problem_json TEXT NOT NULL, -- JSON形式で保存
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (original_card_id) REFERENCES learning_cards(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_student_learning_preferences_student 
  ON student_learning_preferences(student_id);

CREATE INDEX IF NOT EXISTS idx_styled_problem_history_student 
  ON styled_problem_history(student_id);

CREATE INDEX IF NOT EXISTS idx_styled_problem_history_card 
  ON styled_problem_history(original_card_id);

-- カード配信テーブル（Phase 7用）
CREATE TABLE IF NOT EXISTS card_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  is_viewed INTEGER DEFAULT 0,
  viewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES learning_cards(id),
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_card_distributions_student 
  ON card_distributions(student_id);

CREATE INDEX IF NOT EXISTS idx_card_distributions_teacher 
  ON card_distributions(teacher_id);
