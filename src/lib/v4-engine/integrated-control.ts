/**
 * v4 統合制御エンジン — computeIntegratedControls
 * 
 * 設計文書: THEORY_CAUSAL_MODEL.md Part 6 完全準拠
 * 推奨構造: FRAMEWORK_COMPARISON.md — 外装B(文科省)×内部C(3層制御)
 * 
 * 制御の順序（3層制御の原則）:
 *   1. 感情層 (F12) — 感情ゲーティング（最優先）
 *   2. 認知層 (F4, F7, F6) — 構造化度、足場、方略
 *   3. 社会層 (F8, F5) — 動機づけ、自己調整
 * 
 * 衝突解決: 感情 > 認知 > 社会
 * 
 * Phase 1 実装: F4 + F7 + F12 (瞬時制御ループ)
 * Phase 2 以降で F5, F8, F6, F1 等を追加
 */

import type {
  AllTheoryProfiles,
  FundamentalAxes,
  ArchetypeId,
  IntegratedControlParameters,
  RealtimeBehaviorData,
  F1_SensoryProfile,
  F2_IntelligenceProfile,
  F6_StrategyProfile,
} from './types'
import { ARCHETYPES } from './types'
import { computeF4Controls, computeATIStructure, shouldAdjustStructure } from './f4-ati-engine'
import { computeF7Controls, computeContingencyRule } from './f7-scaffold-engine'
import { executeAffectGating, applyAffectGating } from './f12-affect-engine'

// ============================================================
// Part 1: 基幹軸の算出 — 12の視座から5つの軸へ
// ============================================================

/**
 * 12理論の全プロファイルから5つの基幹軸を算出する
 * 設計書 Part 5.1 完全準拠
 */
export function computeFundamentalAxes(profiles: AllTheoryProfiles): FundamentalAxes {
  // 軸1: 認知的自律度
  // F5.developmental_level × F4.independence × F9.metacognitive
  const srlLevel = developmentalLevelToScore(profiles.F5.developmental_level)
  const cognitive_autonomy = Math.min(100, Math.max(0,
    (srlLevel * 0.4) +
    (profiles.F4.independence_level * 0.35) +
    (profiles.F9.metacognitive_regulation * 0.25)
  ))

  // 軸2: 感情的安定度
  // (100-F4.anxiety) × F12.valence × F8.competence
  const anxietyInv = 100 - profiles.F4.anxiety_level
  const valenceNorm = (profiles.F12.current_valence + 100) / 2  // -100~+100 → 0~100
  const emotional_stability = Math.min(100, Math.max(0,
    (anxietyInv * 0.4) +
    (valenceNorm * 0.3) +
    (profiles.F8.competence_satisfaction * 0.3)
  ))

  // 軸3: 認知的入口選好
  const primary_sensory = findPrimarySensory(profiles.F1)
  const primary_intelligence = findPrimaryIntelligence(profiles.F2)

  // 軸4: 方略的成熟度
  // F6.mastery_level × F6.strategy_readiness
  const strategic_maturity = Math.min(100, Math.max(0,
    (profiles.F6.mastery_level_for_current_unit * 0.5) +
    (profiles.F6.retrieval_practice_readiness * 0.3) +
    (profiles.F6.elaboration_prior_knowledge * 0.2)
  ))

  // 軸5: 動機的エネルギー
  // F8.motivation_continuum × F11.relevance × F12.flow_probability
  const motivational_energy = Math.min(100, Math.max(0,
    (profiles.F8.motivation_continuum_score * 0.4) +
    (profiles.F11.personal_relevance * 0.3) +
    (profiles.F12.flow_state_probability * 100 * 0.3)
  ))

  return {
    cognitive_autonomy,
    emotional_stability,
    entry_channel_preference: { primary_sensory, primary_intelligence },
    strategic_maturity,
    motivational_energy,
  }
}

function developmentalLevelToScore(level: string): number {
  switch (level) {
    case 'observation': return 20
    case 'emulation': return 40
    case 'self_control': return 65
    case 'self_regulation': return 90
    default: return 30
  }
}

