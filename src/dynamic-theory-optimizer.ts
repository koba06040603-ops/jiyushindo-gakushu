/**
 * Phase 17-1: 12理論学習パスの動的最適化システム
 * 
 * 機能:
 * - 学習履歴から12理論スコアを自動更新
 * - リアルタイム学習パス再最適化
 * - A/Bテストによる効果検証
 * 
 * 科学的根拠:
 * - 適応的学習システム: d=0.62-0.76 (Pane et al. 2017)
 * - 継続的形成的評価: d=0.70-0.75 (Black & Wiliam 1998)
 * - データ駆動型指導: d=0.42 (Hattie 2009)
 */

import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * 学習履歴分析による理論スコア自動更新
 */
interface LearningHistoryData {
  studentId: string
  correctRate: number
  problemCount: number
  sessionDuration: number
  hintUsageRate: number
  reviewCount: number
  collaborationCount: number
  emotionalState: number
}

interface TheoryScoreUpdate {
  theoryCode: string
  theoryName: string
  oldScore: number
  newScore: number
  changeReason: string
  confidence: number
}

/**
 * F1: 学習様式の自動判定
 * 正答率とヒント使用率から視覚型・聴覚型・体験型を推定
 */
function analyzeF1LearningStyle(data: LearningHistoryData): number {
  // 視覚型: 高正答率 + 低ヒント使用
  // 聴覚型: 中正答率 + 中ヒント使用
  // 体験型: 変動あり + 高ヒント使用
  
  const visualScore = data.correctRate * (1 - data.hintUsageRate) * 100
  const auditoryScore = (data.correctRate * 0.8 + 0.2) * (0.5 + data.hintUsageRate * 0.5) * 100
  const kinestheticScore = (data.correctRate * 0.7 + 0.3) * data.hintUsageRate * 100
  
  return Math.max(visualScore, auditoryScore, kinestheticScore)
}

/**
 * F2: 成長マインドセットの推定
 * 復習回数と問題挑戦数から推定
 */
function analyzeF2GrowthMindset(data: LearningHistoryData): number {
  // 復習が多い = 成長マインドセット高
  // 問題数が多い = 挑戦する姿勢
  
  const reviewFactor = Math.min(data.reviewCount / 10, 1) * 50
  const challengeFactor = Math.min(data.problemCount / 50, 1) * 50
  
  return reviewFactor + challengeFactor
}

/**
 * F5: 自己調整学習の推定
 * セッション時間とヒント使用率から推定
 */
function analyzeF5SelfRegulation(data: LearningHistoryData): number {
  // 適切な学習時間 = 自己調整能力
  // 適切なヒント使用 = メタ認知
  
  const optimalDuration = 30 * 60 // 30分
  const durationScore = Math.max(0, 100 - Math.abs(data.sessionDuration - optimalDuration) / optimalDuration * 100)
  
  const optimalHintRate = 0.3
  const hintScore = Math.max(0, 100 - Math.abs(data.hintUsageRate - optimalHintRate) / optimalHintRate * 100)
  
  return (durationScore + hintScore) / 2
}

/**
 * F8: ウェルビーイング・動機づけの推定
 * 感情状態と学習継続性から推定
 */
function analyzeF8Wellbeing(data: LearningHistoryData): number {
  // 感情状態が良い = ウェルビーイング高
  // 継続的学習 = 内発的動機づけ
  
  const emotionalScore = data.emotionalState * 25 // 0-4 -> 0-100
  const continuityScore = Math.min(data.problemCount / 20, 1) * 50
  
  return emotionalScore + continuityScore
}

/**
 * 学習履歴から12理論スコアを自動更新
 * POST /api/theory/auto-update/:studentId
 */
