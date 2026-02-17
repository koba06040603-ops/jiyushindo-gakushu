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
import { computeF5Controls, detectSRLPhase, assessDevelopmentalStage, adjustSRLForAffect } from './f5-srl-engine'
import { computeF8Controls, assessNeedSatisfaction, assessMotivationQuality, adjustF8ForAffect } from './f8-motivation-engine'

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
