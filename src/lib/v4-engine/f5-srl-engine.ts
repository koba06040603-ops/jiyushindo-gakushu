/**
 * F5: 多位相自己調整学習 (Multi-phase Self-Regulated Learning) エンジン
 * 
 * 理論的根拠:
 * - Zimmerman (2000): 3相SRLサイクル（予見→遂行→内省）
 * - Zimmerman & Kitsantas (2005): 4発達段階（観察→模倣→自己制御→自己調整）
 * - Pintrich (2000): SRLの4領域（認知・動機・行動・文脈）
 * 
 * 核心: SRLは静的な能力ではなく「過程」であり、AIは適切なタイミングで
 *       Think-Aloudモデリングを提供し、足場を段階的にフェイドすることで
 *       子どもの自己調整力の発芽を支援する。
 * 
 * 子ども観(v4): 「この子は自分の学びにどう舵を取っているか」を理解する視座。
 * Carroll作用: 有効学習時間を増加（メタ認知による学習効率↑ + 必要学習時間の自己最適化）
 * 
 * エフェクトサイズ:
 * - SRL介入全体: d=0.69 (Dignath & Büttner, 2008)
 * - メタ認知プロンプト: d=0.40 (Hattie, 2009)
 * - 自己モニタリング: d=0.45 (Schunk & Zimmerman, 1998)
 */

