# 12理論統合因果モデル設計書
## 自由進度学習システムの理論的根幹

**Version**: 2.0 (v4子ども観統合版)  
**Date**: 2026-02-17  
**Status**: 根幹設計（実装準備段階）

---

## Part 0: 設計思想

### 子ども観

> **子どもは今この瞬間、学んでいる。**
>
> 12の学習理論は、子どもの「学んでいる姿」を見つめるための12の視座である。
> 理解していれば、応じ方は自ずと見える。
>
> — UNIFIED_PRINCIPLE_v4.md

### なぜ統合モデルが必要か

子どもの学びは一つの営みである。しかし、その営みを理解する視座は12ある。一つの視座だけで子どもを見ると、見えないものがある。

例：ユウキが分数の問題で 1/3 + 1/4 = 2/7 と答えた場面。
- F7（足場）の視座で見ると：この子は手を伸ばしている。あと少しで届く。
- F12（感情）の視座で見ると：間違えて少し不安になっている。
- F1（受け取り方）の視座で見ると：図があれば理解が進む子なのに、今は文字だけ。
- F8（求めているもの）の視座で見ると：有能感が揺らいでいる。

これらは**別々に見えるのではなく、一人の子どもの一つの瞬間に同時に存在する**。
12の視座を統合して見つめなければ、この子の「今」は理解できない。

本設計書は、12の視座をどう統合して子どもを理解し、理解に基づいてどう応じるかを定義する。

### Carroll モデルの位置づけ（v4における再定義）

Carroll (1963) の学校学習モデルは、本システムでは**子どもの学びのリズムを理解する道具**として使う。

```
教師/AI視点:  有効学習時間 / 必要学習時間 → 効率の最大化
子ども視点:   「今日は集中できたな」と「この問題は時間がかかるんだな」

v4 での位置づけ:
  「誰にとっても同じ時間で学べるわけではない」
  「自分のペースがあっていい」
  を理解するための道具。効率の道具ではなく、自己理解の道具。
```

技術的には Carroll の枠組みを使うが、その意味は「効率の最大化」ではなく「この子の学びのリズムの理解」である。

---

## Part 1: 上位フレームワーク — Carroll学校学習モデルの拡張

### 1.1 Carrollの原典モデル（1963）

```
学習到達度 = f( 学習に費やした時間 / 学習に必要な時間 )
```

Carroll は5変数を定義した：

| 変数 | 定義 | 影響方向 |
|---|---|---|
| **適性 (Aptitude)** | 最適条件下で学習に必要な時間量 | 必要時間を決定 |
| **指導の質 (Quality of Instruction)** | 指導が学習者にとって最適に組織化されている度合い | 必要時間を減少 |
| **指導理解力 (Ability to Understand Instruction)** | 学習者が指導から意味を抽出する能力 | 必要時間を減少 |
| **忍耐力 (Perseverance)** | 学習者が学習に費やす意思のある時間量 | 費やす時間を増加 |
| **学習機会 (Opportunity to Learn)** | 学習に使用可能な時間量 | 費やす時間の上限 |

### 1.2 自由進度学習への拡張モデル

自由進度学習では**学習機会（時間の上限）は固定**（授業枠）であり、**個別に変化するのは必要時間と費やす時間の比率**である。これを拡張する：

```
学習到達度 = Σ_t [ 有効学習時間(t) / 必要学習時間(t) ]

必要学習時間(t) = f( 課題の固有難度, 学習者の適性, 指導の質, 指導理解力 )
有効学習時間(t) = g( 忍耐力, 集中度, 方略の適切さ, 感情状態 )
```

### 1.3 12理論の Carroll変数への作用マッピング

**これが本設計の核心である。** 各理論は Carroll の変数を「どのように改善するか」を通じて学習到達度に寄与する。

