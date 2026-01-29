/**
 * 分散学習エンジン
 * Spaced Learning Engine
 * 
 * データベース操作と分散学習アルゴリズムを統合
 * 
 * @module SpacedLearningEngine
 * @since 2026-01-29
 */

import {
  SpacedLearningSchedule,
  SpacedLearningConfig,
  SpacedLearningHistory,
  ReviewRecommendation,
  StudyResult,
  SessionType,
  LearningStage,
  DEFAULT_CONFIG,
  processStudyResult,
  initializeSchedule,
  calculatePriorityScore,
  determineRecommendationReason
} from './spacedLearning'

/**
 * 分散学習エンジンクラス
 */
export class SpacedLearningEngine {
  private db: D1Database
  private config: SpacedLearningConfig

  constructor(db: D1Database, config: SpacedLearningConfig = DEFAULT_CONFIG) {
    this.db = db
    this.config = config
  }

  // =====================================================
  // スケジュール管理
  // =====================================================

  /**
   * 学生の学習カードスケジュールを取得または作成
   */
  async getOrCreateSchedule(studentId: number, cardId: number): Promise<SpacedLearningSchedule> {
    // 既存のスケジュールを検索
    const result = await this.db.prepare(`
      SELECT * FROM spaced_learning_schedule
      WHERE student_id = ? AND card_id = ?
    `).bind(studentId, cardId).first()

    if (result) {
      return result as SpacedLearningSchedule
    }

    // 新規スケジュールを作成
    const newSchedule = initializeSchedule(studentId, cardId, this.config)
    
    await this.db.prepare(`
      INSERT INTO spaced_learning_schedule (
        student_id, card_id, learning_stage, leitner_box, mastery_level,
        study_count, correct_count, incorrect_count, next_review_date,
        review_interval_days, easiness_factor, repetition_number,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newSchedule.student_id,
      newSchedule.card_id,
      newSchedule.learning_stage,
      newSchedule.leitner_box,
      newSchedule.mastery_level,
      newSchedule.study_count,
      newSchedule.correct_count,
      newSchedule.incorrect_count,
      newSchedule.next_review_date,
      newSchedule.review_interval_days,
      newSchedule.easiness_factor,
      newSchedule.repetition_number,
      newSchedule.created_at,
      newSchedule.updated_at
    ).run()

    // 作成したスケジュールを返す（IDを含む）
    const created = await this.db.prepare(`
      SELECT * FROM spaced_learning_schedule
      WHERE student_id = ? AND card_id = ?
    `).bind(studentId, cardId).first()

    return created as SpacedLearningSchedule
  }

  /**
   * スケジュールを更新
   */
  async updateSchedule(schedule: SpacedLearningSchedule): Promise<void> {
    await this.db.prepare(`
      UPDATE spaced_learning_schedule
      SET learning_stage = ?,
          leitner_box = ?,
          mastery_level = ?,
          study_count = ?,
          correct_count = ?,
          incorrect_count = ?,
          last_result = ?,
          last_studied_at = ?,
          next_review_date = ?,
          review_interval_days = ?,
          easiness_factor = ?,
          repetition_number = ?,
          srl_foresight_score = ?,
          srl_performance_score = ?,
          srl_reflection_score = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(
      schedule.learning_stage,
      schedule.leitner_box,
      schedule.mastery_level,
      schedule.study_count,
      schedule.correct_count,
      schedule.incorrect_count,
      schedule.last_result || null,
      schedule.last_studied_at || null,
      schedule.next_review_date,
      schedule.review_interval_days,
      schedule.easiness_factor,
      schedule.repetition_number,
      schedule.srl_foresight_score || null,
      schedule.srl_performance_score || null,
      schedule.srl_reflection_score || null,
      new Date().toISOString(),
      schedule.id
    ).run()
  }

  // =====================================================
  // 学習結果の記録
  // =====================================================

  /**
   * 学習結果を記録してスケジュールを更新
   */
  async recordStudyResult(
    studentId: number,
    cardId: number,
    result: StudyResult,
    sessionType: SessionType = 'review',
    responseTimeSeconds?: number,
    difficultyRating?: number,
    confidenceLevel?: number,
    srlStage?: 'foresight' | 'performance' | 'reflection',
    srlStrategyUsed?: string,
    srlNotes?: string
  ): Promise<SpacedLearningSchedule> {
    // 現在のスケジュールを取得
    const currentSchedule = await this.getOrCreateSchedule(studentId, cardId)
    
    // 古い値を保存（履歴用）
    const oldLeitnerBox = currentSchedule.leitner_box
    const oldMasteryLevel = currentSchedule.mastery_level
    const oldEasinessFactor = currentSchedule.easiness_factor
    
    // 新しいスケジュールを計算
    const newSchedule = processStudyResult(
      currentSchedule,
      result,
      responseTimeSeconds,
      difficultyRating,
      confidenceLevel,
      this.config
    )
    
    // スケジュールを更新
    await this.updateSchedule(newSchedule)
    
    // 履歴を記録
    const daysSinceLastReview = currentSchedule.last_studied_at
      ? (Date.now() - new Date(currentSchedule.last_studied_at).getTime()) / (1000 * 60 * 60 * 24)
      : null
    
    const wasOnTime = currentSchedule.next_review_date
      ? new Date() <= new Date(currentSchedule.next_review_date)
      : true
    
    await this.db.prepare(`
      INSERT INTO spaced_learning_history (
        schedule_id, student_id, card_id, session_type, result,
        response_time_seconds, difficulty_rating, confidence_level,
        days_since_last_review, scheduled_date, actual_date, was_on_time,
        old_leitner_box, new_leitner_box,
        old_mastery_level, new_mastery_level,
        old_easiness_factor, new_easiness_factor,
        srl_stage, srl_strategy_used, srl_notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newSchedule.id,
      studentId,
      cardId,
      sessionType,
      result,
      responseTimeSeconds || null,
      difficultyRating || null,
      confidenceLevel || null,
      daysSinceLastReview || null,
      currentSchedule.next_review_date || null,
      new Date().toISOString(),
      wasOnTime ? 1 : 0,
      oldLeitnerBox,
      newSchedule.leitner_box,
      oldMasteryLevel,
      newSchedule.mastery_level,
      oldEasinessFactor,
      newSchedule.easiness_factor,
      srlStage || null,
      srlStrategyUsed || null,
      srlNotes || null,
      new Date().toISOString()
    ).run()
    
    return newSchedule
  }

  // =====================================================
  // 復習推奨
  // =====================================================

  /**
   * 今日の復習推奨カードを取得
   */
  async getTodayReviews(studentId: number): Promise<ReviewRecommendation[]> {
    const today = new Date().toISOString().split('T')[0]
    
    // 期限が今日またはそれ以前のカードを取得
    const results = await this.db.prepare(`
      SELECT 
        s.card_id,
        s.mastery_level,
        s.leitner_box,
        s.next_review_date,
        s.learning_stage,
        s.study_count,
        s.correct_count,
        s.incorrect_count,
        JULIANDAY('now') - JULIANDAY(s.next_review_date) as days_overdue
      FROM spaced_learning_schedule s
      WHERE s.student_id = ?
        AND DATE(s.next_review_date) <= DATE('now')
        AND s.learning_stage != 'mastered'
      ORDER BY days_overdue DESC, s.mastery_level ASC
    `).bind(studentId).all()

    const recommendations: ReviewRecommendation[] = []
    
    for (const row of results.results) {
      const daysOverdue = row.days_overdue as number
      const masteryLevel = row.mastery_level as number
      const incorrectRate = row.study_count > 0
        ? (row.incorrect_count as number) / (row.study_count as number)
        : 0
      
      const priorityScore = calculatePriorityScore(
        daysOverdue,
        masteryLevel,
        row.leitner_box as number
      )
      
      const reason = determineRecommendationReason(
        daysOverdue,
        masteryLevel,
        incorrectRate
      )
      
      recommendations.push({
        card_id: row.card_id as number,
        priority_score: priorityScore,
        reason: reason,
        next_review_date: row.next_review_date as string,
        days_overdue: daysOverdue,
        mastery_level: masteryLevel,
        leitner_box: row.leitner_box as number
      })
    }
    
    // 優先度スコア順にソート
    return recommendations.sort((a, b) => b.priority_score - a.priority_score)
  }

  /**
   * 今日の復習カード数を取得
   */
  async getTodayReviewCount(studentId: number): Promise<number> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM spaced_learning_schedule
      WHERE student_id = ?
        AND DATE(next_review_date) <= DATE('now')
        AND learning_stage != 'mastered'
    `).bind(studentId).first()

    return result?.count as number || 0
  }

  /**
   * 週間復習スケジュールを取得
   */
  async getWeeklySchedule(studentId: number): Promise<{ date: string; count: number }[]> {
    const results = await this.db.prepare(`
      SELECT 
        DATE(next_review_date) as date,
        COUNT(*) as count
      FROM spaced_learning_schedule
      WHERE student_id = ?
        AND DATE(next_review_date) BETWEEN DATE('now') AND DATE('now', '+7 days')
        AND learning_stage != 'mastered'
      GROUP BY DATE(next_review_date)
      ORDER BY date
    `).bind(studentId).all()

    return results.results.map(row => ({
      date: row.date as string,
      count: row.count as number
    }))
  }

  // =====================================================
  // 統計・分析
  // =====================================================

  /**
   * 習熟度統計を取得
   */
  async getMasteryStats(studentId: number): Promise<{
    total_cards: number;
    new_cards: number;
    learning_cards: number;
    review_cards: number;
    mastered_cards: number;
    avg_mastery_level: number;
    avg_leitner_box: number;
  }> {
    const result = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_cards,
        SUM(CASE WHEN learning_stage = 'new' THEN 1 ELSE 0 END) as new_cards,
        SUM(CASE WHEN learning_stage = 'learning' THEN 1 ELSE 0 END) as learning_cards,
        SUM(CASE WHEN learning_stage = 'review' THEN 1 ELSE 0 END) as review_cards,
        SUM(CASE WHEN learning_stage = 'mastered' THEN 1 ELSE 0 END) as mastered_cards,
        AVG(mastery_level) as avg_mastery_level,
        AVG(leitner_box) as avg_leitner_box
      FROM spaced_learning_schedule
      WHERE student_id = ?
    `).bind(studentId).first()

    return {
      total_cards: result?.total_cards as number || 0,
      new_cards: result?.new_cards as number || 0,
      learning_cards: result?.learning_cards as number || 0,
      review_cards: result?.review_cards as number || 0,
      mastered_cards: result?.mastered_cards as number || 0,
      avg_mastery_level: result?.avg_mastery_level as number || 0,
      avg_leitner_box: result?.avg_leitner_box as number || 0
    }
  }

  /**
   * 忘却リスクが高いカードを取得
   */
  async getForgettingRiskCards(studentId: number, limit: number = 10): Promise<ReviewRecommendation[]> {
    // 期限超過が大きく、習熟度が低いカードを抽出
    const results = await this.db.prepare(`
      SELECT 
        s.card_id,
        s.mastery_level,
        s.leitner_box,
        s.next_review_date,
        s.learning_stage,
        s.study_count,
        s.correct_count,
        s.incorrect_count,
        JULIANDAY('now') - JULIANDAY(s.next_review_date) as days_overdue
      FROM spaced_learning_schedule s
      WHERE s.student_id = ?
        AND s.learning_stage IN ('learning', 'review')
        AND DATE(s.next_review_date) < DATE('now')
      ORDER BY 
        (JULIANDAY('now') - JULIANDAY(s.next_review_date)) * (1 - s.mastery_level) DESC
      LIMIT ?
    `).bind(studentId, limit).all()

    const recommendations: ReviewRecommendation[] = []
    
    for (const row of results.results) {
      const daysOverdue = row.days_overdue as number
      const masteryLevel = row.mastery_level as number
      const incorrectRate = row.study_count > 0
        ? (row.incorrect_count as number) / (row.study_count as number)
        : 0
      
      const priorityScore = calculatePriorityScore(
        daysOverdue,
        masteryLevel,
        row.leitner_box as number
      )
      
      recommendations.push({
        card_id: row.card_id as number,
        priority_score: priorityScore,
        reason: 'overdue',
        next_review_date: row.next_review_date as string,
        days_overdue: daysOverdue,
        mastery_level: masteryLevel,
        leitner_box: row.leitner_box as number
      })
    }
    
    return recommendations
  }

  /**
   * 学習履歴を取得
   */
  async getStudyHistory(
    studentId: number,
    cardId?: number,
    limit: number = 50
  ): Promise<SpacedLearningHistory[]> {
    let query = `
      SELECT * FROM spaced_learning_history
      WHERE student_id = ?
    `
    const params: any[] = [studentId]
    
    if (cardId) {
      query += ' AND card_id = ?'
      params.push(cardId)
    }
    
    query += ' ORDER BY actual_date DESC LIMIT ?'
    params.push(limit)
    
    const results = await this.db.prepare(query).bind(...params).all()
    
    return results.results as SpacedLearningHistory[]
  }

  // =====================================================
  // 設定管理（既存のAPIとの互換性）
  // =====================================================

  /**
   * 学生の設定を取得（既存APIとの互換性維持）
   */
  async getSettings(studentId: number): Promise<any> {
    // デフォルト設定を返す
    return {
      enable_spaced_learning: true,
      enable_daily_reminder: true,
      reminder_time: '19:00',
      config: this.config
    }
  }

  /**
   * 学生の設定を更新（既存APIとの互換性維持）
   */
  async updateSettings(studentId: number, settings: any): Promise<void> {
    // 将来的にユーザー固有の設定を保存する場合はここで実装
    console.log(`Student ${studentId} settings updated:`, settings)
  }

  /**
   * 習熟度を取得または作成（既存APIとの互換性維持）
   */
  async getOrCreateMastery(studentId: number, cardId: number): Promise<any> {
    const schedule = await this.getOrCreateSchedule(studentId, cardId)
    
    return {
      student_id: studentId,
      card_id: cardId,
      mastery_level: schedule.mastery_level,
      leitner_box: schedule.leitner_box,
      learning_stage: schedule.learning_stage,
      next_review_date: schedule.next_review_date,
      study_count: schedule.study_count,
      correct_count: schedule.correct_count,
      incorrect_count: schedule.incorrect_count
    }
  }
}
