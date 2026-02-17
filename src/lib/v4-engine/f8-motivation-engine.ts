/**
 * F8: 三欲求統合動機 (Integrated Three-Needs Motivation) エンジン
 * 
 * 理論的根拠:
 * - Ryan & Deci (2000): 自己決定理論 (SDT)
 * - Deci & Ryan (2000): 3つの基本的心理的欲求（自律性・有能感・関係性）
 * 
 * 核心: 3欲求が**同時に**満たされなければ動機は崩壊する。
 *       特に有能感が社会的比較に依存している場合（fragile_competence）、
 *       見かけ上の有能感が真の成長を阻害する。
 * 
 * 子ども観(v4): 「この子は何を求めているか」を理解する視座。
 * Carroll作用: 内発的動機 → 忍耐力↑ × 集中持続↑ → 有効学習時間を増加
 * 
 * エフェクトサイズ:
 * - 自律性支援: d=0.71 (Reeve, 2006)
 * - 内発的動機の学業達成への効果: r=.25-.35 (Taylor et al., 2014)
 * - 3欲求充足と幸福感: r=.40-.60 (Deci & Ryan, 2000)
 * 
 * 設計書上のリスク:
 * 1. 社会的比較による有能感の毀損
 * 2. 表面的自律性（選択はあるが理由の内在化なし）
 * 3. 関係性の希薄化（孤立した自律性）
 */

