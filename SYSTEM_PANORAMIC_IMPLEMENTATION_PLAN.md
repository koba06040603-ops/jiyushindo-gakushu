# 俯瞰的知見 → システム実装計画書
## 12理論が照らす「一つの世界」をシステムに活かす

**Version**: 1.0  
**Date**: 2026-02-16  
**Status**: 設計完了・実装準備段階  
**前提文書**: THEORY_CAUSAL_MODEL.md, THEORY_DEEP_ANALYSIS.md, THEORY_BRIEFING_12THEORIES.md

---

## 導入：なぜこの計画が必要か

THEORY_CAUSAL_MODEL.md は12理論を因果チェーンとして統合した。しかし俯瞰的考察で明らかになったのは、既存設計にはまだ **4つの構造的欠落** があるということだ：

1. **時間スケールの同時制御が未実装** — 瞬時・短期・中期・長期の4スケールが別々のAPIに散在し、統合的に呼ばれていない
2. **Q1（認知効率）とQ2（学習継続意欲）の均衡制御がない** — 両方のスコアを同時に監視し、一方が他方を損なう場合に自動調停する機構がない
3. **段階的移行の自動化が不完全** — アーキタイプ遷移条件は定義されているが、支援のフェイディング/エスカレーションのスムーズなグラデーションが実装されていない
4. **感情が「一変数」でしか扱われていない** — Immordino-Yangの「感情が認知の前提である」という原則が、アーキテクチャの最上位層として組み込まれていない

本計画書は、これら4つの欠落を埋める具体的な設計と、既存コードへの改修ロードマップを示す。

---

## Part 1: 4時間スケール同時制御アーキテクチャ

### 1.1 問題の所在

現在のシステムは問題単位の制御（`computeIntegratedControls`）に集中しており、セッション・週・月スケールの制御が独立した別APIになっている。これは「今この瞬間の最適」は達成できても、「1週間後の最適」「3ヶ月後の成長」との整合性が取れない。

**例**: 
- 瞬時制御が「難易度を下げる」と判断（連続エラーのため）
- しかし週次分析では「この子は停滞期にいて、あえて少し高い壁を与えるべき」
- この矛盾を解消する機構がない

### 1.2 設計：4層カスケード制御モデル

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 4: 長期発達コントローラ（月〜学期単位）                            │
│  ────────────────────────────────────────────────────                    │
│  担当理論: F10(MDL段階), F2(知能プロファイル進化), F4(ATI重み調整)         │
│  更新頻度: 月1回 + 学期末                                               │
│  出力: developmental_policy (発達方針)                                   │
│  ・MDL段階判定 → 全体的な学習アプローチの方向性                          │
│  ・知能プロファイルの長期変化 → 入口戦略の更新                           │
│  ・ATI重みの校正 → 個人化された構造化関数の精密化                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Layer 3: 中期最適化コントローラ（週単位）                         │    │
│  │  ────────────────────────────────────────────────                 │    │
│  │  担当理論: F6(間隔・交互), F3(Kolbサイクル完走), F8(3欲求チェック)  │    │
│  │  更新頻度: 週1回                                                  │    │
│  │  出力: weekly_optimization (週次最適化方針)                        │    │
│  │  ・間隔効果の最適スケジュール算出                                  │    │
│  │  ・Kolbサイクル完走の進捗チェック → 欠損段階を強制的に挿入         │    │
│  │  ・SDT 3欲求の週次バランスチェック → 欠損欲求への介入計画         │    │
│  │  ・アーキタイプ遷移条件の判定                                     │    │
│  │                                                                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐    │    │
│  │  │  Layer 2: セッションコントローラ（セッション単位）          │    │    │
│  │  │  ─────────────────────────────────────────────              │    │    │
│  │  │  担当理論: F1(表示モード), F5(SRL位相), F6(検索練習)        │    │    │
│  │  │  更新頻度: セッション開始時 + 中間点                        │    │    │
│  │  │  出力: session_plan (セッション計画)                        │    │    │
│  │  │  ・SRL位相の判定 → 予見/遂行/内省の切替タイミング           │    │    │
│  │  │  ・表示モードの最適化                                      │    │    │
│  │  │  ・セッション内の検索練習配置                                │    │    │
│  │  │                                                            │    │    │
│  │  │  ┌────────────────────────────────────────────────────┐    │    │    │
│  │  │  │  Layer 1: 瞬時制御コントローラ（問題単位）          │    │    │    │
│  │  │  │  ─────────────────────────────────────               │    │    │    │
│  │  │  │  担当理論: F7(足場), F12(感情), F4(ATI構造化)        │    │    │    │
│  │  │  │  更新頻度: 問題ごと（リアルタイム）                  │    │    │    │
│  │  │  │  出力: immediate_controls (即時制御パラメータ)        │    │    │    │
│  │  │  │  ・難易度調整                                       │    │    │    │
│  │  │  │  ・足場の随伴的切替                                  │    │    │    │
│  │  │  │  ・感情検出 → 覚醒度調整                             │    │    │    │
│  │  │  │  ・ATI構造化度のリアルタイム微調整                    │    │    │    │
│  │  │  └────────────────────────────────────────────────────┘    │    │    │
│  │  └───────────────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 カスケードの核心ルール：上位が制約、下位が微調整