```
┌─────────────────────────────────────────────────────────┐
│                Carroll 拡張モデル                          │
│                                                           │
│  学習到達度 = 有効学習時間 / 必要学習時間                    │
│                                                           │
│  ┌─── 必要学習時間を減少させる理論 ───┐                     │
│  │  F1 (VARK)      → 認知負荷の最適化  │                   │
│  │  F2 (MI)        → 概念への入口の多様化│                   │
│  │  F3 (Kolb)      → 理解の深化・転移   │                   │
│  │  F4 (ATI)       → 指導×適性の最適化  │                   │
│  │  F6 (Cognitive)  → 記憶効率の最大化   │                   │
│  │  F7 (Scaffold)   → 難易度ギャップの橋渡し│                │
│  │  F10(Domain)     → 領域知識の構造化   │                   │
│  └────────────────────────────────────┘                   │
│                                                           │
│  ┌─── 有効学習時間を増加させる理論 ───┐                     │
│  │  F5 (SRL)       → 方略的学習行動     │                   │
│  │  F8 (SDT)       → 内発的動機→忍耐力  │                   │
│  │  F9 (21C)       → メタ認知→集中度    │                   │
│  │  F11(Authentic)  → 意味づけ→忍耐力   │                   │
│  │  F12(NeuroAffect)→ 感情調整→集中度   │                   │
│  └────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

---

## Part 2: 12理論の精密定義 — 原典に基づく操作変数と測定変数

### F1: 感覚チャネル最適化理論（旧: 戦略的学習様式理論）

**理論的根拠の誠実な整理:**
- Pashler et al. (2008) は meshing hypothesis（学習スタイルに合わせると学習効果が上がる）を否定した
- **しかし**、Mayer (2009, d=0.72) のマルチメディア学習原理は堅固：モダリティ効果、冗長性効果は再現されている
- 本システムでは「スタイルに合わせる」のではなく「**優位チャネルで入口を作り、別チャネルで多重符号化する**」(Paivio, 1986, dual coding theory)

**測定変数（4次元ベクトル、合計100%に正規化しない）:**
```typescript
interface F1_SensoryProfile {
  visual_processing_efficiency: number    // 0-100: 視覚情報の処理効率
  auditory_processing_efficiency: number  // 0-100: 聴覚情報の処理効率  
  reading_processing_efficiency: number   // 0-100: テキスト情報の処理効率
  kinesthetic_processing_efficiency: number // 0-100: 身体感覚の処理効率
  multimodal_index: number               // マルチモーダル度（複数チャネルの活用度）
}
```

**操作変数（AIが制御するパラメータ）:**
```typescript
interface F1_Controls {
  entry_channel: 'visual' | 'auditory' | 'reading' | 'kinesthetic'  // 導入チャネル
  encoding_channels: string[]  // 多重符号化に使う追加チャネル（entry以外を1-2個）
  visual_weight: number   // 0.0-1.0: コンテンツの視覚比率
  auditory_weight: number // 0.0-1.0: コンテンツの聴覚比率
  text_weight: number     // 0.0-1.0: コンテンツのテキスト比率
  kinesthetic_weight: number // 0.0-1.0: コンテンツの体験比率
}
```

**Carroll作用**: 必要学習時間を減少（認知負荷の最適化 → 処理効率向上）

---

### F2: 多元的入口理論（旧: 統合的能力発達理論）

**理論的根拠の誠実な整理:**
- Gardner & Moran (2007) は MI を「スタイル」ではなく「概念への複数の入口 (multiple entry points)」と再定義
- Waterhouse (2006) の批判（神経生物学的根拠の不足）は妥当
- **活用法**: 一つの概念を理解する際に、行き詰まったら**別の知能チャネルから再アプローチする**

**測定変数（8知能プロファイル + 成長マインドセット）:**
```typescript
interface F2_IntelligenceProfile {
  linguistic: number          // 0-100: 言語的入口の利用しやすさ
  logical_mathematical: number // 0-100: 論理数学的入口
  spatial: number             // 0-100: 空間的入口
  bodily_kinesthetic: number  // 0-100: 身体運動的入口
  musical: number             // 0-100: 音楽的入口
  interpersonal: number       // 0-100: 対人的入口
  intrapersonal: number       // 0-100: 内省的入口
  naturalist: number          // 0-100: 博物学的入口
  growth_mindset: number      // 0-100: Dweck (2006) 成長マインドセット
}
```

**操作変数:**
```typescript
interface F2_Controls {
  primary_entry_intelligence: string    // 最初に使う入口
  fallback_intelligence: string         // 行き詰まり時の代替入口
  concept_representation_mode: string   // 概念の表現形式
  growth_mindset_message_type: 'process_praise' | 'effort_praise' | 'strategy_praise'
}
```

**Carroll作用**: 必要学習時間を減少（概念への複数入口 → 理解の多角化）

---

### F3: 経験変容学習理論（旧: 深化的経験学習理論）

**理論的根拠:**
- Kolb (1984): 学習は経験の変容（transformation of experience）
- 4段階サイクル: 具体的経験(CE) → 省察的観察(RO) → 抽象的概念化(AC) → 能動的実験(AE)
- **核心**: 好みの段階を入口にしつつ、**4段階すべてを必ず経由させる**（部分的経験では学習が不完全）

**測定変数:**
```typescript
interface F3_ExperientialProfile {
  ce_preference: number  // 0-100: 具体的経験への好み
  ro_preference: number  // 0-100: 省察的観察への好み
  ac_preference: number  // 0-100: 抽象的概念化への好み
  ae_preference: number  // 0-100: 能動的実験への好み
  cycle_completion_rate: number  // 0-1: サイクル完走率（4段階すべて経験した比率）
  dominant_style: 'diverging' | 'assimilating' | 'converging' | 'accommodating'
}
```

**操作変数:**
```typescript
interface F3_Controls {
  entry_phase: 'CE' | 'RO' | 'AC' | 'AE'  // サイクルの入口
  cycle_sequence: string[]                   // 経由順序
  phase_time_allocation: { CE: number, RO: number, AC: number, AE: number }  // 各段階の時間配分
  force_full_cycle: boolean  // サイクル完走を強制するか
}
```

**Carroll作用**: 必要学習時間を減少（深い理解 → 転移可能な学習 → 再学習不要）

---

### F4: 適性×指導交互作用理論（旧: データ駆動型適応指導理論）

**理論的根拠:**
- Cronbach & Snow (1977): 学習効果は適性と指導法の**交互作用**で決まる
- 主要な交互作用: 能力×構造化度、不安×構造化度、独立性×構造化度
- **核心**: 適性変数を連続値として扱い、交互作用項をモデルに含める

**測定変数（5次元適性ベクトル）:**
```typescript
interface F4_AptitudeProfile {
  prior_knowledge: number        // 0-100: 当該単元の事前知識量
  general_cognitive_ability: number // 0-100: 一般認知能力
  anxiety_level: number          // 0-100: 学習不安レベル（高い=不安が強い）
  independence_level: number     // 0-100: 学習独立性（高い=自律的）
  locus_of_control: number       // 0-100: 統制の所在（高い=内的統制）
}
```

**操作変数（連続値、整数ではない）:**
```typescript
interface F4_Controls {
  // 構造化度: 0.0(完全自由)〜1.0(完全構造化)
  // ATI公式: structure = w1*(1 - prior_knowledge/100) + w2*(anxiety/100) + w3*(1 - independence/100)
  structure_level: number
  
  // 問題空間の自由度: structure_levelから導出
  solution_path_openness: number  // 0.0(一本道)〜1.0(多様な解法許容)
  hint_proactiveness: number      // 0.0(求められたら)〜1.0(先回り提供)
  error_tolerance: number         // 0.0(即座に訂正)〜1.0(試行錯誤許容)
}
```

**交互作用モデル（これが ATI の本質）:**
```
expected_learning = β0 
  + β1 * prior_knowledge 
  + β2 * structure_level 
  + β3 * prior_knowledge * structure_level  // ← 交互作用項（核心）
  + β4 * anxiety * structure_level          // ← 不安×構造化
  + β5 * independence * (1 - structure_level) // ← 独立性×自由度
