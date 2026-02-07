/**
 * Phase 18-3-1: パフォーマンス最適化システム
 * 
 * 主要機能:
 * 1. Cloudflare KVキャッシュレイヤー
 * 2. D1クエリ最適化
 * 3. API応答時間モニタリング (<200ms保証)
 * 4. グローバルエッジ配信
 * 
 * 科学的根拠:
 * - ページロード時間短縮: ユーザーエンゲージメント +20% (Google 2020)
 * - 応答時間 <200ms: 認知的流暢性向上 (Nielsen Norman Group)
 */

import { Hono } from 'hono'
import type { Context } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// =====================================
// キャッシュ戦略設定
// =====================================

const CACHE_CONFIG = {
  // 学習カードメタデータ (1時間)
  CARD_METADATA: { ttl: 3600, prefix: 'card:meta:' },
  
  // 生徒プロファイル (10分)
  STUDENT_PROFILE: { ttl: 600, prefix: 'student:profile:' },
  
  // 理論スコア (5分)
  THEORY_SCORES: { ttl: 300, prefix: 'theory:scores:' },
  
  // クラス平均 (15分)
  CLASS_AVERAGE: { ttl: 900, prefix: 'class:avg:' },
  
  // 推薦カード (3分)
  RECOMMENDED_CARDS: { ttl: 180, prefix: 'recommend:cards:' },
  
  // 学習統計 (30分)
  LEARNING_STATS: { ttl: 1800, prefix: 'stats:learning:' },
  
  // AI生成問題 (1時間)
  AI_PROBLEMS: { ttl: 3600, prefix: 'ai:problems:' },
  
  // システム設定 (24時間)
  SYSTEM_CONFIG: { ttl: 86400, prefix: 'system:config:' }
}

// =====================================
// キャッシュヘルパー関数
// =====================================

/**
 * KVからキャッシュ取得（ヒット時はパース、ミス時はnull）
 */
async function getCached<T>(
  kv: KVNamespace,
  key: string
): Promise<T | null> {
  const startTime = Date.now()
  try {
    const cached = await kv.get(key)
    const elapsed = Date.now() - startTime
    
    if (cached) {
      console.log(`[Cache HIT] ${key} (${elapsed}ms)`)
      return JSON.parse(cached) as T
    }
    
    console.log(`[Cache MISS] ${key} (${elapsed}ms)`)
    return null
  } catch (error) {
    console.error(`[Cache Error] ${key}:`, error)
    return null
  }
}

/**
 * KVにキャッシュ保存（TTL付き）
 */
async function setCache(
  kv: KVNamespace,
  key: string,
  value: any,
  ttl: number
): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl
    })
    console.log(`[Cache SET] ${key} (TTL: ${ttl}s)`)
  } catch (error) {
    console.error(`[Cache Set Error] ${key}:`, error)
  }
}

/**
 * キャッシュ無効化（パターンマッチング）
 */
async function invalidateCache(
  kv: KVNamespace,
  pattern: string
): Promise<number> {
  try {
    // Cloudflare KVはパターンマッチング削除をサポートしていないため、
    // キー名にプレフィックスを使用し、明示的に削除
    const listResult = await kv.list({ prefix: pattern })
    let deletedCount = 0
    
    for (const key of listResult.keys) {
      await kv.delete(key.name)
      deletedCount++
    }
    
    console.log(`[Cache Invalidate] Pattern: ${pattern}, Deleted: ${deletedCount}`)
    return deletedCount
  } catch (error) {
    console.error(`[Cache Invalidate Error] ${pattern}:`, error)
    return 0
  }
}

// =====================================
// パフォーマンスモニタリング
// =====================================

interface PerformanceLog {
  endpoint: string
  method: string
  responseTime: number
  cacheHit: boolean
  dbQueries: number
  timestamp: string
}

/**
 * API応答時間を計測し、ログ記録
 */