```typescript
interface CascadeControlSystem {
  /**
   * 核心原則：上位層は下位層に「制約範囲」を渡す。
   * 下位層はその範囲内でのみ自律的に調整する。
   * 
   * 例：Layer 4が「この子はMDL competency段階に入った。
   *     structure_levelの範囲を0.2-0.6に設定」と判定。
   *     → Layer 1は0.2-0.6の範囲内でのみ瞬時調整する。
   *       （0.85に上げることは禁止される）
   * 
   * これにより「瞬時の不安に過剰反応して長期的成長を阻害する」
   * という問題を構造的に防止する。
   */
  
  layer4_developmental: {
    // 長期発達方針
    mdl_stage: 'acclimation' | 'competency' | 'proficiency'
    archetype: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
    
    // 下位層への制約範囲
    allowed_ranges: {
      structure_level: { min: number, max: number }
      difficulty_zpd_position: { min: number, max: number }
      scaffold_density: { min: number, max: number }
      autonomy_level: { min: number, max: number }
    }
    
    // 更新トリガー
    update_schedule: 'monthly' | 'on_stage_transition'
    last_updated: Date
  }
  
  layer3_weekly: {
    // 週次最適化
    spacing_schedule: SpacingPlan[]        // F6: 今週の復習スケジュール
    kolb_cycle_gaps: KolbPhase[]           // F3: 不足している経験段階
    sdt_deficient_needs: SDTNeed[]         // F8: 欠損している欲求
    transition_proximity: {                // アーキタイプ遷移の近接度
      target_archetype: string
      conditions_met: number               // 遷移条件の充足数
      conditions_total: number
      estimated_weeks: number              // 遷移までの推定週数
    }
    
    // 下位層への追加指示
    force_kolb_phase?: 'CE' | 'RO' | 'AC' | 'AE'  // 不足段階の強制挿入
    sdt_boost_target?: 'autonomy' | 'competence' | 'relatedness'
    
    update_schedule: 'weekly'
    last_updated: Date
  }
  
  layer2_session: {
    // セッション計画
    srl_current_phase: 'forethought' | 'performance' | 'reflection'
    display_mode: F1_Controls
    retrieval_practice_schedule: number[]   // セッション内の検索練習タイミング
    session_goal: string                    // セッション目標
    
    // セッション中間の再評価
    mid_session_evaluation: boolean
    
    update_schedule: 'per_session'
    last_updated: Date
  }
  
  layer1_instant: {
    // 瞬時制御（問題単位）
    current_controls: IntegratedControlParameters
    
    // 上位層の制約を参照
    bounded_by: {
      layer4_ranges: typeof CascadeControlSystem.layer4_developmental.allowed_ranges
      layer3_instructions: typeof CascadeControlSystem.layer3_weekly
      layer2_plan: typeof CascadeControlSystem.layer2_session
    }
    
    update_schedule: 'per_problem'
  }
}
```

### 1.4 制約超越の例外処理（安全弁）

```typescript
/**
 * 唯一の例外：生徒の感情的安全が脅かされる場合。
 * Layer 1は上位層の制約を一時的に超越できる。
 * ただし必ず教師にアラートを送信する。
 */
interface SafetyOverride {
  condition: 'emotional_crisis'    // 連続5問以上のエラー + 覚醒度>80 or <20
  action: {
    override_layer4_ranges: true   // 制約を一時解除
    immediate_zpd_floor: true      // ZPD最下限に即移動
    teacher_alert: true            // 教師に即座にアラート
    log_reason: string             // 超越の理由を記録
  }
  duration: '10_minutes'           // 10分後に上位層制約に復帰
  requires_teacher_ack: true       // 教師の確認後に通常制御に戻る
}
```

### 1.5 TypeScript実装構造

```typescript
// ファイル: src/cascade-control-engine.ts

/**
 * 4層カスケード制御エンジン
 * 
 * 呼び出しフロー:
 * 1. セッション開始時: layer4 → layer3 → layer2 を順次読み込み
 * 2. 問題ごと: layer1 のみ実行（上位層を制約として参照）
 * 3. セッション中間点: layer2 を再評価
 * 4. セッション終了時: layer2, layer3 にフィードバック
 * 5. 週末バッチ: layer3 を更新
 * 6. 月末バッチ: layer4 を更新
 */

// Layer 4: 長期発達コントローラ
async function updateLayer4(studentId: string, db: D1Database): Promise<Layer4Policy> {
  // 1. MDL段階の判定（F10）
  const mdlStage = await assessMDLStage(studentId, db)
  
  // 2. アーキタイプの再判定
  const profiles = await getAllTheoryProfiles(studentId, db)
  const axes = computeFundamentalAxes(profiles)
  const archetype = classifyArchetype(axes)
  
  // 3. 制約範囲の設定
  const ranges = computeAllowedRanges(mdlStage, archetype)
  
  // 4. 前回からの変化を記録
  await logLayer4Update(studentId, mdlStage, archetype, ranges, db)
  
  return { mdlStage, archetype, ranges }
}

// Layer 3: 週次最適化コントローラ
async function updateLayer3(
  studentId: string, 
  layer4: Layer4Policy,
  db: D1Database
): Promise<Layer3Plan> {
  // 1. 間隔効果スケジュール（F6）
  const spacingPlan = await computeSpacingSchedule(studentId, db)
  
  // 2. Kolbサイクルギャップ分析（F3）
  const kolbGaps = await analyzeKolbCycleCompletion(studentId, db)
  
  // 3. SDT欲求バランスチェック（F8）
  const sdtBalance = await checkSDTNeedBalance(studentId, db)
  
  // 4. アーキタイプ遷移の近接度評価
  const transitionProximity = await evaluateTransitionProximity(
    studentId, layer4.archetype, db
  )
  
  return { spacingPlan, kolbGaps, sdtBalance, transitionProximity }
}

// Layer 2: セッションコントローラ
async function initializeLayer2(
  studentId: string,
  layer4: Layer4Policy,
  layer3: Layer3Plan,
  db: D1Database
): Promise<Layer2Session> {
  // 1. SRL位相の判定（F5）
  const srlPhase = determineSRLPhase(/* セッション開始時は常にforethought */)
  
  // 2. 表示モードの最適化（F1）
  const displayMode = await optimizeDisplayMode(studentId, db)
  
  // 3. Kolbギャップの解消をセッション計画に組み込み
  const forcedKolbPhase = layer3.kolbGaps.length > 0 
    ? layer3.kolbGaps[0] 
    : null
  
  // 4. 検索練習の配置
  const retrievalSchedule = planRetrievalPractice(layer3.spacingPlan)
  
  return { srlPhase, displayMode, forcedKolbPhase, retrievalSchedule }
}

// Layer 1: 瞬時制御コントローラ（既存 computeIntegratedControls を改修）
async function computeBoundedControls(
  studentId: string,
  currentUnit: string,
  recentBehavior: RealtimeBehaviorData,
  layer4: Layer4Policy,
  layer3: Layer3Plan,
  layer2: Layer2Session,
  db: D1Database
): Promise<IntegratedControlParameters> {
  // 既存ロジックを実行
  let controls = await computeIntegratedControls(studentId, currentUnit, recentBehavior)
  
  // 上位層の制約でクランプ
  controls = clampToLayer4Ranges(controls, layer4.ranges)
  
  // Layer 3の指示を反映
  controls = applyLayer3Instructions(controls, layer3)
  
  // Layer 2の計画を反映
  controls = applyLayer2Plan(controls, layer2)
  
  // 安全弁チェック
  if (isEmotionalCrisis(recentBehavior)) {
    controls = applySafetyOverride(controls, studentId, db)
  }
  
  return controls
}
```

