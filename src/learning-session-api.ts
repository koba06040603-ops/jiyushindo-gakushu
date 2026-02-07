/**
 * Phase 18-3-5: 学習セッションAPI
 * 
 * 主要機能:
 * 1. セッション管理（開始・継続・終了）
 * 2. 問題配信（適応的難易度調整）
 * 3. リアルタイム進捗トラッキング
 * 4. 学習統計計算
 * 
 * 科学的根拠:
 * - セッション管理: 学習の構造化 d=0.60 (Hattie 2009)
 * - 進捗可視化: 自己調整学習 d=0.52 (Dignath & Büttner 2008)
 */

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// =====================================
// セッション管理API
// =====================================

/**
 * 1. 学習セッション開始
 * POST /api/learning-session/start
 */
app.post('/start', async (c: Context) => {
  const { DB } = c.env as Bindings
  const { studentId, cardId } = await c.req.json()
  
  try {
    // セッションID生成
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // カード情報取得
    const card = await DB.prepare(`
      SELECT id, title, subject, grade, difficulty, course_type, theory_alignment
      FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ success: false, error: 'Card not found' }, 404)
    }
    
    // セッション作成
    // Note: learning_sessionsテーブルのIDカラムは session_id なので注意
    await DB.prepare(`
      INSERT INTO learning_sessions (
        student_id, card_id, created_at
      ) VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(
      studentId,
      cardId
    ).run()
    
    // 作成されたセッションIDを取得
    const createdSession = await DB.prepare(`
      SELECT session_id as id FROM learning_sessions 
      WHERE student_id = ? AND card_id = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(studentId, cardId).first() as any
    
    // 初回問題取得（難易度に基づく）
    const initialProblems = await DB.prepare(`
      SELECT id, question, difficulty, theory_alignment
      FROM problems
      WHERE card_id = ? AND difficulty <= ?
      ORDER BY RANDOM()
      LIMIT 3
    `).bind(cardId, card.difficulty).all()
    
    return c.json({
      success: true,
      sessionId: createdSession.id,
      card,
      initialProblems: initialProblems.results,
      message: 'Session started successfully'
    })
  } catch (error) {
    console.error('セッション開始エラー:', error)
    return c.json({ success: false, error: 'Failed to start session' }, 500)
  }
})

/**
 * 2. セッション情報取得
 * GET /api/learning-session/:sessionId
 */
app.get('/:sessionId', async (c: Context) => {
  const { DB } = c.env as Bindings
  const sessionId = c.req.param('sessionId')
  
  try {
    const session = await DB.prepare(`
      SELECT 
        ls.*,
        lc.title as card_title,
        lc.subject,
        lc.unit_name,
        COUNT(sa.id) as problems_attempted,
        SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) as problems_correct,
        AVG(sa.time_spent_seconds) as avg_time_per_problem
      FROM learning_sessions ls
      JOIN learning_cards lc ON ls.card_id = lc.id
      LEFT JOIN student_answers sa ON sa.session_id = ls.session_id
      WHERE ls.session_id = ?
      GROUP BY ls.session_id
    `).bind(sessionId).first()
    
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404)
    }
    
    return c.json({ success: true, session })
  } catch (error) {
    console.error('セッション取得エラー:', error)
    return c.json({ success: false, error: 'Failed to get session' }, 500)
  }
})

/**
 * 3. 次の問題取得（適応的難易度調整）
 * GET /api/learning-session/:sessionId/next-problem
 */
app.get('/:sessionId/next-problem', async (c: Context) => {
  const { DB } = c.env as Bindings
  const sessionId = c.req.param('sessionId')
  
  try {
    // セッション情報取得
    const session = await DB.prepare(`
      SELECT ls.*, sa.is_correct
      FROM learning_sessions ls
      LEFT JOIN student_answers sa ON sa.session_id = ls.session_id
      WHERE ls.session_id = ?
      ORDER BY sa.created_at DESC
      LIMIT 1
    `).bind(sessionId).first() as any
    
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404)
    }
    
    // 過去の正答率を計算
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
      FROM student_answers
      WHERE session_id = ?
    `).bind(sessionId).first() as any
    
    const accuracy = stats.total > 0 ? stats.correct / stats.total : 0.5
    
    // 適応的難易度決定
    let targetDifficulty = 3 // デフォルト難易度
    if (accuracy > 0.8 && stats.total >= 3) {
      // 正答率高い → 難易度UP
      targetDifficulty = Math.min(5, targetDifficulty + 1)
    } else if (accuracy < 0.5 && stats.total >= 3) {
      // 正答率低い → 難易度DOWN
      targetDifficulty = Math.max(1, targetDifficulty - 1)
    }
    
    // 既に解いた問題を除外して次の問題を取得
    const nextProblem = await DB.prepare(`
      SELECT p.*
      FROM problems p
      WHERE p.card_id = ?
        AND p.difficulty = ?
        AND p.id NOT IN (
          SELECT problem_id FROM student_answers WHERE session_id = ?
        )
      ORDER BY RANDOM()
      LIMIT 1
    `).bind(session.card_id, targetDifficulty, sessionId).first()
    
    if (!nextProblem) {
      // 該当難易度の問題なし → セッション完了
      return c.json({
        success: true,
        completed: true,
        message: 'No more problems available'
      })
    }
    
    return c.json({
      success: true,
      problem: nextProblem,
      currentDifficulty: targetDifficulty,
      accuracy: Math.round(accuracy * 100)
    })
  } catch (error) {
    console.error('次の問題取得エラー:', error)
    return c.json({ success: false, error: 'Failed to get next problem' }, 500)
  }
})