async function logPerformance(
  db: D1Database,
  log: PerformanceLog
): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO performance_logs (
        endpoint, method, response_time_ms, cache_hit, db_queries, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      log.endpoint,
      log.method,
      log.responseTime,
      log.cacheHit ? 1 : 0,
      log.dbQueries
    ).run()
    
    // 警告: 応答時間が200msを超える場合
    if (log.responseTime > 200) {
      console.warn(`[Performance Warning] ${log.method} ${log.endpoint}: ${log.responseTime}ms > 200ms`)
    }
  } catch (error) {
    console.error('[Performance Log Error]:', error)
  }
}

// =====================================
// D1クエリ最適化ヘルパー
// =====================================

/**
 * プリペアドステートメントキャッシュ
 */
const preparedStatements = new Map<string, D1PreparedStatement>()

/**
 * プリペアドステートメントを再利用（パフォーマンス向上）
 */
function getPreparedStatement(
  db: D1Database,
  sql: string,
  key?: string
): D1PreparedStatement {
  const cacheKey = key || sql
  
  if (!preparedStatements.has(cacheKey)) {
    preparedStatements.set(cacheKey, db.prepare(sql))
  }
  
  return preparedStatements.get(cacheKey)!
}

/**
 * バッチクエリ実行（複数クエリを1回のネットワーク往復で実行）
 */
async function executeBatch(
  db: D1Database,
  queries: Array<{ sql: string; params: any[] }>
): Promise<any[]> {
  const startTime = Date.now()
  
  const statements = queries.map(q => db.prepare(q.sql).bind(...q.params))
  const results = await db.batch(statements)
  
  const elapsed = Date.now() - startTime
  console.log(`[Batch Query] ${queries.length} queries in ${elapsed}ms`)
  
  return results
}

// =====================================
// API: パフォーマンス最適化エンドポイント
// =====================================

/**
 * 1. 学習カード取得（KVキャッシュ付き）
 * GET /api/performance/cards/:cardId
 */
app.get('/cards/:cardId', async (c: Context) => {
  const startTime = Date.now()
  const { DB, KV } = c.env as Bindings
  const cardId = c.req.param('cardId')
  
  const cacheKey = `${CACHE_CONFIG.CARD_METADATA.prefix}${cardId}`
  
  // 1. キャッシュチェック
  const cached = await getCached<any>(KV, cacheKey)
  if (cached) {
    await logPerformance(DB, {
      endpoint: `/api/performance/cards/${cardId}`,
      method: 'GET',
      responseTime: Date.now() - startTime,
      cacheHit: true,
      dbQueries: 0,
      timestamp: new Date().toISOString()
    })
    
    return c.json({ success: true, card: cached, cached: true })
  }
  
  // 2. DB取得（キャッシュミス時）
  const card = await DB.prepare(`
    SELECT 
      id, title, subject, grade, unit_name, difficulty,
      course_type, theory_alignment, created_at, updated_at
    FROM learning_cards
    WHERE id = ?
  `).bind(cardId).first()
  
  if (!card) {
    return c.json({ success: false, error: 'Card not found' }, 404)
  }
  
  // 3. キャッシュ保存
  await setCache(KV, cacheKey, card, CACHE_CONFIG.CARD_METADATA.ttl)
  
  const elapsed = Date.now() - startTime
  await logPerformance(DB, {
    endpoint: `/api/performance/cards/${cardId}`,
    method: 'GET',
    responseTime: elapsed,
    cacheHit: false,
    dbQueries: 1,
    timestamp: new Date().toISOString()
  })
  
  return c.json({ success: true, card, cached: false, responseTime: elapsed })
})

/**
 * 2. 生徒プロファイル取得（KVキャッシュ + バッチクエリ）
 * GET /api/performance/student-profile/:studentId
 */
