# 継続的診断システム：技術仕様設計書

## 目次
1. [システム概要](#1-システム概要)
2. [アーキテクチャ設計](#2-アーキテクチャ設計)
3. [データベース設計](#3-データベース設計)
4. [診断アルゴリズム](#4-診断アルゴリズム)
5. [API設計](#5-api設計)
6. [フロントエンド設計](#6-フロントエンド設計)
7. [実装ロードマップ](#7-実装ロードマップ)

---

## 1. システム概要

### 1.1 継続的診断システムとは

```
┌──────────────────────────────────────────────────────────┐
│         継続的診断システムの全体像                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  【初期診断】学年開始時                                   │
│    ├─ 包括的診断テスト（全教科）                         │
│    ├─ 4軸プロファイル作成                                │
│    └─ 適性タイプ判定                                     │
│         ▼                                                │
│  【日常学習】学習活動中                                   │
│    ├─ 学習ログ自動収集（正答率、時間、ヒント）          │
│    ├─ 振り返り記述（週次）                               │
│    ├─ 協働学習記録（観察）                               │
│    └─ 社会接続活動記録                                   │
│         ▼                                                │
│  【形成的評価】毎月                                       │
│    ├─ 学習データの統合分析                               │
│    ├─ AIによる4軸プロファイル更新                        │
│    ├─ 個別フィードバック生成                             │
│    └─ 学習推奨の調整                                     │
│         ▼                                                │
│  【中間診断】単元終了時                                   │
│    ├─ 単元テスト（4軸評価）                              │
│    ├─ ポートフォリオレビュー                             │
│    └─ 適性タイプの再検証                                 │
│         ▼                                                │
│  【総括的評価】学期末                                     │
│    ├─ 教師の観察評価統合                                 │
│    ├─ 学期間の成長分析                                   │
│    ├─ 面談での目標設定                                   │
│    └─ 次学期への引継ぎ                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 1.2 システムの設計原則

| 原則 | 内容 | 実装方針 |
|------|------|---------|
| **継続性** | 一度だけでなく、学習の全期間を通じた診断 | 自動データ収集、定期更新 |
| **多面性** | 4軸すべてからの総合的評価 | 複数データソースの統合 |
| **適応性** | 生徒の成長に応じてプロファイル更新 | AI分析による動的調整 |
| **実用性** | 教師・生徒が活用できる具体的推奨 | アクションプラン自動生成 |
| **妥当性** | 教育理論に基づく科学的診断 | 理論的根拠の明示 |
| **透明性** | 診断根拠を生徒・保護者に説明可能 | レポート自動生成 |

### 1.3 システムのゴール

```
┌──────────────────────────────────────────────────────────┐
│              システムが達成する5つのゴール                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ゴール1：生徒の自己理解促進                             │
│    「自分はどんな学び方が得意か」を生徒自身が理解       │
│                                                          │
│  ゴール2：教師の指導支援                                 │
│    「この生徒にはどんな指導が効果的か」を教師が把握     │
│                                                          │
│  ゴール3：保護者の理解支援                               │
│    「我が子の学びの特徴」を保護者が理解し家庭で支援     │
│                                                          │
│  ゴール4：個別最適な学習推奨                             │
│    AIが生徒ごとに最適な学習方法・教材を提案             │
│                                                          │
│  ゴール5：継続的成長の可視化                             │
│    「どう成長したか」を時系列で可視化しモチベーション向上│
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 2. アーキテクチャ設計

### 2.1 システムアーキテクチャ全体図

```
┌────────────────────────────────────────────────────────────────┐
│                    システムアーキテクチャ                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  【フロントエンド層】                                           │
│  ┌──────────────────────────────────────────────────┐         │
│  │  生徒用UI    │  教師用UI    │  保護者用UI        │         │
│  │  ・学習活動  │  ・診断結果  │  ・成長レポート    │         │
│  │  ・振り返り  │  ・指導推奨  │  ・面談資料        │         │
│  └──────────────────────────────────────────────────┘         │
│           │              │              │                     │
│           ▼              ▼              ▼                     │
│  【API層】                                                      │
│  ┌──────────────────────────────────────────────────┐         │
│  │  /api/diagnosis/*  診断関連API                   │         │
│  │  /api/learning/*   学習データ収集API             │         │
│  │  /api/profile/*    プロファイル管理API           │         │
│  │  /api/recommendation/* 学習推奨API               │         │
│  └──────────────────────────────────────────────────┘         │
│           │                                                    │
│           ▼                                                    │
│  【ビジネスロジック層】                                         │
│  ┌──────────────────────────────────────────────────┐         │
│  │  診断エンジン                                    │         │
│  │  ├─ 初期診断モジュール                           │         │
│  │  ├─ 継続診断モジュール                           │         │
│  │  ├─ 4軸統合分析モジュール                        │         │
│  │  └─ 適性タイプ判定モジュール                     │         │
│  │                                                  │         │
│  │  学習推奨エンジン                                │         │
│  │  ├─ 教材マッチングモジュール                     │         │
│  │  ├─ 学習方略推奨モジュール                       │         │
│  │  └─ 目標設定支援モジュール                       │         │
│  │                                                  │         │
│  │  AI分析エンジン（Gemini API）                    │         │
│  │  ├─ 振り返りテキスト分析                         │         │
│  │  ├─ プロファイル更新AI                           │         │
│  │  └─ フィードバック生成AI                         │         │
│  └──────────────────────────────────────────────────┘         │
│           │                                                    │
│           ▼                                                    │
│  【データ層】Cloudflare D1                                      │
│  ┌──────────────────────────────────────────────────┐         │
│  │  生徒マスタ / カリキュラムマスタ                 │         │
│  │  学習履歴データ / 診断結果データ                 │         │
│  │  4軸プロファイルデータ / 振り返りデータ          │         │
│  │  協働学習記録 / 社会接続活動記録                 │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 データフロー図

```
┌────────────────────────────────────────────────────────────┐
│              継続的診断のデータフロー                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  【入力】学習活動                                           │
│    │                                                       │
│    ├─ 自動収集: 問題正答率、解答時間、ヒント使用          │
│    ├─ 手動入力: 振り返り記述、自己評価                    │
│    └─ 教師入力: 観察記録、協働学習評価                    │
│         │                                                  │
│         ▼                                                  │
│  【蓄積】データベース                                       │
│    ├─ retrieval_practice_log（学習履歴）                  │
│    ├─ reflection_log（振り返り）                          │
│    ├─ collaboration_log（協働学習）                       │
│    └─ social_connection_log（社会接続）                   │
│         │                                                  │
│         ▼                                                  │
│  【分析】統合分析エンジン                                   │
│    ├─ 量的データ分析: 正答率・時間の統計処理              │
│    ├─ 質的データ分析: テキストのAI分析                    │
│    ├─ 4軸評価: 各軸のスコア算出                           │
│    └─ MI推論: 優位知能の推測                              │
│         │                                                  │
│         ▼                                                  │
│  【更新】プロファイル更新                                   │
│    ├─ 前回プロファイルとの比較                            │
│    ├─ 成長・変化の検出                                    │
│    ├─ 適性タイプの再判定                                  │
│    └─ 信頼度の計算                                        │
│         │                                                  │
│         ▼                                                  │
│  【生成】フィードバック・推奨                               │
│    ├─ 生徒向け: 「あなたの強み」「次のアクション」        │
│    ├─ 教師向け: 「指導のポイント」「注意すべき点」        │
│    └─ 保護者向け: 「成長レポート」「家庭での支援」        │
│         │                                                  │
│         ▼                                                  │
│  【出力】UI表示                                             │
│    ├─ ダッシュボード                                      │
│    ├─ 成長グラフ                                          │
│    ├─ 推奨学習活動リスト                                  │
│    └─ PDFレポート                                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 3. データベース設計

### 3.1 ERD（エンティティ関連図）

```
┌─────────────────────────────────────────────────────────────┐
│                    データベースER図                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐                                           │
│  │   students   │ 1                                         │
│  │──────────────│───┐                                       │
│  │ id (PK)      │   │                                       │
│  │ name         │   │                                       │
│  │ grade_level  │   │                                       │
│  │ birth_date   │   │                                       │
│  └──────────────┘   │                                       │
│                     │ N                                     │
│                     ▼                                       │
│  ┌──────────────────────────────────┐                       │
│  │  student_profile_integrated      │                       │
│  │──────────────────────────────────│                       │
│  │ student_id (PK, FK)              │                       │
│  │ assessment_date (PK)             │                       │
│  │ knowledge_skill_level            │                       │
│  │ thinking_expression_level        │                       │
│  │ learning_attitude_level          │                       │
│  │ metacognition_level              │                       │
│  │ learning_strategy_level          │                       │
│  │ goal_setting_level               │                       │
│  │ dialogue_level                   │                       │
│  │ collaboration_level              │                       │
│  │ social_perspective_level         │                       │
│  │ linguistic_intelligence          │                       │
│  │ logical_mathematical_intelligence│                       │
│  │ spatial_intelligence             │                       │
│  │ bodily_kinesthetic_intelligence  │                       │
│  │ musical_intelligence             │                       │
│  │ interpersonal_intelligence       │                       │
│  │ intrapersonal_intelligence       │                       │
│  │ naturalistic_intelligence        │                       │
│  │ dominant_intelligences (JSON)    │                       │
│  │ learning_advice                  │                       │
│  └──────────────────────────────────┘                       │
│         │                                                   │
│         │ 1                                                 │
│         ▼                                                   │
│         N                                                   │
│  ┌──────────────────────────────────┐                       │
│  │  subject_aptitude_profile        │                       │
│  │──────────────────────────────────│                       │
│  │ student_id (PK, FK)              │                       │
│  │ curriculum_id (PK, FK)           │                       │
│  │ assessment_date (PK)             │                       │
│  │ subject_specific_perspective     │                       │
│  │ core_competency_level            │                       │
│  │ content_domain_strengths (JSON)  │                       │
│  │ aptitude_type                    │                       │
│  │ aptitude_type_confidence         │                       │
│  │ subject_learning_advice          │                       │
│  └──────────────────────────────────┘                       │
│                                                             │
│  ┌──────────────────────────────────┐                       │
│  │  retrieval_practice_log          │                       │
│  │──────────────────────────────────│                       │
│  │ id (PK)                          │                       │
│  │ student_id (FK)                  │                       │
│  │ curriculum_id (FK)               │                       │
│  │ content_type                     │                       │
│  │ is_correct                       │                       │
│  │ answer_time_seconds              │                       │
│  │ hint_used                        │                       │
│  │ created_at                       │                       │
│  └──────────────────────────────────┘                       │
│                                                             │
│  ┌──────────────────────────────────┐                       │
│  │  reflection_log                  │                       │
│  │──────────────────────────────────│                       │
│  │ id (PK)                          │                       │
│  │ student_id (FK)                  │                       │
│  │ curriculum_id (FK)               │                       │
│  │ reflection_date                  │                       │
│  │ what_learned                     │                       │
│  │ what_struggled                   │                       │
│  │ what_next                        │                       │
│  │ understanding_level (1-5)        │                       │
│  │ effort_level (1-5)               │                       │
│  │ learning_emotion                 │                       │
│  │ created_at                       │                       │
│  └──────────────────────────────────┘                       │
│                                                             │
│  ┌──────────────────────────────────┐                       │
│  │  collaboration_log               │                       │
│  │──────────────────────────────────│                       │
│  │ id (PK)                          │                       │
│  │ student_id (FK)                  │                       │
│  │ curriculum_id (FK)               │                       │
│  │ activity_date                    │                       │
│  │ activity_type                    │                       │
│  │ speaking_count                   │                       │
│  │ question_count                   │                       │
│  │ help_given_count                 │                       │
│  │ help_received_count              │                       │
│  │ peer_rating                      │                       │
│  │ teacher_notes                    │                       │
│  │ created_at                       │                       │
│  └──────────────────────────────────┘                       │
│                                                             │
│  ┌──────────────────────────────────┐                       │
│  │  social_connection_log           │                       │
│  │──────────────────────────────────│                       │
│  │ id (PK)                          │                       │
│  │ student_id (FK)                  │                       │
│  │ activity_date                    │                       │
│  │ connection_type (community/...)  │                       │
│  │ activity_title                   │                       │
│  │ activity_description             │                       │
│  │ related_sdgs (JSON)              │                       │
│  │ learning_outcomes                │                       │
│  │ created_at                       │                       │
│  └──────────────────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 主要テーブル定義

#### 3.2.1 統合プロファイルテーブル

```sql
CREATE TABLE IF NOT EXISTS student_profile_integrated (
  student_id INTEGER NOT NULL,
  assessment_date DATE NOT NULL,
  
  -- 軸1: 資質・能力の3つの柱（5段階）
  knowledge_skill_level INTEGER CHECK(knowledge_skill_level BETWEEN 1 AND 5),
  thinking_expression_level INTEGER CHECK(thinking_expression_level BETWEEN 1 AND 5),
  learning_attitude_level INTEGER CHECK(learning_attitude_level BETWEEN 1 AND 5),
  
  -- 軸2: 横断的基盤（5段階）
  metacognition_level INTEGER CHECK(metacognition_level BETWEEN 1 AND 5),
  learning_strategy_level INTEGER CHECK(learning_strategy_level BETWEEN 1 AND 5),
  goal_setting_level INTEGER CHECK(goal_setting_level BETWEEN 1 AND 5),
  dialogue_level INTEGER CHECK(dialogue_level BETWEEN 1 AND 5),
  collaboration_level INTEGER CHECK(collaboration_level BETWEEN 1 AND 5),
  social_perspective_level INTEGER CHECK(social_perspective_level BETWEEN 1 AND 5),
  
  -- 軸4: MI理論（8種の知能、1-10スケール）
  linguistic_intelligence INTEGER CHECK(linguistic_intelligence BETWEEN 1 AND 10),
  logical_mathematical_intelligence INTEGER CHECK(logical_mathematical_intelligence BETWEEN 1 AND 10),
  spatial_intelligence INTEGER CHECK(spatial_intelligence BETWEEN 1 AND 10),
  bodily_kinesthetic_intelligence INTEGER CHECK(bodily_kinesthetic_intelligence BETWEEN 1 AND 10),
  musical_intelligence INTEGER CHECK(musical_intelligence BETWEEN 1 AND 10),
  interpersonal_intelligence INTEGER CHECK(interpersonal_intelligence BETWEEN 1 AND 10),
  intrapersonal_intelligence INTEGER CHECK(intrapersonal_intelligence BETWEEN 1 AND 10),
  naturalistic_intelligence INTEGER CHECK(naturalistic_intelligence BETWEEN 1 AND 10),
  
  -- 統合分析結果
  dominant_intelligences TEXT, -- JSON: ["対人的", "言語的", "内省的"]
  overall_profile_summary TEXT,
  learning_advice TEXT,
  confidence_score REAL CHECK(confidence_score BETWEEN 0.0 AND 1.0),
  
  -- メタデータ
  data_source TEXT, -- 'initial_diagnosis', 'monthly_update', 'semester_review'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (student_id, assessment_date),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- インデックス作成
CREATE INDEX idx_profile_student_date ON student_profile_integrated(student_id, assessment_date DESC);
CREATE INDEX idx_profile_date ON student_profile_integrated(assessment_date);
```

#### 3.2.2 教科別適性プロファイルテーブル

```sql
CREATE TABLE IF NOT EXISTS subject_aptitude_profile (
  student_id INTEGER NOT NULL,
  curriculum_id INTEGER NOT NULL,
  assessment_date DATE NOT NULL,
  
  -- 軸3: 教科固有要素
  subject_specific_perspective TEXT, -- 教科の「見方・考え方」の発揮度
  core_competency_level INTEGER CHECK(core_competency_level BETWEEN 1 AND 5),
  content_domain_strengths TEXT, -- JSON: {"話す聞く": 4, "書く": 3, "読む": 5}
  
  -- 適性タイプ
  aptitude_type TEXT, -- 例: "対話共感型", "論理推論型"
  aptitude_type_confidence REAL CHECK(aptitude_type_confidence BETWEEN 0.0 AND 1.0),
  
  -- 学習推奨
  recommended_activities TEXT, -- JSON: ["読書会", "インタビュー学習"]
  avoid_activities TEXT, -- JSON: ["孤独な暗記"]
  subject_learning_advice TEXT,
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (student_id, curriculum_id, assessment_date),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id)
);

-- インデックス作成
CREATE INDEX idx_subject_profile_student ON subject_aptitude_profile(student_id, curriculum_id, assessment_date DESC);
```

#### 3.2.3 診断履歴テーブル

```sql
CREATE TABLE IF NOT EXISTS diagnosis_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  diagnosis_type TEXT CHECK(diagnosis_type IN ('initial', 'monthly', 'unit', 'semester')),
  diagnosis_date DATE NOT NULL,
  
  -- 診断に使用したデータ期間
  data_period_start DATE,
  data_period_end DATE,
  
  -- 診断結果のスナップショット
  profile_snapshot TEXT, -- JSON: 全プロファイルデータ
  
  -- 前回診断との差分
  changes_detected TEXT, -- JSON: {"linguistic_intelligence": "+1", "collaboration_level": "+2"}
  growth_summary TEXT, -- 成長のサマリー
  
  -- AI分析結果
  ai_analysis TEXT,
  ai_recommendations TEXT, -- JSON配列
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- インデックス作成
CREATE INDEX idx_diagnosis_student_date ON diagnosis_history(student_id, diagnosis_date DESC);
CREATE INDEX idx_diagnosis_type ON diagnosis_history(diagnosis_type, diagnosis_date DESC);
```

---

## 4. 診断アルゴリズム

### 4.1 初期診断アルゴリズム

```
┌────────────────────────────────────────────────────────────┐
│              初期診断アルゴリズム（学年開始時）             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  INPUT: 新規生徒情報（学年、前年度データなし）             │
│                                                            │
│  STEP 1: 包括的診断テスト実施                              │
│    FOR EACH 主要教科 IN [国語, 算数, 理科, 社会]:          │
│      ├─ 4軸評価問題を出題（各教科5-10問）                 │
│      ├─ 解答データ収集（正答、解法、時間）                 │
│      └─ 回答から4軸スコア算出                             │
│                                                            │
│  STEP 2: MI理論による知能プロファイル推定                  │
│    FOR EACH 知能タイプ IN [言語的, 論理数学的, ...]:       │
│      ├─ 複数教科の結果から推定                            │
│      │   例: 国語の成績 + 外国語の成績 → 言語的知能       │
│      │       算数の成績 + 理科の成績 → 論理数学的知能     │
│      └─ 各知能スコア（1-10）を算出                        │
│                                                            │
│  STEP 3: 適性タイプの仮判定                                │
│    FOR EACH 教科:                                          │
│      ├─ 上位3つの優位知能を特定                           │
│      ├─ 適性タイプマトリクスから該当タイプ検索            │
│      └─ 信頼度スコア算出（初期は0.3-0.5程度）             │
│                                                            │
│  STEP 4: 初期プロファイル作成                              │
│    CREATE student_profile_integrated:                      │
│      ├─ 軸1スコア（3つの柱）                              │
│      ├─ 軸2スコア（横断的基盤）: 初期は中程度            │
│      ├─ 軸4スコア（MI理論）                               │
│      └─ data_source = 'initial_diagnosis'                 │
│                                                            │
│  STEP 5: 初期学習推奨生成                                  │
│    CALL AI API (Gemini):                                   │
│      INPUT: 初期プロファイル                               │
│      OUTPUT: 学習推奨リスト、注意点                        │
│                                                            │
│  OUTPUT: 初期4軸プロファイル + 適性タイプ + 学習推奨       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4.2 月次更新アルゴリズム

```
┌────────────────────────────────────────────────────────────┐
│          月次プロファイル更新アルゴリズム                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  INPUT: 過去1ヶ月の学習データ                              │
│         前回プロファイル                                   │
│                                                            │
│  STEP 1: データ収集                                        │
│    COLLECT FROM database:                                  │
│      ├─ retrieval_practice_log: 正答率、時間、ヒント      │
│      ├─ reflection_log: 振り返り記述                      │
│      ├─ collaboration_log: 協働学習記録                   │
│      └─ social_connection_log: 社会接続活動               │
│                                                            │
│  STEP 2: 量的データ分析                                    │
│    FOR EACH 教科:                                          │
│      ├─ 正答率の推移分析                                  │
│      │   → 軸1（知識・技能）スコア更新                   │
│      ├─ 解答時間の分析                                    │
│      │   → 軸1（技能の自動化度）推定                     │
│      ├─ ヒント使用頻度                                    │
│      │   → 軸2（自己調整能力）推定                       │
│      └─ 問題タイプ別パフォーマンス                        │
│          → 軸4（MI）推定の補強                            │
│                                                            │
│  STEP 3: 質的データ分析（AI）                              │
│    CALL Gemini API:                                        │
│      INPUT:                                                │
│        ├─ 振り返りテキスト（過去1ヶ月分）                 │
│        ├─ 教師の観察メモ                                  │
│        └─ 前回プロファイル                                │
│      PROMPT:                                               │
│        「以下の振り返り記述から、生徒の学びの特徴を       │
│         4軸で分析してください。                           │
│         特に以下の点に注目：                              │
│         - メタ認知的表現（"分からなかった"等）           │
│         - 学習方略の工夫（"図を描いた"等）               │
│         - 協働への言及（"友達と話した"等）               │
│         - 社会への関心（"環境問題"等）」                 │
│      OUTPUT:                                               │
│        ├─ 軸2（横断的基盤）の各要素評価                  │
│        └─ 成長の兆候の検出                                │
│                                                            │
│  STEP 4: 協働性の評価                                      │
│    IF collaboration_log.count > 0:                         │
│      ├─ 発言回数・質問回数から対話力評価                  │
│      ├─ ピア評価スコアから協働性評価                      │
│      └─ 軸2（協働性）スコア更新                           │
│                                                            │
│  STEP 5: 社会接続の評価                                    │
│    IF social_connection_log.count > 0:                     │
│      ├─ 活動参加回数                                      │
│      ├─ 活動タイプ（地域/キャリア/SDGs）                  │
│      └─ 軸2（社会接続）スコア更新                         │
│                                                            │
│  STEP 6: プロファイル統合更新                              │
│    NEW_PROFILE = MERGE(前回プロファイル, 今回分析結果):   │
│      ├─ 加重平均（前回70% + 今回30%）                     │
│      ├─ ただし明確な成長は即座に反映                      │
│      └─ 信頼度スコアを徐々に上昇（+0.1程度）             │
│                                                            │
│  STEP 7: 変化検出と成長分析                                │
│    CHANGES = DETECT_CHANGES(前回, 新):                     │
│      IF スコア変化 > 閾値:                                │
│        ├─ 成長検出: "協働性が向上しました"               │
│        └─ アラート生成: "注意が必要な低下"               │
│                                                            │
│  STEP 8: 学習推奨の更新                                    │
│    CALL AI API (Gemini):                                   │
│      INPUT: 新プロファイル + 変化情報                      │
│      OUTPUT: 更新された学習推奨、新しいアドバイス         │
│                                                            │
│  STEP 9: データベース保存                                  │
│    INSERT INTO student_profile_integrated (...);           │
│    INSERT INTO diagnosis_history (...);                    │
│                                                            │
│  OUTPUT: 更新されたプロファイル + 成長レポート             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4.3 適性タイプ判定アルゴリズム

```python
# 疑似コード: 適性タイプ判定

def determine_aptitude_type(subject, mi_profile, performance_data):
    """
    教科と知能プロファイルから適性タイプを判定
    
    Args:
        subject: str - 教科名（"国語", "算数"等）
        mi_profile: dict - 8種の知能スコア
        performance_data: dict - 学習パフォーマンスデータ
    
    Returns:
        dict: {
            "aptitude_type": str,
            "confidence": float,
            "reasoning": str
        }
    """
    
    # STEP 1: 優位知能の特定
    sorted_intelligences = sorted(
        mi_profile.items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    top3_intelligences = sorted_intelligences[:3]
    
    # STEP 2: 教科別適性タイプマッチング
    aptitude_patterns = load_aptitude_patterns(subject)
    
    best_match = None
    best_score = 0
    
    for pattern in aptitude_patterns:
        # パターンマッチングスコア計算
        match_score = 0
        
        # 優位知能の一致度
        for intel_name, intel_score in top3_intelligences:
            if intel_name in pattern["required_intelligences"]:
                weight = pattern["intelligence_weights"][intel_name]
                match_score += intel_score * weight
        
        # パフォーマンスデータとの整合性チェック
        if check_performance_consistency(
            performance_data, 
            pattern["expected_behaviors"]
        ):
            match_score *= 1.2  # ボーナス
        
        if match_score > best_score:
            best_score = match_score
            best_match = pattern
    
    # STEP 3: 信頼度計算
    confidence = calculate_confidence(
        best_score, 
        data_amount=len(performance_data),
        observation_period=months_elapsed
    )
    
    # STEP 4: 判定理由の生成
    reasoning = generate_reasoning(
        best_match, 
        top3_intelligences, 
        performance_data
    )
    
    return {
        "aptitude_type": best_match["type_name"],
        "confidence": confidence,
        "reasoning": reasoning
    }

# 適性パターンの定義例（国語）
JAPANESE_APTITUDE_PATTERNS = [
    {
        "type_name": "対話共感型",
        "required_intelligences": ["linguistic", "interpersonal", "intrapersonal"],
        "intelligence_weights": {
            "linguistic": 0.4,
            "interpersonal": 0.4,
            "intrapersonal": 0.2
        },
        "expected_behaviors": [
            "読書会での積極的発言",
            "登場人物の心情理解が高い正答率",
            "振り返りに対話への言及"
        ]
    },
    {
        "type_name": "論理分析型",
        "required_intelligences": ["linguistic", "logical_mathematical"],
        "intelligence_weights": {
            "linguistic": 0.5,
            "logical_mathematical": 0.5
        },
        "expected_behaviors": [
            "論説文の正答率が高い",
            "文章構造の分析が得意",
            "振り返りに論理的記述"
        ]
    },
    # ... 他のタイプ
]
```

### 4.4 AI分析プロンプト設計

```yaml
# Gemini API用プロンプトテンプレート

system_message: |
  あなたは教育心理学の専門家です。
  生徒の学習データから、4軸（3つの柱、横断的基盤、教科固有、MI理論）
  でプロファイルを更新してください。

user_message_template: |
  以下の生徒の過去1ヶ月の学習データを分析してください。
  
  【生徒情報】
  - 学年: {grade}
  - 前回プロファイル: {previous_profile}
  
  【学習履歴データ】
  - 学習時間: {total_hours}時間
  - 正答率: {accuracy_rate}%
  - 問題タイプ別パフォーマンス:
    {problem_type_performance}
  
  【振り返り記述（過去4週分）】
  {reflection_texts}
  
  【協働学習記録】
  - 発言回数: {speaking_count}回
  - 質問回数: {question_count}回
  - ピア評価: {peer_rating}/5.0
  
  【社会接続活動】
  {social_activities}
  
  【分析指示】
  以下の観点で分析し、JSON形式で出力してください：
  
  1. 軸1（3つの柱）の各要素を5段階評価
  2. 軸2（横断的基盤）の各要素を5段階評価
  3. 軸4（MI理論）の8種の知能を1-10で評価
  4. 前回からの変化・成長の検出
  5. 学習推奨の更新
  
  【出力形式】
  ```json
  {
    "axis1": {
      "knowledge_skill_level": 数値,
      "reasoning": "評価理由"
    },
    "axis2": {
      "metacognition_level": 数値,
      "reasoning": "評価理由"
    },
    "axis4": {
      "linguistic_intelligence": 数値,
      ...
    },
    "changes_detected": [
      "変化1の説明",
      "変化2の説明"
    ],
    "growth_summary": "成長の総括",
    "recommendations": [
      "推奨1",
      "推奨2"
    ]
  }
  ```

output_schema:
  type: object
  properties:
    axis1:
      type: object
      properties:
        knowledge_skill_level:
          type: integer
          minimum: 1
          maximum: 5
        thinking_expression_level:
          type: integer
          minimum: 1
          maximum: 5
        learning_attitude_level:
          type: integer
          minimum: 1
          maximum: 5
        reasoning:
          type: string
    axis2:
      type: object
      properties:
        metacognition_level:
          type: integer
          minimum: 1
          maximum: 5
        # ... 他の要素
    axis4:
      type: object
      properties:
        linguistic_intelligence:
          type: integer
          minimum: 1
          maximum: 10
        # ... 8種すべて
    changes_detected:
      type: array
      items:
        type: string
    growth_summary:
      type: string
    recommendations:
      type: array
      items:
        type: string
```

---

## 5. API設計

### 5.1 API エンドポイント一覧

| メソッド | エンドポイント | 説明 | 権限 |
|---------|---------------|------|------|
| **診断関連** |
| POST | /api/diagnosis/initial/:studentId | 初期診断実施 | 教師 |
| POST | /api/diagnosis/monthly/:studentId | 月次プロファイル更新 | システム自動 |
| GET | /api/diagnosis/profile/:studentId | 最新プロファイル取得 | 生徒/教師/保護者 |
| GET | /api/diagnosis/history/:studentId | 診断履歴取得 | 教師/保護者 |
| **学習データ収集** |
| POST | /api/learning/practice-log | 学習履歴記録 | システム自動 |
| POST | /api/learning/reflection | 振り返り記録 | 生徒 |
| POST | /api/learning/collaboration | 協働学習記録 | 教師 |
| POST | /api/learning/social-activity | 社会接続活動記録 | 生徒/教師 |
| **推奨関連** |
| GET | /api/recommendation/learning-activities/:studentId/:subject | 学習活動推奨 | 生徒/教師 |
| GET | /api/recommendation/materials/:studentId/:subject | 教材推奨 | 生徒/教師 |
| POST | /api/recommendation/feedback | フィードバック生成 | システム |
| **レポート生成** |
| GET | /api/report/student/:studentId | 生徒向けレポート | 生徒 |
| GET | /api/report/teacher/:studentId | 教師向けレポート | 教師 |
| GET | /api/report/parent/:studentId | 保護者向けレポート | 保護者 |
| GET | /api/report/pdf/:studentId/:type | PDFレポート生成 | 全ユーザー |

### 5.2 主要APIの詳細仕様

#### 5.2.1 月次プロファイル更新API

```typescript
// POST /api/diagnosis/monthly/:studentId

interface MonthlyUpdateRequest {
  studentId: number;
  targetMonth: string; // YYYY-MM
  forceUpdate?: boolean; // 強制更新フラグ
}

interface MonthlyUpdateResponse {
  success: boolean;
  data: {
    profile: StudentProfileIntegrated;
    changes: ProfileChanges[];
    growthSummary: string;
    recommendations: Recommendation[];
    confidence: number;
  };
  metadata: {
    dataSource: {
      learningLogs: number;
      reflections: number;
      collaborations: number;
      socialActivities: number;
    };
    processingTime: number; // ms
    aiAnalysisUsed: boolean;
  };
}

interface ProfileChanges {
  dimension: string; // "linguistic_intelligence", "collaboration_level"等
  previousValue: number;
  newValue: number;
  change: number;
  significance: "major" | "moderate" | "minor";
  explanation: string;
}

interface Recommendation {
  type: "learning_activity" | "study_method" | "attention_point";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionItems: string[];
}

// 実装例
export default {
  async fetch(request, env, ctx) {
    const app = new Hono<{ Bindings: Bindings }>();
    
    app.post('/api/diagnosis/monthly/:studentId', async (c) => {
      const studentId = parseInt(c.req.param('studentId'));
      const { targetMonth, forceUpdate } = await c.req.json();
      
      // STEP 1: データ収集
      const learningData = await collectLearningData(
        c.env.DB, 
        studentId, 
        targetMonth
      );
      
      // STEP 2: 前回プロファイル取得
      const previousProfile = await getPreviousProfile(
        c.env.DB, 
        studentId
      );
      
      // STEP 3: 分析実行
      const analysis = await analyzeWithAI(
        c.env, 
        learningData, 
        previousProfile
      );
      
      // STEP 4: プロファイル更新
      const newProfile = await updateProfile(
        c.env.DB, 
        studentId, 
        analysis
      );
      
      // STEP 5: 変化検出
      const changes = detectChanges(previousProfile, newProfile);
      
      // STEP 6: 推奨生成
      const recommendations = await generateRecommendations(
        c.env, 
        newProfile, 
        changes
      );
      
      return c.json({
        success: true,
        data: {
          profile: newProfile,
          changes: changes,
          growthSummary: analysis.growthSummary,
          recommendations: recommendations,
          confidence: newProfile.confidence_score
        },
        metadata: {
          dataSource: {
            learningLogs: learningData.logs.length,
            reflections: learningData.reflections.length,
            collaborations: learningData.collaborations.length,
            socialActivities: learningData.socialActivities.length
          },
          processingTime: Date.now() - startTime,
          aiAnalysisUsed: true
        }
      });
    });
    
    return app.fetch(request, env, ctx);
  }
};
```

---

## 6. フロントエンド設計

### 6.1 生徒用ダッシュボード

```
┌────────────────────────────────────────────────────────────┐
│            あなたの学びダッシュボード                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  【あなたの強み】⭐                                         │
│  ┌──────────────────────────────────────────────┐         │
│  │ あなたは「対話共感型」の学び方が得意です！    │         │
│  │                                              │         │
│  │ 🎯 優位な知能:                               │         │
│  │   • 言語的知能  ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10)        │         │
│  │   • 対人的知能  ⭐⭐⭐⭐⭐⭐⭐⭐⭐ (9/10)      │         │
│  │   • 内省的知能  ⭐⭐⭐⭐⭐⭐⭐ (7/10)          │         │
│  │                                              │         │
│  │ 💡 こんな学び方がおすすめ:                   │         │
│  │   ✓ 友達と話し合いながら学ぶ                │         │
│  │   ✓ 読書会に参加する                        │         │
│  │   ✓ 自分の言葉で説明してみる                │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  【今月の成長】📈                                           │
│  ┌──────────────────────────────────────────────┐         │
│  │ 協働性レベル: 3 → 4 に成長！ 🎉            │         │
│  │                                              │         │
│  │ グループ活動で積極的に発言できるように       │         │
│  │ なりましたね。友達の意見もよく聞けて        │         │
│  │ います。素晴らしい！                        │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  【次にやってみよう】🎯                                     │
│  ┌──────────────────────────────────────────────┐         │
│  │ ☐ 今週の読書会でリーダー役に挑戦           │         │
│  │ ☐ 学習日記で「つまずきポイント」を記録     │         │
│  │ ☐ 算数の問題を友達に説明してみる           │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  【学習の記録】📊                                           │
│  ┌──────────────────────────────────────────────┐         │
│  │ 今月の学習時間: 12時間                      │         │
│  │ 理解度: ⭐⭐⭐⭐☆ (4/5)                     │         │
│  │ がんばり度: ⭐⭐⭐⭐⭐ (5/5)                 │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 6.2 教師用ダッシュボード

```
┌────────────────────────────────────────────────────────────┐
│          生徒プロファイル：田中 太郎（小5）                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  【4軸プロファイル】                                        │
│  ┌──────────────────────────────────────────────┐         │
│  │ 軸1: 資質・能力の3つの柱                     │         │
│  │   知識・技能        ████░░ (4/5)             │         │
│  │   思考・判断・表現  ███░░░ (3/5)             │         │
│  │   学びに向かう力    █████░ (5/5)             │         │
│  │                                              │         │
│  │ 軸2: 横断的基盤                              │         │
│  │   自己調整能力      ███░░░ (3/5)             │         │
│  │   協働性            ████░░ (4/5) ⬆ +1       │         │
│  │   社会接続          █████░ (5/5)             │         │
│  │                                              │         │
│  │ 軸4: MI理論                                  │         │
│  │   言語的    ████████░░ (8/10)                │         │
│  │   対人的    █████████░ (9/10)                │         │
│  │   内省的    ███████░░░ (7/10)                │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  【適性タイプ】                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │ 国語: 対話共感型（信頼度: 0.85）             │         │
│  │ 算数: 協働学習型（信頼度: 0.72）             │         │
│  │ 理科: 協働実験型（信頼度: 0.68）             │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  【指導のポイント】                                         │
│  ┌──────────────────────────────────────────────┐         │
│  │ ✅ 効果的な指導法:                           │         │
│  │   • グループ討論を積極的に取り入れる        │         │
│  │   • ペア学習でリーダー役を任せる            │         │
│  │   • 振り返り活動を重視                      │         │
│  │                                              │         │
│  │ ⚠️ 注意点:                                   │         │
│  │   • 自己調整能力がやや弱い                  │         │
│  │   • 学習計画の立案支援が必要                │         │
│  │   • つまずきの自己分析を促す質問を          │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
│  【最近の変化】                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │ • 協働性が向上（3→4）                       │         │
│  │ • グループ活動での発言が増加                │         │
│  │ • ボランティア活動に継続参加                │         │
│  └──────────────────────────────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 7. 実装ロードマップ

### 7.1 フェーズ1：基盤構築（1-2ヶ月）

| タスク | 内容 | 優先度 | 工数 |
|--------|------|--------|------|
| データベース設計 | テーブル作成、マイグレーション | 高 | 1週間 |
| 基本API実装 | 学習ログ記録、プロファイル取得 | 高 | 2週間 |
| 初期診断機能 | 診断テスト作成、採点ロジック | 高 | 2週間 |
| 基本UI実装 | ダッシュボード、プロファイル表示 | 中 | 2週間 |

### 7.2 フェーズ2：AI分析統合（2-3ヶ月）

| タスク | 内容 | 優先度 | 工数 |
|--------|------|--------|------|
| Gemini API統合 | プロンプト設計、API実装 | 高 | 2週間 |
| 月次更新機能 | 自動分析、プロファイル更新 | 高 | 3週間 |
| 振り返りシステム | 入力UI、テキスト分析 | 中 | 2週間 |
| 推奨エンジン | 学習活動推奨、教材マッチング | 中 | 2週間 |

### 7.3 フェーズ3：高度機能（3-4ヶ月）

| タスク | 内容 | 優先度 | 工数 |
|--------|------|--------|------|
| 適性タイプ判定 | アルゴリズム実装、信頼度計算 | 高 | 3週間 |
| レポート生成 | PDF生成、保護者向けレポート | 中 | 2週間 |
| 成長可視化 | 時系列グラフ、比較機能 | 中 | 2週間 |
| 教師支援機能 | クラス全体分析、指導推奨 | 低 | 3週間 |

---

## まとめ

本技術仕様書では、**継続的診断システム**の実装に必要なすべての要素を詳細に設計しました。

### 主要成果物

1. **システムアーキテクチャ**: フロントエンド・API・ロジック・データ層の4層構造
2. **データベース設計**: ERD、テーブル定義、インデックス設計
3. **診断アルゴリズム**: 初期診断、月次更新、適性タイプ判定の詳細
4. **API設計**: エンドポイント一覧、リクエスト/レスポンス仕様
5. **フロントエンド設計**: 生徒用・教師用ダッシュボードのUI設計
6. **実装ロードマップ**: 3フェーズ、4ヶ月の段階的実装計画

### 次のステップ

これで3つの設計文書が完成しました：
1. ✅ `educational_framework_master.md` - 4軸統合フレームワーク
2. ✅ `learning_foundation_design.md` - 学びの土台の詳細設計
3. ✅ `subject_integration_matrix.md` - 教科統合マトリクス
4. ✅ `continuous_diagnosis_system.md` - 継続診断システム技術仕様

理論的基盤が完成したので、次は**実装フェーズ**に進むことができます。
