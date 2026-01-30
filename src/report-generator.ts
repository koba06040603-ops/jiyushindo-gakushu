// =============================================================================
// 学習レポート自動生成API
// =============================================================================

import { Hono } from 'hono'

export interface LearningReportData {
  student: {
    id: number
    name: string
    grade: number
    class_code: string
  }
  period: {
    start_date: string
    end_date: string
    type: 'weekly' | 'monthly' | 'term'
  }
  summary: {
    total_learning_time_minutes: number
    total_cards_completed: number
    total_sessions: number
    average_mastery_score: number
    improvement_rate: number
  }
  performance: {
    by_subject: Array<{
      subject: string
      cards_completed: number
      average_score: number
      mastery_rate: number
    }>
    by_difficulty: Array<{
      level: string
      cards_attempted: number
      success_rate: number
    }>
  }
  learning_style: {
    dominant_style: string
    vark_breakdown: {
      visual: number
      auditory: number
      reading: number
      kinesthetic: number
    }
    recommendations: string[]
  }
  achievements: Array<{
    date: string
    title: string
    description: string
    badge_icon: string
  }>
  challenges: Array<{
    area: string
    description: string
    suggestions: string[]
  }>
  ai_teacher_interactions: {
    total_questions: number
    topics: string[]
    most_helpful_answers: string[]
  }
  parent_message: string
  teacher_comment: string
  // 新規追加: グラフ・チャート用データ
  charts: {
    learning_time_trend: Array<{
      date: string
      minutes: number
      cumulative_minutes: number
    }>
    mastery_radar: {
      labels: string[]
      scores: number[]
    }
    subject_performance_bar: Array<{
      subject: string
      score: number
      class_average?: number
    }>
    daily_progress: Array<{
      date: string
      cards_completed: number
      sessions: number
    }>
  }
  // 新規追加: 比較分析データ
  comparison: {
    class_average: {
      learning_time_minutes: number
      cards_completed: number
      mastery_score: number
    }
    previous_period: {
      learning_time_minutes: number
      cards_completed: number
      mastery_score: number
      improvement_rate: number
    }
    percentile_rank: number // クラス内順位（パーセンタイル）
  }
  // 新規追加: 予測データ
  prediction: {
    next_week_cards: number
    next_week_mastery: number
    goal_achievement_probability: number
    recommended_study_time: number
  }
}

/**
 * 学習レポート生成API
 */
