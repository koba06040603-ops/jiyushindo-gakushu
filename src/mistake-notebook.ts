/**
 * Phase 20-1: 間違いノート機能
 * エビングハウスの忘却曲線に基づく復習タイミング最適化
 */

interface MistakeNote {
  id?: number;
  student_id: number;
  problem_id?: number;
  original_question: string;
  original_answer: string;
  correct_answer: string;
  student_answer: string;
  subject: string;
  unit_name?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mistake_type?: string;
  review_count?: number;
  mastery_level?: number;
  is_mastered?: number;
  next_review_at?: string;
  ai_feedback?: string;
}

interface ReviewSchedule {
  mistake_id: number;
  scheduled_date: string;
  priority: number;
}

/**
 * エビングハウスの忘却曲線に基づく次回復習日を計算
 * @param reviewCount - 復習回数
 * @param masteryLevel - 克服度 (0-100)
 * @returns 次回復習までの日数
 */
export function calculateNextReviewInterval(reviewCount: number, masteryLevel: number): number {
  // エビングハウスの忘却曲線に基づく復習間隔
  const baseIntervals = [1, 3, 7, 14, 30, 60, 90]; // 日数
  
  // 復習回数に応じた基本間隔
  let interval = baseIntervals[Math.min(reviewCount, baseIntervals.length - 1)];
  
  // 克服度による調整（克服度が高いほど間隔を伸ばす）
  const masteryFactor = 1 + (masteryLevel / 100);
  interval = Math.round(interval * masteryFactor);
  
  return interval;
}

/**
 * 間違いノートに追加
 */