```

**Carroll作用**: 必要学習時間を減少 + 有効学習時間を増加（指導の質 × 指導理解力の最適化）

---

### F5: 多位相自己調整学習理論（旧: 統合的自己調整学習理論）

**理論的根拠:**
- Zimmerman (2000): 3位相サイクル（予見→遂行→内省）
- Zimmerman & Kitsantas (2005): 4発達段階（観察→模倣→自己制御→自己調整）
- **核心**: SRLは「能力」ではなく「プロセス」。各位相で異なる応じ方がある。AI は Think-Aloud でモデリングを提供する。

**測定変数（3位相 × 下位過程）:**
```typescript
interface F5_SRLProfile {
  // 予見段階（Forethought）
  forethought: {
    task_analysis: number      // 0-100: 課題分析能力
    goal_setting: number       // 0-100: 目標設定能力
    strategic_planning: number // 0-100: 方略計画能力
    self_efficacy: number      // 0-100: 自己効力感
    outcome_expectation: number // 0-100: 結果期待
    intrinsic_interest: number // 0-100: 内発的興味
  }
  // 遂行段階（Performance）
  performance: {
    attention_focusing: number   // 0-100: 注意集中力
    self_instruction: number     // 0-100: 自己教示能力
    task_strategy_use: number    // 0-100: 課題方略使用
    self_monitoring: number      // 0-100: 自己モニタリング
    metacognitive_awareness: number // 0-100: メタ認知的気づき
  }
  // 内省段階（Self-Reflection）
  self_reflection: {
    self_evaluation: number     // 0-100: 自己評価能力
    causal_attribution: number  // 0-100: 適応的帰属（高い=努力帰属）
    self_satisfaction: number   // 0-100: 自己満足度
    adaptive_inference: number  // 0-100: 適応的推論（次への改善力）
  }
  // 発達段階（Zimmerman & Kitsantas, 2005）
  developmental_level: 'observation' | 'emulation' | 'self_control' | 'self_regulation'
}
```

**操作変数:**
```typescript
interface F5_Controls {
  // 各位相への応答タイプ
  forethought_scaffold: {
    goal_prompt_type: 'none' | 'template' | 'example' | 'guided'  // 目標設定支援
    planning_visibility: boolean  // 計画テンプレートの表示
    efficacy_message: string      // 自己効力感支援メッセージ
  }
  performance_scaffold: {
    think_aloud_modeling: boolean       // AIによるThink-Aloudモデリング
    self_monitoring_prompt_interval: number  // モニタリング促進の間隔（問題数）
    strategy_hint_level: 'none' | 'implicit' | 'explicit'  // 方略ヒントの明示度
  }
  reflection_scaffold: {
    reflection_prompt_type: 'none' | 'binary' | 'scaled' | 'open_ended'
    attribution_guidance: boolean  // 帰属指導（「努力」「方略」への帰属促進）
    improvement_planning: boolean  // 改善計画の作成支援
  }
  // 発達段階に応じた支援レベル
  developmental_support: {
    modeling_frequency: number  // 0.0-1.0: AIモデリングの頻度
    imitation_opportunity: boolean  // 模倣練習の機会提供
    self_control_cues: boolean     // 自己制御の手がかり提供
    full_autonomy: boolean         // 完全自律モード
  }
}
```

**Carroll作用**: 有効学習時間を劇的に増加（方略的行動 → 集中度 × 時間使用効率の最大化）

---

### F6: 条件付き認知方略理論（旧: エビデンスベースド学習方略体系）

**理論的根拠:**
- Dunlosky et al. (2013): 10方略のメタ分析。本システムは上位6方略を採用
- **核心**: 各方略には**適用条件（boundary conditions）**がある。無条件適用は逆効果になりうる。

**6方略と適用条件:**

| 方略 | 効果量 | 適用条件（前提） | 逆効果の条件 |
|---|---|---|---|
| 検索練習 | d=0.80 | 初期学習が完了している | 学習前に実施すると混乱 |
| 間隔効果 | d=0.85 | 保持期間の10-20%が最適間隔 | 間隔が短すぎると集中学習と同じ |
| 交互配置 | d=0.43 | 基礎手続きが自動化されている | 手続き未習得時は d=-0.30 (Rohrer 2012) |
| 精緻化 | d=0.75 | 既存知識ネットワークがある | 知識がない段階では認知負荷増大 |
| 具体例 | d=0.85 | 概念理解の段階にある | 手続き練習段階では不要 |
| 二重符号化 | d=0.72 | 視覚と言語の二つの経路が利用可能 | 冗長な場合は逆効果 |

**測定変数:**
```typescript
interface F6_StrategyProfile {
  retrieval_practice_readiness: number  // 0-100: 検索練習の準備度
  spacing_optimal_gap: number           // 日数: 最適間隔（保持期間から算出）
  interleaving_readiness: boolean       // 交互配置の前提条件充足
  elaboration_prior_knowledge: number   // 0-100: 精緻化の前提知識量
  mastery_level_for_current_unit: number // 0-100: 現在単元の習得度
}
```

**操作変数:**
```typescript
interface F6_Controls {
  // 検索練習の段階制御
  retrieval_mode: 'recognition' | 'cued_recall' | 'free_recall'  // 再認→手がかり再生→自由再生
  retrieval_with_feedback: boolean  // 即時フィードバックの有無（必須）
  
  // 間隔効果の動的制御
  spacing_interval_days: number  // 復習間隔（日数、保持期間×0.1〜0.2）
  spacing_schedule: 'expanding' | 'equal' | 'contracting'  // 間隔スケジュール
  
  // 交互配置の条件付き制御
  interleaving_enabled: boolean      // 前提条件を満たす場合のみtrue
  interleaving_ratio: number         // 0.0-1.0: 異なるタイプの混合比率
  
  // 精緻化の条件付き制御
  elaboration_prompt_type: 'why' | 'how' | 'compare' | 'connect' | 'none'
  elaboration_depth: 'shallow' | 'deep'  // 既存知識量に応じて調整
}
```

**条件チェッカー（これが F6 の本質）:**
```typescript
function canApplyStrategy(strategy: string, profile: F6_StrategyProfile): boolean {
  switch (strategy) {
    case 'interleaving':
      return profile.mastery_level_for_current_unit >= 70  // 基礎習得後のみ
    case 'elaboration':
      return profile.elaboration_prior_knowledge >= 40     // 最低限の既存知識
    case 'retrieval_practice':
      return profile.mastery_level_for_current_unit >= 30  // 初期学習完了後
    case 'spacing':
      return true  // 常に適用可能だが間隔は動的調整
    default:
      return true
  }
}
```

**Carroll作用**: 必要学習時間を劇的に減少（記憶効率 × 保持率の最大化）

---

### F7: 動的随伴足場理論（旧: 動的足場かけ理論）

**理論的根拠:**
- Wood, Bruner & Ross (1976): 足場かけの6機能
- Van de Pol et al. (2010): 足場かけの3原理（随伴性 contingency、フェイディング fading、責任の移行 transfer of responsibility）
- **核心**: 足場は「ヒントの量」ではなく「6つの異なる機能」であり、学習者の反応に**随伴的に**調整される

**6つの足場機能とトリガー:**

| 機能 | 定義 | AIシステムでのトリガー |
|---|---|---|
| **Recruitment** | 課題への注意喚起・興味の喚起 | 長時間アイドル、離脱兆候 |
| **Reduction of DOF** | 問題空間の縮小 | 解法の方向が定まらない |
| **Direction Maintenance** | 目標方向の維持 | 脱線、無関係な操作 |
| **Marking Critical Features** | 重要特徴の強調 | 重要部分を見落としている |
| **Frustration Control** | 挫折感の制御 | エラー連続、感情的反応 |
| **Demonstration** | 解法のモデリング | 上記すべてで改善しない場合 |

**測定変数:**
```typescript
interface F7_ScaffoldProfile {
  zpd_lower_bound: number    // 0-100: 自力到達可能な難易度
  zpd_upper_bound: number    // 0-100: 支援下で到達可能な難易度
  zpd_width: number          // 上限−下限: ZPDの幅（広い=支援効果大）
  current_performance: number // 0-100: 現在のパフォーマンス
  scaffold_dependency: number // 0-100: 足場への依存度（高い=フェイディングの時期）
  consecutive_success: number // 連続正解数（フェイディングの判断材料）
  consecutive_failure: number // 連続不正解数（足場追加の判断材料）
}
```

**操作変数:**
```typescript
interface F7_Controls {
  // 6機能の個別制御
  scaffold_functions: {
    recruitment_active: boolean        // 注意喚起の発動
    reduction_of_dof: number           // 0.0-1.0: 問題空間の縮小度
    direction_maintenance_active: boolean  // 方向維持の発動
    marking_critical_features: boolean // 重要特徴の強調
    frustration_control_active: boolean // 挫折制御の発動
    demonstration_level: 'none' | 'partial' | 'full'  // モデリングの度合い
  }
  
