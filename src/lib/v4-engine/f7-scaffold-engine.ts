/**
 * F7: 動的随伴足場 (Dynamic Contingent Scaffolding) エンジン
 * 
 * 理論的根拠:
 * - Wood, Bruner & Ross (1976): 足場かけの6機能
 * - Van de Pol et al. (2010): 3原理（随伴性 contingency、フェイディング fading、責任の移行）
 * 
 * 核心: 足場は「ヒントの量」ではなく「6つの異なる機能」であり、
 *       学習者の反応に随伴的に調整される。
 * 
 * 子ども観(v4): 「この子は手を伸ばしてどこまで届くか」を理解する視座。
 * Carroll作用: 必要学習時間を減少 + 有効学習時間を増加
 */

import type {
  F7_ScaffoldProfile,
  F12_AffectProfile,
  IntegratedControlParameters,
  ArchetypeId,
  RealtimeBehaviorData,
} from './types'

// ============================================================
// 6つの足場機能の制御
// ============================================================

/** 足場の6機能の活性状態 */
export interface ScaffoldFunctionState {
  /** 課題への注意喚起・興味の喚起 */
  recruitment_active: boolean
  /** 問題空間の縮小度 (0.0-1.0) */
  reduction_of_dof: number
  /** 目標方向の維持 */
  direction_maintenance_active: boolean
  /** 重要特徴の強調 */
  marking_critical_features: boolean
  /** 挫折感の制御 */
  frustration_control_active: boolean
  /** 解法のモデリング */
  demonstration_level: 'none' | 'partial' | 'full'
}

/** 随伴ルール（contingency rule） */
export interface ContingencyRule {
  /** 連続正解N回で足場を1段下げる */
  success_threshold: number
  /** 連続不正解N回で足場を1段上げる */
  failure_threshold: number
  /** フェイディングの速度 (0.0-1.0) */
  fade_rate: number
}

// ============================================================
// ZPD (最近接発達領域) の推定と位置決め
// ============================================================

/**
 * 現在の成績データからZPDの境界を推定する
 * 
 * zpd_lower = 自力で安定的に正解できる難易度
 * zpd_upper = 支援ありで正解できる難易度の上限
 * 
 * @param currentPerformance - 現在のパフォーマンス (0-100)
 * @param scaffoldDependency - 足場依存度 (0-100: 高い=ヒントなしでは解けない)
 * @param recentAccuracy - 直近正答率 (0-1)
 */
export function estimateZPD(
  currentPerformance: number,
  scaffoldDependency: number,
  recentAccuracy: number
): { lower: number; upper: number; width: number } {
  // 自力到達水準: パフォーマンス × (1 - 依存度)で推定
  const lower = Math.max(0, currentPerformance * (1 - scaffoldDependency / 100))

  // 支援下到達水準: パフォーマンス + 依存度による上乗せ
  // 正答率が高いほどZPD上限も高い
  const supportBonus = scaffoldDependency * recentAccuracy * 0.5
  const upper = Math.min(100, currentPerformance + supportBonus)

  return {
    lower,
    upper,
    width: upper - lower,
  }
}

/**
 * ZPD内の最適難易度位置を決定する
 * 
 * 設計書の原則:
 * - 成功体験を積む必要がある子 → ZPD下限寄り (0.2-0.3)
 * - 安定して進んでいる子 → ZPD中央 (0.5)
 * - 夢中になっている子 → ZPD上限寄り (0.7-0.8)
 * 
 * 感情状態(F12)が不安定な場合は常に下限に寄せる（安全を優先）
 */
export function computeZPDPosition(
  profile: F7_ScaffoldProfile,
  archetype: ArchetypeId,
  affectProfile?: F12_AffectProfile
): number {
  // アーキタイプベースのデフォルト位置
  let basePosition: number
  switch (archetype) {
    case 'A': basePosition = 0.8; break  // 探究者: 上限に挑戦
    case 'B': basePosition = 0.6; break  // 努力家: やや高め
    case 'C': basePosition = 0.65; break // 冒険者: 高めだが安定させる
    case 'D': basePosition = 0.5; break  // 完璧主義者: 確実に成功できる位置
    case 'E': basePosition = 0.55; break // 社交的: 中央やや上
    case 'F': basePosition = 0.4; break  // 不安定: 安全寄り
    case 'G': basePosition = 0.3; break  // 依存者: 確実な成功
    case 'H': basePosition = 0.15; break // 回避者: 絶対に成功する
    default: basePosition = 0.5
  }

  // 連続失敗による下方修正（この子が苦しんでいる）
  if (profile.consecutive_failure >= 2) {
    basePosition *= 0.7
  }

  // 連続成功による上方修正（この子は波に乗っている）
  if (profile.consecutive_success >= 3) {
    basePosition = Math.min(1.0, basePosition * 1.2)
  }

  // 感情状態による安全補正（感情が先に来る — v4原則）
  if (affectProfile) {
    if (affectProfile.academic_anxiety > 60) {
      // 不安が高い → 安全位置に下げる
      basePosition = Math.min(basePosition, 0.4)
    }
    if (affectProfile.flow_state_probability > 0.7) {
      // フロー状態 → 少し高めに引き上げてOK
      basePosition = Math.min(1.0, basePosition * 1.1)
    }
  }

  return Math.max(0.05, Math.min(0.95, basePosition))
}

