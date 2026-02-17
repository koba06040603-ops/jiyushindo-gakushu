/**
 * F10: 領域固有認知構造 (Domain-Specific Cognitive Structure) エンジン
 * 
 * 理論的根拠:
 * - Chi et al. (1981, d=0.92): 専門家と初心者の違いは領域固有知識の構造化にある
 * - Alexander (2003): Model of Domain Learning (MDL) — 3段階モデル
 *   - acclimation (順応): 断片的知識、表層的処理
 *   - competence (有能): 構造化された知識、深い処理
 *   - proficiency (熟達): 柔軟な知識、転移可能
 * - Schwartz et al. (2005): 「教科固有の見方・考え方」（教科思考）
 * 
 * 核心: 各教科には固有の「見方・考え方」がある。
 *       それを意識的に使えるようになることが深い学習。
 *       誤概念の同定と知識構造の可視化が鍵。
 * 
 * 子ども観(v4): 「この子はその教科の『見方』を身につけつつあるか」を理解する視座。
 * Carroll作用: 必要学習時間を減少（知識の構造化 → 効率的な情報処理）
 */

import type {
  F10_DomainProfile,
  ArchetypeId,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: 領域知識段階の評価
// ============================================================

/** 領域知識段階（Alexander MDLに準拠） */
export type DomainStage = 'acclimation' | 'competence' | 'proficiency'

/** F10から導出される制御パラメータ */
export interface F10_FullControls {
  /** 現在の領域知識段階 */
  stage: DomainStage
  /** 教科固有の思考プロンプト */
  domain_thinking_prompt: string
  /** 知識構造の可視化を行うか */
  knowledge_structure_visualization: boolean
  /** 専門家的思考パターンの提示 */
  expert_novice_comparison: boolean
  /** 他領域への転移プロンプト */
  transfer_prompt: boolean
  /** 誤概念への対処 */
  misconception_handling: 'explicit_refutation' | 'bridging' | 'none'
  /** 推論の根拠 */
  reasoning: string
}

// ============================================================
// Part 2: 教科思考プロンプトの生成
// ============================================================

/**
 * 領域知識段階に応じた教科思考プロンプトを生成
 * 
 * - acclimation: 基本的な「なぜ？」で探索
 * - competence: 「○○の観点で見ると？」で教科的見方を促す
 * - proficiency: 「別の方法で考えると？」で転移を促す
 */
export function generateDomainThinkingPrompt(
  profile: F10_DomainProfile,
  archetype: ArchetypeId,
): string {
  switch (profile.domain_knowledge_stage) {
    case 'acclimation':
      return '「これは何かな？」「どんな特徴があるかな？」— 基礎的な観察と分類'
    case 'competence':
      return '「この教科の考え方を使うと？」「なぜそうなるのかな？」— 教科的思考の意識化'
    case 'proficiency':
      return '「別のやり方で解けるかな？」「他の場面でも使えるかな？」— 柔軟な転移'
  }
}

// ============================================================
// Part 3: 誤概念への対処方略
// ============================================================

/**
 * 誤概念の有無と段階から対処方略を決定
 * 
 * - explicit_refutation: 「○○と思ったかもしれないけど、実は…」（Chi 2005）
 * - bridging: 既知と新知識を橋渡しして正しい理解に導く
 * - none: 誤概念なし or 段階が低すぎて直接対処は逆効果
 */
export function determineMisconceptionHandling(
  profile: F10_DomainProfile,
  archetype: ArchetypeId,
): 'explicit_refutation' | 'bridging' | 'none' {
  if (profile.misconceptions.length === 0) return 'none'

  // acclimation段階: 直接的な反駁は混乱を招く → bridging
  if (profile.domain_knowledge_stage === 'acclimation') return 'bridging'

  // Type H/G: 自信を損なわないよう bridging
  if (archetype === 'H' || archetype === 'G') return 'bridging'

  // competence以上: 明示的反駁が有効
  return 'explicit_refutation'
}

// ============================================================
// Part 4: F10制御パラメータの全体算出
// ============================================================

/**
 * F10の全制御パラメータを算出
 */
export function computeF10Controls(
  profile: F10_DomainProfile,
  archetype: ArchetypeId,
): F10_FullControls {
  const stage = profile.domain_knowledge_stage
  const domain_thinking_prompt = generateDomainThinkingPrompt(profile, archetype)
  const misconception_handling = determineMisconceptionHandling(profile, archetype)

  // 知識構造の可視化: competence以上で有効（断片的な段階では混乱する）
  const knowledge_structure_visualization = stage !== 'acclimation' &&
    profile.knowledge_structure_depth >= 30

  // 専門家的思考パターン: competence段階で最も効果的
  const expert_novice_comparison = stage === 'competence' &&
    archetype !== 'H'

  // 転移プロンプト: proficiency段階で有効
  const transfer_prompt = stage === 'proficiency'

  const reasoning = `段階=${stage}(深度=${profile.knowledge_structure_depth}), ` +
    `誤概念=${profile.misconceptions.length > 0 ? profile.misconceptions.join(',') + '→' + misconception_handling : 'なし'}, ` +
    `可視化=${knowledge_structure_visualization ? 'ON' : 'OFF'}, 転移=${transfer_prompt ? 'ON' : 'OFF'}`

  return {
    stage,
    domain_thinking_prompt,
    knowledge_structure_visualization,
    expert_novice_comparison,
    transfer_prompt,
    misconception_handling,
    reasoning,
  }
}

// ============================================================
// Part 5: 統合制御への適用
// ============================================================

/**
 * F10制御パラメータを統合制御パラメータのpresentationセクションに適用
 */
export function applyF10ToControls(
  controls: IntegratedControlParameters,
  f10Controls: F10_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }
  updated.presentation = {
    ...updated.presentation,
    domain_thinking_prompt: f10Controls.domain_thinking_prompt,
  }
  return updated
}
