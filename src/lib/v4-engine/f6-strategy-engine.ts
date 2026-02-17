/**
 * F6: 条件付き認知方略 (Conditional Cognitive Strategy) エンジン
 * 
 * 理論的根拠:
 * - Dunlosky et al. (2013): 10方略のメタ分析 → 上位6方略を採用
 * - Roediger & Karpicke (2006): 検索練習 d=0.80
 * - Cepeda et al. (2006): 間隔効果 d=0.85 (254研究)
 * - Rohrer et al. (2014): 交互配置 d=0.43 (4年生幾何)
 * - Paivio (1986): 二重符号化理論 d=0.72
 * 
 * 核心: 方略は**無条件に**有効ではない。各方略に適用可能条件（境界条件）があり、
 *       条件を満たさない場合は逆効果になりうる（例: 交互配置 d=-0.30, Rohrer 2012）。
 *       **条件チェッカーがF6の本質**。
 * 
 * 子ども観(v4): 「この子はどんなやり方で覚えようとしているか」を理解する視座。
 * Carroll作用: 必要学習時間を減少（記憶効率の最大化）
 * 
 * 6方略とエフェクトサイズ:
 * | 方略       | d     | 境界条件                              |
 * |------------|-------|---------------------------------------|
 * | 検索練習   | 0.80  | 初期学習が完了していること              |
 * | 間隔効果   | 0.85  | 保持期間の10-20%が最適間隔             |
 * | 交互配置   | 0.43  | 基礎手続きが自動化されていること        |
 * | 精緻化     | 0.75  | 既存知識ネットワークがあること          |
 * | 具体例     | 0.85  | 概念的理解があること                   |
 * | 二重符号化 | 0.72  | 視覚と言語の二経路が利用可能           |
 */

