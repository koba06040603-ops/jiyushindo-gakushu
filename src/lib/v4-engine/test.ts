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
