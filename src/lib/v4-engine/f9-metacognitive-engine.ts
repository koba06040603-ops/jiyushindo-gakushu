/**
 * F9: メタ認知的コンピテンシー (Metacognitive Competency) エンジン
 * 
 * 理論的根拠:
 * - Flavell (1979): メタ認知 = 自分の認知過程への知識と調整
 * - Schraw & Dennison (1994): メタ認知知識 × メタ認知的調整
 * - Zohar & Barzilai (2013): メタ認知的知識、メタ認知的スキル、メタ認知的経験の三側面
 * - 効果量: メタ認知的指導 d=0.69 (Dignath & Büttner, 2008)
 * 
 * 核心: メタ認知 = 「自分の考えを見つめる力」。
 *       この力が育つと、方略の適切さが上がり、集中度が向上する。
 *       メタ認知が低い子には「考え方を考える」プロンプトで足場をかける。
 * 
 * 子ども観(v4): 「この子は自分の考えを見つめられているか」を理解する視座。
 * Carroll作用: 有効学習時間を増加（メタ認知 → 方略の適切さ → 集中度向上）
 */

import type {
  F9_MetacognitiveProfile,
  F5_SRLProfile,
  ArchetypeId,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: メタ認知レベルの評価
// ============================================================

/** メタ認知レベル */
export type MetacognitiveLevel = 'high' | 'developing' | 'emerging' | 'minimal'

/** F9から導出される制御パラメータ */
export interface F9_FullControls {
  /** メタ認知レベル */
  level: MetacognitiveLevel
  /** メタ認知プロンプトの有効化 */
  metacognitive_prompts: boolean
  /** 問題解決の足場レベル */
  problem_solving_scaffold: 'structured' | 'semi' | 'open'
  /** 批判的思考プロンプト */
  critical_evaluation_prompt: boolean
  /** 創造的思考の機会 */
  creative_thinking_opportunity: boolean
  /** 推論の根拠 */
  reasoning: string
}

/**
 * メタ認知レベルを評価する
 */
export function assessMetacognitiveLevel(
  profile: F9_MetacognitiveProfile,
): MetacognitiveLevel {
  const average = (profile.metacognitive_knowledge + profile.metacognitive_regulation) / 2

  if (average >= 70) return 'high'
  if (average >= 50) return 'developing'
  if (average >= 30) return 'emerging'
  return 'minimal'
}

// ============================================================
// Part 2: メタ認知プロンプトの制御
// ============================================================

/**
 * メタ認知プロンプトを出すべきか決定する
 * 
 * 原則:
 * - メタ認知が低い子: プロンプトで気づきを促す（足場かけ）
 * - メタ認知が高い子: 過剰プロンプトは邪魔（フロー阻害）
 * - F5のSRLとの連携: SRLの内省段階ではメタ認知プロンプトが特に有効
 */
export function shouldPromptMetacognition(
  profile: F9_MetacognitiveProfile,
  archetype: ArchetypeId,
): boolean {
  const level = assessMetacognitiveLevel(profile)

  // 高レベル: プロンプト不要（自力でメタ認知できる）
  if (level === 'high') return false

  // Type A: 自律的探究者 — メタ認知プロンプトは不要
  if (archetype === 'A') return false

  // それ以外: メタ認知を促すプロンプトを有効化
  return true
}

// ============================================================
// Part 3: 問題解決足場の制御
// ============================================================

/**
 * 問題解決の足場レベルを決定する
 * 
 * - structured: 手順が示された問題解決（メタ認知が低い子向け）
 * - semi: ヒントはあるが手順は自分で考える
 * - open: 完全に自由な問題解決（メタ認知が高い子向け）
 */
export function determineProblemSolvingScaffold(
  profile: F9_MetacognitiveProfile,
  archetype: ArchetypeId,
): 'structured' | 'semi' | 'open' {
  const level = assessMetacognitiveLevel(profile)

  // アーキタイプによる補正
  if (archetype === 'H' || archetype === 'G') return 'structured'
  if (archetype === 'A' && level !== 'minimal') return 'open'

  switch (level) {
    case 'high': return 'open'
    case 'developing': return 'semi'
    case 'emerging': return 'semi'
    case 'minimal': return 'structured'
  }
}

// ============================================================
// Part 4: 批判的・創造的思考の制御
// ============================================================

/**
 * 批判的思考プロンプトを出すべきか
 * メタ認知的知識が一定以上あり、かつ批判的思考のスコアが発達途上の場合に有効
 */
export function shouldPromptCriticalEvaluation(
  profile: F9_MetacognitiveProfile,
  archetype: ArchetypeId,
): boolean {
  // メタ認知知識が30未満: まだ早い
  if (profile.metacognitive_knowledge < 30) return false
  // Type H: 認知負荷を避ける
  if (archetype === 'H') return false
  // 批判的思考が発達途上: プロンプトで促進
  return profile.critical_thinking < 70
}

/**
 * 創造的思考の機会を提供すべきか
 */
export function shouldOfferCreativeThinking(
  profile: F9_MetacognitiveProfile,
  archetype: ArchetypeId,
): boolean {
  // Type G/H: 基礎が先
  if (archetype === 'G' || archetype === 'H') return false
  // メタ認知的調整が一定以上: 創造的思考が可能
  return profile.metacognitive_regulation >= 40
}

// ============================================================
// Part 5: F9制御パラメータの全体算出
// ============================================================

/**
 * F9の全制御パラメータを算出
 */
export function computeF9Controls(
  profile: F9_MetacognitiveProfile,
  archetype: ArchetypeId,
): F9_FullControls {
  const level = assessMetacognitiveLevel(profile)
  const metacognitive_prompts = shouldPromptMetacognition(profile, archetype)
  const problem_solving_scaffold = determineProblemSolvingScaffold(profile, archetype)
  const critical_evaluation_prompt = shouldPromptCriticalEvaluation(profile, archetype)
  const creative_thinking_opportunity = shouldOfferCreativeThinking(profile, archetype)

  const reasoning = `メタ認知=${level}(知識=${profile.metacognitive_knowledge}, 調整=${profile.metacognitive_regulation}), ` +
    `プロンプト=${metacognitive_prompts ? 'ON' : 'OFF'}, PS足場=${problem_solving_scaffold}, ` +
    `批判的=${critical_evaluation_prompt ? 'ON' : 'OFF'}, 創造的=${creative_thinking_opportunity ? 'ON' : 'OFF'}`

  return {
    level,
    metacognitive_prompts,
    problem_solving_scaffold,
    critical_evaluation_prompt,
    creative_thinking_opportunity,
    reasoning,
  }
}

// ============================================================
// Part 6: 統合制御への適用
// ============================================================

/**
 * F9はSRL(F5)と密接に連携するため、統合制御ではF5のパラメータを補強する形で反映。
 * メタ認知プロンプトはSRLのself_monitoring_intervalに影響。
 */
export function applyF9ToControls(
  controls: IntegratedControlParameters,
  f9Controls: F9_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }

  // メタ認知プロンプトON → セルフモニタリング間隔を短縮
  if (f9Controls.metacognitive_prompts) {
    updated.srl = {
      ...updated.srl,
      self_monitoring_interval: Math.max(2, updated.srl.self_monitoring_interval - 1),
    }
  }

  return updated
}