function findPrimarySensory(profile: F1_SensoryProfile): keyof F1_SensoryProfile {
  const entries: [keyof F1_SensoryProfile, number][] = [
    ['visual_processing_efficiency', profile.visual_processing_efficiency],
    ['auditory_processing_efficiency', profile.auditory_processing_efficiency],
    ['reading_processing_efficiency', profile.reading_processing_efficiency],
    ['kinesthetic_processing_efficiency', profile.kinesthetic_processing_efficiency],
  ]
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function findPrimaryIntelligence(profile: F2_IntelligenceProfile): keyof F2_IntelligenceProfile {
  const entries: [keyof F2_IntelligenceProfile, number][] = [
    ['linguistic', profile.linguistic],
    ['logical_mathematical', profile.logical_mathematical],
    ['spatial', profile.spatial],
    ['bodily_kinesthetic', profile.bodily_kinesthetic],
    ['musical', profile.musical],
    ['interpersonal', profile.interpersonal],
    ['intrapersonal', profile.intrapersonal],
    ['naturalist', profile.naturalist],
  ]
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

// ============================================================
// Part 2: アーキタイプの推定 — 子どもの今の姿の理解
// ============================================================

/**
 * 5つの基幹軸から「この子の今の姿」を理解する
 * 設計書 Part 5.2: H=High(70以上), M=Middle(40-70), L=Low(40未満)
 * 
 * 注意: アーキタイプは分類ではない。今この瞬間の描写である。
 */
export function understandCurrentPresence(axes: FundamentalAxes): ArchetypeId {
  const ca = axisLevel(axes.cognitive_autonomy)
  const es = axisLevel(axes.emotional_stability)
  const sm = axisLevel(axes.strategic_maturity)
  const me = axisLevel(axes.motivational_energy)

  // 設計書の8パターンとマッチング
  // A: H H H H — 自律的探究者
  if (ca === 'H' && es === 'H' && sm === 'H' && me === 'H') return 'A'

  // H: L L L L — 学習回避者
  if (ca === 'L' && es === 'L' && sm === 'L' && me === 'L') return 'H'

  // D: H L H L — 慎重な完璧主義者
  if (ca === 'H' && es === 'L' && sm === 'H' && me === 'L') return 'D'

  // B: M H M H — 堅実な努力家
  if (ca === 'M' && es === 'H' && sm === 'M' && me === 'H') return 'B'

  // G: L M L L — 受動的依存者
  if (ca === 'L' && es === 'M' && sm === 'L' && me === 'L') return 'G'

  // E: M M M H — 社交的学習者
  if (ca === 'M' && es === 'M' && sm === 'M' && me === 'H') return 'E'

  // C: M H L M — 直感的冒険者
  if (ca === 'M' && es === 'H' && sm === 'L' && me === 'M') return 'C'

  // F: L L L M — 不安定な挑戦者
  if (ca === 'L' && es === 'L' && sm === 'L' && me === 'M') return 'F'

  // 完全一致しない場合はファジーマッチング
  return fuzzyMatch(axes)
}

function axisLevel(value: number): 'H' | 'M' | 'L' {
  if (value >= 70) return 'H'
  if (value >= 40) return 'M'
  return 'L'
}

/**
 * 完全一致しない場合のファジーマッチング
 * 各アーキタイプとのユークリッド距離で最近傍を返す
 */
function fuzzyMatch(axes: FundamentalAxes): ArchetypeId {
  const levelToScore = { 'H': 85, 'M': 55, 'L': 25 }

  let bestMatch: ArchetypeId = 'B'  // デフォルト
  let bestDistance = Infinity

  for (const [id, desc] of Object.entries(ARCHETYPES)) {
    const levels = desc.axis_levels
    const d =
      Math.pow(axes.cognitive_autonomy - levelToScore[levels.cognitive_autonomy], 2) +
      Math.pow(axes.emotional_stability - levelToScore[levels.emotional_stability], 2) +
      Math.pow(axes.strategic_maturity - levelToScore[levels.strategic_maturity], 2) +
      Math.pow(axes.motivational_energy - levelToScore[levels.motivational_energy], 2)

    if (d < bestDistance) {
      bestDistance = d
      bestMatch = id as ArchetypeId
    }
  }

  return bestMatch
}

// ============================================================
// Part 3: アーキタイプベースのデフォルト制御値
// ============================================================

/**
 * アーキタイプからデフォルトの統合制御パラメータを生成
 * 設計書 Part 5.3 の A, D, G, H 定義に準拠
 */
export function getArchetypeDefaults(archetype: ArchetypeId): IntegratedControlParameters {
  // 共通のデフォルト値
  const defaults: IntegratedControlParameters = {
    presentation: {
      entry_channel: 'visual',
      encoding_channels: ['reading'],
      concept_entry_intelligence: 'logical_mathematical',
      fallback_intelligence: 'spatial',
      kolb_entry_phase: 'AC',
      domain_thinking_prompt: '',
      real_world_connection: '',
    },
    structure: {
      structure_level: 0.5,
      difficulty_zpd_position: 0.5,
      solution_path_openness: 0.5,
      error_tolerance: 0.5,
    },
    scaffold: {
      recruitment: false,
      reduction_of_dof: 0,
      direction_maintenance: false,
      marking_critical: false,
      demonstration_level: 'none',
      frustration_control: false,
      encouragement: true,
      soft_language: false,
      success_threshold_to_fade: 3,
      failure_threshold_to_add: 2,
      fade_rate: 0.5,
      hint_proactiveness: 0.3,
    },
    cognitive_strategy: {
      retrieval_mode: 'cued_recall',
      retrieval_with_feedback: true,
      spacing_interval_days: 3,
      interleaving_enabled: false,
      interleaving_ratio: 0.3,
      elaboration_prompt_type: 'none',
    },
    srl: {
      goal_prompt_type: 'example',
      self_monitoring_interval: 5,
      reflection_prompt_type: 'scaled',
      attribution_guidance: false,
      think_aloud_modeling: false,
      improvement_planning: false,
    },
    motivation: {
      progress_display: 'self_growth',
      mastery_criteria: 'absolute',
      language_style: 'inviting',
      choice_with_rationale: false,
      arousal_regulation: 'maintain',
      emotional_message_type: 'neutral',
      peer_sharing_opportunity: false,
      micro_success_feedback: false,
    },
    _teacher_alert: false,
    _human_intervention_recommended: false,
  }

  // アーキタイプ別のオーバーライド（設計書 Part 5.3 完全準拠）
  switch (archetype) {
    case 'A':
      return applyArchetypeA(defaults)
    case 'B':
      return applyArchetypeB(defaults)
    case 'C':
      return applyArchetypeC(defaults)
    case 'D':
      return applyArchetypeD(defaults)
    case 'E':
      return applyArchetypeE(defaults)
    case 'F':
      return applyArchetypeF(defaults)
    case 'G':
      return applyArchetypeG(defaults)
    case 'H':
      return applyArchetypeH(defaults)
    default:
      return defaults
  }
}

function applyArchetypeA(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.15, difficulty_zpd_position: 0.8, solution_path_openness: 0.9, error_tolerance: 0.9 }
  d.scaffold = { ...d.scaffold, hint_proactiveness: 0.1, fade_rate: 0.9 }
  d.srl = { ...d.srl, goal_prompt_type: 'none', reflection_prompt_type: 'open_ended', think_aloud_modeling: false }
  d.cognitive_strategy = { ...d.cognitive_strategy, retrieval_mode: 'free_recall', interleaving_enabled: true, elaboration_prompt_type: 'connect' }
  d.motivation = { ...d.motivation, progress_display: 'self_growth', choice_with_rationale: true, peer_sharing_opportunity: true, micro_success_feedback: false }
  return d
}

function applyArchetypeB(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.35, difficulty_zpd_position: 0.6, solution_path_openness: 0.6, error_tolerance: 0.7 }
  d.scaffold = { ...d.scaffold, hint_proactiveness: 0.3, fade_rate: 0.7, success_threshold_to_fade: 3 }
  d.srl = { ...d.srl, goal_prompt_type: 'example', reflection_prompt_type: 'scaled' }
  d.cognitive_strategy = { ...d.cognitive_strategy, retrieval_mode: 'cued_recall', interleaving_enabled: true, interleaving_ratio: 0.3, elaboration_prompt_type: 'why' }
  d.motivation = { ...d.motivation, choice_with_rationale: true, peer_sharing_opportunity: true, micro_success_feedback: false }
  return d
}

