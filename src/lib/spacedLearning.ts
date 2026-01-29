/**
 * 分散学習スケジューラー
 * Spaced Learning Scheduler
 * 
 * 科学的根拠：
 * - Ebbinghaus忘却曲線理論（1885）
 * - Leitnerシステム（1972）
 * - SuperMemo SM-2アルゴリズム（1988）
 * 
 * @module spacedLearning
 * @since 2026-01-29
 */

// =====================================================
// 型定義
// =====================================================

/**
 * 学習段階
 */
export type LearningStage = 'new' | 'learning' | 'review' | 'mastered';

/**
 * 学習結果
 */
export type StudyResult = 'correct' | 'incorrect' | 'partial';

/**
 * セッションタイプ
 */
export type SessionType = 'initial' | 'review' | 'intensive' | 'test';

/**
 * 推奨理由
 */
export type RecommendationReason = 
    | 'scheduled'       // スケジュール通り
    | 'overdue'         // 期限超過
    | 'struggling'      // 苦手
    | 'reinforcement'   // 強化推奨
    | 'srl_performance'; // SRL遂行段階支援

/**
 * 分散学習スケジュール
 */
export interface SpacedLearningSchedule {
    id?: number;
    student_id: number;
    card_id: number;
    learning_stage: LearningStage;
    leitner_box: number;
    mastery_level: number;
    study_count: number;
    correct_count: number;
    incorrect_count: number;
    last_result?: StudyResult;
    last_studied_at?: string;
    next_review_date: string;
    review_interval_days: number;
    easiness_factor: number;
    repetition_number: number;
    srl_foresight_score?: number;
    srl_performance_score?: number;
    srl_reflection_score?: number;
    created_at?: string;
    updated_at?: string;
}

/**
 * 分散学習設定
 */
export interface SpacedLearningConfig {
    box1_interval_days: number;
    box2_interval_days: number;
    box3_interval_days: number;
    box4_interval_days: number;
    box5_interval_days: number;
    mastery_threshold: number;
    learning_threshold: number;
    min_easiness_factor: number;
    max_easiness_factor: number;
    default_easiness_factor: number;
    correct_streak_to_advance: number;
}

/**
 * 学習履歴
 */
export interface SpacedLearningHistory {
    id?: number;
    schedule_id: number;
    student_id: number;
    card_id: number;
    session_type: SessionType;
    result: StudyResult;
    response_time_seconds?: number;
    difficulty_rating?: number;
    confidence_level?: number;
    days_since_last_review?: number;
    scheduled_date?: string;
    actual_date: string;
    was_on_time: boolean;
    old_leitner_box?: number;
    new_leitner_box?: number;
    old_mastery_level?: number;
    new_mastery_level?: number;
    old_easiness_factor?: number;
    new_easiness_factor?: number;
    srl_stage?: 'foresight' | 'performance' | 'reflection';
    srl_strategy_used?: string;
    srl_notes?: string;
    created_at?: string;
}

/**
 * 復習推奨
 */
export interface ReviewRecommendation {
    card_id: number;
    priority_score: number;
    reason: RecommendationReason;
    next_review_date: string;
    days_overdue?: number;
    mastery_level: number;
    leitner_box: number;
}

// =====================================================
// デフォルト設定
// =====================================================

export const DEFAULT_CONFIG: SpacedLearningConfig = {
    box1_interval_days: 1.0,    // 1日後
    box2_interval_days: 3.0,    // 3日後
    box3_interval_days: 7.0,    // 1週間後
    box4_interval_days: 14.0,   // 2週間後
    box5_interval_days: 30.0,   // 1ヶ月後
    mastery_threshold: 0.8,     // 80%以上で習得
    learning_threshold: 0.5,    // 50%以上で学習中
    min_easiness_factor: 1.3,
    max_easiness_factor: 3.0,
    default_easiness_factor: 2.5,
    correct_streak_to_advance: 2  // 2回連続正解で昇格
};

// =====================================================
// 復習間隔計算アルゴリズム
// =====================================================

