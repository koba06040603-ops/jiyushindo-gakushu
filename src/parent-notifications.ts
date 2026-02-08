// 保護者向けリアルタイム通知システム

export interface NotificationSettings {
  setting_id?: number
  user_id: number
  user_type: string
  learning_start: number
  learning_end: number
  achievement: number
  badge_earned: number
  weakness_found: number
  milestone_reached: number
  weekly_summary: number
  monthly_summary: number
  in_app_notification: number
  email_notification: number
  push_notification: number
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export interface Notification {
  notification_id?: number
  recipient_id: number
  student_id?: number
  notification_type: string
  title: string
  message: string
  data?: string
  delivery_method: string
  is_read: number
  read_at?: string
  is_sent: number
  sent_at?: string
  priority: string
  action_url?: string
  created_at?: string
  expires_at?: string
}

export interface WeeklySummary {
  summary_id?: number
  student_id: number
  parent_id?: number
  week_start: string
  week_end: string
  year: number
  week_number: number
  total_study_time: number
  total_problems_solved: number
  correct_rate: number
  streak_days: number
  subject_stats?: string
  badges_earned: number
  achievements?: string
  weak_areas?: string
  improvement_areas?: string
  ai_recommendations?: string
  is_sent: number
  sent_at?: string
}

// 通知設定取得
export async function getNotificationSettings(
  db: D1Database,
  userId: number
): Promise<NotificationSettings | null> {
  const result = await db.prepare(`
    SELECT * FROM notification_settings
    WHERE user_id = ?
  `).bind(userId).first()
  
  return result as NotificationSettings | null
}

// 通知設定更新
export async function updateNotificationSettings(
  db: D1Database,
  userId: number,
  settings: Partial<NotificationSettings>
): Promise<void> {
  const existing = await getNotificationSettings(db, userId)
  
  if (existing) {
    // 更新
    const fields = Object.keys(settings).filter(k => k !== 'user_id' && k !== 'setting_id')
    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => (settings as any)[f])
    
    await db.prepare(`
      UPDATE notification_settings
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(...values, userId).run()
  } else {
    // 新規作成
    await db.prepare(`
      INSERT INTO notification_settings (user_id, user_type)
      VALUES (?, ?)
    `).bind(userId, settings.user_type || 'parent').run()
  }
}

// 通知作成
export async function createNotification(
  db: D1Database,
  notification: Omit<Notification, 'notification_id' | 'created_at'>
): Promise<number> {
  // 静かな時間帯チェック
  const settings = await getNotificationSettings(db, notification.recipient_id)
  if (settings && settings.quiet_hours_start && settings.quiet_hours_end) {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM
    
    if (isInQuietHours(currentTime, settings.quiet_hours_start, settings.quiet_hours_end)) {
      // 静かな時間帯はスキップ（後で送信する仕組みも可能）
      return -1
    }
  }
  
  const result = await db.prepare(`
    INSERT INTO notification_history (
      recipient_id, student_id, notification_type, title, message,
      data, delivery_method, priority, action_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    notification.recipient_id,
    notification.student_id || null,
    notification.notification_type,
    notification.title,
    notification.message,
    notification.data || null,
    notification.delivery_method,
    notification.priority || 'normal',
    notification.action_url || null
  ).run()
  
  return result.meta.last_row_id || 0
}

// 静かな時間帯かどうか判定
function isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
  const current = timeToMinutes(currentTime)
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  
  if (start <= end) {
    // 例: 22:00 - 07:00（日をまたぐ）
    return current >= start || current <= end
  } else {
    // 例: 12:00 - 13:00（日をまたがない）
    return current >= start && current <= end
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// 未読通知一覧取得
export async function getUnreadNotifications(
  db: D1Database,
  userId: number,
  limit: number = 50
): Promise<Notification[]> {
  const result = await db.prepare(`
    SELECT * FROM notification_history
    WHERE recipient_id = ? AND is_read = 0
    ORDER BY priority DESC, created_at DESC
    LIMIT ?
  `).bind(userId, limit).all()
  
  return (result.results || []) as Notification[]
}

// 通知一覧取得（全て）
export async function getAllNotifications(
  db: D1Database,
  userId: number,
  limit: number = 100
): Promise<Notification[]> {
  const result = await db.prepare(`
    SELECT nh.*, u.name as student_name
    FROM notification_history nh
    LEFT JOIN users u ON nh.student_id = u.id
    WHERE nh.recipient_id = ?
    ORDER BY nh.created_at DESC
    LIMIT ?
  `).bind(userId, limit).all()
  
  return (result.results || []) as Notification[]
}

// 通知を既読にする
export async function markNotificationAsRead(
  db: D1Database,
  notificationId: number
): Promise<void> {
  await db.prepare(`
    UPDATE notification_history
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE notification_id = ?
  `).bind(notificationId).run()
}

// 全ての通知を既読にする
export async function markAllNotificationsAsRead(
  db: D1Database,
  userId: number
): Promise<void> {
  await db.prepare(`
    UPDATE notification_history
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE recipient_id = ? AND is_read = 0
  `).bind(userId).run()
}

// バッジ獲得通知
export async function notifyBadgeEarned(
  db: D1Database,
  studentId: number,
  badgeName: string,
  badgeDescription: string
): Promise<void> {
  const student = await db.prepare(`
    SELECT name FROM users WHERE id = ?
  `).bind(studentId).first()
  
  if (!student) return
  
  // 保護者一覧を取得
  const parents = await db.prepare(`
    SELECT parent_id FROM parent_student_relations
    WHERE student_id = ? AND is_active = 1
  `).bind(studentId).all()
  
  for (const parent of (parents.results || [])) {
    const settings = await getNotificationSettings(db, (parent as any).parent_id)
    if (!settings || !settings.badge_earned || !settings.in_app_notification) continue
    
    await createNotification(db, {
      recipient_id: (parent as any).parent_id,
      student_id: studentId,
      notification_type: 'achievement',
      title: `🏆 ${student.name}さんがバッジを獲得しました！`,
      message: `バッジ: ${badgeName}\n説明: ${badgeDescription}`,
      delivery_method: 'in_app',
      priority: 'high',
      action_url: `/parent/student/${studentId}`,
      is_read: 0,
      is_sent: 1
    })
  }
}

// 弱点発見通知
export async function notifyWeaknessFound(
  db: D1Database,
  studentId: number,
  subject: string,
  unit: string,
  recommendation: string
): Promise<void> {
  const student = await db.prepare(`
    SELECT name FROM users WHERE id = ?
  `).bind(studentId).first()
  
  if (!student) return
  
  const parents = await db.prepare(`
    SELECT parent_id FROM parent_student_relations
    WHERE student_id = ? AND is_active = 1
  `).bind(studentId).all()
  
  for (const parent of (parents.results || [])) {
    const settings = await getNotificationSettings(db, (parent as any).parent_id)
    if (!settings || !settings.weakness_found || !settings.in_app_notification) continue
    
    await createNotification(db, {
      recipient_id: (parent as any).parent_id,
      student_id: studentId,
      notification_type: 'weakness_found',
      title: `⚠️ ${student.name}さんの苦手分野が見つかりました`,
      message: `科目: ${subject}\n単元: ${unit}\n推奨: ${recommendation}`,
      delivery_method: 'in_app',
      priority: 'normal',
      action_url: `/parent/student/${studentId}/weak-areas`,
      is_read: 0,
      is_sent: 1
    })
  }
}

// 週次サマリー生成
export async function generateWeeklySummary(
  db: D1Database,
  studentId: number,
  weekStart: string,
  weekEnd: string
): Promise<WeeklySummary> {
  const weekStartDate = new Date(weekStart)
  const year = weekStartDate.getFullYear()
  const weekNumber = getWeekNumber(weekStartDate)
  
  // 学習統計を計算
  const stats = await db.prepare(`
    SELECT 
      SUM(duration_seconds) as total_time,
      SUM(problems_solved) as total_problems,
      AVG(CAST(correct_answers AS REAL) / NULLIF(problems_solved, 0)) * 100 as avg_accuracy,
      COUNT(DISTINCT DATE(session_start)) as study_days
    FROM learning_sessions
    WHERE student_id = ?
      AND DATE(session_start) >= ?
      AND DATE(session_start) <= ?
  `).bind(studentId, weekStart, weekEnd).first()
  
  // 教科別統計
  const subjectStats = await db.prepare(`
    SELECT 
      subject,
      SUM(problems_solved) as problems,
      AVG(CAST(correct_answers AS REAL) / NULLIF(problems_solved, 0)) * 100 as accuracy
    FROM learning_sessions
    WHERE student_id = ?
      AND DATE(session_start) >= ?
      AND DATE(session_start) <= ?
    GROUP BY subject
  `).bind(studentId, weekStart, weekEnd).all()
  
  // バッジ獲得数（この週）
  const badges = await db.prepare(`
    SELECT COUNT(*) as count
    FROM student_achievements
    WHERE student_id = ?
      AND DATE(achieved_at) >= ?
      AND DATE(achieved_at) <= ?
  `).bind(studentId, weekStart, weekEnd).first()
  
  // 連続学習日数
  const streak = await getStudyStreak(db, studentId)
  
  const summary: WeeklySummary = {
    student_id: studentId,
    week_start: weekStart,
    week_end: weekEnd,
    year,
    week_number: weekNumber,
    total_study_time: (stats as any)?.total_time || 0,
    total_problems_solved: (stats as any)?.total_problems || 0,
    correct_rate: (stats as any)?.avg_accuracy || 0,
    streak_days: streak,
    subject_stats: JSON.stringify(subjectStats.results || []),
    badges_earned: (badges as any)?.count || 0,
    is_sent: 0
  }
  
  // データベースに保存
  const result = await db.prepare(`
    INSERT INTO weekly_summaries (
      student_id, week_start, week_end, year, week_number,
      total_study_time, total_problems_solved, correct_rate, streak_days,
      subject_stats, badges_earned
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    summary.student_id,
    summary.week_start,
    summary.week_end,
    summary.year,
    summary.week_number,
    summary.total_study_time,
    summary.total_problems_solved,
    summary.correct_rate,
    summary.streak_days,
    summary.subject_stats,
    summary.badges_earned
  ).run()
  
  summary.summary_id = result.meta.last_row_id
  
  return summary
}

// 週番号を取得
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// 連続学習日数を取得
async function getStudyStreak(db: D1Database, studentId: number): Promise<number> {
  const sessions = await db.prepare(`
    SELECT DISTINCT DATE(session_start) as study_date
    FROM learning_sessions
    WHERE student_id = ?
    ORDER BY study_date DESC
    LIMIT 365
  `).bind(studentId).all()
  
  if (!sessions.results || sessions.results.length === 0) return 0
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const session of sessions.results) {
    const studyDate = new Date((session as any).study_date)
    studyDate.setHours(0, 0, 0, 0)
    
    const diffDays = Math.floor((currentDate.getTime() - studyDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === streak) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

// 週次サマリーを保護者に送信
export async function sendWeeklySummaryToParents(
  db: D1Database,
  summaryId: number
): Promise<void> {
  const summary = await db.prepare(`
    SELECT * FROM weekly_summaries WHERE summary_id = ?
  `).bind(summaryId).first() as WeeklySummary
  
  if (!summary) return
  
  const student = await db.prepare(`
    SELECT name FROM users WHERE id = ?
  `).bind(summary.student_id).first()
  
  const parents = await db.prepare(`
    SELECT parent_id FROM parent_student_relations
    WHERE student_id = ? AND is_active = 1
  `).bind(summary.student_id).all()
  
  const hours = Math.floor(summary.total_study_time / 3600)
  const minutes = Math.floor((summary.total_study_time % 3600) / 60)
  
  for (const parent of (parents.results || [])) {
    const settings = await getNotificationSettings(db, (parent as any).parent_id)
    if (!settings || !settings.weekly_summary || !settings.in_app_notification) continue
    
    await createNotification(db, {
      recipient_id: (parent as any).parent_id,
      student_id: summary.student_id,
      notification_type: 'weekly_summary',
      title: `📊 ${student?.name}さんの今週の学習サマリー`,
      message: `学習時間: ${hours}時間${minutes}分
問題数: ${summary.total_problems_solved}問
正答率: ${summary.correct_rate.toFixed(1)}%
連続学習: ${summary.streak_days}日`,
      data: JSON.stringify(summary),
      delivery_method: 'in_app',
      priority: 'normal',
      action_url: `/parent/student/${summary.student_id}/summary`,
      is_read: 0,
      is_sent: 1
    })
  }
  
  // サマリーを送信済みにマーク
  await db.prepare(`
    UPDATE weekly_summaries
    SET is_sent = 1, sent_at = CURRENT_TIMESTAMP
    WHERE summary_id = ?
  `).bind(summaryId).run()
}