---

## Part 2: Q1/Q2 二大問い統合エンジン

### 2.1 問題の所在

> **Q1**: この子にとって最も認知効率の高い学び方は何か？（F1-F4, F6, F7, F10）  
> **Q2**: この子が自ら学び続けたいと思える条件は何か？（F5, F8, F9, F11, F12）

現在のシステムはQ1とQ2の理論を**それぞれ独立に最適化**している。しかし俯瞰的考察で明らかになったのは：

> **Q2を無視してQ1を最適化すると学習が崩壊する。**

例：検索練習（d=0.80）は認知効率が高い。しかし不安の強い子に自由再生テストを与えると感情状態が悪化し、有効学習時間がゼロになる。

### 2.2 設計：Q1-Q2バランススコアと自動調停

```typescript
/**
 * Q1-Q2 統合エンジン
 * 
 * 核心思想：
 * Carroll の学習到達度 = 有効学習時間 / 必要学習時間
 * 
 * Q1（認知効率）は必要学習時間を減少させる
 * Q2（学習継続意欲）は有効学習時間を増加させる
 * 
 * 両方の効果は**乗算的**であるため、
 * Q1を10%改善してもQ2が50%減少すれば全体は大幅に悪化する。
 * 
 * → 乗算的な関係を反映するスコアリングが必要
 */

interface Q1Q2BalanceEngine {
  
  /**
   * Q1スコア（認知効率指数）: 0-100
   * 構成要素：
   * - 表示モード適合度（F1）
   * - 概念入口の有効性（F2）
   * - 構造化度の適切さ（F4）
   * - 認知方略の適用状況（F6）
   * - 足場の随伴性（F7）
   * - 領域知識構造化度（F10）
   */
  computeQ1Score(
    controls: IntegratedControlParameters,
    profile: AllTheoryProfiles,
    performance: RecentPerformanceData
  ): number
  
  /**
   * Q2スコア（学習継続意欲指数）: 0-100
   * 構成要素：
   * - SRL自律度（F5）
   * - SDT三欲求充足度（F8）
   * - メタ認知的自覚（F9）
   * - 真正性・意味づけ（F11）
   * - 感情状態（F12）
   */
  computeQ2Score(
    controls: IntegratedControlParameters,
    profile: AllTheoryProfiles,
    emotional: EmotionalStateData
  ): number
  
  /**
   * 統合効果量（乗算モデル）
   * 
   * 効果量 = Q1_normalized × Q2_normalized
   * 
   * Q1_normalized = Q1 / 100
   * Q2_normalized = Q2 / 100
   * 
   * → 両方が70なら 0.7 × 0.7 = 0.49
   * → Q1が90でQ2が30なら 0.9 × 0.3 = 0.27（悪い！）
   * → 両方が60なら 0.6 × 0.6 = 0.36 > 0.27
   * 
   * つまり**バランスが崩れるよりは両方やや低い方がまし**
   */
  computeIntegratedEffectiveness(q1: number, q2: number): number
  
  /**
   * 自動調停ルール
   * 
   * Q2が閾値以下（<40）の場合：
   *   → Q1最適化を一時停止
   *   → Q2回復のための介入を優先
   *   → 具体的には：
   *     - 難易度を下げる（Q1的には非効率だが感情を守る）
   *     - 選択肢を提示する（自律性支援）
   *     - 成功体験を確保する（有能感支援）
   * 
   * Q1が閾値以下（<30）の場合：
   *   → Q2を維持しつつQ1を緊急改善
   *   → 具体的には：
   *     - 表示モードを変更
   *     - 概念入口を切り替え
   *     - 足場を追加
   */
  arbitrate(q1: number, q2: number): ArbitrationDecision
}

interface ArbitrationDecision {
  priority: 'q1_focus' | 'q2_focus' | 'balanced' | 'emergency_q2'
  adjustments: Partial<IntegratedControlParameters>
  reason: string
  expected_q1_change: number  // 予想されるQ1の変化量
  expected_q2_change: number  // 予想されるQ2の変化量
  teacher_notification?: string
}
```

### 2.3 Q2緊急回復プロトコル

```typescript
/**
 * Q2が30以下に低下した場合の緊急プロトコル
 * 
 * Immordino-Yangの原則：「感情的に関心がないことは学べない」
 * → Q2<30は「学習不能状態」と等価
 * 
 * このプロトコルはLayer 1の安全弁と連動する
 */

const Q2_EMERGENCY_PROTOCOL = {
  trigger: 'q2_score < 30',
  
  phase1_immediate: {
    // 即座に実行（0-30秒）
    actions: [
      'difficulty → zpd_lower_bound',           // 最も簡単な問題に
      'scaffold → full_demonstration',           // 完全なモデリング
      'emotional_message → calming + encouraging', // 感情的支持
      'suspend_retrieval_practice',               // 検索練習を一時停止
      'suspend_interleaving',                     // 交互配置を一時停止
    ],
    rationale: '認知的負荷を最小化し、感情的安全を確保'
  },
  
  phase2_recovery: {
    // 5分以内に実行
    actions: [
      'offer_3_choices_with_rationale',           // 3つの選択肢を「なぜ」付きで提示
      'switch_to_concrete_examples',              // 具体例中心に切替
      'activate_micro_success_chain',             // 小さな成功の連鎖を設計
      'show_past_growth',                         // 過去の成長を可視化
    ],
    rationale: 'SDT三欲求（自律性・有能感）を緊急充足'
  },
  
  phase3_monitoring: {
    // 10分間の集中モニタリング
    actions: [
      'evaluate_q2_every_2_problems',             // 2問ごとにQ2再計算
      'if_q2_still_below_40_alert_teacher',       // 回復しなければ教師通知
      'log_emotional_trajectory',                  // 感情軌跡を記録
    ],
    exit_condition: 'q2 >= 50 for 3 consecutive evaluations'
  }
}
```

