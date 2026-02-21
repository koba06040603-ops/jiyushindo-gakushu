/**
 * v4統合制御エンジン × 学習カード生成 統合レイヤー
 * 
 * F-1: D1データ → AllTheoryProfiles 変換
 * F-2: D1データ → RealtimeBehaviorData 変換
 * F-3: IntegratedControlParameters → Geminiプロンプト注入
 * F-4: v4制御パラメータ → カード構造テンプレート分岐
 * F-5: リアルタイム適応ループ（解答後v4再計算 → 次カードパラメータ調整）
 * F-6: APIエンドポイント（テスト・検証用含む）
 */

import { Hono } from 'hono'
import {
  computeIntegratedControls,
  computeFundamentalAxes,
  understandCurrentPresence,
  getArchetypeDefaults,
  ARCHETYPES,
  assessNeedSatisfaction,
  detectMotivationFeedbackLoop,
  detectSRLPhase,
  assessAdaptationQuality,
  executeAffectGating,
} from './lib/v4-engine'

import type {
  AllTheoryProfiles,
  RealtimeBehaviorData,
  IntegratedControlParameters,
  FundamentalAxes,
  ArchetypeId,
  F1_SensoryProfile,
  F2_IntelligenceProfile,
  F3_ExperientialProfile,
  F4_AptitudeProfile,
  F5_SRLProfile,
  F6_StrategyProfile,
  F7_ScaffoldProfile,
  F8_MotivationProfile,
  F9_MetacognitiveProfile,
  F10_DomainProfile,
  F11_AuthenticProfile,
  F12_AffectProfile,
} from './lib/v4-engine'

// ============================================================
// F-1: D1データ → AllTheoryProfiles 変換
// ============================================================

/** D1から取得した児童の生データ型定義 */
interface StudentRawData {
  // initial_diagnostics
  diagnosis?: {
    learning_style_dominant: string      // visual/auditory/kinesthetic/read_write/balanced
    learning_style_counts?: string       // JSON: {"visual":2,"kinesthetic":1,...}
    resilience: number                   // 1-5
    error_strategy: string               // retry/hint/friend/skip
    preferred_pace: string               // slow/steady/fast
    prior_knowledge: number              // 1-5
    subject_affinity: number             // 1-5
    raw_answers?: string                 // JSON
  }
  // student_card_answers (集約済み)
  answerStats?: {
    total_answers: number
    correct_count: number
    avg_time_seconds: number
    hint_used_count: number
    recent_streak_correct: number
    recent_streak_error: number
    easy_correct_rate: number            // 0-1
    hard_correct_rate: number            // 0-1
  }
  // unit_reflections (最新)
  reflection?: {
    metacognition_score: number | null    // 0-100
    planning_score: number | null         // 0-100
    method_score: number | null           // 0-100
    collaboration_score: number | null    // 0-100
    persistence_score: number | null      // 0-100
    autonomy_score: number | null         // 0-100
    goal_achievement?: string
    effective_methods?: string
  }
  // hourly_reflections (集約済み)
  hourlyReflections?: {
    avg_confidence: number               // 1-5
    avg_reflection_quality: number       // 1-5
    friend_learning_rate: number         // 0-1 (友達と学んだ割合)
    total_hours: number
  }
  // test_study_logs (集約済み)
  testStudy?: {
    avg_confidence_after: number         // 1-5
    avg_focus_level: number              // 1-5
    avg_fatigue_level: number            // 1-5
    total_study_minutes: number
  }
  // metacognition_logs (最新)
  metacognition?: {
    confidence_level: number             // 1-5
    understanding_level: number          // 1-5
    needs_review: boolean
  }
  // test_performance_feedback (最新)
  testPerformance?: {
    score: number
    max_score: number
    weakness_areas?: string[]
  }
  // 学年
  grade_level?: number
}

/** 1-5スケール → 0-100スケール変換（クランプ付き） */
function scale5to100(v: number | null | undefined, fallback = 50): number {
  if (v == null || isNaN(v)) return fallback
  return Math.max(0, Math.min(100, (v - 1) * 25))
}

/** 0-1スケール → 0-100スケール変換 */
function scale01to100(v: number | null | undefined, fallback = 50): number {
  if (v == null || isNaN(v)) return fallback
  return Math.max(0, Math.min(100, v * 100))
}

/** クランプ */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/**
 * F-1 メイン: D1の児童データ → 12理論プロファイルに変換
 * 
 * マッピング設計思想:
 *   - 診断データがない場合はデフォルト値（中央値）にフォールバック
 *   - 各D1フィールドから最も意味的に近い理論パラメータへ変換
 *   - 複数のD1データを組み合わせて一つの理論パラメータを算出する場合あり
 */