// ============================================================
// 足場機能の決定ロジック（6機能の随伴的制御）
// ============================================================

/**
 * リアルタイム行動データから6つの足場機能の活性状態を決定する
 * 
 * 設計書の6機能とトリガー:
 * | Recruitment          | 長時間アイドル、離脱兆候 |
 * | Reduction of DOF     | 解法の方向が定まらない |
 * | Direction Maintenance| 脱線、無関係な操作 |
 * | Marking Critical     | 重要部分を見落としている |
 * | Frustration Control  | エラー連続、感情的反応 |
 * | Demonstration        | 上記すべてで改善しない |
 */
export function determineScaffoldFunctions(
  profile: F7_ScaffoldProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId
): ScaffoldFunctionState {
  const state: ScaffoldFunctionState = {
    recruitment_active: false,
    reduction_of_dof: 0,
    direction_maintenance_active: false,
    marking_critical_features: false,
    frustration_control_active: false,
    demonstration_level: 'none',
  }

  // --- Recruitment: この子の注意が離れている ---
  if (behavior.idle_time_seconds > 30) {
    state.recruitment_active = true
  }

  // --- Frustration Control: この子が苦しんでいる ---
  if (behavior.consecutive_errors >= 2 || behavior.estimated_affect.valence < -30) {
    state.frustration_control_active = true
  }

  // --- Reduction of DOF: 方向が定まらない ---
  // 応答時間が異常に長い場合 = 迷っている
  if (behavior.recent_response_time_ms > 60000 && behavior.hint_usage_count === 0) {
    state.reduction_of_dof = computeReductionLevel(profile, archetype)
  }

  // --- Direction Maintenance: この子が脱線している ---
  // アイドル状態でもなく、連続エラーでもないが、ヒントを大量に使っている
  if (behavior.hint_usage_count >= 3 && behavior.consecutive_errors >= 1) {
    state.direction_maintenance_active = true
  }

  // --- Marking Critical Features: 重要部分の見落とし ---
  // 近い答えを出しているが間違える（部分正解的パターン）
  if (behavior.consecutive_errors >= 1 && behavior.recent_accuracy > 0.3) {
    state.marking_critical_features = true
  }

  // --- Demonstration: 上記すべてで改善しない ---
  // 連続失敗が多く、足場依存度も高い
  if (profile.consecutive_failure >= 3) {
    state.demonstration_level = profile.consecutive_failure >= 5 ? 'full' : 'partial'
  }

  // アーキタイプ別のベースライン補正
  applyArchetypeBaseline(state, archetype)

  return state
}

/**
 * 問題空間の縮小度を算出
 */
function computeReductionLevel(profile: F7_ScaffoldProfile, archetype: ArchetypeId): number {
  // ZPD幅が広い（伸びしろがある）が、パフォーマンスが低い子は問題空間を大きく縮小
  const baseLine = 1 - (profile.current_performance / 100)

  switch (archetype) {
    case 'G': case 'H': return Math.min(0.95, baseLine + 0.3)
    case 'F': return Math.min(0.9, baseLine + 0.2)
    case 'D': return Math.min(0.7, baseLine + 0.1)
    default: return Math.min(0.6, baseLine)
  }
}

/**
 * アーキタイプのベースラインを適用
 */