### 2.4 Carroll乗算モデルの数式定義

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Carroll拡張モデル（俯瞰的統合版）                                       │
│                                                                         │
│  Learning Achievement =                                                 │
│    Σ_t [                                                                │
│      Effective_Time(t) / Required_Time(t)                               │
│    ]                                                                    │
│                                                                         │
│  Required_Time(t) = Task_Difficulty(t)                                  │
│    × (1 - Q1_efficiency(t))                                            │
│    × (1 + cognitive_load_excess(t))                                    │
│                                                                         │
│  Effective_Time(t) = Available_Time(t)                                  │
│    × Q2_engagement(t)                                                   │
│    × concentration(t)                                                   │
│    × strategy_appropriateness(t)                                        │
│                                                                         │
│  ここで：                                                               │
│    Q1_efficiency = f(F1, F2, F4, F6, F7, F10)                          │
│    Q2_engagement = g(F5, F8, F9, F11, F12)                             │
│    concentration = F12.flow_probability × F5.attention_focusing         │
│    strategy_appropriateness = F6.canApply() × F5.task_strategy_use     │
│    cognitive_load_excess = max(0, actual_load - optimal_load) / 100     │
│                                                                         │
│  学習効果 ≈ Q1 × Q2（乗算的関係）                                      │
│  → バランスが崩れるとQ1×Q2の積が急減する                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: 段階的移行システム（Zimmerman 4段階 × Carroll時間モデル）

### 3.1 問題の所在

アーキタイプ遷移条件（H→G→F→E→B→A）は定義されているが、遷移は**不連続なジャンプ**として設計されている。実際の学習者発達は連続的なグラデーションであり、パラメータの急変は有害。

### 3.2 設計：段階的フェイディングエンジン

```typescript
/**
 * 段階的移行エンジン
 * 
 * 核心思想：
 * Zimmermanの4発達段階（観察→模倣→自己制御→自己調整）を
 * アーキタイプ遷移と連動させ、支援の「グラデーション」を実装する。
 * 
 * 各アーキタイプ内での支援レベルを0.0〜1.0で表現し、
 * 遷移条件に近づくにつれて段階的にフェイディングする。
 */

interface StagedTransitionEngine {
  
  /**
   * 支援フェイディング関数
   * 
   * within_archetype_progress: 現在のアーキタイプ内での進捗（0.0-1.0）
   *   0.0 = このアーキタイプに入ったばかり
   *   1.0 = 次のアーキタイプへの遷移直前
   * 
   * 支援レベル = archetype_base_support × (1 - within_archetype_progress × fade_rate)
   */
  computeSupportLevel(
    currentArchetype: string,
    withinArchetypeProgress: number,
    targetArchetype: string
  ): SupportLevelProfile
  
  /**
   * Zimmerman発達段階との連動
   * 
   * H（回避者）: 観察段階 → AIが完全にモデリングを見せる
   * G（依存者）: 模倣段階 → AIの模倣を練習する
   * F/E/C（中間）: 自己制御段階 → 手がかりを頼りに自力でやる
   * A/B（自律）: 自己調整段階 → 完全に自律的
   * 
   * 重要：アーキタイプ遷移とZimmerman段階遷移は必ずしも一致しない。
   * アーキタイプは多軸だが、Zimmerman段階はSRLの1次元。
   * → SRL発達段階はアーキタイプ遷移の「必要条件の一つ」として扱う。
   */
  mapToZimmermanStage(archetype: string, srlProfile: F5_SRLProfile): ZimmermanStage
  
  /**
   * 「支援の段階的移行」の具体例
   * 
   * G（依存者）→ F（不安定挑戦者）への遷移グラデーション：
   * 
   * progress 0.0-0.3: G の完全パラメータ
   *   structure: 0.85, hints: 0.8, demonstration: partial
   * 
   * progress 0.3-0.6: G→F ブレンド
   *   structure: 0.85→0.65（徐々に低下）
   *   hints: 0.8→0.6
   *   demonstration: partial → 時々 partial、通常はなし
   *   goal_prompt: guided → example（テンプレートから例示へ）
   *   monitoring_interval: 3→5（モニタリング頻度を下げる）
   * 
   * progress 0.6-1.0: F に近い
   *   structure: 0.65→0.50
   *   hints: 0.6→0.45
   *   retrieval_mode: recognition → cued_recall（検索難度UP）
   *   reflection: binary → scaled（振り返りの深化）
   */
  computeBlendedParameters(
    fromArchetype: string,
    toArchetype: string,
    progress: number
  ): IntegratedControlParameters
}

/**
 * within_archetype_progress の算出方法
 * 
 * 遷移条件が複数あるため、各条件の充足度を正規化して平均する
 */
function computeWithinArchetypeProgress(
  currentArchetype: string,
  targetArchetype: string,
  studentMetrics: StudentMetrics
): number {
  const conditions = getTransitionConditions(currentArchetype, targetArchetype)
  
  let totalProgress = 0
  for (const condition of conditions) {
    const currentValue = studentMetrics[condition.metric]
    const threshold = condition.threshold
    const progress = Math.min(1.0, currentValue / threshold)
    totalProgress += progress * condition.weight
  }
  
  return totalProgress  // 0.0 〜 1.0
}

/**
 * 遷移条件の定義（改訂版 — グラデーション対応）
 */
const TRANSITION_CONDITIONS = {
  'G→F': {
    conditions: [
      { metric: 'weekly_correct_rate_3w', threshold: 0.60, weight: 0.3 },
      { metric: 'srl_forethought_score', threshold: 40, weight: 0.25 },
      { metric: 'consecutive_sessions_completed', threshold: 9, weight: 0.2 },
      { metric: 'hint_dependency_decrease', threshold: 0.2, weight: 0.15 },
      { metric: 'self_monitoring_spontaneous', threshold: 2, weight: 0.1 }
    ],
    minimum_duration_weeks: 3,
    rollback_condition: 'correct_rate < 0.40 for 2 consecutive weeks'
  },
  
  'F→E': {
    conditions: [
      { metric: 'anxiety_level', threshold: 50, weight: 0.3, direction: 'below' },
      { metric: 'relatedness_satisfaction', threshold: 50, weight: 0.3 },
      { metric: 'peer_interaction_count', threshold: 3, weight: 0.2 },
      { metric: 'motivation_continuum_score', threshold: 40, weight: 0.2 }
    ],
    minimum_duration_weeks: 4,
    rollback_condition: 'anxiety_level > 70 for 1 week'
  },
  
  'F→B': {
    conditions: [
      { metric: 'anxiety_level', threshold: 50, weight: 0.25, direction: 'below' },
      { metric: 'strategy_consistency_4w', threshold: 0.7, weight: 0.25 },
      { metric: 'srl_monitoring_score', threshold: 50, weight: 0.25 },
      { metric: 'effort_attribution_ratio', threshold: 0.6, weight: 0.25 }
    ],
    minimum_duration_weeks: 4,
    rollback_condition: 'strategy_consistency < 0.4 for 2 weeks'
  },
  
  'D→B': {
    conditions: [
      { metric: 'anxiety_stable_below_50_weeks', threshold: 4, weight: 0.35 },
      { metric: 'motivation_internalization', threshold: 'identified', weight: 0.35 },
      { metric: 'error_tolerance_behavior', threshold: 0.5, weight: 0.15 },
      { metric: 'growth_mindset_score', threshold: 60, weight: 0.15 }
    ],
    minimum_duration_weeks: 6,
    rollback_condition: 'anxiety_spike > 80 for 3 consecutive sessions'
  },
  
  'B→A': {
    conditions: [
      { metric: 'srl_developmental_level', threshold: 'self_regulation', weight: 0.3 },
      { metric: 'all_axes_above_60', threshold: true, weight: 0.3 },
      { metric: 'intrinsic_motivation_score', threshold: 70, weight: 0.2 },
      { metric: 'metacognitive_awareness', threshold: 70, weight: 0.2 }
    ],
    minimum_duration_weeks: 8,
    rollback_condition: 'any axis drops below 50 for 3 weeks'
  }
}
```

