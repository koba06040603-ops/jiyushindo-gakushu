/**
 * Phase 12-4: AIフィードバックシステム
 * AI自動添削・詳細解説・学習改善提案
 */

import { D1Database } from '@cloudflare/workers-types'

/**
 * 簡易インターフェース（API用）
 */
export interface SimpleFeedbackResult {
  isCorrect: boolean
  score: number
  feedback: string
  hints?: string[]
}

export interface SimpleExplanationResult {
  correctAnswer: string
  explanation: string
  commonMistakes?: string
  hints?: string[]
}

export interface SimpleAdviceResult {
  generalAdvice: string
  specificAdvice: string[]
  encouragement: string
}

export interface SimpleReportResult {
  summary: string
  achievements: string[]
  improvements?: string[]
  nextSteps?: string[]
  trends?: string[]
  longTermGoals?: string[]
}

/**
 * AI自動添削エンジン（簡易版）
 */
export async function gradeAnswer(
  env: any,
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  subject: string,
  difficulty: string
): Promise<SimpleFeedbackResult> {
  const request: FeedbackRequest = {
    student_id: 0,
    problem_id: '',
    student_answer: studentAnswer,
    correct_answer: correctAnswer,
    problem_text: question,
    subject,
    difficulty,
  }

  try {
    const result = await generateFeedback(env.AI, request)
    return {
      isCorrect: result.is_correct,
      score: result.score,
      feedback: result.feedback_text,
      hints: result.suggestions,
    }
  } catch (error) {
    console.error('❌ AI添削エラー:', error)
    const fallback = generateRuleBasedFeedback(request)
    return {
      isCorrect: fallback.is_correct,
      score: fallback.score,
      feedback: fallback.feedback_text,
      hints: fallback.suggestions,
    }
  }
}

/**
 * AI自動添削エンジン
 */

export interface FeedbackRequest {
  student_id: number
  problem_id: string
  student_answer: string
  correct_answer: string
  problem_text: string
  subject: string
  difficulty: string
}

export interface FeedbackResult {
  is_correct: boolean
  score: number // 0-100
  feedback_text: string
  suggestions: string[]
  explanation: string
  common_mistakes: string[]
  related_concepts: string[]
  next_steps: string[]
}

/**
 * Workers AIを使用した自動添削
 */
export async function generateFeedback(
  ai: any,
  request: FeedbackRequest
): Promise<FeedbackResult> {
  const prompt = `あなたは小学生向けの優しい先生です。以下の解答を添削してください。

【問題】
${request.problem_text}

【正解】
${request.correct_answer}

【生徒の解答】
${request.student_answer}

【教科】${request.subject}
【難易度】${request.difficulty}

以下の形式でJSON形式で回答してください：
{
  "is_correct": true/false,
  "score": 0-100の点数,
  "feedback_text": "励ましの言葉と具体的なフィードバック（200字以内）",
  "suggestions": ["改善提案1", "改善提案2", "改善提案3"],
  "explanation": "詳しい解説（300字以内）",
  "common_mistakes": ["よくある間違い1", "よくある間違い2"],
  "related_concepts": ["関連する概念1", "関連する概念2"],
  "next_steps": ["次にやるべきこと1", "次にやるべきこと2"]
}

フィードバックは小学生にも分かりやすく、前向きな言葉で書いてください。`

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: 1000,
    })

    // JSONを抽出
    const jsonMatch = response.response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response is not valid JSON')
    }

    const result: FeedbackResult = JSON.parse(jsonMatch[0])
    return result
  } catch (error) {
    console.error('AI添削エラー:', error)

    // フォールバック: ルールベースの簡易添削
    return generateRuleBasedFeedback(request)
  }
}

/**
 * ルールベースの簡易添削（フォールバック）
 */
function generateRuleBasedFeedback(request: FeedbackRequest): FeedbackResult {
  const studentAnswer = request.student_answer.trim().toLowerCase()
  const correctAnswer = request.correct_answer.trim().toLowerCase()

  const isExactMatch = studentAnswer === correctAnswer
  const isSimilar = calculateSimilarity(studentAnswer, correctAnswer) > 0.7

  const isCorrect = isExactMatch || isSimilar
  const score = isCorrect ? 100 : calculateSimilarity(studentAnswer, correctAnswer) * 100

  return {
    is_correct: isCorrect,
    score: Math.round(score),
    feedback_text: isCorrect
      ? '正解です！よくできました 🎉'
      : '惜しい！もう一度考えてみましょう。',
    suggestions: isCorrect
      ? ['次のレベルの問題に挑戦しましょう！']
      : ['もう一度問題文を読んでみましょう', '教科書の該当ページを確認してみましょう'],
    explanation: `正解は「${request.correct_answer}」です。`,
    common_mistakes: [],
    related_concepts: [],
    next_steps: isCorrect ? ['類似問題を解く', '応用問題に挑戦'] : ['基礎を復習', '例題を確認'],
  }
}

