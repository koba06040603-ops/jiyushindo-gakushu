/**
 * 認知科学ベースの学習最適化システム
 * Phase 15: 間隔反復学習（Spaced Repetition）エンジン
 */

import { D1Database } from '@cloudflare/workers-types'

/**
 * SM-2アルゴリズムに基づく間隔反復学習
 * https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm
 */

// 復習品質（0-5）
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

export interface SpacedRepetitionCard {
  card_id: string
  student_id: number
  content_type: 'concept' | 'problem' | 'vocabulary'
  content_id: string
  content_title: string
  easiness_factor: number // 容易度因子（1.3-2.5）
  interval: number // 次回復習までの日数
  repetitions: number // 連続正解回数
  next_review_date: string // 次回復習日（YYYY-MM-DD）
  last_review_date: string | null
  created_at: string
}

export interface ReviewResult {
  card_id: string
  quality: ReviewQuality
  new_easiness_factor: number
  new_interval: number
  new_repetitions: number
  next_review_date: string
  is_graduated: boolean // 完全に習得したか
}

/**
 * SM-2アルゴリズムで次回復習を計算
 */
export function calculateNextReview(
  easinessFactor: number,
  interval: number,
  repetitions: number,
  quality: ReviewQuality
): { easinessFactor: number; interval: number; repetitions: number } {
  // 品質が3未満の場合、学習をリセット
  if (quality < 3) {
    return {
      easinessFactor: Math.max(1.3, easinessFactor - 0.2),
      interval: 1,
      repetitions: 0,
    }
  }

  // 容易度因子を更新
  const newEasinessFactor = Math.max(
    1.3,
    easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  // 復習間隔を計算
  let newInterval: number
  if (repetitions === 0) {
    newInterval = 1
  } else if (repetitions === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * newEasinessFactor)
  }

  return {
    easinessFactor: newEasinessFactor,
    interval: newInterval,
    repetitions: repetitions + 1,
  }
}

/**
 * 次回復習日を計算
 */
export function getNextReviewDate(intervalDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + intervalDays)
  return date.toISOString().split('T')[0]
}

/**
 * 復習カードを作成
 */
export async function createReviewCard(
  db: D1Database,
  studentId: number,
  contentType: 'concept' | 'problem' | 'vocabulary',
  contentId: string,
  contentTitle: string
): Promise<SpacedRepetitionCard> {
  const cardId = `${studentId}-${contentType}-${contentId}`
  const nextReviewDate = getNextReviewDate(1) // 初回は1日後

  await db
    .prepare(
      `INSERT INTO spaced_repetition_cards 
       (card_id, student_id, content_type, content_id, content_title, 
        easiness_factor, interval, repetitions, next_review_date, last_review_date)
       VALUES (?, ?, ?, ?, ?, 2.5, 1, 0, ?, NULL)`
    )
    .bind(cardId, studentId, contentType, contentId, contentTitle, nextReviewDate)
    .run()

  return {
    card_id: cardId,
    student_id: studentId,
    content_type: contentType,
    content_id: contentId,
    content_title: contentTitle,
    easiness_factor: 2.5,
    interval: 1,
    repetitions: 0,
    next_review_date: nextReviewDate,
    last_review_date: null,
    created_at: new Date().toISOString(),
  }
}

/**
 * 復習を実行
 */
