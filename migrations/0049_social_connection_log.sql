-- 社会接続活動記録テーブル
-- 地域社会・キャリア・SDGs関連活動を記録
-- 社会接続意識の評価に使用

CREATE TABLE IF NOT EXISTS social_connection_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  
  -- 活動日
  activity_date DATE NOT NULL,
  
  -- ━━━ 社会接続の種類 ━━━
  connection_type TEXT CHECK(connection_type IN (
    'community',  -- 地域社会
    'career',     -- キャリア
    'sdgs'        -- SDGs・持続可能性
  )),
  
  -- ━━━ 活動内容 ━━━
  -- 活動タイトル
  activity_title TEXT NOT NULL,
  
  -- 活動の詳細説明
  activity_description TEXT,
  
  -- 関連教科（NULL可、例: "社会", "理科", "総合"）
  related_subject TEXT,
  
  -- ━━━ SDGs関連（connection_type='sdgs'の場合）━━━
  -- 関連SDGsゴール（JSON配列）
  -- 例: ["4", "13", "17"] → 目標4, 13, 17
  related_sdgs TEXT,
  
  -- ━━━ 地域社会関連（connection_type='community'の場合）━━━
  -- 活動場所（例: "地域図書館", "商店街", "公園"）
  location TEXT,
  
  -- 交流した地域の人（例: "商店主", "お年寄り", "園児"）
  community_members TEXT,
  
  -- ━━━ キャリア関連（connection_type='career'の場合）━━━
  -- 職業（例: "看護師", "エンジニア", "農家"）
  career_type TEXT,
  
  -- 職場・機関名（例: "○○病院", "△△株式会社"）
  organization_name TEXT,
  
  -- ━━━ 学びの成果 ━━━
  -- 学んだこと・気づいたこと
  learning_outcomes TEXT,
  
  -- 感想・印象
  impressions TEXT,
  
  -- 今後やりたいこと
  future_actions TEXT,
  
  -- ━━━ 評価 ━━━
  -- 参加態度（1: 消極的 〜 5: 主体的）
  participation_level INTEGER CHECK(participation_level BETWEEN 1 AND 5),
  
  -- 社会的意識の深まり（1: なし 〜 5: 大きく深まった）
  awareness_depth INTEGER CHECK(awareness_depth BETWEEN 1 AND 5),
  
  -- 継続意欲（1: ない 〜 5: 強くある）
  continuation_willingness INTEGER CHECK(continuation_willingness BETWEEN 1 AND 5),
  
  -- ━━━ 活動形態 ━━━
  -- 個人/グループ
  activity_format TEXT CHECK(activity_format IN ('individual', 'group', 'class')),
  
  -- グループの場合のメンバー数
  group_size INTEGER,
  
  -- 教師の観察メモ
  teacher_notes TEXT,
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_social_student_date 
  ON social_connection_log(student_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_social_connection_type 
  ON social_connection_log(connection_type);

CREATE INDEX IF NOT EXISTS idx_social_date 
  ON social_connection_log(activity_date DESC);

-- 社会接続サマリービュー（直近3ヶ月）
CREATE VIEW IF NOT EXISTS recent_social_connection_summary AS
SELECT 
  student_id,
  COUNT(*) as total_activities,
  SUM(CASE WHEN connection_type = 'community' THEN 1 ELSE 0 END) as community_count,
  SUM(CASE WHEN connection_type = 'career' THEN 1 ELSE 0 END) as career_count,
  SUM(CASE WHEN connection_type = 'sdgs' THEN 1 ELSE 0 END) as sdgs_count,
  AVG(participation_level) as avg_participation,
  AVG(awareness_depth) as avg_awareness,
  AVG(continuation_willingness) as avg_willingness
FROM social_connection_log
WHERE activity_date >= DATE('now', '-90 days')
GROUP BY student_id;

-- SDGsゴール別集計ビュー
CREATE VIEW IF NOT EXISTS sdgs_goal_participation AS
SELECT 
  student_id,
  json_extract(value, '$') as sdg_goal,
  COUNT(*) as participation_count
FROM social_connection_log,
     json_each(related_sdgs)
WHERE connection_type = 'sdgs'
  AND related_sdgs IS NOT NULL
  AND activity_date >= DATE('now', '-180 days')
GROUP BY student_id, sdg_goal;