### 3.3 ロールバック（逆遷移）のハンドリング

```typescript
/**
 * 逆遷移は「失敗」ではなく「安全ネット」
 * 
 * 重要：ロールバック時は元のアーキタイプの完全パラメータに
 * 「戻す」のではなく、ロールバック前の進捗の80%から再開する。
 * 
 * これにより「2歩進んで1歩戻る」パターンが可能になり、
 * 完全なやり直しにはならない。
 */
function handleRollback(
  studentId: string,
  fromArchetype: string,
  toArchetype: string,  // 戻り先
  previousProgress: number
): RollbackPlan {
  return {
    target_archetype: toArchetype,
    restart_progress: previousProgress * 0.8,  // 80%地点から再開
    support_increase: 0.2,  // 支援を20%だけ増加
    teacher_notification: `${studentId}が${fromArchetype}→${toArchetype}に一時的にロールバックしました。支援を少し増やします。`,
    monitoring_interval: 'daily',  // 日次でモニタリング
    re_evaluation_after_weeks: 2   // 2週間後に再評価
  }
}
```

---

## Part 4: 感情前提層（Emotion-First Architecture）

### 4.1 問題の所在

Immordino-Yangの最重要知見：
> 「私たちは感情的に関心のあることだけを考える」

これは現在のシステムにおいて、F12（感情-認知統合理論）が「12理論の1つ」として扱われていることと矛盾する。感情は**他の11理論のすべてに先立つ前提条件**であり、アーキテクチャの最上位層に位置づけるべきである。

### 4.2 設計：Emotion Gatekeeper

```typescript
/**
 * Emotion Gatekeeper（感情門番）
 * 
 * 全ての学習制御パラメータが適用される前に、
 * 感情状態をチェックし、「学習可能状態」かどうかを判定する。
 * 
 * Immordino-Yang原則の実装：
 * 「感情的にreadyでなければ、どんな認知的最適化も無効」
 * 
 * Pekrunの制御-価値理論の実装：
 * 「覚醒度×感情価が学習効率を決定する」
 */

interface EmotionGatekeeper {
  
  /**
   * 感情ゲートチェック
   * 
   * 学習開始前、および問題ごとに実行
   * 
   * 判定結果：
   * - GREEN: 学習可能。通常制御を適用
   * - YELLOW: 注意が必要。Q2優先モードへ
   * - RED: 学習不能。感情回復プロトコルを起動
   */
  checkEmotionalReadiness(
    emotionalState: F12_AffectProfile,
    recentBehavior: RealtimeBehaviorData
  ): EmotionalGateResult
}

interface EmotionalGateResult {
  status: 'GREEN' | 'YELLOW' | 'RED'
  
  // 感情指標
  arousal_zone: 'too_low' | 'optimal' | 'too_high'  // Yerkes-Dodson
  valence: 'negative' | 'neutral' | 'positive'
  flow_proximity: number  // 0-1: フロー状態への近さ
  
  // 判定の根拠
  signals: EmotionalSignal[]
  
  // 推奨アクション
  recommended_action: EmotionalAction
}

interface EmotionalSignal {
  type: 'behavioral' | 'performance' | 'temporal' | 'self_report'
  indicator: string
  value: number
  interpretation: string
}

/**
 * 感情シグナルの検出方法
 * 
 * 注意：自由進度学習のAIシステムには顔認識や音声分析はない。
 * 利用可能なのは以下の間接指標のみ。
 */
const EMOTIONAL_SIGNAL_DETECTORS = {
  
  behavioral: {
    // 行動パターンから推定
    rapid_clicking: {
      // 短時間で多数のクリック → 焦りまたは退屈
      threshold: '3 clicks in 2 seconds',
      interpretation: 'frustration or disengagement'
    },
    long_idle: {
      // 長時間のアイドル → 集中の喪失
      threshold: '90 seconds without interaction',
      interpretation: 'disengagement or confusion'
    },
    hint_spam: {
      // ヒントを連続で要求 → 学習性無力感
      threshold: '3 hints in 1 problem without reading',
      interpretation: 'learned helplessness signal'
    },
    answer_without_reading: {
      // 問題を読まずに回答 → 離脱
      threshold: 'response_time < 3 seconds for complex problem',
      interpretation: 'complete disengagement'
    }
  },
  
  performance: {
    // パフォーマンスパターンから推定
    error_cascade: {
      threshold: '3+ consecutive errors',
      interpretation: 'frustration accumulating'
    },
    sudden_performance_drop: {
      threshold: 'accuracy drops 30%+ from session average',
      interpretation: 'emotional disruption or fatigue'
    },
    excessive_time: {
      threshold: 'time_on_problem > 3× average',
      interpretation: 'stuck and possibly anxious'
    }
  },
  
  temporal: {
    // 時間帯パターン
    session_fatigue: {
      threshold: 'session_duration > 40 minutes',
      interpretation: 'cognitive fatigue likely'
    },
    end_of_day: {
      threshold: 'time > 15:00 and 5th period',
      interpretation: 'reduced arousal expected'
    }
  },
  
  self_report: {
    // 自己報告（セッション開始時の簡易チェック）
    emoji_check: {
      // 😊 😐 😢 😤 😴 の5択
      options: ['happy', 'neutral', 'sad', 'frustrated', 'tired'],
      frequency: 'session_start + every_15_minutes'
    }
  }
}

/**
 * 感情状態 → 覚醒度・感情価の推定
 * 
 * Pekrunの2次元モデルを使用：
 * - 覚醒度（Arousal）: 低覚醒(退屈)←→高覚醒(不安)
 * - 感情価（Valence）: 不快←→快
 * 
 * 最適ゾーン：中程度の覚醒 × 正の感情価 = 「楽しい集中」= フロー
 */
function estimateEmotionalState(signals: EmotionalSignal[]): F12_AffectProfile {
  let arousal = 50  // デフォルト中程度
  let valence = 0   // デフォルトニュートラル
  
  for (const signal of signals) {
    switch (signal.type) {
      case 'behavioral':
        if (signal.indicator === 'rapid_clicking') {
          arousal += 20  // 覚醒度上昇
          valence -= 30  // 感情価低下
        }
        if (signal.indicator === 'long_idle') {
          arousal -= 30  // 覚醒度低下
          valence -= 10
        }
        break
      
      case 'performance':
        if (signal.indicator === 'error_cascade') {
          arousal += 15
          valence -= 25
        }
        if (signal.indicator === 'sudden_performance_drop') {
          arousal += 10
          valence -= 20
        }
        break
      
      case 'self_report':
        // 直接的な指標として最も信頼度が高い
        arousal = signal.value  // 直接使用
        valence = signal.value  // 直接使用
        break
    }
  }
  
  // クランプ
  arousal = Math.max(0, Math.min(100, arousal))
  valence = Math.max(-100, Math.min(100, valence))
  
  // フロー確率の推定
  const flow_probability = computeFlowProbability(arousal, valence)
  
  return {
    current_arousal: arousal,
    current_valence: valence,
    academic_enjoyment: Math.max(0, valence),
    academic_anxiety: arousal > 70 ? arousal - 50 : 0,
    academic_boredom: arousal < 30 ? 50 - arousal : 0,
    flow_state_probability: flow_probability
  }
}

/**
 * フロー確率の算出
 * 
 * Csikszentmihalyi (1990): フロー = スキルとチャレンジのバランス
 * Pekrun (2006): 活動に関連する正の感情 = 高覚醒 × 正の価値
 * 
 * フロー確率 = arousal_optimality × valence_positivity
 */
function computeFlowProbability(arousal: number, valence: number): number {
  // 覚醒度の最適性（50-70が最適、Yerkes-Dodson法則）
  const arousal_optimality = arousal >= 50 && arousal <= 70
    ? 1.0
    : arousal >= 40 && arousal <= 80
      ? 0.7
      : arousal >= 30 && arousal <= 90
        ? 0.3
        : 0.1
  
  // 感情価の正性
  const valence_positivity = valence > 50
    ? 1.0
    : valence > 20
      ? 0.7
      : valence > 0
        ? 0.4
        : valence > -30
          ? 0.2
          : 0.0
  
  return arousal_optimality * valence_positivity
}
```