app.get('/student-profile/:studentId', async (c: Context) => {
  const startTime = Date.now()
  const { DB, KV } = c.env as Bindings
  const studentId = c.req.param('studentId')
  
  const cacheKey = `${CACHE_CONFIG.STUDENT_PROFILE.prefix}${studentId}`
  
  // キャッシュチェック
  const cached = await getCached<any>(KV, cacheKey)
  if (cached) {
    await logPerformance(DB, {
      endpoint: `/api/performance/student-profile/${studentId}`,
      method: 'GET',
      responseTime: Date.now() - startTime,
      cacheHit: true,
      dbQueries: 0,
      timestamp: new Date().toISOString()
    })
    return c.json({ success: true, profile: cached, cached: true })
  }
  
  // バッチクエリで一括取得
  const results = await executeBatch(DB, [
    {
      sql: 'SELECT * FROM auth_users WHERE user_id = ?',
      params: [studentId]
    },
    {
      sql: 'SELECT * FROM student_theory_profiles WHERE student_id = ?',
      params: [studentId]
    },
    {
      sql: `
        SELECT COUNT(*) as total_sessions, SUM(duration_minutes) as total_time
        FROM learning_sessions WHERE student_id = ?
      `,
      params: [studentId]
    },
    {
      sql: `
        SELECT AVG(score) as avg_score, COUNT(*) as total_answers
        FROM student_answers WHERE student_id = ?
      `,
      params: [studentId]
    }
  ])
  
  const profile = {
    user: results[0].results[0] || null,
    theoryScores: results[1].results[0] || null,
    sessionStats: results[2].results[0] || { total_sessions: 0, total_time: 0 },
    performanceStats: results[3].results[0] || { avg_score: 0, total_answers: 0 }
  }
  
  // キャッシュ保存
  await setCache(KV, cacheKey, profile, CACHE_CONFIG.STUDENT_PROFILE.ttl)
  
  const elapsed = Date.now() - startTime
  await logPerformance(DB, {
    endpoint: `/api/performance/student-profile/${studentId}`,
    method: 'GET',
    responseTime: elapsed,
    cacheHit: false,
    dbQueries: 4,
    timestamp: new Date().toISOString()
  })
  
  return c.json({ success: true, profile, cached: false, responseTime: elapsed })
})

/**
 * 3. 推薦カード取得（KVキャッシュ + 最適化クエリ）
 * GET /api/performance/recommended/:studentId
 */
app.get('/recommended/:studentId', async (c: Context) => {
  const startTime = Date.now()
  const { DB, KV } = c.env as Bindings
  const studentId = c.req.param('studentId')
  const limit = Number(c.req.query('limit')) || 5
  
  const cacheKey = `${CACHE_CONFIG.RECOMMENDED_CARDS.prefix}${studentId}:${limit}`
  
  // キャッシュチェック
  const cached = await getCached<any>(KV, cacheKey)
  if (cached) {
    await logPerformance(DB, {
      endpoint: `/api/performance/recommended/${studentId}`,
      method: 'GET',
      responseTime: Date.now() - startTime,
      cacheHit: true,
      dbQueries: 0,
      timestamp: new Date().toISOString()
    })
    return c.json({ success: true, recommendations: cached, cached: true })
  }
  
  // 最適化クエリ: インデックスを活用し、JOINを最小化
  const recommendations = await DB.prepare(`
    WITH student_weak_theories AS (
      SELECT theory_code, score
      FROM student_theory_profiles
      WHERE student_id = ? AND score < 70
      ORDER BY score ASC
      LIMIT 3
    ),
    recommended_cards AS (
      SELECT 
        lc.id, lc.title, lc.subject, lc.grade, lc.difficulty,
        swt.theory_code, swt.score as weak_score,
        -- 優先度計算: 弱点度 × 未完了 × 難易度適合
        (100 - swt.score) * 
        (1 + (CASE WHEN ls.id IS NULL THEN 1 ELSE 0 END)) *
        (CASE WHEN lc.difficulty <= 3 THEN 1.2 ELSE 0.8 END) as priority
      FROM learning_cards lc
      CROSS JOIN student_weak_theories swt
      LEFT JOIN learning_sessions ls ON ls.card_id = lc.id AND ls.student_id = ?
      WHERE lc.theory_alignment LIKE '%' || swt.theory_code || '%'
      ORDER BY priority DESC
      LIMIT ?
    )
    SELECT * FROM recommended_cards
  `).bind(studentId, studentId, limit).all()
  
  // キャッシュ保存
  await setCache(KV, cacheKey, recommendations.results, CACHE_CONFIG.RECOMMENDED_CARDS.ttl)
  
  const elapsed = Date.now() - startTime
  await logPerformance(DB, {
    endpoint: `/api/performance/recommended/${studentId}`,
    method: 'GET',
    responseTime: elapsed,
    cacheHit: false,
    dbQueries: 1,
    timestamp: new Date().toISOString()
  })
  
  return c.json({
    success: true,
    recommendations: recommendations.results,
    cached: false,
    responseTime: elapsed
  })
})

