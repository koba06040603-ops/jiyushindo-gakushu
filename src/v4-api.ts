/**
 * v4 統合制御エンジン API ルート
 * 
 * 12理論統合因果モデル (THEORY_CAUSAL_MODEL.md) に基づく
 * 子どもの「今の姿」を理解し、最適な学習制御パラメータを算出する API
 * 
 * エンドポイント:
 *   POST /api/v4/compute   — 統合制御パラメータの算出（メインAPI）
 *   POST /api/v4/analyze   — 個別エンジン分析（F1〜F12 各視座の詳細）
 *   POST /api/v4/diagnose  — 診断（スパイラル検出、欲求バランス、介入提案）
 *   GET  /api/v4/archetypes — 8アーキタイプ一覧
 *   GET  /api/v4/schema     — API入力スキーマ（サンプルプロファイル付き）
 */

import { Hono } from 'hono'

// v4 統合制御エンジンから全機能をインポート
import {
  // 統合制御
  computeIntegratedControls,
  computeFundamentalAxes,
  understandCurrentPresence,
  // 定数
  ARCHETYPES,
  INFLUENCE_MATRIX,
  EFFECT_SIZES,
  // F1 感覚チャネル
  computeF1Controls,
  // F2 多元的入口
  computeF2Controls,
  // F3 経験変容
  computeF3Controls,
  // F4 ATI
  computeF4Controls,
  // F5 SRL
  computeF5Controls,
  detectSRLPhase,
  assessAdaptationQuality,
  // F6 認知方略
  computeF6Controls,
  // F7 足場
  computeF7Controls,
  // F8 動機
  computeF8Controls,
  assessNeedSatisfaction,
  assessMotivationQuality,
  detectMotivationFeedbackLoop,
  // F9 メタ認知
  computeF9Controls,
  // F10 領域固有
  computeF10Controls,
  // F11 真正文脈
  computeF11Controls,
  // F12 感情
  executeAffectGating,
  computeOptimalArousalRange,
} from './lib/v4-engine'

import type {
  AllTheoryProfiles,
  RealtimeBehaviorData,
  IntegratedControlParameters,
  FundamentalAxes,
  ArchetypeId,
} from './lib/v4-engine'

// ============================================================
// Hono サブアプリ定義
// ============================================================
const v4Api = new Hono()

// ============================================================
// ヘルパー: デフォルトプロファイル・行動データ生成
// ============================================================