/**
 * SuperMemo SM-2アルゴリズムに基づく次回復習間隔の計算
 * 
 * @param quality 学習品質（0-5）: 0=完全に忘れた, 3=正解だが困難, 5=完璧
 * @param easinessFactor 現在の易しさ係数（1.3-3.0）
 * @param repetitionNumber 現在の反復回数
 * @param currentInterval 現在の復習間隔（日数）
 * @returns 新しい易しさ係数、反復回数、復習間隔
 */
export function calculateSM2Interval(
    quality: number,
    easinessFactor: number,
    repetitionNumber: number,
    currentInterval: number
): { newEF: number; newRepetition: number; newInterval: number } {
    // 品質スコアから新しい易しさ係数を計算
    let newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    
    // 易しさ係数の範囲制限
    newEF = Math.max(DEFAULT_CONFIG.min_easiness_factor, Math.min(DEFAULT_CONFIG.max_easiness_factor, newEF));
    
    let newRepetition: number;
    let newInterval: number;
    
    if (quality < 3) {
        // 品質が低い場合はリセット
        newRepetition = 0;
        newInterval = 1;
    } else {
        // 品質が良い場合は進める
        newRepetition = repetitionNumber + 1;
        
        if (newRepetition === 1) {
            newInterval = 1;
        } else if (newRepetition === 2) {
            newInterval = 6;
        } else {
            newInterval = Math.round(currentInterval * newEF);
        }
    }
    
    return { newEF, newRepetition, newInterval };
}

/**
 * Leitnerシステムに基づく復習間隔の計算
 * 
 * @param leitnerBox 現在のLeitnerボックス（1-5）
 * @param config 分散学習設定
 * @returns 復習間隔（日数）
 */
export function getLeitnerInterval(leitnerBox: number, config: SpacedLearningConfig): number {
    switch (leitnerBox) {
        case 1: return config.box1_interval_days;
        case 2: return config.box2_interval_days;
        case 3: return config.box3_interval_days;
        case 4: return config.box4_interval_days;
        case 5: return config.box5_interval_days;
        default: return config.box1_interval_days;
    }
}

/**
 * 学習結果から品質スコア（0-5）を計算
 * 
 * @param result 学習結果
 * @param responseTimeSeconds 回答時間（秒）
 * @param difficultyRating 難易度評価（1-5、低いほど簡単）
 * @param confidenceLevel 自信レベル（1-5、高いほど自信がある）
 * @returns 品質スコア（0-5）
 */
export function calculateQualityScore(
    result: StudyResult,
    responseTimeSeconds?: number,
    difficultyRating?: number,
    confidenceLevel?: number
): number {
    let baseScore: number;
    
    // 基本スコア
    switch (result) {
        case 'correct':
            baseScore = 5;
            break;
        case 'partial':
            baseScore = 3;
            break;
        case 'incorrect':
            baseScore = 0;
            break;
    }
    
    // 難易度評価による調整（正解の場合のみ）
    if (result === 'correct' && difficultyRating) {
        // 難易度が高い（5）なら減点、低い（1）ならそのまま
        baseScore -= (difficultyRating - 1) * 0.5;
    }
    
    // 自信レベルによる調整
    if (confidenceLevel) {
        // 自信がない（1）なら減点、自信がある（5）ならそのまま
        if (confidenceLevel <= 3) {
            baseScore -= (4 - confidenceLevel) * 0.3;
        }
    }
    
    // 回答時間による調整（オプション）
    // 速い回答 = より良い記憶定着
    if (responseTimeSeconds && result === 'correct') {
        if (responseTimeSeconds < 5) {
            baseScore += 0.2; // 5秒未満はボーナス
        } else if (responseTimeSeconds > 30) {
            baseScore -= 0.3; // 30秒以上はペナルティ
        }
    }
    
    // 0-5の範囲に制限
    return Math.max(0, Math.min(5, baseScore));
}

/**
 * 習熟度レベルの更新
 * 
 * @param currentMastery 現在の習熟度（0.0-1.0）
 * @param result 学習結果
 * @param qualityScore 品質スコア（0-5）
 * @returns 新しい習熟度（0.0-1.0）
 */