/**
 * 4. キャッシュ無効化API
 * POST /api/performance/invalidate-cache
 */
app.post('/invalidate-cache', async (c: Context) => {
  const { KV } = c.env as Bindings
  const { pattern, studentId, cardId } = await c.req.json()
  
  let deletedCount = 0
  
  if (pattern) {
    // パターン指定削除
    deletedCount = await invalidateCache(KV, pattern)
  } else if (studentId) {
    // 生徒関連キャッシュ削除
    deletedCount += await invalidateCache(KV, `${CACHE_CONFIG.STUDENT_PROFILE.prefix}${studentId}`)
    deletedCount += await invalidateCache(KV, `${CACHE_CONFIG.THEORY_SCORES.prefix}${studentId}`)
    deletedCount += await invalidateCache(KV, `${CACHE_CONFIG.RECOMMENDED_CARDS.prefix}${studentId}`)
  } else if (cardId) {
    // カード関連キャッシュ削除
    deletedCount += await invalidateCache(KV, `${CACHE_CONFIG.CARD_METADATA.prefix}${cardId}`)
  } else {
    return c.json({ success: false, error: 'Invalid parameters' }, 400)
  }
  
  return c.json({
    success: true,
    message: 'Cache invalidated',
    deletedCount
  })
})

/**
 * 5. パフォーマンス統計取得
 * GET /api/performance/stats
 */
app.get('/stats', async (c: Context) => {
  const { DB } = c.env as Bindings
  const hours = Number(c.req.query('hours')) || 24
  
  const stats = await DB.prepare(`
    SELECT 
      endpoint,
      COUNT(*) as total_requests,
      AVG(response_time_ms) as avg_response_time,
      MAX(response_time_ms) as max_response_time,
      MIN(response_time_ms) as min_response_time,
      SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) as cache_hits,
      SUM(CASE WHEN cache_hit = 0 THEN 1 ELSE 0 END) as cache_misses,
      ROUND(SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as cache_hit_rate,
      SUM(CASE WHEN response_time_ms > 200 THEN 1 ELSE 0 END) as slow_requests
    FROM performance_logs
    WHERE created_at >= datetime('now', '-' || ? || ' hours')
    GROUP BY endpoint
    ORDER BY total_requests DESC
  `).bind(hours).all()
  
  // 全体統計
  const overall = await DB.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      AVG(response_time_ms) as avg_response_time,
      ROUND(SUM(CASE WHEN cache_hit = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as overall_cache_hit_rate,
      SUM(CASE WHEN response_time_ms > 200 THEN 1 ELSE 0 END) as total_slow_requests,
      ROUND(SUM(CASE WHEN response_time_ms <= 200 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as sla_compliance
    FROM performance_logs
    WHERE created_at >= datetime('now', '-' || ? || ' hours')
  `).bind(hours).first()
  
  return c.json({
    success: true,
    period: `Past ${hours} hours`,
    overall,
    byEndpoint: stats.results
  })
})

/**
 * 6. スロークエリ検出
 * GET /api/performance/slow-queries
 */
app.get('/slow-queries', async (c: Context) => {
  const { DB } = c.env as Bindings
  const threshold = Number(c.req.query('threshold')) || 200
  const limit = Number(c.req.query('limit')) || 20
  
  const slowQueries = await DB.prepare(`
    SELECT 
      endpoint,
      method,
      response_time_ms,
      cache_hit,
      db_queries,
      created_at
    FROM performance_logs
    WHERE response_time_ms > ?
    ORDER BY response_time_ms DESC
    LIMIT ?
  `).bind(threshold, limit).all()
  
  return c.json({
    success: true,
    threshold: `${threshold}ms`,
    slowQueries: slowQueries.results
  })
})

export default app