function applyArchetypeC(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.3, difficulty_zpd_position: 0.65, solution_path_openness: 0.8, error_tolerance: 0.8 }
  d.scaffold = { ...d.scaffold, hint_proactiveness: 0.2, fade_rate: 0.6, direction_maintenance: true }
  d.srl = { ...d.srl, goal_prompt_type: 'example', reflection_prompt_type: 'scaled', improvement_planning: true }
  d.cognitive_strategy = { ...d.cognitive_strategy, retrieval_mode: 'cued_recall', elaboration_prompt_type: 'how' }
  d.motivation = { ...d.motivation, choice_with_rationale: true, micro_success_feedback: false }
  return d
}

function applyArchetypeD(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.45, difficulty_zpd_position: 0.5, solution_path_openness: 0.5, error_tolerance: 0.6 }
  d.scaffold = { ...d.scaffold, frustration_control: true, encouragement: true, soft_language: true, hint_proactiveness: 0.4, success_threshold_to_fade: 4 }
  d.srl = { ...d.srl, attribution_guidance: true, reflection_prompt_type: 'scaled', improvement_planning: true }
  d.motivation = { ...d.motivation, arousal_regulation: 'decrease', emotional_message_type: 'calming', mastery_criteria: 'absolute', progress_display: 'self_growth', micro_success_feedback: false }
  return d
}