  // 随伴原理（contingency）の実装
  contingency_rule: {
    success_threshold: number    // 連続正解N回で足場を1段下げる
    failure_threshold: number    // 連続不正解N回で足場を1段上げる
    fade_rate: number           // 0.0-1.0: フェイディングの速度
  }
  
  // 難易度ポジショニング
  difficulty_zpd_position: number  // 0.0(ZPD下限)〜1.0(ZPD上限)
  
  // 動機付け的足場（Wood 1976 の frustration control を拡張）
  motivational_scaffold: {
    encouragement_on_error: boolean
    celebration_on_success: boolean
    soft_language: boolean          // 「〜してみよう」「〜かもしれないね」
    progress_visualization: 'self_only' | 'none'  // 自己比較のみ、他者比較なし
  }
}
```

**Carroll作用**: 必要学習時間を減少（難易度ギャップの最小化） + 有効学習時間を増加（挫折による離脱の防止）

---

### F8: 三欲求統合動機理論（旧: ウェルビーイング統合動機づけ理論）

**理論的根拠:**
- Ryan & Deci (2000): 自己決定理論（SDT）の3基本欲求
- **核心**: 自律性・有能感・関係性は**すべて同時に満たされる必要がある**。一つでも欠損すると動機づけが崩壊する。
- Reeve (2009): 自律性は「選択できる」ことではなく「行動の理由を内在化している」こと
- **自由進度学習の3つの危険**:
  1. 社会的比較による有能感の毀損（進度の可視化）
  2. 表面的自律性（選択はあるが理由の内在化がない）
  3. 個別学習による関係性の希薄化

**測定変数:**
```typescript
interface F8_MotivationProfile {
  // 3基本欲求の充足度
  autonomy_satisfaction: number      // 0-100
  competence_satisfaction: number    // 0-100
  relatedness_satisfaction: number   // 0-100
  
  // 動機づけの質（連続体: 外的→取入→同一視→統合→内発的）
  motivation_quality: 'external' | 'introjected' | 'identified' | 'integrated' | 'intrinsic'
  motivation_continuum_score: number  // 0-100: 外的(0)→内発的(100)
  
  // 危険パターンの検出
  isolated_autonomy: boolean   // 自律性高+関係性低 = 孤立
  fragile_competence: boolean  // 有能感が社会比較に依存
  surface_autonomy: boolean    // 選択はあるが理由の内在化なし
}
```

**操作変数:**
```typescript
interface F8_Controls {
  // 自律性支援（表面的選択ではなく理由の内在化）
  autonomy_support: {
    choice_with_rationale: boolean     // 選択肢に「なぜこれを学ぶか」を添える
    self_pacing_visualization: 'self_growth' | 'none'  // 自己成長軌跡のみ
    language_style: 'inviting' | 'directive'  // 「〜してみよう」vs「〜しなさい」
  }
  
  // 有能感支援（社会比較の排除）
  competence_support: {
    progress_comparison: 'self_only'     // 過去の自分との比較のみ
    mastery_criteria: 'absolute'         // 絶対基準（相対評価禁止）
    challenge_level: 'zpd_optimal'       // ZPD最適位置（成功率65-85%）
    micro_success_feedback: boolean      // 小さな成功の即時フィードバック
  }
  
  // 関係性支援（個別学習での関係性維持）
  relatedness_support: {
    teacher_async_feedback: boolean      // 教師の非同期フィードバック
    peer_sharing_opportunity: boolean    // 学びの共有機会
    ai_warm_interaction: boolean         // AIの温かいインタラクション
    community_contribution: boolean      // 学びを通じた貢献感
  }
}
```

**Carroll作用**: 有効学習時間を増加（内発的動機 → 忍耐力 → 集中の持続）

---

### F9: メタ認知的コンピテンシー理論（旧: 21世紀型コンピテンシー理論）

**操作変数:**
```typescript
interface F9_Controls {
  metacognitive_prompts: boolean       // メタ認知を促すプロンプト
  problem_solving_scaffold: 'structured' | 'semi' | 'open'
  creative_thinking_opportunity: boolean
  critical_evaluation_prompt: boolean
}
```

**Carroll作用**: 有効学習時間を増加（メタ認知 → 方略の適切さ → 集中度向上）

---

### F10: 領域固有認知構造理論（旧: 領域固有認知発達理論）

**理論的根拠:**
- Chi et al. (1981, d=0.92): 専門家と初心者の違いは領域固有知識の構造化にある
- **核心**: 各教科には固有の「見方・考え方」があり、それを意識的に使えるようになることが深い学習

**操作変数:**
```typescript
interface F10_Controls {
  domain_thinking_prompt: string       // 教科固有の思考プロンプト
  knowledge_structure_visualization: boolean  // 知識構造の可視化
  expert_novice_comparison: boolean     // 専門家的思考パターンの提示
  transfer_prompt: boolean              // 他領域への転移を促すプロンプト
}
```

**Carroll作用**: 必要学習時間を減少（知識の構造化 → 効率的な情報処理）

---

### F11: 真正文脈学習理論（旧: 真正学習・実践参加理論）

**操作変数:**
```typescript
interface F11_Controls {
  real_world_connection: string         // 実生活との接続ポイント
  authentic_task_framing: boolean       // 本物の文脈での課題設定
  community_relevance: boolean          // 地域・社会との関連づけ
}
```

**Carroll作用**: 有効学習時間を増加（意味づけ → 忍耐力の向上）

---

### F12: 感情-認知統合理論（旧: 神経情動統合学習理論）

**理論的根拠:**
- Pekrun (2006): 学業感情の制御-価値理論
- Immordino-Yang (2016): 感情は認知の基盤
- **核心**: 適度な覚醒と正の感情が最適な認知パフォーマンスをもたらす（逆U字カーブ）

**測定変数:**
```typescript
interface F12_AffectProfile {
  current_arousal: number       // 0-100: 覚醒度（最適=50-70）
  current_valence: number       // -100〜+100: 感情の価値（正=ポジティブ）
  academic_enjoyment: number    // 0-100: 学業的楽しさ
  academic_anxiety: number      // 0-100: 学業的不安
  academic_boredom: number      // 0-100: 学業的退屈
  flow_state_probability: number // 0-1: フロー状態の確率
}
```

**操作変数:**
```typescript
interface F12_Controls {
  arousal_regulation: 'increase' | 'maintain' | 'decrease'
  emotional_message_type: 'encouraging' | 'calming' | 'neutral'
  challenge_skill_balance: number  // 0.0-1.0: チャレンジ/スキルバランス
  boredom_response: boolean        // 退屈への応答
  anxiety_response: boolean        // 不安への応答
}
```

**Carroll作用**: 有効学習時間を増加（感情調整 → 集中度 × 認知パフォーマンス）

---

## Part 3: 理論間の因果チェーンモデル

### 3.1 一次因果関係（直接的影響）

```
F7(ZPD成功体験) ──→ F8(有能感↑)
F8(有能感↑)     ──→ F5(自己効力感↑ = 予見段階の強化)
F5(方略帰属)    ──→ F4(不安↓)
F4(不安↓)       ──→ F4(構造化度↓ = より自由な学習)
F4(構造化度↓)   ──→ F8(自律性↑)
F8(自律性↑)     ──→ F5(内発的興味↑ = 予見段階の強化)
```

### 3.2 フィードバックループ（循環的影響）

**正のスパイラル（自律的学習者への成長）:**
```
ZPD適正配置(F7) → 成功体験 → 有能感↑(F8) → 自己効力感↑(F5)
→ 方略的学習行動(F5) → 学習成果↑ → 方略帰属(F5) → 不安↓(F4)
→ 構造化度↓(F4) → 自律性↑(F8) → 内発的動機↑(F8) → 忍耐力↑
→ より挑戦的なZPD位置(F7) → [ループ]
```

**負のスパイラル（学習性無力感への転落を防ぐ）:**
```
ZPD逸脱(F7) → 失敗体験 → 有能感↓(F8) → 自己効力感↓(F5)
→ 回避行動(F5) → 学習成果↓ → 能力帰属(F5) → 不安↑(F4)
→ 構造化度↑(F4) → 自律性↓(F8) → 外発的動機(F8) → 忍耐力↓
→ [脱落リスク]

