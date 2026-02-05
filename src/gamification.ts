/**
 * Phase 14: ゲーミフィケーションシステム
 * 個人の励ましに特化したゲーミフィケーション機能
 * - バッジシステム
 * - ポイント＆レベルシステム
 * - 学習ストリーク
 * - デイリーチャレンジ
 * - AI励ましメッセージ
 */

import { D1Database } from '@cloudflare/workers-types'

// ============================================
// 型定義
// ============================================

export interface Badge {
    id: number
    badge_key: string
    category: string
    name: string
    description: string
    icon: string
    condition_type: string
    condition_value: number
    points_reward: number
    earned?: boolean
    earned_at?: string
    progress?: number
}

export interface UserBadge {
    badge_key: string
    earned_at: string
}

export interface PointTransaction {
    points: number
    source: string
    description: string
}

export interface StudentLevel {
    student_id: number
    current_level: number
    total_points: number
    points_to_next_level: number
    level_progress_percent: number
}

export interface LearningStreak {
    current_streak: number
    longest_streak: number
    last_activity_date: string
}

export interface DailyChallenge {
    id: number
    challenge_date: string
    challenge_type: string
    challenge_goal: number
    challenge_description: string
    points_reward: number
    progress: number
    completed: boolean
}

export interface EncouragementMessage {
    message_type: string
    message_text: string
}

// ============================================
// レベル計算関数
// ============================================

/**
 * レベルアップに必要なポイントを計算
 * レベル1→2: 100ポイント
 * レベル2→3: 200ポイント（累計300）
 * レベル3→4: 300ポイント（累計600）
 * ...
 */
export function getPointsForLevel(level: number): number {
    let totalPoints = 0
    for (let i = 1; i < level; i++) {
        totalPoints += i * 100
    }
    return totalPoints
}

/**
 * ポイントからレベルを計算
 */
export function calculateLevel(totalPoints: number): number {
    let level = 1
    let pointsRequired = 0
    
    while (true) {
        const nextLevelPoints = getPointsForLevel(level + 1)
        if (totalPoints < nextLevelPoints) {
            break
        }
        level++
    }
    
    return level
}

// ============================================
// バッジ管理
// ============================================

/**
 * すべてのバッジ定義を取得（ユーザーの獲得状況含む）
 */
export async function getAllBadges(db: D1Database, studentId: number): Promise<Badge[]> {
    const query = `
        SELECT 
            bd.*,
            ub.earned_at,
            ub.progress,
            CASE WHEN ub.student_id IS NOT NULL THEN 1 ELSE 0 END as earned
        FROM badge_definitions bd
        LEFT JOIN user_badges ub ON bd.badge_key = ub.badge_key AND ub.student_id = ?
        ORDER BY bd.category, bd.condition_value
    `
    
    const result = await db.prepare(query).bind(studentId).all()
    return result.results as Badge[]
}

/**
 * バッジ獲得チェック
 */
export async function checkAndAwardBadge(
    db: D1Database,
    studentId: number,
    badgeKey: string
): Promise<boolean> {
    // すでに獲得済みかチェック
    const existing = await db.prepare(
        'SELECT id FROM user_badges WHERE student_id = ? AND badge_key = ?'
    ).bind(studentId, badgeKey).first()
    
    if (existing) {
        return false
    }
    
    // バッジ定義を取得
    const badgeDef = await db.prepare(
        'SELECT * FROM badge_definitions WHERE badge_key = ?'
    ).bind(badgeKey).first<Badge>()
    
    if (!badgeDef) {
        return false
    }
    
    // バッジを授与
    await db.prepare(
        'INSERT INTO user_badges (student_id, badge_key) VALUES (?, ?)'
    ).bind(studentId, badgeKey).run()
    
    // ポイントを付与
    if (badgeDef.points_reward > 0) {
        await addPoints(db, studentId, badgeDef.points_reward, 'badge', `バッジ獲得: ${badgeDef.name}`)
    }
    
    return true
}

/**
 * バッジ進捗を更新
 */
export async function updateBadgeProgress(
    db: D1Database,
    studentId: number,
    badgeKey: string,
    progress: number
): Promise<void> {
    await db.prepare(`
        INSERT INTO user_badges (student_id, badge_key, progress)
        VALUES (?, ?, ?)
        ON CONFLICT(student_id, badge_key) DO UPDATE SET progress = ?
    `).bind(studentId, badgeKey, progress, progress).run()
}