export async function addToMistakeNotebook(
  DB: D1Database,
  mistake: MistakeNote
): Promise<{ success: boolean; mistakeId?: number; error?: string }> {
  try {
    // 次回復習日を計算
    const reviewInterval = calculateNextReviewInterval(mistake.review_count || 0, mistake.mastery_level || 0);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + reviewInterval);
    
    const result = await DB.prepare(`
      INSERT INTO mistake_notebook (
        student_id, problem_id, original_question, original_answer,
        correct_answer, student_answer, subject, unit_name, difficulty,
        mistake_type, review_count, mastery_level, next_review_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mistake.student_id,
      mistake.problem_id || null,
      mistake.original_question,
      mistake.original_answer,
      mistake.correct_answer,
      mistake.student_answer,
      mistake.subject,
      mistake.unit_name || null,
      mistake.difficulty || 'medium',
      mistake.mistake_type || null,
      0,
      0,
      nextReviewDate.toISOString()
    ).run();

    return { success: true, mistakeId: result.meta.last_row_id as number };
  } catch (error: any) {
    console.error('間違いノート追加エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 間違いノート一覧取得
 */
export async function getMistakeNotebook(
  DB: D1Database,
  studentId: number,
  filters?: {
    subject?: string;
    isMastered?: boolean;
    limit?: number;
  }
): Promise<MistakeNote[]> {
  let query = `
    SELECT * FROM mistake_notebook
    WHERE student_id = ?
  `;
  const params: any[] = [studentId];

  if (filters?.subject) {
    query += ` AND subject = ?`;
    params.push(filters.subject);
  }

  if (filters?.isMastered !== undefined) {
    query += ` AND is_mastered = ?`;
    params.push(filters.isMastered ? 1 : 0);
  }

  query += ` ORDER BY first_mistake_at DESC`;

  if (filters?.limit) {
    query += ` LIMIT ?`;
    params.push(filters.limit);
  }

  const result = await DB.prepare(query).bind(...params).all();
  return result.results as MistakeNote[];
}

/**
 * 今日の復習問題を取得
 */
export async function getTodayReviewProblems(
  DB: D1Database,
  studentId: number
): Promise<MistakeNote[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await DB.prepare(`
    SELECT * FROM mistake_notebook
    WHERE student_id = ?
      AND is_mastered = 0
      AND DATE(next_review_at) <= ?
    ORDER BY next_review_at ASC
    LIMIT 20
  `).bind(studentId, today).all();

  return result.results as MistakeNote[];
}

/**
 * 復習を記録
 */
export async function recordReview(
  DB: D1Database,
  mistakeId: number,
  studentId: number,
  isCorrect: boolean,
  confidenceLevel: number,
  timeSpent?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // 復習履歴を記録
    await DB.prepare(`
      INSERT INTO review_history (
        mistake_id, student_id, review_type, is_correct,
        confidence_level, time_spent
      ) VALUES (?, ?, 'scheduled', ?, ?, ?)
    `).bind(mistakeId, studentId, isCorrect ? 1 : 0, confidenceLevel, timeSpent || null).run();

    // 間違いノートを更新
    const mistake = await DB.prepare(`
      SELECT review_count, mastery_level FROM mistake_notebook WHERE id = ?
    `).bind(mistakeId).first();

    if (!mistake) {
      return { success: false, error: '間違いノートが見つかりません' };
    }

    const reviewCount = (mistake.review_count as number) + 1;
    
    // 克服度を更新（正解 +20点、不正解 -10点、自信度も反映）
    let masteryLevel = mistake.mastery_level as number;
    if (isCorrect) {
      masteryLevel = Math.min(100, masteryLevel + 15 + confidenceLevel * 2);
    } else {
      masteryLevel = Math.max(0, masteryLevel - 10);
    }

    const isMastered = masteryLevel >= 80 && reviewCount >= 3 ? 1 : 0;

    // 次回復習日を計算
    const reviewInterval = calculateNextReviewInterval(reviewCount, masteryLevel);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + reviewInterval);

    await DB.prepare(`
      UPDATE mistake_notebook
      SET review_count = ?,
          mastery_level = ?,
          is_mastered = ?,
          last_review_at = CURRENT_TIMESTAMP,
          next_review_at = ?
      WHERE id = ?
    `).bind(reviewCount, masteryLevel, isMastered, nextReviewDate.toISOString(), mistakeId).run();

    return { success: true };
  } catch (error: any) {
    console.error('復習記録エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 克服度統計を取得
 */
export async function getMasteryStatistics(
  DB: D1Database,
  studentId: number,
  subject?: string
): Promise<any[]> {
  let query = `
    SELECT 
      subject,
      unit_name,
      COUNT(*) as total_mistakes,
      SUM(CASE WHEN is_mastered = 1 THEN 1 ELSE 0 END) as mastered_count,
      AVG(mastery_level) as avg_mastery,
      AVG(review_count) as avg_reviews
    FROM mistake_notebook
    WHERE student_id = ?
  `;
  const params: any[] = [studentId];

  if (subject) {
    query += ` AND subject = ?`;
    params.push(subject);
  }

  query += ` GROUP BY subject, unit_name ORDER BY subject, unit_name`;

  const result = await DB.prepare(query).bind(...params).all();
  
  return result.results.map((row: any) => ({
    subject: row.subject,
    unitName: row.unit_name,
    totalMistakes: row.total_mistakes,
    masteredCount: row.mastered_count,
    masteryPercentage: row.mastered_count / row.total_mistakes * 100,
    averageMastery: row.avg_mastery,
    averageReviews: row.avg_reviews
  }));
}

/**
 * 類似問題を生成（AIを使用）
 */
export async function generateSimilarProblem(
  mistakeNote: MistakeNote,
  ai: any
): Promise<{ question: string; answer: string; explanation: string }> {
  const prompt = `
以下の間違えた問題を元に、類似した練習問題を1問生成してください。

【元の問題】
${mistakeNote.original_question}

【正解】
${mistakeNote.correct_answer}

【教科】${mistakeNote.subject}
【単元】${mistakeNote.unit_name || '指定なし'}
【難易度】${mistakeNote.difficulty || 'medium'}

類似問題を生成し、以下のJSON形式で返してください：
{
  "question": "問題文",
  "answer": "正解",
  "explanation": "解説"
}
`;

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 500
    });

    const result = JSON.parse(response.response);
    return result;
  } catch (error) {
    // フォールバック: テンプレートベースで生成
    return {
      question: mistakeNote.original_question + ' (類似問題)',
      answer: mistakeNote.correct_answer,
      explanation: '元の問題の類似問題です。'
    };
  }
}