/** 12理論プロファイルのデフォルト値（初回利用時やテスト用） */
function createDefaultProfiles(overrides?: Partial<Record<string, any>>): AllTheoryProfiles {
  const o = overrides || {}
  const cognitive_autonomy = o.cognitive_autonomy ?? 50
  const emotional_stability = o.emotional_stability ?? 50
  const strategic_maturity = o.strategic_maturity ?? 50
  const motivational_energy = o.motivational_energy ?? 50
  const anxiety = o.anxiety ?? 30
  const independence = o.independence ?? 50
  const prior_knowledge = o.prior_knowledge ?? 50

  return {
    F1: {
      visual_processing_efficiency: o.visual ?? 60,
      auditory_processing_efficiency: o.auditory ?? 50,
      reading_processing_efficiency: o.reading ?? 55,
      kinesthetic_processing_efficiency: o.kinesthetic ?? 45,
      multimodal_index: o.multimodal ?? 55,
    },
    F2: {
      linguistic: o.linguistic ?? 55,
      logical_mathematical: o.logical ?? 65,
      spatial: o.spatial ?? 50,
      bodily_kinesthetic: o.bodily ?? 40,
      musical: o.musical ?? 35,
      interpersonal: o.interpersonal ?? 50,
      intrapersonal: o.intrapersonal ?? 55,
      naturalist: o.naturalist ?? 40,
      growth_mindset: o.growth_mindset ?? 60,
    },
    F3: {
      ce_preference: o.ce ?? 50,
      ro_preference: o.ro ?? 40,
      ac_preference: o.ac ?? 60,
      ae_preference: o.ae ?? 45,
      cycle_completion_rate: o.cycle_rate ?? 0.5,
      dominant_style: o.dominant_style ?? 'assimilating',
    },
    F4: {
      prior_knowledge,
      general_cognitive_ability: o.general_ability ?? 55,
      anxiety_level: anxiety,
      independence_level: independence,
      locus_of_control: o.locus ?? 55,
    },
    F5: {
      forethought: {
        task_analysis: Math.min(100, cognitive_autonomy * 0.8),
        goal_setting: Math.min(100, cognitive_autonomy * 0.7),
        strategic_planning: Math.min(100, strategic_maturity * 0.6),
        self_efficacy: Math.min(100, emotional_stability * 0.8),
        outcome_expectation: Math.min(100, motivational_energy * 0.7),
        intrinsic_interest: Math.min(100, motivational_energy * 0.8),
      },
      performance: {
        attention_focusing: Math.min(100, cognitive_autonomy * 0.6 + emotional_stability * 0.3),
        self_instruction: Math.min(100, cognitive_autonomy * 0.6),
        task_strategy_use: Math.min(100, strategic_maturity * 0.7),
        self_monitoring: Math.min(100, cognitive_autonomy * 0.5),
        metacognitive_awareness: Math.min(100, cognitive_autonomy * 0.5 + strategic_maturity * 0.3),
      },
      self_reflection: {
        self_evaluation: Math.min(100, cognitive_autonomy * 0.6),
        causal_attribution: Math.min(100, emotional_stability * 0.5 + strategic_maturity * 0.3),
        self_satisfaction: Math.min(100, emotional_stability * 0.6 + motivational_energy * 0.3),
        adaptive_inference: Math.min(100, strategic_maturity * 0.5 + cognitive_autonomy * 0.3),
      },
      developmental_level: cognitive_autonomy >= 75 ? 'self_regulation' :
        cognitive_autonomy >= 50 ? 'self_control' :
        cognitive_autonomy >= 25 ? 'emulation' : 'observation',
    },
    F6: {
      retrieval_practice_readiness: Math.min(100, strategic_maturity * 0.8),
      spacing_optimal_gap: o.spacing_gap ?? 3,
      interleaving_readiness: strategic_maturity >= 50,
      elaboration_prior_knowledge: Math.min(100, prior_knowledge * 0.9),
      mastery_level_for_current_unit: Math.min(100, prior_knowledge * 0.7),
    },
    F7: {
      zpd_lower_bound: o.zpd_lower ?? 30,
      zpd_upper_bound: o.zpd_upper ?? 70,
      zpd_width: (o.zpd_upper ?? 70) - (o.zpd_lower ?? 30),
      current_performance: o.performance ?? 50,
      scaffold_dependency: Math.max(0, 80 - cognitive_autonomy),
      consecutive_success: o.consec_success ?? 0,
      consecutive_failure: o.consec_failure ?? 0,
    },
    F8: {
      autonomy_satisfaction: Math.min(100, motivational_energy * 0.8),
      competence_satisfaction: Math.min(100, emotional_stability * 0.9),
      relatedness_satisfaction: o.relatedness ?? 50,
      motivation_quality: motivational_energy >= 70 ? 'intrinsic' :
        motivational_energy >= 50 ? 'identified' : 'external',
      motivation_continuum_score: motivational_energy,
      isolated_autonomy: false,
      fragile_competence: emotional_stability < 40,
      surface_autonomy: false,
    },
    F9: {
      metacognitive_knowledge: Math.min(100, cognitive_autonomy * 0.7 + strategic_maturity * 0.2),
      metacognitive_regulation: Math.min(100, cognitive_autonomy * 0.6 + strategic_maturity * 0.3),
      critical_thinking: Math.min(100, strategic_maturity * 0.6),
      creative_thinking: Math.min(100, motivational_energy * 0.4 + cognitive_autonomy * 0.3),
    },
    F10: {
      domain_knowledge_stage: prior_knowledge >= 70 ? 'proficiency' :
        prior_knowledge >= 40 ? 'competence' : 'acclimation',
      misconceptions: o.misconceptions ?? [],
      knowledge_structure_depth: Math.min(100, prior_knowledge * 0.8),
    },
    F11: {
      personal_relevance: o.relevance ?? Math.min(100, motivational_energy * 0.6),
      real_world_connection_awareness: o.real_world ?? 40,
      community_participation: o.community ?? 30,
    },
    F12: {
      current_arousal: o.arousal ?? 55,
      current_valence: o.valence ?? 20,
      academic_enjoyment: o.enjoyment ?? Math.min(100, motivational_energy * 0.7),
      academic_anxiety: anxiety,
      academic_boredom: o.boredom ?? 20,
      flow_state_probability: o.flow ?? 0.3,
    },
  }
}