### 4.3 Emotion Gatekeeper のシステム上の位置づけ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      学習制御フロー（改訂版）                            │
│                                                                         │
│  ① 生徒が問題に取り組む                                                │
│         ↓                                                               │
│  ② Emotion Gatekeeper が感情ゲートチェック                              │
│         ↓                                                               │
│     ┌───┬────────┬───────────────────────────────────┐                   │
│     │   │        │                                     │                 │
│   GREEN YELLOW   RED                                                    │
│     │   │        │                                     │                 │
│     │   │    ③-R 感情回復プロトコル起動                │                 │
│     │   │        ├─ phase1: 即時安全確保                │                 │
│     │   │        ├─ phase2: 選択肢提示                  │                 │
│     │   │        └─ phase3: 教師通知                    │                 │
│     │   │                                              │                 │
│     │   ③-Y Q2優先モード                               │                 │
│     │   ├─ Q1最適化を50%に抑制                          │                 │
│     │   └─ SDT支援を強化                                │                 │
│     │                                                   │                 │
│  ③-G 通常の4層カスケード制御                             │                 │
│     ├─ Layer 4 制約チェック                              │                 │
│     ├─ Layer 3 週次計画参照                              │                 │
│     ├─ Layer 2 セッション計画参照                        │                 │
│     └─ Layer 1 瞬時制御 (Q1-Q2バランス最適化)            │                 │
│         ↓                                               │                 │
│  ④ 制御パラメータ出力                                    │                 │
│         ↓                                               │                 │
│  ⑤ 問題提示・足場・ヒント・フィードバック                │                 │
│         ↓                                               │                 │
│  ⑥ 生徒の反応収集                                       │                 │
│         ↓                                               │                 │
│  ⑦ フィードバックループ（① に戻る）                      │                 │
│                                                         │                 │
│  ★ Emotion Gatekeeper は ② と ⑥ の間に常時稼働          │                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: 既存コードとの差分分析・改修ロードマップ

### 5.1 既存コードの棚卸し

| ファイル | 現在の役割 | 本計画との関係 |
|---------|-----------|--------------|
| `theory-system-api.ts` | 12理論マスター情報のCRUD | そのまま維持。Layer 4の入力源 |
| `theory-assessment.ts` | 適性診断エンジン | そのまま維持。プロファイル生成の基盤 |
| `dynamic-theory-optimizer.ts` | 学習履歴→スコア自動更新 | **大幅改修**。Layer 3/4の更新ロジックに統合 |
| `ai-problem-theory-integration.ts` | 理論ベースの問題生成 | **改修**。Layer 1の出力を受け取る形に |
| `card-theory-integration.ts` | 理論ベースのカード推薦 | **改修**。Layer 2/3の計画を反映 |
| `adaptive-learning.ts` | 難易度調整 | **統合**。Layer 1に吸収 |
| `realtime-learning-session.ts` | リアルタイム学習セッション | **改修**。Emotion Gatekeeperを組み込み |
| `spaced-repetition.ts` | 間隔反復スケジュール | **統合**。Layer 3のspacingPlanに |
| `ai-feedback.ts` | AIフィードバック | **改修**。Q1-Q2バランスを反映 |
| `learning-path.ts` | 学習パス | **改修**。Layer 4の発達方針を反映 |

### 5.2 新規作成ファイル