// ============================================
// ポイント管理
// ============================================

/**
 * ポイントを追加
 */
export async function addPoints(
    db: D1Database,
    studentId: number,
    points: number,
    source: string,
    description: string
): Promise<void> {
    // ポイント履歴に記録
    await db.prepare(`
        INSERT INTO point_history (student_id, points, source, description)
        VALUES (?, ?, ?, ?)
    `).bind(studentId, points, source, description).run()
    
    // 総ポイントを更新
    const currentLevel = await db.prepare(`
        SELECT * FROM student_levels WHERE student_id = ?
    `).bind(studentId).first<StudentLevel>()
    
    if (currentLevel) {
        const newTotalPoints = currentLevel.total_points + points
        const newLevel = calculateLevel(newTotalPoints)
        
        // レベルアップチェック
        const leveledUp = newLevel > currentLevel.current_level
        
        await db.prepare(`
            UPDATE student_levels
            SET total_points = ?, current_level = ?, updated_at = datetime('now')
            ${leveledUp ? ", level_up_at = datetime('now')" : ""}
            WHERE student_id = ?
        `).bind(newTotalPoints, newLevel, studentId).run()
        
        // レベルアップ時の処理
        if (leveledUp) {
            await addEncouragementMessage(
                db,
                studentId,
                'level_up',
                `🎉 レベル${newLevel}に到達しました！おめでとうございます！あなたの努力が実を結びました！`
            )
        }
    } else {
        // 初回ポイント取得
        await db.prepare(`
            INSERT INTO student_levels (student_id, total_points, current_level)
            VALUES (?, ?, 1)
        `).bind(studentId, points).run()
    }
}

/**
 * 学生のレベル情報を取得
 */
export async function getStudentLevel(db: D1Database, studentId: number): Promise<StudentLevel> {
    let level = await db.prepare(
        'SELECT * FROM student_levels WHERE student_id = ?'
    ).bind(studentId).first<StudentLevel>()
    
    if (!level) {
        // 初期化
        await db.prepare(`
            INSERT INTO student_levels (student_id, total_points, current_level)
            VALUES (?, 0, 1)
        `).bind(studentId).run()
        
        level = {
            student_id: studentId,
            current_level: 1,
            total_points: 0,
            points_to_next_level: 100,
            level_progress_percent: 0
        }
    }
    
    // 次のレベルまでのポイント計算
    const currentLevelPoints = getPointsForLevel(level.current_level)
    const nextLevelPoints = getPointsForLevel(level.current_level + 1)
    const pointsInCurrentLevel = level.total_points - currentLevelPoints
    const pointsNeeded = nextLevelPoints - currentLevelPoints
    
    level.points_to_next_level = nextLevelPoints - level.total_points
    level.level_progress_percent = Math.floor((pointsInCurrentLevel / pointsNeeded) * 100)
    
    return level
}

// ============================================
// 学習ストリーク管理
// ============================================

/**
 * 学習ストリークを更新
 */
export async function updateLearningStreak(db: D1Database, studentId: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    
    const streak = await db.prepare(
        'SELECT * FROM learning_streaks WHERE student_id = ?'
    ).bind(studentId).first<LearningStreak>()
    
    if (!streak) {
        // 初回
        await db.prepare(`
            INSERT INTO learning_streaks (student_id, current_streak, longest_streak, last_activity_date)
            VALUES (?, 1, 1, ?)
        `).bind(studentId, today).run()
        
        await checkAndAwardBadge(db, studentId, 'habit_first_step')
        return true
    }
    
    // 今日既に更新済み
    if (streak.last_activity_date === today) {
        return false
    }
    
    const lastDate = new Date(streak.last_activity_date)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let newStreak = streak.current_streak
    let longestStreak = streak.longest_streak
    
    if (diffDays === 1) {
        // 連続
        newStreak++
        longestStreak = Math.max(longestStreak, newStreak)
    } else {
        // リセット
        newStreak = 1
    }
    
    await db.prepare(`
        UPDATE learning_streaks
        SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = datetime('now')
        WHERE student_id = ?
    `).bind(newStreak, longestStreak, today, studentId).run()
    
    // ストリークバッジチェック
    if (newStreak === 3) {
        await checkAndAwardBadge(db, studentId, 'habit_streak_3')
    } else if (newStreak === 7) {
        await checkAndAwardBadge(db, studentId, 'habit_streak_7')
    } else if (newStreak === 30) {
        await checkAndAwardBadge(db, studentId, 'habit_streak_30')
    }
    
    // ストリーク更新メッセージ
    if (newStreak > 1) {
        await addEncouragementMessage(
            db,
            studentId,
            'streak',
            `🔥 ${newStreak}日連続学習中！継続は力なり！素晴らしい努力です！`
        )
    }
    
    return true
}