export function updateMasteryLevel(
    currentMastery: number,
    result: StudyResult,
    qualityScore: number
): number {
    // 品質スコアを0-1に正規化
    const normalizedQuality = qualityScore / 5;
    
    // 指数移動平均（EMA）で習熟度を更新
    // α = 0.3（新しい結果の重み）
    const alpha = 0.3;
    const newMastery = currentMastery * (1 - alpha) + normalizedQuality * alpha;
    
    // 0.0-1.0の範囲に制限
    return Math.max(0, Math.min(1, newMastery));
}

/**
 * Leitnerボックスの更新
 * 
 * @param currentBox 現在のボックス（1-5）
 * @param result 学習結果
 * @param correctStreak 連続正解数
 * @param config 分散学習設定
 * @returns 新しいボックス番号（1-5）
 */
export function updateLeitnerBox(
    currentBox: number,
    result: StudyResult,
    correctStreak: number,
    config: SpacedLearningConfig
): number {
    if (result === 'correct' && correctStreak >= config.correct_streak_to_advance) {
        // 連続正解で次のボックスへ昇格
        return Math.min(5, currentBox + 1);
    } else if (result === 'incorrect') {
        // 不正解でボックス1へ降格
        return 1;
    } else if (result === 'partial') {
        // 部分正解は現状維持または1つ降格
        return Math.max(1, currentBox - 1);
    }
    
    // その他の場合は現状維持
    return currentBox;
}

/**
 * 学習段階の判定
 * 
 * @param masteryLevel 習熟度（0.0-1.0）
 * @param studyCount 学習回数
 * @param config 分散学習設定
 * @returns 学習段階
 */
export function determineLearningStage(
    masteryLevel: number,
    studyCount: number,
    config: SpacedLearningConfig
): LearningStage {
    if (studyCount === 0) {
        return 'new';
    } else if (masteryLevel >= config.mastery_threshold) {
        return 'mastered';
    } else if (masteryLevel >= config.learning_threshold) {
        return 'review';
    } else {
        return 'learning';
    }
}

/**
 * 次回復習日時の計算
 * 
 * @param intervalDays 復習間隔（日数）
 * @param baseDate 基準日時（省略時は現在時刻）
 * @returns ISO形式の日時文字列
 */
