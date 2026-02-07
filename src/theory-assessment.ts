/**
 * レベル5理論体系: 12理論適性診断エンジン
 * Final Theory Framework (F1-F12) Assessment Engine
 * 
 * 機能:
 * - 12理論の適性診断テスト実施
 * - リアルタイムプロファイル生成・更新
 * - 個別最適化推薦アルゴリズム
 */

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
  AI?: any
}

const theoryAssessmentApp = new Hono<{ Bindings: Bindings }>()

// ============================================================
// 型定義
// ============================================================

interface AssessmentItem {
  id: number
  theory_code: string
  theory_name: string
  dimension: string
  question_text: string
  question_type: string
  choice_options: string[]
  display_order: number
}

interface StudentResponse {
  item_id: number
  response_value: number
  response_time_seconds?: number
}

interface TheoryScore {
  theory_code: string
  dimension: string
  score: number
  confidence: number
}

interface TheoryProfile {
  student_id: string
  // F1: 戦略的学習様式
  f1_visual: number
  f1_auditory: number
  f1_reading_writing: number
  f1_kinesthetic: number
  f1_primary_style: string
  // F2: 統合的能力発達
  f2_linguistic: number
  f2_logical_mathematical: number
  f2_spatial: number
  f2_bodily_kinesthetic: number
  f2_growth_mindset: number
  // F5: 自己調整学習
  f5_planning: number
  f5_monitoring: number
  f5_reflection: number
  f5_self_regulation_level: string
  // F8: 動機づけ
  f8_autonomy: number
  f8_competence: number
  f8_relatedness: number
  f8_intrinsic_motivation: number
  profile_completeness: number
}

// ============================================================
// API 1: 適性テスト項目取得
// ============================================================

/**
 * GET /api/theory-assessment/items
 * 適性テスト項目を取得（全理論または特定理論）
 */
