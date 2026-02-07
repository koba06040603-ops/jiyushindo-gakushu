-- レベル5理論体系の統合実装
-- Final Theory Framework (F1-F12) Database Schema
-- 作成日: 2026-02-07

-- ============================================================
-- F1-F12: 12理論の適性診断テーブル
-- ============================================================

-- 適性テスト項目マスター（12理論の診断項目定義）
CREATE TABLE IF NOT EXISTS theory_assessment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theory_code TEXT NOT NULL, -- F1〜F12
  theory_name TEXT NOT NULL,
  dimension TEXT NOT NULL, -- 診断次元（例: F1なら visual/auditory/reading/kinesthetic）
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- likert_5/choice/binary
  choice_options TEXT, -- JSON配列 例: ["全く当てはまらない", ..., "非常に当てはまる"]
  display_order INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- F1: 戦略的学習様式理論の診断項目
INSERT INTO theory_assessment_items (theory_code, theory_name, dimension, question_text, question_type, choice_options, display_order) VALUES
('F1', '戦略的学習様式理論', 'visual', '図や絵を見て学ぶのが好きですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 1),
('F1', '戦略的学習様式理論', 'auditory', '先生の説明を聞いて理解するのが得意ですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 2),
('F1', '戦略的学習様式理論', 'reading_writing', 'ノートに書いて覚えるのが好きですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 3),
('F1', '戦略的学習様式理論', 'kinesthetic', '実験や体験で学ぶのが好きですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 4);

-- F2: 統合的能力発達理論の診断項目
INSERT INTO theory_assessment_items (theory_code, theory_name, dimension, question_text, question_type, choice_options, display_order) VALUES
('F2', '統合的能力発達理論', 'linguistic', '言葉で考えたり話したりするのが得意ですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 5),
('F2', '統合的能力発達理論', 'logical_mathematical', '数や計算、論理的に考えるのが好きですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 6),
('F2', '統合的能力発達理論', 'spatial', '絵や図形を描いたり想像するのが得意ですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 7),
('F2', '統合的能力発達理論', 'bodily_kinesthetic', '体を動かしたり工作するのが好きですか？', 'likert_5', '["全く当てはまらない","あまり当てはまらない","どちらともいえない","やや当てはまる","非常に当てはまる"]', 8),
('F2', '統合的能力発達理論', 'growth_mindset', '努力すれば能力は伸びると思いますか？', 'likert_5', '["全く思わない","あまり思わない","どちらともいえない","やや思う","非常に思う"]', 9);

-- F5: 統合的自己調整学習理論の診断項目
INSERT INTO theory_assessment_items (theory_code, theory_name, dimension, question_text, question_type, choice_options, display_order) VALUES
('F5', '統合的自己調整学習理論', 'planning', '学習の計画を自分で立てられますか？', 'likert_5', '["全くできない","あまりできない","どちらともいえない","ややできる","非常にできる"]', 10),
('F5', '統合的自己調整学習理論', 'monitoring', '学習中に理解度を確認していますか？', 'likert_5', '["全くしない","あまりしない","時々する","よくする","いつもする"]', 11),
('F5', '統合的自己調整学習理論', 'reflection', '学習後に振り返りをしていますか？', 'likert_5', '["全くしない","あまりしない","時々する","よくする","いつもする"]', 12);

-- F8: ウェルビーイング統合動機づけ理論の診断項目
INSERT INTO theory_assessment_items (theory_code, theory_name, dimension, question_text, question_type, choice_options, display_order) VALUES
('F8', 'ウェルビーイング統合動機づけ理論', 'autonomy', '自分で学ぶことを選びたいですか？', 'likert_5', '["全く思わない","あまり思わない","どちらともいえない","やや思う","非常に思う"]', 13),
('F8', 'ウェルビーイング統合動機づけ理論', 'competence', 'できるようになりたいという気持ちがありますか？', 'likert_5', '["全くない","あまりない","どちらともいえない","ややある","非常にある"]', 14),
('F8', 'ウェルビーイング統合動機づけ理論', 'relatedness', '友達や先生とつながっていると感じますか？', 'likert_5', '["全く感じない","あまり感じない","どちらともいえない","やや感じる","非常に感じる"]', 15);

-- ============================================================
-- 学生の適性テスト結果テーブル
-- ============================================================

CREATE TABLE IF NOT EXISTS student_theory_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  theory_code TEXT NOT NULL, -- F1〜F12
  dimension TEXT NOT NULL,
  score REAL NOT NULL, -- 0-100スケール
  confidence REAL DEFAULT 0.0, -- 0.0-1.0 信頼度（回答数・一貫性による）
  sample_size INTEGER DEFAULT 0, -- 回答数
  last_assessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(student_id, theory_code, dimension)
);

CREATE INDEX IF NOT EXISTS idx_student_theory_assessments_student 
  ON student_theory_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_theory_assessments_theory 
  ON student_theory_assessments(theory_code);

-- ============================================================
-- 適性テスト回答履歴
-- ============================================================

CREATE TABLE IF NOT EXISTS assessment_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  item_id INTEGER NOT NULL, -- theory_assessment_items.id
  response_value INTEGER NOT NULL, -- 1-5 (Likert) または選択肢インデックス
  response_time_seconds INTEGER, -- 回答所要時間
  session_id TEXT, -- テストセッションID
  responded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (item_id) REFERENCES theory_assessment_items(id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_student 
  ON assessment_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_session 
  ON assessment_responses(session_id);

-- ============================================================
-- 12理論プロファイルサマリー
-- ============================================================

CREATE TABLE IF NOT EXISTS student_theory_profiles (
  student_id TEXT PRIMARY KEY,
  
  -- F1: 戦略的学習様式（VARK）
  f1_visual REAL DEFAULT 0.0, -- 視覚優位度 0-100
  f1_auditory REAL DEFAULT 0.0, -- 聴覚優位度
  f1_reading_writing REAL DEFAULT 0.0, -- 読み書き優位度
  f1_kinesthetic REAL DEFAULT 0.0, -- 体感優位度
  f1_primary_style TEXT, -- 主要スタイル: visual/auditory/reading_writing/kinesthetic/mixed
  
  -- F2: 統合的能力発達（多重知能＋成長マインドセット）
  f2_linguistic REAL DEFAULT 0.0,
  f2_logical_mathematical REAL DEFAULT 0.0,
  f2_spatial REAL DEFAULT 0.0,
  f2_bodily_kinesthetic REAL DEFAULT 0.0,
  f2_musical REAL DEFAULT 0.0,
  f2_interpersonal REAL DEFAULT 0.0,
  f2_intrapersonal REAL DEFAULT 0.0,
  f2_naturalist REAL DEFAULT 0.0,
  f2_growth_mindset REAL DEFAULT 0.0, -- 成長マインドセット度
  
  -- F5: 統合的自己調整学習
  f5_planning REAL DEFAULT 0.0, -- 計画力
  f5_monitoring REAL DEFAULT 0.0, -- モニタリング力
  f5_reflection REAL DEFAULT 0.0, -- 振り返り力
  f5_self_regulation_level TEXT DEFAULT 'developing', -- developing/intermediate/advanced
  
  -- F8: ウェルビーイング統合動機づけ
  f8_autonomy REAL DEFAULT 0.0, -- 自律性欲求
  f8_competence REAL DEFAULT 0.0, -- 有能感欲求
  f8_relatedness REAL DEFAULT 0.0, -- 関係性欲求
  f8_intrinsic_motivation REAL DEFAULT 0.0, -- 内発的動機づけレベル
  
  -- メタ情報
  profile_completeness REAL DEFAULT 0.0, -- 0.0-1.0 プロファイル完成度
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- ============================================================
-- 4層評価システム
-- ============================================================

-- Level 1: 生徒の学習成果（既存のstudent_progressを拡張）
ALTER TABLE student_progress ADD COLUMN f9_knowledge_skills REAL DEFAULT 0.0; -- 知識・技能
ALTER TABLE student_progress ADD COLUMN f9_thinking_expression REAL DEFAULT 0.0; -- 思考力・判断力・表現力
ALTER TABLE student_progress ADD COLUMN f9_learning_attitude REAL DEFAULT 0.0; -- 学びに向かう力

-- Level 2: 12理論の習得度（新規テーブル）
CREATE TABLE IF NOT EXISTS theory_mastery_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  theory_code TEXT NOT NULL, -- F1〜F12
  mastery_score REAL NOT NULL, -- 0-100 習得度
  evidence_count INTEGER DEFAULT 0, -- エビデンス数（学習データ点数）
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  UNIQUE(student_id, theory_code)
);

CREATE INDEX IF NOT EXISTS idx_theory_mastery_student 
  ON theory_mastery_scores(student_id);

-- Level 3: 教員の実践度（新規テーブル）
CREATE TABLE IF NOT EXISTS teacher_practice_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT NOT NULL,
  theory_code TEXT NOT NULL,
  practice_score REAL NOT NULL, -- 0-100 実践度
  lesson_count INTEGER DEFAULT 0, -- 該当理論を適用した授業数
  effectiveness_score REAL, -- 0-100 効果性スコア（生徒成果との相関）
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  UNIQUE(teacher_id, theory_code)
);

-- Level 4: 学校・地域の変化（既存のschoolテーブルを拡張）
-- school_level5_metricsテーブルを新規作成
CREATE TABLE IF NOT EXISTS school_level5_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id TEXT NOT NULL,
  
  -- 全体指標
  average_mastery_score REAL DEFAULT 0.0, -- 全生徒の平均習得度
  teacher_practice_rate REAL DEFAULT 0.0, -- 教員の実践率
  student_satisfaction REAL DEFAULT 0.0, -- 生徒満足度
  parent_satisfaction REAL DEFAULT 0.0, -- 保護者満足度
  
  -- 学力向上指標
  national_assessment_percentile REAL, -- 全国学力調査での位置（パーセンタイル）
  improvement_rate REAL DEFAULT 0.0, -- 前年比改善率
  
  -- 非認知能力指標
  wellbeing_score REAL DEFAULT 0.0, -- ウェルビーイングスコア
  self_regulation_score REAL DEFAULT 0.0, -- 自己調整学習スコア
  
  -- 社会的指標
  truancy_rate REAL DEFAULT 0.0, -- 不登校率
  community_engagement REAL DEFAULT 0.0, -- 地域連携度
  
  measurement_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_school_level5_metrics_school 
  ON school_level5_metrics(school_id);
CREATE INDEX IF NOT EXISTS idx_school_level5_metrics_date 
  ON school_level5_metrics(measurement_date);

-- ============================================================
-- 学習カード×12理論の対応テーブル
-- ============================================================

CREATE TABLE IF NOT EXISTS card_theory_alignment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL,
  theory_code TEXT NOT NULL, -- F1〜F12
  alignment_strength TEXT NOT NULL, -- primary/secondary/supportive
  design_rationale TEXT, -- どのように理論を反映しているか
  expected_effect TEXT, -- 期待される効果
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(card_id, theory_code)
);

-- ============================================================
-- AI個別最適化ログ（12理論ベース）
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_personalization_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- problem_generation/feedback/hint/path_recommendation
  input_theories TEXT NOT NULL, -- JSON配列 ["F1", "F2", "F5"] 考慮した理論
  theory_scores TEXT NOT NULL, -- JSON {"F1": 0.75, "F2": 0.62, ...}
  recommendation TEXT, -- AI推薦内容
  ai_rationale TEXT, -- AI判断理由
  effectiveness REAL, -- 0-1 効果性（事後評価）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_personalization_student 
  ON ai_personalization_log(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_personalization_action 
  ON ai_personalization_log(action_type);

-- ============================================================
-- Phase 15以降の認知科学戦略×12理論の統合
-- ============================================================

-- 既存のspaced_repetition_cardsを拡張
ALTER TABLE spaced_repetition_cards ADD COLUMN aligned_theories TEXT; -- JSON配列 例: ["F5", "F6"]

-- 既存のinterleaved_practice_sessionsを拡張  
ALTER TABLE interleaved_practice_sessions ADD COLUMN theory_f3_experiential BOOLEAN DEFAULT 0; -- F3: 経験学習理論の適用

-- 既存のcognitive_learningを新規作成（Phase 15機能）と統合
-- ※ Phase 15で作成済みのテーブルに理論コードを追加
-- ALTER TABLE cognitive_cards ADD COLUMN theory_alignment TEXT; -- 既存テーブルがあれば

-- ============================================================
-- 実装ロードマップトラッキング
-- ============================================================

CREATE TABLE IF NOT EXISTS level5_implementation_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT NOT NULL, -- not_started/in_progress/completed
  start_date DATE,
  end_date DATE,
  completion_percentage REAL DEFAULT 0.0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO level5_implementation_phases (phase_number, phase_name, status, notes) VALUES
(1, '理論の共通理解と準備（3ヶ月）', 'in_progress', 'データベース設計完了。UI実装開始予定。'),
(2, 'パイロット実装（6ヶ月）', 'not_started', '小学3年生・算数でスタート予定'),
(3, '効果検証と改善（3ヶ月）', 'not_started', 'データ分析・外部評価'),
(4, '全校展開（1年）', 'not_started', '小1-3、小4-6、中1-3への段階展開'),
(5, '国際連携とスケールアップ（継続）', 'not_started', '学術論文発表、国内他地域・国際展開');

-- ============================================================
-- ビュー: 生徒の12理論プロファイル概要
-- ============================================================

CREATE VIEW IF NOT EXISTS v_student_theory_overview AS
SELECT 
  stp.student_id,
  s.full_name,
  s.grade,
  
  -- F1: 学習様式
  stp.f1_primary_style,
  stp.f1_visual,
  stp.f1_auditory,
  stp.f1_reading_writing,
  stp.f1_kinesthetic,
  
  -- F2: 能力発達
  stp.f2_growth_mindset,
  
  -- F5: 自己調整
  stp.f5_self_regulation_level,
  (stp.f5_planning + stp.f5_monitoring + stp.f5_reflection) / 3 AS f5_average_score,
  
  -- F8: 動機づけ
  stp.f8_intrinsic_motivation,
  (stp.f8_autonomy + stp.f8_competence + stp.f8_relatedness) / 3 AS f8_average_score,
  
  -- メタ情報
  stp.profile_completeness,
  stp.last_updated
  
FROM student_theory_profiles stp
JOIN students s ON stp.student_id = s.id;

-- ============================================================
-- ビュー: 12理論別の学校全体平均スコア
-- ============================================================

CREATE VIEW IF NOT EXISTS v_school_theory_averages AS
SELECT 
  s.school_id,
  sc.school_name,
  sta.theory_code,
  AVG(sta.score) AS average_score,
  COUNT(DISTINCT sta.student_id) AS student_count,
  AVG(sta.confidence) AS average_confidence
FROM student_theory_assessments sta
JOIN students s ON sta.student_id = s.id
JOIN schools sc ON s.school_id = sc.id
GROUP BY s.school_id, sc.school_name, sta.theory_code;
