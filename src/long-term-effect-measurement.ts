/**
 * Phase 17-2: 長期効果測定システム
 * 
 * 機能:
 * - 事前・事後テストの実装
 * - 効果量（Cohen's d）の自動計算
 * - 学力向上の可視化レポート
 * 
 * 科学的根拠:
 * - 効果量計算: Cohen's d = (M2 - M1) / SD_pooled
 * - 解釈: d=0.2(小), d=0.5(中), d=0.8(大)
 * - 教育介入評価: Kraft (2020) "Interpreting Effect Sizes"
 */

import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

interface TestResult {
  testId: string
  studentId: string
  testType: 'pre' | 'post' | 'follow_up'
  score: number
  maxScore: number
  completedAt: string
}

interface EffectSizeCalculation {
  studentId: string
  preTestScore: number
  postTestScore: number
  improvement: number
  improvementPercentage: number
  cohensD: number
  interpretation: string
  classAverageD: number
  ranking: string
}

/**
 * Cohen's d 効果量計算
 */
function calculateCohensD(
  preMean: number,
  postMean: number,
  preSD: number,
  postSD: number,
  n1: number,
  n2: number
): number {
  // Pooled standard deviation
  const pooledSD = Math.sqrt(
    ((n1 - 1) * preSD * preSD + (n2 - 1) * postSD * postSD) / (n1 + n2 - 2)
  )
  
  // Cohen's d
  const d = (postMean - preMean) / pooledSD
  
  return d
}

/**
 * 効果量の解釈
 */
function interpretEffectSize(d: number): string {
  if (d < 0.2) return '効果なし～極小'
  if (d < 0.5) return '小さい効果'
  if (d < 0.8) return '中程度の効果'
  if (d < 1.2) return '大きい効果'
  return '非常に大きい効果'
}

/**
 * 事前テスト作成・実施
 * POST /api/effect-measurement/create-pre-test
 */