【理解に基づく応答】
- F7: この子の手が届くところに戻す
- F8: 「大丈夫」を体験で伝える（Frustration Control）
- F5: 「やり方が合わなかっただけ」を一緒に見つける（方略帰属への誘導）
- F12: この子の感情に応じる（calming message）
```

### 3.3 横断的相互作用マトリクス

```
影響を与える理論 →
        F1   F2   F3   F4   F5   F6   F7   F8   F9   F10  F11  F12
F1      -    .2   .1   .3   .    .2   .    .    .    .    .    .
F2      .2   -    .2   .    .    .    .1   .1   .2   .3   .    .
F3      .    .    -    .    .3   .    .    .2   .3   .2   .4   .
F4      .3   .    .    -    .    .    .4   .3   .    .    .    .3
F5      .    .    .3   .    -    .5   .    .4   .3   .    .    .2
F6      .2   .    .    .    .5   -    .    .    .    .2   .    .
F7      .    .1   .    .4   .    .    -    .5   .    .    .    .3
F8      .    .1   .2   .3   .4   .    .5   -    .    .    .3   .4
F9      .    .2   .3   .    .3   .    .    .    -    .2   .3   .
F10     .    .3   .2   .    .    .2   .    .    .2   -    .2   .
F11     .    .    .4   .    .    .    .    .3   .3   .2   -    .2
F12     .    .    .    .3   .2   .    .3   .4   .    .    .2   -

（数値は影響の強さ: 0.0-1.0、.=0.1未満、-=自己）
```

### 3.4 時間スケール別の作用

| 時間スケール | 主に作用する理論 | 制御の性質 |
|---|---|---|
| **瞬時（問題単位）** | F7, F12, F4 | 難易度調整、感情検出、足場の随伴的切替 |
| **短期（セッション単位）** | F1, F5, F6 | 表示モード、SRL位相プロンプト、検索練習 |
| **中期（週単位）** | F6, F3, F8 | 間隔効果、Kolbサイクル完走、動機づけ充足チェック |
| **長期（月〜学期単位）** | F2, F4, F5, F10 | 知能プロファイル更新、ATI重み調整、SRL発達段階の理解更新 |

---

## Part 4: 統合制御パラメータ一覧

12理論から導出される**実際にAIが制御する変数**の完全リスト。

```typescript
interface IntegratedControlParameters {
  // === 表示・提示の制御 ===
  presentation: {
    entry_channel: 'visual' | 'auditory' | 'reading' | 'kinesthetic'  // F1
    encoding_channels: string[]                                         // F1
    concept_entry_intelligence: string                                  // F2
    fallback_intelligence: string                                       // F2
    kolb_entry_phase: 'CE' | 'RO' | 'AC' | 'AE'                       // F3
    domain_thinking_prompt: string                                      // F10
    real_world_connection: string                                       // F11
  }

  // === 構造・難易度の制御 ===
  structure: {
    structure_level: number           // F4: 0.0-1.0 (連続値)
    difficulty_zpd_position: number   // F7: 0.0-1.0
    solution_path_openness: number    // F4: 0.0-1.0
    error_tolerance: number           // F4: 0.0-1.0
  }

  // === 足場の制御 ===
  scaffold: {
    // 認知的足場（F7の6機能）
    recruitment: boolean
    reduction_of_dof: number
    direction_maintenance: boolean
    marking_critical: boolean
    demonstration_level: 'none' | 'partial' | 'full'
    
    // 動機付け的足場（F7+F8+F12）
    frustration_control: boolean
    encouragement: boolean
    soft_language: boolean
    
    // 随伴ルール（F7）
    success_threshold_to_fade: number
    failure_threshold_to_add: number
    fade_rate: number
    
    // ヒントの制御（F4+F7）
    hint_proactiveness: number         // F4: 0.0-1.0
  }

  // === 認知方略の制御 ===
  cognitive_strategy: {
    retrieval_mode: 'recognition' | 'cued_recall' | 'free_recall'   // F6
    retrieval_with_feedback: boolean                                  // F6
    spacing_interval_days: number                                     // F6
    interleaving_enabled: boolean                                     // F6（条件付き）
    interleaving_ratio: number                                        // F6
    elaboration_prompt_type: string                                   // F6（条件付き）
  }

  // === 自己調整学習の制御 ===
  srl: {
    goal_prompt_type: 'none' | 'template' | 'example' | 'guided'    // F5
    self_monitoring_interval: number                                  // F5
    reflection_prompt_type: 'none' | 'binary' | 'scaled' | 'open'   // F5
    attribution_guidance: boolean                                     // F5
    think_aloud_modeling: boolean                                     // F5
    improvement_planning: boolean                                     // F5
  }

