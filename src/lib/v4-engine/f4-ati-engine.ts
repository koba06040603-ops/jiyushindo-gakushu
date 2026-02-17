/**
 * F4: 適性×指導交互作用 (ATI) 制御エンジン
 * 
 * 理論的根拠: Cronbach & Snow (1977)
 * 核心: 学習効果は適性と指導法の交互作用で決まる
 * 
 * このエンジンは「この子はどんな環境で動きやすいか」を理解し、
 * 構造化度・自由度・ヒント先回り度・誤答許容度を連続値で制御する。
 * 
 * Carroll作用: 必要学習時間を減少 + 有効学習時間を増加
 */

import type {
  F4_AptitudeProfile,
  ArchetypeId,
  IntegratedControlParameters,
} from './types'

// ============================================================
// ATI構造化度の連続算出（設計書 Part 6.1 完全準拠）
// ============================================================

/**
 * Cronbach & Snow (1977) の交互作用モデルに基づく構造化度の算出
 * 
 * 公式: structure = w1*(知識不足) + w2*(不安) + w3*(依存性)
 * 重みはアーキタイプ（子どもの今の姿）に応じて変化する
 * 
 * @param profile - F4適性プロファイル
 * @param archetype - 子どもの今の姿
 * @returns structure_level (0.1〜0.95 — 完全な0と1は存在しない)
 */
export function computeATIStructure(
  profile: F4_AptitudeProfile,
  archetype: ArchetypeId
): number {
  const { w1, w2, w3 } = getATIWeights(archetype)

  const rawStructure =
    w1 * (1 - profile.prior_knowledge / 100) +
    w2 * (profile.anxiety_level / 100) +
    w3 * (1 - profile.independence_level / 100)

  // 0.1〜0.95 にクリッピング（設計書: 完全な0と1は存在しない）
  return Math.max(0.1, Math.min(0.95, rawStructure))
}

/**
 * アーキタイプ別のATI重みを取得
 * 設計書 Part 6.1 の重み定義に完全準拠
 */
function getATIWeights(archetype: ArchetypeId): { w1: number; w2: number; w3: number } {
  switch (archetype) {
    case 'H': // 学習回避者: 不安の重みが最大
      return { w1: 0.2, w2: 0.5, w3: 0.3 }
    case 'G': // 受動的依存者: 依存性の重みが最大
      return { w1: 0.25, w2: 0.25, w3: 0.5 }
    case 'D': // 完璧主義者: 不安の重みが大きい
      return { w1: 0.2, w2: 0.5, w3: 0.3 }
    case 'A': // 自律的探究者: 知識が主要因子
      return { w1: 0.6, w2: 0.1, w3: 0.3 }
    default:  // B, C, E, F: バランス
      return { w1: 0.35, w2: 0.35, w3: 0.30 }
  }
}

// ============================================================
// F4 から導出される構造系パラメータの一括算出
// ============================================================

export interface F4_StructureControls {
  /** 構造化度: 0.0(完全自由)〜1.0(完全構造化) */
  structure_level: number
  /** 問題空間の自由度: structure_levelから反転導出 */
  solution_path_openness: number
  /** ヒントの先回り度 */
  hint_proactiveness: number
  /** 誤答許容度 */
  error_tolerance: number
}

/**
 * F4プロファイルとアーキタイプから構造系制御パラメータを一括算出
 * 
 * 導出ロジック:
 * - solution_path_openness = 1 - structure_level（構造化度の反転）
 * - hint_proactiveness = structure_level * 0.9（構造化に比例してヒントを先回り）
 * - error_tolerance = 1 - structure_level * 0.8（構造化が高いと早めに修正）
 */
export function computeF4Controls(
  profile: F4_AptitudeProfile,
  archetype: ArchetypeId
): F4_StructureControls {
  const structure_level = computeATIStructure(profile, archetype)

  return {
    structure_level,
    // 構造化度が高い → 自由度は低い
    solution_path_openness: Math.max(0.05, 1 - structure_level),
    // 構造化度が高い → ヒントを先回りで出す
    hint_proactiveness: Math.min(0.95, structure_level * 0.9),
    // 構造化度が高い → 誤答許容度は低い（早めに助ける）
    error_tolerance: Math.max(0.1, 1 - structure_level * 0.8),
  }
}

// ============================================================
// ATI交互作用項の推定学習効果（検証用）
// ============================================================

/**
 * Cronbach & Snow の交互作用モデルによる期待学習効果の推定
 * 
 * expected_learning = β0 + β1*prior + β2*structure + β3*prior*structure
 *                   + β4*anxiety*structure + β5*independence*(1-structure)
 * 
 * これは制御には使わず、パラメータの妥当性検証に使用する。
 */
export function estimateATILearningEffect(
  profile: F4_AptitudeProfile,
  structure_level: number
): number {
  // 回帰係数（仮の初期値 — 実データで校正予定）
  const β0 = 50  // ベースライン
  const β1 = 0.3 // 事前知識の主効果
  const β2 = 0.1 // 構造化の主効果
  const β3 = -0.25 // 事前知識×構造化の交互作用（知識あり×高構造=効果減）
  const β4 = 0.2  // 不安×構造化（不安あり×高構造=効果増）
  const β5 = 0.15 // 独立性×自由度

  const prior = profile.prior_knowledge / 100
  const anxiety = profile.anxiety_level / 100
  const independence = profile.independence_level / 100
  const structure = structure_level

  const effect =
    β0 +
    β1 * prior +
    β2 * structure +
    β3 * prior * structure +
    β4 * anxiety * structure +
    β5 * independence * (1 - structure)

  return Math.max(0, Math.min(100, effect))
}

// ============================================================
// F4 の条件チェッカー — 構造化度の急変が必要か
// ============================================================

/**
 * リアルタイム行動から構造化度の緊急調整が必要か判定
 * 因果チェーン: 連続失敗 → 不安↑ → 構造化度↑ が必要
 */
export function shouldAdjustStructure(
  currentProfile: F4_AptitudeProfile,
  consecutiveErrors: number,
  consecutiveSuccesses: number
): { adjust: boolean; direction: 'increase' | 'decrease'; magnitude: number } {
  // 連続2回以上のエラー → この子が苦しんでいる可能性
  if (consecutiveErrors >= 2) {
    // 不安レベルが高い子（D, F, H型）はより敏感に反応
    const sensitivity = currentProfile.anxiety_level > 60 ? 0.15 : 0.10
    return { adjust: true, direction: 'increase', magnitude: sensitivity }
  }

  // 連続3回以上の成功 → この子は波に乗っている
  if (consecutiveSuccesses >= 3) {
    // 独立性が高い子ほど大きく自由度を広げる
    const magnitude = currentProfile.independence_level > 60 ? 0.12 : 0.08
    return { adjust: true, direction: 'decrease', magnitude }
  }

  return { adjust: false, direction: 'increase', magnitude: 0 }
}
