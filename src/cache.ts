/**
 * KVキャッシュシステム
 * Cloudflare KV を使用した高速データキャッシング
 * 
 * キャッシュ戦略:
 * - 学生進捗データ: TTL 5分（頻繁に更新）
 * - カリキュラムデータ: TTL 1時間（比較的静的）
 * - ScTNスコア: TTL 1日（定期的に計算）
 * - ランキングデータ: TTL 10分（リアルタイム性重視）
 */

import { Context } from 'hono';

// キャッシュTTL設定（秒）
export const CACHE_TTL = {
  STUDENT_PROGRESS: 300,      // 5分
  CURRICULUM: 3600,           // 1時間
  SCTN_SCORE: 86400,          // 1日
  RANKING: 600,               // 10分
  LEARNING_CARDS: 1800,       // 30分
  CLASS_STATS: 300,           // 5分
  WEEKLY_REPORT: 3600,        // 1時間
  MONTHLY_REPORT: 86400,      // 1日
} as const;

/**
 * キャッシュキー生成
 */
export function generateCacheKey(prefix: string, ...identifiers: (string | number)[]): string {
  return `${prefix}:${identifiers.join(':')}`;
}

/**
 * KVからキャッシュ取得
 */
export async function getFromCache<T>(
  KV: KVNamespace | undefined,
  key: string
): Promise<T | null> {
  if (!KV) {
    console.warn('KV namespace not configured');
    return null;
  }

  try {
    const cached = await KV.get(key);
    if (!cached) return null;

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`KV cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * KVにキャッシュ保存
 */
export async function setToCache<T>(
  KV: KVNamespace | undefined,
  key: string,
  value: T,
  ttl: number
): Promise<boolean> {
  if (!KV) {
    console.warn('KV namespace not configured');
    return false;
  }

  try {
    await KV.put(key, JSON.stringify(value), { expirationTtl: ttl });
    return true;
  } catch (error) {
    console.error(`KV cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * KVからキャッシュ削除
 */
export async function deleteFromCache(
  KV: KVNamespace | undefined,
  key: string
): Promise<boolean> {
  if (!KV) return false;

  try {
    await KV.delete(key);
    return true;
  } catch (error) {
    console.error(`KV cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * 複数キャッシュの一括削除（パターンマッチング）
 */
export async function invalidateCachePattern(
  KV: KVNamespace | undefined,
  pattern: string
): Promise<number> {
  if (!KV) return 0;

  try {
    // KVのlist APIでパターンにマッチするキーを取得
    const list = await KV.list({ prefix: pattern });
    let deletedCount = 0;

    for (const key of list.keys) {
      await KV.delete(key.name);
      deletedCount++;
    }

    return deletedCount;
  } catch (error) {
    console.error(`KV cache pattern invalidation error for pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * キャッシュ付きデータ取得ヘルパー
 * キャッシュにあればキャッシュから、なければDBから取得してキャッシュ
 */
export async function getCachedOrFetch<T>(
  KV: KVNamespace | undefined,
  cacheKey: string,
  ttl: number,
  fetchFunction: () => Promise<T>
): Promise<T> {
  // キャッシュチェック
  const cached = await getFromCache<T>(KV, cacheKey);
  if (cached !== null) {
    return cached;
  }

  // DBから取得
  const data = await fetchFunction();

  // キャッシュに保存
  await setToCache(KV, cacheKey, data, ttl);

  return data;
}

/**
 * 学生進捗データのキャッシュ管理
 */
export class StudentProgressCache {
  constructor(
    private KV: KVNamespace | undefined,
    private DB: D1Database
  ) {}

  async get(studentId: number) {
    const cacheKey = generateCacheKey('student_progress', studentId);
    
    return await getCachedOrFetch(
      this.KV,
      cacheKey,
      CACHE_TTL.STUDENT_PROGRESS,
      async () => {
        // DBから学生の全進捗データ取得
        const progress = await this.DB.prepare(`
          SELECT 
            sp.card_id,
            sp.status,
            sp.mastery_score,
            sp.attempt_count,
            sp.correct_count,
            sp.last_attempt_date,
            lc.card_title,
            lc.subject,
            lc.unit_name
          FROM student_progress sp
          JOIN learning_cards lc ON sp.card_id = lc.card_id
          WHERE sp.student_id = ?
          ORDER BY sp.last_attempt_date DESC
        `).bind(studentId).all();

        return progress.results;
      }
    );
  }

  async invalidate(studentId: number) {
    const cacheKey = generateCacheKey('student_progress', studentId);
    await deleteFromCache(this.KV, cacheKey);
  }
}

/**
 * カリキュラムデータのキャッシュ管理
 */
export class CurriculumCache {
  constructor(
    private KV: KVNamespace | undefined,
    private DB: D1Database
  ) {}

  async getList() {
    const cacheKey = 'curriculum:list';
    
    return await getCachedOrFetch(
      this.KV,
      cacheKey,
      CACHE_TTL.CURRICULUM,
      async () => {
        const result = await this.DB.prepare(`
          SELECT DISTINCT subject, grade_level, unit_name
          FROM learning_cards
          WHERE is_active = TRUE
          ORDER BY grade_level, subject, unit_name
        `).all();

        return result.results;
      }
    );
  }

  async getById(curriculumId: string) {
    const cacheKey = generateCacheKey('curriculum', curriculumId);
    
    return await getCachedOrFetch(
      this.KV,
      cacheKey,
      CACHE_TTL.CURRICULUM,
      async () => {
        const result = await this.DB.prepare(`
          SELECT *
          FROM learning_cards
          WHERE card_id = ?
        `).bind(curriculumId).first();

        return result;
      }
    );
  }

  async invalidateAll() {
    await invalidateCachePattern(this.KV, 'curriculum:');
  }
}

/**
 * ScTNスコアのキャッシュ管理
 */
export class ScTNScoreCache {
  constructor(
    private KV: KVNamespace | undefined,
    private DB: D1Database
  ) {}

  async get(studentId: number) {
    const cacheKey = generateCacheKey('sctn_score', studentId);
    
    return await getCachedOrFetch(
      this.KV,
      cacheKey,
      CACHE_TTL.SCTN_SCORE,
      async () => {
        const result = await this.DB.prepare(`
          SELECT *
          FROM sctn_scores
          WHERE student_id = ?
          ORDER BY survey_date DESC
          LIMIT 1
        `).bind(studentId).first();

        return result;
      }
    );
  }

  async invalidate(studentId: number) {
    const cacheKey = generateCacheKey('sctn_score', studentId);
    await deleteFromCache(this.KV, cacheKey);
  }
}

/**
 * ランキングデータのキャッシュ管理
 */
export class RankingCache {
  constructor(
    private KV: KVNamespace | undefined,
    private DB: D1Database
  ) {}

  async get(rankingType: string, periodType: string, classCode?: string) {
    const cacheKey = generateCacheKey(
      'ranking',
      rankingType,
      periodType,
      classCode || 'all'
    );
    
    return await getCachedOrFetch(
      this.KV,
      cacheKey,
      CACHE_TTL.RANKING,
      async () => {
        let query = `
          SELECT 
            re.student_id,
            s.student_name,
            re.score_value,
            re.rank_position
          FROM ranking_entries re
          JOIN students s ON re.student_id = s.student_id
          WHERE re.ranking_type = ? AND re.period_type = ?
        `;
        
        const params: any[] = [rankingType, periodType];
        
        if (classCode) {
          query += ' AND re.class_code = ?';
          params.push(classCode);
        }
        
        query += ' ORDER BY re.rank_position ASC LIMIT 100';

        const result = await this.DB.prepare(query).bind(...params).all();
        return result.results;
      }
    );
  }

  async invalidateAll(rankingType?: string) {
    const pattern = rankingType 
      ? `ranking:${rankingType}:` 
      : 'ranking:';
    await invalidateCachePattern(this.KV, pattern);
  }
}

/**
 * クラス統計のキャッシュ管理
 */
export class ClassStatsCache {
  constructor(
    private KV: KVNamespace | undefined,
    private DB: D1Database
  ) {}

  async get(classCode: string) {
    const cacheKey = generateCacheKey('class_stats', classCode);
    
    return await getCachedOrFetch(
      this.KV,
      cacheKey,
      CACHE_TTL.CLASS_STATS,
      async () => {
        // クラス全体の統計を計算
        const stats = await this.DB.prepare(`
          SELECT 
            COUNT(DISTINCT ce.student_id) as total_students,
            AVG(sp.mastery_score) as avg_mastery_score,
            SUM(CASE WHEN sp.status = 'completed' THEN 1 ELSE 0 END) as completed_cards,
            SUM(CASE WHEN sp.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_cards
          FROM class_enrollments ce
          LEFT JOIN student_progress sp ON ce.student_id = sp.student_id
          WHERE ce.class_id = (SELECT class_id FROM classes WHERE class_code = ?)
            AND ce.is_active = TRUE
        `).bind(classCode).first();

        return stats;
      }
    );
  }

  async invalidate(classCode: string) {
    const cacheKey = generateCacheKey('class_stats', classCode);
    await deleteFromCache(this.KV, cacheKey);
  }
}

/**
 * キャッシュウォーミング（事前キャッシュ）
 * アプリケーション起動時や定期的に実行
 */
export async function warmupCache(
  KV: KVNamespace | undefined,
  DB: D1Database
) {
  if (!KV) return;

  console.log('Starting cache warmup...');

  try {
    // カリキュラムリストをキャッシュ
    const curriculumCache = new CurriculumCache(KV, DB);
    await curriculumCache.getList();

    console.log('Cache warmup completed successfully');
  } catch (error) {
    console.error('Cache warmup failed:', error);
  }
}

/**
 * キャッシュ統計取得
 */
export async function getCacheStats(KV: KVNamespace | undefined) {
  if (!KV) {
    return {
      enabled: false,
      message: 'KV namespace not configured'
    };
  }

  try {
    // KVの統計情報を取得（一部のキープレフィックスでサンプリング）
    const prefixes = ['student_progress', 'curriculum', 'sctn_score', 'ranking', 'class_stats'];
    const stats: Record<string, number> = {};

    for (const prefix of prefixes) {
      const list = await KV.list({ prefix });
      stats[prefix] = list.keys.length;
    }

    return {
      enabled: true,
      total_keys: Object.values(stats).reduce((a, b) => a + b, 0),
      by_prefix: stats
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      enabled: true,
      error: 'Failed to retrieve stats'
    };
  }
}

/**
 * Phase 11-1: 高度なエッジキャッシュ戦略
 */

// 拡張されたキャッシュTTL設定
export const EXTENDED_CACHE_TTL = {
  // 超静的データ（ほとんど変わらない）
  SYSTEM_CONFIG: 86400 * 7,   // 1週間
  SCHOOL_INFO: 86400 * 3,      // 3日
  GRADE_LEVELS: 86400 * 7,     // 1週間
  SUBJECTS: 86400 * 7,         // 1週間
  
  // 静的データ（たまに変わる）
  CURRICULUM_FULL: 86400,      // 1日
  LEARNING_CARDS_LIST: 3600,   // 1時間
  TEACHERS_LIST: 3600,         // 1時間
  
  // 動的データ（よく変わる）
  STUDENT_LIST: 300,           // 5分
  RECENT_SESSIONS: 60,         // 1分
  NOTIFICATIONS: 30,           // 30秒
} as const;

/**
 * キャッシュヒット率追跡
 */
export class CacheMetrics {
  private hits = 0;
  private misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      total: this.hits + this.misses,
      hit_rate: this.getHitRate().toFixed(2) + '%'
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

// グローバルメトリクス
export const cacheMetrics = new CacheMetrics();

/**
 * 階層的キャッシュ取得（メトリクス付き）
 */
export async function getCachedOrFetchWithMetrics<T>(
  KV: KVNamespace | undefined,
  cacheKey: string,
  ttl: number,
  fetchFunction: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  // キャッシュチェック
  const cached = await getFromCache<T>(KV, cacheKey);
  if (cached !== null) {
    cacheMetrics.recordHit();
    return { data: cached, cached: true };
  }

  cacheMetrics.recordMiss();

  // DBから取得
  const data = await fetchFunction();

  // キャッシュに保存
  await setToCache(KV, cacheKey, data, ttl);

  return { data, cached: false };
}

/**
 * 条件付きキャッシュ（データの鮮度チェック）
 */
export async function getCachedWithFreshness<T>(
  KV: KVNamespace | undefined,
  cacheKey: string,
  ttl: number,
  fetchFunction: () => Promise<T>,
  freshnessCheck?: (cached: T) => boolean
): Promise<T> {
  const cached = await getFromCache<T>(KV, cacheKey);
  
  if (cached !== null) {
    // 鮮度チェック関数があれば実行
    if (freshnessCheck && !freshnessCheck(cached)) {
      console.log(`Cache stale for key: ${cacheKey}, refreshing...`);
      // キャッシュが古い場合は再取得
      const fresh = await fetchFunction();
      await setToCache(KV, cacheKey, fresh, ttl);
      return fresh;
    }
    return cached;
  }

  const data = await fetchFunction();
  await setToCache(KV, cacheKey, data, ttl);
  return data;
}

/**
 * バルクキャッシュ無効化（複数パターン一括削除）
 */
export async function invalidateMultiplePatterns(
  KV: KVNamespace | undefined,
  patterns: string[]
): Promise<number> {
  if (!KV) return 0;

  let totalDeleted = 0;
  for (const pattern of patterns) {
    const deleted = await invalidateCachePattern(KV, pattern);
    totalDeleted += deleted;
  }

  return totalDeleted;
}

/**
 * スマートキャッシュ無効化（関連データの自動検出）
 */
export async function smartInvalidateCache(
  KV: KVNamespace | undefined,
  entityType: 'student' | 'teacher' | 'curriculum' | 'class',
  entityId: number | string
): Promise<number> {
  if (!KV) return 0;

  const patterns: string[] = [];

  switch (entityType) {
    case 'student':
      patterns.push(
        `student_progress:${entityId}`,
        `ranking:student:${entityId}`,
        `weekly_report:${entityId}`,
        `monthly_report:${entityId}`,
        `sctn_score:${entityId}`
      );
      break;
    
    case 'teacher':
      patterns.push(
        `class_stats:teacher:${entityId}`,
        `teacher_dashboard:${entityId}`
      );
      break;
    
    case 'curriculum':
      patterns.push(
        `curriculum:${entityId}`,
        `learning_cards:curriculum:${entityId}`,
        `curriculum_list`
      );
      break;
    
    case 'class':
      patterns.push(
        `class_stats:${entityId}`,
        `ranking:class:${entityId}`,
        `class_progress:${entityId}`
      );
      break;
  }

  return await invalidateMultiplePatterns(KV, patterns);
}

/**
 * キャッシュプリウォーム（事前キャッシュ生成）
 */
export async function prewarmCriticalCaches(
  KV: KVNamespace | undefined,
  DB: D1Database
): Promise<void> {
  if (!KV) return;

  console.log('🔥 Prewarming critical caches...');

  try {
    // 1. カリキュラムリストをキャッシュ
    const curriculumKey = generateCacheKey('curriculum_list');
    const curriculum = await DB.prepare('SELECT * FROM curriculum ORDER BY grade, subject').all();
    await setToCache(KV, curriculumKey, curriculum.results, EXTENDED_CACHE_TTL.CURRICULUM_FULL);
    console.log('✅ Curriculum list cached');

    // 2. 教科リストをキャッシュ
    const subjectsKey = generateCacheKey('subjects_list');
    const subjects = await DB.prepare('SELECT DISTINCT subject FROM curriculum ORDER BY subject').all();
    await setToCache(KV, subjectsKey, subjects.results, EXTENDED_CACHE_TTL.SUBJECTS);
    console.log('✅ Subjects list cached');

    // 3. 学年リストをキャッシュ
    const gradesKey = generateCacheKey('grades_list');
    const grades = await DB.prepare('SELECT DISTINCT grade FROM curriculum ORDER BY grade').all();
    await setToCache(KV, gradesKey, grades.results, EXTENDED_CACHE_TTL.GRADE_LEVELS);
    console.log('✅ Grades list cached');

    console.log('🎉 Cache prewarm completed successfully');
  } catch (error) {
    console.error('❌ Cache prewarm failed:', error);
  }
}

/**
 * キャッシュヘルスチェック
 */
export async function checkCacheHealth(KV: KVNamespace | undefined): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  details: any;
}> {
  if (!KV) {
    return {
      status: 'down',
      details: { error: 'KV namespace not configured' }
    };
  }

  try {
    // テストキーで書き込み・読み取りテスト
    const testKey = 'health_check:' + Date.now();
    const testValue = { timestamp: Date.now() };
    
    await KV.put(testKey, JSON.stringify(testValue), { expirationTtl: 10 });
    const retrieved = await KV.get(testKey);
    await KV.delete(testKey);

    if (retrieved && JSON.parse(retrieved).timestamp === testValue.timestamp) {
      return {
        status: 'healthy',
        details: {
          read: true,
          write: true,
          delete: true,
          latency_ms: Date.now() - testValue.timestamp
        }
      };
    }

    return {
      status: 'degraded',
      details: { error: 'Read/write mismatch' }
    };
  } catch (error: any) {
    return {
      status: 'down',
      details: { error: error.message }
    };
  }
}
