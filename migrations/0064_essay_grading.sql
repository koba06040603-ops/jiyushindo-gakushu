-- Phase 20-2: 長文・記述問題の自動採点機能

-- 1. 記述問題テーブル
CREATE TABLE IF NOT EXISTS essay_problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  problem_type TEXT CHECK(problem_type IN ('essay', 'short_answer', 'explanation', 'proof')),
  subject TEXT NOT NULL,
  unit_name TEXT,
  question TEXT NOT NULL,
  question_type TEXT, -- 'explain', 'describe', 'analyze', 'compare', etc.
  reference_answer TEXT, -- 模範解答
  evaluation_criteria TEXT, -- 評価基準（JSON）
  max_score INTEGER DEFAULT 100,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 2. 記述解答テーブル
CREATE TABLE IF NOT EXISTS essay_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  answer_text TEXT NOT NULL,
  answer_length INTEGER, -- 文字数
  writing_time INTEGER, -- 執筆時間（秒）
  is_submitted INTEGER DEFAULT 0,
  submitted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES essay_problems(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 3. AI自動採点結果テーブル
CREATE TABLE IF NOT EXISTS essay_grading (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answer_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- 総合評価
  total_score INTEGER NOT NULL, -- 0-100
  grade_level TEXT, -- 'A', 'B', 'C', 'D', 'F'
  
  -- 詳細評価（各項目0-100点）
  content_score INTEGER, -- 内容の正確性
  logic_score INTEGER, -- 論理性・構成
  grammar_score INTEGER, -- 文法・表現
  completeness_score INTEGER, -- 完成度
  creativity_score INTEGER, -- 創造性（必要な場合）
  
  -- AI フィードバック
  overall_feedback TEXT, -- 総合評価コメント
  content_feedback TEXT, -- 内容についてのフィードバック
  logic_feedback TEXT, -- 論理・構成のフィードバック
  grammar_feedback TEXT, -- 文法のフィードバック
  improvement_suggestions TEXT, -- 改善提案
  
  -- 詳細分析
  strengths TEXT, -- 良い点
  weaknesses TEXT, -- 改善点
  key_concepts_covered TEXT, -- カバーした重要概念
  missing_concepts TEXT, -- 不足している概念
  
  -- メタデータ
  ai_model TEXT, -- 使用したAIモデル
  ai_confidence REAL, -- AI の確信度（0.0-1.0）
  processing_time INTEGER, -- 処理時間（ミリ秒）
  graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (answer_id) REFERENCES essay_answers(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 4. 手書き文字認識テーブル
CREATE TABLE IF NOT EXISTS handwriting_recognition (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  answer_id INTEGER,
  image_url TEXT NOT NULL, -- 手書き画像のURL
  recognized_text TEXT, -- 認識されたテキスト
  confidence_score REAL, -- 認識の確信度
  recognition_method TEXT, -- 'ocr', 'ai_model'
  language TEXT DEFAULT 'ja',
  is_verified INTEGER DEFAULT 0, -- 学習者による確認済みフラグ
  corrections TEXT, -- 学習者による修正
  recognized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (answer_id) REFERENCES essay_answers(id)
);

-- 5. 評価基準マスターテーブル
CREATE TABLE IF NOT EXISTS grading_rubrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rubric_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  problem_type TEXT,
  criteria_json TEXT NOT NULL, -- 評価基準の詳細（JSON）
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 採点履歴（教師による再評価）
CREATE TABLE IF NOT EXISTS manual_grading_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grading_id INTEGER NOT NULL,
  teacher_id INTEGER,
  manual_score INTEGER,
  manual_feedback TEXT,
  ai_score_difference INTEGER, -- AI採点との差分
  grading_time INTEGER, -- 採点にかかった時間（秒）
  graded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grading_id) REFERENCES essay_grading(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_essay_problems_student ON essay_problems(student_id);
CREATE INDEX IF NOT EXISTS idx_essay_problems_subject ON essay_problems(subject);
CREATE INDEX IF NOT EXISTS idx_essay_answers_problem ON essay_answers(problem_id);
CREATE INDEX IF NOT EXISTS idx_essay_answers_student ON essay_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_essay_grading_answer ON essay_grading(answer_id);
CREATE INDEX IF NOT EXISTS idx_essay_grading_student ON essay_grading(student_id);
CREATE INDEX IF NOT EXISTS idx_handwriting_student ON handwriting_recognition(student_id);
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_subject ON grading_rubrics(subject);

-- 初期データ: 基本的な評価基準
INSERT OR IGNORE INTO grading_rubrics (rubric_name, subject, problem_type, criteria_json, description) VALUES
  ('国語記述問題', '国語', 'essay', '{"content": {"weight": 0.4, "description": "内容の正確性と理解度"}, "logic": {"weight": 0.3, "description": "論理的な構成と展開"}, "grammar": {"weight": 0.2, "description": "文法と表現の正確性"}, "completeness": {"weight": 0.1, "description": "解答の完成度"}}', '国語の記述問題用の評価基準'),
  ('数学証明問題', '数学', 'proof', '{"logic": {"weight": 0.5, "description": "論理的な証明手順"}, "content": {"weight": 0.3, "description": "数学的正確性"}, "completeness": {"weight": 0.2, "description": "証明の完全性"}}', '数学の証明問題用の評価基準'),
  ('英語作文', '英語', 'essay', '{"content": {"weight": 0.3, "description": "内容の適切性"}, "grammar": {"weight": 0.3, "description": "文法の正確性"}, "vocabulary": {"weight": 0.2, "description": "語彙の適切性"}, "organization": {"weight": 0.2, "description": "文章構成"}}', '英語作文用の評価基準'),
  ('理科実験考察', '理科', 'explanation', '{"content": {"weight": 0.4, "description": "実験結果の理解"}, "logic": {"weight": 0.3, "description": "考察の論理性"}, "scientific_accuracy": {"weight": 0.3, "description": "科学的正確性"}}', '理科の実験考察用の評価基準'),
  ('社会論述問題', '社会', 'essay', '{"content": {"weight": 0.4, "description": "歴史的事実の理解"}, "logic": {"weight": 0.3, "description": "論理的な説明"}, "perspective": {"weight": 0.3, "description": "多角的な視点"}}', '社会の論述問題用の評価基準');