export function buildProfilesFromD1(raw: StudentRawData): AllTheoryProfiles {
  const diag = raw.diagnosis
  const stats = raw.answerStats
  const refl = raw.reflection
  const hourly = raw.hourlyReflections
  const test = raw.testStudy
  const meta = raw.metacognition
  const perf = raw.testPerformance

  // --- 中間変数: 複数箇所で使う算出値 ---
  const correctRate = stats ? stats.correct_count / Math.max(1, stats.total_answers) : 0.5
  const priorKnowledge = scale5to100(diag?.prior_knowledge, 50)
  const resilience = scale5to100(diag?.resilience, 50)
  const subjectAffinity = scale5to100(diag?.subject_affinity, 50)
  const metacogScore = refl?.metacognition_score ?? 50
  const planningScore = refl?.planning_score ?? 50
  const autonomyScore = refl?.autonomy_score ?? 50
  const persistenceScore = refl?.persistence_score ?? 50
  const methodScore = refl?.method_score ?? 50
  const collabScore = refl?.collaboration_score ?? 50
  const avgConfidence = hourly ? scale5to100(hourly.avg_confidence, 50) : 50
  const avgReflQuality = hourly ? scale5to100(hourly.avg_reflection_quality, 50) : 50
  const testConfidence = test ? scale5to100(test.avg_confidence_after, 50) : 50
  const testFocus = test ? scale5to100(test.avg_focus_level, 50) : 50
  const testFatigue = test ? scale5to100(test.avg_fatigue_level, 50) : 50

  // 学習スタイルカウントのパース
  let styleCounts: Record<string, number> = {}
  if (diag?.learning_style_counts) {
    try { styleCounts = JSON.parse(diag.learning_style_counts) } catch {}
  }
  const totalStyleQ = Math.max(1, Object.values(styleCounts).reduce((s, v) => s + v, 0))

  // ============ F1: 感覚チャネル ============
  // VARK learning_style_counts → 各チャネルの効率
  const F1: F1_SensoryProfile = {
    visual_processing_efficiency: clamp(
      (styleCounts.visual || 0) / totalStyleQ * 100 * 1.5 + 30, 0, 100),
    auditory_processing_efficiency: clamp(
      (styleCounts.auditory || 0) / totalStyleQ * 100 * 1.5 + 30, 0, 100),
    reading_processing_efficiency: clamp(
      (styleCounts.read_write || 0) / totalStyleQ * 100 * 1.5 + 30, 0, 100),
    kinesthetic_processing_efficiency: clamp(
      (styleCounts.kinesthetic || 0) / totalStyleQ * 100 * 1.5 + 30, 0, 100),
    multimodal_index: diag?.learning_style_dominant === 'balanced'
      ? 75
      : clamp(40 + Object.keys(styleCounts).filter(k => (styleCounts[k] || 0) > 0).length * 10, 30, 90),
  }
  // 診断データがない場合のフォールバック（均等化）
  if (!diag) {
    F1.visual_processing_efficiency = 55
    F1.auditory_processing_efficiency = 50
    F1.reading_processing_efficiency = 55
    F1.kinesthetic_processing_efficiency = 45
    F1.multimodal_index = 55
  }

  // ============ F2: 多元的知能 ============
  // 直接の知能テストデータがないため、学習スタイル・正答率・教科好感度から推定
  const baseIQ = 50 + (correctRate - 0.5) * 30  // 正答率から基礎知的水準を推定
  const F2: F2_IntelligenceProfile = {
    linguistic: clamp(baseIQ + (F1.reading_processing_efficiency - 50) * 0.3, 20, 90),
    logical_mathematical: clamp(baseIQ + (correctRate * 20 - 10), 20, 90),
    spatial: clamp(baseIQ + (F1.visual_processing_efficiency - 50) * 0.3, 20, 90),
    bodily_kinesthetic: clamp(baseIQ + (F1.kinesthetic_processing_efficiency - 50) * 0.3, 20, 90),
    musical: clamp(baseIQ - 10 + subjectAffinity * 0.2, 20, 80),
    interpersonal: clamp(collabScore * 0.7 + (hourly?.friend_learning_rate ?? 0.3) * 40, 20, 90),
    intrapersonal: clamp(metacogScore * 0.5 + autonomyScore * 0.3 + avgReflQuality * 0.2, 20, 90),
    naturalist: clamp(baseIQ - 5, 20, 80),
    growth_mindset: clamp(resilience * 0.5 + persistenceScore * 0.3 + subjectAffinity * 0.2, 20, 95),
  }

  // ============ F3: 経験変容学習 ============
  // Kolb学習スタイル: VARK+正答率+振り返り品質から推定
  const F3: F3_ExperientialProfile = {
    ce_preference: clamp(F1.kinesthetic_processing_efficiency * 0.5 + subjectAffinity * 0.3, 20, 90),
    ro_preference: clamp(avgReflQuality * 0.6 + metacogScore * 0.3, 20, 90),
    ac_preference: clamp(F2.logical_mathematical * 0.5 + priorKnowledge * 0.3, 20, 90),
    ae_preference: clamp(resilience * 0.4 + autonomyScore * 0.3 + (diag?.preferred_pace === 'fast' ? 20 : 0), 20, 90),
    cycle_completion_rate: clamp(
      (avgReflQuality / 100 * 0.4) + (correctRate * 0.3) + (planningScore / 100 * 0.3), 0, 1),
    dominant_style: determineDominantStyle(
      F1.kinesthetic_processing_efficiency * 0.5 + subjectAffinity * 0.3,
      avgReflQuality * 0.6 + metacogScore * 0.3,
      F2.logical_mathematical * 0.5 + priorKnowledge * 0.3,
      resilience * 0.4 + autonomyScore * 0.3
    ),
  }

  // ============ F4: 適性×指導交互作用 ============
  const anxietyLevel = clamp(
    100 - avgConfidence * 0.3 - resilience * 0.3 - testConfidence * 0.2 - subjectAffinity * 0.2,
    5, 95
  )
  const F4: F4_AptitudeProfile = {
    prior_knowledge: priorKnowledge,
    general_cognitive_ability: clamp(correctRate * 70 + priorKnowledge * 0.3, 20, 95),
    anxiety_level: anxietyLevel,
    independence_level: clamp(autonomyScore * 0.5 + (diag?.preferred_pace === 'fast' ? 15 : diag?.preferred_pace === 'slow' ? -10 : 0) + persistenceScore * 0.3, 10, 95),
    locus_of_control: clamp(
      (diag?.error_strategy === 'retry' ? 70 : diag?.error_strategy === 'hint' ? 55 : diag?.error_strategy === 'friend' ? 45 : 30)
      + resilience * 0.2, 20, 90),
  }

  // ============ F5: 自己調整学習 ============
  const devLevel = autonomyScore >= 75 ? 'self_regulation' as const :
    autonomyScore >= 50 ? 'self_control' as const :
    autonomyScore >= 25 ? 'emulation' as const : 'observation' as const

  const F5: F5_SRLProfile = {
    forethought: {
      task_analysis: clamp(planningScore * 0.6 + metacogScore * 0.3, 5, 95),
      goal_setting: clamp(planningScore * 0.5 + avgReflQuality * 0.3, 5, 95),
      strategic_planning: clamp(planningScore * 0.5 + methodScore * 0.3, 5, 95),
      self_efficacy: clamp(avgConfidence * 0.4 + resilience * 0.3 + correctRate * 30, 5, 95),
      outcome_expectation: clamp(subjectAffinity * 0.4 + correctRate * 40 + avgConfidence * 0.2, 5, 95),
      intrinsic_interest: clamp(subjectAffinity * 0.5 + resilience * 0.2 + persistenceScore * 0.2, 5, 95),
    },
    performance: {
      attention_focusing: clamp(testFocus * 0.4 + (100 - testFatigue) * 0.3 + persistenceScore * 0.2, 5, 95),
      self_instruction: clamp(autonomyScore * 0.5 + methodScore * 0.3, 5, 95),
      task_strategy_use: clamp(methodScore * 0.5 + correctRate * 30 + planningScore * 0.2, 5, 95),
      self_monitoring: clamp(metacogScore * 0.5 + avgReflQuality * 0.3, 5, 95),
      metacognitive_awareness: clamp(metacogScore * 0.6 + avgReflQuality * 0.2 + (meta?.understanding_level ? scale5to100(meta.understanding_level) * 0.2 : 10), 5, 95),
    },
    self_reflection: {
      self_evaluation: clamp(metacogScore * 0.5 + avgReflQuality * 0.3, 5, 95),
      causal_attribution: clamp(
        (diag?.error_strategy === 'retry' ? 65 : diag?.error_strategy === 'hint' ? 55 : 40)
        + avgReflQuality * 0.2, 10, 90),
      self_satisfaction: clamp(avgConfidence * 0.4 + subjectAffinity * 0.3 + correctRate * 25, 5, 95),
      adaptive_inference: clamp(methodScore * 0.5 + autonomyScore * 0.3, 5, 95),
    },
    developmental_level: devLevel,
  }

  // ============ F6: 認知方略 ============
  const masteryLevel = clamp(correctRate * 80 + priorKnowledge * 0.2, 0, 100)
  const F6: F6_StrategyProfile = {
    retrieval_practice_readiness: clamp(masteryLevel * 0.6 + methodScore * 0.3, 5, 95),
    spacing_optimal_gap: correctRate >= 0.8 ? 5 : correctRate >= 0.6 ? 3 : 1,
    interleaving_readiness: masteryLevel >= 50 && autonomyScore >= 40,
    elaboration_prior_knowledge: priorKnowledge,
    mastery_level_for_current_unit: masteryLevel,
  }

  // ============ F7: 足場 ============
  const performance = clamp(correctRate * 100, 0, 100)
  const zpdLower = clamp(performance - 15, 0, 85)
  const zpdUpper = clamp(performance + 25, 15, 100)
  const F7: F7_ScaffoldProfile = {
    zpd_lower_bound: zpdLower,
    zpd_upper_bound: zpdUpper,
    zpd_width: zpdUpper - zpdLower,
    current_performance: performance,
    scaffold_dependency: clamp(80 - autonomyScore * 0.6 - correctRate * 20, 0, 100),
    consecutive_success: stats?.recent_streak_correct ?? 0,
    consecutive_failure: stats?.recent_streak_error ?? 0,
  }

  // ============ F8: 動機づけ ============
  const motivContinuum = clamp(subjectAffinity * 0.3 + resilience * 0.3 + autonomyScore * 0.2 + avgConfidence * 0.2, 5, 95)
  const F8: F8_MotivationProfile = {
    autonomy_satisfaction: clamp(autonomyScore * 0.6 + F4.independence_level * 0.3, 5, 95),
    competence_satisfaction: clamp(avgConfidence * 0.4 + correctRate * 40 + testConfidence * 0.2, 5, 95),
    relatedness_satisfaction: clamp(collabScore * 0.5 + (hourly?.friend_learning_rate ?? 0.3) * 60, 10, 95),
    motivation_quality: motivContinuum >= 70 ? 'intrinsic' :
      motivContinuum >= 50 ? 'identified' :
      motivContinuum >= 30 ? 'introjected' : 'external',
    motivation_continuum_score: motivContinuum,
    isolated_autonomy: F4.independence_level > 70 && collabScore < 30,
    fragile_competence: avgConfidence > 60 && correctRate < 0.4,
    surface_autonomy: F4.independence_level > 60 && metacogScore < 30,
  }

  // ============ F9: メタ認知 ============
  const F9: F9_MetacognitiveProfile = {
    metacognitive_knowledge: clamp(metacogScore * 0.6 + methodScore * 0.3, 5, 95),
    metacognitive_regulation: clamp(metacogScore * 0.4 + planningScore * 0.3 + avgReflQuality * 0.2, 5, 95),
    critical_thinking: clamp(methodScore * 0.4 + avgReflQuality * 0.3 + correctRate * 20, 5, 90),
    creative_thinking: clamp(subjectAffinity * 0.3 + resilience * 0.3 + autonomyScore * 0.2, 5, 90),
  }

  // ============ F10: 領域固有 ============
  const F10: F10_DomainProfile = {
    domain_knowledge_stage: priorKnowledge >= 70 ? 'proficiency' :
      priorKnowledge >= 40 ? 'competence' : 'acclimation',
    misconceptions: raw.testPerformance?.weakness_areas ?? [],
    knowledge_structure_depth: clamp(priorKnowledge * 0.6 + correctRate * 30, 5, 95),
  }

  // ============ F11: 真正文脈 ============
  const F11: F11_AuthenticProfile = {
    personal_relevance: clamp(subjectAffinity * 0.5 + resilience * 0.2 + motivContinuum * 0.2, 5, 95),
    real_world_connection_awareness: clamp(avgReflQuality * 0.4 + subjectAffinity * 0.3, 10, 80),
    community_participation: clamp(collabScore * 0.5 + (hourly?.friend_learning_rate ?? 0.3) * 50, 5, 85),
  }

  // ============ F12: 感情-認知統合 ============
  const F12: F12_AffectProfile = {
    current_arousal: clamp(
      50 + (resilience - 50) * 0.3 + (testFatigue > 60 ? -15 : 0) + (correctRate > 0.7 ? 10 : correctRate < 0.3 ? -10 : 0),
      15, 90),
    current_valence: clamp(
      (avgConfidence - 50) * 0.4 + (correctRate - 0.5) * 40 + (subjectAffinity - 50) * 0.3,
      -80, 80),
    academic_enjoyment: clamp(subjectAffinity * 0.5 + avgConfidence * 0.3 + correctRate * 20, 5, 95),
    academic_anxiety: anxietyLevel,
    academic_boredom: clamp(
      (correctRate > 0.9 ? 30 : 10) + (100 - subjectAffinity) * 0.3 + (testFatigue > 60 ? 20 : 0),
      5, 80),
    flow_state_probability: clamp(
      (correctRate >= 0.6 && correctRate <= 0.85 ? 0.4 : 0.15)
      + (avgConfidence > 60 ? 0.1 : 0) + (testFocus > 60 ? 0.1 : 0)
      + (anxietyLevel < 40 ? 0.1 : 0), 0.05, 0.9),
  }

  return { F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12 }
}