function applyArchetypeE(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.4, difficulty_zpd_position: 0.55, solution_path_openness: 0.6, error_tolerance: 0.6 }
  d.scaffold = { ...d.scaffold, hint_proactiveness: 0.3, fade_rate: 0.6 }
  d.srl = { ...d.srl, goal_prompt_type: 'example', reflection_prompt_type: 'scaled' }
  d.motivation = { ...d.motivation, peer_sharing_opportunity: true, choice_with_rationale: true, micro_success_feedback: false }
  return d
}

function applyArchetypeF(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.6, difficulty_zpd_position: 0.4, solution_path_openness: 0.3, error_tolerance: 0.4 }
  d.scaffold = { ...d.scaffold, frustration_control: true, encouragement: true, soft_language: true, hint_proactiveness: 0.6, success_threshold_to_fade: 4, failure_threshold_to_add: 1, fade_rate: 0.3 }
  d.srl = { ...d.srl, goal_prompt_type: 'guided', attribution_guidance: true, reflection_prompt_type: 'binary' }
  d.motivation = { ...d.motivation, arousal_regulation: 'decrease', emotional_message_type: 'calming', micro_success_feedback: true }
  return d
}

function applyArchetypeG(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.85, difficulty_zpd_position: 0.3, solution_path_openness: 0.2, error_tolerance: 0.3 }
  d.scaffold = {
    ...d.scaffold, recruitment: true, reduction_of_dof: 0.8, marking_critical: true,
    demonstration_level: 'partial', hint_proactiveness: 0.8,
    success_threshold_to_fade: 5, failure_threshold_to_add: 1, fade_rate: 0.2,
  }
  d.srl = { ...d.srl, goal_prompt_type: 'guided', think_aloud_modeling: true, self_monitoring_interval: 3, reflection_prompt_type: 'binary', improvement_planning: true }
  d.cognitive_strategy = { ...d.cognitive_strategy, retrieval_mode: 'recognition', interleaving_enabled: false, elaboration_prompt_type: 'none' }
  d.motivation = { ...d.motivation, emotional_message_type: 'encouraging', choice_with_rationale: true, peer_sharing_opportunity: false, micro_success_feedback: true }
  return d
}

function applyArchetypeH(d: IntegratedControlParameters): IntegratedControlParameters {
  d.structure = { structure_level: 0.95, difficulty_zpd_position: 0.15, solution_path_openness: 0.1, error_tolerance: 0.2 }
  d.scaffold = {
    ...d.scaffold, recruitment: true, frustration_control: true,
    demonstration_level: 'full', hint_proactiveness: 0.95, failure_threshold_to_add: 1,
  }
  d.srl = { ...d.srl, goal_prompt_type: 'template', think_aloud_modeling: true, reflection_prompt_type: 'binary' }
  d.motivation = { ...d.motivation, arousal_regulation: 'increase', emotional_message_type: 'encouraging', language_style: 'inviting', micro_success_feedback: true }
  d._teacher_alert = true
  d._human_intervention_recommended = true
  return d
}

// ============================================================
// Part 4: F6 方略の条件チェッカー
// ============================================================

/**
 * 認知方略の適用可能性チェック（設計書 Part 2 F6 canApplyStrategy）
 */
function canApplyStrategy(strategy: string, profile: F6_StrategyProfile): boolean {
  switch (strategy) {
    case 'interleaving':
      return profile.mastery_level_for_current_unit >= 70  // 基礎習得後のみ
    case 'elaboration':
      return profile.elaboration_prior_knowledge >= 40     // 最低限の既存知識
    case 'retrieval_practice':
      return profile.mastery_level_for_current_unit >= 30  // 初期学習完了後
    case 'spacing':
      return true  // 常に適用可能だが間隔は動的調整
    default:
      return true
  }
}