export async function reviewCard(
  db: D1Database,
  cardId: string,
  quality: ReviewQuality
): Promise<ReviewResult> {
  // カード情報を取得
  const card = await db
    .prepare('SELECT * FROM spaced_repetition_cards WHERE card_id = ?')
    .bind(cardId)
    .first<SpacedRepetitionCard>()

  if (!card) {
    throw new Error('Card not found')
  }

  // 次回復習を計算
  const { easinessFactor, interval, repetitions } = calculateNextReview(
    card.easiness_factor,
    card.interval,
    card.repetitions,
    quality
  )

  const nextReviewDate = getNextReviewDate(interval)

  // カードを更新
  await db
    .prepare(
      `UPDATE spaced_repetition_cards 
       SET easiness_factor = ?, interval = ?, repetitions = ?,
           next_review_date = ?, last_review_date = ?
       WHERE card_id = ?`
    )
    .bind(easinessFactor, interval, repetitions, nextReviewDate, new Date().toISOString().split('T')[0], cardId)
    .run()

  // 復習履歴を記録
  await db
    .prepare(
      `INSERT INTO review_history 
       (card_id, student_id, quality, easiness_factor, interval, review_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(cardId, card.student_id, quality, easinessFactor, interval, new Date().toISOString())
    .run()

  return {
    card_id: cardId,
    quality,
    new_easiness_factor: easinessFactor,
    new_interval: interval,
    new_repetitions: repetitions,
    next_review_date: nextReviewDate,
    is_graduated: repetitions >= 8 && easinessFactor >= 2.5, // 8回以上連続正解で卒業
  }
}

/**
 * 今日の復習カードを取得
 */
export async function getTodayReviews(
  db: D1Database,
  studentId: number
): Promise<SpacedRepetitionCard[]> {
  const today = new Date().toISOString().split('T')[0]

  const result = await db
    .prepare(
      `SELECT * FROM spaced_repetition_cards 
       WHERE student_id = ? AND next_review_date <= ?
       ORDER BY next_review_date ASC, repetitions ASC
       LIMIT 50`
    )
    .bind(studentId, today)
    .all<SpacedRepetitionCard>()

  return result.results || []
}

/**
 * 復習統計を取得
 */
export async function getReviewStats(
  db: D1Database,
  studentId: number
): Promise<{
  total_cards: number
  due_today: number
  learned: number
  reviewing: number
  new: number
  average_easiness: number
}> {
  const today = new Date().toISOString().split('T')[0]

  const stats = await db
    .prepare(
      `SELECT 
         COUNT(*) as total_cards,
         SUM(CASE WHEN next_review_date <= ? THEN 1 ELSE 0 END) as due_today,
         SUM(CASE WHEN repetitions >= 8 THEN 1 ELSE 0 END) as learned,
         SUM(CASE WHEN repetitions > 0 AND repetitions < 8 THEN 1 ELSE 0 END) as reviewing,
         SUM(CASE WHEN repetitions = 0 THEN 1 ELSE 0 END) as new,
         AVG(easiness_factor) as average_easiness
       FROM spaced_repetition_cards
       WHERE student_id = ?`
    )
    .bind(today, studentId)
    .first<{
      total_cards: number
      due_today: number
      learned: number
      reviewing: number
      new: number
      average_easiness: number
    }>()

  return (
    stats || {
      total_cards: 0,
      due_today: 0,
      learned: 0,
      reviewing: 0,
      new: 0,
      average_easiness: 2.5,
    }
  )
}

/**
 * 検索練習（Retrieval Practice）サポート
 * テスト効果を活用した学習
 */
export interface RetrievalPracticeSession {
  session_id: string
  student_id: number
  topic: string
  question_count: number
  started_at: string
  completed_at: string | null
}

export async function startRetrievalPractice(
  db: D1Database,
  studentId: number,
  topic: string
): Promise<RetrievalPracticeSession> {
  const sessionId = `rp-${studentId}-${Date.now()}`

  await db
    .prepare(
      `INSERT INTO retrieval_practice_sessions 
       (session_id, student_id, topic, question_count, started_at)
       VALUES (?, ?, ?, 0, ?)`
    )
    .bind(sessionId, studentId, topic, new Date().toISOString())
    .run()

  return {
    session_id: sessionId,
    student_id: studentId,
    topic,
    question_count: 0,
    started_at: new Date().toISOString(),
    completed_at: null,
  }
}

/**
 * 交互学習（Interleaving）のための問題ミックス
 */
export async function getInterleavedProblems(
  db: D1Database,
  studentId: number,
  subjects: string[],
  count: number
): Promise<any[]> {
  // 複数の教科から問題をバランスよく取得
  const problems: any[] = []

  for (const subject of subjects) {
    const subjectProblems = await db
      .prepare(
        `SELECT * FROM generated_problems 
         WHERE student_id = ? AND subject = ?
         ORDER BY RANDOM()
         LIMIT ?`
      )
      .bind(studentId, subject, Math.ceil(count / subjects.length))
      .all()

    problems.push(...(subjectProblems.results || []))
  }

  // シャッフル
  return problems.sort(() => Math.random() - 0.5).slice(0, count)
}
