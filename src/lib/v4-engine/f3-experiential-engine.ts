/**
 * F3: 経験変容学習 (Experiential Transformation Learning) エンジン
 * 
 * 理論的根拠:
 * - Kolb (1984): 学習は経験の変容（transformation of experience）
 * - 4段階サイクル: CE(具体的経験) → RO(省察的観察) → AC(抽象的概念化) → AE(能動的実験)
 * - Kolb & Kolb (2005): 4つの学習スタイル（diverging, assimilating, converging, accommodating）
 * 
 * 核心: 好みの段階を入口にしつつ、**4段階すべてを必ず経由させる**
 *       部分的経験では学習が不完全（例: ACだけでは知識が定着しない）
 * 
 * 子ども観(v4): 「この子は経験をどう編み直しているか」を理解する視座。
 * Carroll作用: 必要学習時間を減少（深い理解 → 転移可能な学習 → 再学習不要）
 */

import type {
  F3_ExperientialProfile,
  ArchetypeId,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: Kolbサイクルの入口決定
// ============================================================

/** Kolbの4段階 */
export type KolbPhase = 'CE' | 'RO' | 'AC' | 'AE'

/** Kolbの4学習スタイル */
export type KolbStyle = 'diverging' | 'assimilating' | 'converging' | 'accommodating'

/** F3から導出される制御パラメータ */
export interface F3_FullControls {
  /** サイクルの入口段階 */
  entry_phase: KolbPhase
  /** 推奨されるサイクル順序 */
  cycle_sequence: KolbPhase[]
  /** 各段階の時間配分 (0-1, 合計=1) */
  phase_time_allocation: Record<KolbPhase, number>
  /** サイクル完走を強制するか */
  force_full_cycle: boolean
  /** 推論の根拠 */
  reasoning: string
}

const PHASE_NAMES: Record<KolbPhase, string> = {
  CE: '具体的経験',
  RO: '省察的観察',
  AC: '抽象的概念化',
  AE: '能動的実験',
}

// ============================================================
// Part 2: 入口段階の決定
// ============================================================

/**
 * 好みの段階を入口として決定する
 * 
 * 原則: 好みが最も高い段階を入口にする
 * ただしアーキタイプ補正あり:
 * - Type A: 好みに忠実（自律的に選べる）
 * - Type G/H: AC入口を推奨（構造化された概念理解から入る）
 */
export function determineEntryPhase(
  profile: F3_ExperientialProfile,
  archetype: ArchetypeId,
): { phase: KolbPhase; confidence: number; reasoning: string } {
  const preferences = [
    { phase: 'CE' as KolbPhase, score: profile.ce_preference },
    { phase: 'RO' as KolbPhase, score: profile.ro_preference },
    { phase: 'AC' as KolbPhase, score: profile.ac_preference },
    { phase: 'AE' as KolbPhase, score: profile.ae_preference },
  ]
  preferences.sort((a, b) => b.score - a.score)

  let selected = preferences[0]

  // アーキタイプ補正: 依存者・回避者はAC(概念化)から入る方が安全
  if ((archetype === 'G' || archetype === 'H') && selected.phase !== 'AC') {
    const acPref = preferences.find(p => p.phase === 'AC')!
    // ACが極端に低くなければACを推奨
    if (acPref.score >= 30) {
      selected = acPref
    }
  }

  // 確信度: 最高と2番目の差
  const gap = preferences[0].score - preferences[1].score
  const confidence = Math.min(1.0, gap / 30 + 0.5)

  return {
    phase: selected.phase,
    confidence,
    reasoning: `入口=${PHASE_NAMES[selected.phase]}(${selected.score}), スタイル=${profile.dominant_style}`,
  }
}

// ============================================================
// Part 3: サイクル順序の構築
// ============================================================

/**
 * 入口段階から始まるサイクル順序を構築する
 * 
 * Kolbの標準順序: CE → RO → AC → AE
 * 入口がどこでも、4段階すべてを経由する
 */
export function buildCycleSequence(entryPhase: KolbPhase): KolbPhase[] {
  const standardOrder: KolbPhase[] = ['CE', 'RO', 'AC', 'AE']
  const startIdx = standardOrder.indexOf(entryPhase)
  const sequence: KolbPhase[] = []
  for (let i = 0; i < 4; i++) {
    sequence.push(standardOrder[(startIdx + i) % 4])
  }
  return sequence
}

// ============================================================
// Part 4: 時間配分の算出
// ============================================================

/**
 * 各段階の時間配分を算出する
 * 
 * 原則:
 * - 好みの段階には多めの時間
 * - ただし最低15%は確保（弱い段階もスキップしない）
 * - サイクル完走率が低い子は均等配分に近づける
 */
export function computePhaseTimeAllocation(
  profile: F3_ExperientialProfile,
  archetype: ArchetypeId,
): Record<KolbPhase, number> {
  const prefs = {
    CE: profile.ce_preference,
    RO: profile.ro_preference,
    AC: profile.ac_preference,
    AE: profile.ae_preference,
  }

  // サイクル完走率が低い→均等配分に近づける
  const equalWeight = 0.25
  const completionRate = profile.cycle_completion_rate
  // 完走率が高い(1.0)と好みベース、低い(0.0)と均等
  const prefInfluence = Math.min(1, completionRate + 0.3)

  const total = prefs.CE + prefs.RO + prefs.AC + prefs.AE || 1
  const rawWeights = {
    CE: prefs.CE / total,
    RO: prefs.RO / total,
    AC: prefs.AC / total,
    AE: prefs.AE / total,
  }

  // 好みベースと均等配分の混合
  const mixed = {
    CE: rawWeights.CE * prefInfluence + equalWeight * (1 - prefInfluence),
    RO: rawWeights.RO * prefInfluence + equalWeight * (1 - prefInfluence),
    AC: rawWeights.AC * prefInfluence + equalWeight * (1 - prefInfluence),
    AE: rawWeights.AE * prefInfluence + equalWeight * (1 - prefInfluence),
  }

  // 最低15%を確保
  const MIN_ALLOCATION = 0.15
  for (const phase of ['CE', 'RO', 'AC', 'AE'] as KolbPhase[]) {
    if (mixed[phase] < MIN_ALLOCATION) {
      mixed[phase] = MIN_ALLOCATION
    }
  }

  // 再正規化
  const mixedTotal = mixed.CE + mixed.RO + mixed.AC + mixed.AE
  return {
    CE: Number((mixed.CE / mixedTotal).toFixed(3)),
    RO: Number((mixed.RO / mixedTotal).toFixed(3)),
    AC: Number((mixed.AC / mixedTotal).toFixed(3)),
    AE: Number((mixed.AE / mixedTotal).toFixed(3)),
  }
}

// ============================================================
// Part 5: F3制御パラメータの全体算出
// ============================================================

/**
 * F3の全制御パラメータを算出
 */
export function computeF3Controls(
  profile: F3_ExperientialProfile,
  archetype: ArchetypeId,
): F3_FullControls {
  const entry = determineEntryPhase(profile, archetype)
  const sequence = buildCycleSequence(entry.phase)
  const allocation = computePhaseTimeAllocation(profile, archetype)

  // サイクル完走を強制するか
  // 完走率が低い子ほど強制（サイクルを途中でやめさせない）
  const force_full_cycle = profile.cycle_completion_rate < 0.7

  const reasoning = `${entry.reasoning}, 順序=[${sequence.map(p => PHASE_NAMES[p]).join('→')}], ` +
    `完走率=${(profile.cycle_completion_rate * 100).toFixed(0)}%${force_full_cycle ? '(完走強制)' : ''}`

  return {
    entry_phase: entry.phase,
    cycle_sequence: sequence,
    phase_time_allocation: allocation,
    force_full_cycle,
    reasoning,
  }
}

// ============================================================
// Part 6: 統合制御への適用
// ============================================================

/**
 * F3制御パラメータを統合制御パラメータのpresentationセクションに適用
 */
export function applyF3ToControls(
  controls: IntegratedControlParameters,
  f3Controls: F3_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }
  updated.presentation = {
    ...updated.presentation,
    kolb_entry_phase: f3Controls.entry_phase,
  }
  return updated
}