  // === 動機づけ・感情の制御 ===
  motivation: {
    progress_display: 'self_growth' | 'none'                          // F8
    mastery_criteria: 'absolute'                                      // F8
    language_style: 'inviting'                                        // F8
    choice_with_rationale: boolean                                    // F8
    arousal_regulation: 'increase' | 'maintain' | 'decrease'          // F12
    emotional_message_type: 'encouraging' | 'calming' | 'neutral'    // F12
    peer_sharing_opportunity: boolean                                  // F8
  }
}
```

---

## Part 5: 学習者プロファイル空間と類型

### 5.1 プロファイル空間の次元削減

12理論の全測定変数を直接扱うと50次元以上になる。自由進度学習において**実際に指導を変えるべき分岐点**を定義するために、以下の**5つの基幹軸**に次元削減する。

```
基幹軸1: 認知的自律度（SRL発達段階 × 独立性 × メタ認知）
  → F5.developmental_level × F4.independence × F9.metacognitive
  → 0〜100: 低い=高構造化・高支援、高い=低構造化・自律

基幹軸2: 感情的安定度（不安 × 感情調整 × 有能感）
  → (100-F4.anxiety) × F12.valence × F8.competence
  → 0〜100: 低い=高配慮・高足場、高い=挑戦的課題許容

基幹軸3: 認知的入口選好（感覚チャネル × 知能入口）
  → F1のプロファイルベクトル × F2のプロファイルベクトル
  → 多次元（表示モードの最適化に使用）

基幹軸4: 方略的成熟度（認知方略の使用可能性）
  → F6.mastery_level × F6.strategy_readiness
  → 0〜100: 低い=基礎的方略、高い=高度な方略

基幹軸5: 動機的エネルギー（内発的動機 × 意味づけ × フロー）
  → F8.motivation_continuum × F11.relevance × F12.flow_probability
  → 0〜100: 低い=外発的支援必要、高い=自律的没入
```

### 5.2 8つの姿 — 子どもが今どんなふうに学んでいるか

> アーキタイプは分類ではない。「今この子がどんなふうに学んでいるか」の描写である。
> 同じ子が、月曜日にはAで、水曜日にはDであることもある。
> 算数ではGだが、理科ではCであることもある。
> 姿は変わる。理解し続けることが大事。
> — UNIFIED_PRINCIPLE_v4.md

5つの基幹軸を2値化（High/Low）すると32パターンだが、自由進度学習で**実際に観察される**主要パターンは以下の8つに収束する。

```
┌─────────────────────────────────────────────────────────────────┐
│  アーキタイプ          │ 軸1  軸2  軸4  軸5  │ 推定出現率  │
├─────────────────────────────────────────────────────────────────┤
│ A. 自律的探究者        │ H    H    H    H    │  8%        │
│ B. 堅実な努力家        │ M    H    M    H    │ 15%        │
│ C. 直感的冒険者        │ M    H    L    M    │ 10%        │
│ D. 慎重な完璧主義者    │ H    L    H    L    │ 12%        │
│ E. 社交的学習者        │ M    M    M    H    │ 15%        │
│ F. 不安定な挑戦者      │ L    L    L    M    │ 12%        │
│ G. 受動的依存者        │ L    M    L    L    │ 18%        │
│ H. 学習回避者          │ L    L    L    L    │ 10%        │
└─────────────────────────────────────────────────────────────────┘
（軸3は表示モード選択に使い、類型化には含めない）
H=High(70以上), M=Middle(40-70), L=Low(40未満)
```

### 5.3 各アーキタイプの詳細と制御パラメータ設定

#### A. 自分の問いを持って探究している子（Autonomous Explorer）
**この子の姿**: 知りたいことがあり、自分のやり方で進んでいる。夢中になっている。  
**12の視座で見ると**: 舵取り(F5)が育ち、感情(F12)は安定し、方略(F6)を自分で選び、学びが自分のもの(F11)になっている。  
**応じ方**: この子のそばにいる。求められたら応じる。最善の応答は、邪魔をしないこと。

```typescript
const type_A_controls: Partial<IntegratedControlParameters> = {
  structure: {
    structure_level: 0.15,        // 最低限の構造
    difficulty_zpd_position: 0.8, // ZPD上限付近に挑戦
    solution_path_openness: 0.9,  // 多様な解法を許容
    error_tolerance: 0.9          // 試行錯誤を許容
  },
  scaffold: {
    hint_proactiveness: 0.1,      // ほぼヒントを出さない
    fade_rate: 0.9                // 足場を急速に除去
  },
  srl: {
    goal_prompt_type: 'none',     // 自力で目標設定
    reflection_prompt_type: 'open_ended',  // オープンな振り返り
    think_aloud_modeling: false    // モデリング不要
  },
  cognitive_strategy: {
    retrieval_mode: 'free_recall',      // 最高難度の検索練習
    interleaving_enabled: true,          // 交互配置有効
    elaboration_prompt_type: 'connect'   // 高度な精緻化
  },
  motivation: {
    progress_display: 'self_growth',
    choice_with_rationale: true,
    peer_sharing_opportunity: true  // 学びの共有
  }
}
```

#### D. 慎重に考え、間違えることを恐れながらも前に進もうとしている子（Cautious Perfectionist）
**この子の姿**: 丁寧に考える力がある。でも「間違えたらどうしよう」が先に来る。それでも前に進もうとしている。  
**12の視座で見ると**: 舵取り(F5)と方略(F6)はあるが、感情(F12)の不安が強く、有能感(F8)が揺らぎやすい。  
**応じ方**: 「間違えても大丈夫」を言葉ではなく体験で伝える。安心できる環境を。この子の慎重さは強み。

```typescript
const type_D_controls: Partial<IntegratedControlParameters> = {
  structure: {
    structure_level: 0.45,         // 中程度の構造（安心感）
    difficulty_zpd_position: 0.5,  // ZPD中央（確実に成功できる位置）
    solution_path_openness: 0.5,
    error_tolerance: 0.6
  },
  scaffold: {
    frustration_control: true,       // 挫折制御を常時ON
    encouragement: true,
    soft_language: true,             // 柔らかい言葉遣い
    hint_proactiveness: 0.4,
    success_threshold_to_fade: 4     // 4回連続正解で足場を下げる（慎重に）
  },
  srl: {
    attribution_guidance: true,       // 方略帰属への誘導（能力帰属からの脱却）
    reflection_prompt_type: 'scaled', // 段階的振り返り
    improvement_planning: true        // 次の改善計画
  },
  motivation: {
    arousal_regulation: 'decrease',   // 覚醒度を下げる
    emotional_message_type: 'calming',
    mastery_criteria: 'absolute',     // 絶対基準（比較しない）
    progress_display: 'self_growth'   // 自己成長のみ
  }
}
```

#### G. まだ自分から動き出していない子（Passive Dependent）
**この子の姿**: ノートを開いているが、鉛筆が動かない。でもこの子の中にも力はある。「何をすればいいかわからない」のかもしれない。「なぜ学ぶか」が自分事になっていないのかもしれない。  
**12の視座で見ると**: 舵取り(F5)がまだ小さく、学びが自分のもの(F11)になっていない。方略(F6)の道具箱が少ない。  
**応じ方**: 小さな「できた」の体験を丁寧に積む。「なぜ学ぶか」が自分事になる瞬間は、必ず来る。待つ。

```typescript
const type_G_controls: Partial<IntegratedControlParameters> = {
  structure: {
    structure_level: 0.85,         // 高構造化
    difficulty_zpd_position: 0.3,  // ZPD下限寄り（確実な成功）
    solution_path_openness: 0.2,   // 限定的な解法
    error_tolerance: 0.3           // 早めに修正
  },
  scaffold: {
    recruitment: true,               // 注意喚起を積極的に
    reduction_of_dof: 0.8,          // 問題空間を大幅に縮小
    marking_critical: true,
    demonstration_level: 'partial',  // 部分的モデリング
    hint_proactiveness: 0.8,         // 先回りヒント
    success_threshold_to_fade: 5,    // 5回連続正解でやっと足場を下げる
    failure_threshold_to_add: 1      // 1回不正解で即座に足場追加
  },
  srl: {
    goal_prompt_type: 'guided',       // ガイド付き目標設定
    think_aloud_modeling: true,       // AIのThink-Aloudモデリング
    self_monitoring_interval: 3,      // 3問ごとにモニタリング促進
    reflection_prompt_type: 'binary', // はい/いいえの簡単な振り返り
    improvement_planning: true
  },
  cognitive_strategy: {
    retrieval_mode: 'recognition',    // 最も簡単な検索練習（再認）
    interleaving_enabled: false,      // 交互配置は禁止（混乱する）
    elaboration_prompt_type: 'none'   // 精緻化はまだ早い
  },
  motivation: {
    micro_success_feedback: true,     // 小さな成功を即座に認める
    emotional_message_type: 'encouraging',
    choice_with_rationale: true,      // 「なぜこれを学ぶか」を伝える
    peer_sharing_opportunity: false   // まだ共有は負担
  }
}
```

#### H. 学びから距離を置いている子（Learning Avoider）
**この子の姿**: 机に伏せている。あるいは窓の外を見ている。でも、この子の中にも力はある。今は深く眠っている。この子を「やる気がない子」と見ない。学びから距離を置いている理由がある。  
**12の視座で見ると**: 感情(F12)の安全が確保されていない可能性が高い。求めているもの(F8)——自律性・有能感・関係性——のいずれもが満たされていない。  
**応じ方**: まず「ここにいていい」。安全を。小さな興味の芽を見逃さない。芽が見えたら、静かに光を当てる。教師との連携が特に大切。

```typescript
const type_H_controls: Partial<IntegratedControlParameters> = {
  structure: {
    structure_level: 0.95,         // 完全に近い構造化
    difficulty_zpd_position: 0.15, // ZPD最下限（絶対に成功する問題）
    solution_path_openness: 0.1,   // 一本道
    error_tolerance: 0.2           // 即座に助ける
  },
  scaffold: {
    recruitment: true,
    frustration_control: true,
    demonstration_level: 'full',    // 完全なモデリングから開始
    hint_proactiveness: 0.95,       // ほぼ常にヒントを出す
    failure_threshold_to_add: 1
  },
  srl: {
    // SRLの最初の発達段階「観察」から始める
    goal_prompt_type: 'template',    // テンプレートを見せる
    think_aloud_modeling: true,      // AIのThink-Aloudを見せる
    reflection_prompt_type: 'binary' // 最小限の振り返り
  },
  motivation: {
    arousal_regulation: 'increase',   // まず覚醒度を上げる（退屈からの脱出）
    emotional_message_type: 'encouraging',
    language_style: 'inviting'
  },
  // 特別フラグ
  _teacher_alert: true,  // 教師にアラートを送信
  _human_intervention_recommended: true
}
```

### 5.4 アーキタイプ間の遷移モデル

学習者は固定的な類型に留まるのではなく、学習の進行に伴って**遷移する**。

```
典型的な正の遷移パス:

H(回避者) → G(依存者) → F(不安定挑戦者) → E(社交的) or B(努力家) → A(探究者)
                                           ↗
D(完璧主義者) ────────────────────────────→ B(努力家) → A(探究者)

姿の変化の理解基準:
- G→F: 連続3週間で正答率60%以上 + SRL予見段階スコア40以上
- F→E: 不安レベル50以下 + 関係性充足度50以上
- F→B: 不安レベル50以下 + 方略使用の一貫性
- D→B: 不安レベル50以下の安定（4週間持続）+ 動機質の内在化進行
- B→A: SRL発達段階が self_regulation + 全軸60以上
```

---

## Part 6: 統合アルゴリズム — 瞬時の意思決定

学習者が一つの問題に取り組む瞬間、システムは以下の統合的意思決定を行う。

```typescript
async function computeIntegratedControls(
  studentId: string,
  currentUnit: string,
  recentBehavior: RealtimeBehaviorData
): Promise<IntegratedControlParameters> {
  
  // 1. 全プロファイルの取得
  const profiles = await getAllTheoryProfiles(studentId)
  
  // 2. 基幹軸の算出
  const axes = computeFundamentalAxes(profiles)
  
  // 3. この子の今の姿の理解
  const archetype = understandCurrentPresence(axes)
  
  // 4. アーキタイプベースのデフォルト制御値を取得
  const baseControls = getArchetypeDefaults(archetype)
  
  // 5. 因果チェーンによる動的修正
  
  // 5a. この子の今の姿を見つめ、理解に基づき応じる
  if (recentBehavior.consecutive_errors >= 2) {
    // この子が苦しんでいる——安心を優先する
    baseControls.scaffold.frustration_control = true
    baseControls.structure.difficulty_zpd_position *= 0.7  // 手が届くところに戻す
    baseControls.motivation.emotional_message_type = 'calming'
  }
  
  if (recentBehavior.consecutive_successes >= 3) {
    // この子は波に乗っている——次の世界への扉を
    baseControls.structure.difficulty_zpd_position = Math.min(
      1.0, baseControls.structure.difficulty_zpd_position * 1.2
    )
    baseControls.scaffold.fade_rate *= 1.3  // この子はもう自分でできる
  }
  
  // 5b. F6方略の条件チェック
  const strategyProfile = profiles.F6
  if (!canApplyStrategy('interleaving', strategyProfile)) {
    baseControls.cognitive_strategy.interleaving_enabled = false
  }
  if (!canApplyStrategy('elaboration', strategyProfile)) {
    baseControls.cognitive_strategy.elaboration_prompt_type = 'none'
  }
  
  // 5c. F5 SRLの位相の理解
  const currentSRLPhase = detectCurrentSRLPhase(recentBehavior)
  if (currentSRLPhase === 'forethought') {
    // 予見段階のプロンプトを発動
    baseControls.srl.goal_prompt_type = determineGoalPromptType(profiles.F5)
  } else if (currentSRLPhase === 'self_reflection') {
    // 内省段階のプロンプトを発動
    baseControls.srl.reflection_prompt_type = determineReflectionType(profiles.F5)
    baseControls.srl.attribution_guidance = profiles.F5.self_reflection.causal_attribution < 60
  }
  
  // 5d. F4 ATI交互作用の計算
  baseControls.structure.structure_level = computeATIStructure(
    profiles.F4.prior_knowledge,
    profiles.F4.anxiety_level,
    profiles.F4.independence_level,
    archetype
  )
  
  // 5e. F12 感情状態による調整
  if (profiles.F12.current_arousal < 30) {
    // この子は退屈している——次の世界への扉を見せる
    baseControls.motivation.arousal_regulation = 'increase'
    baseControls.structure.difficulty_zpd_position = Math.min(
      1.0, baseControls.structure.difficulty_zpd_position * 1.15
    )
  } else if (profiles.F12.current_arousal > 80) {
    // この子は不安の中にいる——安心を
    baseControls.motivation.arousal_regulation = 'decrease'
    baseControls.scaffold.frustration_control = true
  }
  
  // 6. 理解の統合（12の視座からの理解を一つの応答にまとめる）
  resolveConflicts(baseControls)
  
  return baseControls
}
```

### 6.1 ATI構造化度の連続算出関数

```typescript
function computeATIStructure(
  priorKnowledge: number,   // 0-100
  anxiety: number,          // 0-100
  independence: number,     // 0-100
  archetype: string
): number {
  // Cronbach & Snow (1977) の交互作用モデルに基づく
  // 構造化度 = w1*(知識不足) + w2*(不安) + w3*(依存性)
  
  // 重みは発達段階（アーキタイプ）で変化
  let w1: number, w2: number, w3: number
  
  switch (archetype) {
    case 'H': // 学習回避者: 不安の重みが最大
      w1 = 0.2; w2 = 0.5; w3 = 0.3; break
    case 'G': // 受動的依存者: 依存性の重みが最大
      w1 = 0.25; w2 = 0.25; w3 = 0.5; break
    case 'D': // 完璧主義者: 不安の重みが大きい
      w1 = 0.2; w2 = 0.5; w3 = 0.3; break
    case 'A': // 自律的探究者: 知識が主要因子
      w1 = 0.6; w2 = 0.1; w3 = 0.3; break
    default:  // その他: バランス
      w1 = 0.35; w2 = 0.35; w3 = 0.30; break
  }
  
  const rawStructure = 
    w1 * (1 - priorKnowledge / 100) +
    w2 * (anxiety / 100) +
    w3 * (1 - independence / 100)
  
  // 0.1〜0.95 の範囲にクリッピング（完全な0と1は存在しない）
  return Math.max(0.1, Math.min(0.95, rawStructure))
}
```

---

## Part 7: 実装の原則 — 理解を形にする

### 7.1 段階的実装ロードマップ

| 段階 | 実装内容 | 理解の深まり |
|---|---|---|
| **Phase 1** | F4(この子に合った環境), F7(手を伸ばす先の足場), F12(この子の今の気持ち) | この子の「今」に応じる |
| **Phase 2** | F5(舵取りの育ち), F8(求めているもの) | この子の育ちを見守る |
| **Phase 3** | F6(学び方の道具箱), F1(受け取り方の多様性) | この子のやり方を理解する |
| **Phase 4** | F2(理解の道の多様性), F3(経験の循環) | この子の深い学びを支える |
| **Phase 5** | F9, F10, F11 + 姿の変化の理解 | この子の長期的な成長を見つめる |

### 7.2 核心の実装原則

1. **すべての制御パラメータは連続値**: 離散的ラベル（高/中/低）は表示用のみ。子どもの姿は連続的に変化する
2. **理論間の因果チェーンをコードに反映**: 一つの視座の理解が別の視座の理解を深める
3. **条件付き適用**: すべての方略にはcanApply()チェックを実装。この子に今合うかどうかを理解してから
4. **随伴性（contingency）**: この子の反応を見つめ、理解に基づいてリアルタイムに応じる
5. **フェイディング**: 支援は常に「この子が自分でできるように」が方向。足場は掴んだら外す
6. **社会的比較の完全排除**: 進度・成績の他者比較はシステム全体で禁止。この子の今と過去の自分だけ
7. **教師への連携**: 学びから距離を置いている子（Type H）には必ず人間との対話の機会を

---

## Part 8: まとめ — 「この子を理解する」とは何か

> **子どもは今この瞬間、学んでいる。**
> **12の視座でその姿を理解する。**
> **理解していれば、応じ方は自ずと見える。**
>
> — UNIFIED_PRINCIPLE_v4.md

従来の「個別最適化」は「正答率を見て難易度を上下する」だけだった。
それは子どもを**データの集合**として見ていた。

本モデルは、子どもを**今この瞬間に学んでいる存在**として見つめる。
12の視座を通して、一人の子どもの「今」を7つの側面から理解する：

1. **この子はどんなふうに世界を受け取っているか**: どの感覚チャネル・知能入口で概念に向かっているか（F1×F2）
2. **この子は今どんな環境で動きやすいか**: どの程度の自由度がこの子に合うか（F4、連続値）
3. **この子はどこまで手を伸ばしているか**: 6つの足場機能のどれを、どの強さで、いつ添えるか（F7、随伴的）
4. **この子はどんなやり方で覚えようとしているか**: どの方略が、どの条件で、この子に使えるか（F6、条件付き）
5. **この子はどのくらい自分で舵取りしているか**: SRLのどの位相に、どの発達段階で、どう応じるか（F5）
6. **この子は何を求めて学んでいるか**: 3欲求のどれが今満たされていないか、どう支えるか（F8×F12）
7. **この子は経験をどう編み直しているか**: Kolbの4段階をどの順序で歩いているか（F3）

**これが「一人の子どもを理解する」ということの技術的な中身である。** 一人ひとりの子どもについて、この7つの理解がリアルタイムに更新され、理解に基づいて応じ方が生まれる。

技術は精密であるが、姿勢は単純：**この子の今を見つめ、理解し、応じる。**

---

*Document End - Version 2.0 (v4子ども観統合版)*
*Next: この設計に基づく実装を Phase 1 (F4+F7+F12) から開始する*