export async function generateLearningReport(
  db: D1Database,
  studentId: number,
  startDate: string,
  endDate: string,
  reportType: 'weekly' | 'monthly' | 'term'
): Promise<LearningReportData> {
  
  // 1. 学生情報取得
  const studentInfo = await db.prepare(`
    SELECT s.student_id, s.name, s.grade, c.class_code, c.class_name
    FROM students s
    JOIN class_enrollments ce ON s.student_id = ce.student_id
    JOIN classes c ON ce.class_id = c.class_id
    WHERE s.student_id = ? AND ce.is_active = TRUE
    LIMIT 1
  `).bind(studentId).first()

  if (!studentInfo) {
    throw new Error('Student not found')
  }

  // 2. 学習時間とセッション数
  const learningTime = await db.prepare(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(actual_time_minutes) as total_time_minutes,
      SUM(actual_cards_completed) as total_cards
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start <= ?
  `).bind(studentId, startDate, endDate).first()

  // 3. 習熟度スコア
  const masteryData = await db.prepare(`
    SELECT AVG(mastery_score) as avg_mastery
    FROM student_progress
    WHERE student_id = ?
      AND last_attempt_date >= ?
      AND last_attempt_date <= ?
  `).bind(studentId, startDate, endDate).first()

  // 4. 教科別パフォーマンス
  const subjectPerformance = await db.prepare(`
    SELECT 
      lc.subject,
      COUNT(DISTINCT sp.card_id) as cards_completed,
      AVG(sp.mastery_score) as average_score,
      SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as mastery_rate
    FROM student_progress sp
    JOIN learning_cards lc ON sp.card_id = lc.card_id
    WHERE sp.student_id = ?
      AND sp.last_attempt_date >= ?
      AND sp.last_attempt_date <= ?
    GROUP BY lc.subject
  `).bind(studentId, startDate, endDate).all()

  // 5. 難易度別パフォーマンス
  const difficultyPerformance = await db.prepare(`
    SELECT 
      lc.difficulty_level as level,
      COUNT(*) as cards_attempted,
      SUM(CASE WHEN lh.is_correct = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
    FROM learning_history lh
    JOIN learning_cards lc ON lh.card_id = lc.card_id
    WHERE lh.student_id = ?
      AND lh.attempt_date >= ?
      AND lh.attempt_date <= ?
    GROUP BY lc.difficulty_level
  `).bind(studentId, startDate, endDate).all()

  // 6. 学習スタイル
  const learningStyle = await db.prepare(`
    SELECT 
      dominant_style,
      vark_scores,
      confidence_level
    FROM detected_learning_styles
    WHERE student_id = ?
    ORDER BY last_updated DESC
    LIMIT 1
  `).bind(studentId).first()

  let varkBreakdown = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 }
  if (learningStyle && learningStyle.vark_scores) {
    try {
      varkBreakdown = JSON.parse(learningStyle.vark_scores as string)
    } catch (e) {
      console.error('Failed to parse VARK scores:', e)
    }
  }

  // 7. 達成実績（バッジ）
  const achievements = await db.prepare(`
    SELECT 
      sa.earned_date as date,
      b.badge_name as title,
      b.description,
      b.icon_url as badge_icon
    FROM student_achievements sa
    JOIN badges b ON sa.badge_id = b.badge_id
    WHERE sa.student_id = ?
      AND sa.earned_date >= ?
      AND sa.earned_date <= ?
    ORDER BY sa.earned_date DESC
    LIMIT 5
  `).bind(studentId, startDate, endDate).all()

  // 8. AI教師インタラクション
  const aiInteractions = await db.prepare(`
    SELECT 
      COUNT(*) as total_questions,
      GROUP_CONCAT(DISTINCT card_id) as card_ids
    FROM ai_teacher_conversations
    WHERE student_id = ?
      AND created_at >= ?
      AND created_at <= ?
  `).bind(studentId, startDate, endDate).first()

  // 9. 成長率計算（前期間との比較）
  const previousPeriodEnd = startDate
  const previousPeriodStart = new Date(new Date(startDate).getTime() - (new Date(endDate).getTime() - new Date(startDate).getTime()))
    .toISOString().split('T')[0]

  const previousMastery = await db.prepare(`
    SELECT AVG(mastery_score) as avg_mastery
    FROM student_progress
    WHERE student_id = ?
      AND last_attempt_date >= ?
      AND last_attempt_date < ?
  `).bind(studentId, previousPeriodStart, previousPeriodEnd).first()

  const improvementRate = previousMastery && previousMastery.avg_mastery > 0
    ? ((masteryData.avg_mastery - previousMastery.avg_mastery) / previousMastery.avg_mastery) * 100
    : 0

  // 10. 課題エリア特定
  const challenges = []
  
  // 低習熟度エリア
  const lowMasterySubjects = subjectPerformance.results.filter((s: any) => s.average_score < 60)
  if (lowMasterySubjects.length > 0) {
    challenges.push({
      area: '苦手教科',
      description: `${lowMasterySubjects.map((s: any) => s.subject).join('、')}の習熟度が低めです`,
      suggestions: [
        '基礎問題から復習しましょう',
        'AI教師に質問して理解を深めましょう',
        '視覚的な図解を活用してみましょう'
      ]
    })
  }

  // 11. 保護者向けメッセージ生成
  const parentMessage = generateParentMessage(
    studentInfo.name,
    learningTime.total_time_minutes || 0,
    masteryData.avg_mastery || 0,
    improvementRate,
    reportType
  )

  // 12. グラフ用データ: 学習時間推移
  const learningTimeTrend = await db.prepare(`
    SELECT 
      DATE(session_start) as date,
      SUM(actual_time_minutes) as minutes
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start <= ?
    GROUP BY DATE(session_start)
    ORDER BY DATE(session_start)
  `).bind(studentId, startDate, endDate).all()

  let cumulativeMinutes = 0
  const learningTimeTrendData = learningTimeTrend.results.map((row: any) => {
    cumulativeMinutes += row.minutes || 0
    return {
      date: row.date,
      minutes: row.minutes || 0,
      cumulative_minutes: cumulativeMinutes
    }
  })

  // 13. グラフ用データ: 習熟度レーダーチャート（教科別）
  const masteryRadarLabels = subjectPerformance.results.map((s: any) => s.subject)
  const masteryRadarScores = subjectPerformance.results.map((s: any) => Math.round(s.average_score))

  // 14. グラフ用データ: 日次進捗
  const dailyProgress = await db.prepare(`
    SELECT 
      DATE(session_start) as date,
      SUM(actual_cards_completed) as cards_completed,
      COUNT(*) as sessions
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start <= ?
    GROUP BY DATE(session_start)
    ORDER BY DATE(session_start)
  `).bind(studentId, startDate, endDate).all()

  // 15. 比較分析: クラス平均
  const classAverage = await db.prepare(`
    SELECT 
      AVG(ls.actual_time_minutes) as avg_time,
      AVG(ls.actual_cards_completed) as avg_cards,
      AVG(sp.mastery_score) as avg_mastery
    FROM learning_sessions ls
    JOIN students s ON ls.student_id = s.student_id
    JOIN class_enrollments ce ON s.student_id = ce.student_id
    JOIN classes c ON ce.class_id = c.class_id
    LEFT JOIN student_progress sp ON s.student_id = sp.student_id
    WHERE c.class_code = ?
      AND ls.session_start >= ?
      AND ls.session_start <= ?
  `).bind(studentInfo.class_code, startDate, endDate).first()

  // 16. 比較分析: 前期間データ
  const previousPeriodData = await db.prepare(`
    SELECT 
      SUM(actual_time_minutes) as total_time,
      SUM(actual_cards_completed) as total_cards
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start < ?
  `).bind(studentId, previousPeriodStart, previousPeriodEnd).first()

  // 17. パーセンタイル順位計算
  const classRanking = await db.prepare(`
    SELECT 
      s.student_id,
      AVG(sp.mastery_score) as avg_mastery
    FROM students s
    JOIN class_enrollments ce ON s.student_id = ce.student_id
    JOIN classes c ON ce.class_id = c.class_id
    LEFT JOIN student_progress sp ON s.student_id = sp.student_id
    WHERE c.class_code = ?
      AND sp.last_attempt_date >= ?
      AND sp.last_attempt_date <= ?
    GROUP BY s.student_id
    ORDER BY avg_mastery DESC
  `).bind(studentInfo.class_code, startDate, endDate).all()

  const totalStudents = classRanking.results.length
  const studentRank = classRanking.results.findIndex((r: any) => r.student_id === studentId) + 1
  const percentileRank = totalStudents > 0 ? Math.round(((totalStudents - studentRank + 1) / totalStudents) * 100) : 50

  // 18. 予測機能: 線形回帰による予測
  const recentSessions = await db.prepare(`
    SELECT 
      DATE(session_start) as date,
      SUM(actual_cards_completed) as cards,
      AVG(sp.mastery_score) as mastery
    FROM learning_sessions ls
    LEFT JOIN student_progress sp ON ls.student_id = sp.student_id
    WHERE ls.student_id = ?
      AND ls.session_start >= ?
      AND ls.session_start <= ?
    GROUP BY DATE(session_start)
    ORDER BY DATE(session_start)
  `).bind(studentId, startDate, endDate).all()

  // 簡易線形回帰
  const predictions = predictLearningProgress(recentSessions.results)

  // レポートデータ構築
  const report: LearningReportData = {
    student: {
      id: studentInfo.student_id,
      name: studentInfo.name,
      grade: studentInfo.grade,
      class_code: studentInfo.class_code
    },
    period: {
      start_date: startDate,
      end_date: endDate,
      type: reportType
    },
    summary: {
      total_learning_time_minutes: learningTime.total_time_minutes || 0,
      total_cards_completed: learningTime.total_cards || 0,
      total_sessions: learningTime.total_sessions || 0,
      average_mastery_score: Math.round(masteryData.avg_mastery || 0),
      improvement_rate: Math.round(improvementRate * 10) / 10
    },
    performance: {
      by_subject: subjectPerformance.results.map((s: any) => ({
        subject: s.subject,
        cards_completed: s.cards_completed,
        average_score: Math.round(s.average_score),
        mastery_rate: Math.round(s.mastery_rate)
      })),
      by_difficulty: difficultyPerformance.results.map((d: any) => ({
        level: d.level,
        cards_attempted: d.cards_attempted,
        success_rate: Math.round(d.success_rate)
      }))
    },
    learning_style: {
      dominant_style: learningStyle?.dominant_style || 'unknown',
      vark_breakdown: varkBreakdown,
      recommendations: generateLearningStyleRecommendations(learningStyle?.dominant_style || 'visual')
    },
    achievements: achievements.results.map((a: any) => ({
      date: a.date,
      title: a.title,
      description: a.description,
      badge_icon: a.badge_icon || '🏆'
    })),
    challenges: challenges,
    ai_teacher_interactions: {
      total_questions: aiInteractions?.total_questions || 0,
      topics: [],
      most_helpful_answers: []
    },
    parent_message: parentMessage,
    teacher_comment: '',
    // グラフ・チャート用データ
    charts: {
      learning_time_trend: learningTimeTrendData,
      mastery_radar: {
        labels: masteryRadarLabels,
        scores: masteryRadarScores
      },
      subject_performance_bar: subjectPerformance.results.map((s: any) => ({
        subject: s.subject,
        score: Math.round(s.average_score),
        class_average: classAverage?.avg_mastery ? Math.round(classAverage.avg_mastery) : undefined
      })),
      daily_progress: dailyProgress.results.map((d: any) => ({
        date: d.date,
        cards_completed: d.cards_completed || 0,
        sessions: d.sessions || 0
      }))
    },
    // 比較分析データ
    comparison: {
      class_average: {
        learning_time_minutes: Math.round(classAverage?.avg_time || 0),
        cards_completed: Math.round(classAverage?.avg_cards || 0),
        mastery_score: Math.round(classAverage?.avg_mastery || 0)
      },
      previous_period: {
        learning_time_minutes: previousPeriodData?.total_time || 0,
        cards_completed: previousPeriodData?.total_cards || 0,
        mastery_score: Math.round(previousMastery?.avg_mastery || 0),
        improvement_rate: Math.round(improvementRate * 10) / 10
      },
      percentile_rank: percentileRank
    },
    // 予測データ
    prediction: {
      next_week_cards: predictions.next_week_cards,
      next_week_mastery: predictions.next_week_mastery,
      goal_achievement_probability: predictions.goal_achievement_probability,
      recommended_study_time: predictions.recommended_study_time
    }
  }

  return report
}

/**
 * 保護者向けメッセージ生成
 */
function generateParentMessage(
  studentName: string,
  totalMinutes: number,
  avgMastery: number,
  improvementRate: number,
  reportType: string
): string {
  const periodText = reportType === 'weekly' ? '今週' : reportType === 'monthly' ? '今月' : 'この期間'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  let message = `${studentName}さんの${periodText}の学習状況をご報告いたします。\n\n`
  
  if (totalMinutes > 0) {
    message += `学習時間は合計${hours}時間${minutes}分で、`
  }
  
  if (avgMastery >= 80) {
    message += `習熟度は${avgMastery}点と非常に優秀です。`
  } else if (avgMastery >= 60) {
    message += `習熟度は${avgMastery}点と順調に成長しています。`
  } else {
    message += `習熟度は${avgMastery}点です。一緒にサポートしていきましょう。`
  }
  
  if (improvementRate > 10) {
    message += `\n\n前回と比べて${improvementRate.toFixed(1)}%も向上しており、素晴らしい成長が見られます！`
  } else if (improvementRate > 0) {
    message += `\n\n前回と比べて${improvementRate.toFixed(1)}%向上しています。`
  }
  
  message += `\n\n引き続き、お子様の学習を温かく見守っていただければと思います。`
  
  return message
}

/**
 * 学習スタイル別推奨事項
 */
function generateLearningStyleRecommendations(style: string): string[] {
  const recommendations: { [key: string]: string[] } = {
    visual: [
      '図やグラフを活用した学習が効果的です',
      'マインドマップやイラストを描いて整理しましょう',
      '色分けやハイライトを使って重要ポイントを視覚化'
    ],
    auditory: [
      '音読や音声教材を活用しましょう',
      '家族や友達に説明することで理解が深まります',
      'リズムや歌で覚える方法も効果的です'
    ],
    reading: [
      'テキストをしっかり読み込む学習が向いています',
      'ノートにまとめる習慣を継続しましょう',
      '参考書や問題集を活用した学習がおすすめ'
    ],
    kinesthetic: [
      '実際に手を動かす学習が効果的です',
      '実験や工作を通じて体験的に学びましょう',
      '休憩を取りながらアクティブに学習'
    ]
  }
  
  return recommendations[style] || recommendations['visual']
}

/**
 * 学習進捗予測（簡易線形回帰）
 */
function predictLearningProgress(recentSessions: any[]): {
  next_week_cards: number
  next_week_mastery: number
  goal_achievement_probability: number
  recommended_study_time: number
} {
  if (recentSessions.length === 0) {
    return {
      next_week_cards: 0,
      next_week_mastery: 0,
      goal_achievement_probability: 0,
      recommended_study_time: 60
    }
  }

  // 簡易線形回帰: y = mx + b
  const n = recentSessions.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  let sumMastery = 0

  recentSessions.forEach((session: any, index: number) => {
    const x = index + 1
    const y = session.cards || 0
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
    sumMastery += session.mastery || 0
  })

  // 傾き (m) と切片 (b) を計算
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const b = (sumY - m * sumX) / n

  // 次週の予測 (7日先)
  const nextWeekCards = Math.round(Math.max(0, m * (n + 7) + b))
  
  // 平均習熟度から次週の習熟度を予測
  const avgMastery = sumMastery / n
  const masteryTrend = m > 0 ? 5 : m < 0 ? -3 : 0
  const nextWeekMastery = Math.round(Math.min(100, Math.max(0, avgMastery + masteryTrend)))

  // 目標達成確率（80点以上の習熟度を目標とする）
  const goalAchievementProbability = nextWeekMastery >= 80 ? 85 : 
                                      nextWeekMastery >= 70 ? 65 :
                                      nextWeekMastery >= 60 ? 45 : 25

  // 推奨学習時間（分）
  const currentAvgCards = sumY / n
  const recommendedStudyTime = currentAvgCards < 5 ? 90 :
                                 currentAvgCards < 10 ? 60 : 45

  return {
    next_week_cards: nextWeekCards,
    next_week_mastery: nextWeekMastery,
    goal_achievement_probability: goalAchievementProbability,
    recommended_study_time: recommendedStudyTime
  }
}