/** デフォルト行動データ生成 */
function createDefaultBehavior(overrides?: Partial<RealtimeBehaviorData>): RealtimeBehaviorData {
  return {
    consecutive_successes: overrides?.consecutive_successes ?? 0,
    consecutive_errors: overrides?.consecutive_errors ?? 0,
    recent_accuracy: overrides?.recent_accuracy ?? 0.6,
    recent_response_time_ms: overrides?.recent_response_time_ms ?? 15000,
    hint_usage_count: overrides?.hint_usage_count ?? 0,
    idle_time_seconds: overrides?.idle_time_seconds ?? 0,
    estimated_affect: overrides?.estimated_affect ?? { arousal: 55, valence: 20 },
    current_srl_phase: overrides?.current_srl_phase ?? 'performance',
    session_duration_minutes: overrides?.session_duration_minutes ?? 10,
    current_problem_difficulty: overrides?.current_problem_difficulty ?? 50,
  }
}

/** リクエストボディからプロファイルを構築（部分入力をサポート） */
function buildProfiles(body: any): AllTheoryProfiles {
  // 完全なプロファイルが提供された場合はそのまま使用
  if (body.profiles && body.profiles.F1 && body.profiles.F12) {
    return body.profiles as AllTheoryProfiles
  }
  // 簡易パラメータからプロファイルを生成
  return createDefaultProfiles(body.quick_params || body.profiles || {})
}

/** リクエストボディから行動データを構築 */
function buildBehavior(body: any): RealtimeBehaviorData {
  return createDefaultBehavior(body.behavior || {})
}

// ============================================================
// バリデーション
// ============================================================

function validateRange(value: any, min: number, max: number, field: string): string | null {
  if (value === undefined || value === null) return null
  const num = Number(value)
  if (isNaN(num)) return `${field} must be a number`
  if (num < min || num > max) return `${field} must be between ${min} and ${max}`
  return null
}

function validateProfiles(profiles: any): string[] {
  const errors: string[] = []
  if (!profiles) return errors

  // F1
  if (profiles.F1) {
    const f1Fields = ['visual_processing_efficiency', 'auditory_processing_efficiency', 'reading_processing_efficiency', 'kinesthetic_processing_efficiency', 'multimodal_index']
    for (const f of f1Fields) {
      const err = validateRange(profiles.F1[f], 0, 100, `F1.${f}`)
      if (err) errors.push(err)
    }
  }

  // F4
  if (profiles.F4) {
    for (const f of ['prior_knowledge', 'general_cognitive_ability', 'anxiety_level', 'independence_level', 'locus_of_control']) {
      const err = validateRange(profiles.F4[f], 0, 100, `F4.${f}`)
      if (err) errors.push(err)
    }
  }

  // F12
  if (profiles.F12) {
    const err1 = validateRange(profiles.F12.current_arousal, 0, 100, 'F12.current_arousal')
    if (err1) errors.push(err1)
    const err2 = validateRange(profiles.F12.current_valence, -100, 100, 'F12.current_valence')
    if (err2) errors.push(err2)
    for (const f of ['academic_enjoyment', 'academic_anxiety', 'academic_boredom']) {
      const err = validateRange(profiles.F12[f], 0, 100, `F12.${f}`)
      if (err) errors.push(err)
    }
    const err3 = validateRange(profiles.F12.flow_state_probability, 0, 1, 'F12.flow_state_probability')
    if (err3) errors.push(err3)
  }

  return errors
}