/**
 * 文字列の類似度計算（Levenshtein距離ベース）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0

  const matrix: number[][] = []

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)
  return 1 - distance / maxLen
}

/**
 * 学習改善提案生成
 */
export interface LearningAnalysis {
  student_id: number
  weak_subjects: string[]
  weak_units: string[]
  strong_subjects: string[]
  average_score: number
  total_problems: number
  correct_problems: number
  study_time_minutes: number
}

export interface ImprovementSuggestions {
  priority_actions: string[]
  study_plan: {
    subject: string
    unit: string
    recommended_problems: number
    estimated_time: string
  }[]
  motivational_message: string
  next_milestone: string
}

export async function generateImprovementSuggestions(
  ai: any,
  analysis: LearningAnalysis
): Promise<ImprovementSuggestions> {
  const prompt = `あなたは経験豊富な学習コーチです。以下の学習データから改善提案をしてください。

【学習データ】
- 正答率: ${Math.round((analysis.correct_problems / analysis.total_problems) * 100)}%
- 総問題数: ${analysis.total_problems}問
- 苦手教科: ${analysis.weak_subjects.join('、')}
- 苦手単元: ${analysis.weak_units.join('、')}
- 得意教科: ${analysis.strong_subjects.join('、')}
- 学習時間: ${analysis.study_time_minutes}分

以下の形式でJSON形式で回答してください：
{
  "priority_actions": ["最優先でやるべきこと1", "最優先でやるべきこと2", "最優先でやるべきこと3"],
  "study_plan": [
    {
      "subject": "教科名",
      "unit": "単元名",
      "recommended_problems": 推奨問題数,
      "estimated_time": "推定時間"
    }
  ],
  "motivational_message": "励ましのメッセージ（100字以内）",
  "next_milestone": "次の目標"
}

前向きで具体的な提案をしてください。`

  try {
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: 800,
    })

    const jsonMatch = response.response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response is not valid JSON')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('改善提案生成エラー:', error)

    // フォールバック
    return generateRuleBasedSuggestions(analysis)
  }
}

/**
 * ルールベースの改善提案（フォールバック）
 */
function generateRuleBasedSuggestions(analysis: LearningAnalysis): ImprovementSuggestions {
  const accuracy = (analysis.correct_problems / analysis.total_problems) * 100

  return {
    priority_actions:
      accuracy < 60
        ? ['基礎の復習を重点的に行いましょう', '苦手単元を特定しましょう', '毎日30分の学習習慣をつけましょう']
        : ['応用問題に挑戦しましょう', '学習範囲を広げましょう', '定期的な復習を続けましょう'],
    study_plan: analysis.weak_subjects.slice(0, 2).map((subject) => ({
      subject: subject,
      unit: analysis.weak_units[0] || '基礎',
      recommended_problems: accuracy < 60 ? 10 : 15,
      estimated_time: accuracy < 60 ? '30分' : '45分',
    })),
    motivational_message:
      accuracy >= 80
        ? '素晴らしい成績です！この調子で頑張りましょう 🎉'
        : accuracy >= 60
        ? 'よく頑張っています！もう一息です 💪'
        : '一歩ずつ着実に進んでいます。焦らず続けましょう 🌟',
    next_milestone:
      accuracy >= 80 ? '全単元90%以上の正答率を目指す' : accuracy >= 60 ? '正答率80%を目指す' : '正答率70%を目指す',
  }
}

/**
 * 進捗レポート生成
 */
export interface ProgressReport {
  period: 'weekly' | 'monthly'
  start_date: string
  end_date: string
  student_id: number
  summary: {
    total_study_time: number
    total_problems: number
    correct_rate: number
    improvement_rate: number // 前期比
  }
  subject_breakdown: {
    subject: string
    problems: number
    correct_rate: number
    time_spent: number
  }[]
  achievements: string[]
  challenges: string[]
  recommendations: string[]
}

