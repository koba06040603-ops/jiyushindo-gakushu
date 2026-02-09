-- Phase 20-1: 間違いノート機能
-- 間違えた問題の記録、復習管理、克服度の可視化

-- 1. 間違いノートテーブル
CREATE TABLE IF NOT EXISTS mistake_notebook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  original_question TEXT NOT NULL,
  original_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  student_answer TEXT NOT NULL,
  subject TEXT NOT NULL,
  unit_name TEXT,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
  mistake_type TEXT, -- 'calculation_error', 'concept_misunderstanding', 'careless_mistake', etc.
  first_mistake_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  review_count INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0, -- 0-100: 克服度
  is_mastered INTEGER DEFAULT 0, -- 0: 未克服, 1: 克服済み
  last_review_at DATETIME,
  next_review_at DATETIME, -- エビングハウスの忘却曲線に基づく次回復習日
  notes TEXT, -- 学習者のメモ
  ai_feedback TEXT, -- AI からのアドバイス
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (problem_id) REFERENCES generated_problems(id)
);

-- 2. 復習履歴テーブル
CREATE TABLE IF NOT EXISTS review_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mistake_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  review_type TEXT CHECK(review_type IN ('manual', 'scheduled', 'random')),
  is_correct INTEGER DEFAULT 0, -- 復習時の正誤
  time_spent INTEGER, -- 復習にかかった時間（秒）
  confidence_level INTEGER, -- 1-5: 自信度
  notes TEXT,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 3. 克服度統計テーブル（教科・単元別）
CREATE TABLE IF NOT EXISTS mastery_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  unit_name TEXT,
  total_mistakes INTEGER DEFAULT 0,
  mastered_count INTEGER DEFAULT 0,
  in_progress_count INTEGER DEFAULT 0,
  mastery_percentage REAL DEFAULT 0.0, -- 克服率
  average_review_count REAL DEFAULT 0.0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(student_id, subject, unit_name)
);

-- 4. 復習スケジュールテーブル
CREATE TABLE IF NOT EXISTS review_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  mistake_id INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  priority INTEGER DEFAULT 1, -- 1-5: 優先度（5が最高）
  is_completed INTEGER DEFAULT 0,
  completed_at DATETIME,
  review_interval_days INTEGER, -- 復習間隔（日数）
  difficulty_adjustment REAL DEFAULT 1.0, -- 難易度調整係数
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 5. 類似問題生成履歴
CREATE TABLE IF NOT EXISTS similar_problems_generated (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mistake_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  generated_problem_id INTEGER,
  similarity_score REAL, -- 0.0-1.0: 類似度
  generation_method TEXT, -- 'ai', 'template', 'database'
  is_attempted INTEGER DEFAULT 0,
  is_correct INTEGER,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  attempted_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (generated_problem_id) REFERENCES generated_problems(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_mistake_notebook_student ON mistake_notebook(student_id);
CREATE INDEX IF NOT EXISTS idx_mistake_notebook_subject ON mistake_notebook(subject);
CREATE INDEX IF NOT EXISTS idx_mistake_notebook_mastery ON mistake_notebook(is_mastered);
CREATE INDEX IF NOT EXISTS idx_mistake_notebook_next_review ON mistake_notebook(next_review_at);
CREATE INDEX IF NOT EXISTS idx_review_history_student ON review_history(student_id);
CREATE INDEX IF NOT EXISTS idx_mastery_statistics_student ON mastery_statistics(student_id);
CREATE INDEX IF NOT EXISTS idx_review_schedule_student ON review_schedule(student_id);
CREATE INDEX IF NOT EXISTS idx_review_schedule_date ON review_schedule(scheduled_date);

-- 初期データ: 間違いタイプの定義
CREATE TABLE IF NOT EXISTS mistake_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_code TEXT UNIQUE NOT NULL,
  type_name TEXT NOT NULL,
  type_description TEXT,
  advice_template TEXT
);

INSERT OR IGNORE INTO mistake_types (type_code, type_name, type_description, advice_template) VALUES
  ('calculation_error', '計算ミス', '計算過程でのミス', '計算をもう一度見直してみましょう。途中式を丁寧に書くことが大切です。'),
  ('concept_misunderstanding', '概念の誤解', '基本概念の理解不足', 'この単元の基本概念をもう一度復習しましょう。教科書の説明を読み直すと良いでしょう。'),
  ('careless_mistake', 'ケアレスミス', '注意不足によるミス', '問題をよく読んで、落ち着いて解きましょう。見直しの時間を作ることが大切です。'),
  ('formula_error', '公式の誤用', '公式の適用ミス', 'この問題で使う公式を確認しましょう。公式の意味を理解することが重要です。'),
  ('reading_comprehension', '読解ミス', '問題文の読み間違い', '問題文をゆっくり読んで、何を求められているか確認しましょう。'),
  ('time_management', '時間不足', '時間内に解けなかった', '時間配分を意識して練習しましょう。簡単な問題から解くのも一つの方法です。'),
  ('knowledge_gap', '知識不足', '必要な知識が不足', 'この問題に必要な知識を学習しましょう。関連する単元を復習すると良いでしょう。'),
  ('complex_problem', '複雑な問題', '複数ステップの問題', '問題を小さく分解して考えましょう。一つずつステップを確実にクリアしていきます。');