// ============================================================
// POST /api/v4/compute — 統合制御パラメータの算出（メインAPI）
// ============================================================
v4Api.post('/compute', async (c) => {
  const startTime = Date.now()

  try {
    const body = await c.req.json()

    // バリデーション
    const validationErrors = validateProfiles(body.profiles)
    if (validationErrors.length > 0) {
      return c.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors,
      }, 400)
    }

    // プロファイルと行動データの構築
    const profiles = buildProfiles(body)
    const behavior = buildBehavior(body)

    // v4 統合制御エンジンの実行
    const result = computeIntegratedControls(profiles, behavior)

    const processingTime = Date.now() - startTime

    return c.json({
      success: true,
      data: {
        // 統合制御パラメータ（AIが実際に制御する変数）
        controls: result.controls,
        // この子の今の姿
        archetype: {
          id: result.archetype,
          ...ARCHETYPES[result.archetype],
        },
        // 5つの基幹軸
        axes: result.axes,
        // 感情状態
        affect_state: result.affectState,
        // 推論過程（12の視座による理解の記録）
        reasoning: result.reasoning,
      },
      meta: {
        engine_version: 'v4.0',
        processing_time_ms: processingTime,
        theory_count: 12,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('v4 compute error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal engine error',
    }, 500)
  }
})

