/**
 * v4統合制御エンジン — テスト
 * 
 * 8アーキタイプ全パターンの検証 + 感情ゲーティングの優先度テスト
 * 設計書 THEORY_CAUSAL_MODEL.md Part 5.3 の制御値との一致を検証
 */

import type {
  AllTheoryProfiles,
  RealtimeBehaviorData,
  FundamentalAxes,
  ArchetypeId,
} from './types'
import { ARCHETYPES } from './types'
import {
  computeFundamentalAxes,
  understandCurrentPresence,
  getArchetypeDefaults,
  computeIntegratedControls,
} from './integrated-control'
import { computeATIStructure } from './f4-ati-engine'
import { estimateAffectState } from './f12-affect-engine'
import { computeF5Controls, detectSRLPhase, assessDevelopmentalStage, adjustSRLForAffect, trackSRLPhaseTransition, computeSRLAutoAdjustment, assessAdaptationQuality } from './f5-srl-engine'
import type { SRLSessionTracker } from './f5-srl-engine'
import { computeF8Controls, assessNeedSatisfaction, assessMotivationQuality, adjustF8ForAffect, detectMotivationFeedbackLoop } from './f8-motivation-engine'
import type { MotivationFeedbackState } from './f8-motivation-engine'
import { computeF6Controls, checkAllStrategies, determineRetrievalLevel, computeOptimalSpacing, computeInterleavingRatio, determineElaborationType } from './f6-strategy-engine'
import { computeF1Controls, determineEntryChannel, selectEncodingChannels, assessMultimodalCapacity } from './f1-sensory-engine'
import { computeF2Controls, determinePrimaryEntry, determineFallbackEntry, determineMindsetMessage } from './f2-intelligence-engine'
import { computeF3Controls, determineEntryPhase, buildCycleSequence } from './f3-experiential-engine'
import { computeF9Controls, assessMetacognitiveLevel, determineProblemSolvingScaffold } from './f9-metacognitive-engine'
import { computeF10Controls, determineMisconceptionHandling } from './f10-domain-engine'
import { computeF11Controls, assessAuthenticityLevel } from './f11-authentic-engine'

// ============================================================
// テスト用ヘルパー: プロファイル生成
// ============================================================

function createTestProfiles(overrides: Partial<{
  cognitive_autonomy: number
  emotional_stability: number
  strategic_maturity: number
  motivational_energy: number
  anxiety: number
  independence: number
  prior_knowledge: number
  arousal: number
  valence: number
  boredom: number
  flow: number
}>): AllTheoryProfiles {
  const o = {
    cognitive_autonomy: 50,
    emotional_stability: 50,
    strategic_maturity: 50,
    motivational_energy: 50,
    anxiety: 30,
    independence: 50,
    prior_knowledge: 50,
    arousal: 55,
    valence: 20,
    boredom: 20,
    flow: 0.3,
    ...overrides,
  }

  return {
    F1: {
      visual_processing_efficiency: 60,
      auditory_processing_efficiency: 50,
      reading_processing_efficiency: 55,
      kinesthetic_processing_efficiency: 45,
      multimodal_index: 55,
    },
    F2: {
      linguistic: 55, logical_mathematical: 65, spatial: 50,
      bodily_kinesthetic: 40, musical: 35, interpersonal: 50,
      intrapersonal: 50, naturalist: 40, growth_mindset: 60,
    },
    F3: {
      ce_preference: 50, ro_preference: 50, ac_preference: 60, ae_preference: 40,
      cycle_completion_rate: 0.5, dominant_style: 'assimilating',
    },
    F4: {
      prior_knowledge: o.prior_knowledge,
      general_cognitive_ability: 60,
      anxiety_level: o.anxiety,
      independence_level: o.independence,
      locus_of_control: 55,
    },
    F5: {
      forethought: {
        task_analysis: Math.min(100, o.cognitive_autonomy * 0.8),
        goal_setting: Math.min(100, o.cognitive_autonomy * 0.9),
        strategic_planning: Math.min(100, o.cognitive_autonomy * 0.7),
        self_efficacy: Math.min(100, o.emotional_stability * 0.8),
        outcome_expectation: Math.min(100, o.motivational_energy * 0.7),
        intrinsic_interest: Math.min(100, o.motivational_energy * 0.8),
      },
      performance: {
        attention_focusing: 55,
        self_instruction: Math.min(100, o.cognitive_autonomy * 0.6),
        task_strategy_use: Math.min(100, o.strategic_maturity * 0.7),
        self_monitoring: Math.min(100, o.cognitive_autonomy * 0.5),
        metacognitive_awareness: Math.min(100, o.cognitive_autonomy * 0.6),
      },
      self_reflection: {
        self_evaluation: 50,
        causal_attribution: Math.min(100, o.emotional_stability * 0.7),
        self_satisfaction: Math.min(100, o.emotional_stability * 0.8),
        adaptive_inference: 45,
      },
      developmental_level: o.cognitive_autonomy >= 70 ? 'self_regulation' :
        o.cognitive_autonomy >= 50 ? 'self_control' :
        o.cognitive_autonomy >= 30 ? 'emulation' : 'observation',
    },
    F6: {
      retrieval_practice_readiness: Math.min(100, o.strategic_maturity * 0.8),
      spacing_optimal_gap: 3,
      interleaving_readiness: o.strategic_maturity >= 70,
      elaboration_prior_knowledge: Math.min(100, o.prior_knowledge * 0.9),
      mastery_level_for_current_unit: Math.min(100, o.strategic_maturity * 0.9),
    },
    F7: {
      zpd_lower_bound: 30,
      zpd_upper_bound: 70,
      zpd_width: 40,
      current_performance: 50,
      scaffold_dependency: 100 - o.cognitive_autonomy,
      consecutive_success: 0,
      consecutive_failure: 0,
    },
    F8: {
      autonomy_satisfaction: Math.min(100, o.motivational_energy * 0.8),
      competence_satisfaction: Math.min(100, o.emotional_stability * 0.9),
      relatedness_satisfaction: 50,
      motivation_quality: o.motivational_energy >= 70 ? 'intrinsic' :
        o.motivational_energy >= 50 ? 'identified' : 'external',
      motivation_continuum_score: o.motivational_energy,
      isolated_autonomy: false,
      fragile_competence: o.emotional_stability < 40,
      surface_autonomy: false,
    },
    F9: {
      metacognitive_knowledge: Math.min(100, o.cognitive_autonomy * 0.7),
      metacognitive_regulation: Math.min(100, o.cognitive_autonomy * 0.6),
      critical_thinking: 50,
      creative_thinking: 45,
    },
    F10: {
      domain_knowledge_stage: o.prior_knowledge >= 70 ? 'competence' :
        o.prior_knowledge >= 40 ? 'competence' : 'acclimation',
      misconceptions: [],
      knowledge_structure_depth: o.prior_knowledge,
    },
    F11: {
      personal_relevance: Math.min(100, o.motivational_energy * 0.7),
      real_world_connection_awareness: 40,
      community_participation: 30,
    },
    F12: {
      current_arousal: o.arousal,
      current_valence: o.valence,
      academic_enjoyment: Math.max(0, o.valence),
      academic_anxiety: o.anxiety,
      academic_boredom: o.boredom,
      flow_state_probability: o.flow,
    },
  }
}

function createTestBehavior(overrides?: Partial<RealtimeBehaviorData>): RealtimeBehaviorData {
  return {
    consecutive_successes: 0,
    consecutive_errors: 0,
    recent_accuracy: 0.6,
    recent_response_time_ms: 15000,
    hint_usage_count: 0,
    idle_time_seconds: 0,
    estimated_affect: { arousal: 55, valence: 20 },
    current_srl_phase: 'performance',
    session_duration_minutes: 10,
    current_problem_difficulty: 50,
    ...overrides,
  }
}

// ============================================================
// テスト実行
// ============================================================

interface TestResult {
  name: string
  passed: boolean
  details: string
}

const results: TestResult[] = []

function assert(condition: boolean, name: string, details: string): void {
  results.push({ name, passed: condition, details })
}