export function calculateNextReviewDate(intervalDays: number, baseDate?: Date): string {
    const base = baseDate || new Date();
    const nextDate = new Date(base.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    return nextDate.toISOString();
}

/**
 * 優先度スコアの計算
 * 
 * @param daysOverdue 期限超過日数（負の値 = 期限前）
 * @param masteryLevel 習熟度（0.0-1.0）
 * @param leitnerBox Leitnerボックス（1-5）
 * @returns 優先度スコア（0-100、高いほど優先）
 */
export function calculatePriorityScore(
    daysOverdue: number,
    masteryLevel: number,
    leitnerBox: number
): number {
    let score = 0;
    
    // 期限超過による優先度
    if (daysOverdue > 0) {
        score += Math.min(50, daysOverdue * 5);  // 最大50点
    }
    
    // 習熟度が低いほど優先度高い
    score += (1 - masteryLevel) * 30;  // 最大30点
    
    // Leitnerボックスが低いほど優先度高い
    score += (6 - leitnerBox) * 4;  // 最大20点
    
    return Math.min(100, Math.max(0, score));
}

/**
 * 推奨理由の判定
 * 
 * @param daysOverdue 期限超過日数
 * @param masteryLevel 習熟度（0.0-1.0）
 * @param incorrectRate 不正解率（0.0-1.0）
 * @returns 推奨理由
 */
export function determineRecommendationReason(
    daysOverdue: number,
    masteryLevel: number,
    incorrectRate: number
): RecommendationReason {
    if (daysOverdue > 7) {
        return 'overdue';
    } else if (incorrectRate > 0.5) {
        return 'struggling';
    } else if (masteryLevel < 0.5) {
        return 'srl_performance';
    } else if (masteryLevel < 0.8) {
        return 'reinforcement';
    } else {
        return 'scheduled';
    }
}

// =====================================================
// 統合処理関数
// =====================================================

/**
 * 学習結果の処理と次回スケジュールの更新
 * 
 * @param schedule 現在のスケジュール
 * @param result 学習結果
 * @param responseTimeSeconds 回答時間（秒）
 * @param difficultyRating 難易度評価（1-5）
 * @param confidenceLevel 自信レベル（1-5）
 * @param config 分散学習設定
 * @returns 更新されたスケジュール
 */
export function processStudyResult(
    schedule: SpacedLearningSchedule,
    result: StudyResult,
    responseTimeSeconds?: number,
    difficultyRating?: number,
    confidenceLevel?: number,
    config: SpacedLearningConfig = DEFAULT_CONFIG
): SpacedLearningSchedule {
    // 品質スコアの計算
    const qualityScore = calculateQualityScore(result, responseTimeSeconds, difficultyRating, confidenceLevel);
    
    // 習熟度の更新
    const newMasteryLevel = updateMasteryLevel(schedule.mastery_level, result, qualityScore);
    
    // カウントの更新
    const newStudyCount = schedule.study_count + 1;
    const newCorrectCount = result === 'correct' ? schedule.correct_count + 1 : schedule.correct_count;
    const newIncorrectCount = result === 'incorrect' ? schedule.incorrect_count + 1 : schedule.incorrect_count;
    
    // 連続正解数の計算
    const correctStreak = result === 'correct' && schedule.last_result === 'correct' ? 2 : (result === 'correct' ? 1 : 0);
    
    // Leitnerボックスの更新
    const newLeitnerBox = updateLeitnerBox(schedule.leitner_box, result, correctStreak, config);
    
    // SuperMemo SM-2アルゴリズムで次回間隔を計算
    const { newEF, newRepetition, newInterval: sm2Interval } = calculateSM2Interval(
        qualityScore,
        schedule.easiness_factor,
        schedule.repetition_number,
        schedule.review_interval_days
    );
    
    // Leitnerシステムの間隔
    const leitnerInterval = getLeitnerInterval(newLeitnerBox, config);
    
    // 2つのアルゴリズムの平均を取る（バランス）
    const newInterval = (sm2Interval + leitnerInterval) / 2;
    
    // 次回復習日時の計算
    const nextReviewDate = calculateNextReviewDate(newInterval);
    
    // 学習段階の判定
    const newLearningStage = determineLearningStage(newMasteryLevel, newStudyCount, config);
    
    // 更新されたスケジュールを返す
    return {
        ...schedule,
        learning_stage: newLearningStage,
        leitner_box: newLeitnerBox,
        mastery_level: newMasteryLevel,
        study_count: newStudyCount,
        correct_count: newCorrectCount,
        incorrect_count: newIncorrectCount,
        last_result: result,
        last_studied_at: new Date().toISOString(),
        next_review_date: nextReviewDate,
        review_interval_days: newInterval,
        easiness_factor: newEF,
        repetition_number: newRepetition,
        updated_at: new Date().toISOString()
    };
}

/**
 * 新しい学習カードのスケジュール初期化
 * 
 * @param studentId 学生ID
 * @param cardId カードID
 * @param config 分散学習設定
 * @returns 初期スケジュール
 */
export function initializeSchedule(
    studentId: number,
    cardId: number,
    config: SpacedLearningConfig = DEFAULT_CONFIG
): SpacedLearningSchedule {
    const now = new Date().toISOString();
    const nextReviewDate = calculateNextReviewDate(config.box1_interval_days);
    
    return {
        student_id: studentId,
        card_id: cardId,
        learning_stage: 'new',
        leitner_box: 1,
        mastery_level: 0.0,
        study_count: 0,
        correct_count: 0,
        incorrect_count: 0,
        next_review_date: nextReviewDate,
        review_interval_days: config.box1_interval_days,
        easiness_factor: config.default_easiness_factor,
        repetition_number: 0,
        created_at: now,
        updated_at: now
    };
}