// ============================================================
// POST /api/v4/analyze — 個別エンジン分析
// ============================================================
v4Api.post('/analyze', async (c) => {
  const startTime = Date.now()

  try {
    const body = await c.req.json()
    const profiles = buildProfiles(body)
    const behavior = buildBehavior(body)

    // 基幹軸算出
    const axes = computeFundamentalAxes(profiles)
    const archetype = understandCurrentPresence(axes)

    // 各エンジンの個別分析結果
    const analysis: Record<string, any> = {}

    // F1 感覚チャネル
    const f1 = computeF1Controls(profiles.F1, archetype)
    analysis.F1_sensory = {
      name: '感覚チャネル最適化',
      description: 'この子はどう世界を受け取っているか',
      entry_channel: f1.entry.channel,
      entry_confidence: f1.entry.confidence,
      encoding_channels: f1.encoding.channels,
      modality_weights: f1.modality_weights,
      multimodal_capacity: f1.multimodal,
      reasoning: f1.reasoning,
    }

    // F2 多元的入口
    const f2 = computeF2Controls(profiles.F2, archetype)
    analysis.F2_intelligence = {
      name: '多元的入口',
      description: 'この子はどんな道筋で理解に向かうか',
      primary_entry: f2.primary_entry,
      fallback_entry: f2.fallback_entry,
      concept_representation: f2.concept_representation,
      mindset_message_type: f2.mindset_message_type,
      reasoning: f2.reasoning,
    }

    // F3 経験変容
    const f3 = computeF3Controls(profiles.F3, archetype)
    analysis.F3_experiential = {
      name: '経験変容学習',
      description: 'この子は経験をどう意味に変えているか',
      entry_phase: f3.entry_phase,
      cycle_sequence: f3.cycle_sequence,
      time_allocation: f3.phase_time_allocation,
      force_full_cycle: f3.force_full_cycle,
      reasoning: f3.reasoning,
    }

    // F4 ATI
    const f4 = computeF4Controls(profiles.F4, archetype)
    analysis.F4_aptitude = {
      name: '適性×指導交互作用',
      description: 'この子はどんな環境で動きやすいか',
      structure_level: f4.structure_level,
      solution_path_openness: f4.solution_path_openness,
      hint_proactiveness: f4.hint_proactiveness,
      error_tolerance: f4.error_tolerance,
    }

    // F5 SRL
    const f5 = computeF5Controls(profiles.F5, behavior, archetype, profiles.F12)
    const srlPhase = detectSRLPhase(behavior, profiles.F5)
    const adaptQuality = assessAdaptationQuality(profiles.F5, behavior, srlPhase)
    analysis.F5_srl = {
      name: '多位相自己調整学習',
      description: 'この子は自分の学びにどう舵を取っているか',
      current_phase: srlPhase.phase,
      phase_confidence: srlPhase.confidence,
      developmental_stage: profiles.F5.developmental_level,
      developmental_assessment: f5.developmental_assessment,
      adaptation_quality: adaptQuality,
      controls: {
        goal_prompt_type: f5.forethought_scaffold.goal_prompt_type,
        monitoring_interval: f5.performance_scaffold.monitoring_interval,
        reflection_prompt_type: f5.reflection_scaffold.reflection_prompt_type,
        think_aloud_modeling: f5.performance_scaffold.think_aloud_modeling,
      },
    }

    // F6 認知方略
    const f6 = computeF6Controls(profiles.F6, behavior, archetype, profiles.F5, profiles.F12)
    analysis.F6_strategy = {
      name: '条件付き認知方略',
      description: 'この子は「知りたい」「覚えたい」にどう向かっているか',
      retrieval: f6.retrieval,
      spacing: f6.spacing,
      interleaving: f6.interleaving,
      elaboration: f6.elaboration,
      applicability: f6.applicability,
      reasoning: f6.reasoning,
    }

    // F7 足場
    const f7 = computeF7Controls(profiles.F7, behavior, archetype, profiles.F12)
    analysis.F7_scaffold = {
      name: '動的随伴足場',
      description: 'この子は手を伸ばしてどこまで届くか',
      zpd_position: f7.difficulty_zpd_position,
      functions: f7.functions,
      contingency: f7.contingency,
      motivational_scaffold: f7.motivational_scaffold,
    }

    // F8 動機
    const f8 = computeF8Controls(profiles.F8, behavior, archetype, profiles.F7, profiles.F12)
    const needState = assessNeedSatisfaction(profiles.F8)
    const motivQuality = assessMotivationQuality(profiles.F8, archetype)
    analysis.F8_motivation = {
      name: '三欲求統合動機',
      description: 'この子は何を求めているか',
      need_satisfaction: needState,
      motivation_quality: motivQuality,
      controls: f8.motivation_controls,
      causal_effects: f8.causal_effects,
      reasoning: f8.reasoning,
    }

    // F9 メタ認知
    const f9 = computeF9Controls(profiles.F9, archetype)
    analysis.F9_metacognitive = {
      name: '21世紀型メタ認知',
      description: 'この子は自分の考えを見つめられているか',
      level: f9.level,
      problem_solving_scaffold: f9.problem_solving_scaffold,
      metacognitive_prompts: f9.metacognitive_prompts,
      critical_evaluation_prompt: f9.critical_evaluation_prompt,
      creative_thinking_opportunity: f9.creative_thinking_opportunity,
      reasoning: f9.reasoning,
    }

    // F10 領域固有
    const f10 = computeF10Controls(profiles.F10, archetype)
    analysis.F10_domain = {
      name: '教科固有認知',
      description: 'この子はその教科の「見方」を身につけつつあるか',
      stage: profiles.F10.domain_knowledge_stage,
      misconception_handling: f10.misconception_handling,
      reasoning: f10.reasoning,
    }

    // F11 真正文脈
    const f11 = computeF11Controls(profiles.F11, archetype)
    analysis.F11_authentic = {
      name: '真正文脈学習',
      description: 'この子にとって学びは「自分のもの」になっているか',
      authenticity_level: f11.level,
      real_world_connection: f11.real_world_connection,
      authentic_task_framing: f11.authentic_task_framing,
      community_relevance: f11.community_relevance,
      reasoning: f11.reasoning,
    }

    // F12 感情
    const f12 = executeAffectGating(profiles.F12, profiles.F8, behavior, archetype)
    analysis.F12_affect = {
      name: '感情-認知統合',
      description: 'この子は今どんな気持ちで学んでいるか',
      affect_state: f12.state,
      optimal_arousal: computeOptimalArousalRange(archetype),
      gating_active: f12.requires_override,
      urgency: f12.urgency,
      teacher_alert: f12.teacher_alert,
      overrides: f12.overrides,
      reasoning: f12.reasoning,
    }

    const processingTime = Date.now() - startTime

    return c.json({
      success: true,
      data: {
        archetype: {
          id: archetype,
          name_ja: ARCHETYPES[archetype].name_ja,
          name_en: ARCHETYPES[archetype].name_en,
          presence: ARCHETYPES[archetype].presence,
        },
        axes,
        analysis,
      },
      meta: {
        engine_version: 'v4.0',
        processing_time_ms: processingTime,
        engines_analyzed: Object.keys(analysis).length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('v4 analyze error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal engine error',
    }, 500)
  }
})

// ============================================================
// POST /api/v4/diagnose — スパイラル検出・介入提案
// ============================================================
v4Api.post('/diagnose', async (c) => {
  const startTime = Date.now()

  try {
    const body = await c.req.json()
    const profiles = buildProfiles(body)
    const behavior = buildBehavior(body)

    // 基幹軸算出
    const axes = computeFundamentalAxes(profiles)
    const archetype = understandCurrentPresence(axes)

    // F8 動機エンジンのフィードバックループ検出
    const needStateForLoop = assessNeedSatisfaction(profiles.F8)
    const f8Controls = computeF8Controls(profiles.F8, behavior, archetype, profiles.F7, profiles.F12)
    const feedbackLoop = detectMotivationFeedbackLoop(profiles.F8, behavior, needStateForLoop, archetype, profiles.F7)

    // F5 SRL 適応品質評価
    const f5Controls = computeF5Controls(profiles.F5, behavior, archetype, profiles.F12)
    const srlPhaseDetail = detectSRLPhase(behavior, profiles.F5)
    const adaptationQuality = assessAdaptationQuality(profiles.F5, behavior, srlPhaseDetail)

    // SRL自動調整（sessionTrackerがないのでスキップ可能。f5Controlsベースのみ）
    let srlAdjustmentActions: Array<{ target: string; description: string }> = []
    // Note: computeSRLAutoAdjustment requires sessionTracker which is session-stateful.
    // In a stateless API, we provide adaptation quality instead.

    // 欲求バランス評価
    const needState = needStateForLoop
    const motivQuality = assessMotivationQuality(profiles.F8, archetype)

    // 感情ゲーティング
    const affectGating = executeAffectGating(profiles.F12, profiles.F8, behavior, archetype)

    // 包括的リスク評価
    const risks: Array<{
      category: string
      severity: 'low' | 'medium' | 'high' | 'critical'
      description: string
      recommended_action: string
    }> = []

    // スパイラルリスク
    if (feedbackLoop.spiral_type === 'negative') {
      risks.push({
        category: '負のスパイラル',
        severity: 'critical',
        description: '失敗→有能感低下→自己効力感低下→回避→さらなる失敗の悪循環が検出されました',
        recommended_action: 'ZPDを達成可能なレベルまで下げ、小さな成功体験を積ませる。strategy帰属メッセージを提供。',
      })
    } else if (feedbackLoop.spiral_type === 'fragile_positive') {
      risks.push({
        category: '脆い正のスパイラル',
        severity: 'medium',
        description: '正のスパイラルは動いていますが、脆弱で崩れやすい状態です',
        recommended_action: '現在の成功パターンを維持しつつ、自律性を少しずつ高める。急な難易度上昇は避ける。',
      })
    }

    // 欲求不均衡リスク
    if (needState.overall_satisfaction < 30) {
      risks.push({
        category: '全般的欲求不足',
        severity: 'high',
        description: `自律性・有能感・関係性の3欲求すべてが低い状態 (全体 ${needState.overall_satisfaction}/100)`,
        recommended_action: '最も弱い欲求から段階的に満たす。教師との連携を推奨。',
      })
    } else if (needState.weakest_need) {
      const weakestScore = Math.min(
        profiles.F8.autonomy_satisfaction,
        profiles.F8.competence_satisfaction,
        profiles.F8.relatedness_satisfaction
      )
      if (weakestScore < 30) {
        risks.push({
          category: `${needState.weakest_need}欲求の欠乏`,
          severity: 'medium',
          description: `${needState.weakest_need}の充足度が低い (${weakestScore}/100)`,
          recommended_action: needState.weakest_need === 'autonomy' ? '選択肢と理由を提示し、自律性を支援' :
            needState.weakest_need === 'competence' ? '到達可能な目標を設定し、成功体験を積む' :
            '協働学習の機会を設ける',
        })
      }
    }

    // 感情リスク
    if (affectGating.state === 'crisis') {
      risks.push({
        category: '感情的危機',
        severity: 'critical',
        description: '学習不安が非常に高い、または感情的に強い苦痛を感じている',
        recommended_action: '学習課題を中断し、感情の安定を最優先。教師アラートを発出。',
      })
    } else if (profiles.F12.academic_boredom > 70) {
      risks.push({
        category: '高度な退屈',
        severity: 'medium',
        description: '退屈度が高く、離脱のリスクがある',
        recommended_action: '覚醒度を上げる活動（挑戦的な問題、ゲーム要素）を導入。',
      })
    }

    // SRL適応品質
    if (adaptationQuality.overall < 0.3) {
      risks.push({
        category: 'SRL機能低下',
        severity: 'medium',
        description: `自己調整学習の品質が低い (${(adaptationQuality.overall * 100).toFixed(0)}%)`,
        recommended_action: `最も弱い位相 (${adaptationQuality.weakest_phase}) を重点的に支援`,
      })
    }

    // 介入提案
    const interventions: Array<{
      type: string
      urgency: 'immediate' | 'session' | 'weekly'
      description: string
      control_adjustments: Partial<IntegratedControlParameters>
    }> = []

    // 即時介入が必要な場合
    if (feedbackLoop.preventive_intervention) {
      const intervention = feedbackLoop.preventive_intervention
      const adjustments: any = {}
      
      if (intervention.type === 'spiral_break') {
        adjustments.structure = { difficulty_zpd_position: 0.3, error_tolerance: 0.8 }
        adjustments.scaffold = { frustration_control: true, encouragement: true, soft_language: true }
        adjustments.motivation = { emotional_message_type: 'calming', micro_success_feedback: true }
      } else if (intervention.type === 'safety_net') {
        adjustments.structure = { difficulty_zpd_position: 0.2, structure_level: 0.8 }
        adjustments.scaffold = { frustration_control: true, demonstration_level: 'full' }
        adjustments._teacher_alert = true
      }

      interventions.push({
        type: intervention.type,
        urgency: intervention.urgency || 'immediate',
        description: intervention.actions?.join('; ') || '介入が必要です',
        control_adjustments: adjustments,
      })
    }

    // SRL品質が低い場合の推奨
    if (adaptationQuality.weakest_phase && adaptationQuality.overall < 0.4) {
      interventions.push({
        type: 'srl_support',
        urgency: 'session',
        description: `SRL最弱位相 (${adaptationQuality.weakest_phase}) を重点支援: 品質 ${(adaptationQuality.overall * 100).toFixed(0)}%`,
        control_adjustments: {},
      })
    }

    const processingTime = Date.now() - startTime

    return c.json({
      success: true,
      data: {
        // この子の今の姿
        archetype: {
          id: archetype,
          name_ja: ARCHETYPES[archetype].name_ja,
          presence: ARCHETYPES[archetype].presence,
        },
        // 診断結果
        diagnosis: {
          spiral: {
            type: feedbackLoop.spiral_type,
            need_balance: feedbackLoop.need_balance,
          },
          affect_state: affectGating.state,
          srl_quality: adaptationQuality,
          need_satisfaction: needState,
          motivation_quality: motivQuality,
        },
        // リスク評価（重篤度順）
        risks: risks.sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 }
          return order[a.severity] - order[b.severity]
        }),
        // 介入提案
        interventions,
        // 因果チェーン状態
        causal_chain: {
          f8_to_f5: feedbackLoop.ripple_to_f5,
          f8_to_f4: feedbackLoop.ripple_to_f4,
        },
      },
      meta: {
        engine_version: 'v4.0',
        processing_time_ms: processingTime,
        risk_count: risks.length,
        intervention_count: interventions.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('v4 diagnose error:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal engine error',
    }, 500)
  }
})

// ============================================================
// GET /api/v4/archetypes — 8アーキタイプ一覧
// ============================================================
v4Api.get('/archetypes', (c) => {
  const archetypes = Object.values(ARCHETYPES).map(a => ({
    id: a.id,
    name_ja: a.name_ja,
    name_en: a.name_en,
    presence: a.presence,
    perspectives: a.perspectives,
    response: a.response,
    axis_levels: a.axis_levels,
    estimated_frequency: a.estimated_frequency,
  }))

  return c.json({
    success: true,
    data: archetypes,
    meta: {
      engine_version: 'v4.0',
      description: '12理論統合因果モデルに基づく8つの学習者の姿',
    },
  })
})

// ============================================================
// GET /api/v4/schema — APIスキーマ（サンプルプロファイル付き）
// ============================================================
v4Api.get('/schema', (c) => {
  return c.json({
    success: true,
    data: {
      description: 'v4 統合制御エンジン API — 12理論統合因果モデル',
      endpoints: {
        'POST /api/v4/compute': {
          description: '統合制御パラメータの算出（メインAPI）',
          body: {
            profiles: '12理論の完全なプロファイル (AllTheoryProfiles) またはundefined（デフォルト値使用）',
            quick_params: '簡易パラメータ（cognitive_autonomy, emotional_stability 等）',
            behavior: 'リアルタイム行動データ (RealtimeBehaviorData)',
          },
          response: 'controls, archetype, axes, affect_state, reasoning',
        },
        'POST /api/v4/analyze': {
          description: '個別エンジン分析（F1〜F12 各視座の詳細）',
          body: '同上',
          response: 'archetype, axes, analysis (F1〜F12 各エンジンの分析結果)',
        },
        'POST /api/v4/diagnose': {
          description: 'スパイラル検出、欲求バランス、介入提案',
          body: '同上',
          response: 'diagnosis, risks, interventions, causal_chain',
        },
        'GET /api/v4/archetypes': {
          description: '8アーキタイプ一覧',
        },
        'GET /api/v4/schema': {
          description: 'このスキーマ情報',
        },
      },
      sample_request: {
        quick_params: {
          cognitive_autonomy: 50,
          emotional_stability: 60,
          strategic_maturity: 45,
          motivational_energy: 55,
          anxiety: 35,
          independence: 50,
          prior_knowledge: 50,
        },
        behavior: {
          consecutive_successes: 2,
          consecutive_errors: 0,
          recent_accuracy: 0.65,
          recent_response_time_ms: 12000,
          hint_usage_count: 1,
          idle_time_seconds: 0,
          estimated_affect: { arousal: 55, valence: 25 },
          current_srl_phase: 'performance',
          session_duration_minutes: 15,
          current_problem_difficulty: 50,
        },
      },
      effect_sizes: EFFECT_SIZES,
      influence_matrix: INFLUENCE_MATRIX,
    },
  })
})

export { v4Api }
