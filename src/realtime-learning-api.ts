/**
 * Phase 18-1: リアルタイム適応学習 API
 * 
 * Durable ObjectsとHTTP APIの統合
 */

import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  AI: any
  REALTIME_LEARNING: DurableObjectNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * WebSocket接続エンドポイント
 * GET /api/realtime/connect
 */
app.get('/connect', async (c) => {
  const { env } = c
  const studentId = c.req.query('studentId')
  
  if (!studentId) {
    return c.json({
      success: false,
      error: 'studentIdが必要です'
    }, 400)
  }
  
  // Durable Object IDを生成（生徒IDベース）
  const id = env.REALTIME_LEARNING.idFromName(studentId)
  const stub = env.REALTIME_LEARNING.get(id)
  
  // WebSocketアップグレードをDurable Objectに転送
  return stub.fetch(c.req.raw)
})

/**
 * リアルタイムセッション状態取得
 * GET /api/realtime/status/:studentId
 */
app.get('/status/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const id = env.REALTIME_LEARNING.idFromName(studentId)
    const stub = env.REALTIME_LEARNING.get(id)
    
    const response = await stub.fetch(new Request('http://dummy/status'))
    const status = await response.json()
    
    return c.json({
      success: true,
      status
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'ステータスの取得に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * リアルタイム理論スコア取得
 * GET /api/realtime/theory-scores/:studentId
 */
app.get('/theory-scores/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // Durable Objectから最新スコア取得
    const id = env.REALTIME_LEARNING.idFromName(studentId)
    const stub = env.REALTIME_LEARNING.get(id)
    
    const response = await stub.fetch(new Request('http://dummy/status'))
    const data = await response.json()
    
    // データベースの永続スコアも取得
    const dbScores = await env.DB.prepare(`
      SELECT theory_code, score, confidence, last_updated
      FROM theory_mastery_scores
      WHERE student_id = ?
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      realtimeScores: data.theoryScores,
      persistedScores: dbScores.results,
      message: 'リアルタイムスコアは進行中のセッションから取得されます'
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'スコアの取得に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * リアルタイム推薦取得
 * POST /api/realtime/recommend
 */
app.post('/recommend', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const { studentId, context } = body
  
  if (!studentId) {
    return c.json({
      success: false,
      error: 'studentIdが必要です'
    }, 400)
  }
  
  try {
    // 現在の理論スコアを取得
    const id = env.REALTIME_LEARNING.idFromName(studentId)
    const stub = env.REALTIME_LEARNING.get(id)
    
    const response = await stub.fetch(new Request('http://dummy/status'))
    const status = await response.json()
    
    const theoryScores = status.theoryScores || {}
    
    // 弱点理論を特定
    const weakTheories = Object.entries(theoryScores)
      .filter(([_, score]) => (score as number) < 60)
      .map(([code]) => code)
    
    // 推薦カード取得
    const recommendations = []
    
    for (const theoryCode of weakTheories.slice(0, 3)) {
      const cards = await env.DB.prepare(`
        SELECT 
          c.card_id,
          c.title,
          c.difficulty,
          cta.expected_effect
        FROM card_theory_alignment cta
        JOIN learning_cards c ON cta.card_id = c.card_id
        WHERE cta.theory_code = ?
          AND cta.alignment_strength = 'primary'
        ORDER BY c.difficulty ASC
        LIMIT 2
      `).bind(theoryCode).all()
      
      if (cards.results.length > 0) {
        recommendations.push({
          theoryCode,
          theoryName: getTheoryName(theoryCode),
          currentScore: theoryScores[theoryCode],
          cards: cards.results,
          priority: 60 - (theoryScores[theoryCode] || 50) // スコアが低いほど優先度高
        })
      }
    }
    
    // 優先度順にソート
    recommendations.sort((a, b) => b.priority - a.priority)
    
    return c.json({
      success: true,
      recommendations,
      context: {
        totalWeaknesses: weakTheories.length,
        strongestTheory: Object.entries(theoryScores)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0],
        realtimeAnalysis: true
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '推薦の生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * リアルタイムセッション永続化
 * POST /api/realtime/persist/:studentId
 */
app.post('/persist/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // Durable Objectから現在のスコア取得
    const id = env.REALTIME_LEARNING.idFromName(studentId)
    const stub = env.REALTIME_LEARNING.get(id)
    
    const response = await stub.fetch(new Request('http://dummy/status'))
    const status = await response.json()
    
    const theoryScores = status.theoryScores || {}
    
    // データベースに永続化
    const updates = []
    for (const [theoryCode, score] of Object.entries(theoryScores)) {
      const result = await env.DB.prepare(`
        INSERT INTO theory_mastery_scores (student_id, theory_code, score, confidence, last_updated)
        VALUES (?, ?, ?, 0.9, datetime('now'))
        ON CONFLICT(student_id, theory_code) 
        DO UPDATE SET 
          score = excluded.score,
          confidence = 0.9,
          last_updated = excluded.last_updated
      `).bind(studentId, theoryCode, score).run()
      
      updates.push({ theoryCode, score })
    }
    
    return c.json({
      success: true,
      updates,
      message: `${updates.length}件の理論スコアを永続化しました`
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '永続化に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * リアルタイム学習履歴取得
 * GET /api/realtime/history/:studentId
 */
app.get('/history/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const limit = parseInt(c.req.query('limit') || '20')
  
  try {
    // データベースから履歴取得
    const history = await env.DB.prepare(`
      SELECT 
        event_type,
        event_data,
        theory_updates,
        created_at
      FROM realtime_learning_events
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(studentId, limit).all()
    
    return c.json({
      success: true,
      history: history.results,
      count: history.results.length
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '履歴の取得に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * リアルタイム分析統計
 * GET /api/realtime/analytics/:studentId
 */
app.get('/analytics/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 過去24時間のイベント分析
    const stats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN event_type = 'problem_start' THEN 1 ELSE 0 END) as problems_started,
        SUM(CASE WHEN event_type = 'answer_submit' THEN 1 ELSE 0 END) as answers_submitted,
        SUM(CASE WHEN event_type = 'hint_request' THEN 1 ELSE 0 END) as hints_requested,
        AVG(CASE 
          WHEN event_type = 'answer_submit' 
            AND json_extract(event_data, '$.isCorrect') = 1 
          THEN 1.0 ELSE 0.0 
        END) as realtime_correct_rate
      FROM realtime_learning_events
      WHERE student_id = ?
        AND created_at >= datetime('now', '-24 hours')
    `).bind(studentId).first()
    
    // 理論スコアの変化トレンド
    const trends = await env.DB.prepare(`
      SELECT 
        theory_code,
        COUNT(*) as update_count,
        SUM(CASE WHEN delta > 0 THEN 1 ELSE 0 END) as positive_updates,
        SUM(CASE WHEN delta < 0 THEN 1 ELSE 0 END) as negative_updates,
        AVG(delta) as avg_delta
      FROM (
        SELECT 
          json_extract(value, '$.theoryCode') as theory_code,
          json_extract(value, '$.delta') as delta
        FROM realtime_learning_events, json_each(theory_updates)
        WHERE student_id = ?
          AND created_at >= datetime('now', '-24 hours')
          AND theory_updates IS NOT NULL
      )
      GROUP BY theory_code
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      analytics: {
        period: '過去24時間',
        stats,
        trends: trends.results,
        interpretation: {
          activity: stats?.total_events > 10 ? 'アクティブ' : '低活動',
          performance: (stats?.realtime_correct_rate || 0) > 0.7 ? '良好' : '要改善',
          engagement: (stats?.hints_requested || 0) < 5 ? '自律的' : 'サポート必要'
        }
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: '分析の取得に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * ヘルパー関数
 */
function getTheoryName(code: string): string {
  const names: Record<string, string> = {
    F1: '戦略的学習様式',
    F2: '統合的能力発達',
    F3: '深化的経験学習',
    F4: 'データ駆動型適応指導',
    F5: '統合的自己調整学習',
    F6: 'エビデンスベースド学習方略',
    F7: '動的足場かけ',
    F8: 'ウェルビーイング統合動機づけ',
    F9: '21世紀型コンピテンシー',
    F10: '領域固有認知発達',
    F11: '真正学習・実践参加',
    F12: '神経情動統合学習'
  }
  return names[code] || code
}

export default app