| ファイル | 役割 | 対応するPart |
|---------|------|-------------|
| `src/cascade-control-engine.ts` | 4層カスケード制御エンジン | Part 1 |
| `src/q1q2-balance-engine.ts` | Q1-Q2統合エンジン | Part 2 |
| `src/staged-transition-engine.ts` | 段階的移行エンジン | Part 3 |
| `src/emotion-gatekeeper.ts` | 感情門番 | Part 4 |

### 5.3 DB拡張

```sql
-- 新規テーブル

-- Layer 4 の状態保存
CREATE TABLE IF NOT EXISTS student_developmental_policy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  mdl_stage TEXT NOT NULL,                    -- acclimation / competency / proficiency
  archetype TEXT NOT NULL,                    -- A-H
  allowed_ranges_json TEXT NOT NULL,          -- 制約範囲のJSON
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Layer 3 の状態保存
CREATE TABLE IF NOT EXISTS student_weekly_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  spacing_plan_json TEXT,
  kolb_gaps_json TEXT,
  sdt_balance_json TEXT,
  transition_proximity_json TEXT,
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Q1-Q2スコア履歴
CREATE TABLE IF NOT EXISTS q1q2_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  session_id TEXT,
  q1_score REAL NOT NULL,
  q2_score REAL NOT NULL,
  integrated_effectiveness REAL NOT NULL,     -- Q1×Q2
  arbitration_decision TEXT,                  -- q1_focus / q2_focus / balanced / emergency_q2
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 感情ゲートログ
CREATE TABLE IF NOT EXISTS emotional_gate_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  session_id TEXT,
  gate_status TEXT NOT NULL,                  -- GREEN / YELLOW / RED
  arousal_estimated REAL,
  valence_estimated REAL,
  flow_probability REAL,
  signals_json TEXT,
  action_taken TEXT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- アーキタイプ遷移ログ
CREATE TABLE IF NOT EXISTS archetype_transition_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  from_archetype TEXT NOT NULL,
  to_archetype TEXT NOT NULL,
  transition_type TEXT NOT NULL,              -- forward / rollback
  within_progress REAL,                       -- 遷移時のprogress値
  conditions_met_json TEXT,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_developmental_policy_student 
  ON student_developmental_policy(student_id, computed_at);
CREATE INDEX IF NOT EXISTS idx_weekly_plan_student 
  ON student_weekly_plan(student_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_q1q2_student_session 
  ON q1q2_score_history(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_emotional_gate_student 
  ON emotional_gate_log(student_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_transition_log_student 
  ON archetype_transition_log(student_id, triggered_at);
```

### 5.4 実装フェーズ

```
Phase A: 感情前提層（1-2週間）
  ├─ emotion-gatekeeper.ts の実装
  ├─ 感情シグナル検出ロジック
  ├─ emoji自己報告UIの追加
  ├─ emotional_gate_log テーブル作成
  └─ realtime-learning-session.ts への組み込み

Phase B: Q1-Q2統合エンジン（1-2週間）
  ├─ q1q2-balance-engine.ts の実装
  ├─ Q1/Q2スコアの算出ロジック
  ├─ 自動調停ルール
  ├─ Q2緊急回復プロトコル
  ├─ q1q2_score_history テーブル作成
  └─ 既存フィードバックロジックとの統合

Phase C: 4層カスケード制御（2-3週間）
  ├─ cascade-control-engine.ts の実装
  │   ├─ Layer 4: 長期発達コントローラ
  │   ├─ Layer 3: 週次最適化コントローラ
  │   ├─ Layer 2: セッションコントローラ
  │   └─ Layer 1: 瞬時制御コントローラ（既存改修）
  ├─ 制約伝搬メカニズム
  ├─ 安全弁（safety override）
  ├─ student_developmental_policy, student_weekly_plan テーブル作成
  └─ 既存computeIntegratedControlsの改修

Phase D: 段階的移行エンジン（1-2週間）
  ├─ staged-transition-engine.ts の実装
  ├─ within_archetype_progress の算出
  ├─ パラメータのグラデーション生成
  ├─ ロールバック処理
  ├─ archetype_transition_log テーブル作成
  └─ Layer 4 との統合

Phase E: 統合テスト・検証（1-2週間）
  ├─ サンプル学習者A（自律的探究者）シミュレーション
  ├─ サンプル学習者H（学習回避者）シミュレーション
  ├─ 遷移シナリオテスト（H→G→F→B→A）
  ├─ Q2緊急プロトコルテスト
  ├─ カスケード制約違反テスト
  └─ 教師ダッシュボードへの統合
```

---

## Part 6: 全体アーキテクチャ図

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ★ 12理論が照らす世界 → システムアーキテクチャ ★                           │
│                                                                              │
│   「学習は感情駆動の社会的プロセスであり、                                   │
│    子どもは文化的ツールを用いて認知を再編成し、                              │
│    新たなアイデンティティを形成する」                                        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                     Emotion Gatekeeper（感情門番）                   │    │
│   │                                                                     │    │
│   │   Immordino-Yang原則:                                               │    │
│   │   「感情的に関心がないことは学べない」                               │    │
│   │                                                                     │    │
│   │   → 全制御の前提条件として感情をチェック                            │    │
│   │   → RED/YELLOW/GREEN の信号機モデル                                 │    │
│   │   → REDなら他のすべてを停止し感情回復に専念                         │    │
│   └─────────────────────────┬───────────────────────────────────────────┘    │
│                             ↓ GREEN の場合                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │              Q1-Q2 Balance Engine（二大問い調停器）                   │    │
│   │                                                                     │    │
│   │   Q1: 認知効率の最適化（必要学習時間 ↓）                           │    │
│   │     └─ F1(VARK) F2(MI) F4(ATI) F6(CogSci) F7(Scaffold) F10(Domain)│    │
│   │                                                                     │    │
│   │   Q2: 学習継続意欲の維持（有効学習時間 ↑）                         │    │
│   │     └─ F5(SRL) F8(SDT) F9(21C) F11(Authentic) F12(Affect)         │    │
│   │                                                                     │    │
│   │   効果 ≈ Q1 × Q2（乗算的）→ バランス崩壊は致命的                  │    │
│   └─────────────────────────┬───────────────────────────────────────────┘    │
│                             ↓                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │         4-Layer Cascade Control（4層カスケード制御）                 │    │
│   │                                                                     │    │
│   │  L4 長期(月)   ─ MDL段階 × アーキタイプ → 制約範囲を設定           │    │
│   │       ↓                                                             │    │
│   │  L3 中期(週)   ─ 間隔効果 × Kolb × SDT → 週次計画                 │    │
│   │       ↓                                                             │    │
│   │  L2 短期(セッション) ─ SRL位相 × 表示 × 検索 → セッション計画     │    │
│   │       ↓                                                             │    │
│   │  L1 瞬時(問題) ─ 足場 × 感情 × ATI → 即時制御パラメータ           │    │
│   │                                                                     │    │
│   │  ★ 上位が制約、下位が微調整（瞬時反応が長期を損なわない）          │    │
│   └─────────────────────────┬───────────────────────────────────────────┘    │
│                             ↓                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │        Staged Transition Engine（段階的移行エンジン）                │    │
│   │                                                                     │    │
│   │  H(回避)→G(依存)→F(不安定)→E(社交)/B(努力)→A(探究)               │    │
│   │                                                                     │    │
│   │  ・不連続ジャンプではなくグラデーション遷移                         │    │
│   │  ・Zimmerman 4段階（観察→模倣→自己制御→自己調整）と連動            │    │
│   │  ・ロールバックは進捗の80%から再開（完全やり直しにはしない）        │    │
│   │  ・最終目標：支援そのものが不要になること                           │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                      Carroll 時間モデル（全体の糊）                  │    │
│   │                                                                     │    │
│   │   学習到達度 = Σ_t [ 有効学習時間(t) / 必要学習時間(t) ]            │    │
│   │                                                                     │    │
│   │   12理論すべてはこの等式の「分子を増やすか分母を減らすか」に帰着    │    │
│   │   効果は乗算的 → 片方がゼロなら全体もゼロ                           │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: 検証シナリオ