import type {
  F6_StrategyProfile,
  F5_SRLProfile,
  F12_AffectProfile,
  ArchetypeId,
  RealtimeBehaviorData,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: 方略適用可能性の条件チェッカー（F6の本質）
// ============================================================

/** 方略の種類 */
export type StrategyType =
  | 'retrieval_practice'
  | 'spacing'
  | 'interleaving'
  | 'elaboration'
  | 'concrete_examples'
  | 'dual_coding'

/** 方略の適用可能性判定結果 */
export interface StrategyApplicability {
  strategy: StrategyType
  applicable: boolean
  reason: string
  /** 条件充足度 (0-1) — 境界線上の判定に使用 */
  readiness: number
  /** 逆効果リスク (0-1) — 条件未充足時の害の大きさ */
  harm_risk: number
}

/**
 * 全6方略の適用可能性を一括判定する
 * 
 * 設計書 Part 2 F6 の条件チェッカーに完全準拠
 * これがF6の**本質**: 方略は条件付きでのみ有効
 */
export function checkAllStrategies(
  profile: F6_StrategyProfile,
  srlProfile?: F5_SRLProfile,
): Record<StrategyType, StrategyApplicability> {
  return {
    retrieval_practice: checkRetrievalPractice(profile),
    spacing: checkSpacing(profile),
    interleaving: checkInterleaving(profile),
    elaboration: checkElaboration(profile),
    concrete_examples: checkConcreteExamples(profile),
    dual_coding: checkDualCoding(profile),
  }
}

/**
 * 検索練習: 初期学習が完了していること (mastery >= 30)
 * d=0.80 (Roediger & Karpicke 2006)
 * 
 * 注意: 学習前に実施すると混乱する
 */
function checkRetrievalPractice(profile: F6_StrategyProfile): StrategyApplicability {
  const readiness = profile.mastery_level_for_current_unit / 100
  const applicable = profile.mastery_level_for_current_unit >= 30
  return {
    strategy: 'retrieval_practice',
    applicable,
    reason: applicable
      ? `初期学習完了（習得度=${profile.mastery_level_for_current_unit}%）→ 検索練習有効`
      : `初期学習未完了（習得度=${profile.mastery_level_for_current_unit}%<30%）→ まず学習を`,
    readiness,
    harm_risk: applicable ? 0 : 0.4,  // 未学習時は混乱リスク中程度
  }
}

/**
 * 間隔効果: 常に適用可能だが、間隔は動的に算出
 * d=0.85 (Cepeda et al. 2006, 254研究)
 * 
 * 最適間隔 = 保持期間 × 0.10〜0.20
 * 間隔が短すぎると集中学習と同じ（効果消失）
 */
function checkSpacing(profile: F6_StrategyProfile): StrategyApplicability {
  return {
    strategy: 'spacing',
    applicable: true,  // 常に適用可能
    reason: `間隔効果は常に有効。最適間隔=${profile.spacing_optimal_gap}日`,
    readiness: 1.0,
    harm_risk: 0,  // 間隔効果自体に害はない（最適でないだけ）
  }
}

/**
 * 交互配置: 基礎手続きが自動化されていること (mastery >= 70)
 * d=0.43 (Rohrer et al. 2014, 4年生幾何)
 * 
 * **重大リスク**: 条件未充足時は d=-0.30 (Rohrer 2012)
 * 最も条件が厳しい方略
 */
function checkInterleaving(profile: F6_StrategyProfile): StrategyApplicability {
  const applicable = profile.interleaving_readiness &&
    profile.mastery_level_for_current_unit >= 70
  const readiness = Math.min(1,
    (profile.mastery_level_for_current_unit / 70) *
    (profile.interleaving_readiness ? 1 : 0)
  )
  return {
    strategy: 'interleaving',
    applicable,
    reason: applicable
      ? `基礎自動化済み（習得度=${profile.mastery_level_for_current_unit}%）→ 交互配置有効`
      : `基礎未自動化（習得度=${profile.mastery_level_for_current_unit}%<70%）→ 交互配置は逆効果リスク(d=-0.30)`,
    readiness,
    harm_risk: applicable ? 0 : 0.8,  // 条件未充足時の害が最も大きい
  }
}

/**
 * 精緻化: 既存知識ネットワークがあること (elaboration_prior_knowledge >= 40)
 * d=0.75 (Dunlosky et al. 2013)
 * 
 * 知識がない段階では認知負荷増大
 */
function checkElaboration(profile: F6_StrategyProfile): StrategyApplicability {
  const applicable = profile.elaboration_prior_knowledge >= 40
  const readiness = profile.elaboration_prior_knowledge / 100
  return {
    strategy: 'elaboration',
    applicable,
    reason: applicable
      ? `既存知識あり（前提知識=${profile.elaboration_prior_knowledge}%）→ 精緻化有効`
      : `既存知識不足（前提知識=${profile.elaboration_prior_knowledge}%<40%）→ 認知負荷増大リスク`,
    readiness,
    harm_risk: applicable ? 0 : 0.5,
  }
}

/**
 * 具体例: 概念的理解があること (mastery >= 40)
 * d=0.85 (Dunlosky et al. 2013)
 */
function checkConcreteExamples(profile: F6_StrategyProfile): StrategyApplicability {
  const applicable = profile.mastery_level_for_current_unit >= 40
  const readiness = profile.mastery_level_for_current_unit / 100
  return {
    strategy: 'concrete_examples',
    applicable,
    reason: applicable
      ? `概念理解あり → 具体例が効果的`
      : `概念理解が不足 → まず基本を`,
    readiness,
    harm_risk: applicable ? 0 : 0.2,  // 害は小さい
  }
}

/**
 * 二重符号化: 視覚と言語の二経路が利用可能
 * d=0.72 (Mayer 2009)
 * 
 * 冗長な場合は逆効果（冗長性効果）
 */
function checkDualCoding(profile: F6_StrategyProfile): StrategyApplicability {
  // 二重符号化は比較的広い条件で適用可能
  // ただし、既に多重モダリティで学習している場合は冗長になりうる
  const readiness = Math.min(1, profile.retrieval_practice_readiness / 50)
  return {
    strategy: 'dual_coding',
    applicable: true,  // 基本的に常に適用可能
    reason: '二重符号化は広く適用可能。ただし冗長性に注意',
    readiness,
    harm_risk: 0.1,  // 冗長時の害は小さい
  }
}

// ============================================================
// Part 2: 検索練習の段階制御
// ============================================================

/** 検索練習の段階 */
export type RetrievalLevel = 'recognition' | 'cued_recall' | 'free_recall'

/**
 * 検索練習の最適レベルを決定する
 * 
 * 段階制御（易→難）:
 * 1. 再認 (recognition): 選択肢から選ぶ — 初期段階
 * 2. 手がかり再生 (cued_recall): ヒント付き想起 — 中間段階
 * 3. 自由再生 (free_recall): 完全な想起 — 上級段階
 * 
 * 原則: 成功率65-85%を維持する難易度に設定
 */
export function determineRetrievalLevel(
  profile: F6_StrategyProfile,
  archetype: ArchetypeId,
  behavior: RealtimeBehaviorData,
): { level: RetrievalLevel; with_feedback: boolean; reasoning: string } {
  const mastery = profile.mastery_level_for_current_unit
  const accuracy = behavior.recent_accuracy

  // フィードバックは常に提供（設計書: retrieval_with_feedback は必須）
  const with_feedback = true

  // 習得度と正答率から段階を決定
  if (mastery >= 70 && accuracy >= 0.7) {
    // 高習得 + 高正答率 → 自由再生に挑戦
    return {
      level: 'free_recall',
      with_feedback,
      reasoning: `習得度${mastery}%+正答率${(accuracy * 100).toFixed(0)}% → 自由再生`,
    }
  }

  if (mastery >= 40 && accuracy >= 0.5) {
    // 中習得 + 中正答率 → 手がかり再生
    return {
      level: 'cued_recall',
      with_feedback,
      reasoning: `習得度${mastery}%+正答率${(accuracy * 100).toFixed(0)}% → 手がかり再生`,
    }
  }

  // 低習得 or 低正答率 → 再認
  return {
    level: 'recognition',
    with_feedback,
    reasoning: `習得度${mastery}%+正答率${(accuracy * 100).toFixed(0)}% → 再認`,
  }
}

// ============================================================
// Part 3: 間隔効果の動的算出
// ============================================================

/** 間隔スケジュール */
export type SpacingSchedule = 'expanding' | 'equal' | 'contracting'

/**
 * 最適な復習間隔を動的に算出する
 * 
 * Cepeda et al. (2006): 最適間隔 = 保持期間 × 0.10〜0.20
 * 
 * @param retentionPeriodDays - 目標とする保持期間（日数）
 * @param consecutiveSuccesses - 連続正解数（成功するほど間隔を広げる）
 * @param currentMastery - 現在の習得度 (0-100)
 */
export function computeOptimalSpacing(
  retentionPeriodDays: number,
  consecutiveSuccesses: number,
  currentMastery: number,
): { interval_days: number; schedule: SpacingSchedule; reasoning: string } {
  // 基本間隔: 保持期間の10-20%
  const baseRatio = 0.15  // 中央値
  let interval = retentionPeriodDays * baseRatio

  // 連続正解による間隔拡大（expanding spacing）
  const expansionFactor = 1 + (consecutiveSuccesses * 0.2)
  interval *= expansionFactor

  // 習得度による補正
  if (currentMastery > 70) {
    interval *= 1.3  // 習得済みは間隔を広げる
  } else if (currentMastery < 30) {
    interval *= 0.7  // 未習得は間隔を短く
  }

  // 最低1日、最大30日
  interval = Math.max(1, Math.min(30, Math.round(interval)))

  // スケジュールの決定
  let schedule: SpacingSchedule
  if (currentMastery < 50) {
    schedule = 'equal'        // 低習得: 等間隔で確実に
  } else if (currentMastery < 75) {
    schedule = 'expanding'    // 中習得: 漸増間隔
  } else {
    schedule = 'expanding'    // 高習得: 漸増間隔（より大きなステップ）
  }

  return {
    interval_days: interval,
    schedule,
    reasoning: `保持期間${retentionPeriodDays}日 × 基本比率${baseRatio} × ` +
      `拡大係数${expansionFactor.toFixed(1)} → 間隔${interval}日 (${schedule})`,
  }
}

// ============================================================
// Part 4: 交互配置の比率算出
// ============================================================

/**
 * 交互配置の混合比率を算出する
 * 
 * 原則: 条件チェッカーがtrueの場合のみ呼ばれる
 * 
 * @param mastery - 現在の習得度 (0-100)
 * @param archetype - アーキタイプ
 * @returns 交互配置の比率 (0.0-1.0)
 */
export function computeInterleavingRatio(
  mastery: number,
  archetype: ArchetypeId,
): number {
  // ベースライン: 習得度に比例
  let ratio = Math.max(0, (mastery - 70) / 30)  // 70%→0.0, 100%→1.0

  // アーキタイプによる調整
  switch (archetype) {
    case 'A':
      ratio = Math.min(1.0, ratio * 1.2)  // 探究者: 積極的に混ぜる
      break
    case 'D': case 'F':
      ratio *= 0.7  // 不安な子: 控えめに
      break
    case 'G': case 'H':
      ratio = 0  // 依存者・回避者: 交互配置は使わない
      break
  }

  return Math.max(0, Math.min(1.0, ratio))
}

// ============================================================
// Part 5: 精緻化プロンプトの決定
// ============================================================

/** 精緻化プロンプトの種類 */
export type ElaborationPromptType = 'why' | 'how' | 'compare' | 'connect' | 'none'

/**
 * 最適な精緻化プロンプトの種類を決定する
 * 
 * 設計書 Part 2 F6:
 * - why: 「なぜ？」— 因果関係を探る
 * - how: 「どうやって？」— 手順を深める
 * - compare: 「どこが違う？」— 比較対照
 * - connect: 「何とつながる？」— 知識間の接続（最高難度）
 */
export function determineElaborationType(
  profile: F6_StrategyProfile,
  archetype: ArchetypeId,
  srlProfile?: F5_SRLProfile,
): { type: ElaborationPromptType; depth: 'shallow' | 'deep'; reasoning: string } {
  if (profile.elaboration_prior_knowledge < 40) {
    return { type: 'none', depth: 'shallow', reasoning: '前提知識不足 → 精緻化はまだ早い' }
  }

  // 前提知識量とアーキタイプから決定
  const knowledge = profile.elaboration_prior_knowledge
  let type: ElaborationPromptType
  let depth: 'shallow' | 'deep'

  if (knowledge >= 75) {
    // 高知識: 接続型（最高難度）
    type = archetype === 'A' ? 'connect' : 'compare'
    depth = 'deep'
  } else if (knowledge >= 55) {
    // 中知識: 因果/手順型
    type = 'why'
    depth = archetype === 'A' || archetype === 'B' ? 'deep' : 'shallow'
  } else {
    // 低知識（40-55）: 因果型（浅い）
    type = 'why'
    depth = 'shallow'
  }

  // メタ認知的自覚が高い子は深い精緻化が可能
  if (srlProfile && srlProfile.performance.metacognitive_awareness > 60) {
    depth = 'deep'
  }

  return {
    type,
    depth,
    reasoning: `前提知識${knowledge}% → ${type}(${depth})`,
  }
}

// ============================================================
// Part 6: F6制御パラメータの全体算出
// ============================================================

/** F6から導出される認知方略制御パラメータの全体 */
export interface F6_FullControls {
  /** 全方略の適用可能性 */
  applicability: Record<StrategyType, StrategyApplicability>
  /** 検索練習の段階 */
  retrieval: {
    level: RetrievalLevel
    with_feedback: boolean
  }
  /** 間隔効果 */
  spacing: {
    interval_days: number
    schedule: SpacingSchedule
  }
  /** 交互配置 */
  interleaving: {
    enabled: boolean
    ratio: number
  }
  /** 精緻化 */
  elaboration: {
    prompt_type: ElaborationPromptType
    depth: 'shallow' | 'deep'
  }
  /** 統合制御パラメータのcognitive_strategyへのマッピング */
  strategy_controls: IntegratedControlParameters['cognitive_strategy']
  /** 推論の根拠 */
  reasoning: string
}

/**
 * F6の全制御パラメータを算出
 */
export function computeF6Controls(
  profile: F6_StrategyProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId,
  srlProfile?: F5_SRLProfile,
  affectProfile?: F12_AffectProfile,
): F6_FullControls {
  // 条件チェッカー: 全方略の適用可能性
  const applicability = checkAllStrategies(profile, srlProfile)

  // 検索練習の段階
  const retrieval = applicability.retrieval_practice.applicable
    ? determineRetrievalLevel(profile, archetype, behavior)
    : { level: 'recognition' as RetrievalLevel, with_feedback: true, reasoning: '検索練習の前提条件未充足' }

  // 間隔効果
  const retentionPeriod = profile.spacing_optimal_gap > 0 ? profile.spacing_optimal_gap * 7 : 30
  const spacing = computeOptimalSpacing(
    retentionPeriod,
    behavior.consecutive_successes,
    profile.mastery_level_for_current_unit,
  )

  // 交互配置
  const interleavingEnabled = applicability.interleaving.applicable
  const interleavingRatio = interleavingEnabled
    ? computeInterleavingRatio(profile.mastery_level_for_current_unit, archetype)
    : 0

  // 精緻化
  const elaboration = determineElaborationType(profile, archetype, srlProfile)

  // 感情による安全補正
  let safeRetrieval = retrieval.level
  let safeInterleaving = interleavingEnabled
  if (affectProfile && affectProfile.academic_anxiety > 60) {
    // 不安時: 検索練習を1段下げ、交互配置を無効化
    if (safeRetrieval === 'free_recall') safeRetrieval = 'cued_recall'
    if (safeRetrieval === 'cued_recall' && affectProfile.academic_anxiety > 75) safeRetrieval = 'recognition'
    safeInterleaving = false
  }

  // 統合制御パラメータへのマッピング
  const strategy_controls: IntegratedControlParameters['cognitive_strategy'] = {
    retrieval_mode: safeRetrieval,
    retrieval_with_feedback: true,
    spacing_interval_days: spacing.interval_days,
    interleaving_enabled: safeInterleaving,
    interleaving_ratio: interleavingRatio,
    elaboration_prompt_type: elaboration.type,
  }

  // 推論の構築
  const activeStrategies = Object.values(applicability).filter(a => a.applicable).map(a => a.strategy)
  const blockedStrategies = Object.values(applicability).filter(a => !a.applicable && a.harm_risk > 0.3).map(a => a.strategy)
  let reasoning = `有効方略: [${activeStrategies.join(', ')}]`
  if (blockedStrategies.length > 0) {
    reasoning += `。ブロック: [${blockedStrategies.join(', ')}]（条件未充足）`
  }
  reasoning += `。検索=${safeRetrieval}, 間隔=${spacing.interval_days}日, 交互=${safeInterleaving}, 精緻化=${elaboration.type}`

  return {
    applicability,
    retrieval: { level: safeRetrieval, with_feedback: true },
    spacing: { interval_days: spacing.interval_days, schedule: spacing.schedule },
    interleaving: { enabled: safeInterleaving, ratio: interleavingRatio },
    elaboration: { prompt_type: elaboration.type, depth: elaboration.depth },
    strategy_controls,
    reasoning,
  }
}

// ============================================================
// Part 7: F6制御パラメータから IntegratedControlParameters への適用
// ============================================================

/**
 * F6制御パラメータを統合制御パラメータのcognitive_strategyセクションに適用する
 */
export function applyF6ToControls(
  controls: IntegratedControlParameters,
  f6Controls: F6_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }
  updated.cognitive_strategy = { ...f6Controls.strategy_controls }
  return updated
}
