-- Phase 2: 検索練習コンテンツテーブル
-- 学習カード生成時に、ケース10-12用のコンテンツも自動生成する

-- 検索練習コンテンツテーブル
CREATE TABLE IF NOT EXISTS retrieval_practice_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  
  -- コンテンツタイプ
  -- 'frequent_problems': ケース10（よく出る問題）
  -- 'application_problems': ケース11（応用問題）
  -- 'review_checklist': ケース12（総復習チェックリスト）
  content_type TEXT NOT NULL CHECK (content_type IN ('frequent_problems', 'application_problems', 'review_checklist')),
  
  -- コンテンツデータ（JSON形式）
  -- frequent_problems: [{problem_number, problem_title, problem_content, answer, explanation, time_limit, difficulty}, ...]
  -- application_problems: [{problem_number, problem_title, problem_content, answer, explanation, thinking_points, difficulty}, ...]
  -- review_checklist: [{item_number, check_point, description, example}, ...]
  problem_data TEXT NOT NULL,
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- 外部キー
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_retrieval_practice_curriculum 
  ON retrieval_practice_content(curriculum_id);

CREATE INDEX IF NOT EXISTS idx_retrieval_practice_type 
  ON retrieval_practice_content(curriculum_id, content_type);

-- コメント（SQLiteはコメントのみ）
-- このテーブルは以下の教育理論に基づく：
-- 1. 検索練習（Retrieval Practice）- Roediger & Karpicke (2006)
-- 2. 交互配置（Interleaved Practice）- Rohrer & Taylor (2007)
-- 3. 分散学習（Spaced Practice）- Cepeda et al. (2006)