// ============================================================
// Part 5: 統合アルゴリズム — computeIntegratedControls
// ============================================================

/**
 * 統合制御パラメータの算出
 * 
 * 設計書 Part 6 完全準拠。
 * 3層制御の順序:
 *   Step 0: 感情ゲーティング（F12） — 最優先
 *   Step 1: 全プロファイル取得
 *   Step 2: 基幹軸算出
 *   Step 3: アーキタイプ推定（今の姿の理解）
 *   Step 4: デフォルト制御値取得
 *   Step 5: 因果チェーンによる動的修正（F4, F7, F6, F5）
 *   Step 6: 感情ゲーティングの適用（上書き）
 *   Step 7: 矛盾解消
 * 
 * @param profiles - 12理論の全プロファイル
 * @param behavior - リアルタイム行動データ
 * @returns 統合制御パラメータ
 */
export function computeIntegratedControls(
  profiles: AllTheoryProfiles,
  behavior: RealtimeBehaviorData
): {
  controls: IntegratedControlParameters
  archetype: ArchetypeId
  axes: FundamentalAxes
  affectState: string
  reasoning: string[]
} {
  const reasoning: string[] = []

  // Step 0: 感情ゲーティング（最優先 — 感情層 > 認知層 > 社会層）
  const affectGating = executeAffectGating(
    profiles.F12,
    profiles.F8,
    behavior,
    'B'  // 暫定アーキタイプ（感情ゲーティングはアーキタイプ推定前に実行）
  )
  reasoning.push(`[F12感情] ${affectGating.reasoning}`)

  // Step 1-2: 基幹軸の算出
  const axes = computeFundamentalAxes(profiles)
  reasoning.push(`[基幹軸] 認知自律=${axes.cognitive_autonomy.toFixed(0)}, ` +
    `感情安定=${axes.emotional_stability.toFixed(0)}, ` +
    `方略成熟=${axes.strategic_maturity.toFixed(0)}, ` +
    `動機エネルギー=${axes.motivational_energy.toFixed(0)}`)

  // Step 3: この子の今の姿を理解する
  const archetype = understandCurrentPresence(axes)
  reasoning.push(`[理解] ${ARCHETYPES[archetype].name_ja}(${archetype})として理解`)

  // アーキタイプ確定後、感情ゲーティングを再実行（正確なアーキタイプで）
  const finalAffectGating = executeAffectGating(profiles.F12, profiles.F8, behavior, archetype)

  // Step 4: デフォルト制御値
  const controls = getArchetypeDefaults(archetype)

  // Step 5: 因果チェーンによる動的修正

  // 5a. F4 ATI 構造化度の算出
  const atiStructure = computeATIStructure(profiles.F4, archetype)
  controls.structure.structure_level = atiStructure
  reasoning.push(`[F4/ATI] structure_level=${atiStructure.toFixed(2)}`)

  // 5b. F7 足場の算出
  const f7Controls = computeF7Controls(profiles.F7, behavior, archetype, profiles.F12)
  controls.structure.difficulty_zpd_position = f7Controls.difficulty_zpd_position
  controls.scaffold.recruitment = f7Controls.functions.recruitment_active
  controls.scaffold.reduction_of_dof = f7Controls.functions.reduction_of_dof
  controls.scaffold.direction_maintenance = f7Controls.functions.direction_maintenance_active
  controls.scaffold.marking_critical = f7Controls.functions.marking_critical_features
  controls.scaffold.frustration_control = f7Controls.functions.frustration_control_active || controls.scaffold.frustration_control
  controls.scaffold.demonstration_level = f7Controls.functions.demonstration_level
  controls.scaffold.success_threshold_to_fade = f7Controls.contingency.success_threshold
  controls.scaffold.failure_threshold_to_add = f7Controls.contingency.failure_threshold
  controls.scaffold.fade_rate = f7Controls.contingency.fade_rate
  controls.scaffold.soft_language = f7Controls.motivational_scaffold.soft_language || controls.scaffold.soft_language
  controls.scaffold.encouragement = f7Controls.motivational_scaffold.encouragement_on_error
  reasoning.push(`[F7/足場] zpd_pos=${f7Controls.difficulty_zpd_position.toFixed(2)}, ` +
    `demo=${f7Controls.functions.demonstration_level}`)

  // 5c. 行動に基づく動的修正
  const structureAdjust = shouldAdjustStructure(profiles.F4, behavior.consecutive_errors, behavior.consecutive_successes)
  if (structureAdjust.adjust) {
    if (structureAdjust.direction === 'increase') {
      controls.structure.structure_level = Math.min(0.95,
        controls.structure.structure_level + structureAdjust.magnitude)
      reasoning.push(`[動的修正] 構造化度↑ (+${structureAdjust.magnitude.toFixed(2)})`)
    } else {
      controls.structure.structure_level = Math.max(0.1,
        controls.structure.structure_level - structureAdjust.magnitude)
      reasoning.push(`[動的修正] 構造化度↓ (-${structureAdjust.magnitude.toFixed(2)})`)
    }
  }

  // 5d. F6 方略の条件チェック
  if (!canApplyStrategy('interleaving', profiles.F6)) {
    controls.cognitive_strategy.interleaving_enabled = false
    reasoning.push(`[F6] 交互配置: 前提条件未充足 → 無効化`)
  }
  if (!canApplyStrategy('elaboration', profiles.F6)) {
    controls.cognitive_strategy.elaboration_prompt_type = 'none'
    reasoning.push(`[F6] 精緻化: 前提知識不足 → 無効化`)
  }

  // 5e. F5 SRL位相に基づく応答（Phase 2 で拡充予定）
  if (behavior.current_srl_phase === 'forethought') {
    const srlLevel = profiles.F5.forethought.goal_setting
    controls.srl.goal_prompt_type = srlLevel > 60 ? 'example' : srlLevel > 30 ? 'guided' : 'template'
    reasoning.push(`[F5/SRL] 予見段階 → goal_prompt=${controls.srl.goal_prompt_type}`)
  } else if (behavior.current_srl_phase === 'self_reflection') {
    controls.srl.attribution_guidance = profiles.F5.self_reflection.causal_attribution < 60
    reasoning.push(`[F5/SRL] 内省段階 → attribution_guidance=${controls.srl.attribution_guidance}`)
  }

  // Step 6: 感情ゲーティングの適用（最優先上書き）
  const gatedControls = applyAffectGating(controls, finalAffectGating)
  if (finalAffectGating.requires_override) {
    reasoning.push(`[感情ゲート] ${finalAffectGating.state}状態のため制御を上書き`)
  }

  // Step 7: 矛盾解消
  resolveConflicts(gatedControls)

  return {
    controls: gatedControls,
    archetype,
    axes,
    affectState: finalAffectGating.state,
    reasoning,
  }
}

