// 学習履歴の長期分析ダッシュボード API

export async function getYearlyLearningHistory(
  db: D1Database,
  studentId: number,
  year: number = new Date().getFullYear()
) {
  // 年間の学習履歴を取得
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  
  const history = await db.prepare(`
    SELECT 
      date,
      subject,
      total_problems,
      correct_count,
      accuracy_rate,
      total_time_spent / 3600.0 as hours_spent
    FROM v_learning_history_summary
    WHERE student_id = ? 
      AND date BETWEEN ? AND ?
    ORDER BY date
  `).bind(studentId, yearStart, yearEnd).all()
  
  return history.results
}

export async function getMonthlyStats(
  db: D1Database,
  studentId: number,
  months: number = 12
) {
  const result = await db.prepare(`
    SELECT 
      month,
      subject,
      monthly_problems,
      ROUND(monthly_accuracy, 1) as monthly_accuracy,
      ROUND(monthly_hours, 1) as monthly_hours
    FROM v_monthly_learning_stats
    WHERE student_id = ?
      AND month >= date('now', '-${months} months')
    ORDER BY month DESC, subject
  `).bind(studentId).all()
  
  return result.results
}

export async function getGrowthCurve(
  db: D1Database,
  studentId: number,
  subject?: string,
  days: number = 365
) {
  let query = `
    SELECT 
      date,
      subject,
      cumulative_problems,
      ROUND(rolling_7day_accuracy, 1) as rolling_accuracy
    FROM v_growth_curve
    WHERE student_id = ?
      AND date >= date('now', '-${days} days')
  `
  
  const params: any[] = [studentId]
  
  if (subject) {
    query += ` AND subject = ?`
    params.push(subject)
  }
  
  query += ` ORDER BY date, subject`
  
  const result = await db.prepare(query).bind(...params).all()
  return result.results
}

export async function analyzeLearningPattern(
  db: D1Database,
  studentId: number,
  days: number = 90
) {
  // 学習時間帯の分析
  const timePattern = await db.prepare(`
    SELECT 
      CAST(strftime('%H', answered_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM answer_history
    WHERE student_id = ?
      AND answered_at >= datetime('now', '-${days} days')
    GROUP BY hour
    ORDER BY hour
  `).bind(studentId).all()
  
  // 曜日パターン
  const dayPattern = await db.prepare(`
    SELECT 
      CASE CAST(strftime('%w', answered_at) AS INTEGER)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END as day_of_week,
      COUNT(*) as count,
      AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy
    FROM answer_history
    WHERE student_id = ?
      AND answered_at >= datetime('now', '-${days} days')
    GROUP BY CAST(strftime('%w', answered_at) AS INTEGER)
    ORDER BY CAST(strftime('%w', answered_at) AS INTEGER)
  `).bind(studentId).all()
  
  // 連続学習日数
  const streakData = await db.prepare(`
    SELECT 
      COUNT(DISTINCT DATE(answered_at)) as study_days,
      MAX(answered_at) as last_study_date
    FROM answer_history
    WHERE student_id = ?
      AND answered_at >= datetime('now', '-${days} days')
  `).bind(studentId).first()
  
  // 教科バランス
  const subjectBalance = await db.prepare(`
    SELECT 
      c.subject,
      COUNT(*) as count,
      AVG(CASE WHEN pa.is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy
    FROM answer_history pa
    JOIN learning_cards lc ON pa.card_id = lc.id
    JOIN courses c ON lc.course_id = c.id
    WHERE pa.student_id = ?
      AND pa.answered_at >= datetime('now', '-${days} days')
    GROUP BY c.subject
    ORDER BY count DESC
  `).bind(studentId).all()
  
  // 学習効率（正答率 × 問題数 / 時間）
  const efficiency = await db.prepare(`
    SELECT 
      COUNT(*) as total_problems,
      AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
      SUM(time_spent_seconds) / 3600.0 as total_hours,
      (COUNT(*) * AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END)) / 
        NULLIF(SUM(time_spent_seconds) / 3600.0, 0) as efficiency_score
    FROM answer_history
    WHERE student_id = ?
      AND answered_at >= datetime('now', '-${days} days')
  `).bind(studentId).first()
  
  return {
    timePattern: timePattern.results,
    dayPattern: dayPattern.results,
    studyDays: streakData?.study_days || 0,
    lastStudyDate: streakData?.last_study_date,
    subjectBalance: subjectBalance.results,
    efficiency: efficiency
  }
}

