-- 統合プロファイルテーブル
-- 生徒の4軸統合プロファイルを時系列で保存
-- 軸1: 資質・能力の3つの柱
-- 軸2: 横断的基盤（自己調整・協働・社会接続）
-- 軸4: MI理論（8種の知能）

CREATE TABLE IF NOT EXISTS student_profile_integrated (
  student_id INTEGER NOT NULL,
  assessment_date DATE NOT NULL,
  
  -- ━━━ 軸1: 資質・能力の3つの柱（5段階評価）━━━
  -- 1: 未習得/受動 2: 基礎/興味 3: 標準/主体 4: 発展/自律 5: 卓越/貢献
  knowledge_skill_level INTEGER CHECK(knowledge_skill_level BETWEEN 1 AND 5),
  thinking_expression_level INTEGER CHECK(thinking_expression_level BETWEEN 1 AND 5),
  learning_attitude_level INTEGER CHECK(learning_attitude_level BETWEEN 1 AND 5),
  
  -- ━━━ 軸2: 横断的基盤（5段階評価）━━━
  -- 自己調整能力
  metacognition_level INTEGER CHECK(metacognition_level BETWEEN 1 AND 5),
  learning_strategy_level INTEGER CHECK(learning_strategy_level BETWEEN 1 AND 5),
  goal_setting_level INTEGER CHECK(goal_setting_level BETWEEN 1 AND 5),
  
  -- 協働性
  dialogue_level INTEGER CHECK(dialogue_level BETWEEN 1 AND 5),
  collaboration_level INTEGER CHECK(collaboration_level BETWEEN 1 AND 5),
  
  -- 社会接続
  social_perspective_level INTEGER CHECK(social_perspective_level BETWEEN 1 AND 5),
  
  -- ━━━ 軸4: MI理論（8種の知能、1-10スケール）━━━
  linguistic_intelligence INTEGER CHECK(linguistic_intelligence BETWEEN 1 AND 10),
  logical_mathematical_intelligence INTEGER CHECK(logical_mathematical_intelligence BETWEEN 1 AND 10),
  spatial_intelligence INTEGER CHECK(spatial_intelligence BETWEEN 1 AND 10),
  bodily_kinesthetic_intelligence INTEGER CHECK(bodily_kinesthetic_intelligence BETWEEN 1 AND 10),
  musical_intelligence INTEGER CHECK(musical_intelligence BETWEEN 1 AND 10),
  interpersonal_intelligence INTEGER CHECK(interpersonal_intelligence BETWEEN 1 AND 10),
  intrapersonal_intelligence INTEGER CHECK(intrapersonal_intelligence BETWEEN 1 AND 10),
  naturalistic_intelligence INTEGER CHECK(naturalistic_intelligence BETWEEN 1 AND 10),
  
  -- ━━━ 統合分析結果 ━━━
  -- 優位知能（JSON配列）例: ["対人的", "言語的", "内省的"]
  dominant_intelligences TEXT,
  
  -- 総合所見
  overall_profile_summary TEXT,
  
  -- 学習推奨
  learning_advice TEXT,
  
  -- 信頼度スコア（0.0-1.0）
  -- 初期診断: 0.3-0.5, 3ヶ月後: 0.6-0.7, 6ヶ月以上: 0.8-1.0
  confidence_score REAL CHECK(confidence_score BETWEEN 0.0 AND 1.0),
  
  -- データソース
  data_source TEXT CHECK(data_source IN ('initial_diagnosis', 'monthly_update', 'unit_review', 'semester_review')),
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (student_id, assessment_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_profile_student_date 
  ON student_profile_integrated(student_id, assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_profile_date 
  ON student_profile_integrated(assessment_date);

CREATE INDEX IF NOT EXISTS idx_profile_data_source 
  ON student_profile_integrated(data_source);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 教科別適性プロファイルテーブル
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS subject_aptitude_profile (
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  assessment_date DATE NOT NULL,
  
  -- ━━━ 軸3: 教科固有要素 ━━━
  -- 教科の「見方・考え方」の発揮度（5段階）
  subject_specific_perspective INTEGER CHECK(subject_specific_perspective BETWEEN 1 AND 5),
  
  -- 中核的資質・能力のレベル（5段階）
  core_competency_level INTEGER CHECK(core_competency_level BETWEEN 1 AND 5),
  
  -- 内容領域別の強み（JSON）
  -- 例: {"話す聞く": 4, "書く": 3, "読む": 5, "言語文化": 3}
  content_domain_strengths TEXT,
  
  -- ━━━ 適性タイプ ━━━
  -- 例: "対話共感型", "論理推論型", "視覚空間型"
  aptitude_type TEXT,
  
  -- 適性タイプの確信度（0.0-1.0）
  aptitude_type_confidence REAL CHECK(aptitude_type_confidence BETWEEN 0.0 AND 1.0),
  
  -- ━━━ 学習推奨 ━━━
  -- 推奨活動（JSON配列）
  -- 例: ["読書会", "インタビュー学習", "グループ討論"]
  recommended_activities TEXT,
  
  -- 避けるべき活動（JSON配列）
  -- 例: ["孤独な暗記", "機械的練習"]
  avoid_activities TEXT,
  
  -- 教科別学習アドバイス
  subject_learning_advice TEXT,
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (student_id, curriculum_id, assessment_date),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_subject_profile_student 
  ON subject_aptitude_profile(student_id, curriculum_id, assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_subject_profile_curriculum 
  ON subject_aptitude_profile(curriculum_id, assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_subject_profile_aptitude_type 
  ON subject_aptitude_profile(aptitude_type);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 診断履歴テーブル
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS diagnosis_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  
  -- 診断タイプ
  diagnosis_type TEXT CHECK(diagnosis_type IN ('initial', 'monthly', 'unit', 'semester')),
  
  -- 診断日
  diagnosis_date DATE NOT NULL,
  
  -- 診断に使用したデータ期間
  data_period_start DATE,
  data_period_end DATE,
  
  -- ━━━ 診断結果のスナップショット（JSON）━━━
  -- 全プロファイルデータを保存
  profile_snapshot TEXT,
  
  -- ━━━ 前回診断との差分（JSON）━━━
  -- 例: {"linguistic_intelligence": "+1", "collaboration_level": "+2"}
  changes_detected TEXT,
  
  -- 成長のサマリー
  growth_summary TEXT,
  
  -- ━━━ AI分析結果 ━━━
  -- AIによる総合分析
  ai_analysis TEXT,
  
  -- AI推奨（JSON配列）
  ai_recommendations TEXT,
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_diagnosis_student_date 
  ON diagnosis_history(student_id, diagnosis_date DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosis_type 
  ON diagnosis_history(diagnosis_type, diagnosis_date DESC);

CREATE INDEX IF NOT EXISTS idx_diagnosis_date 
  ON diagnosis_history(diagnosis_date DESC);