/** Kolb学習スタイル判定ヘルパー */
function determineDominantStyle(ce: number, ro: number, ac: number, ae: number):
  'diverging' | 'assimilating' | 'converging' | 'accommodating' {
  const acCe = ac - ce  // 抽象-具体軸
  const aeRo = ae - ro  // 実験-観察軸
  if (acCe <= 0 && aeRo <= 0) return 'diverging'
  if (acCe > 0 && aeRo <= 0) return 'assimilating'
  if (acCe > 0 && aeRo > 0) return 'converging'
  return 'accommodating'
}

// ============================================================
// F-1 補助: D1からStudentRawDataをクエリ構築
// ============================================================

/**
 * D1データベースから児童のプロファイル構築に必要なデータを一括取得
 */
export async function fetchStudentRawData(
  DB: D1Database,
  studentId: number,
  curriculumId?: number,
): Promise<StudentRawData> {
  // 並列クエリ実行
  const [diagResult, answerResult, reflResult, hourlyResult, testResult, metaResult, perfResult] = await Promise.all([
    // 初期診断（最新1件）
    DB.prepare(
      'SELECT * FROM initial_diagnostics WHERE student_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(studentId).first().catch(() => null),

    // 解答統計（student_card_answers集約）
    curriculumId
      ? DB.prepare(`
          SELECT 
            COUNT(*) as total_answers,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
            AVG(answer_time_seconds) as avg_time_seconds,
            SUM(CASE WHEN hint_used = 1 THEN 1 ELSE 0 END) as hint_used_count
          FROM student_card_answers 
          WHERE student_id = ? AND curriculum_id = ?
        `).bind(studentId, curriculumId).first().catch(() => null)
      : DB.prepare(`
          SELECT 
            COUNT(*) as total_answers,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
            AVG(answer_time_seconds) as avg_time_seconds,
            SUM(CASE WHEN hint_used = 1 THEN 1 ELSE 0 END) as hint_used_count
          FROM student_card_answers 
          WHERE student_id = ?
        `).bind(studentId).first().catch(() => null),

    // 振り返り（最新1件）
    DB.prepare(
      'SELECT * FROM unit_reflections WHERE student_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(studentId).first().catch(() => null),

    // 時間別振り返り（集約）
    DB.prepare(`
      SELECT 
        AVG(confidence_rating) as avg_confidence,
        AVG(reflection_quality_level) as avg_reflection_quality,
        AVG(CASE WHEN learned_with_friend = 1 THEN 1.0 ELSE 0.0 END) as friend_learning_rate,
        COUNT(*) as total_hours
      FROM hourly_reflections WHERE student_id = ?
    `).bind(studentId).first().catch(() => null),

    // テスト学習ログ（集約）
    DB.prepare(`
      SELECT 
        AVG(confidence_after) as avg_confidence_after,
        AVG(focus_level) as avg_focus_level,
        AVG(fatigue_level) as avg_fatigue_level,
        SUM(study_minutes) as total_study_minutes
      FROM test_study_logs WHERE student_id = ?
    `).bind(studentId).first().catch(() => null),

    // メタ認知ログ（最新1件）
    DB.prepare(
      'SELECT * FROM metacognition_logs WHERE student_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(studentId).first().catch(() => null),

    // テスト結果（最新1件）
    DB.prepare(
      'SELECT * FROM test_performance_feedback WHERE student_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(studentId).first().catch(() => null),
  ])

  // 連続正解・連続不正解を算出（直近20件から）
  let recentStreak = { correct: 0, error: 0 }
  try {
    const recentAnswers = curriculumId
      ? await DB.prepare(`
          SELECT is_correct FROM student_card_answers 
          WHERE student_id = ? AND curriculum_id = ?
          ORDER BY created_at DESC LIMIT 20
        `).bind(studentId, curriculumId).all()
      : await DB.prepare(`
          SELECT is_correct FROM student_card_answers 
          WHERE student_id = ?
          ORDER BY created_at DESC LIMIT 20
        `).bind(studentId).all()
    
    const results = (recentAnswers.results || []) as any[]
    let streakCorrect = 0, streakError = 0
    for (const r of results) {
      if (r.is_correct === 1) { streakCorrect++; if (streakError > 0) break }
      else { streakError++; if (streakCorrect > 0) break }
    }
    recentStreak = { correct: streakCorrect, error: streakError }
  } catch {}

  // 難易度別正答率
  let easyCorrectRate = 0.5, hardCorrectRate = 0.5
  try {
    const diffStats = curriculumId
      ? await DB.prepare(`
          SELECT difficulty_felt,
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM student_card_answers 
          WHERE student_id = ? AND curriculum_id = ? AND difficulty_felt IS NOT NULL
          GROUP BY difficulty_felt
        `).bind(studentId, curriculumId).all()
      : await DB.prepare(`
          SELECT difficulty_felt,
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM student_card_answers 
          WHERE student_id = ? AND difficulty_felt IS NOT NULL
          GROUP BY difficulty_felt
        `).bind(studentId).all()
    
    for (const row of (diffStats.results || []) as any[]) {
      if (row.difficulty_felt === 'easy' && row.total > 0) easyCorrectRate = row.correct / row.total
      if (row.difficulty_felt === 'hard' && row.total > 0) hardCorrectRate = row.correct / row.total
    }
  } catch {}

  // weakness_areasのパース
  let weaknessAreas: string[] = []
  if (perfResult && (perfResult as any).weakness_areas) {
    try { weaknessAreas = JSON.parse((perfResult as any).weakness_areas) } catch {}
  }

  const result: StudentRawData = {}

  if (diagResult) {
    const d = diagResult as any
    result.diagnosis = {
      learning_style_dominant: d.learning_style_dominant || 'balanced',
      learning_style_counts: d.learning_style_counts,
      resilience: d.resilience ?? 3,
      error_strategy: d.error_strategy || 'hint',
      preferred_pace: d.preferred_pace || 'steady',
      prior_knowledge: d.prior_knowledge ?? 3,
      subject_affinity: d.subject_affinity ?? 3,
      raw_answers: d.raw_answers,
    }
  }

  if (answerResult && (answerResult as any).total_answers > 0) {
    const a = answerResult as any
    result.answerStats = {
      total_answers: a.total_answers || 0,
      correct_count: a.correct_count || 0,
      avg_time_seconds: a.avg_time_seconds || 15,
      hint_used_count: a.hint_used_count || 0,
      recent_streak_correct: recentStreak.correct,
      recent_streak_error: recentStreak.error,
      easy_correct_rate: easyCorrectRate,
      hard_correct_rate: hardCorrectRate,
    }
  }

  if (reflResult) {
    const r = reflResult as any
    result.reflection = {
      metacognition_score: r.metacognition_score,
      planning_score: r.planning_score,
      method_score: r.method_score,
      collaboration_score: r.collaboration_score,
      persistence_score: r.persistence_score,
      autonomy_score: r.autonomy_score,
      goal_achievement: r.goal_achievement,
      effective_methods: r.effective_methods,
    }
  }

  if (hourlyResult && (hourlyResult as any).total_hours > 0) {
    const h = hourlyResult as any
    result.hourlyReflections = {
      avg_confidence: h.avg_confidence ?? 3,
      avg_reflection_quality: h.avg_reflection_quality ?? 3,
      friend_learning_rate: h.friend_learning_rate ?? 0.3,
      total_hours: h.total_hours || 0,
    }
  }

  if (testResult && (testResult as any).total_study_minutes > 0) {
    const t = testResult as any
    result.testStudy = {
      avg_confidence_after: t.avg_confidence_after ?? 3,
      avg_focus_level: t.avg_focus_level ?? 3,
      avg_fatigue_level: t.avg_fatigue_level ?? 3,
      total_study_minutes: t.total_study_minutes || 0,
    }
  }

  if (metaResult) {
    const m = metaResult as any
    result.metacognition = {
      confidence_level: m.confidence_level ?? 3,
      understanding_level: m.understanding_level ?? 3,
      needs_review: m.needs_review === 1,
    }
  }

  if (perfResult) {
    const p = perfResult as any
    result.testPerformance = {
      score: p.score ?? 0,
      max_score: p.max_score ?? 100,
      weakness_areas: weaknessAreas,
    }
  }

  return result
}

// ============================================================
// F-2: D1データ → RealtimeBehaviorData 変換
// ============================================================

/**
 * 直近のセッションデータから行動データを構築
 */
export async function buildBehaviorFromD1(
  DB: D1Database,
  studentId: number,
  curriculumId?: number,
  sessionDurationMinutes?: number,
): Promise<RealtimeBehaviorData> {
  // 直近の解答データ（最新20件）
  let recentAnswers: any[] = []
  try {
    const q = curriculumId
      ? await DB.prepare(`
          SELECT is_correct, answer_time_seconds, hint_used, created_at
          FROM student_card_answers 
          WHERE student_id = ? AND curriculum_id = ?
          ORDER BY created_at DESC LIMIT 20
        `).bind(studentId, curriculumId).all()
      : await DB.prepare(`
          SELECT is_correct, answer_time_seconds, hint_used, created_at
          FROM student_card_answers 
          WHERE student_id = ?
          ORDER BY created_at DESC LIMIT 20
        `).bind(studentId).all()
    recentAnswers = (q.results || []) as any[]
  } catch {}

  // 連続正解・不正解の算出
  let consecutiveSuccesses = 0, consecutiveErrors = 0
  for (const a of recentAnswers) {
    if (a.is_correct === 1) {
      if (consecutiveErrors > 0) break
      consecutiveSuccesses++
    } else {
      if (consecutiveSuccesses > 0) break
      consecutiveErrors++
    }
  }

  // 正答率
  const correctCount = recentAnswers.filter(a => a.is_correct === 1).length
  const recentAccuracy = recentAnswers.length > 0 ? correctCount / recentAnswers.length : 0.5

  // 平均回答時間
  const avgTime = recentAnswers.length > 0
    ? recentAnswers.reduce((s, a) => s + (a.answer_time_seconds || 15), 0) / recentAnswers.length * 1000
    : 15000

  // ヒント使用回数
  const hintCount = recentAnswers.filter(a => a.hint_used === 1).length

  // アイドル時間の推定（最新の解答時間が長い場合）
  const latestTime = recentAnswers.length > 0 ? (recentAnswers[0].answer_time_seconds || 15) : 0
  const idleTime = latestTime > 60 ? latestTime - 30 : 0

  // SRL位相の推定
  let srlPhase: 'forethought' | 'performance' | 'self_reflection' = 'performance'
  if (sessionDurationMinutes != null) {
    if (sessionDurationMinutes < 2) srlPhase = 'forethought'
    else if (recentAnswers.length > 0 && recentAnswers.length % 5 === 0) srlPhase = 'self_reflection'
  }

  // 感情の推定
  let arousal = 55, valence = 20
  if (consecutiveErrors >= 3) { arousal = 70; valence = -30 }
  else if (consecutiveSuccesses >= 3) { arousal = 60; valence = 40 }
  else if (recentAccuracy < 0.3) { arousal = 65; valence = -20 }
  else if (recentAccuracy > 0.8) { arousal = 55; valence = 30 }

  // 現在の問題難易度の推定
  let currentDifficulty = 50
  if (recentAccuracy > 0.8) currentDifficulty = 40
  else if (recentAccuracy < 0.3) currentDifficulty = 70

  return {
    consecutive_successes: consecutiveSuccesses,
    consecutive_errors: consecutiveErrors,
    recent_accuracy: recentAccuracy,
    recent_response_time_ms: Math.round(avgTime),
    hint_usage_count: hintCount,
    idle_time_seconds: idleTime,
    estimated_affect: { arousal, valence },
    current_srl_phase: srlPhase,
    session_duration_minutes: sessionDurationMinutes ?? 15,
    current_problem_difficulty: currentDifficulty,
  }
}

// ============================================================
// F-3: IntegratedControlParameters → Geminiプロンプト注入
// ============================================================

/**
 * v4制御パラメータからGeminiに注入するプロンプトセクションを生成
 */
export function buildV4PromptSection(
  controls: IntegratedControlParameters,
  archetype: ArchetypeId,
  axes: FundamentalAxes,
): string {
  const arch = ARCHETYPES[archetype]

  const channelJa: Record<string, string> = {
    visual: '視覚（図解・色分け・イラスト）',
    auditory: '聴覚（音読向き文章・リズム・音声説明）',
    reading: 'テキスト（読み書き中心・説明文）',
    kinesthetic: '身体感覚（操作的活動・動作・実験）',
  }

  const kolbJa: Record<string, string> = {
    CE: '具体的経験 → まず体験させる',
    RO: '内省的観察 → まず観察・比較させる',
    AC: '抽象的概念化 → まずルールや法則を示す',
    AE: '能動的実験 → まず試行錯誤させる',
  }

  const retrievalJa: Record<string, string> = {
    recognition: '再認型（選択式・マッチング）',
    cued_recall: '手がかり再生型（穴埋め・キーワード提示）',
    free_recall: '自由再生型（白紙から想起）',
  }

  const elaborationJa: Record<string, string> = {
    why: '「なぜ？」型 — 理由を考えさせる',
    how: '「どうやって？」型 — 手順を考えさせる',
    compare: '「比較」型 — 違いや共通点を見つけさせる',
    connect: '「つなぐ」型 — 既習事項との関連を見つけさせる',
    none: '精緻化なし（基礎定着段階）',
  }

  const goalPromptJa: Record<string, string> = {
    none: 'なし（目標は暗黙）',
    template: 'テンプレート（「今日のめあて: ___」型）',
    example: '例示（「例えば "分数のたし算ができる" みたいに書こう」型）',
    guided: 'ガイド付き（AIが段階的に目標設定を支援）',
  }

  const reflectionJa: Record<string, string> = {
    none: 'なし',
    binary: '二択（「できた？」Yes/No）',
    scaled: 'スケール（5段階自己評価）',
    open_ended: '自由記述（「今日わかったこと、むずかしかったことを書こう」）',
  }

  const demoJa: Record<string, string> = {
    none: 'なし（自力解決を促す）',
    partial: '部分的（途中まで見せる）',
    full: '完全（解法全体を見せる）',
  }

  const emotionJa: Record<string, string> = {
    encouraging: '励まし系（「いいね！」「その調子！」）',
    calming: '安心系（「大丈夫だよ」「ゆっくりでいいよ」）',
    neutral: '中立（過剰な感情表現を控える）',
    celebrating: '祝福系（「すごい！」「やったね！」）',
  }

  // ZPD位置の解釈
  const zpdDesc = controls.structure.difficulty_zpd_position <= 0.3 ? '低め（確実に解ける問題中心）'
    : controls.structure.difficulty_zpd_position <= 0.5 ? 'やや低め（少し手を伸ばせば届く）'
    : controls.structure.difficulty_zpd_position <= 0.7 ? '中程度（適度な挑戦）'
    : controls.structure.difficulty_zpd_position <= 0.85 ? 'やや高め（頑張れば届く）'
    : '高め（挑戦的）'

  const structureDesc = controls.structure.structure_level >= 0.7 ? '高構造（手順・枠組みを明示）'
    : controls.structure.structure_level >= 0.4 ? '中構造（ある程度の自由度あり）'
    : '低構造（自由度が高い・探究的）'

  return `
【★ v4統合制御エンジンによる個別最適化指示 ★】
この児童は12の理論的視座による分析の結果、「${arch.name_ja}」(${arch.name_en}) タイプです。
${arch.presence}

■ 基幹軸スコア
  - 認知的自律性: ${axes.cognitive_autonomy}/100
  - 情緒的安定性: ${axes.emotional_stability}/100
  - 方略的成熟度: ${axes.strategic_maturity}/100
  - 動機的エネルギー: ${axes.motivational_energy}/100

■ 提示方法（この子の「受け取り方」に合わせる）
  - 主要チャネル: ${channelJa[controls.presentation.entry_channel] || controls.presentation.entry_channel}
  - 符号化チャネル: ${controls.presentation.encoding_channels.join(', ')}
  - 概念入口（知能）: ${controls.presentation.concept_entry_intelligence}
  - 経験学習の入口: ${kolbJa[controls.presentation.kolb_entry_phase] || controls.presentation.kolb_entry_phase}
  ${controls.presentation.domain_thinking_prompt ? `- 教科固有思考: ${controls.presentation.domain_thinking_prompt}` : ''}
  ${controls.presentation.real_world_connection ? `- 実世界接続: ${controls.presentation.real_world_connection}` : ''}

■ 難易度・構造（この子が「手を伸ばせば届く」位置に設定）
  - 構造レベル: ${(controls.structure.structure_level * 100).toFixed(0)}% — ${structureDesc}
  - ZPD位置: ${(controls.structure.difficulty_zpd_position * 100).toFixed(0)}% — ${zpdDesc}
  - 解法経路の開放度: ${(controls.structure.solution_path_openness * 100).toFixed(0)}%
  - 誤答許容度: ${(controls.structure.error_tolerance * 100).toFixed(0)}%

■ 足場かけ（この子が必要としている支援）
  - 注意喚起: ${controls.scaffold.recruitment ? '有' : '不要'}
  - 見本提示: ${demoJa[controls.scaffold.demonstration_level]}
  - フラストレーション制御: ${controls.scaffold.frustration_control ? '有（穏やかに支援）' : '不要'}
  - 励まし: ${controls.scaffold.encouragement ? '積極的に' : '控えめに'}
  - やさしい言葉遣い: ${controls.scaffold.soft_language ? '使用する' : '通常'}
  - ヒント先行度: ${(controls.scaffold.hint_proactiveness * 100).toFixed(0)}%

■ 認知方略（この子の「覚え方」「学び方」に合わせる）
  - 検索練習: ${retrievalJa[controls.cognitive_strategy.retrieval_mode]}
  - フィードバック付き: ${controls.cognitive_strategy.retrieval_with_feedback ? 'はい' : 'いいえ'}
  - 間隔反復: ${controls.cognitive_strategy.spacing_interval_days}日間隔
  - インターリービング: ${controls.cognitive_strategy.interleaving_enabled ? '有効' : '無効'}
  - 精緻化: ${elaborationJa[controls.cognitive_strategy.elaboration_prompt_type]}

■ 自己調整学習（この子の「学びの舵取り」を支援）
  - 目標設定プロンプト: ${goalPromptJa[controls.srl.goal_prompt_type]}
  - 自己モニタリング間隔: ${controls.srl.self_monitoring_interval}問ごと
  - 振り返りプロンプト: ${reflectionJa[controls.srl.reflection_prompt_type]}
  - 帰属指導: ${controls.srl.attribution_guidance ? '方略帰属を促す（「やり方を変えればできる」）' : '不要'}
  - 思考発話モデリング: ${controls.srl.think_aloud_modeling ? '有（考え方の手本を見せる）' : '不要'}

■ 動機づけ（この子の「やる気」をどう支えるか）
  - 進捗表示: ${controls.motivation.progress_display === 'self_growth' ? '自己成長比較（過去の自分と比べる）' : 'なし'}
  - 言語スタイル: ${controls.motivation.language_style === 'inviting' ? '誘い型（「やってみよう」）' : '指示型（「やりなさい」）'}
  - 覚醒度調整: ${controls.motivation.arousal_regulation === 'increase' ? '上げる（チャレンジ的な課題）' : controls.motivation.arousal_regulation === 'decrease' ? '下げる（安心できる課題）' : '維持'}
  - 感情メッセージ: ${emotionJa[controls.motivation.emotional_message_type] || controls.motivation.emotional_message_type}
  - 選択+理由提示: ${controls.motivation.choice_with_rationale ? 'あり（「AとBどちらからやる？理由も教えて」）' : 'なし'}
  - マイクロ成功フィードバック: ${controls.motivation.micro_success_feedback ? 'あり（小さな正解ごとに即時称賛）' : '不要'}

${controls._teacher_alert ? '⚠️ 【教師アラート】この児童は教師の直接介入が推奨されます。' : ''}
${controls._human_intervention_recommended ? '🆘 【緊急】人的介入を推奨します。' : ''}

→ 上記の指示に従い、この児童に最適化された学習カードを生成してください。
  チャネルは「${channelJa[controls.presentation.entry_channel]}」を優先し、
  難易度は「${zpdDesc}」で、構造は「${structureDesc}」にしてください。
`.trim()
}

// ============================================================
// F-4: v4制御パラメータ → カードテンプレート分岐
// ============================================================

/** カード構造のテンプレート型定義 */
export interface CardTemplate {
  /** テンプレート名 */
  template_name: string
  /** メディアタイプの指定 */
  media_type: 'text_only' | 'illustrated' | 'manipulative' | 'audio_visual' | 'interactive'
  /** 問題形式 */
  question_format: 'multiple_choice' | 'fill_blank' | 'free_response' | 'sorting' | 'matching' | 'step_by_step'
  /** スキャフォールド構造 */
  scaffold_structure: {
    show_hint_upfront: boolean
    hint_levels: number            // ヒントの段階数 (0-3)
    show_worked_example: boolean
    show_partial_solution: boolean
    provide_checklist: boolean
  }
  /** 振り返り要素 */
  reflection_element: {
    type: 'none' | 'binary' | 'scale' | 'open' | 'guided'
    prompt_text?: string
  }
  /** 動機づけ要素 */
  motivation_element: {
    show_progress: boolean
    celebration_on_correct: boolean
    encouragement_on_error: boolean
    choice_offered: boolean
  }
  /** 精緻化プロンプト */
  elaboration?: {
    type: 'why' | 'how' | 'compare' | 'connect'
    prompt_text: string
  }
  /** 推奨カード枚数 */
  recommended_card_count: number
  /** 推奨時間（分/枚） */
  recommended_time_per_card: number
}

/**
 * F-4 メイン: v4制御パラメータからカードテンプレートを決定
 */
export function determineCardTemplate(
  controls: IntegratedControlParameters,
  archetype: ArchetypeId,
): CardTemplate {
  const ch = controls.presentation.entry_channel
  const structLevel = controls.structure.structure_level
  const zpd = controls.structure.difficulty_zpd_position
  const demo = controls.scaffold.demonstration_level

  // --- メディアタイプ ---
  let media_type: CardTemplate['media_type'] = 'text_only'
  if (ch === 'visual') media_type = 'illustrated'
  else if (ch === 'kinesthetic') media_type = 'manipulative'
  else if (ch === 'auditory') media_type = 'audio_visual'
  else if (ch === 'reading') media_type = 'text_only'
  // 高構造 or 低ZPDの場合、テキストのみでもイラスト追加
  if (structLevel >= 0.6 && media_type === 'text_only') media_type = 'illustrated'

  // --- 問題形式 ---
  let question_format: CardTemplate['question_format'] = 'free_response'
  const retMode = controls.cognitive_strategy.retrieval_mode
  if (retMode === 'recognition') question_format = 'multiple_choice'
  else if (retMode === 'cued_recall') question_format = 'fill_blank'
  else question_format = 'free_response'
  // 高構造 → ステップバイステップ or ソーティング
  if (structLevel >= 0.7 && question_format === 'free_response') question_format = 'step_by_step'

  // --- スキャフォールド ---
  const scaffold_structure = {
    show_hint_upfront: controls.scaffold.hint_proactiveness >= 0.6,
    hint_levels: controls.scaffold.frustration_control ? 3
      : controls.scaffold.hint_proactiveness >= 0.4 ? 2
      : controls.scaffold.hint_proactiveness >= 0.2 ? 1 : 0,
    show_worked_example: demo === 'full',
    show_partial_solution: demo === 'partial',
    provide_checklist: structLevel >= 0.6,
  }

  // --- 振り返り ---
  const reflType = controls.srl.reflection_prompt_type
  const reflection_element: CardTemplate['reflection_element'] = {
    type: reflType === 'none' ? 'none'
      : reflType === 'binary' ? 'binary'
      : reflType === 'scaled' ? 'scale'
      : reflType === 'open_ended' ? 'open'
      : 'none',
  }
  if (reflType === 'binary') reflection_element.prompt_text = 'わかった？ 😊はい / 😢もうすこし'
  else if (reflType === 'scaled') reflection_element.prompt_text = 'どのくらいわかった？ ⭐ 1〜5'
  else if (reflType === 'open_ended') reflection_element.prompt_text = '今日わかったことと、むずかしかったことを書いてみよう'

  // --- 動機づけ ---
  const motivation_element = {
    show_progress: controls.motivation.progress_display === 'self_growth',
    celebration_on_correct: controls.motivation.micro_success_feedback,
    encouragement_on_error: controls.scaffold.encouragement,
    choice_offered: controls.motivation.choice_with_rationale,
  }

  // --- 精緻化 ---
  let elaboration: CardTemplate['elaboration'] = undefined
  if (controls.cognitive_strategy.elaboration_prompt_type !== 'none') {
    const eType = controls.cognitive_strategy.elaboration_prompt_type as 'why' | 'how' | 'compare' | 'connect'
    const prompts: Record<string, string> = {
      why: 'どうしてこうなるのか、理由を考えてみよう',
      how: 'どうやって解いたか、やり方を説明してみよう',
      compare: '前に学んだこととくらべて、にているところ・ちがうところは？',
      connect: '今まで学んだことと、どこがつながっている？',
    }
    elaboration = { type: eType, prompt_text: prompts[eType] }
  }

  // --- カード枚数と時間 ---
  // 最低6枚を保証（少なすぎると学習が不十分になる）
  let recommended_card_count = 8
  let recommended_time_per_card = 8
  // Type H/G: やや少なめ・短め（ただし最低6枚）
  if (archetype === 'H' || archetype === 'G') {
    recommended_card_count = 6
    recommended_time_per_card = 5
  }
  // Type A: 多め・挑戦的
  else if (archetype === 'A') {
    recommended_card_count = 10
    recommended_time_per_card = 12
  }
  // 高ZPD → やや多め
  if (zpd >= 0.7) recommended_card_count = Math.min(10, recommended_card_count + 1)
  // 低ZPD → 少し減らすが最低6枚
  if (zpd <= 0.3) recommended_card_count = Math.max(6, recommended_card_count - 1)

  const template_name = `${media_type}_${question_format}_${archetype}`

  return {
    template_name,
    media_type,
    question_format,
    scaffold_structure,
    reflection_element,
    motivation_element,
    elaboration,
    recommended_card_count,
    recommended_time_per_card,
  }
}

// ============================================================
// F-5: リアルタイム適応ループ
// ============================================================

/**
 * 解答結果を受けてv4を再計算し、次のカードパラメータを調整
 */
export interface AdaptiveNextResult {
  /** 次のカードの推奨制御パラメータ */
  next_controls: IntegratedControlParameters
  /** 次のカードテンプレート */
  next_template: CardTemplate
  /** アーキタイプ（変化した可能性あり） */
  archetype: ArchetypeId
  /** 調整の理由 */
  adjustments: Array<{
    field: string
    from: string | number
    to: string | number
    reason: string
  }>
  /** 教師アラートが必要か */
  teacher_alert: boolean
  /** リスク警告 */
  risks: string[]
  /** 励ましメッセージ */
  encouragement_message?: string
}

/**
 * F-5 メイン: リアルタイム適応ループ
 * 
 * 解答後に呼び出し、次のカードの制御パラメータを更新する
 */
export function computeAdaptiveNext(
  profiles: AllTheoryProfiles,
  behavior: RealtimeBehaviorData,
  previousControls?: IntegratedControlParameters,
): AdaptiveNextResult {
  // v4エンジンで再計算
  const result = computeIntegratedControls(profiles, behavior)
  const newControls = result.controls
  const archetype = result.archetype
  const axes = result.axes

  // テンプレート決定
  const template = determineCardTemplate(newControls, archetype)

  // 調整の記録
  const adjustments: AdaptiveNextResult['adjustments'] = []

  if (previousControls) {
    // ZPD位置の変化
    const prevZpd = previousControls.structure.difficulty_zpd_position
    const newZpd = newControls.structure.difficulty_zpd_position
    if (Math.abs(prevZpd - newZpd) > 0.1) {
      adjustments.push({
        field: 'difficulty_zpd_position',
        from: prevZpd,
        to: newZpd,
        reason: newZpd < prevZpd
          ? '連続的な困難に対応して難易度を下げました'
          : '順調な成功に基づいて難易度を上げました',
      })
    }

    // 構造レベルの変化
    const prevStruct = previousControls.structure.structure_level
    const newStruct = newControls.structure.structure_level
    if (Math.abs(prevStruct - newStruct) > 0.1) {
      adjustments.push({
        field: 'structure_level',
        from: prevStruct,
        to: newStruct,
        reason: newStruct > prevStruct
          ? '支援構造を増やしました'
          : '自律性を高めるために構造を緩めました',
      })
    }

    // チャネルの変化
    if (previousControls.presentation.entry_channel !== newControls.presentation.entry_channel) {
      adjustments.push({
        field: 'entry_channel',
        from: previousControls.presentation.entry_channel,
        to: newControls.presentation.entry_channel,
        reason: '学習チャネルを変更して新鮮さを確保します',
      })
    }

    // 検索練習モードの変化
    if (previousControls.cognitive_strategy.retrieval_mode !== newControls.cognitive_strategy.retrieval_mode) {
      adjustments.push({
        field: 'retrieval_mode',
        from: previousControls.cognitive_strategy.retrieval_mode,
        to: newControls.cognitive_strategy.retrieval_mode,
        reason: '記憶定着の段階に合わせて問題形式を変更しました',
      })
    }
  }

  // リスク検出
  const risks: string[] = []
  const needState = assessNeedSatisfaction(profiles.F8)
  const feedbackLoop = detectMotivationFeedbackLoop(profiles.F8, behavior, needState, archetype, profiles.F7)

  if (feedbackLoop.spiral_type === 'negative') {
    risks.push('負のスパイラルが検出されています。難易度を大幅に下げ、成功体験を優先してください。')
  }
  if (result.affectState?.state === 'crisis') {
    risks.push('感情的な危機状態です。学習を一時中断し、教師の介入を推奨します。')
  }
  if (behavior.consecutive_errors >= 5) {
    risks.push(`連続${behavior.consecutive_errors}問不正解です。別のアプローチへの切り替えを推奨します。`)
  }
  if (behavior.idle_time_seconds > 60) {
    risks.push('長時間のアイドルが検出されました。離脱の可能性があります。')
  }

  // 励ましメッセージ
  let encouragement_message: string | undefined
  if (behavior.consecutive_errors >= 3) {
    encouragement_message = 'やり方を変えてみよう！ できないんじゃなくて、まだやり方が見つかっていないだけだよ。'
  } else if (behavior.consecutive_successes >= 3) {
    encouragement_message = 'すごいね！ この調子でいこう！ もう少しむずかしいのにもチャレンジしてみよう。'
  } else if (needState.overall_satisfaction < 30) {
    encouragement_message = '大丈夫だよ。ゆっくり、自分のペースでいこう。'
  }

  return {
    next_controls: newControls,
    next_template: template,
    archetype,
    adjustments,
    teacher_alert: newControls._teacher_alert || newControls._human_intervention_recommended,
    risks,
    encouragement_message,
  }
}

// ============================================================
// F-6: APIエンドポイント
// ============================================================

const v4CardApi = new Hono<{ Bindings: { DB: D1Database; GEMINI_API_KEY: string } }>()

/**
 * POST /api/v4/card/profile/:studentId
 * 児童のD1データからv4プロファイルを構築して返す（デバッグ・検証用）
 */
v4CardApi.post('/profile/:studentId', async (c) => {
  const startTime = Date.now()
  const studentId = parseInt(c.req.param('studentId'))
  const { curriculum_id } = await c.req.json().catch(() => ({}))
  
  try {
    const rawData = await fetchStudentRawData(c.env.DB, studentId, curriculum_id)
    const profiles = buildProfilesFromD1(rawData)
    const axes = computeFundamentalAxes(profiles)
    const archetype = understandCurrentPresence(axes)

    return c.json({
      success: true,
      data: {
        profiles,
        axes,
        archetype: { id: archetype, ...ARCHETYPES[archetype] },
        raw_data_summary: {
          has_diagnosis: !!rawData.diagnosis,
          has_answer_stats: !!rawData.answerStats,
          has_reflection: !!rawData.reflection,
          has_hourly_reflections: !!rawData.hourlyReflections,
          has_test_study: !!rawData.testStudy,
          has_metacognition: !!rawData.metacognition,
          has_test_performance: !!rawData.testPerformance,
          total_answers: rawData.answerStats?.total_answers ?? 0,
        },
      },
      meta: { processing_time_ms: Date.now() - startTime },
    })
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

/**
 * POST /api/v4/card/generate/:studentId
 * v4統合制御に基づいた個別最適化カード生成（Gemini連携）
 */
v4CardApi.post('/generate/:studentId', async (c) => {
  const startTime = Date.now()
  const studentId = parseInt(c.req.param('studentId'))
  const body = await c.req.json()
  const { curriculum_id, subject, unit_name, grade, session_duration_minutes } = body

  const apiKey = c.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ success: false, error: 'Gemini APIキーが設定されていません' }, 500)
  }

  try {
    // F-1: プロファイル構築
    const rawData = await fetchStudentRawData(c.env.DB, studentId, curriculum_id)
    const profiles = buildProfilesFromD1(rawData)

    // F-2: 行動データ構築
    const behavior = await buildBehaviorFromD1(c.env.DB, studentId, curriculum_id, session_duration_minutes)

    // v4エンジン実行
    const v4Result = computeIntegratedControls(profiles, behavior)

    // F-4: テンプレート決定
    const template = determineCardTemplate(v4Result.controls, v4Result.archetype)

    // F-3: Geminiプロンプト構築
    const v4PromptSection = buildV4PromptSection(v4Result.controls, v4Result.archetype, v4Result.axes)

    // カリキュラム情報の取得
    let curriculumInfo = ''
    if (curriculum_id) {
      const cur = await c.env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculum_id).first() as any
      if (cur) {
        curriculumInfo = `
【カリキュラム情報】
- 教科: ${cur.subject || subject}
- 単元: ${cur.unit_name || unit_name}
- 学年: ${cur.grade || grade}
- 単元目標: ${cur.unit_goal || '未設定'}
`
      }
    }
    if (!curriculumInfo) {
      curriculumInfo = `
【カリキュラム情報】
- 教科: ${subject || '未指定'}
- 単元: ${unit_name || '未指定'}
- 学年: ${grade || '未指定'}
`
    }

    // 統合プロンプト
    const prompt = `
あなたは12の教育理論を統合したAI教育システムです。
以下のv4統合制御エンジンの分析結果に**厳密に従って**、この児童に最適化された学習カードを生成してください。

${curriculumInfo}

${v4PromptSection}

【カード構造テンプレート指示】
- メディアタイプ: ${template.media_type}
- 問題形式: ${template.question_format}
- ヒント段階数: ${template.scaffold_structure.hint_levels}
- 解法例の提示: ${template.scaffold_structure.show_worked_example ? '完全な解法例を含める' : template.scaffold_structure.show_partial_solution ? '部分的な解法例を含める' : '解法例なし（自力解決を促す）'}
- チェックリスト: ${template.scaffold_structure.provide_checklist ? '手順チェックリストを含める' : 'なし'}
- 振り返り: ${template.reflection_element.type !== 'none' ? template.reflection_element.prompt_text : 'なし'}
${template.elaboration ? `- 精緻化プロンプト（各カードの最後に追加）: ${template.elaboration.prompt_text}` : ''}
- カード枚数: ${template.recommended_card_count}枚
- 1枚あたりの推定時間: ${template.recommended_time_per_card}分

【出力形式】 JSON
{
  "analysis_summary": "この児童の学習特性分析（3文、v4分析に基づく）",
  "archetype_insight": "アーキタイプ「${ARCHETYPES[v4Result.archetype].name_ja}」に基づく指導方針（2文）",
  "cards": [
    {
      "card_title": "カードタイトル",
      "card_type": "${template.media_type}",
      "difficulty_level": "easy|standard|hard",
      "question_format": "${template.question_format}",
      "problem_text": "問題文（${template.media_type === 'illustrated' ? '図解の説明を含む' : template.media_type === 'manipulative' ? '操作的活動の指示を含む' : '明確な指示'}）",
      "problem_description": "問題の補足説明",
      "correct_answer": "正解",
      "explanation": "解説（つまずきポイントを含む）",
      "hints": ["ヒント1", "ヒント2"],
      ${template.scaffold_structure.show_worked_example ? '"worked_example": "解法例の全手順",' : ''}
      ${template.scaffold_structure.provide_checklist ? '"checklist": ["手順1", "手順2", "手順3"],' : ''}
      "estimated_time_minutes": ${template.recommended_time_per_card},
      "personalization_note": "この児童向けにカスタマイズした理由（v4パラメータに基づく）",
      "media_suggestions": {
        "needs_illustration": ${template.media_type === 'illustrated'},
        "illustration_description": "図解の説明（該当する場合）",
        "needs_manipulative": ${template.media_type === 'manipulative'},
        "manipulative_description": "操作活動の説明（該当する場合）"
      }${template.elaboration ? `,
      "elaboration_prompt": "${template.elaboration.prompt_text}"` : ''}${template.reflection_element.type !== 'none' ? `,
      "reflection_prompt": "${template.reflection_element.prompt_text}"` : ''}
    }
  ],
  "session_plan": {
    "total_estimated_minutes": ${template.recommended_card_count * template.recommended_time_per_card},
    "break_after_card": ${Math.ceil(template.recommended_card_count / 2)},
    "motivation_message_start": "セッション開始時の声かけ",
    "motivation_message_midpoint": "中間地点での声かけ"
  },
  "teacher_notes": [
    "教師へのアドバイス1",
    "教師へのアドバイス2"
  ]
}

※ カードは${template.recommended_card_count}枚生成（最低6枚必須）
※ 問題文は小学生が直接読む文章です（わかりやすく）
※ v4の制御パラメータに忠実に従ってください
`

    // Gemini API呼び出し
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8000, responseMimeType: 'application/json' },
        }),
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json() as any
    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let generatedCards: any
    try {
      generatedCards = JSON.parse(geminiText)
    } catch {
      // JSONパースに失敗した場合、テキストからJSONを抽出
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/)
      generatedCards = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse AI response', raw: geminiText.substring(0, 500) }
    }

    const processingTime = Date.now() - startTime

    return c.json({
      success: true,
      data: {
        generated_cards: generatedCards,
        v4_context: {
          archetype: { id: v4Result.archetype, name_ja: ARCHETYPES[v4Result.archetype].name_ja },
          axes: v4Result.axes,
          template: {
            name: template.template_name,
            media_type: template.media_type,
            question_format: template.question_format,
            card_count: template.recommended_card_count,
          },
          affect_state: v4Result.affectState?.state,
        },
      },
      meta: {
        engine_version: 'v4.0',
        processing_time_ms: processingTime,
        student_id: studentId,
        curriculum_id,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('v4 card generate error:', error)
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

/**
 * POST /api/v4/card/adaptive-next/:studentId
 * F-5: リアルタイム適応ループ — 解答後に次のカードパラメータを算出
 */
v4CardApi.post('/adaptive-next/:studentId', async (c) => {
  const startTime = Date.now()
  const studentId = parseInt(c.req.param('studentId'))
  const body = await c.req.json()
  const { curriculum_id, session_duration_minutes, previous_controls } = body

  try {
    // F-1: 最新のプロファイル構築
    const rawData = await fetchStudentRawData(c.env.DB, studentId, curriculum_id)
    const profiles = buildProfilesFromD1(rawData)

    // F-2: 最新の行動データ構築
    const behavior = await buildBehaviorFromD1(c.env.DB, studentId, curriculum_id, session_duration_minutes)

    // F-5: 適応的次ステップ算出
    const adaptiveResult = computeAdaptiveNext(profiles, behavior, previous_controls)

    return c.json({
      success: true,
      data: {
        next_controls: adaptiveResult.next_controls,
        next_template: adaptiveResult.next_template,
        archetype: {
          id: adaptiveResult.archetype,
          name_ja: ARCHETYPES[adaptiveResult.archetype].name_ja,
        },
        adjustments: adaptiveResult.adjustments,
        teacher_alert: adaptiveResult.teacher_alert,
        risks: adaptiveResult.risks,
        encouragement_message: adaptiveResult.encouragement_message,
        behavior_snapshot: behavior,
      },
      meta: {
        engine_version: 'v4.0',
        processing_time_ms: Date.now() - startTime,
        student_id: studentId,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('v4 adaptive-next error:', error)
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

/**
 * POST /api/v4/card/batch-test
 * F-6: テスト用 — 複数のアーキタイプ×状態でのカード生成テスト
 */
v4CardApi.post('/batch-test', async (c) => {
  const startTime = Date.now()
  
  try {
    const testCases: Array<{
      name: string
      profiles: AllTheoryProfiles
      behavior: RealtimeBehaviorData
    }> = []

    // 8アーキタイプ × 代表的な行動パターンのテストケース
    const archetypeParams: Record<string, { ca: number; es: number; sm: number; me: number; ax: number }> = {
      'A_自律探究者': { ca: 85, es: 80, sm: 80, me: 90, ax: 15 },
      'B_着実努力者': { ca: 55, es: 65, sm: 60, me: 65, ax: 30 },
      'C_直感冒険者': { ca: 60, es: 70, sm: 35, me: 75, ax: 25 },
      'D_慎重完璧者': { ca: 50, es: 40, sm: 55, me: 55, ax: 65 },
      'E_社交学習者': { ca: 45, es: 65, sm: 40, me: 70, ax: 30 },
      'F_不安定挑戦者': { ca: 40, es: 35, sm: 35, me: 50, ax: 55 },
      'G_受動依存者': { ca: 25, es: 45, sm: 20, me: 30, ax: 40 },
      'H_学習回避者': { ca: 15, es: 20, sm: 15, me: 10, ax: 80 },
    }

    // 行動パターン
    const behaviorPatterns: Record<string, Partial<RealtimeBehaviorData>> = {
      '安定': { consecutive_successes: 3, consecutive_errors: 0, recent_accuracy: 0.75 },
      '苦戦': { consecutive_successes: 0, consecutive_errors: 4, recent_accuracy: 0.2, hint_usage_count: 3 },
      '退屈': { consecutive_successes: 8, consecutive_errors: 0, recent_accuracy: 0.95, idle_time_seconds: 30 },
    }

    const results: any[] = []

    for (const [archName, params] of Object.entries(archetypeParams)) {
      for (const [behavName, behavOverrides] of Object.entries(behaviorPatterns)) {
        // 簡易プロファイル構築
        const rawData: StudentRawData = {
          diagnosis: {
            learning_style_dominant: 'balanced',
            resilience: Math.round(params.me / 20),
            error_strategy: params.es > 50 ? 'retry' : 'hint',
            preferred_pace: params.ca > 60 ? 'fast' : 'steady',
            prior_knowledge: Math.round(params.sm / 20),
            subject_affinity: Math.round(params.me / 20),
          },
          answerStats: {
            total_answers: 20,
            correct_count: Math.round(20 * (behavOverrides.recent_accuracy ?? 0.5)),
            avg_time_seconds: 15,
            hint_used_count: behavOverrides.hint_usage_count ?? 0,
            recent_streak_correct: behavOverrides.consecutive_successes ?? 0,
            recent_streak_error: behavOverrides.consecutive_errors ?? 0,
            easy_correct_rate: (behavOverrides.recent_accuracy ?? 0.5) + 0.15,
            hard_correct_rate: Math.max(0, (behavOverrides.recent_accuracy ?? 0.5) - 0.2),
          },
          reflection: {
            metacognition_score: params.ca * 0.7,
            planning_score: params.sm * 0.6,
            method_score: params.sm * 0.5,
            collaboration_score: 50,
            persistence_score: params.me * 0.6,
            autonomy_score: params.ca * 0.8,
          },
        }

        const profiles = buildProfilesFromD1(rawData)
        const behavior: RealtimeBehaviorData = {
          consecutive_successes: behavOverrides.consecutive_successes ?? 0,
          consecutive_errors: behavOverrides.consecutive_errors ?? 0,
          recent_accuracy: behavOverrides.recent_accuracy ?? 0.5,
          recent_response_time_ms: 15000,
          hint_usage_count: behavOverrides.hint_usage_count ?? 0,
          idle_time_seconds: behavOverrides.idle_time_seconds ?? 0,
          estimated_affect: { arousal: 55, valence: 20 },
          current_srl_phase: 'performance',
          session_duration_minutes: 15,
          current_problem_difficulty: 50,
        }

        const v4Result = computeIntegratedControls(profiles, behavior)
        const template = determineCardTemplate(v4Result.controls, v4Result.archetype)

        results.push({
          test_case: `${archName} × ${behavName}`,
          archetype: v4Result.archetype,
          template: {
            name: template.template_name,
            media_type: template.media_type,
            question_format: template.question_format,
            card_count: template.recommended_card_count,
          },
          key_controls: {
            entry_channel: v4Result.controls.presentation.entry_channel,
            structure_level: Math.round(v4Result.controls.structure.structure_level * 100) / 100,
            zpd_position: Math.round(v4Result.controls.structure.difficulty_zpd_position * 100) / 100,
            retrieval_mode: v4Result.controls.cognitive_strategy.retrieval_mode,
            elaboration: v4Result.controls.cognitive_strategy.elaboration_prompt_type,
            reflection: v4Result.controls.srl.reflection_prompt_type,
            frustration_control: v4Result.controls.scaffold.frustration_control,
            encouragement: v4Result.controls.scaffold.encouragement,
            teacher_alert: v4Result.controls._teacher_alert,
          },
        })
      }
    }

    return c.json({
      success: true,
      data: {
        test_count: results.length,
        results,
      },
      meta: {
        engine_version: 'v4.0',
        processing_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('v4 batch-test error:', error)
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

export { v4CardApi }