function runTests(): void {
  console.log('=== v4統合制御エンジン テスト開始 ===\n')

  // -------------------------------------------------------
  // Test 1: アーキタイプ推定テスト（8パターン）
  // -------------------------------------------------------
  const archetypeTests: { name: string; params: Parameters<typeof createTestProfiles>[0]; expected: ArchetypeId }[] = [
    { name: 'A: 自律的探究者 (H,H,H,H)', params: { cognitive_autonomy: 80, emotional_stability: 80, strategic_maturity: 80, motivational_energy: 80, anxiety: 15, independence: 85 }, expected: 'A' },
    { name: 'B: 堅実な努力家 (M,H,M,H)', params: { cognitive_autonomy: 55, emotional_stability: 80, strategic_maturity: 60, motivational_energy: 85, anxiety: 15, independence: 55, prior_knowledge: 65 }, expected: 'B' },
    { name: 'C: 直感的冒険者 (M,H,L,M)', params: { cognitive_autonomy: 55, emotional_stability: 75, strategic_maturity: 30, motivational_energy: 55, anxiety: 25, independence: 55 }, expected: 'C' },
    { name: 'D: 慎重な完璧主義者 (H,L,H,L)', params: { cognitive_autonomy: 75, emotional_stability: 30, strategic_maturity: 75, motivational_energy: 35, anxiety: 70, independence: 70 }, expected: 'D' },
    { name: 'E: 社交的学習者 (M,M,M,H)', params: { cognitive_autonomy: 55, emotional_stability: 55, strategic_maturity: 55, motivational_energy: 75, anxiety: 35, independence: 50 }, expected: 'E' },
    { name: 'F: 不安定な挑戦者 (L,L,L,M)', params: { cognitive_autonomy: 30, emotional_stability: 30, strategic_maturity: 25, motivational_energy: 55, anxiety: 65, independence: 25 }, expected: 'F' },
    { name: 'G: 受動的依存者 (L,M,L,L)', params: { cognitive_autonomy: 25, emotional_stability: 55, strategic_maturity: 25, motivational_energy: 25, anxiety: 40, independence: 20 }, expected: 'G' },
    { name: 'H: 学習回避者 (L,L,L,L)', params: { cognitive_autonomy: 15, emotional_stability: 20, strategic_maturity: 15, motivational_energy: 15, anxiety: 80, independence: 10 }, expected: 'H' },
  ]

  for (const test of archetypeTests) {
    const profiles = createTestProfiles(test.params)
    const axes = computeFundamentalAxes(profiles)
    const archetype = understandCurrentPresence(axes)
    assert(
      archetype === test.expected,
      `アーキタイプ推定: ${test.name}`,
      `期待=${test.expected}, 実際=${archetype}, 軸=[CA=${axes.cognitive_autonomy.toFixed(0)}, ES=${axes.emotional_stability.toFixed(0)}, SM=${axes.strategic_maturity.toFixed(0)}, ME=${axes.motivational_energy.toFixed(0)}]`
    )
  }

  // -------------------------------------------------------
  // Test 2: ATI構造化度テスト
  // -------------------------------------------------------
  // Type A（自律的探究者）: 知識高, 不安低, 独立性高 → 低構造化
  const atiA = computeATIStructure({ prior_knowledge: 80, general_cognitive_ability: 80, anxiety_level: 15, independence_level: 85, locus_of_control: 80 }, 'A')
  assert(atiA < 0.3, 'ATI: Type A は低構造化', `structure=${atiA.toFixed(3)}`)

  // Type H（学習回避者）: 知識低, 不安高, 独立性低 → 高構造化
  const atiH = computeATIStructure({ prior_knowledge: 15, general_cognitive_ability: 40, anxiety_level: 85, independence_level: 10, locus_of_control: 20 }, 'H')
  assert(atiH > 0.7, 'ATI: Type H は高構造化', `structure=${atiH.toFixed(3)}`)

  // -------------------------------------------------------
  // Test 3: 感情ゲーティングテスト
  // -------------------------------------------------------
  // 危機状態の検出
  const crisisProfile = createTestProfiles({ anxiety: 85, arousal: 90, valence: -60, boredom: 10, flow: 0 })
  const crisisBehavior = createTestBehavior({ consecutive_errors: 5 })
  const crisisResult = computeIntegratedControls(crisisProfile, crisisBehavior)
  assert(
    crisisResult.affectState === 'crisis',
    '感情ゲーティング: 危機状態の検出',
    `state=${crisisResult.affectState}, teacher_alert=${crisisResult.controls._teacher_alert}`
  )
  assert(
    crisisResult.controls._teacher_alert === true,
    '感情ゲーティング: 危機時の教師アラート',
    `_teacher_alert=${crisisResult.controls._teacher_alert}`
  )

  // フロー状態の検出（邪魔をしない）
  const flowProfile = createTestProfiles({ anxiety: 10, arousal: 60, valence: 70, boredom: 5, flow: 0.85, cognitive_autonomy: 80, emotional_stability: 80, strategic_maturity: 80, motivational_energy: 80 })
  const flowBehavior = createTestBehavior({ consecutive_successes: 5 })
  const flowResult = computeIntegratedControls(flowProfile, flowBehavior)
  assert(
    flowResult.affectState === 'flow',
    '感情ゲーティング: フロー状態の検出',
    `state=${flowResult.affectState}`
  )

  // 退屈状態からの覚醒
  const boredProfile = createTestProfiles({ anxiety: 15, arousal: 20, valence: -5, boredom: 75, flow: 0.05 })
  const boredBehavior = createTestBehavior({ idle_time_seconds: 60 })
  const boredResult = computeIntegratedControls(boredProfile, boredBehavior)
  assert(
    boredResult.affectState === 'bored',
    '感情ゲーティング: 退屈状態の検出',
    `state=${boredResult.affectState}`
  )
  assert(
    boredResult.controls.motivation.arousal_regulation === 'increase',
    '感情ゲーティング: 退屈時の覚醒度上昇',
    `arousal_regulation=${boredResult.controls.motivation.arousal_regulation}`
  )

  // -------------------------------------------------------
  // Test 4: 設計書の制御値との一致テスト
  // -------------------------------------------------------
  const typeADefaults = getArchetypeDefaults('A')
  assert(typeADefaults.structure.structure_level === 0.15, 'デフォルト値: A の structure_level=0.15', `actual=${typeADefaults.structure.structure_level}`)
  assert(typeADefaults.structure.difficulty_zpd_position === 0.8, 'デフォルト値: A の zpd_position=0.8', `actual=${typeADefaults.structure.difficulty_zpd_position}`)
  assert(typeADefaults.cognitive_strategy.retrieval_mode === 'free_recall', 'デフォルト値: A の retrieval=free_recall', `actual=${typeADefaults.cognitive_strategy.retrieval_mode}`)

  const typeHDefaults = getArchetypeDefaults('H')
  assert(typeHDefaults.structure.structure_level === 0.95, 'デフォルト値: H の structure_level=0.95', `actual=${typeHDefaults.structure.structure_level}`)
  assert(typeHDefaults._teacher_alert === true, 'デフォルト値: H の _teacher_alert=true', `actual=${typeHDefaults._teacher_alert}`)
  assert(typeHDefaults._human_intervention_recommended === true, 'デフォルト値: H の _human_intervention=true', `actual=${typeHDefaults._human_intervention_recommended}`)

  const typeGDefaults = getArchetypeDefaults('G')
  assert(typeGDefaults.structure.structure_level === 0.85, 'デフォルト値: G の structure_level=0.85', `actual=${typeGDefaults.structure.structure_level}`)
  assert(typeGDefaults.scaffold.demonstration_level === 'partial', 'デフォルト値: G の demonstration=partial', `actual=${typeGDefaults.scaffold.demonstration_level}`)
  assert(typeGDefaults.cognitive_strategy.interleaving_enabled === false, 'デフォルト値: G の interleaving=false', `actual=${typeGDefaults.cognitive_strategy.interleaving_enabled}`)

  const typeDDefaults = getArchetypeDefaults('D')
  assert(typeDDefaults.scaffold.frustration_control === true, 'デフォルト値: D の frustration_control=true', `actual=${typeDDefaults.scaffold.frustration_control}`)
  assert(typeDDefaults.scaffold.soft_language === true, 'デフォルト値: D の soft_language=true', `actual=${typeDDefaults.scaffold.soft_language}`)

  // -------------------------------------------------------
  // Test 5: 感情ゲーティングの優先度テスト
  // -------------------------------------------------------
  // 不安の子に「交互配置」が無効化されるか
  const anxiousProfile = createTestProfiles({
    cognitive_autonomy: 75, emotional_stability: 25, strategic_maturity: 80,
    motivational_energy: 30, anxiety: 75, independence: 70,
    arousal: 80, valence: -30, boredom: 5, flow: 0.05,
  })
  const anxiousResult = computeIntegratedControls(anxiousProfile, createTestBehavior())
  assert(
    anxiousResult.controls.scaffold.frustration_control === true,
    '感情優先: 不安時にfrustration_controlがON',
    `frustration_control=${anxiousResult.controls.scaffold.frustration_control}`
  )
  assert(
    anxiousResult.controls.scaffold.soft_language === true,
    '感情優先: 不安時にsoft_languageがON',
    `soft_language=${anxiousResult.controls.scaffold.soft_language}`
  )

  // -------------------------------------------------------
  // Test 6: 統合制御のreasoning出力テスト
  // -------------------------------------------------------
  const normalProfile = createTestProfiles({ cognitive_autonomy: 55, emotional_stability: 60, strategic_maturity: 50, motivational_energy: 55 })
  const normalResult = computeIntegratedControls(normalProfile, createTestBehavior())
  assert(
    normalResult.reasoning.length >= 3,
    'reasoning出力: 少なくとも3つの推論ステップ',
    `reasoning_count=${normalResult.reasoning.length}`
  )

  // -------------------------------------------------------
  // Test 7: F5 SRLエンジン — 位相検出テスト
  // -------------------------------------------------------
  // セッション開始直後 → 予見段階
  const srlProfileObs = createTestProfiles({ cognitive_autonomy: 20 })
  const srlBehaviorStart = createTestBehavior({ session_duration_minutes: 1, current_srl_phase: 'unknown' })
  const phaseStart = detectSRLPhase(srlBehaviorStart, srlProfileObs.F5)
  assert(
    phaseStart.current_phase === 'forethought',
    'F5/SRL位相: セッション開始直後 → 予見段階',
    `phase=${phaseStart.current_phase}, confidence=${phaseStart.confidence}`
  )

  // 連続失敗 → 内省段階（current_srl_phaseをunknownにして行動ベース推定を有効化）
  const srlBehaviorFail = createTestBehavior({ consecutive_errors: 3, session_duration_minutes: 10, current_srl_phase: 'unknown' })
  const phaseFail = detectSRLPhase(srlBehaviorFail, srlProfileObs.F5)
  assert(
    phaseFail.current_phase === 'self_reflection',
    'F5/SRL位相: 連続失敗 → 内省段階',
    `phase=${phaseFail.current_phase}`
  )

  // -------------------------------------------------------
  // Test 8: F5 SRLエンジン — 発達段階評価テスト
  // -------------------------------------------------------
  // 観察段階の子
  const obsProfile = createTestProfiles({ cognitive_autonomy: 15 })
  const obsAssessment = assessDevelopmentalStage(obsProfile.F5)
  assert(
    obsAssessment.current_stage === 'observation',
    'F5/発達: 低自律度 → 観察段階',
    `stage=${obsAssessment.current_stage}, readiness=${obsAssessment.readiness_for_next.toFixed(2)}`
  )
  assert(
    obsAssessment.support.modeling_frequency > 0.5,
    'F5/発達: 観察段階 → 高頻度モデリング',
    `modeling_frequency=${obsAssessment.support.modeling_frequency.toFixed(2)}`
  )

  // 自己調整段階の子
  const srProfile = createTestProfiles({ cognitive_autonomy: 85 })
  const srAssessment = assessDevelopmentalStage(srProfile.F5)
  assert(
    srAssessment.current_stage === 'self_regulation',
    'F5/発達: 高自律度 → 自己調整段階',
    `stage=${srAssessment.current_stage}`
  )
  assert(
    srAssessment.support.full_autonomy === true,
    'F5/発達: 自己調整段階 → 完全自律モード',
    `full_autonomy=${srAssessment.support.full_autonomy}`
  )

  // -------------------------------------------------------
  // Test 9: F5 SRL制御パラメータ — アーキタイプ別テスト
  // -------------------------------------------------------
  // Type A (自律的探究者): SRL足場は最小限
  const srlA = computeF5Controls(
    createTestProfiles({ cognitive_autonomy: 85, emotional_stability: 80, strategic_maturity: 80, motivational_energy: 80 }).F5,
    createTestBehavior({ session_duration_minutes: 10 }),
    'A'
  )
  assert(
    srlA.forethought_scaffold.goal_prompt_type === 'none' || srlA.forethought_scaffold.goal_prompt_type === 'example',
    'F5/制御: Type A → goal_prompt最小限',
    `goal_prompt=${srlA.forethought_scaffold.goal_prompt_type}`
  )
  assert(
    srlA.performance_scaffold.monitoring_interval >= 8,
    'F5/制御: Type A → モニタリング間隔長い',
    `monitoring_interval=${srlA.performance_scaffold.monitoring_interval}`
  )

  // Type G (受動的依存者): Think-Aloud ON, 短いモニタリング間隔
  const srlG = computeF5Controls(
    createTestProfiles({ cognitive_autonomy: 20, emotional_stability: 50, strategic_maturity: 20, motivational_energy: 20 }).F5,
    createTestBehavior({ session_duration_minutes: 10 }),
    'G'
  )
  assert(
    srlG.performance_scaffold.think_aloud_modeling === true,
    'F5/制御: Type G → Think-Aloud ON',
    `think_aloud=${srlG.performance_scaffold.think_aloud_modeling}`
  )
  assert(
    srlG.performance_scaffold.monitoring_interval <= 3,
    'F5/制御: Type G → 短いモニタリング間隔',
    `monitoring_interval=${srlG.performance_scaffold.monitoring_interval}`
  )

  // Type H (学習回避者): Think-Aloud ON, テンプレート
  const srlH = computeF5Controls(
    createTestProfiles({ cognitive_autonomy: 10, emotional_stability: 15, strategic_maturity: 10, motivational_energy: 10 }).F5,
    createTestBehavior({ session_duration_minutes: 10 }),
    'H'
  )
  assert(
    srlH.performance_scaffold.think_aloud_modeling === true,
    'F5/制御: Type H → Think-Aloud ON',
    `think_aloud=${srlH.performance_scaffold.think_aloud_modeling}`
  )

  // -------------------------------------------------------
  // Test 10: F5 × F12 感情によるSRL調整テスト
  // -------------------------------------------------------
  const srlNormal = computeF5Controls(
    createTestProfiles({ cognitive_autonomy: 50 }).F5,
    createTestBehavior({ session_duration_minutes: 10 }),
    'B'
  )
  // 不安時: 自己効力感メッセージが付与される
  const anxiousAffect = createTestProfiles({ anxiety: 75, arousal: 80, valence: -30 }).F12
  const srlAnxious = adjustSRLForAffect(srlNormal, anxiousAffect)
  assert(
    srlAnxious.forethought_scaffold.efficacy_message !== null,
    'F5×F12: 不安時 → 自己効力感メッセージ付与',
    `message=${srlAnxious.forethought_scaffold.efficacy_message}`
  )

  // フロー時: SRL足場を最小化
  const flowAffect = createTestProfiles({ anxiety: 5, arousal: 60, valence: 70, flow: 0.85 }).F12
  const srlFlow = adjustSRLForAffect(srlNormal, flowAffect)
  assert(
    srlFlow.performance_scaffold.think_aloud_modeling === false,
    'F5×F12: フロー時 → Think-Aloud OFF',
    `think_aloud=${srlFlow.performance_scaffold.think_aloud_modeling}`
  )
  assert(
    srlFlow.reflection_scaffold.reflection_prompt_type === 'none',
    'F5×F12: フロー時 → 振り返りプロンプトOFF',
    `reflection=${srlFlow.reflection_scaffold.reflection_prompt_type}`
  )

  // -------------------------------------------------------
  // Test 11: F8 動機エンジン — 3欲求充足テスト
  // -------------------------------------------------------
  // 健全な動機状態
  const healthyMotivation = createTestProfiles({
    emotional_stability: 80, motivational_energy: 75,
  })
  const needsHealthy = assessNeedSatisfaction(healthyMotivation.F8)
  assert(
    needsHealthy.overall >= 50,
    'F8/欲求: 健全状態 → 全体充足度≥50',
    `overall=${needsHealthy.overall}, weakest=${needsHealthy.weakest_need}`
  )
  assert(
    needsHealthy.risks.length === 0,
    'F8/欲求: 健全状態 → リスクなし',
    `risks=${needsHealthy.risks.map(r => r.type).join(', ') || 'none'}`
  )

  // 学習性無力感リスク
  const helplessProfile = {
    autonomy_satisfaction: 15,
    competence_satisfaction: 10,
    relatedness_satisfaction: 20,
    motivation_quality: 'external' as const,
    motivation_continuum_score: 10,
    isolated_autonomy: false,
    fragile_competence: false,
    surface_autonomy: false,
  }
  const needsHelpless = assessNeedSatisfaction(helplessProfile)
  assert(
    needsHelpless.risks.some(r => r.type === 'learned_helplessness'),
    'F8/リスク: 低欲求 → 学習性無力感検出',
    `risks=${needsHelpless.risks.map(r => r.type).join(', ')}`
  )
  assert(
    needsHelpless.risks.some(r => r.type === 'amotivation'),
    'F8/リスク: 極低動機 → 無動機検出',
    `risks=${needsHelpless.risks.map(r => r.type).join(', ')}`
  )

  // 孤立した自律性リスク
  const isolatedProfile = {
    autonomy_satisfaction: 85,
    competence_satisfaction: 60,
    relatedness_satisfaction: 20,
    motivation_quality: 'identified' as const,
    motivation_continuum_score: 60,
    isolated_autonomy: true,
    fragile_competence: false,
    surface_autonomy: false,
  }
  const needsIsolated = assessNeedSatisfaction(isolatedProfile)
  assert(
    needsIsolated.risks.some(r => r.type === 'isolated_autonomy'),
    'F8/リスク: 自律性高+関係性低 → 孤立した自律性検出',
    `risks=${needsIsolated.risks.map(r => r.type).join(', ')}`
  )

  // 脆い有能感リスク
  const fragileProfile = {
    autonomy_satisfaction: 50,
    competence_satisfaction: 70,
    relatedness_satisfaction: 50,
    motivation_quality: 'external' as const,
    motivation_continuum_score: 25,
    isolated_autonomy: false,
    fragile_competence: true,
    surface_autonomy: false,
  }
  const needsFragile = assessNeedSatisfaction(fragileProfile)
  assert(
    needsFragile.risks.some(r => r.type === 'fragile_competence'),
    'F8/リスク: 有能感高+外発的動機 → 脆い有能感検出',
    `risks=${needsFragile.risks.map(r => r.type).join(', ')}`
  )

  // -------------------------------------------------------
  // Test 12: F8 動機質連続体テスト
  // -------------------------------------------------------
  const intrinsicProfile = createTestProfiles({ motivational_energy: 85, emotional_stability: 80 })
  const qualityIntrinsic = assessMotivationQuality(intrinsicProfile.F8, 'A')
  assert(
    qualityIntrinsic.current_quality === 'intrinsic',
    'F8/動機質: 高動機エネルギー → 内発的動機',
    `quality=${qualityIntrinsic.current_quality}`
  )
  assert(
    qualityIntrinsic.direction === 'stable',
    'F8/動機質: 欲求充足+内発的 → 安定',
    `direction=${qualityIntrinsic.direction}`
  )

  // 外発的動機の子
  const externalProfile = createTestProfiles({ motivational_energy: 25, emotional_stability: 30 })
  const qualityExternal = assessMotivationQuality(externalProfile.F8, 'G')
  assert(
    qualityExternal.current_quality === 'external',
    'F8/動機質: 低動機エネルギー → 外的調整',
    `quality=${qualityExternal.current_quality}`
  )

  // -------------------------------------------------------
  // Test 13: F8 因果チェーンテスト
  // -------------------------------------------------------
  // 高欲求充足状態の因果テスト用プロファイル
  const highNeedProfile = createTestProfiles({
    emotional_stability: 85, motivational_energy: 85,
  })
  // F8の欲求を明示的に高く設定
  highNeedProfile.F8 = {
    ...highNeedProfile.F8,
    autonomy_satisfaction: 80,
    competence_satisfaction: 85,
    relatedness_satisfaction: 75,
    motivation_quality: 'intrinsic',
    motivation_continuum_score: 85,
  }
  const f8Healthy = computeF8Controls(
    highNeedProfile.F8,
    createTestBehavior(),
    'A',
  )
  assert(
    f8Healthy.causal_effects.f5_efficacy_modulation > 0,
    'F8/因果: 健全な有能感 → F5自己効力感に正の影響',
    `f5_mod=${f8Healthy.causal_effects.f5_efficacy_modulation.toFixed(3)}`
  )
  assert(
    f8Healthy.causal_effects.f4_anxiety_modulation < 0,
    'F8/因果: 欲求充足 → F4不安に負の影響（不安減少）',
    `f4_mod=${f8Healthy.causal_effects.f4_anxiety_modulation.toFixed(3)}`
  )

  // 低欲求状態の因果
  const f8Low = computeF8Controls(
    createTestProfiles({ motivational_energy: 20, emotional_stability: 20 }).F8,
    createTestBehavior(),
    'H',
  )
  assert(
    f8Low.causal_effects.f5_efficacy_modulation < 0,
    'F8/因果: 低有能感 → F5自己効力感に負の影響',
    `f5_mod=${f8Low.causal_effects.f5_efficacy_modulation.toFixed(3)}`
  )

  // -------------------------------------------------------
  // Test 14: F8 × F12 感情との相互作用テスト
  // -------------------------------------------------------
  const f8Normal = computeF8Controls(
    createTestProfiles({ motivational_energy: 50, emotional_stability: 50 }).F8,
    createTestBehavior(),
    'B',
  )
  // 不安時: micro_success_feedbackが強制ON
  const f8Anxious = adjustF8ForAffect(f8Normal, anxiousAffect)
  assert(
    f8Anxious.motivation_controls.micro_success_feedback === true,
    'F8×F12: 不安時 → micro_success_feedback ON',
    `micro_success=${f8Anxious.motivation_controls.micro_success_feedback}`
  )

  // フロー時: micro_success_feedbackがOFF
  const f8Flow = adjustF8ForAffect(f8Normal, flowAffect)
  assert(
    f8Flow.motivation_controls.micro_success_feedback === false,
    'F8×F12: フロー時 → micro_success_feedback OFF',
    `micro_success=${f8Flow.motivation_controls.micro_success_feedback}`
  )

  // -------------------------------------------------------
  // Test 15: 統合テスト — F5+F8が統合制御に正しく反映されるか
  // -------------------------------------------------------
  // Type G: SRL足場が手厚く、動機づけ支援が効いている
  const typeGProfile = createTestProfiles({
    cognitive_autonomy: 25, emotional_stability: 55,
    strategic_maturity: 25, motivational_energy: 25,
    anxiety: 40, independence: 20,
  })
  const typeGResult = computeIntegratedControls(typeGProfile, createTestBehavior({ session_duration_minutes: 10 }))
  assert(
    typeGResult.controls.srl.think_aloud_modeling === true,
    '統合F5: Type G → think_aloud_modeling ON',
    `think_aloud=${typeGResult.controls.srl.think_aloud_modeling}`
  )
  assert(
    typeGResult.controls.srl.goal_prompt_type === 'guided' || typeGResult.controls.srl.goal_prompt_type === 'template',
    '統合F5: Type G → goal_prompt はguided/template',
    `goal_prompt=${typeGResult.controls.srl.goal_prompt_type}`
  )
  assert(
    typeGResult.controls.motivation.micro_success_feedback === true,
    '統合F8: Type G → micro_success_feedback ON',
    `micro_success=${typeGResult.controls.motivation.micro_success_feedback}`
  )
  assert(
    typeGResult.controls.motivation.language_style === 'inviting',
    '統合F8: Type G → inviting言語スタイル',
    `language=${typeGResult.controls.motivation.language_style}`
  )

  // Type A: SRL足場最小、動機づけ介入最小
  const typeAProfile = createTestProfiles({
    cognitive_autonomy: 85, emotional_stability: 80,
    strategic_maturity: 80, motivational_energy: 80,
    anxiety: 10, independence: 85,
  })
  const typeAResult = computeIntegratedControls(typeAProfile, createTestBehavior({ session_duration_minutes: 10 }))
  assert(
    typeAResult.controls.srl.goal_prompt_type === 'none' || typeAResult.controls.srl.goal_prompt_type === 'example',
    '統合F5: Type A → goal_prompt 最小限',
    `goal_prompt=${typeAResult.controls.srl.goal_prompt_type}`
  )
  assert(
    typeAResult.controls.motivation.choice_with_rationale === true,
    '統合F8: Type A → choice_with_rationale ON',
    `choice=${typeAResult.controls.motivation.choice_with_rationale}`
  )

  // -------------------------------------------------------
  // Test 16: 統合テスト — reasoningにF5/F8が含まれる
  // -------------------------------------------------------
  const reasoningHasF5 = normalResult.reasoning.some(r => r.includes('[F5/SRL]'))
  assert(
    reasoningHasF5,
    'reasoning: F5/SRL情報が含まれる',
    `reasoning=${normalResult.reasoning.filter(r => r.includes('F5')).join('; ')}`
  )
  const reasoningHasF8 = normalResult.reasoning.some(r => r.includes('[F8/動機]'))
  assert(
    reasoningHasF8,
    'reasoning: F8/動機情報が含まれる',
    `reasoning=${normalResult.reasoning.filter(r => r.includes('F8')).join('; ')}`
  )

  // -------------------------------------------------------
  // Test 17: 統合テスト — 学習性無力感リスクで教師アラート
  // -------------------------------------------------------
  const helplessLearner = createTestProfiles({
    cognitive_autonomy: 10, emotional_stability: 15,
    strategic_maturity: 10, motivational_energy: 10,
    anxiety: 85, independence: 5,
    arousal: 15, valence: -60, boredom: 10, flow: 0,
  })
  // F8の動機を直接低く設定
  helplessLearner.F8 = {
    ...helplessLearner.F8,
    autonomy_satisfaction: 10,
    competence_satisfaction: 8,
    relatedness_satisfaction: 15,
    motivation_quality: 'external',
    motivation_continuum_score: 5,
  }
  const helplessResult = computeIntegratedControls(helplessLearner, createTestBehavior())
  assert(
    helplessResult.controls._teacher_alert === true,
    '統合F8: 学習性無力感 → 教師アラートON',
    `teacher_alert=${helplessResult.controls._teacher_alert}`
  )
  assert(
    helplessResult.controls._human_intervention_recommended === true,
    '統合F8: 学習性無力感 → 人的介入推奨',
    `human_intervention=${helplessResult.controls._human_intervention_recommended}`
  )

  // -------------------------------------------------------
  // Test 18: F6 条件チェッカー — 6方略の適用可能性テスト
  // -------------------------------------------------------
  // 高習得度 → 全方略が適用可能
  const highMasteryProfile: Parameters<typeof checkAllStrategies>[0] = {
    retrieval_practice_readiness: 80,
    spacing_optimal_gap: 3,
    interleaving_readiness: true,
    elaboration_prior_knowledge: 75,
    mastery_level_for_current_unit: 85,
  }
  const highStrategies = checkAllStrategies(highMasteryProfile)
  assert(
    highStrategies.retrieval_practice.applicable === true,
    'F6/条件: 高習得度 → 検索練習=適用可',
    `applicable=${highStrategies.retrieval_practice.applicable}, mastery=85%`
  )
  assert(
    highStrategies.interleaving.applicable === true,
    'F6/条件: 高習得度+readiness → 交互配置=適用可',
    `applicable=${highStrategies.interleaving.applicable}`
  )
  assert(
    highStrategies.elaboration.applicable === true,
    'F6/条件: 高前提知識 → 精緻化=適用可',
    `applicable=${highStrategies.elaboration.applicable}`
  )

  // 低習得度 → 交互配置ブロック（d=-0.30リスク）
  const lowMasteryProfile: Parameters<typeof checkAllStrategies>[0] = {
    retrieval_practice_readiness: 20,
    spacing_optimal_gap: 3,
    interleaving_readiness: false,
    elaboration_prior_knowledge: 25,
    mastery_level_for_current_unit: 20,
  }
  const lowStrategies = checkAllStrategies(lowMasteryProfile)
  assert(
    lowStrategies.interleaving.applicable === false,
    'F6/条件: 低習得度 → 交互配置=ブロック',
    `applicable=${lowStrategies.interleaving.applicable}, harm_risk=${lowStrategies.interleaving.harm_risk}`
  )
  assert(
    lowStrategies.interleaving.harm_risk >= 0.7,
    'F6/条件: 交互配置ブロック時 → 高害リスク',
    `harm_risk=${lowStrategies.interleaving.harm_risk}`
  )
  assert(
    lowStrategies.retrieval_practice.applicable === false,
    'F6/条件: 低習得度 → 検索練習=ブロック',
    `applicable=${lowStrategies.retrieval_practice.applicable}`
  )
  assert(
    lowStrategies.elaboration.applicable === false,
    'F6/条件: 低前提知識 → 精緻化=ブロック',
    `applicable=${lowStrategies.elaboration.applicable}`
  )
  assert(
    lowStrategies.spacing.applicable === true,
    'F6/条件: 間隔効果は常に適用可能',
    `applicable=${lowStrategies.spacing.applicable}`
  )

  // -------------------------------------------------------
  // Test 19: F6 検索練習段階制御テスト
  // -------------------------------------------------------
  // 高習得+高正答率 → 自由再生
  const retrievalHigh = determineRetrievalLevel(
    highMasteryProfile, 'A',
    createTestBehavior({ recent_accuracy: 0.85 }),
  )
  assert(
    retrievalHigh.level === 'free_recall',
    'F6/検索: 高習得+高正答率 → 自由再生',
    `level=${retrievalHigh.level}`
  )

  // 中習得+中正答率 → 手がかり再生
  const midProfile: Parameters<typeof determineRetrievalLevel>[0] = {
    ...highMasteryProfile,
    mastery_level_for_current_unit: 55,
  }
  const retrievalMid = determineRetrievalLevel(
    midProfile, 'B',
    createTestBehavior({ recent_accuracy: 0.6 }),
  )
  assert(
    retrievalMid.level === 'cued_recall',
    'F6/検索: 中習得+中正答率 → 手がかり再生',
    `level=${retrievalMid.level}`
  )

  // 低習得 → 再認
  const retrievalLow = determineRetrievalLevel(
    lowMasteryProfile, 'H',
    createTestBehavior({ recent_accuracy: 0.3 }),
  )
  assert(
    retrievalLow.level === 'recognition',
    'F6/検索: 低習得+低正答率 → 再認',
    `level=${retrievalLow.level}`
  )

  // -------------------------------------------------------
  // Test 20: F6 間隔効果の動的算出テスト
  // -------------------------------------------------------
  const spacingResult = computeOptimalSpacing(30, 0, 50)
  assert(
    spacingResult.interval_days >= 1 && spacingResult.interval_days <= 30,
    'F6/間隔: 間隔が1-30日の範囲内',
    `interval=${spacingResult.interval_days}日, schedule=${spacingResult.schedule}`
  )

  // 連続正解 → 間隔が広がる
  const spacingExpand = computeOptimalSpacing(30, 3, 50)
  assert(
    spacingExpand.interval_days > spacingResult.interval_days,
    'F6/間隔: 連続正解 → 間隔拡大',
    `base=${spacingResult.interval_days}日, expanded=${spacingExpand.interval_days}日`
  )

  // 高習得度 → 間隔が広がる
  const spacingHighMastery = computeOptimalSpacing(30, 0, 80)
  assert(
    spacingHighMastery.interval_days >= spacingResult.interval_days,
    'F6/間隔: 高習得度 → 間隔拡大',
    `base=${spacingResult.interval_days}日, high_mastery=${spacingHighMastery.interval_days}日`
  )

  // -------------------------------------------------------
  // Test 21: F6 交互配置比率テスト
  // -------------------------------------------------------
  const interleavingA = computeInterleavingRatio(90, 'A')
  assert(
    interleavingA > 0,
    'F6/交互: Type A + 高習得度 → 比率>0',
    `ratio=${interleavingA.toFixed(2)}`
  )

  const interleavingH = computeInterleavingRatio(90, 'H')
  assert(
    interleavingH === 0,
    'F6/交互: Type H → 比率=0（使わない）',
    `ratio=${interleavingH}`
  )

  const interleavingG = computeInterleavingRatio(90, 'G')
  assert(
    interleavingG === 0,
    'F6/交互: Type G → 比率=0（使わない）',
    `ratio=${interleavingG}`
  )

  // -------------------------------------------------------
  // Test 22: F6 精緻化プロンプト決定テスト
  // -------------------------------------------------------
  const elabHigh = determineElaborationType(highMasteryProfile, 'A')
  assert(
    elabHigh.type === 'connect',
    'F6/精緻化: Type A + 高前提知識 → connect型',
    `type=${elabHigh.type}, depth=${elabHigh.depth}`
  )
  assert(
    elabHigh.depth === 'deep',
    'F6/精緻化: Type A → 深い精緻化',
    `depth=${elabHigh.depth}`
  )

  const elabLow = determineElaborationType(lowMasteryProfile, 'G')
  assert(
    elabLow.type === 'none',
    'F6/精緻化: 低前提知識 → none',
    `type=${elabLow.type}`
  )

  // -------------------------------------------------------
  // Test 23: F6 全体制御算出テスト（感情安全補正含む）
  // -------------------------------------------------------
  // 不安な子: 検索練習が1段下がり、交互配置が無効化
  const anxiousF6Profile: Parameters<typeof computeF6Controls>[0] = {
    retrieval_practice_readiness: 70,
    spacing_optimal_gap: 3,
    interleaving_readiness: true,
    elaboration_prior_knowledge: 60,
    mastery_level_for_current_unit: 75,
  }
  const anxiousF12 = createTestProfiles({ anxiety: 70, arousal: 75, valence: -20 }).F12
  const f6Anxious = computeF6Controls(
    anxiousF6Profile,
    createTestBehavior({ recent_accuracy: 0.8 }),
    'D', undefined, anxiousF12,
  )
  assert(
    f6Anxious.retrieval.level !== 'free_recall',
    'F6/感情補正: 不安時 → 自由再生が格下げ',
    `level=${f6Anxious.retrieval.level}`
  )
  assert(
    f6Anxious.interleaving.enabled === false,
    'F6/感情補正: 不安時 → 交互配置を無効化',
    `enabled=${f6Anxious.interleaving.enabled}`
  )

  // -------------------------------------------------------
  // Test 24: F1 入口チャネル決定テスト
  // -------------------------------------------------------
  // 視覚優位
  const visualProfile = {
    visual_processing_efficiency: 85,
    auditory_processing_efficiency: 50,
    reading_processing_efficiency: 60,
    kinesthetic_processing_efficiency: 40,
    multimodal_index: 55,
  }
  const entryVisual = determineEntryChannel(visualProfile)
  assert(
    entryVisual.channel === 'visual',
    'F1/入口: 視覚優位 → visual',
    `channel=${entryVisual.channel}, confidence=${entryVisual.confidence.toFixed(2)}`
  )

  // 聴覚優位
  const auditoryProfile = {
    visual_processing_efficiency: 40,
    auditory_processing_efficiency: 80,
    reading_processing_efficiency: 55,
    kinesthetic_processing_efficiency: 45,
    multimodal_index: 50,
  }
  const entryAuditory = determineEntryChannel(auditoryProfile)
  assert(
    entryAuditory.channel === 'auditory',
    'F1/入口: 聴覚優位 → auditory',
    `channel=${entryAuditory.channel}`
  )

  // -------------------------------------------------------
  // Test 25: F1 多重符号化チャネル選定テスト
  // -------------------------------------------------------
  // 視覚入口 → 言語系を追加（二重符号化理論）
  const encodingFromVisual = selectEncodingChannels(visualProfile, 'visual')
  assert(
    encodingFromVisual.channels.some(c => c === 'reading' || c === 'auditory'),
    'F1/符号化: 視覚入口 → 言語系チャネル追加',
    `channels=[${encodingFromVisual.channels.join(', ')}]`
  )

  // 聴覚入口 → 視覚系を追加
  const encodingFromAuditory = selectEncodingChannels(auditoryProfile, 'auditory')
  assert(
    encodingFromAuditory.channels.some(c => c === 'visual' || c === 'kinesthetic'),
    'F1/符号化: 聴覚入口 → 視覚系チャネル追加',
    `channels=[${encodingFromAuditory.channels.join(', ')}]`
  )

  // -------------------------------------------------------
  // Test 26: F1 マルチモーダル容量評価テスト
  // -------------------------------------------------------
  const highMultimodal = assessMultimodalCapacity({
    ...visualProfile, multimodal_index: 80,
  })
  assert(
    highMultimodal.capacity === 'high' && highMultimodal.max_channels === 3,
    'F1/マルチモーダル: 高指数 → 3チャネル',
    `capacity=${highMultimodal.capacity}, max=${highMultimodal.max_channels}`
  )

  const lowMultimodal = assessMultimodalCapacity({
    ...visualProfile, multimodal_index: 25,
  })
  assert(
    lowMultimodal.capacity === 'low' && lowMultimodal.max_channels === 1,
    'F1/マルチモーダル: 低指数 → 1チャネル',
    `capacity=${lowMultimodal.capacity}, max=${lowMultimodal.max_channels}`
  )

  // -------------------------------------------------------
  // Test 27: F1 全体制御算出テスト（アーキタイプ補正含む）
  // -------------------------------------------------------
  const f1A = computeF1Controls(visualProfile, 'A')
  assert(
    f1A.entry.channel === 'visual',
    'F1/制御: Type A → 視覚入口',
    `entry=${f1A.entry.channel}`
  )
  assert(
    f1A.encoding.channels.length >= 1,
    'F1/制御: Type A → 符号化チャネル≥1',
    `channels=[${f1A.encoding.channels.join(', ')}]`
  )

  // Type H: 認知負荷最小化 → 符号化チャネル制限
  const f1H = computeF1Controls(visualProfile, 'H')
  assert(
    f1H.encoding.channels.length <= 1,
    'F1/制御: Type H → 符号化チャネル≤1（認知負荷最小化）',
    `channels=[${f1H.encoding.channels.join(', ')}]`
  )

  // -------------------------------------------------------
  // Test 28: 統合テスト — F6がreasoningに含まれる
  // -------------------------------------------------------
  const normalWithF6 = computeIntegratedControls(normalProfile, createTestBehavior())
  const reasoningHasF6 = normalWithF6.reasoning.some(r => r.includes('[F6/方略]'))
  assert(
    reasoningHasF6,
    'reasoning: F6/方略情報が含まれる',
    `reasoning=${normalWithF6.reasoning.filter(r => r.includes('F6')).join('; ')}`
  )

  // -------------------------------------------------------
  // Test 29: 統合テスト — F1がreasoningに含まれる
  // -------------------------------------------------------
  const reasoningHasF1 = normalWithF6.reasoning.some(r => r.includes('[F1/感覚]'))
  assert(
    reasoningHasF1,
    'reasoning: F1/感覚情報が含まれる',
    `reasoning=${normalWithF6.reasoning.filter(r => r.includes('F1')).join('; ')}`
  )

  // -------------------------------------------------------
  // Test 30: 統合テスト — F6制御が統合制御に反映
  // -------------------------------------------------------
  // Type A + 高習得度 → 自由再生 + 交互配置有効
  const typeAHighMastery = createTestProfiles({
    cognitive_autonomy: 85, emotional_stability: 80,
    strategic_maturity: 80, motivational_energy: 80,
    anxiety: 10, independence: 85, prior_knowledge: 80,
  })
  const typeAF6Result = computeIntegratedControls(typeAHighMastery, createTestBehavior({ recent_accuracy: 0.85, consecutive_successes: 3 }))
  assert(
    typeAF6Result.controls.cognitive_strategy.retrieval_mode === 'free_recall',
    '統合F6: Type A + 高習得度 → 自由再生',
    `retrieval_mode=${typeAF6Result.controls.cognitive_strategy.retrieval_mode}`
  )
  assert(
    typeAF6Result.controls.cognitive_strategy.interleaving_enabled === true,
    '統合F6: Type A + 高習得度 → 交互配置ON',
    `interleaving=${typeAF6Result.controls.cognitive_strategy.interleaving_enabled}`
  )

  // Type G + 低習得度 → 再認 + 交互配置OFF
  const typeGLowMastery = createTestProfiles({
    cognitive_autonomy: 25, emotional_stability: 55,
    strategic_maturity: 25, motivational_energy: 25,
    anxiety: 40, independence: 20, prior_knowledge: 25,
  })
  const typeGF6Result = computeIntegratedControls(typeGLowMastery, createTestBehavior({ recent_accuracy: 0.3 }))
  assert(
    typeGF6Result.controls.cognitive_strategy.retrieval_mode === 'recognition',
    '統合F6: Type G + 低習得度 → 再認',
    `retrieval_mode=${typeGF6Result.controls.cognitive_strategy.retrieval_mode}`
  )
  assert(
    typeGF6Result.controls.cognitive_strategy.interleaving_enabled === false,
    '統合F6: Type G + 低習得度 → 交互配置OFF',
    `interleaving=${typeGF6Result.controls.cognitive_strategy.interleaving_enabled}`
  )

  // -------------------------------------------------------
  // Test 31: 統合テスト — F1制御が統合制御に反映
  // -------------------------------------------------------
  // 視覚優位の子 → entry_channel = visual
  assert(
    typeAF6Result.controls.presentation.entry_channel === 'visual',
    '統合F1: 視覚優位 → entry_channel=visual',
    `entry_channel=${typeAF6Result.controls.presentation.entry_channel}`
  )
  assert(
    typeAF6Result.controls.presentation.encoding_channels.length >= 1,
    '統合F1: 多重符号化チャネル≥1',
    `encoding=[${typeAF6Result.controls.presentation.encoding_channels.join(', ')}]`
  )

  // -------------------------------------------------------
  // Test 32: 統合テスト — 不安な子でF6が安全に制限される
  // -------------------------------------------------------
  const anxiousLearner = createTestProfiles({
    cognitive_autonomy: 75, emotional_stability: 25,
    strategic_maturity: 80, motivational_energy: 30,
    anxiety: 75, independence: 70, prior_knowledge: 80,
    arousal: 80, valence: -30, boredom: 5, flow: 0.05,
  })
  const anxiousF6Result = computeIntegratedControls(anxiousLearner, createTestBehavior({ recent_accuracy: 0.8 }))
  assert(
    anxiousF6Result.controls.cognitive_strategy.interleaving_enabled === false,
    '統合F6: 不安な子 → 交互配置がブロック',
    `interleaving=${anxiousF6Result.controls.cognitive_strategy.interleaving_enabled}`
  )

  // -------------------------------------------------------
  // Test 33: F2 多元的入口 — 主入口とフォールバック
  // -------------------------------------------------------
  const f2ProfileLogical = {
    linguistic: 55, logical_mathematical: 85, spatial: 50,
    bodily_kinesthetic: 40, musical: 30, interpersonal: 45,
    intrapersonal: 50, naturalist: 35, growth_mindset: 60,
  }
  const primaryEntry = determinePrimaryEntry(f2ProfileLogical)
  assert(
    primaryEntry.entry === 'logical_mathematical',
    'F2/入口: 論理数学優位 → logical_mathematical',
    `entry=${primaryEntry.entry}, score=${primaryEntry.score}`
  )

  const fallbackEntry = determineFallbackEntry(f2ProfileLogical, primaryEntry.entry)
  assert(
    fallbackEntry.entry !== 'logical_mathematical',
    'F2/フォールバック: 主入口と異なる',
    `fallback=${fallbackEntry.entry}`
  )

  // 成長マインドセット
  assert(
    determineMindsetMessage(f2ProfileLogical, 'B') === 'process_praise',
    'F2/マインドセット: 中程度(60) → process_praise',
    `message=${determineMindsetMessage(f2ProfileLogical, 'B')}`
  )
  assert(
    determineMindsetMessage({ ...f2ProfileLogical, growth_mindset: 20 }, 'G') === 'effort_praise',
    'F2/マインドセット: 低(20) → effort_praise',
    `message=${determineMindsetMessage({ ...f2ProfileLogical, growth_mindset: 20 }, 'G')}`
  )
  assert(
    determineMindsetMessage({ ...f2ProfileLogical, growth_mindset: 80 }, 'A') === 'strategy_praise',
    'F2/マインドセット: 高(80) → strategy_praise',
    `message=${determineMindsetMessage({ ...f2ProfileLogical, growth_mindset: 80 }, 'A')}`
  )

  // F2全体制御
  const f2Controls = computeF2Controls(f2ProfileLogical, 'B')
  assert(
    f2Controls.primary_entry === 'logical_mathematical',
    'F2/制御: 主入口が正しい',
    `primary=${f2Controls.primary_entry}`
  )

  // -------------------------------------------------------
  // Test 34: F3 経験変容学習 — Kolbサイクル
  // -------------------------------------------------------
  const f3ProfileAC = {
    ce_preference: 40, ro_preference: 50, ac_preference: 80, ae_preference: 30,
    cycle_completion_rate: 0.8, dominant_style: 'assimilating' as const,
  }
  const entryPhase = determineEntryPhase(f3ProfileAC, 'B')
  assert(
    entryPhase.phase === 'AC',
    'F3/入口: AC優位 → AC入口',
    `phase=${entryPhase.phase}`
  )

  // サイクル順序
  const sequence = buildCycleSequence('AC')
  assert(
    sequence[0] === 'AC' && sequence[1] === 'AE' && sequence[2] === 'CE' && sequence[3] === 'RO',
    'F3/サイクル: AC入口 → AC→AE→CE→RO',
    `sequence=[${sequence.join('→')}]`
  )

  // CE入口のサイクル
  const sequenceCE = buildCycleSequence('CE')
  assert(
    sequenceCE[0] === 'CE' && sequenceCE.length === 4,
    'F3/サイクル: CE入口 → CE→RO→AC→AE',
    `sequence=[${sequenceCE.join('→')}]`
  )

  // Type G/H はAC入口が推奨
  const f3ProfileCE = {
    ce_preference: 70, ro_preference: 40, ac_preference: 50, ae_preference: 30,
    cycle_completion_rate: 0.3, dominant_style: 'accommodating' as const,
  }
  const entryG = determineEntryPhase(f3ProfileCE, 'G')
  assert(
    entryG.phase === 'AC',
    'F3/入口: Type G → AC推奨（構造化入口）',
    `phase=${entryG.phase}`
  )

  // サイクル完走率が低い → 完走強制
  const f3LowCompletion = computeF3Controls(f3ProfileCE, 'G')
  assert(
    f3LowCompletion.force_full_cycle === true,
    'F3/完走: 低完走率(0.3) → 完走強制',
    `force=${f3LowCompletion.force_full_cycle}`
  )

  // -------------------------------------------------------
  // Test 35: F9 メタ認知 — レベル評価と制御
  // -------------------------------------------------------
  const f9High = { metacognitive_knowledge: 80, metacognitive_regulation: 75, critical_thinking: 70, creative_thinking: 60 }
  assert(
    assessMetacognitiveLevel(f9High) === 'high',
    'F9/レベル: 高メタ認知 → high',
    `level=${assessMetacognitiveLevel(f9High)}`
  )

  const f9Low = { metacognitive_knowledge: 20, metacognitive_regulation: 25, critical_thinking: 30, creative_thinking: 20 }
  assert(
    assessMetacognitiveLevel(f9Low) === 'minimal',
    'F9/レベル: 低メタ認知 → minimal',
    `level=${assessMetacognitiveLevel(f9Low)}`
  )

  // 問題解決足場
  assert(
    determineProblemSolvingScaffold(f9High, 'A') === 'open',
    'F9/PS足場: Type A + high → open',
    `scaffold=${determineProblemSolvingScaffold(f9High, 'A')}`
  )
  assert(
    determineProblemSolvingScaffold(f9Low, 'H') === 'structured',
    'F9/PS足場: Type H + minimal → structured',
    `scaffold=${determineProblemSolvingScaffold(f9Low, 'H')}`
  )

  // F9全体制御
  const f9ControlsA = computeF9Controls(f9High, 'A')
  assert(
    f9ControlsA.metacognitive_prompts === false,
    'F9/制御: Type A + high → プロンプトOFF',
    `prompts=${f9ControlsA.metacognitive_prompts}`
  )

  const f9ControlsG = computeF9Controls(f9Low, 'G')
  assert(
    f9ControlsG.metacognitive_prompts === true,
    'F9/制御: Type G + minimal → プロンプトON',
    `prompts=${f9ControlsG.metacognitive_prompts}`
  )

  // -------------------------------------------------------
  // Test 36: F10 領域固有認知 — 段階と誤概念
  // -------------------------------------------------------
  const f10Acclimation = {
    domain_knowledge_stage: 'acclimation' as const,
    misconceptions: ['分数は小数より小さい'],
    knowledge_structure_depth: 20,
  }
  const f10AControls = computeF10Controls(f10Acclimation, 'B')
  assert(
    f10AControls.misconception_handling === 'bridging',
    'F10/誤概念: acclimation段階 → bridging',
    `handling=${f10AControls.misconception_handling}`
  )
  assert(
    f10AControls.knowledge_structure_visualization === false,
    'F10/可視化: acclimation → OFF',
    `viz=${f10AControls.knowledge_structure_visualization}`
  )

  const f10Competence = {
    domain_knowledge_stage: 'competence' as const,
    misconceptions: ['掛け算は足し算より大きくなる'],
    knowledge_structure_depth: 60,
  }
  const f10CControls = computeF10Controls(f10Competence, 'A')
  assert(
    f10CControls.misconception_handling === 'explicit_refutation',
    'F10/誤概念: competence + Type A → explicit_refutation',
    `handling=${f10CControls.misconception_handling}`
  )
  assert(
    f10CControls.expert_novice_comparison === true,
    'F10/専門家比較: competence段階 → ON',
    `comparison=${f10CControls.expert_novice_comparison}`
  )

  const f10Proficiency = {
    domain_knowledge_stage: 'proficiency' as const,
    misconceptions: [],
    knowledge_structure_depth: 85,
  }
  assert(
    computeF10Controls(f10Proficiency, 'A').transfer_prompt === true,
    'F10/転移: proficiency段階 → ON',
    `transfer=${computeF10Controls(f10Proficiency, 'A').transfer_prompt}`
  )

  // -------------------------------------------------------
  // Test 37: F11 真正文脈 — 真正性レベルと制御
  // -------------------------------------------------------
  const f11Low = { personal_relevance: 20, real_world_connection_awareness: 25, community_participation: 15 }
  assert(
    assessAuthenticityLevel(f11Low) === 'low',
    'F11/レベル: 低真正性 → low',
    `level=${assessAuthenticityLevel(f11Low)}`
  )

  const f11High = { personal_relevance: 75, real_world_connection_awareness: 70, community_participation: 65 }
  assert(
    assessAuthenticityLevel(f11High) === 'high',
    'F11/レベル: 高真正性 → high',
    `level=${assessAuthenticityLevel(f11High)}`
  )

  // F11全体制御
  const f11ControlsLow = computeF11Controls(f11Low, 'F')
  assert(
    f11ControlsLow.authentic_task_framing === true,
    'F11/制御: 低真正性 → authentic_task ON',
    `framing=${f11ControlsLow.authentic_task_framing}`
  )

  const f11ControlsH = computeF11Controls(f11Low, 'H')
  assert(
    f11ControlsH.authentic_task_framing === false,
    'F11/制御: Type H → authentic_task OFF（認知負荷）',
    `framing=${f11ControlsH.authentic_task_framing}`
  )

  // -------------------------------------------------------
  // Test 38: 統合テスト — F2/F3/F9/F10/F11がreasoningに含まれる
  // -------------------------------------------------------
  const fullResult = computeIntegratedControls(normalProfile, createTestBehavior())
  assert(
    fullResult.reasoning.some(r => r.includes('[F2/入口]')),
    'reasoning: F2/入口情報が含まれる',
    `found=${fullResult.reasoning.some(r => r.includes('[F2/入口]'))}`
  )
  assert(
    fullResult.reasoning.some(r => r.includes('[F3/Kolb]')),
    'reasoning: F3/Kolb情報が含まれる',
    `found=${fullResult.reasoning.some(r => r.includes('[F3/Kolb]'))}`
  )
  assert(
    fullResult.reasoning.some(r => r.includes('[F9/メタ認知]')),
    'reasoning: F9/メタ認知情報が含まれる',
    `found=${fullResult.reasoning.some(r => r.includes('[F9/メタ認知]'))}`
  )
  assert(
    fullResult.reasoning.some(r => r.includes('[F10/領域]')),
    'reasoning: F10/領域情報が含まれる',
    `found=${fullResult.reasoning.some(r => r.includes('[F10/領域]'))}`
  )
  assert(
    fullResult.reasoning.some(r => r.includes('[F11/真正]')),
    'reasoning: F11/真正情報が含まれる',
    `found=${fullResult.reasoning.some(r => r.includes('[F11/真正]'))}`
  )

  // -------------------------------------------------------
  // Test 39: 統合テスト — 12理論全てのreasoning出力
  // -------------------------------------------------------
  const allTheoryTags = ['F12感情', 'F4/ATI', 'F7/足場', 'F6/方略', 'F1/感覚', 'F2/入口', 'F3/Kolb', 'F9/メタ認知', 'F10/領域', 'F11/真正', 'F5/SRL', 'F8/動機']
  const presentTags = allTheoryTags.filter(tag => fullResult.reasoning.some(r => r.includes(tag)))
  assert(
    presentTags.length === 12,
    '統合: 12理論全てのreasoningが出力される',
    `${presentTags.length}/12 present: [${presentTags.join(', ')}]`
  )

  // -------------------------------------------------------
  // Test 40: F5 SRL適応品質の評価（Phase D）
  // -------------------------------------------------------
  const srlHighProfile = createTestProfiles({
    cognitive_autonomy: 75, emotional_stability: 70,
    strategic_maturity: 70, motivational_energy: 75,
  })
  const srlHighBehavior = createTestBehavior({ recent_accuracy: 0.8, consecutive_successes: 3 })
  const srlHighF5 = computeF5Controls(srlHighProfile.F5, srlHighBehavior, 'A', srlHighProfile.F12)
  const srlHighQuality = assessAdaptationQuality(srlHighProfile.F5, srlHighBehavior, srlHighF5.phase_detail)
  assert(
    srlHighQuality.overall >= 0.4,
    'F5/適応品質: 高SRLプロファイル → 品質≧0.4',
    `overall=${srlHighQuality.overall.toFixed(3)}`
  )
  assert(
    srlHighQuality.forethought_quality > 0,
    'F5/適応品質: 予見段階品質 > 0',
    `forethought=${srlHighQuality.forethought_quality.toFixed(3)}`
  )

  // 低SRLプロファイルの適応品質
  const srlLowProfile = createTestProfiles({
    cognitive_autonomy: 15, emotional_stability: 20,
    strategic_maturity: 15, motivational_energy: 15,
  })
  const srlLowBehavior = createTestBehavior({ recent_accuracy: 0.2, consecutive_errors: 4, hint_usage_count: 5 })
  const srlLowF5 = computeF5Controls(srlLowProfile.F5, srlLowBehavior, 'H', srlLowProfile.F12)
  const srlLowQuality = assessAdaptationQuality(srlLowProfile.F5, srlLowBehavior, srlLowF5.phase_detail)
  assert(
    srlLowQuality.overall < srlHighQuality.overall,
    'F5/適応品質: 低SRL < 高SRL',
    `low=${srlLowQuality.overall.toFixed(3)}, high=${srlHighQuality.overall.toFixed(3)}`
  )

  // -------------------------------------------------------
  // Test 41: SRLセッション追跡（Phase D）
  // -------------------------------------------------------
  const srlTracker = trackSRLPhaseTransition(
    srlHighF5.phase_detail,
    null, // 初回呼び出し
    10,
    srlHighBehavior,
    srlHighProfile.F5,
  )
  assert(
    srlTracker.adaptation_quality.overall >= 0,
    'F5/セッション追跡: 適応品質が算出される',
    `quality=${srlTracker.adaptation_quality.overall.toFixed(3)}`
  )
  assert(
    srlTracker.self_regulation_trend !== undefined,
    'F5/セッション追跡: トレンドが算出される',
    `trend=${srlTracker.self_regulation_trend}`
  )

  // -------------------------------------------------------
  // Test 42: SRL自動調整（Phase D コア）
  // -------------------------------------------------------
  // 高SRL → scaffold_down（足場のフェイディング）
  const srlAutoHigh = computeSRLAutoAdjustment(
    srlHighF5, srlHighProfile.F5, srlHighBehavior, 'A', srlTracker, srlHighProfile.F12
  )
  assert(
    srlAutoHigh.developmental_impact.direction === 'scaffold_down' ||
    srlAutoHigh.developmental_impact.direction === 'maintain',
    'F5/自動調整: 高SRL → scaffold_down or maintain',
    `direction=${srlAutoHigh.developmental_impact.direction}`
  )

  // 低SRL → scaffold_up（足場の強化）
  const srlLowTracker = trackSRLPhaseTransition(
    srlLowF5.phase_detail,
    null,
    10,
    srlLowBehavior,
    srlLowProfile.F5,
  )
  const srlAutoLow = computeSRLAutoAdjustment(
    srlLowF5, srlLowProfile.F5, srlLowBehavior, 'H', srlLowTracker, srlLowProfile.F12
  )
  assert(
    srlAutoLow.adjustments_made.length > 0,
    'F5/自動調整: 低SRL → 調整アクションが生成される',
    `actions=${srlAutoLow.adjustments_made.length}`
  )
  assert(
    srlAutoLow.developmental_impact.direction === 'scaffold_up' ||
    srlAutoLow.developmental_impact.direction === 'phase_redirect',
    'F5/自動調整: 低SRL → scaffold_up or phase_redirect',
    `direction=${srlAutoLow.developmental_impact.direction}`
  )

  // -------------------------------------------------------
  // Test 43: SRL因果効果（F5→F8, F5→F4）
  // -------------------------------------------------------
  assert(
    typeof srlAutoHigh.causal_to_f8.efficacy_to_competence === 'number',
    'F5/因果: efficacy_to_competence が数値',
    `value=${srlAutoHigh.causal_to_f8.efficacy_to_competence.toFixed(3)}`
  )
  assert(
    typeof srlAutoHigh.causal_to_f4.attribution_to_anxiety === 'number',
    'F5/因果: attribution_to_anxiety が数値',
    `value=${srlAutoHigh.causal_to_f4.attribution_to_anxiety.toFixed(3)}`
  )
  // 高SRL + 高自己効力感 → 有能感へ正の影響
  assert(
    srlAutoHigh.causal_to_f8.efficacy_to_competence >= 0,
    'F5/因果: 高SRL → 有能感への正の影響',
    `efficacy_to_competence=${srlAutoHigh.causal_to_f8.efficacy_to_competence.toFixed(3)}`
  )

  // -------------------------------------------------------
  // Test 44: F8 動機づけフィードバックループ（Phase D）
  // -------------------------------------------------------
  // 正のスパイラル検出
  const positiveMotProfile = createTestProfiles({
    cognitive_autonomy: 75, emotional_stability: 75,
    strategic_maturity: 75, motivational_energy: 80,
  })
  const positiveBehavior = createTestBehavior({ consecutive_successes: 4, recent_accuracy: 0.85 })
  const positiveNeedState = assessNeedSatisfaction(positiveMotProfile.F8)
  const positiveFeedback = detectMotivationFeedbackLoop(
    positiveMotProfile.F8, positiveBehavior, positiveNeedState, 'A', positiveMotProfile.F7
  )
  assert(
    positiveFeedback.spiral_type === 'positive',
    'F8/ループ: 連続成功+高動機 → 正のスパイラル',
    `spiral=${positiveFeedback.spiral_type}, intensity=${positiveFeedback.spiral_intensity.toFixed(2)}`
  )
  assert(
    positiveFeedback.spiral_intensity > 0,
    'F8/ループ: 正のスパイラル強度 > 0',
    `intensity=${positiveFeedback.spiral_intensity.toFixed(3)}`
  )

  // 負のスパイラル検出
  const negativeMotProfile = createTestProfiles({
    cognitive_autonomy: 15, emotional_stability: 20,
    strategic_maturity: 15, motivational_energy: 10, anxiety: 80,
  })
  const negativeBehavior = createTestBehavior({
    consecutive_errors: 4, recent_accuracy: 0.15,
    hint_usage_count: 5, idle_time_seconds: 60,
  })
  const negativeNeedState = assessNeedSatisfaction(negativeMotProfile.F8)
  const negativeFeedback = detectMotivationFeedbackLoop(
    negativeMotProfile.F8, negativeBehavior, negativeNeedState, 'H', negativeMotProfile.F7
  )
  assert(
    negativeFeedback.spiral_type === 'negative',
    'F8/ループ: 連続失敗+低動機 → 負のスパイラル',
    `spiral=${negativeFeedback.spiral_type}, intensity=${negativeFeedback.spiral_intensity.toFixed(2)}`
  )

  // -------------------------------------------------------
  // Test 45: 欲求バランス評価（Phase D）
  // -------------------------------------------------------
  assert(
    positiveFeedback.need_balance.balance_score > 0,
    'F8/バランス: 正のスパイラル時のバランススコア > 0',
    `balance=${positiveFeedback.need_balance.balance_score.toFixed(3)}`
  )
  assert(
    negativeFeedback.need_balance.weakest !== undefined,
    'F8/バランス: 最弱欲求が特定される',
    `weakest=${negativeFeedback.need_balance.weakest}`
  )

  // 全欲求欠乏パターン（F8プロファイルを直接操作して全欲求<30にする）
  const allDeficientProfiles = createTestProfiles({
    cognitive_autonomy: 10, emotional_stability: 10,
    strategic_maturity: 10, motivational_energy: 5, anxiety: 90,
  })
  // relatedness_satisfactionをテスト用に強制的に低下させる
  allDeficientProfiles.F8.relatedness_satisfaction = 15
  allDeficientProfiles.F8.autonomy_satisfaction = 10
  allDeficientProfiles.F8.competence_satisfaction = 10
  const allDeficientNeedState = assessNeedSatisfaction(allDeficientProfiles.F8)
  const allDeficientFeedback = detectMotivationFeedbackLoop(
    allDeficientProfiles.F8,
    createTestBehavior({ consecutive_errors: 5, recent_accuracy: 0.1 }),
    allDeficientNeedState, 'H', allDeficientProfiles.F7
  )
  assert(
    allDeficientFeedback.need_balance.imbalance_pattern === 'all_deficient',
    'F8/バランス: 全欲求低下 → all_deficient',
    `pattern=${allDeficientFeedback.need_balance.imbalance_pattern}`
  )

  // -------------------------------------------------------
  // Test 46: 予防的介入（Phase D）
  // -------------------------------------------------------
  // 負のスパイラル → spiral_break
  assert(
    negativeFeedback.preventive_intervention !== null,
    'F8/予防介入: 負のスパイラル → 介入が推奨される',
    `intervention=${negativeFeedback.preventive_intervention?.type}`
  )
  assert(
    negativeFeedback.preventive_intervention?.type === 'spiral_break',
    'F8/予防介入: 負のスパイラル → spiral_break',
    `type=${negativeFeedback.preventive_intervention?.type}`
  )
  assert(
    negativeFeedback.preventive_intervention?.urgency === 'immediate',
    'F8/予防介入: 負のスパイラル → 即時介入',
    `urgency=${negativeFeedback.preventive_intervention?.urgency}`
  )

  // 全欲求欠乏 → safety_net
  assert(
    allDeficientFeedback.preventive_intervention?.type === 'safety_net',
    'F8/予防介入: 全欲求欠乏 → safety_net',
    `type=${allDeficientFeedback.preventive_intervention?.type}`
  )

  // -------------------------------------------------------
  // Test 47: F8→F5 波及効果（Phase D）
  // -------------------------------------------------------
  assert(
    positiveFeedback.ripple_to_f5.intrinsic_interest_modulation > 0,
    'F8/波及: 正のスパイラル → 内発的興味↑',
    `modulation=${positiveFeedback.ripple_to_f5.intrinsic_interest_modulation.toFixed(3)}`
  )
  assert(
    positiveFeedback.ripple_to_f5.persistence_modulation > 0,
    'F8/波及: 正のスパイラル → 忍耐力↑',
    `modulation=${positiveFeedback.ripple_to_f5.persistence_modulation.toFixed(3)}`
  )
  assert(
    negativeFeedback.ripple_to_f5.intrinsic_interest_modulation < positiveFeedback.ripple_to_f5.intrinsic_interest_modulation,
    'F8/波及: 負のスパイラル → 内発的興味は正より低い',
    `negative=${negativeFeedback.ripple_to_f5.intrinsic_interest_modulation.toFixed(3)}, positive=${positiveFeedback.ripple_to_f5.intrinsic_interest_modulation.toFixed(3)}`
  )

  // -------------------------------------------------------
  // Test 48: F8→F4 波及効果と構造化推奨（Phase D）
  // -------------------------------------------------------
  assert(
    typeof positiveFeedback.ripple_to_f4.anxiety_modulation === 'number',
    'F8/波及: anxiety_modulation が数値',
    `value=${positiveFeedback.ripple_to_f4.anxiety_modulation.toFixed(3)}`
  )
  assert(
    typeof positiveFeedback.ripple_to_f4.structure_recommendation === 'number',
    'F8/波及: structure_recommendation が数値',
    `value=${positiveFeedback.ripple_to_f4.structure_recommendation.toFixed(3)}`
  )
  // 正のスパイラル → 構造化度↓推奨
  assert(
    positiveFeedback.ripple_to_f4.structure_recommendation <= 0,
    'F8/波及: 正のスパイラル → 構造化度↓推奨',
    `recommendation=${positiveFeedback.ripple_to_f4.structure_recommendation.toFixed(3)}`
  )
  // 負のスパイラル → 構造化度↑推奨
  assert(
    negativeFeedback.ripple_to_f4.structure_recommendation >= 0,
    'F8/波及: 負のスパイラル → 構造化度↑推奨',
    `recommendation=${negativeFeedback.ripple_to_f4.structure_recommendation.toFixed(3)}`
  )

  // -------------------------------------------------------
  // Test 49: 統合テスト — 双方向因果ループのreasoning出力（Phase D）
  // -------------------------------------------------------
  // 正のスパイラルシナリオ
  const positiveIntegrated = computeIntegratedControls(positiveMotProfile, positiveBehavior)
  assert(
    positiveIntegrated.reasoning.some(r => r.includes('[F5/適応]') || r.includes('[F5/SRL]')),
    '統合/Phase D: F5適応ループのreasoningが含まれる',
    `found=${positiveIntegrated.reasoning.some(r => r.includes('[F5/') )}`
  )
  assert(
    positiveIntegrated.reasoning.some(r => r.includes('[F8/ループ]')),
    '統合/Phase D: F8フィードバックループのreasoningが含まれる',
    `found=${positiveIntegrated.reasoning.some(r => r.includes('[F8/ループ]'))}`
  )

  // 負のスパイラルシナリオ
  const negativeIntegrated = computeIntegratedControls(negativeMotProfile, negativeBehavior)
  assert(
    negativeIntegrated.reasoning.some(r => r.includes('[F8/ループ]')),
    '統合/Phase D: 負のスパイラルreasoningが含まれる',
    `found=${negativeIntegrated.reasoning.some(r => r.includes('[F8/ループ]'))}`
  )

  // 因果連鎖の推論が含まれるか
  const hasCausalReasoning = negativeIntegrated.reasoning.some(r =>
    r.includes('[因果:') || r.includes('[スパイラル]') || r.includes('[予防介入]')
  )
  assert(
    hasCausalReasoning,
    '統合/Phase D: 因果連鎖/スパイラルのreasoningが含まれる',
    `found=${hasCausalReasoning}, reasoning_count=${negativeIntegrated.reasoning.length}`
  )

  // -------------------------------------------------------
  // Test 50: 統合テスト — 負のスパイラル時の制御変更（Phase D）
  // -------------------------------------------------------
  assert(
    negativeIntegrated.controls.scaffold.frustration_control === true,
    '統合/Phase D: 負のスパイラル → frustration_control ON',
    `fc=${negativeIntegrated.controls.scaffold.frustration_control}`
  )
  assert(
    negativeIntegrated.controls.scaffold.soft_language === true,
    '統合/Phase D: 負のスパイラル → soft_language ON',
    `sl=${negativeIntegrated.controls.scaffold.soft_language}`
  )

  // -------------------------------------------------------
  // Test 51: 8アーキタイプ全てでPhase Dが動作（Phase D）
  // -------------------------------------------------------
  const archetypeParamsForD: { id: ArchetypeId; params: Parameters<typeof createTestProfiles>[0] }[] = [
    { id: 'A', params: { cognitive_autonomy: 80, emotional_stability: 80, strategic_maturity: 80, motivational_energy: 80, anxiety: 15, independence: 85 } },
    { id: 'B', params: { cognitive_autonomy: 55, emotional_stability: 80, strategic_maturity: 60, motivational_energy: 85, anxiety: 15, independence: 55, prior_knowledge: 65 } },
    { id: 'C', params: { cognitive_autonomy: 55, emotional_stability: 75, strategic_maturity: 30, motivational_energy: 55, anxiety: 25, independence: 55 } },
    { id: 'D', params: { cognitive_autonomy: 75, emotional_stability: 30, strategic_maturity: 75, motivational_energy: 35, anxiety: 70, independence: 70 } },
    { id: 'E', params: { cognitive_autonomy: 55, emotional_stability: 55, strategic_maturity: 55, motivational_energy: 75, anxiety: 35, independence: 50 } },
    { id: 'F', params: { cognitive_autonomy: 30, emotional_stability: 30, strategic_maturity: 25, motivational_energy: 55, anxiety: 65, independence: 25 } },
    { id: 'G', params: { cognitive_autonomy: 25, emotional_stability: 55, strategic_maturity: 25, motivational_energy: 25, anxiety: 40, independence: 20 } },
    { id: 'H', params: { cognitive_autonomy: 15, emotional_stability: 20, strategic_maturity: 15, motivational_energy: 15, anxiety: 80, independence: 10 } },
  ]

  for (const at of archetypeParamsForD) {
    const p = createTestProfiles(at.params)
    const b = createTestBehavior()
    const result = computeIntegratedControls(p, b)
    assert(
      result.reasoning.some(r => r.includes('[F8/ループ]')),
      `統合/Phase D: Type ${at.id} でF8ループreasoningが出力`,
      `archetype=${at.id}, reasoning_count=${result.reasoning.length}`
    )
  }

  // -------------------------------------------------------
  // 結果表示
  // -------------------------------------------------------
  console.log('\n=== テスト結果 ===\n')
  let passCount = 0
  let failCount = 0
  for (const r of results) {
    const status = r.passed ? '✅' : '❌'
    console.log(`${status} ${r.name}`)
    if (!r.passed) {
      console.log(`   → ${r.details}`)
    }
    if (r.passed) passCount++
    else failCount++
  }
  console.log(`\n合計: ${passCount} passed / ${failCount} failed / ${results.length} total`)
  console.log(failCount === 0 ? '\n🎉 全テスト通過!' : '\n⚠️ 一部テストが失敗しました')
}

// テスト実行
runTests()