export async function getSeasonalTrends(
  db: D1Database,
  studentId: number,
  year: number = new Date().getFullYear()
) {
  // 四半期別の学習傾向
  const result = await db.prepare(`
    SELECT 
      CASE 
        WHEN CAST(strftime('%m', date) AS INTEGER) BETWEEN 1 AND 3 THEN 'Q1'
        WHEN CAST(strftime('%m', date) AS INTEGER) BETWEEN 4 AND 6 THEN 'Q2'
        WHEN CAST(strftime('%m', date) AS INTEGER) BETWEEN 7 AND 9 THEN 'Q3'
        ELSE 'Q4'
      END as quarter,
      subject,
      SUM(total_problems) as problems,
      AVG(accuracy_rate) as accuracy,
      SUM(total_time_spent) / 3600.0 as hours
    FROM v_learning_history_summary
    WHERE student_id = ?
      AND strftime('%Y', date) = ?
    GROUP BY quarter, subject
    ORDER BY quarter, subject
  `).bind(studentId, year.toString()).all()
  
  return result.results
}

export async function compareWithPeers(
  db: D1Database,
  studentId: number,
  classCode: string,
  days: number = 30
) {
  // クラス内での順位と比較
  const comparison = await db.prepare(`
    WITH student_stats AS (
      SELECT 
        pa.student_id,
        u.name,
        COUNT(*) as total_problems,
        AVG(CASE WHEN pa.is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
        SUM(pa.time_spent_seconds) / 3600.0 as total_hours
      FROM answer_history pa
      JOIN users u ON pa.student_id = u.id
      WHERE u.class_code = ?
        AND pa.answered_at >= datetime('now', '-${days} days')
      GROUP BY pa.student_id
    ),
    ranked_stats AS (
      SELECT 
        *,
        RANK() OVER (ORDER BY accuracy DESC) as accuracy_rank,
        RANK() OVER (ORDER BY total_problems DESC) as problems_rank,
        RANK() OVER (ORDER BY total_hours DESC) as hours_rank,
        COUNT(*) OVER () as total_students
      FROM student_stats
    )
    SELECT * FROM ranked_stats
    WHERE student_id = ?
  `).bind(classCode, studentId).first()
  
  // クラス平均
  const classAverage = await db.prepare(`
    SELECT 
      AVG(total_problems) as avg_problems,
      AVG(accuracy) as avg_accuracy,
      AVG(total_hours) as avg_hours
    FROM (
      SELECT 
        pa.student_id,
        COUNT(*) as total_problems,
        AVG(CASE WHEN pa.is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
        SUM(pa.time_spent_seconds) / 3600.0 as total_hours
      FROM answer_history pa
      JOIN users u ON pa.student_id = u.id
      WHERE u.class_code = ?
        AND pa.answered_at >= datetime('now', '-${days} days')
      GROUP BY pa.student_id
    )
  `).bind(classCode).first()
  
  return {
    student: comparison,
    classAverage: classAverage
  }
}

export async function getImprovementRate(
  db: D1Database,
  studentId: number,
  subject?: string
) {
  // 月次改善率の計算
  let query = `
    SELECT 
      month,
      subject,
      monthly_accuracy,
      LAG(monthly_accuracy) OVER (PARTITION BY subject ORDER BY month) as prev_accuracy,
      monthly_accuracy - LAG(monthly_accuracy) OVER (PARTITION BY subject ORDER BY month) as improvement
    FROM v_monthly_learning_stats
    WHERE student_id = ?
  `
  
  const params: any[] = [studentId]
  
  if (subject) {
    query += ` AND subject = ?`
    params.push(subject)
  }
  
  query += ` ORDER BY month DESC, subject`
  
  const result = await db.prepare(query).bind(...params).all()
  return result.results
}