export async function generateProgressReport(
  db: D1Database,
  studentId: number,
  period: 'weekly' | 'monthly'
): Promise<ProgressReport> {
  const now = new Date()
  const daysBack = period === 'weekly' ? 7 : 30

  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const endDate = now

  // 学習履歴を取得
  const history = await db
    .prepare(
      `SELECT 
        subject,
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        SUM(time_spent) as time_spent
       FROM problem_attempts
       WHERE student_id = ? AND attempted_at BETWEEN ? AND ?
       GROUP BY subject`
    )
    .bind(studentId, startDate.toISOString(), endDate.toISOString())
    .all()

  const subjects = history.results || []

  const totalProblems = subjects.reduce((sum: number, s: any) => sum + s.total, 0)
  const totalCorrect = subjects.reduce((sum: number, s: any) => sum + s.correct, 0)
  const totalTime = subjects.reduce((sum: number, s: any) => sum + s.time_spent, 0)

  const correctRate = totalProblems > 0 ? (totalCorrect / totalProblems) * 100 : 0

  return {
    period,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    student_id: studentId,
    summary: {
      total_study_time: Math.round(totalTime),
      total_problems: totalProblems,
      correct_rate: Math.round(correctRate),
      improvement_rate: 0, // TODO: 前期比計算
    },
    subject_breakdown: subjects.map((s: any) => ({
      subject: s.subject,
      problems: s.total,
      correct_rate: Math.round((s.correct / s.total) * 100),
      time_spent: s.time_spent,
    })),
    achievements: generateAchievements(totalProblems, correctRate),
    challenges: generateChallenges(subjects),
    recommendations: generateRecommendations(correctRate),
  }
}

function generateAchievements(totalProblems: number, correctRate: number): string[] {
  const achievements = []

  if (totalProblems >= 100) achievements.push('100問以上解きました！')
  if (totalProblems >= 50) achievements.push('50問以上解きました！')
  if (correctRate >= 90) achievements.push('正答率90%以上達成！')
  if (correctRate >= 80) achievements.push('正答率80%以上達成！')

  return achievements.length > 0 ? achievements : ['学習を続けています！']
}

function generateChallenges(subjects: any[]): string[] {
  const weakSubjects = subjects
    .filter((s: any) => s.total > 0 && s.correct / s.total < 0.6)
    .map((s: any) => s.subject)

  return weakSubjects.length > 0 ? weakSubjects.map((s) => `${s}の強化が必要です`) : ['バランスよく学習できています']
}

function generateRecommendations(correctRate: number): string[] {
  if (correctRate >= 90) {
    return ['応用問題に挑戦しましょう', '得意分野を伸ばしましょう']
  } else if (correctRate >= 70) {
    return ['基礎を固めつつ応用に進みましょう', '苦手分野を重点的に復習しましょう']
  } else {
    return ['基礎問題を繰り返し練習しましょう', '分からない箇所はAIチューターに質問しましょう']
  }
}

/**
 * フィードバック履歴を保存
 */
export async function saveFeedback(
  db: D1Database,
  studentId: number,
  problemId: string,
  feedback: FeedbackResult
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ai_feedback_history 
       (student_id, problem_id, is_correct, score, feedback_text, 
        suggestions, explanation, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      studentId,
      problemId,
      feedback.is_correct ? 1 : 0,
      feedback.score,
      feedback.feedback_text,
      JSON.stringify(feedback.suggestions),
      feedback.explanation,
      new Date().toISOString()
    )
    .run()
}

/**
 * ========================================
 * 簡易APIラッパー関数
 * ========================================
 */

/**
 * 詳細解説を生成
 */
export async function generateDetailedExplanation(
  env: any,
  question: string,
  correctAnswer: string,
  studentAnswer: string | undefined,
  subject: string,
  difficulty: string
): Promise<SimpleExplanationResult> {
  const prompt = `あなたは優しい先生です。以下の問題について詳しく解説してください。

【問題】
${question}

【正解】
${correctAnswer}

${studentAnswer ? `【生徒の解答】\n${studentAnswer}\n` : ''}

【教科】${subject}
【難易度】${difficulty}

以下の形式でJSON形式で回答してください：
{
  "correctAnswer": "正しい答え",
  "explanation": "詳しい解説（300字以内）",
  "commonMistakes": "よくある間違いの説明",
  "hints": ["ヒント1", "ヒント2", "ヒント3"]
}

小学生にも分かりやすく説明してください。`

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: 800,
    })

    const jsonMatch = response.response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response is not valid JSON')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('❌ 解説生成エラー:', error)
    return {
      correctAnswer,
      explanation: `正解は「${correctAnswer}」です。この問題では、${subject}の知識を使います。`,
      commonMistakes: '問題文を注意深く読むことが大切です。',
      hints: ['問題文をもう一度読んでみましょう', '教科書の該当ページを確認しましょう', '例題を参考にしてみましょう'],
    }
  }
}

/**
 * 学習改善提案を生成
 */