import type {
  F5_SRLProfile,
  F12_AffectProfile,
  F8_MotivationProfile,
  ArchetypeId,
  RealtimeBehaviorData,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: SRL位相の検出と判定
// ============================================================

/** SRL位相 */
export type SRLPhase = 'forethought' | 'performance' | 'self_reflection'

/** SRL位相の詳細な下位過程 */
export interface SRLPhaseDetail {
  /** 現在の主要位相 */
  current_phase: SRLPhase
  /** 位相の確信度 (0-1) */
  confidence: number
  /** 下位過程の活性度 */
  sub_processes: {
    // 予見段階
    task_analysis_active: boolean
    goal_setting_active: boolean
    strategic_planning_active: boolean
    // 遂行段階
    attention_focusing_active: boolean
    self_monitoring_active: boolean
    strategy_use_active: boolean
    // 内省段階
    self_evaluation_active: boolean
    attribution_active: boolean
    adaptation_active: boolean
  }
  /** 推定の根拠 */
  reasoning: string
}

/**
 * リアルタイム行動データからSRL位相を検出する
 * 
 * 行動パターンからの推定:
 * - セッション開始直後 → 予見段階
 * - 問題解答中 → 遂行段階
 * - 解答直後（ヒント後/正答後） → 内省段階への移行タイミング
 */
export function detectSRLPhase(
  behavior: RealtimeBehaviorData,
  profile: F5_SRLProfile,
): SRLPhaseDetail {
  // セッション開始直後 (0-2分) → 予見段階
  if (behavior.session_duration_minutes < 2) {
    return {
      current_phase: 'forethought',
      confidence: 0.8,
      sub_processes: {
        task_analysis_active: true,
        goal_setting_active: true,
        strategic_planning_active: profile.forethought.strategic_planning > 50,
        attention_focusing_active: false,
        self_monitoring_active: false,
        strategy_use_active: false,
        self_evaluation_active: false,
        attribution_active: false,
        adaptation_active: false,
      },
      reasoning: 'セッション開始直後 → 予見段階（目標設定・課題分析の時間）',
    }
  }

  // 行動パターンに基づく位相判定
  if (behavior.current_srl_phase !== 'unknown') {
    // UIから明示的に位相が報告されている場合
    return buildPhaseDetailFromExplicit(behavior.current_srl_phase as SRLPhase, profile, behavior)
  }

  // 行動パターンから推定
  // 連続正解/不正解の直後 → 内省の機会
  if (behavior.consecutive_successes >= 3 || behavior.consecutive_errors >= 2) {
    return {
      current_phase: 'self_reflection',
      confidence: 0.6,
      sub_processes: {
        task_analysis_active: false,
        goal_setting_active: false,
        strategic_planning_active: false,
        attention_focusing_active: false,
        self_monitoring_active: false,
        strategy_use_active: false,
        self_evaluation_active: true,
        attribution_active: behavior.consecutive_errors >= 2,
        adaptation_active: profile.self_reflection.adaptive_inference > 40,
      },
      reasoning: behavior.consecutive_successes >= 3
        ? '連続成功 → 内省段階（成功の振り返りの機会）'
        : '連続失敗 → 内省段階（方略の見直しの機会）',
    }
  }

  // デフォルト → 遂行段階
  return {
    current_phase: 'performance',
    confidence: 0.7,
    sub_processes: {
      task_analysis_active: false,
      goal_setting_active: false,
      strategic_planning_active: false,
      attention_focusing_active: true,
      self_monitoring_active: profile.performance.self_monitoring > 40,
      strategy_use_active: profile.performance.task_strategy_use > 40,
      self_evaluation_active: false,
      attribution_active: false,
      adaptation_active: false,
    },
    reasoning: '問題解答中 → 遂行段階（注意集中・自己モニタリング）',
  }
}

function buildPhaseDetailFromExplicit(
  phase: SRLPhase,
  profile: F5_SRLProfile,
  behavior: RealtimeBehaviorData,
): SRLPhaseDetail {
  switch (phase) {
    case 'forethought':
      return {
        current_phase: 'forethought',
        confidence: 0.9,
        sub_processes: {
          task_analysis_active: true,
          goal_setting_active: true,
          strategic_planning_active: profile.forethought.strategic_planning > 40,
          attention_focusing_active: false,
          self_monitoring_active: false,
          strategy_use_active: false,
          self_evaluation_active: false,
          attribution_active: false,
          adaptation_active: false,
        },
        reasoning: 'UI報告: 予見段階',
      }
    case 'performance':
      return {
        current_phase: 'performance',
        confidence: 0.9,
        sub_processes: {
          task_analysis_active: false,
          goal_setting_active: false,
          strategic_planning_active: false,
          attention_focusing_active: true,
          self_monitoring_active: profile.performance.self_monitoring > 40,
          strategy_use_active: profile.performance.task_strategy_use > 40,
          self_evaluation_active: false,
          attribution_active: false,
          adaptation_active: false,
        },
        reasoning: 'UI報告: 遂行段階',
      }
    case 'self_reflection':
      return {
        current_phase: 'self_reflection',
        confidence: 0.9,
        sub_processes: {
          task_analysis_active: false,
          goal_setting_active: false,
          strategic_planning_active: false,
          attention_focusing_active: false,
          self_monitoring_active: false,
          strategy_use_active: false,
          self_evaluation_active: true,
          attribution_active: profile.self_reflection.causal_attribution > 30,
          adaptation_active: profile.self_reflection.adaptive_inference > 40,
        },
        reasoning: 'UI報告: 内省段階',
      }
  }
}

// ============================================================
// Part 2: 4発達段階の評価と発達的足場
// ============================================================

/** SRL発達段階 */
export type SRLDevelopmentalStage = 'observation' | 'emulation' | 'self_control' | 'self_regulation'

/** 発達段階の評価結果 */
export interface DevelopmentalAssessment {
  /** 現在の発達段階 */
  current_stage: SRLDevelopmentalStage
  /** 次の段階への準備度 (0-1) */
  readiness_for_next: number
  /** 発達的支援の推奨 */
  support: DevelopmentalSupport
  /** 評価の根拠 */
  reasoning: string
}

/** 発達段階に応じた支援パラメータ */
export interface DevelopmentalSupport {
  /** AIモデリングの頻度 (0.0-1.0) — 高いほど頻繁にモデリングを見せる */
  modeling_frequency: number
  /** 模倣の機会を提供するか */
  imitation_opportunity: boolean
  /** 自己制御の手がかりを提供するか */
  self_control_cues: boolean
  /** 完全自律モードか */
  full_autonomy: boolean
}

/**
 * F5プロファイルから発達段階を評価する
 * 
 * Zimmerman & Kitsantas (2005) の4段階モデル:
 * 1. 観察 (Observation): モデルの行動を見て学ぶ — modeling_frequency 最大
 * 2. 模倣 (Emulation): モデルの行動を真似る — imitation_opportunity 提供
 * 3. 自己制御 (Self-control): 内在化されたモデルに基づき自力で行う — self_control_cues
 * 4. 自己調整 (Self-regulation): 自律的に状況に適応する — full_autonomy
 */
export function assessDevelopmentalStage(
  profile: F5_SRLProfile,
): DevelopmentalAssessment {
  const stage = profile.developmental_level

  // 次段階への準備度を算出
  const readiness = computeReadinessForNextStage(profile)

  // 発達段階に応じた支援パラメータ
  const support = getDevelopmentalSupport(stage, readiness)

  return {
    current_stage: stage,
    readiness_for_next: readiness,
    support,
    reasoning: buildDevelopmentalReasoning(stage, readiness, profile),
  }
}

/**
 * 次段階への準備度を算出
 */
function computeReadinessForNextStage(profile: F5_SRLProfile): number {
  const stage = profile.developmental_level

  switch (stage) {
    case 'observation': {
      // 観察→模倣: 課題分析と目標設定がある程度できている
      const taskScore = profile.forethought.task_analysis / 100
      const goalScore = profile.forethought.goal_setting / 100
      const efficacy = profile.forethought.self_efficacy / 100
      return Math.min(1, (taskScore * 0.4 + goalScore * 0.3 + efficacy * 0.3))
    }
    case 'emulation': {
      // 模倣→自己制御: 遂行段階の下位過程が機能し始めている
      const attention = profile.performance.attention_focusing / 100
      const monitoring = profile.performance.self_monitoring / 100
      const strategy = profile.performance.task_strategy_use / 100
      return Math.min(1, (attention * 0.3 + monitoring * 0.4 + strategy * 0.3))
    }
    case 'self_control': {
      // 自己制御→自己調整: 内省段階が安定して機能
      const evaluation = profile.self_reflection.self_evaluation / 100
      const attribution = profile.self_reflection.causal_attribution / 100
      const adaptation = profile.self_reflection.adaptive_inference / 100
      const metacog = profile.performance.metacognitive_awareness / 100
      return Math.min(1, (evaluation * 0.25 + attribution * 0.25 + adaptation * 0.25 + metacog * 0.25))
    }
    case 'self_regulation': {
      // 最終段階: 準備度は常に1.0（到達済み）
      return 1.0
    }
    default:
      return 0
  }
}

/**
 * 発達段階に応じた支援パラメータを生成
 */
function getDevelopmentalSupport(
  stage: SRLDevelopmentalStage,
  readiness: number
): DevelopmentalSupport {
  switch (stage) {
    case 'observation':
      return {
        modeling_frequency: 0.9 - (readiness * 0.3),  // 準備度が上がるほど減少
        imitation_opportunity: false,
        self_control_cues: false,
        full_autonomy: false,
      }
    case 'emulation':
      return {
        modeling_frequency: 0.5 - (readiness * 0.2),
        imitation_opportunity: true,
        self_control_cues: false,
        full_autonomy: false,
      }
    case 'self_control':
      return {
        modeling_frequency: 0.2 - (readiness * 0.15),
        imitation_opportunity: false,
        self_control_cues: true,
        full_autonomy: false,
      }
    case 'self_regulation':
      return {
        modeling_frequency: 0,
        imitation_opportunity: false,
        self_control_cues: false,
        full_autonomy: true,
      }
  }
}

function buildDevelopmentalReasoning(
  stage: SRLDevelopmentalStage,
  readiness: number,
  profile: F5_SRLProfile
): string {
  const stageName = {
    observation: '観察段階（モデルを見て学ぶ）',
    emulation: '模倣段階（モデルを真似る）',
    self_control: '自己制御段階（内在化されたモデルで自力実行）',
    self_regulation: '自己調整段階（自律的に適応）',
  }
  return `発達段階: ${stageName[stage]}, 次段階準備度: ${(readiness * 100).toFixed(0)}%。` +
    `自己効力感=${profile.forethought.self_efficacy}, メタ認知=${profile.performance.metacognitive_awareness}。`
}

// ============================================================
// Part 3: SRL制御パラメータの算出
// ============================================================

/** F5から導出されるSRL制御パラメータの全体 */
export interface F5_FullControls {
  /** 予見段階の足場 */
  forethought_scaffold: {
    /** 目標プロンプトの種類 */
    goal_prompt_type: 'none' | 'template' | 'example' | 'guided'
    /** 計画テンプレートの可視化 */
    planning_visibility: boolean
    /** 自己効力感メッセージ */
    efficacy_message: string | null
  }
  /** 遂行段階の足場 */
  performance_scaffold: {
    /** AI Think-Aloud モデリング */
    think_aloud_modeling: boolean
    /** 自己モニタリングプロンプト間隔（問題数） */
    monitoring_interval: number
    /** 方略ヒントレベル */
    strategy_hint_level: 'none' | 'implicit' | 'explicit'
  }
  /** 内省段階の足場 */
  reflection_scaffold: {
    /** 振り返りプロンプトの種類 */
    reflection_prompt_type: 'none' | 'binary' | 'scaled' | 'open_ended'
    /** 原因帰属ガイダンス */
    attribution_guidance: boolean
    /** 改善計画の支援 */
    improvement_planning: boolean
  }
  /** 発達的支援 */
  developmental: DevelopmentalSupport
  /** 位相検出結果 */
  phase_detail: SRLPhaseDetail
  /** 発達段階評価 */
  developmental_assessment: DevelopmentalAssessment
}

/**
 * F5の全制御パラメータを算出
 * 
 * 設計書の原則:
 * - 予見段階: 目標設定の足場は発達段階に応じてフェイド
 * - 遂行段階: Think-Aloudモデリングは観察・模倣段階でのみ積極的に
 * - 内省段階: 帰属ガイダンスは能力帰属が優勢な子に限定
 */
export function computeF5Controls(
  profile: F5_SRLProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId,
  affectProfile?: F12_AffectProfile,
): F5_FullControls {
  const phaseDetail = detectSRLPhase(behavior, profile)
  const devAssessment = assessDevelopmentalStage(profile)

  // 予見段階の足場
  const forethought_scaffold = computeForethoughtScaffold(profile, archetype, devAssessment)
  
  // 遂行段階の足場
  const performance_scaffold = computePerformanceScaffold(profile, archetype, devAssessment, behavior)

  // 内省段階の足場
  const reflection_scaffold = computeReflectionScaffold(profile, archetype, devAssessment, behavior)

  return {
    forethought_scaffold,
    performance_scaffold,
    reflection_scaffold,
    developmental: devAssessment.support,
    phase_detail: phaseDetail,
    developmental_assessment: devAssessment,
  }
}

/**
 * 予見段階の足場算出
 * 
 * 設計書 Part 2 F5 制御変数:
 * - goal_prompt_type: 目標プロンプトの種類（発達段階に応じて）
 * - planning_visibility: 計画テンプレートの可視化
 * - efficacy_message: 自己効力感メッセージ
 */
function computeForethoughtScaffold(
  profile: F5_SRLProfile,
  archetype: ArchetypeId,
  devAssessment: DevelopmentalAssessment,
): F5_FullControls['forethought_scaffold'] {
  // 目標プロンプトの種類: 発達段階とアーキタイプから決定
  let goal_prompt_type: 'none' | 'template' | 'example' | 'guided'

  if (devAssessment.current_stage === 'self_regulation') {
    // 自己調整段階 → プロンプト不要（自力でできる）
    goal_prompt_type = 'none'
  } else if (devAssessment.current_stage === 'self_control') {
    // 自己制御段階 → 例示で十分
    goal_prompt_type = 'example'
  } else if (devAssessment.current_stage === 'emulation') {
    // 模倣段階 → ガイド付き
    goal_prompt_type = 'guided'
  } else {
    // 観察段階 → テンプレート（最も構造的）
    goal_prompt_type = 'template'
  }

  // アーキタイプによる補正
  if (archetype === 'A' && goal_prompt_type !== 'none') {
    // 自律的探究者は不要でも提供は最小限に
    goal_prompt_type = profile.forethought.goal_setting > 70 ? 'none' : 'example'
  }
  if (archetype === 'H' || archetype === 'G') {
    // 回避者・依存者はより手厚い足場
    goal_prompt_type = goal_prompt_type === 'none' ? 'template' : goal_prompt_type
  }

  // 計画テンプレートの可視化
  const planning_visibility = devAssessment.current_stage !== 'self_regulation' &&
    profile.forethought.strategic_planning < 60

  // 自己効力感メッセージ
  let efficacy_message: string | null = null
  if (profile.forethought.self_efficacy < 40) {
    efficacy_message = '前回と比べて進んでいるところがあるよ'
  } else if (profile.forethought.self_efficacy < 60) {
    efficacy_message = '少しずつ自分のやり方が見えてきているね'
  }

  return { goal_prompt_type, planning_visibility, efficacy_message }
}

/**
 * 遂行段階の足場算出
 * 
 * 設計書 Part 2 F5 制御変数:
 * - think_aloud_modeling: AI Think-Aloudモデリング
 * - monitoring_interval: 自己モニタリングプロンプト間隔
 * - strategy_hint_level: 方略ヒントレベル
 */
function computePerformanceScaffold(
  profile: F5_SRLProfile,
  archetype: ArchetypeId,
  devAssessment: DevelopmentalAssessment,
  behavior: RealtimeBehaviorData,
): F5_FullControls['performance_scaffold'] {
  // Think-Aloud モデリング: 観察・模倣段階で積極的に
  const think_aloud_modeling =
    devAssessment.current_stage === 'observation' ||
    devAssessment.current_stage === 'emulation' ||
    (archetype === 'G' && profile.performance.metacognitive_awareness < 40) ||
    (archetype === 'H')

  // モニタリング間隔: 発達段階が低いほど短く（頻繁にチェック）
  let monitoring_interval: number
  switch (devAssessment.current_stage) {
    case 'observation': monitoring_interval = 2; break    // 2問ごと
    case 'emulation': monitoring_interval = 3; break      // 3問ごと
    case 'self_control': monitoring_interval = 5; break   // 5問ごと
    case 'self_regulation': monitoring_interval = 10; break // 10問ごと（自律に任せる）
  }
  // アーキタイプ補正
  if (archetype === 'A') monitoring_interval = Math.max(monitoring_interval, 8)
  if (archetype === 'G' || archetype === 'H') monitoring_interval = Math.min(monitoring_interval, 3)

  // 方略ヒントレベル
  let strategy_hint_level: 'none' | 'implicit' | 'explicit'
  if (profile.performance.task_strategy_use > 60) {
    strategy_hint_level = 'none'  // 自分で方略を選べる
  } else if (profile.performance.task_strategy_use > 30) {
    strategy_hint_level = 'implicit'  // ヒントだけ
  } else {
    strategy_hint_level = 'explicit'  // 明示的にガイド
  }

  return { think_aloud_modeling, monitoring_interval, strategy_hint_level }
}

/**
 * 内省段階の足場算出
 * 
 * 設計書 Part 2 F5 制御変数:
 * - reflection_prompt_type: 振り返りプロンプトの種類
 * - attribution_guidance: 原因帰属ガイダンス（能力帰属→努力帰属への転換支援）
 * - improvement_planning: 改善計画の支援
 */
function computeReflectionScaffold(
  profile: F5_SRLProfile,
  archetype: ArchetypeId,
  devAssessment: DevelopmentalAssessment,
  behavior: RealtimeBehaviorData,
): F5_FullControls['reflection_scaffold'] {
  // 振り返りプロンプトの種類: 発達段階に応じて
  let reflection_prompt_type: 'none' | 'binary' | 'scaled' | 'open_ended'
  switch (devAssessment.current_stage) {
    case 'observation':
      reflection_prompt_type = 'binary'       // 「できた？できなかった？」
      break
    case 'emulation':
      reflection_prompt_type = 'binary'       // まだ二値的に
      break
    case 'self_control':
      reflection_prompt_type = 'scaled'       // 「どのくらいできた？」
      break
    case 'self_regulation':
      reflection_prompt_type = 'open_ended'   // 自由記述
      break
  }
  // アーキタイプ補正
  if (archetype === 'A') reflection_prompt_type = 'open_ended'

  // 原因帰属ガイダンス: causal_attribution < 60 なら能力帰属優勢の可能性
  // 設計書: 「高い = 努力帰属」なので、低い = 能力帰属 → ガイダンスが必要
  const attribution_guidance = profile.self_reflection.causal_attribution < 60

  // 改善計画: 内省段階の機能が低い場合にサポート
  const improvement_planning =
    profile.self_reflection.adaptive_inference < 50 ||
    archetype === 'D' || // 完璧主義者は改善計画が自己批判になりがちなので手厚く
    archetype === 'G'    // 依存者は次の一歩が見えない

  return { reflection_prompt_type, attribution_guidance, improvement_planning }
}

// ============================================================
// Part 4: SRL × 感情の相互作用
// ============================================================

/**
 * 感情状態がSRL制御に与える影響を計算する
 * 
 * 因果チェーン（設計書 Part 3.1）:
 * - 不安 → 自己効力感↓ → 予見段階の機能低下
 * - フロー → メタ認知の自動化 → SRL足場不要
 * - 退屈 → 内発的興味↓ → 予見段階の目標設定が弱まる
 */
export function adjustSRLForAffect(
  controls: F5_FullControls,
  affectProfile: F12_AffectProfile,
): F5_FullControls {
  const adjusted = { ...controls }

  // 不安が高い → 予見段階の足場を手厚く
  if (affectProfile.academic_anxiety > 60) {
    adjusted.forethought_scaffold = {
      ...adjusted.forethought_scaffold,
      efficacy_message: adjusted.forethought_scaffold.efficacy_message || '大丈夫、一つずつ進もう',
      planning_visibility: true,
    }
    // モニタリング間隔を短く（こまめにチェック）
    adjusted.performance_scaffold = {
      ...adjusted.performance_scaffold,
      monitoring_interval: Math.max(2, adjusted.performance_scaffold.monitoring_interval - 1),
    }
  }

  // フロー状態 → SRL足場を最小化（邪魔をしない）
  if (affectProfile.flow_state_probability > 0.7) {
    adjusted.performance_scaffold = {
      ...adjusted.performance_scaffold,
      think_aloud_modeling: false,
      monitoring_interval: 15,  // ほぼ介入しない
      strategy_hint_level: 'none',
    }
    adjusted.reflection_scaffold = {
      ...adjusted.reflection_scaffold,
      reflection_prompt_type: 'none',  // フロー中は振り返りを中断しない
    }
  }

  // 退屈 → 目標再設定を促す
  if (affectProfile.academic_boredom > 60) {
    adjusted.forethought_scaffold = {
      ...adjusted.forethought_scaffold,
      goal_prompt_type: 'guided' as const,  // 新しい目標を一緒に考える
      efficacy_message: '今度はちょっと難しいことに挑戦してみよう',
    }
  }

  return adjusted
}

// ============================================================
// Part 5: SRL制御パラメータから IntegratedControlParameters への変換
// ============================================================

/**
 * F5制御パラメータを統合制御パラメータのSRLセクションに適用する
 */
export function applySRLToControls(
  controls: IntegratedControlParameters,
  f5Controls: F5_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }

  updated.srl = {
    goal_prompt_type: f5Controls.forethought_scaffold.goal_prompt_type,
    self_monitoring_interval: f5Controls.performance_scaffold.monitoring_interval,
    reflection_prompt_type: f5Controls.reflection_scaffold.reflection_prompt_type,
    attribution_guidance: f5Controls.reflection_scaffold.attribution_guidance,
    think_aloud_modeling: f5Controls.performance_scaffold.think_aloud_modeling,
    improvement_planning: f5Controls.reflection_scaffold.improvement_planning,
  }

  return updated
}