### 7.1 シナリオ1：タイプH（学習回避者）佐藤くん

```
初期状態:
  アーキタイプ: H（学習回避者）
  SRL発達段階: observation（観察）
  MDL段階: acclimation（順応）
  Q1: 20, Q2: 15
  感情ゲート: RED

Week 1:
  Layer 4: structure_range [0.85-0.95], zpd_range [0.10-0.25]
  Emotion Gatekeeper → RED → 感情回復プロトコル起動
  → 超簡単な問題 + 完全モデリング + 励ましメッセージ
  → emojiチェックで😐が出始める
  
  Q2が25まで回復 → YELLOW
  → 選択肢3つ提示 + 自己成長表示
  → 小さな成功体験を5回連続で設計
  
  Q2が40まで回復 → GREEN
  → 通常制御開始（H デフォルト）

Week 4:
  H→G 遷移条件をモニタリング
  within_archetype_progress: 0.3
  → まだHのパラメータだが、少しずつhint_proactivenessが0.95→0.85に

Week 8:
  within_archetype_progress: 0.7
  → G に近いパラメータにブレンド
  → structure: 0.90, zpd: 0.20, demonstration: partial

Week 10:
  H→G 遷移完了
  → G デフォルトパラメータに移行
  → 教師に通知：「佐藤くんがGタイプに遷移しました」
```

### 7.2 シナリオ2：タイプD（慎重な完璧主義者）鈴木さん

```
初期状態:
  アーキタイプ: D（慎重な完璧主義者）
  SRL発達段階: self_control
  MDL段階: competency
  Q1: 75, Q2: 40（不安によりQ2が低い）
  感情ゲート: YELLOW

Week 1:
  Q1-Q2 Balance Engine → q2_focus（Q2優先モード）
  → 難易度を下げずに（Q1を維持）、感情的安全を強化
  → 方略帰属ガイダンス：「この解き方を使ったから正解できたね」
  → 成功後の振り返り：「どんな工夫をした？」
  
  Q2が55に回復 → balanced モードへ

Week 4:
  D→B 遷移条件をモニタリング
  anxiety_stable_below_50: 2 weeks（目標4 weeks）
  motivation_internalization: introjected → identified へ移行中
  
Week 8:
  D→B 遷移条件 3/4 充足
  within_archetype_progress: 0.65
  → error_toleranceが0.6→0.7にグラデーション上昇
  → soft_languageがgraduallyに減少

Week 12:
  D→B 遷移完了
  → Bタイプへ
  → 不安レベルが安定的に40以下
```

---

## Part 8: 設計原則のまとめ

1. **感情は前提であり、変数の一つではない** — Emotion Gatekeeperが全制御に先立つ
2. **効果は乗算的** — Q1×Q2のバランスが崩れると全体が崩壊する
3. **上位が制約し、下位が微調整する** — 瞬時反応が長期成長を損なわないカスケード
4. **遷移はグラデーション** — 不連続なジャンプではなく滑らかなフェイディング
5. **最終目標は支援の不要化** — 全パラメータは「フェイディングの方向」を持つ
6. **安全弁は常に感情側に開く** — 制約超越の唯一の例外は感情的危機
7. **社会比較の完全禁止** — 進度の可視化は自己比較のみ
8. **教師は最後の砦** — AIで対応できない場合の人間介入フラグ

---

## 承認事項

本計画書の承認後、Phase A（感情前提層）から実装を開始します。

- Phase A: 感情前提層（1-2週間）
- Phase B: Q1-Q2統合エンジン（1-2週間）
- Phase C: 4層カスケード制御（2-3週間）
- Phase D: 段階的移行エンジン（1-2週間）
- Phase E: 統合テスト・検証（1-2週間）

**合計見積もり: 6-10週間**

---

**参照文書:**
- THEORY_CAUSAL_MODEL.md — 12理論因果モデル設計書
- THEORY_DEEP_ANALYSIS.md — 12理論精密分析
- THEORY_BRIEFING_12THEORIES.md — 12理論ブリーフィング
- Carroll, J. B. (1963). A model of school learning. Teachers College Record, 64, 723-733.
- Immordino-Yang, M. H. (2016). Emotions, Learning, and the Brain. Norton.
- Pekrun, R. (2006). The Control-Value Theory of Achievement Emotions. Educational Psychology Review, 18, 315-341.
- Zimmerman, B. J. (2002). Becoming a self-regulated learner. Theory Into Practice, 41(2), 64-70.
- Zimmerman, B. J., & Kitsantas, A. (2005). The Hidden Dimension of Personal Competence. In A. J. Elliot & C. S. Dweck (Eds.), Handbook of Competence and Motivation.