import type {
  F8_MotivationProfile,
  F5_SRLProfile,
  F7_ScaffoldProfile,
  F12_AffectProfile,
  ArchetypeId,
  RealtimeBehaviorData,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: 3欲求の充足度評価
// ============================================================

/** 3欲求の充足状態 */
export interface NeedSatisfactionState {
  /** 自律性の充足度 (0-100) */
  autonomy: number
  /** 有能感の充足度 (0-100) */
  competence: number
  /** 関係性の充足度 (0-100) */
  relatedness: number
  /** 全体の充足度 (最も低い欲求に引っ張られる) */
  overall: number
  /** 最も低い欲求 */
  weakest_need: 'autonomy' | 'competence' | 'relatedness'
  /** リスク検出 */
  risks: MotivationRisk[]
}

/** 動機づけリスクの種類 */
export interface MotivationRisk {
  type: 'isolated_autonomy' | 'fragile_competence' | 'surface_autonomy' | 'learned_helplessness' | 'amotivation'
  severity: 'low' | 'medium' | 'high'
  description: string
  recommended_action: string
}

/**
 * F8プロファイルから3欲求の充足状態を評価する
 * 
 * 設計書の原則: 全体の充足度は最低欲求に引っ張られる
 * （鎖の強さは最も弱い環で決まる — ボトルネック原理）
 */
export function assessNeedSatisfaction(
  profile: F8_MotivationProfile,
): NeedSatisfactionState {
  const autonomy = profile.autonomy_satisfaction
  const competence = profile.competence_satisfaction
  const relatedness = profile.relatedness_satisfaction

  // ボトルネック原理: 最低値が全体を規定
  const overall = Math.min(autonomy, competence, relatedness)

  // 最も低い欲求を特定
  let weakest_need: 'autonomy' | 'competence' | 'relatedness'
  if (autonomy <= competence && autonomy <= relatedness) {
    weakest_need = 'autonomy'
  } else if (competence <= autonomy && competence <= relatedness) {
    weakest_need = 'competence'
  } else {
    weakest_need = 'relatedness'
  }

  // リスク検出
  const risks = detectMotivationRisks(profile)

  return { autonomy, competence, relatedness, overall, weakest_need, risks }
}

/**
 * 動機づけリスクの検出
 * 
 * 設計書 Part 2 F8 のリスクフラグ:
 * 1. isolated_autonomy: 自律性高 + 関係性低 → 孤立した自律
 * 2. fragile_competence: 有能感が社会比較に依存 → 脆い有能感
 * 3. surface_autonomy: 選択はあるが理由の内在化なし → 表面的自律
 */
function detectMotivationRisks(profile: F8_MotivationProfile): MotivationRisk[] {
  const risks: MotivationRisk[] = []

  // 孤立した自律性
  if (profile.isolated_autonomy ||
      (profile.autonomy_satisfaction > 70 && profile.relatedness_satisfaction < 40)) {
    risks.push({
      type: 'isolated_autonomy',
      severity: profile.relatedness_satisfaction < 25 ? 'high' : 'medium',
      description: '自律性は高いが、関係性が満たされていない。一人で頑張りすぎている可能性。',
      recommended_action: '学びの共有機会を増やす。教師の温かいフィードバックを提供。',
    })
  }

  // 脆い有能感
  if (profile.fragile_competence ||
      (profile.competence_satisfaction > 60 && profile.motivation_continuum_score < 40)) {
    risks.push({
      type: 'fragile_competence',
      severity: profile.motivation_continuum_score < 25 ? 'high' : 'medium',
      description: '有能感が社会的比較や成績に依存している。真の学びへの動機が弱い。',
      recommended_action: '過去の自分との比較のみ。絶対基準。成長過程にフォーカス。',
    })
  }

  // 表面的自律
  if (profile.surface_autonomy ||
      (profile.autonomy_satisfaction > 50 && profile.motivation_quality === 'external')) {
    risks.push({
      type: 'surface_autonomy',
      severity: 'medium',
      description: '選択肢はあるが、なぜその選択をするかが内在化されていない。',
      recommended_action: '選択に理由を添える。「なぜこれを学ぶのか」を一緒に考える。',
    })
  }

  // 学習性無力感（全欲求低下）
  if (profile.autonomy_satisfaction < 30 &&
      profile.competence_satisfaction < 30 &&
      profile.motivation_continuum_score < 20) {
    risks.push({
      type: 'learned_helplessness',
      severity: 'high',
      description: '全欲求が充足されておらず、学習性無力感の兆候。「何をしてもダメ」と感じている可能性。',
      recommended_action: '極小の成功体験から。「ここにいていい」の安全感を最優先。教師との連携必須。',
    })
  }

  // 無動機 (amotivation)
  if (profile.motivation_quality === 'external' && profile.motivation_continuum_score < 15) {
    risks.push({
      type: 'amotivation',
      severity: 'high',
      description: '学習動機がほぼない。学びの意味を見出せていない。',
      recommended_action: '無理に動機づけしない。安全と関係性を先に。子どもの興味の芽を見逃さない。',
    })
  }

  return risks
}

// ============================================================
// Part 2: 動機質の連続体評価
// ============================================================

/** 動機質の連続体における位置 */
export interface MotivationQualityAssessment {
  /** 現在の動機質 */
  current_quality: 'external' | 'introjected' | 'identified' | 'integrated' | 'intrinsic'
  /** 動機質スコア (0-100) */
  continuum_score: number
  /** 内在化の方向性（前進/停滞/後退） */
  direction: 'progressing' | 'stable' | 'regressing'
  /** 推奨される支援スタイル */
  support_style: MotivationSupportStyle
}

/** 動機づけ支援スタイル */
export interface MotivationSupportStyle {
  /** 自律性支援 */
  autonomy_support: {
    /** 選択に理由付けを添える */
    choice_with_rationale: boolean
    /** 進捗を自己成長のみ可視化（社会比較なし） */
    self_growth_visualization: boolean
    /** 言語スタイル（招くような言葉 vs 指示的） */
    language_style: 'inviting' | 'directive'
  }
  /** 有能感支援 */
  competence_support: {
    /** 過去の自分との比較のみ */
    self_comparison_only: boolean
    /** 絶対基準による評価 */
    absolute_criteria: boolean
    /** ZPD最適挑戦 (成功率65-85%) */
    optimal_challenge: boolean
    /** 小成功の即時フィードバック */
    micro_success_feedback: boolean
  }
  /** 関係性支援 */
  relatedness_support: {
    /** 教師の非同期フィードバック */
    teacher_async_feedback: boolean
    /** 学びの共有機会 */
    peer_sharing_opportunity: boolean
    /** AIの温かいインタラクション */
    warm_ai_interaction: boolean
    /** 学習貢献感 */
    learning_contribution: boolean
  }
}

/**
 * 動機質の連続体を評価する
 * 
 * Ryan & Deci (2000) の自己決定連続体:
 * 外的調整 → 取入れ的調整 → 同一化的調整 → 統合的調整 → 内発的動機
 * (0)         (25)            (50)             (75)            (100)
 */
export function assessMotivationQuality(
  profile: F8_MotivationProfile,
  archetype: ArchetypeId,
): MotivationQualityAssessment {
  const current_quality = profile.motivation_quality
  const continuum_score = profile.motivation_continuum_score

  // 内在化の方向性は縦断データが必要だが、プロファイルの整合性から推定
  const direction = estimateInternalizationDirection(profile)

  // 推奨される支援スタイル
  const support_style = computeMotivationSupportStyle(profile, archetype)

  return { current_quality, continuum_score, direction, support_style }
}

/**
 * 内在化の方向性を推定
 * 
 * 動機質と3欲求の整合性から推定:
 * - 欲求充足 + 外発的 → 前進中（内在化が進みつつある）
 * - 欲求不足 + 内発的 → 後退リスク（燃え尽きの可能性）
 * - 欲求充足 + 内発的 → 安定（理想的）
 * - 欲求不足 + 外発的 → 停滞
 */
function estimateInternalizationDirection(
  profile: F8_MotivationProfile,
): 'progressing' | 'stable' | 'regressing' {
  const needsMet = (profile.autonomy_satisfaction + profile.competence_satisfaction + profile.relatedness_satisfaction) / 3
  const intrinsic = profile.motivation_continuum_score

  if (needsMet >= 60 && intrinsic >= 60) return 'stable'      // 理想的
  if (needsMet >= 50 && intrinsic < 50) return 'progressing'   // 欲求が満たされ始め、内在化が進む
  if (needsMet < 40 && intrinsic >= 50) return 'regressing'    // 燃え尽きリスク
  return 'stable'  // その他は安定として扱う
}

/**
 * 動機づけ支援スタイルの算出
 * 
 * 設計書 Part 2 F8 の操作変数に完全準拠
 */
function computeMotivationSupportStyle(
  profile: F8_MotivationProfile,
  archetype: ArchetypeId,
): MotivationSupportStyle {
  // 自律性支援
  const autonomy_support = {
    // 選択に理由を添える: 表面的自律を防ぐ
    choice_with_rationale: true,
    // 自己成長の可視化: 常に有効（社会比較は絶対にしない）
    self_growth_visualization: true,
    // 言語スタイル: 基本は「招くような」（inviting）
    language_style: (archetype === 'H' || archetype === 'G' || profile.autonomy_satisfaction < 30)
      ? 'inviting' as const
      : (profile.motivation_continuum_score > 70 ? 'inviting' as const : 'inviting' as const),
      // 設計書の原則: 常に「招くような」言葉遣い。指示的にはしない。
  }

  // 有能感支援
  const competence_support = {
    // 過去の自分との比較のみ（設計書: 社会比較は絶対にしない）
    self_comparison_only: true,
    // 絶対基準
    absolute_criteria: true,
    // ZPD最適挑戦: 成功率65-85%を維持
    optimal_challenge: true,
    // 小成功の即時フィードバック: 有能感が低い子に特に
    micro_success_feedback:
      profile.competence_satisfaction < 50 ||
      archetype === 'G' || archetype === 'H' || archetype === 'F',
  }

  // 関係性支援
  const relatedness_support = {
    // 教師のフィードバック: 関係性が低い子に特に
    teacher_async_feedback: profile.relatedness_satisfaction < 50,
    // 学びの共有: 社交的な子には積極的に
    peer_sharing_opportunity:
      archetype === 'E' ||
      (profile.relatedness_satisfaction > 50 && !profile.isolated_autonomy),
    // AIの温かさ: 常に（ただしフロー時は邪魔しない）
    warm_ai_interaction: true,
    // 学習貢献感: 自分の学びが誰かの役に立つ感覚
    learning_contribution:
      archetype === 'E' ||
      profile.relatedness_satisfaction > 60,
  }

  return { autonomy_support, competence_support, relatedness_support }
}

// ============================================================
// Part 3: F8制御パラメータの全体算出
// ============================================================

/** F8から導出される動機づけ制御パラメータの全体 */
export interface F8_FullControls {
  /** 3欲求の充足状態 */
  need_satisfaction: NeedSatisfactionState
  /** 動機質の評価 */
  quality_assessment: MotivationQualityAssessment
  /** 統合制御パラメータのmotivationセクションへのマッピング */
  motivation_controls: {
    progress_display: 'self_growth' | 'none'
    mastery_criteria: 'absolute'
    language_style: 'inviting' | 'directive'
    choice_with_rationale: boolean
    peer_sharing_opportunity: boolean
    micro_success_feedback: boolean
  }
  /** 因果チェーンへの影響（他の理論への波及） */
  causal_effects: {
    /** F5への影響: 自己効力感の変調 */
    f5_efficacy_modulation: number  // -1.0 to +1.0
    /** F4への影響: 不安の変調 */
    f4_anxiety_modulation: number   // -1.0 to +1.0
    /** F12への影響: 感情の変調 */
    f12_valence_modulation: number  // -1.0 to +1.0
  }
  /** 推論の根拠 */
  reasoning: string
}

/**
 * F8の全制御パラメータを算出
 */
export function computeF8Controls(
  profile: F8_MotivationProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId,
  scaffoldProfile?: F7_ScaffoldProfile,
  affectProfile?: F12_AffectProfile,
): F8_FullControls {
  const needSatisfaction = assessNeedSatisfaction(profile)
  const qualityAssessment = assessMotivationQuality(profile, archetype)

  // 動機づけ制御パラメータ
  const motivation_controls = {
    progress_display: 'self_growth' as const,  // 常に自己成長（設計書の鉄則）
    mastery_criteria: 'absolute' as const,     // 常に絶対基準
    language_style: qualityAssessment.support_style.autonomy_support.language_style,
    choice_with_rationale: qualityAssessment.support_style.autonomy_support.choice_with_rationale,
    peer_sharing_opportunity: qualityAssessment.support_style.relatedness_support.peer_sharing_opportunity,
    micro_success_feedback: qualityAssessment.support_style.competence_support.micro_success_feedback,
  }

  // 因果チェーンへの影響
  const causal_effects = computeCausalEffects(profile, needSatisfaction, behavior)

  // 推論の構築
  const reasoning = buildMotivationReasoning(needSatisfaction, qualityAssessment)

  return {
    need_satisfaction: needSatisfaction,
    quality_assessment: qualityAssessment,
    motivation_controls,
    causal_effects,
    reasoning,
  }
}

/**
 * 因果チェーンへの波及効果を算出
 * 
 * 設計書 Part 3.1 の因果連鎖:
 * F7(成功体験) → F8(有能感↑) → F5(自己効力感↑) → F4(不安↓) → 構造化↓ → F8(自律性↑)
 * 
 * この関数はF8の状態がF5, F4, F12に与える波及効果を数値化する
 */
function computeCausalEffects(
  profile: F8_MotivationProfile,
  needState: NeedSatisfactionState,
  behavior: RealtimeBehaviorData,
): F8_FullControls['causal_effects'] {
  // F5への影響: 有能感 → 自己効力感
  // 有能感が高い → F5.forethought.self_efficacy に正の影響
  // 有能感が低い → F5.forethought.self_efficacy に負の影響
  const competenceNorm = (profile.competence_satisfaction - 50) / 50  // -1 to +1
  const f5_efficacy_modulation = competenceNorm * 0.5  // 影響の強さを0.5倍に抑制

  // F4への影響: 全欲求充足 → 不安の減少
  // 全欲求が満たされている → 不安↓
  const overallNorm = (needState.overall - 50) / 50
  const f4_anxiety_modulation = -overallNorm * 0.4  // 正の充足 = 不安の減少（負の方向）

  // F12への影響: 内発的動機 → 正の感情
  // 内発的動機が高い → valence に正の影響
  const motivationNorm = (profile.motivation_continuum_score - 50) / 50
  const f12_valence_modulation = motivationNorm * 0.3

  return { f5_efficacy_modulation, f4_anxiety_modulation, f12_valence_modulation }
}

function buildMotivationReasoning(
  needState: NeedSatisfactionState,
  qualityAssessment: MotivationQualityAssessment,
): string {
  const needNames = { autonomy: '自律性', competence: '有能感', relatedness: '関係性' }
  const qualityNames = {
    external: '外的調整', introjected: '取入れ的調整', identified: '同一化的調整',
    integrated: '統合的調整', intrinsic: '内発的動機',
  }

  let reasoning = `3欲求: 自律=${needState.autonomy}, 有能感=${needState.competence}, 関係性=${needState.relatedness}。`
  reasoning += `最低欲求: ${needNames[needState.weakest_need]}(${Math.min(needState.autonomy, needState.competence, needState.relatedness)})。`
  reasoning += `動機質: ${qualityNames[qualityAssessment.current_quality]}(${qualityAssessment.continuum_score})。`

  if (needState.risks.length > 0) {
    reasoning += ` リスク: ${needState.risks.map(r => r.type).join(', ')}。`
  }

  return reasoning
}

// ============================================================
// Part 4: F8 × F12 感情との相互作用
// ============================================================

/**
 * 感情状態がF8の動機づけ支援に与える影響
 * 
 * 因果チェーン:
 * - 不安(F12) → 有能感↓(F8) → 自己効力感↓(F5)
 * - フロー(F12) → 内発的動機↑(F8)
 * - 退屈(F12) → 全欲求↓ (特に自律性)
 */
export function adjustF8ForAffect(
  controls: F8_FullControls,
  affectProfile: F12_AffectProfile,
): F8_FullControls {
  const adjusted = { ...controls }

  // 不安が高い → 有能感支援を手厚く
  if (affectProfile.academic_anxiety > 60) {
    adjusted.motivation_controls = {
      ...adjusted.motivation_controls,
      micro_success_feedback: true,  // 強制的にON
    }
    // 因果効果の補正
    adjusted.causal_effects = {
      ...adjusted.causal_effects,
      f5_efficacy_modulation: adjusted.causal_effects.f5_efficacy_modulation - 0.2,  // 不安が自己効力感をさらに下げる
    }
  }

  // フロー → 動機づけ介入を最小化
  if (affectProfile.flow_state_probability > 0.7) {
    adjusted.motivation_controls = {
      ...adjusted.motivation_controls,
      micro_success_feedback: false,  // フロー中は邪魔しない
    }
  }

  // 退屈 → 自律性支援を強化
  if (affectProfile.academic_boredom > 60) {
    adjusted.motivation_controls = {
      ...adjusted.motivation_controls,
      choice_with_rationale: true,  // 新しい選択肢を提示
    }
  }

  return adjusted
}

// ============================================================
// Part 5: F8制御パラメータから IntegratedControlParameters への適用
// ============================================================

/**
 * F8制御パラメータを統合制御パラメータのmotivationセクションに適用する
 */
export function applyF8ToControls(
  controls: IntegratedControlParameters,
  f8Controls: F8_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }

  updated.motivation = {
    ...updated.motivation,
    progress_display: f8Controls.motivation_controls.progress_display,
    mastery_criteria: f8Controls.motivation_controls.mastery_criteria,
    language_style: f8Controls.motivation_controls.language_style,
    choice_with_rationale: f8Controls.motivation_controls.choice_with_rationale,
    peer_sharing_opportunity: f8Controls.motivation_controls.peer_sharing_opportunity,
    micro_success_feedback: f8Controls.motivation_controls.micro_success_feedback,
  }

  // リスクによる教師アラート
  const highRisks = f8Controls.need_satisfaction.risks.filter(r => r.severity === 'high')
  if (highRisks.length > 0) {
    updated._teacher_alert = true
  }

  // 学習性無力感リスク → 人的介入推奨
  if (highRisks.some(r => r.type === 'learned_helplessness' || r.type === 'amotivation')) {
    updated._human_intervention_recommended = true
  }

  return updated
}