export async function generateLearningAdvice(
  env: any,
  recentHistory: any[]
): Promise<SimpleAdviceResult> {
  // 統計を計算
  const totalProblems = recentHistory.length
  const correctProblems = recentHistory.filter((h: any) => h.is_correct === 1).length
  const correctRate = totalProblems > 0 ? (correctProblems / totalProblems) * 100 : 0

  // 教科別の成績
  const subjectStats: { [key: string]: { total: number; correct: number } } = {}
  recentHistory.forEach((h: any) => {
    if (!subjectStats[h.subject]) {
      subjectStats[h.subject] = { total: 0, correct: 0 }
    }
    subjectStats[h.subject].total++
    if (h.is_correct === 1) {
      subjectStats[h.subject].correct++
    }
  })

  // 苦手教科を特定
  const weakSubjects = Object.entries(subjectStats)
    .filter(([_, stats]) => stats.total > 0 && (stats.correct / stats.total) < 0.6)
    .map(([subject, _]) => subject)

  const prompt = `あなたは学習コーチです。以下の学習データからアドバイスをしてください。

【学習データ】
- 総問題数: ${totalProblems}問
- 正答率: ${correctRate.toFixed(1)}%
- 苦手教科: ${weakSubjects.length > 0 ? weakSubjects.join('、') : 'なし'}

以下の形式でJSON形式で回答してください：
{
  "generalAdvice": "全般的なアドバイス（100字以内）",
  "specificAdvice": ["具体的なアドバイス1", "具体的なアドバイス2", "具体的なアドバイス3"],
  "encouragement": "励ましの言葉（50字以内）"
}

前向きで具体的なアドバイスをしてください。`

  try {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: prompt,
      max_tokens: 500,
    })

    const jsonMatch = response.response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response is not valid JSON')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('❌ アドバイス生成エラー:', error)
    
    // フォールバック
    if (correctRate >= 80) {
      return {
        generalAdvice: '素晴らしい成績です！この調子で頑張りましょう。',
        specificAdvice: [
          '応用問題に挑戦してみましょう',
          '得意分野をさらに伸ばしましょう',
          '定期的な復習を続けましょう'
        ],
        encouragement: 'あなたの努力が実を結んでいます！🎉'
      }
    } else if (correctRate >= 60) {
      return {
        generalAdvice: 'よく頑張っています！もう一息です。',
        specificAdvice: [
          '基礎を固めつつ応用に進みましょう',
          weakSubjects.length > 0 ? `${weakSubjects[0]}を重点的に復習しましょう` : '苦手分野を特定しましょう',
          '毎日30分の学習習慣をつけましょう'
        ],
        encouragement: '着実に進歩しています！💪'
      }
    } else {
      return {
        generalAdvice: '焦らず一歩ずつ進んでいきましょう。',
        specificAdvice: [
          '基礎問題を繰り返し練習しましょう',
          '分からない箇所はAIチューターに質問しましょう',
          '教科書や参考書を見直しましょう'
        ],
        encouragement: '毎日少しずつ、確実に成長しています！🌟'
      }
    }
  }
}

/**
 * 週次レポートを生成
 */
export async function generateWeeklyReport(
  env: any,
  weekHistory: any[]
): Promise<SimpleReportResult> {
  const totalProblems = weekHistory.length
  const correctProblems = weekHistory.filter((h: any) => h.is_correct === 1).length
  const correctRate = totalProblems > 0 ? (correctProblems / totalProblems) * 100 : 0

  return {
    summary: `今週は${totalProblems}問解いて、正答率${correctRate.toFixed(1)}%でした。`,
    achievements: [
      totalProblems >= 50 ? '50問以上解きました！' : `${totalProblems}問解きました`,
      correctRate >= 80 ? '正答率80%以上達成！' : correctRate >= 60 ? '正答率60%以上達成' : '学習を継続しています'
    ],
    improvements: [
      correctRate >= 70 ? '応用問題にも挑戦しましょう' : '基礎を固めましょう',
      '毎日の学習習慣を続けましょう'
    ],
    nextSteps: [
      '来週は' + Math.max(totalProblems + 10, 50) + '問を目標にしましょう',
      correctRate >= 70 ? '正答率90%を目指しましょう' : '正答率80%を目指しましょう'
    ]
  }
}

/**
 * 月次レポートを生成
 */
export async function generateMonthlyReport(
  env: any,
  monthHistory: any[]
): Promise<SimpleReportResult> {
  const totalProblems = monthHistory.length
  const correctProblems = monthHistory.filter((h: any) => h.is_correct === 1).length
  const correctRate = totalProblems > 0 ? (correctProblems / totalProblems) * 100 : 0

  return {
    summary: `今月は${totalProblems}問解いて、正答率${correctRate.toFixed(1)}%でした。`,
    achievements: [
      totalProblems >= 200 ? '200問以上解きました！' : totalProblems >= 100 ? '100問以上解きました！' : `${totalProblems}問解きました`,
      correctRate >= 80 ? '高い正答率を維持しています' : '着実に学習を進めています'
    ],
    trends: [
      correctRate >= 70 ? '理解度が向上しています' : '基礎固めが進んでいます',
      '継続的な学習ができています'
    ],
    longTermGoals: [
      '来月は' + Math.max(totalProblems + 50, 200) + '問を目標にしましょう',
      correctRate >= 70 ? '全教科で正答率90%を目指しましょう' : '全教科で正答率80%を目指しましょう'
    ]
  }
}
