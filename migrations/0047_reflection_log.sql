-- 振り返りログテーブル
-- 生徒の週次・単元末の振り返り記述を保存
-- 自己調整能力の評価に使用

CREATE TABLE IF NOT EXISTS reflection_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER, -- NULL可（全般的振り返りの場合）
  
  -- 振り返り日
  reflection_date DATE NOT NULL,
  
  -- ━━━ 振り返り内容（テキスト）━━━
  -- 何を学んだか
  what_learned TEXT,
  
  -- 何に苦労したか・つまずいたか
  what_struggled TEXT,
  
  -- 次はどうするか・改善点
  what_next TEXT,
  
  -- ━━━ 自己評価（5段階）━━━
  -- 理解度（1: 全然分からない 〜 5: 完全に理解した）
  understanding_level INTEGER CHECK(understanding_level BETWEEN 1 AND 5),
  
  -- がんばり度（1: 全然がんばれなかった 〜 5: とてもがんばった）
  effort_level INTEGER CHECK(effort_level BETWEEN 1 AND 5),
  
  -- ━━━ 学習感情 ━━━
  -- 例: "楽しかった", "難しかった", "達成感があった", "不安だった"
  learning_emotion TEXT,
  
  -- ━━━ メタ認知的記述の有無（AI分析結果）━━━
  -- NULL: 未分析, 0: なし, 1: あり
  has_metacognitive_expression INTEGER CHECK(has_metacognitive_expression IN (0, 1)),
  
  -- 学習方略への言及の有無（AI分析結果）
  has_strategy_mention INTEGER CHECK(has_strategy_mention IN (0, 1)),
  
  -- 協働学習への言及の有無（AI分析結果）
  has_collaboration_mention INTEGER CHECK(has_collaboration_mention IN (0, 1)),
  
  -- 社会接続への言及の有無（AI分析結果）
  has_social_connection_mention INTEGER CHECK(has_social_connection_mention IN (0, 1)),
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_reflection_student_date 
  ON reflection_log(student_id, reflection_date DESC);

CREATE INDEX IF NOT EXISTS idx_reflection_curriculum 
  ON reflection_log(curriculum_id, reflection_date DESC);

CREATE INDEX IF NOT EXISTS idx_reflection_date 
  ON reflection_log(reflection_date DESC);

-- 週次振り返りサマリービュー（直近4週間）
CREATE VIEW IF NOT EXISTS recent_reflections AS
SELECT 
  student_id,
  COUNT(*) as reflection_count,
  AVG(understanding_level) as avg_understanding,
  AVG(effort_level) as avg_effort,
  SUM(CASE WHEN has_metacognitive_expression = 1 THEN 1 ELSE 0 END) as metacognitive_count,
  SUM(CASE WHEN has_strategy_mention = 1 THEN 1 ELSE 0 END) as strategy_count,
  SUM(CASE WHEN has_collaboration_mention = 1 THEN 1 ELSE 0 END) as collaboration_count,
  SUM(CASE WHEN has_social_connection_mention = 1 THEN 1 ELSE 0 END) as social_count
FROM reflection_log
WHERE reflection_date >= DATE('now', '-28 days')
GROUP BY student_id;