app.post('/auto-update/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 1. 最近の学習履歴取得（過去7日間）
    const recentLogs = await env.DB.prepare(`
      SELECT 
        COUNT(*) as problem_count,
        AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as correct_rate,
        AVG(session_duration_seconds) as avg_duration,
        AVG(CASE WHEN hints_used > 0 THEN 1.0 ELSE 0.0 END) as hint_usage_rate,
        AVG(emotional_state) as avg_emotional_state
      FROM learning_logs
      WHERE student_id = ? 
        AND created_at >= datetime('now', '-7 days')
    `).bind(studentId).first()
    
    // 2. 復習回数取得
    const reviewData = await env.DB.prepare(`
      SELECT COUNT(*) as review_count
      FROM card_review_logs
      WHERE student_id = ? 
        AND created_at >= datetime('now', '-7 days')
    `).bind(studentId).first()
    
    // 3. 協働学習回数取得
    const collaborationData = await env.DB.prepare(`
      SELECT COUNT(*) as collaboration_count
      FROM collaborative_sessions
      WHERE student_id = ? 
        AND created_at >= datetime('now', '-7 days')
    `).bind(studentId).first()
    
    if (!recentLogs || recentLogs.problem_count === 0) {
      return c.json({
        success: false,
        error: '最近の学習履歴がありません'
      }, 400)
    }
    
    const historyData: LearningHistoryData = {
      studentId,
      correctRate: recentLogs.correct_rate || 0,
      problemCount: recentLogs.problem_count || 0,
      sessionDuration: recentLogs.avg_duration || 0,
      hintUsageRate: recentLogs.hint_usage_rate || 0,
      reviewCount: reviewData?.review_count || 0,
      collaborationCount: collaborationData?.collaboration_count || 0,
      emotionalState: recentLogs.avg_emotional_state || 2
    }
    
    // 4. 各理論スコアを計算
    const updates: TheoryScoreUpdate[] = []
    
    // F1: 学習様式
    const f1Score = analyzeF1LearningStyle(historyData)
    const oldF1 = await getTheoryScore(env.DB, studentId, 'F1')
    if (Math.abs(f1Score - oldF1) > 5) { // 5点以上の変化があれば更新
      updates.push({
        theoryCode: 'F1',
        theoryName: '戦略的学習様式',
        oldScore: oldF1,
        newScore: f1Score,
        changeReason: `正答率${(historyData.correctRate * 100).toFixed(1)}%、ヒント使用率${(historyData.hintUsageRate * 100).toFixed(1)}%から推定`,
        confidence: 0.8
      })
    }
    
    // F2: 成長マインドセット
    const f2Score = analyzeF2GrowthMindset(historyData)
    const oldF2 = await getTheoryScore(env.DB, studentId, 'F2')
    if (Math.abs(f2Score - oldF2) > 5) {
      updates.push({
        theoryCode: 'F2',
        theoryName: '成長マインドセット',
        oldScore: oldF2,
        newScore: f2Score,
        changeReason: `復習${historyData.reviewCount}回、問題${historyData.problemCount}問から推定`,
        confidence: 0.75
      })
    }
    
    // F5: 自己調整学習
    const f5Score = analyzeF5SelfRegulation(historyData)
    const oldF5 = await getTheoryScore(env.DB, studentId, 'F5')
    if (Math.abs(f5Score - oldF5) > 5) {
      updates.push({
        theoryCode: 'F5',
        theoryName: '自己調整学習',
        oldScore: oldF5,
        newScore: f5Score,
        changeReason: `学習時間${(historyData.sessionDuration / 60).toFixed(1)}分、ヒント使用率${(historyData.hintUsageRate * 100).toFixed(1)}%から推定`,
        confidence: 0.85
      })
    }
    
    // F8: ウェルビーイング
    const f8Score = analyzeF8Wellbeing(historyData)
    const oldF8 = await getTheoryScore(env.DB, studentId, 'F8')
    if (Math.abs(f8Score - oldF8) > 5) {
      updates.push({
        theoryCode: 'F8',
        theoryName: 'ウェルビーイング',
        oldScore: oldF8,
        newScore: f8Score,
        changeReason: `感情状態${historyData.emotionalState.toFixed(1)}、継続性から推定`,
        confidence: 0.7
      })
    }
    
    // 5. スコアをデータベースに更新
    for (const update of updates) {
      await env.DB.prepare(`
        INSERT INTO theory_mastery_scores (student_id, theory_code, score, confidence, last_updated)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(student_id, theory_code) 
        DO UPDATE SET 
          score = excluded.score,
          confidence = excluded.confidence,
          last_updated = excluded.last_updated
      `).bind(studentId, update.theoryCode, update.newScore, update.confidence).run()
      
      // 更新ログを記録
      await env.DB.prepare(`
        INSERT INTO theory_score_history (student_id, theory_code, old_score, new_score, change_reason, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(studentId, update.theoryCode, update.oldScore, update.newScore, update.changeReason).run()
    }
    
    // 6. 学習パス再最適化
    const optimizedPath = await optimizeLearningPath(env.DB, studentId, updates)
    
    return c.json({
      success: true,
      updates,
      historyData,
      optimizedPath,
      message: `${updates.length}件の理論スコアを更新し、学習パスを最適化しました`
    })
    
  } catch (error) {
    console.error('理論スコア自動更新エラー:', error)
    return c.json({
      success: false,
      error: '理論スコアの更新に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 理論スコア取得ヘルパー
 */
async function getTheoryScore(db: D1Database, studentId: string, theoryCode: string): Promise<number> {
  const result = await db.prepare(`
    SELECT score FROM theory_mastery_scores
    WHERE student_id = ? AND theory_code = ?
  `).bind(studentId, theoryCode).first()
  
  return result?.score || 50 // デフォルト50点
}

/**
 * 学習パス最適化
 */
async function optimizeLearningPath(db: D1Database, studentId: string, updates: TheoryScoreUpdate[]): Promise<any> {
  // 1. 更新された理論に基づいて推薦カードを再計算
  const updatedTheories = updates.map(u => u.theoryCode)
  
  // 2. 弱点理論を特定
  const weakTheories = updates.filter(u => u.newScore < 60)
  
  // 3. 強化すべき理論に対応するカードを優先的に推薦
  const recommendedCards = []
  for (const theory of weakTheories) {
    const cards = await db.prepare(`
      SELECT c.card_id, c.title, cta.alignment_strength, cta.expected_effect
      FROM card_theory_alignment cta
      JOIN learning_cards c ON cta.card_id = c.card_id
      WHERE cta.theory_code = ?
        AND cta.alignment_strength IN ('primary', 'secondary')
      ORDER BY 
        CASE cta.alignment_strength 
          WHEN 'primary' THEN 1
          WHEN 'secondary' THEN 2
          ELSE 3
        END
      LIMIT 5
    `).bind(theory.theoryCode).all()
    
    recommendedCards.push({
      theoryCode: theory.theoryCode,
      theoryName: theory.theoryName,
      currentScore: theory.newScore,
      targetScore: 70,
      cards: cards.results
    })
  }
  
  return {
    updatedTheories,
    weakTheories: weakTheories.map(t => ({
      code: t.theoryCode,
      name: t.theoryName,
      score: t.newScore
    })),
    recommendedCards,
    optimizationStrategy: weakTheories.length > 0 
      ? `${weakTheories.length}つの理論を強化するため、対応する学習カードを優先的に推薦します`
      : 'すべての理論スコアが良好です。現在の学習を継続してください'
  }
}

/**
 * 理論スコア履歴取得
 * GET /api/theory/score-history/:studentId/:theoryCode
 */
app.get('/score-history/:studentId/:theoryCode', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const theoryCode = c.req.param('theoryCode')
  
  try {
    const history = await env.DB.prepare(`
      SELECT 
        theory_code,
        old_score,
        new_score,
        change_reason,
        created_at
      FROM theory_score_history
      WHERE student_id = ? AND theory_code = ?
      ORDER BY created_at DESC
      LIMIT 30
    `).bind(studentId, theoryCode).all()
    
    return c.json({
      success: true,
      history: history.results
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '履歴の取得に失敗しました'
    }, 500)
  }
})

/**
 * すべての生徒の理論スコア一括更新（バッチ処理用）
 * POST /api/theory/batch-update
 */
app.post('/batch-update', async (c) => {
  const { env } = c
  
  try {
    // アクティブな生徒一覧取得（過去30日間に学習がある生徒）
    const activeStudents = await env.DB.prepare(`
      SELECT DISTINCT student_id
      FROM learning_logs
      WHERE created_at >= datetime('now', '-30 days')
    `).all()
    
    const results = []
    let successCount = 0
    let errorCount = 0
    
    for (const student of activeStudents.results) {
      try {
        // 各生徒の理論スコアを更新
        const response = await fetch(`${c.req.url.replace('/batch-update', '')}/auto-update/${student.student_id}`, {
          method: 'POST',
          headers: c.req.raw.headers
        })
        
        if (response.ok) {
          successCount++
        } else {
          errorCount++
        }
        
        const data = await response.json()
        results.push({
          studentId: student.student_id,
          success: response.ok,
          updates: data.updates?.length || 0
        })
      } catch (error) {
        errorCount++
        results.push({
          studentId: student.student_id,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    return c.json({
      success: true,
      totalStudents: activeStudents.results.length,
      successCount,
      errorCount,
      results
    })
    
  } catch (error) {
    return c.json({
      success: false,
      error: '一括更新に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 最適化統計情報取得
 * GET /api/theory/optimization-stats/:studentId
 */
app.get('/optimization-stats/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 過去30日間の理論スコア変化を取得
    const scoreChanges = await env.DB.prepare(`
      SELECT 
        theory_code,
        MIN(old_score) as min_score,
        MAX(new_score) as max_score,
        AVG(new_score - old_score) as avg_change,
        COUNT(*) as update_count
      FROM theory_score_history
      WHERE student_id = ?
        AND created_at >= datetime('now', '-30 days')
      GROUP BY theory_code
    `).bind(studentId).all()
    
    // 学習パス最適化の効果
    const learningEfficiency = await env.DB.prepare(`
      SELECT 
        AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as correct_rate,
        COUNT(*) as problem_count,
        AVG(session_duration_seconds) as avg_duration
      FROM learning_logs
      WHERE student_id = ?
        AND created_at >= datetime('now', '-30 days')
    `).bind(studentId).first()
    
    return c.json({
      success: true,
      scoreChanges: scoreChanges.results,
      learningEfficiency,
      interpretation: {
        overallProgress: scoreChanges.results.length > 0 ? '理論スコアが継続的に更新されています' : 'まだ十分な学習データがありません',
        recommendation: learningEfficiency && learningEfficiency.correct_rate > 0.7 
          ? '現在の学習方法が効果的です。このまま継続してください'
          : '学習方法の見直しをおすすめします。先生に相談してみましょう'
      }
    })
    
  } catch (error) {
    return c.json({
      success: false,
      error: '統計情報の取得に失敗しました'
    }, 500)
  }
})

export default app