// ============================================================
// Part 6: 矛盾解消
// ============================================================

/**
 * 制御パラメータ間の矛盾を解消する
 * 
 * 設計書の原則:
 * - structure_level と solution_path_openness は反比例
 * - error_tolerance は structure_level と反比例
 * - hint_proactiveness は structure_level と比例
 */
function resolveConflicts(controls: IntegratedControlParameters): void {
  const s = controls.structure.structure_level

  // 構造化度と自由度の整合性
  controls.structure.solution_path_openness = Math.min(
    controls.structure.solution_path_openness,
    1 - s + 0.1  // 構造化度が高いと自由度は低い
  )

  // 構造化度とヒント先回りの整合性
  controls.scaffold.hint_proactiveness = Math.max(
    controls.scaffold.hint_proactiveness,
    s * 0.5  // 構造化度に比例した最低限のヒント
  )

  // 誤答許容度と構造化度の整合性
  controls.structure.error_tolerance = Math.min(
    controls.structure.error_tolerance,
    1 - s * 0.5  // 構造化度が高いほど誤答を早めに修正
  )

  // ZPD位置の安全クリッピング
  controls.structure.difficulty_zpd_position = Math.max(0.05,
    Math.min(0.95, controls.structure.difficulty_zpd_position))
}

// ============================================================
// Part 7: エクスポート
// ============================================================

export {
  computeATIStructure,
  computeF4Controls,
  shouldAdjustStructure,
} from './f4-ati-engine'

export {
  computeF7Controls,
  computeContingencyRule,
  computeZPDPosition,
  estimateZPD,
  determineScaffoldFunctions,
} from './f7-scaffold-engine'

export {
  executeAffectGating,
  applyAffectGating,
  estimateAffectState,
  computeOptimalArousalRange,
} from './f12-affect-engine'