/**
 * 4. 解答提出
 * POST /api/learning-session/:sessionId/submit-answer
 */
app.post('/:sessionId/submit-answer', async (c: Context) => {
  const { DB, KV } = c.env as Bindings
  const sessionId = c.req.param('sessionId')
  const { problemId, answer, timeSpent, hintsUsed } = await c.req.json()
  
  try {
    // 問題取得
    const problem = await DB.prepare(`
      SELECT * FROM problems WHERE id = ?
    `).bind(problemId).first() as any
    
    if (!problem) {
      return c.json({ success: false, error: 'Problem not found' }, 404)
    }
    
    // 正誤判定
    const isCorrect = answer.trim().toLowerCase() === problem.correct_answer.trim().toLowerCase()
    
    // 解答記録
    await DB.prepare(`
      INSERT INTO student_answers (
        session_id, problem_id, student_answer, is_correct,
        time_spent_seconds, hints_used, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      sessionId,
      problemId,
      answer,
      isCorrect ? 1 : 0,
      timeSpent,
      hintsUsed || 0
    ).run()
    
    // キャッシュ無効化（生徒統計）
    const session = await DB.prepare(`SELECT student_id FROM learning_sessions WHERE session_id = ?`).bind(sessionId).first() as any
    await KV.delete(`student:profile:${session.student_id}`)
    await KV.delete(`recommend:cards:${session.student_id}`)
    
    return c.json({
      success: true,
      isCorrect,
      correctAnswer: problem.correct_answer,
      explanation: problem.explanation
    })
  } catch (error) {
    console.error('解答提出エラー:', error)
    return c.json({ success: false, error: 'Failed to submit answer' }, 500)
  }
})

/**
 * 5. セッション終了
 * POST /api/learning-session/:sessionId/complete
 */
app.post('/:sessionId/complete', async (c: Context) => {
  const { DB, KV } = c.env as Bindings
  const sessionId = c.req.param('sessionId')
  
  try {
    // セッション情報取得
    const session = await DB.prepare(`
      SELECT * FROM learning_sessions WHERE session_id = ?
    `).bind(sessionId).first() as any
    
    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404)
    }
    
    // 最終統計計算
    const finalStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_problems,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_problems,
        AVG(time_spent_seconds) as avg_time
      FROM student_answers
      WHERE session_id = ?
    `).bind(sessionId).first() as any
    
    const accuracy = finalStats.total_problems > 0
      ? finalStats.correct_problems / finalStats.total_problems
      : 0
    
    // キャッシュ無効化
    await KV.delete(`student:profile:${session.student_id}`)
    await KV.delete(`theory:scores:${session.student_id}`)
    
    return c.json({
      success: true,
      finalStats: {
        totalProblems: finalStats.total_problems,
        correctProblems: finalStats.correct_problems,
        accuracy: Math.round(accuracy * 100),
        avgTimePerProblem: Math.round(finalStats.avg_time)
      },
      message: 'Session completed successfully'
    })
  } catch (error) {
    console.error('セッション完了エラー:', error)
    return c.json({ success: false, error: 'Failed to complete session' }, 500)
  }
})

