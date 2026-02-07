-- 協働学習記録テーブル
-- グループ活動・ペア学習での行動を記録
-- 協働性の評価に使用

CREATE TABLE IF NOT EXISTS collaboration_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER, -- NULL可（教科横断的活動の場合）
  
  -- 活動日
  activity_date DATE NOT NULL,
  
  -- ━━━ 協働活動の種類 ━━━
  activity_type TEXT CHECK(activity_type IN (
    'group_discussion',     -- グループ討論
    'pair_work',            -- ペア学習
    'project',              -- プロジェクト学習
    'peer_review',          -- 相互評価
    'jigsaw',               -- ジグソー法
    'think_pair_share',     -- Think-Pair-Share
    'group_investigation',  -- グループ調査
    'other'                 -- その他
  )),
  
  -- 活動タイトル
  activity_title TEXT,
  
  -- ━━━ 行動記録（量的データ）━━━
  -- 発言回数
  speaking_count INTEGER DEFAULT 0,
  
  -- 質問回数
  question_count INTEGER DEFAULT 0,
  
  -- 他者を助けた回数
  help_given_count INTEGER DEFAULT 0,
  
  -- 他者から助けを受けた回数
  help_received_count INTEGER DEFAULT 0,
  
  -- ━━━ 評価 ━━━
  -- ピア評価（他の生徒からの評価、1.0-5.0）
  peer_rating REAL CHECK(peer_rating BETWEEN 1.0 AND 5.0),
  
  -- 教師評価（1.0-5.0）
  teacher_rating REAL CHECK(teacher_rating BETWEEN 1.0 AND 5.0),
  
  -- ━━━ 質的評価 ━━━
  -- 教師の観察メモ
  teacher_notes TEXT,
  
  -- 役割（例: "司会", "記録", "発表", "タイムキーパー"）
  role_in_group TEXT,
  
  -- 貢献度（1: 消極的 〜 5: リーダーシップ）
  contribution_level INTEGER CHECK(contribution_level BETWEEN 1 AND 5),
  
  -- 傾聴態度（1: 聞かない 〜 5: 深く聞く）
  listening_level INTEGER CHECK(listening_level BETWEEN 1 AND 5),
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE SET NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_collaboration_student_date 
  ON collaboration_log(student_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_collaboration_curriculum 
  ON collaboration_log(curriculum_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_collaboration_activity_type 
  ON collaboration_log(activity_type);

CREATE INDEX IF NOT EXISTS idx_collaboration_date 
  ON collaboration_log(activity_date DESC);

-- 協働学習サマリービュー（直近1ヶ月）
CREATE VIEW IF NOT EXISTS recent_collaboration_summary AS
SELECT 
  student_id,
  COUNT(*) as activity_count,
  SUM(speaking_count) as total_speaking,
  SUM(question_count) as total_questions,
  SUM(help_given_count) as total_help_given,
  SUM(help_received_count) as total_help_received,
  AVG(peer_rating) as avg_peer_rating,
  AVG(teacher_rating) as avg_teacher_rating,
  AVG(contribution_level) as avg_contribution,
  AVG(listening_level) as avg_listening
FROM collaboration_log
WHERE activity_date >= DATE('now', '-30 days')
GROUP BY student_id;