theoryAssessmentApp.get('/items', async (c: Context<{ Bindings: Bindings }>) => {
  const theoryCode = c.req.query('theory_code') // F1, F2, F5, F8 等

  try {
    let query = 'SELECT * FROM theory_assessment_items'
    const params: string[] = []

    if (theoryCode) {
      query += ' WHERE theory_code = ?'
      params.push(theoryCode)
    }

    query += ' ORDER BY display_order ASC'

    const result = await c.env.DB.prepare(query).bind(...params).all()

    const items: AssessmentItem[] = result.results.map((row: any) => ({
      id: row.id,
      theory_code: row.theory_code,
      theory_name: row.theory_name,
      dimension: row.dimension,
      question_text: row.question_text,
      question_type: row.question_type,
      choice_options: JSON.parse(row.choice_options || '[]'),
      display_order: row.display_order
    }))

    return c.json({
      success: true,
      count: items.length,
      items
    })
  } catch (error: any) {
    console.error('適性テスト項目取得エラー:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================================
// API 2: 適性テスト回答送信
// ============================================================

/**
 * POST /api/theory-assessment/submit
 * 適性テスト回答を送信し、プロファイルを更新
 */
theoryAssessmentApp.post('/submit', async (c: Context<{ Bindings: Bindings }>) => {
  const { student_id, session_id, responses } = await c.req.json<{
    student_id: string
    session_id: string
    responses: StudentResponse[]
  }>()

  if (!student_id || !responses || responses.length === 0) {
    return c.json({
      success: false,
      error: 'student_id と responses は必須です'
    }, 400)
  }

  try {
    // 1. 回答を保存
    for (const response of responses) {
      await c.env.DB.prepare(`
        INSERT INTO assessment_responses 
          (student_id, item_id, response_value, response_time_seconds, session_id, responded_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        student_id,
        response.item_id,
        response.response_value,
        response.response_time_seconds || null,
        session_id || null
      ).run()
    }

    // 2. プロファイルを更新
    await updateStudentProfile(c.env.DB, student_id)

    // 3. 更新後のプロファイルを取得
    const profile = await getStudentProfile(c.env.DB, student_id)

    return c.json({
      success: true,
      message: `${responses.length}件の回答を記録しました`,
      profile
    })
  } catch (error: any) {
    console.error('適性テスト回答送信エラー:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================================
// API 3: 学生プロファイル取得
// ============================================================

/**
 * GET /api/theory-assessment/profile/:studentId
 * 学生の12理論プロファイルを取得
 */
theoryAssessmentApp.get('/profile/:studentId', async (c: Context<{ Bindings: Bindings }>) => {
  const studentId = c.req.param('studentId')

  try {
    const profile = await getStudentProfile(c.env.DB, studentId)

    if (!profile) {
      return c.json({
        success: false,
        error: 'プロファイルが見つかりません'
      }, 404)
    }

    return c.json({
      success: true,
      profile
    })
  } catch (error: any) {
    console.error('プロファイル取得エラー:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================================
// API 4: 個別最適化推薦
// ============================================================

/**
 * GET /api/theory-assessment/recommendations/:studentId
 * 12理論プロファイルに基づく学習推薦
 */
theoryAssessmentApp.get('/recommendations/:studentId', async (c: Context<{ Bindings: Bindings }>) => {
  const studentId = c.req.param('studentId')

  try {
    const profile = await getStudentProfile(c.env.DB, studentId)

    if (!profile) {
      return c.json({
        success: false,
        error: 'プロファイルが見つかりません'
      }, 404)
    }

    // 推薦アルゴリズム実行
    const recommendations = generateRecommendations(profile)

    return c.json({
      success: true,
      student_id: studentId,
      profile_completeness: profile.profile_completeness,
      recommendations
    })
  } catch (error: any) {
    console.error('推薦生成エラー:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================================
// API 5: クラス全体の理論別平均スコア
// ============================================================

/**
 * GET /api/theory-assessment/class-average/:classCode
 * クラス全体の12理論平均スコア
 */
theoryAssessmentApp.get('/class-average/:classCode', async (c: Context<{ Bindings: Bindings }>) => {
  const classCode = c.req.param('classCode')

  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        sta.theory_code,
        sta.dimension,
        AVG(sta.score) AS average_score,
        AVG(sta.confidence) AS average_confidence,
        COUNT(DISTINCT sta.student_id) AS student_count
      FROM student_theory_assessments sta
      JOIN students s ON sta.student_id = s.id
      WHERE s.class_code = ?
      GROUP BY sta.theory_code, sta.dimension
      ORDER BY sta.theory_code, sta.dimension
    `).bind(classCode).all()

    return c.json({
      success: true,
      class_code: classCode,
      theory_averages: result.results
    })
  } catch (error: any) {
    console.error('クラス平均取得エラー:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// ============================================================
// 内部関数: プロファイル取得
// ============================================================

async function getStudentProfile(db: D1Database, studentId: string): Promise<TheoryProfile | null> {
  const result = await db.prepare(`
    SELECT * FROM student_theory_profiles
    WHERE student_id = ?
  `).bind(studentId).first()

  if (!result) {
    return null
  }

  return result as TheoryProfile
}

// ============================================================
// 内部関数: プロファイル更新
// ============================================================

async function updateStudentProfile(db: D1Database, studentId: string): Promise<void> {
  // 1. 最新の回答データを集計
  const assessmentData = await db.prepare(`
    SELECT 
      tai.theory_code,
      tai.dimension,
      ar.response_value,
      ar.responded_at
    FROM assessment_responses ar
    JOIN theory_assessment_items tai ON ar.item_id = tai.id
    WHERE ar.student_id = ?
    ORDER BY ar.responded_at DESC
    LIMIT 100
  `).bind(studentId).all()

  if (!assessmentData.results || assessmentData.results.length === 0) {
    return
  }

  // 2. 理論別・次元別にスコア計算
  const theoryScores: Map<string, Map<string, number[]>> = new Map()

  for (const row of assessmentData.results as any[]) {
    const theory = row.theory_code
    const dimension = row.dimension
    const value = row.response_value

    if (!theoryScores.has(theory)) {
      theoryScores.set(theory, new Map())
    }

    const dimensions = theoryScores.get(theory)!
    if (!dimensions.has(dimension)) {
      dimensions.set(dimension, [])
    }

    // Likert 5段階を0-100スケールに変換（1→0, 2→25, 3→50, 4→75, 5→100）
    const scaledScore = (value - 1) * 25
    dimensions.get(dimension)!.push(scaledScore)
  }

  // 3. 平均スコア計算
  const profileData: Partial<TheoryProfile> = { student_id: studentId }

  for (const [theory, dimensions] of theoryScores.entries()) {
    for (const [dimension, scores] of dimensions.entries()) {
      const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
      const confidence = Math.min(1.0, scores.length / 10) // 10回答で信頼度1.0

      // student_theory_assessments テーブルを更新
      await db.prepare(`
        INSERT INTO student_theory_assessments 
          (student_id, theory_code, dimension, score, confidence, sample_size, last_assessed)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, theory_code, dimension)
        DO UPDATE SET 
          score = excluded.score,
          confidence = excluded.confidence,
          sample_size = excluded.sample_size,
          last_assessed = excluded.last_assessed
      `).bind(studentId, theory, dimension, avgScore, confidence, scores.length).run()

      // プロファイルデータに追加
      const key = `${theory.toLowerCase()}_${dimension}` as keyof TheoryProfile
      ;(profileData as any)[key] = avgScore
    }
  }

  // 4. 主要スタイル判定（F1: VARK）
  if (theoryScores.has('F1')) {
    const f1Dimensions = theoryScores.get('F1')!
    const varkScores = {
      visual: f1Dimensions.get('visual') || [],
      auditory: f1Dimensions.get('auditory') || [],
      reading_writing: f1Dimensions.get('reading_writing') || [],
      kinesthetic: f1Dimensions.get('kinesthetic') || []
    }

    const avgScores = Object.entries(varkScores).map(([style, scores]) => ({
      style,
      avg: scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0
    }))

    const primaryStyle = avgScores.sort((a, b) => b.avg - a.avg)[0].style
    profileData.f1_primary_style = primaryStyle
  }

  // 5. 自己調整レベル判定（F5）
  if (theoryScores.has('F5')) {
    const f5Avg = Array.from(theoryScores.get('F5')!.values())
      .flat()
      .reduce((sum, s) => sum + s, 0) / Array.from(theoryScores.get('F5')!.values()).flat().length

    if (f5Avg >= 75) {
      profileData.f5_self_regulation_level = 'advanced'
    } else if (f5Avg >= 50) {
      profileData.f5_self_regulation_level = 'intermediate'
    } else {
      profileData.f5_self_regulation_level = 'developing'
    }
  }

  // 6. プロファイル完成度計算
  const totalPossibleFields = 20 // F1-F12の主要フィールド数
  const completedFields = Object.keys(profileData).length - 1 // student_id除外
  profileData.profile_completeness = Math.min(1.0, completedFields / totalPossibleFields)

  // 7. student_theory_profiles テーブルを UPSERT
  const fields = Object.keys(profileData).filter(k => k !== 'student_id')
  const placeholders = fields.map(() => '?').join(', ')
  const updates = fields.map(f => `${f} = excluded.${f}`).join(', ')

  await db.prepare(`
    INSERT INTO student_theory_profiles (student_id, ${fields.join(', ')}, last_updated)
    VALUES (?, ${placeholders}, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id)
    DO UPDATE SET ${updates}, last_updated = CURRENT_TIMESTAMP
  `).bind(studentId, ...fields.map(f => (profileData as any)[f])).run()
}

// ============================================================
// 内部関数: 個別最適化推薦生成
// ============================================================

interface Recommendation {
  category: string
  title: string
  description: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
  theory_basis: string[]
}

function generateRecommendations(profile: TheoryProfile): Recommendation[] {
  const recommendations: Recommendation[] = []

  // F1: 学習様式に基づく推薦
  if (profile.f1_primary_style) {
    const styleRecommendations: Record<string, { title: string; description: string }> = {
      visual: {
        title: '図やイラストを多用した学習',
        description: '視覚的な教材（図表・動画・色分けノート）を活用しましょう'
      },
      auditory: {
        title: '音声での学習',
        description: '音読・解説動画・議論を通じて学習しましょう'
      },
      reading_writing: {
        title: '書いて覚える学習',
        description: 'ノートまとめ・要約・書き写しで定着させましょう'
      },
      kinesthetic: {
        title: '体験型学習',
        description: '実験・工作・身体を動かす活動で学びましょう'
      }
    }

    const rec = styleRecommendations[profile.f1_primary_style]
    if (rec) {
      recommendations.push({
        category: '学習スタイル',
        title: rec.title,
        description: rec.description,
        rationale: `あなたは「${profile.f1_primary_style}」型の学習が得意です`,
        priority: 'high',
        theory_basis: ['F1']
      })
    }
  }

  // F2: 成長マインドセットの育成
  if (profile.f2_growth_mindset < 60) {
    recommendations.push({
      category: '能力発達',
      title: '成長マインドセットを育てよう',
      description: '「まだできない」を「これから伸びる」に変えましょう。努力で能力は伸びます。',
      rationale: `成長マインドセットスコア: ${profile.f2_growth_mindset.toFixed(0)}/100`,
      priority: 'high',
      theory_basis: ['F2']
    })
  }

  // F5: 自己調整学習の強化
  if (profile.f5_self_regulation_level === 'developing') {
    const weakestArea = [
      { name: '計画', score: profile.f5_planning },
      { name: 'モニタリング', score: profile.f5_monitoring },
      { name: '振り返り', score: profile.f5_reflection }
    ].sort((a, b) => a.score - b.score)[0]

    recommendations.push({
      category: '自己調整学習',
      title: `${weakestArea.name}を強化しよう`,
      description: `学習の「${weakestArea.name}」を意識的に行うことで、自分で学ぶ力が伸びます。`,
      rationale: `自己調整レベル: ${profile.f5_self_regulation_level}（${weakestArea.name}が特に重要）`,
      priority: 'high',
      theory_basis: ['F5']
    })
  }

  // F8: 動機づけの支援
  const motivationAvg = (profile.f8_autonomy + profile.f8_competence + profile.f8_relatedness) / 3
  if (motivationAvg < 60) {
    const needAreas: string[] = []
    if (profile.f8_autonomy < 60) needAreas.push('自分で選ぶ機会')
    if (profile.f8_competence < 60) needAreas.push('成功体験')
    if (profile.f8_relatedness < 60) needAreas.push('つながり')

    recommendations.push({
      category: 'やる気アップ',
      title: `${needAreas.join('・')}を増やそう`,
      description: 'やる気を高めるには、自律性・有能感・関係性の3つが大切です。',
      rationale: `動機づけスコア: ${motivationAvg.toFixed(0)}/100`,
      priority: 'medium',
      theory_basis: ['F8']
    })
  }

  // 優先度順にソート
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

export default theoryAssessmentApp