app.post('/create-pre-test', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const { 
    testName, 
    classCode, 
    subject, 
    gradeLevel,
    questionCount = 20,
    duration = 40 // 分
  } = body
  
  try {
    // テストを作成
    const result = await env.DB.prepare(`
      INSERT INTO effect_measurement_tests (
        test_name,
        test_type,
        class_code,
        subject,
        grade_level,
        question_count,
        duration_minutes,
        status,
        created_at
      ) VALUES (?, 'pre', ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).bind(testName, classCode, subject, gradeLevel, questionCount, duration).run()
    
    const testId = result.meta.last_row_id
    
    // AI で問題を生成
    const prompt = `
${subject}（${gradeLevel}）の学力測定用テストを${questionCount}問作成してください。

要件:
- 基礎問題: 40%
- 応用問題: 40%
- 発展問題: 20%
- 各問題に配点を設定
- 合計100点満点

JSON形式で出力してください:
{
  "questions": [
    {
      "questionNumber": 1,
      "question": "問題文",
      "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "correctAnswer": "選択肢2",
      "points": 5,
      "difficulty": "basic|applied|advanced"
    }
  ]
}
`
    
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096
    })
    
    let questions = []
    try {
      const responseText = aiResponse.response || ''
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        questions = parsed.questions || []
      }
    } catch (e) {
      console.error('AI応答のパースエラー:', e)
    }
    
    // 問題をデータベースに保存
    for (const q of questions) {
      await env.DB.prepare(`
        INSERT INTO test_questions (
          test_id,
          question_number,
          question_text,
          choices,
          correct_answer,
          points,
          difficulty
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        testId,
        q.questionNumber,
        q.question,
        JSON.stringify(q.choices),
        q.correctAnswer,
        q.points,
        q.difficulty
      ).run()
    }
    
    return c.json({
      success: true,
      testId,
      testName,
      questionCount: questions.length,
      message: '事前テストを作成しました'
    })
    
  } catch (error) {
    console.error('事前テスト作成エラー:', error)
    return c.json({
      success: false,
      error: 'テストの作成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * テスト受験
 * POST /api/effect-measurement/submit-test
 */
app.post('/submit-test', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const { testId, studentId, answers } = body
  
  try {
    // テスト情報取得
    const test = await env.DB.prepare(`
      SELECT * FROM effect_measurement_tests WHERE id = ?
    `).bind(testId).first()
    
    if (!test) {
      return c.json({ success: false, error: 'テストが見つかりません' }, 404)
    }
    
    // 問題取得
    const questions = await env.DB.prepare(`
      SELECT * FROM test_questions WHERE test_id = ? ORDER BY question_number
    `).bind(testId).all()
    
    // 採点
    let totalScore = 0
    let maxScore = 0
    const results = []
    
    for (const question of questions.results) {
      const studentAnswer = answers[question.question_number]
      const isCorrect = studentAnswer === question.correct_answer
      const points = isCorrect ? question.points : 0
      
      totalScore += points
      maxScore += question.points
      
      results.push({
        questionNumber: question.question_number,
        studentAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        points,
        maxPoints: question.points
      })
      
      // 回答を保存
      await env.DB.prepare(`
        INSERT INTO test_answers (
          test_id,
          student_id,
          question_number,
          student_answer,
          is_correct,
          points_earned
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(testId, studentId, question.question_number, studentAnswer, isCorrect ? 1 : 0, points).run()
    }
    
    // テスト結果を保存
    await env.DB.prepare(`
      INSERT INTO test_results (
        test_id,
        student_id,
        test_type,
        score,
        max_score,
        percentage,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(testId, studentId, test.test_type, totalScore, maxScore, (totalScore / maxScore) * 100).run()
    
    return c.json({
      success: true,
      totalScore,
      maxScore,
      percentage: (totalScore / maxScore) * 100,
      results
    })
    
  } catch (error) {
    console.error('テスト送信エラー:', error)
    return c.json({
      success: false,
      error: 'テストの送信に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 効果量計算（個人）
 * GET /api/effect-measurement/effect-size/:studentId
 */
app.get('/effect-size/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 事前テスト結果取得
    const preTest = await env.DB.prepare(`
      SELECT tr.score, tr.max_score, tr.percentage, tr.completed_at
      FROM test_results tr
      JOIN effect_measurement_tests t ON tr.test_id = t.id
      WHERE tr.student_id = ? AND t.test_type = 'pre'
      ORDER BY tr.completed_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    // 事後テスト結果取得
    const postTest = await env.DB.prepare(`
      SELECT tr.score, tr.max_score, tr.percentage, tr.completed_at
      FROM test_results tr
      JOIN effect_measurement_tests t ON tr.test_id = t.id
      WHERE tr.student_id = ? AND t.test_type = 'post'
      ORDER BY tr.completed_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    if (!preTest || !postTest) {
      return c.json({
        success: false,
        error: '事前・事後テストの両方が必要です'
      }, 400)
    }
    
    // クラス平均を取得（標準偏差計算用）
    const classStats = await env.DB.prepare(`
      SELECT 
        AVG(CASE WHEN t.test_type = 'pre' THEN tr.percentage END) as pre_mean,
        AVG(CASE WHEN t.test_type = 'post' THEN tr.percentage END) as post_mean
      FROM test_results tr
      JOIN effect_measurement_tests t ON tr.test_id = t.id
      WHERE t.class_code = (
        SELECT class_code FROM students WHERE student_id = ?
      )
    `).bind(studentId).first()
    
    // 標準偏差を推定（簡易版: 範囲の1/4を使用）
    const preSD = 15 // 仮定: 教育テストの典型的なSD
    const postSD = 15
    
    // Cohen's d 計算
    const improvement = postTest.percentage - preTest.percentage
    const cohensD = improvement / preSD
    
    // クラス平均との比較
    const classImprovement = (classStats?.post_mean || 0) - (classStats?.pre_mean || 0)
    const classD = classImprovement / preSD
    
    const result: EffectSizeCalculation = {
      studentId,
      preTestScore: preTest.percentage,
      postTestScore: postTest.percentage,
      improvement,
      improvementPercentage: (improvement / preTest.percentage) * 100,
      cohensD,
      interpretation: interpretEffectSize(cohensD),
      classAverageD: classD,
      ranking: cohensD > classD ? '平均以上' : cohensD === classD ? '平均' : '平均以下'
    }
    
    return c.json({
      success: true,
      effectSize: result,
      preTest: {
        score: preTest.percentage,
        date: preTest.completed_at
      },
      postTest: {
        score: postTest.percentage,
        date: postTest.completed_at
      },
      classAverage: {
        preScore: classStats?.pre_mean || 0,
        postScore: classStats?.post_mean || 0,
        improvement: classImprovement,
        cohensD: classD
      }
    })
    
  } catch (error) {
    console.error('効果量計算エラー:', error)
    return c.json({
      success: false,
      error: '効果量の計算に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * クラス全体の効果量計算
 * GET /api/effect-measurement/class-effect-size/:classCode
 */
app.get('/class-effect-size/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    // クラス全体の事前・事後テスト統計
    const stats = await env.DB.prepare(`
      SELECT 
        t.test_type,
        COUNT(*) as n,
        AVG(tr.percentage) as mean,
        -- 標準偏差の簡易計算
        SQRT(AVG(tr.percentage * tr.percentage) - AVG(tr.percentage) * AVG(tr.percentage)) as sd
      FROM test_results tr
      JOIN effect_measurement_tests t ON tr.test_id = t.id
      WHERE t.class_code = ?
      GROUP BY t.test_type
    `).bind(classCode).all()
    
    const preStats = stats.results.find(s => s.test_type === 'pre')
    const postStats = stats.results.find(s => s.test_type === 'post')
    
    if (!preStats || !postStats) {
      return c.json({
        success: false,
        error: 'クラスの事前・事後テストデータが不足しています'
      }, 400)
    }
    
    // Cohen's d 計算
    const cohensD = calculateCohensD(
      preStats.mean,
      postStats.mean,
      preStats.sd || 15,
      postStats.sd || 15,
      preStats.n,
      postStats.n
    )
    
    // 個人別効果量分布
    const individualEffects = await env.DB.prepare(`
      SELECT 
        s.student_id,
        s.student_name,
        pre.percentage as pre_score,
        post.percentage as post_score,
        (post.percentage - pre.percentage) as improvement
      FROM students s
      LEFT JOIN (
        SELECT tr.student_id, tr.percentage
        FROM test_results tr
        JOIN effect_measurement_tests t ON tr.test_id = t.id
        WHERE t.test_type = 'pre' AND t.class_code = ?
      ) pre ON s.student_id = pre.student_id
      LEFT JOIN (
        SELECT tr.student_id, tr.percentage
        FROM test_results tr
        JOIN effect_measurement_tests t ON tr.test_id = t.id
        WHERE t.test_type = 'post' AND t.class_code = ?
      ) post ON s.student_id = post.student_id
      WHERE s.class_code = ?
        AND pre.percentage IS NOT NULL
        AND post.percentage IS NOT NULL
    `).bind(classCode, classCode, classCode).all()
    
    // 効果量の分布を計算
    const effectDistribution = {
      veryLarge: 0, // d >= 1.2
      large: 0,     // 0.8 <= d < 1.2
      medium: 0,    // 0.5 <= d < 0.8
      small: 0,     // 0.2 <= d < 0.5
      negligible: 0 // d < 0.2
    }
    
    for (const student of individualEffects.results) {
      const d = (student.improvement || 0) / (preStats.sd || 15)
      if (d >= 1.2) effectDistribution.veryLarge++
      else if (d >= 0.8) effectDistribution.large++
      else if (d >= 0.5) effectDistribution.medium++
      else if (d >= 0.2) effectDistribution.small++
      else effectDistribution.negligible++
    }
    
    return c.json({
      success: true,
      classCode,
      overallEffectSize: {
        cohensD,
        interpretation: interpretEffectSize(cohensD),
        preMean: preStats.mean,
        postMean: postStats.mean,
        improvement: postStats.mean - preStats.mean,
        improvementPercentage: ((postStats.mean - preStats.mean) / preStats.mean) * 100
      },
      statistics: {
        pre: preStats,
        post: postStats
      },
      effectDistribution,
      individualEffects: individualEffects.results,
      studentCount: individualEffects.results.length
    })
    
  } catch (error) {
    console.error('クラス効果量計算エラー:', error)
    return c.json({
      success: false,
      error: 'クラス効果量の計算に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 長期追跡データ取得
 * GET /api/effect-measurement/long-term-tracking/:studentId
 */
app.get('/long-term-tracking/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // すべてのテスト結果を時系列で取得
    const allTests = await env.DB.prepare(`
      SELECT 
        tr.test_id,
        t.test_name,
        t.test_type,
        tr.score,
        tr.max_score,
        tr.percentage,
        tr.completed_at
      FROM test_results tr
      JOIN effect_measurement_tests t ON tr.test_id = t.id
      WHERE tr.student_id = ?
      ORDER BY tr.completed_at ASC
    `).bind(studentId).all()
    
    // 学習時間との相関
    const learningTime = await env.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        SUM(session_duration_seconds) / 3600.0 as hours
      FROM learning_logs
      WHERE student_id = ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      tests: allTests.results,
      learningTime: learningTime.results,
      summary: {
        totalTests: allTests.results.length,
        latestScore: allTests.results[allTests.results.length - 1]?.percentage || 0,
        firstScore: allTests.results[0]?.percentage || 0,
        overallImprovement: (allTests.results[allTests.results.length - 1]?.percentage || 0) - (allTests.results[0]?.percentage || 0)
      }
    })
    
  } catch (error) {
    return c.json({
      success: false,
      error: '追跡データの取得に失敗しました'
    }, 500)
  }
})

export default app
