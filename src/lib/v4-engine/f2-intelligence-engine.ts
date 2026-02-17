/**
 * F2: 多元的入口 (Multiple Entry Points) エンジン
 * 
 * 理論的根拠:
 * - Gardner & Moran (2007): MI を「概念への複数の入口 (multiple entry points)」と再定義
 * - Waterhouse (2006): 神経生物学的根拠の不足は妥当な批判
 * - Dweck (2006): 成長マインドセット — 能力は固定ではなく発達するもの
 * 
 * 核心: 一つの概念を理解する際に、行き詰まったら**別の知能チャネルから再アプローチする**。
 *       これは「学習スタイルに合わせる」（否定された meshing hypothesis）とは異なる。
 *       同じ概念を**複数の入口から理解させる**ことで理解の多角化を図る。
 * 
 * 子ども観(v4): 「この子はどんな道から概念に向かっているか」を理解する視座。
 * Carroll作用: 必要学習時間を減少（概念への複数入口 → 理解の多角化）
 */

import type {
  F2_IntelligenceProfile,
  ArchetypeId,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: 概念入口の決定
// ============================================================

/** 8知能の入口タイプ */
export type IntelligenceType = 
  | 'linguistic' | 'logical_mathematical' | 'spatial'
  | 'bodily_kinesthetic' | 'musical' | 'interpersonal'
  | 'intrapersonal' | 'naturalist'

/** 成長マインドセットメッセージの種類 */
export type MindsetMessageType = 'process_praise' | 'effort_praise' | 'strategy_praise'

/** F2から導出される制御パラメータ */
export interface F2_FullControls {
  /** 最初に使う概念入口 */
  primary_entry: IntelligenceType
  /** 行き詰まり時のフォールバック入口 */
  fallback_entry: IntelligenceType
  /** 概念の表現モード */
  concept_representation: string
  /** 成長マインドセットメッセージ */
  mindset_message_type: MindsetMessageType
  /** 推論の根拠 */
  reasoning: string
}

const INTELLIGENCE_NAMES: Record<IntelligenceType, string> = {
  linguistic: '言語的',
  logical_mathematical: '論理数学的',
  spatial: '空間的',
  bodily_kinesthetic: '身体運動的',
  musical: '音楽的',
  interpersonal: '対人的',
  intrapersonal: '内省的',
  naturalist: '博物学的',
}

// ============================================================
// Part 2: 主入口とフォールバック入口の決定
// ============================================================

/**
 * 最強の知能チャネルを主入口として決定する
 */
export function determinePrimaryEntry(
  profile: F2_IntelligenceProfile,
): { entry: IntelligenceType; score: number } {
  const entries: { type: IntelligenceType; score: number }[] = [
    { type: 'linguistic', score: profile.linguistic },
    { type: 'logical_mathematical', score: profile.logical_mathematical },
    { type: 'spatial', score: profile.spatial },
    { type: 'bodily_kinesthetic', score: profile.bodily_kinesthetic },
    { type: 'musical', score: profile.musical },
    { type: 'interpersonal', score: profile.interpersonal },
    { type: 'intrapersonal', score: profile.intrapersonal },
    { type: 'naturalist', score: profile.naturalist },
  ]

  entries.sort((a, b) => b.score - a.score)
  return { entry: entries[0].type, score: entries[0].score }
}

/**
 * フォールバック入口を決定する
 * 
 * 原則: 主入口とは**異なるモダリティ系統**から選ぶ
 * - 言語系 (linguistic, musical) vs 空間系 (spatial, naturalist) vs 論理系 (logical_mathematical)
 * - 社会系 (interpersonal) vs 内省系 (intrapersonal)
 */
export function determineFallbackEntry(
  profile: F2_IntelligenceProfile,
  primaryEntry: IntelligenceType,
): { entry: IntelligenceType; score: number } {
  // モダリティ系統の分類
  const modalityGroup: Record<IntelligenceType, string> = {
    linguistic: 'verbal',
    logical_mathematical: 'logical',
    spatial: 'visual',
    bodily_kinesthetic: 'kinetic',
    musical: 'verbal',
    interpersonal: 'social',
    intrapersonal: 'introspective',
    naturalist: 'visual',
  }

  const primaryGroup = modalityGroup[primaryEntry]

  const entries: { type: IntelligenceType; score: number }[] = [
    { type: 'linguistic', score: profile.linguistic },
    { type: 'logical_mathematical', score: profile.logical_mathematical },
    { type: 'spatial', score: profile.spatial },
    { type: 'bodily_kinesthetic', score: profile.bodily_kinesthetic },
    { type: 'musical', score: profile.musical },
    { type: 'interpersonal', score: profile.interpersonal },
    { type: 'intrapersonal', score: profile.intrapersonal },
    { type: 'naturalist', score: profile.naturalist },
  ]

  // 異なるモダリティ系統から最高スコアを選ぶ
  const candidates = entries
    .filter(e => e.type !== primaryEntry && modalityGroup[e.type] !== primaryGroup)
    .sort((a, b) => b.score - a.score)

  if (candidates.length > 0) {
    return { entry: candidates[0].type, score: candidates[0].score }
  }

  // 全て同じ系統の場合はスコア2位を使用
  const allSorted = entries.filter(e => e.type !== primaryEntry).sort((a, b) => b.score - a.score)
  return { entry: allSorted[0].type, score: allSorted[0].score }
}

// ============================================================
// Part 3: 概念表現モードの決定
// ============================================================

/**
 * 概念の表現モードを決定する
 * 入口知能に応じて最適な表現形式を返す
 */
export function determineConceptRepresentation(
  primaryEntry: IntelligenceType,
): string {
  const representations: Record<IntelligenceType, string> = {
    linguistic: '物語・説明文で概念を提示',
    logical_mathematical: '数式・論理図で概念を構造化',
    spatial: '図表・マインドマップで概念を可視化',
    bodily_kinesthetic: '操作活動・身体表現で概念を体験',
    musical: 'リズム・パターンで概念のテンポを感じさせる',
    interpersonal: '対話・グループ活動で概念を共有',
    intrapersonal: '個人の振り返り・日記で概念を内省',
    naturalist: '自然の事例・分類活動で概念を整理',
  }
  return representations[primaryEntry]
}

// ============================================================
// Part 4: 成長マインドセットメッセージの決定
// ============================================================

/**
 * Dweck (2006) に基づく成長マインドセットメッセージの種類を決定
 * 
 * - process_praise: 「やり方が良かったね」（プロセス称賛）
 * - effort_praise: 「がんばったね」（努力称賛）
 * - strategy_praise: 「この方法を選んだのがよかったね」（方略称賛）
 * 
 * 原則: 成長マインドセットが低い子には effort_praise から、
 *       高い子には strategy_praise で方略的思考を促進
 */
export function determineMindsetMessage(
  profile: F2_IntelligenceProfile,
  archetype: ArchetypeId,
): MindsetMessageType {
  const gm = profile.growth_mindset

  // 高い成長マインドセット → 方略称賛で更に深める
  if (gm >= 70) return 'strategy_praise'

  // 中程度 → プロセス称賛
  if (gm >= 40) return 'process_praise'

  // 低い成長マインドセット → まず努力称賛で安心感
  return 'effort_praise'
}

// ============================================================
// Part 5: F2制御パラメータの全体算出
// ============================================================

/**
 * F2の全制御パラメータを算出
 */
export function computeF2Controls(
  profile: F2_IntelligenceProfile,
  archetype: ArchetypeId,
): F2_FullControls {
  const primary = determinePrimaryEntry(profile)
  const fallback = determineFallbackEntry(profile, primary.entry)
  const representation = determineConceptRepresentation(primary.entry)
  const mindsetMsg = determineMindsetMessage(profile, archetype)

  const reasoning = `主入口=${INTELLIGENCE_NAMES[primary.entry]}(${primary.score}), ` +
    `代替=${INTELLIGENCE_NAMES[fallback.entry]}(${fallback.score}), ` +
    `マインドセット=${profile.growth_mindset}→${mindsetMsg}`

  return {
    primary_entry: primary.entry,
    fallback_entry: fallback.entry,
    concept_representation: representation,
    mindset_message_type: mindsetMsg,
    reasoning,
  }
}

// ============================================================
// Part 6: 統合制御への適用
// ============================================================

/**
 * F2制御パラメータを統合制御パラメータのpresentationセクションに適用
 */
export function applyF2ToControls(
  controls: IntegratedControlParameters,
  f2Controls: F2_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }
  updated.presentation = {
    ...updated.presentation,
    concept_entry_intelligence: f2Controls.primary_entry,
    fallback_intelligence: f2Controls.fallback_entry,
  }
  return updated
}