/**
 * 6. 週間統計
 * GET /api/learning-session/weekly-stats/:studentId
 */
app.get('/weekly-stats/:studentId', async (c: Context) => {
  const { DB } = c.env as Bindings
  const studentId = c.req.param('studentId')
  
  try {
    // 週間統計をstudent_answersとlearning_sessionsから計算
    const stats = await DB.prepare(`
      SELECT 
        COUNT(DISTINCT ls.session_id) as total_sessions,
        SUM(sa.time_spent_seconds) / 60.0 as total_time,
        COUNT(sa.id) as total_problems,
        CASE 
          WHEN COUNT(sa.id) > 0 
          THEN ROUND(SUM(CASE WHEN sa.is_correct = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(sa.id), 2)
          ELSE 0
        END as avg_accuracy,
        COUNT(DISTINCT ls.card_id) as completed_cards
      FROM learning_sessions ls
      LEFT JOIN student_answers sa ON sa.session_id = ls.session_id
      WHERE ls.student_id = ?
        AND ls.created_at >= date('now', '-7 days')
      GROUP BY ls.student_id
    `).bind(studentId).first()
    
    return c.json({ success: true, stats })
  } catch (error) {
    console.error('週間統計エラー:', error)
    return c.json({ success: false, error: 'Failed to get weekly stats' }, 500)
  }
})

/**
 * 7. 連続学習日数
 * GET /api/learning-session/streak/:studentId
 */
app.get('/streak/:studentId', async (c: Context) => {
  const { DB } = c.env as Bindings
  const studentId = c.req.param('studentId')
  
  try {
    // 過去の学習日を取得
    const learningDays = await DB.prepare(`
      SELECT DISTINCT DATE(created_at) as study_date
      FROM learning_sessions
      WHERE student_id = ?
      ORDER BY study_date DESC
      LIMIT 365
    `).bind(studentId).all()
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const row of learningDays.results as any[]) {
      const studyDate = new Date(row.study_date)
      studyDate.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((currentDate.getTime() - studyDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === streak) {
        streak++
      } else {
        break
      }
    }
    
    return c.json({ success: true, streak })
  } catch (error) {
    console.error('連続日数エラー:', error)
    return c.json({ success: false, error: 'Failed to get streak' }, 500)
  }
})

/**
 * 8. 最後の未完了セッション取得
 * GET /api/learning-session/last-incomplete/:studentId
 */
app.get('/last-incomplete/:studentId', async (c: Context) => {
  const { DB } = c.env as Bindings
  const studentId = c.req.param('studentId')
  
  try {
    // 最新の学習セッションを取得（完了していないもの）
    // Note: statusカラムがない場合は、単に最新のセッションを返す
    const session = await DB.prepare(`
      SELECT ls.session_id as id, ls.*, lc.title as card_title
      FROM learning_sessions ls
      JOIN learning_cards lc ON ls.card_id = lc.id
      WHERE ls.student_id = ?
      ORDER BY ls.created_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    return c.json({ success: true, session })
  } catch (error) {
    console.error('未完了セッション取得エラー:', error)
    return c.json({ success: false, error: 'Failed to get last incomplete session' }, 500)
  }
})

export default app