/**
 * 学習ストリーク情報を取得
 */
export async function getLearningStreak(db: D1Database, studentId: number): Promise<LearningStreak> {
    const streak = await db.prepare(
        'SELECT * FROM learning_streaks WHERE student_id = ?'
    ).bind(studentId).first<LearningStreak>()
    
    if (!streak) {
        return {
            current_streak: 0,
            longest_streak: 0,
            last_activity_date: ''
        }
    }
    
    return streak
}

// ============================================
// 励ましメッセージ管理
// ============================================

/**
 * 励ましメッセージを追加
 */
export async function addEncouragementMessage(
    db: D1Database,
    studentId: number,
    messageType: string,
    messageText: string
): Promise<void> {
    await db.prepare(`
        INSERT INTO encouragement_messages (student_id, message_type, message_text)
        VALUES (?, ?, ?)
    `).bind(studentId, messageType, messageText).run()
}

/**
 * 未読の励ましメッセージを取得
 */
export async function getUnreadMessages(
    db: D1Database,
    studentId: number
): Promise<EncouragementMessage[]> {
    const result = await db.prepare(`
        SELECT message_type, message_text
        FROM encouragement_messages
        WHERE student_id = ? AND shown = 0
        ORDER BY created_at DESC
        LIMIT 5
    `).bind(studentId).all()
    
    // 既読にする
    await db.prepare(`
        UPDATE encouragement_messages
        SET shown = 1, shown_at = datetime('now')
        WHERE student_id = ? AND shown = 0
    `).bind(studentId).run()
    
    return result.results as EncouragementMessage[]
}

/**
 * 学習開始時のメッセージ生成
 */
export async function generateStartMessage(db: D1Database, studentId: number): Promise<string> {
    const messages = [
        '今日も頑張りましょう！✨',
        'さあ、今日も学習を始めましょう！📚',
        '新しい一日の学習スタート！🌟',
        '今日はどんな発見があるかな？🔍',
        'あなたの成長を応援しています！💪'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    await addEncouragementMessage(db, studentId, 'start', randomMessage)
    
    return randomMessage
}

/**
 * 正解時のメッセージ生成
 */
export async function generateCorrectMessage(db: D1Database, studentId: number): Promise<string> {
    const messages = [
        '素晴らしい！その調子です！✨',
        '正解！よくできました！🎉',
        'パーフェクト！完璧です！⭐',
        'すごい！理解が深まっていますね！💡',
        'やりました！次も頑張りましょう！🌟'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    await addEncouragementMessage(db, studentId, 'correct', randomMessage)
    
    return randomMessage
}

/**
 * 不正解時のメッセージ生成
 */
export async function generateIncorrectMessage(db: D1Database, studentId: number): Promise<string> {
    const messages = [
        '大丈夫！間違いから学ぶことが大切です📚',
        'まだチャンスはあります！もう一度チャレンジしてみましょう💪',
        '失敗は成功のもと！次は解けるようになりますよ✨',
        '難しかったですね。でも諦めないあなたは素晴らしい！🌟',
        '間違えても大丈夫！成長のチャンスです！🌱'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    await addEncouragementMessage(db, studentId, 'incorrect', randomMessage)
    
    return randomMessage
}

/**
 * 長時間学習時のメッセージ生成
 */
export async function generateLongStudyMessage(db: D1Database, studentId: number): Promise<string> {
    const messages = [
        'よく頑張りました！少し休憩しましょう☕',
        '素晴らしい集中力です！休憩も大切ですよ🌸',
        '長時間お疲れ様！リフレッシュタイムを取りましょう🎵',
        'あなたの努力に感動しています！少し休んでくださいね💫',
        'ここまでよく頑張りました！休憩して元気を回復しましょう🍀'
    ]
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    await addEncouragementMessage(db, studentId, 'long_study', randomMessage)
    
    return randomMessage
}