function applyArchetypeBaseline(state: ScaffoldFunctionState, archetype: ArchetypeId): void {
  switch (archetype) {
    case 'H':
      // 学習回避者: 常にRecruitment + Frustration Controlを有効化
      state.recruitment_active = true
      state.frustration_control_active = true
      if (state.demonstration_level === 'none') {
        state.demonstration_level = 'full'  // デフォルトでフルモデリング
      }
      break
    case 'G':
      // 受動的依存者: Recruitmentと部分モデリングをデフォルト化
      state.recruitment_active = true
      state.marking_critical_features = true
      if (state.demonstration_level === 'none') {
        state.demonstration_level = 'partial'
      }
      break
    case 'A':
      // 自律的探究者: すべての足場を最小化（邪魔をしない）
      state.recruitment_active = false
      state.reduction_of_dof = 0
      state.direction_maintenance_active = false
      state.marking_critical_features = false
      state.demonstration_level = 'none'
      // ただし frustration_control は行動トリガーが優先
      break
  }
}

// ============================================================
// 随伴ルール（contingency）の決定
// ============================================================

/**
 * アーキタイプに基づく随伴ルールの決定
 * 
 * 原則（設計書 Part 7 実装原則 #5）:
 * デフォルトは「支援を減らす方向」（フェイディング）
 * 増加は例外条件のみ
 */
export function computeContingencyRule(archetype: ArchetypeId): ContingencyRule {
  switch (archetype) {
    case 'A':
      return { success_threshold: 2, failure_threshold: 3, fade_rate: 0.9 }
    case 'B':
      return { success_threshold: 3, failure_threshold: 2, fade_rate: 0.7 }
    case 'C':
      return { success_threshold: 3, failure_threshold: 2, fade_rate: 0.6 }
    case 'D':
      return { success_threshold: 4, failure_threshold: 1, fade_rate: 0.4 }
    case 'E':
      return { success_threshold: 3, failure_threshold: 2, fade_rate: 0.6 }
    case 'F':
      return { success_threshold: 4, failure_threshold: 1, fade_rate: 0.3 }
    case 'G':
      return { success_threshold: 5, failure_threshold: 1, fade_rate: 0.2 }
    case 'H':
      return { success_threshold: 5, failure_threshold: 1, fade_rate: 0.1 }
    default:
      return { success_threshold: 3, failure_threshold: 2, fade_rate: 0.5 }
  }
}

// ============================================================
// F7 統合出力 — scaffold制御パラメータの一括生成
// ============================================================

export interface F7_FullControls {
  /** 6機能の活性状態 */
  functions: ScaffoldFunctionState
  /** 随伴ルール */
  contingency: ContingencyRule
  /** ZPD内の難易度位置 (0.0-1.0) */
  difficulty_zpd_position: number
  /** 動機付け的足場 */
  motivational_scaffold: {
    encouragement_on_error: boolean
    celebration_on_success: boolean
    soft_language: boolean
    progress_visualization: 'self_only' | 'none'
  }
}

/**
 * F7の全制御パラメータを一括生成
 */
export function computeF7Controls(
  scaffoldProfile: F7_ScaffoldProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId,
  affectProfile?: F12_AffectProfile
): F7_FullControls {
  const functions = determineScaffoldFunctions(scaffoldProfile, behavior, archetype)
  const contingency = computeContingencyRule(archetype)
  const difficulty_zpd_position = computeZPDPosition(scaffoldProfile, archetype, affectProfile)

  // 動機付け的足場はアーキタイプとF12の状態から決定
  const motivational_scaffold = computeMotivationalScaffold(archetype, affectProfile)

  return {
    functions,
    contingency,
    difficulty_zpd_position,
    motivational_scaffold,
  }
}

function computeMotivationalScaffold(
  archetype: ArchetypeId,
  affectProfile?: F12_AffectProfile
): F7_FullControls['motivational_scaffold'] {
  // デフォルト: 成功時の祝賀は全員、自己比較のみ
  const scaffold = {
    encouragement_on_error: true,
    celebration_on_success: true,
    soft_language: false,
    progress_visualization: 'self_only' as const,
  }

  // アーキタイプ別の調整
  switch (archetype) {
    case 'D': case 'F': case 'G': case 'H':
      scaffold.soft_language = true  // 「〜してみよう」「〜かもしれないね」
      break
    case 'A':
      scaffold.encouragement_on_error = false  // 探究者は自分で消化する
      break
  }

  // 感情状態による上書き
  if (affectProfile) {
    if (affectProfile.academic_anxiety > 60) {
      scaffold.soft_language = true
      scaffold.encouragement_on_error = true
    }
    if (affectProfile.academic_boredom > 60) {
      scaffold.celebration_on_success = true  // 小さな成功でも祝賀
    }
  }

  return scaffold
}
