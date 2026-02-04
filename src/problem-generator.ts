/**
 * AI Problem Generator - 自動問題生成システム
 * Workers AI + ルールベースアルゴリズム
 */

import type { Context } from 'hono'

// ========================================
// 型定義
// ========================================

export interface ProblemGenerationRequest {
  studentId: number
  subject: string
  unitName?: string
  difficulty: 'easy' | 'medium' | 'hard'
  count: number
  problemType?: string
}

export interface GeneratedProblem {
  problemId?: number
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  subject: string
  unitName: string
  problemType: string
  hints?: string[]
  metadata?: any
}

export interface StudentPerformance {
  studentId: number
  subject: string
  unitName: string
  totalAttempts: number
  correctAttempts: number
  averageScore: number
  weakPoints: string[]
  recommendedDifficulty: 'easy' | 'medium' | 'hard'
}

// ========================================
// 難易度レベル定義
// ========================================

export const DIFFICULTY_LEVELS = {
  easy: {
    label: '基礎',
    description: '基本的な問題',
    scoreRange: [0, 60],
    color: 'green'
  },
  medium: {
    label: '標準',
    description: '応用問題',
    scoreRange: [60, 80],
    color: 'blue'
  },
  hard: {
    label: '発展',
    description: '難問・チャレンジ',
    scoreRange: [80, 100],
    color: 'purple'
  }
}

// ========================================
// 問題タイプ定義
// ========================================

export const PROBLEM_TYPES = {
  // 数学
  calculation: { label: '計算問題', subjects: ['数学'] },
  word_problem: { label: '文章題', subjects: ['数学'] },
  geometry: { label: '図形問題', subjects: ['数学'] },
  
  // 国語
  kanji_reading: { label: '漢字読み', subjects: ['国語'] },
  kanji_writing: { label: '漢字書き', subjects: ['国語'] },
  grammar: { label: '文法', subjects: ['国語'] },
  comprehension: { label: '読解', subjects: ['国語'] },
  
  // 理科
  observation: { label: '観察問題', subjects: ['理科'] },
  experiment: { label: '実験問題', subjects: ['理科'] },
  classification: { label: '分類問題', subjects: ['理科'] },
  
  // 社会
  history: { label: '歴史問題', subjects: ['社会'] },
  geography: { label: '地理問題', subjects: ['社会'] },
  civics: { label: '公民問題', subjects: ['社会'] },
  
  // 英語
  vocabulary: { label: '単語', subjects: ['英語'] },
  listening: { label: 'リスニング', subjects: ['英語'] },
  grammar_en: { label: '文法', subjects: ['英語'] }
}

// ========================================
// ルールベース問題生成
// ========================================

export class RuleBasedProblemGenerator {
  /**
   * 数学問題生成
   */
  generateMathProblem(difficulty: string, unitName?: string): GeneratedProblem {
    const problems = {
      easy: [
        {
          type: 'calculation',
          generator: () => {
            const a = Math.floor(Math.random() * 10) + 1
            const b = Math.floor(Math.random() * 10) + 1
            const operators = ['+', '-']
            const op = operators[Math.floor(Math.random() * operators.length)]
            
            let answer: number
            let question: string
            
            if (op === '+') {
              answer = a + b
              question = `${a} + ${b} = ?`
            } else {
              if (a < b) {
                answer = b - a
                question = `${b} - ${a} = ?`
              } else {
                answer = a - b
                question = `${a} - ${b} = ?`
              }
            }
            
            return {
              question,
              correctAnswer: answer.toString(),
              explanation: `計算の手順：\n1. 問題を読む\n2. ${op === '+' ? '足し算' : '引き算'}を行う\n3. 答え: ${answer}`,
              hints: [
                '数を数えながら計算しましょう',
                '指を使っても大丈夫です！',
                'ゆっくり一つずつ進めましょう'
              ]
            }
          }
        },
        {
          type: 'word_problem',
          generator: () => {
            const items = ['りんご', 'みかん', 'えんぴつ', 'ノート', 'あめ']
            const item = items[Math.floor(Math.random() * items.length)]
            const a = Math.floor(Math.random() * 10) + 1
            const b = Math.floor(Math.random() * 10) + 1
            const total = a + b
            
            return {
              question: `${item}が ${a}個あります。さらに ${b}個もらいました。全部で何個ありますか？`,
              correctAnswer: total.toString(),
              explanation: `解き方：\n1. 最初にあった数: ${a}個\n2. もらった数: ${b}個\n3. 全部で: ${a} + ${b} = ${total}個`,
              hints: [
                '「全部で」は足し算を使います',
                '最初の数ともらった数を足しましょう',
                `${a} + ${b} を計算してみましょう`
              ]
            }
          }
        }
      ],
      medium: [
        {
          type: 'calculation',
          generator: () => {
            const a = Math.floor(Math.random() * 50) + 10
            const b = Math.floor(Math.random() * 50) + 10
            const operators = ['+', '-', '×']
            const op = operators[Math.floor(Math.random() * operators.length)]
            
            let answer: number
            let question: string
            
            if (op === '+') {
              answer = a + b
              question = `${a} + ${b} = ?`
            } else if (op === '-') {
              if (a > b) {
                answer = a - b
                question = `${a} - ${b} = ?`
              } else {
                answer = b - a
                question = `${b} - ${a} = ?`
              }
            } else {
              const small_a = Math.floor(Math.random() * 10) + 2
              const small_b = Math.floor(Math.random() * 10) + 2
              answer = small_a * small_b
              question = `${small_a} × ${small_b} = ?`
            }
            
            return {
              question,
              correctAnswer: answer.toString(),
              explanation: `計算手順：\n${op === '×' ? '九九を使って計算します' : '筆算で丁寧に計算しましょう'}\n答え: ${answer}`,
              hints: [
                '筆算を使って計算してみましょう',
                '位をそろえて書きましょう',
                '検算で確かめましょう'
              ]
            }
          }
        }
      ],
      hard: [
        {
          type: 'word_problem',
          generator: () => {
            const a = Math.floor(Math.random() * 50) + 20
            const b = Math.floor(Math.random() * 20) + 5
            const c = Math.floor(Math.random() * 10) + 5
            const answer = a + b - c
            
            return {
              question: `ある店で、午前中に ${a}個の商品が売れました。午後には ${b}個売れましたが、${c}個返品されました。この日に売れた商品は全部で何個ですか？`,
              correctAnswer: answer.toString(),
              explanation: `解き方：\n1. 午前中: ${a}個\n2. 午後: ${b}個（売れた）\n3. 返品: ${c}個（減る）\n4. 計算: ${a} + ${b} - ${c} = ${answer}個`,
              hints: [
                '「返品」は引き算を使います',
                '順番に計算していきましょう',
                '式を立ててから計算しましょう'
              ]
            }
          }
        }
      ]
    }
    
    const difficultyProblems = problems[difficulty as keyof typeof problems]
    const selected = difficultyProblems[Math.floor(Math.random() * difficultyProblems.length)]
    const generated = selected.generator()
    
    return {
      ...generated,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      subject: '数学',
      unitName: unitName || '計算',
      problemType: selected.type
    }
  }

  /**
   * 国語問題生成
   */
  generateJapaneseProblem(difficulty: string, unitName?: string): GeneratedProblem {
    const kanjiProblems = {
      easy: [
        {
          kanji: '山',
          reading: 'やま',
          meaning: '高い土地',
          sentence: '高い（　）に登りました。'
        },
        {
          kanji: '川',
          reading: 'かわ',
          meaning: '水が流れる場所',
          sentence: '（　）で魚を見ました。'
        },
        {
          kanji: '空',
          reading: 'そら',
          meaning: '上の方',
          sentence: '青い（　）を見上げた。'
        }
      ],
      medium: [
        {
          kanji: '勉強',
          reading: 'べんきょう',
          meaning: '学ぶこと',
          sentence: '毎日（　）をがんばる。'
        },
        {
          kanji: '友達',
          reading: 'ともだち',
          meaning: '仲の良い人',
          sentence: '（　）と遊びました。'
        }
      ],
      hard: [
        {
          kanji: '困難',
          reading: 'こんなん',
          meaning: '難しい状況',
          sentence: '（　）を乗り越える。'
        }
      ]
    }
    
    const difficultyKanji = kanjiProblems[difficulty as keyof typeof kanjiProblems]
    const selected = difficultyKanji[Math.floor(Math.random() * difficultyKanji.length)]
    
    return {
      question: `次の文の（　）に入る漢字を答えなさい。\n\n${selected.sentence}`,
      correctAnswer: selected.kanji,
      explanation: `答え: ${selected.kanji}（${selected.reading}）\n意味: ${selected.meaning}\n\n覚え方のポイント：\n・読み方を何度も声に出して覚えましょう\n・実際に書いて練習しましょう`,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      subject: '国語',
      unitName: unitName || '漢字',
      problemType: 'kanji_writing',
      hints: [
        `読み方: ${selected.reading}`,
        `意味: ${selected.meaning}`,
        '何度も書いて覚えましょう'
      ]
    }
  }

  /**
   * 理科問題生成
   */
  generateScienceProblem(difficulty: string, unitName?: string): GeneratedProblem {
    const problems = {
      easy: [
        {
          question: '植物が育つために必要なものを3つ答えなさい。',
          answer: '水、日光、空気（または土）',
          explanation: '植物は、水・日光・空気（二酸化炭素）を使って成長します。土も栄養を与えるために大切です。',
          hints: ['植物に何をあげますか？', '太陽の光は必要ですか？', '呼吸に必要なものは？']
        }
      ],
      medium: [
        {
          question: '水は何度で沸騰しますか？',
          answer: '100度',
          explanation: '水は100℃（セ氏100度）で沸騰して、水蒸気になります。',
          hints: ['お湯が沸く温度です', '3桁の数字です', '100に関係があります']
        }
      ],
      hard: [
        {
          question: '光合成で植物が作り出すものは何ですか？また、そのとき使うものは何ですか？',
          answer: '作り出すもの：でんぷん（養分）と酸素、使うもの：二酸化炭素と水',
          explanation: '植物は光合成で、二酸化炭素と水を使って、でんぷん（養分）と酸素を作ります。これが植物の成長につながります。',
          hints: ['植物の葉で起こることです', '酸素が関係します', '二酸化炭素を使います']
        }
      ]
    }
    
    const difficultyProblems = problems[difficulty as keyof typeof problems]
    const selected = difficultyProblems[Math.floor(Math.random() * difficultyProblems.length)]
    
    return {
      question: selected.question,
      correctAnswer: selected.answer,
      explanation: selected.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      subject: '理科',
      unitName: unitName || '自然',
      problemType: 'observation',
      hints: selected.hints
    }
  }

  /**
   * 社会問題生成
   */
  generateSocialStudiesProblem(difficulty: string, unitName?: string): GeneratedProblem {
    const problems = {
      easy: [
        {
          question: '日本の首都はどこですか？',
          options: ['東京', '大阪', '京都', '名古屋'],
          answer: '東京',
          explanation: '日本の首都は東京です。国会議事堂や皇居があります。'
        }
      ],
      medium: [
        {
          question: '米作りが盛んな地域の特徴として正しいものはどれですか？',
          options: ['広い平野がある', '山が多い', '海に囲まれている', '雨が少ない'],
          answer: '広い平野がある',
          explanation: '米作りには、広い平野と豊富な水が必要です。日本では新潟平野や秋田平野などが有名です。'
        }
      ],
      hard: [
        {
          question: '明治時代に起こった大きな変化を3つ答えなさい。',
          answer: '廃藩置県、学制発布、鉄道開通（その他：文明開化、富国強兵など）',
          explanation: '明治時代は、日本が近代国家になった時代です。藩をなくして県にしたり、学校制度を作ったり、鉄道が通ったりしました。'
        }
      ]
    }
    
    const difficultyProblems = problems[difficulty as keyof typeof problems]
    const selected = difficultyProblems[Math.floor(Math.random() * difficultyProblems.length)]
    
    return {
      question: selected.question,
      options: selected.options,
      correctAnswer: selected.answer,
      explanation: selected.explanation,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      subject: '社会',
      unitName: unitName || '地理',
      problemType: selected.options ? 'multiple_choice' : 'short_answer',
      hints: [
        '教科書を見直してみましょう',
        '地図や年表を確認しましょう',
        'キーワードを思い出しましょう'
      ]
    }
  }

  /**
   * 教科に応じた問題生成
   */
  generate(subject: string, difficulty: string, unitName?: string): GeneratedProblem {
    switch (subject) {
      case '数学':
        return this.generateMathProblem(difficulty, unitName)
      case '国語':
        return this.generateJapaneseProblem(difficulty, unitName)
      case '理科':
        return this.generateScienceProblem(difficulty, unitName)
      case '社会':
        return this.generateSocialStudiesProblem(difficulty, unitName)
      default:
        return this.generateMathProblem(difficulty, unitName)
    }
  }
}

// ========================================
// Workers AI問題生成
// ========================================

export class AIBasedProblemGenerator {
  /**
   * Workers AIを使った問題生成
   */
  async generateWithAI(
    ai: any,
    request: ProblemGenerationRequest,
    performance?: StudentPerformance
  ): Promise<GeneratedProblem | null> {
    try {
      const prompt = this.buildPrompt(request, performance)
      
      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'あなたは小学生向けの教育問題を作成する専門家です。適切な難易度で、学習効果の高い問題を生成してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.8
      })
      
      if (!response.response) {
        return null
      }
      
      return this.parseAIResponse(response.response, request)
    } catch (error) {
      console.error('❌ AI問題生成エラー:', error)
      return null
    }
  }

  /**
   * プロンプト構築
   */
  private buildPrompt(
    request: ProblemGenerationRequest,
    performance?: StudentPerformance
  ): string {
    let prompt = `以下の条件で小学生向けの学習問題を1問作成してください。

【条件】
- 教科: ${request.subject}
- 単元: ${request.unitName || '指定なし'}
- 難易度: ${DIFFICULTY_LEVELS[request.difficulty].label}
- 問題タイプ: ${request.problemType || '自由'}

`
    
    if (performance) {
      prompt += `【学習者の状況】
- 正答率: ${Math.round(performance.averageScore)}%
- 苦手分野: ${performance.weakPoints.join('、')}
- これらの弱点を克服できる問題を作成してください。

`
    }
    
    prompt += `【出力形式】（必ずこの形式で出力してください）
問題: [問題文]
選択肢: [選択肢がある場合のみ、A. B. C. D. の形式で]
正解: [正解の答え]
解説: [詳しい解説]
ヒント1: [最初のヒント]
ヒント2: [2番目のヒント]
ヒント3: [3番目のヒント]

それでは問題を作成してください。`
    
    return prompt
  }

  /**
   * AI応答のパース
   */
  private parseAIResponse(
    response: string,
    request: ProblemGenerationRequest
  ): GeneratedProblem | null {
    try {
      const lines = response.split('\n').filter(line => line.trim())
      
      const problem: Partial<GeneratedProblem> = {
        difficulty: request.difficulty,
        subject: request.subject,
        unitName: request.unitName || '一般',
        problemType: request.problemType || 'general'
      }
      
      let currentSection = ''
      let hints: string[] = []
      
      for (const line of lines) {
        if (line.startsWith('問題:')) {
          problem.question = line.replace('問題:', '').trim()
          currentSection = 'question'
        } else if (line.startsWith('選択肢:')) {
          currentSection = 'options'
        } else if (line.startsWith('正解:')) {
          problem.correctAnswer = line.replace('正解:', '').trim()
          currentSection = 'answer'
        } else if (line.startsWith('解説:')) {
          problem.explanation = line.replace('解説:', '').trim()
          currentSection = 'explanation'
        } else if (line.startsWith('ヒント')) {
          hints.push(line.replace(/ヒント[0-9]:/, '').trim())
        } else if (currentSection === 'explanation' && line.trim()) {
          problem.explanation += '\n' + line.trim()
        }
      }
      
      if (hints.length > 0) {
        problem.hints = hints
      }
      
      if (!problem.question || !problem.correctAnswer || !problem.explanation) {
        return null
      }
      
      return problem as GeneratedProblem
    } catch (error) {
      console.error('❌ AI応答パースエラー:', error)
      return null
    }
  }
}

// ========================================
// 学習履歴分析エンジン
// ========================================

export class LearningHistoryAnalyzer {
  /**
   * 学生のパフォーマンス分析
   */
  async analyzePerformance(
    db: D1Database,
    studentId: number,
    subject: string
  ): Promise<StudentPerformance> {
    try {
      // 学習履歴取得（テーブルが存在しない場合もエラーを抑制）
      let history: any
      try {
        history = await db.prepare(`
          SELECT 
            lc.subject,
            lc.unit_name,
            sp.status,
            sp.mastery_score,
            sp.attempt_count,
            sp.correct_count
          FROM student_progress sp
          JOIN learning_cards lc ON sp.card_id = lc.card_id
          WHERE sp.student_id = ? AND lc.subject = ?
        `).bind(studentId, subject).all()
      } catch (dbError) {
        console.warn('⚠️ 学習履歴テーブルが見つかりません。デフォルト設定を使用します。')
        history = { results: [] }
      }
      
      if (history.results.length === 0) {
        return {
          studentId,
          subject,
          unitName: '',
          totalAttempts: 0,
          correctAttempts: 0,
          averageScore: 0,
          weakPoints: [],
          recommendedDifficulty: 'easy'
        }
      }
      
      // 統計計算
      let totalAttempts = 0
      let correctAttempts = 0
      const unitScores: Record<string, { total: number, correct: number }> = {}
      
      for (const record of history.results as any[]) {
        totalAttempts += record.attempt_count
        correctAttempts += record.correct_count
        
        const unit = record.unit_name
        if (!unitScores[unit]) {
          unitScores[unit] = { total: 0, correct: 0 }
        }
        unitScores[unit].total += record.attempt_count
        unitScores[unit].correct += record.correct_count
      }
      
      const averageScore = totalAttempts > 0 
        ? (correctAttempts / totalAttempts) * 100 
        : 0
      
      // 苦手分野の特定（正答率50%未満）
      const weakPoints = Object.entries(unitScores)
        .filter(([_, scores]) => {
          const rate = scores.total > 0 ? (scores.correct / scores.total) * 100 : 0
          return rate < 50
        })
        .map(([unit, _]) => unit)
      
      // 推奨難易度の決定
      let recommendedDifficulty: 'easy' | 'medium' | 'hard' = 'easy'
      if (averageScore >= 80) {
        recommendedDifficulty = 'hard'
      } else if (averageScore >= 60) {
        recommendedDifficulty = 'medium'
      }
      
      return {
        studentId,
        subject,
        unitName: '',
        totalAttempts,
        correctAttempts,
        averageScore,
        weakPoints,
        recommendedDifficulty
      }
    } catch (error) {
      console.error('❌ パフォーマンス分析エラー:', error)
      return {
        studentId,
        subject,
        unitName: '',
        totalAttempts: 0,
        correctAttempts: 0,
        averageScore: 0,
        weakPoints: [],
        recommendedDifficulty: 'easy'
      }
    }
  }
}

// ========================================
// 統合問題生成エンジン
// ========================================

export class ProblemGeneratorEngine {
  private ruleBasedGenerator: RuleBasedProblemGenerator
  private aiGenerator: AIBasedProblemGenerator
  private historyAnalyzer: LearningHistoryAnalyzer

  constructor() {
    this.ruleBasedGenerator = new RuleBasedProblemGenerator()
    this.aiGenerator = new AIBasedProblemGenerator()
    this.historyAnalyzer = new LearningHistoryAnalyzer()
  }

  /**
   * 問題生成（AI + ルールベース）
   */
  async generateProblems(
    request: ProblemGenerationRequest,
    db: D1Database,
    ai?: any
  ): Promise<GeneratedProblem[]> {
    const problems: GeneratedProblem[] = []
    
    // 学習履歴分析（エラーが発生してもデフォルト値を使用）
    let performance: StudentPerformance
    try {
      performance = await this.historyAnalyzer.analyzePerformance(
        db,
        request.studentId,
        request.subject
      )
    } catch (error) {
      console.warn('⚠️ 学習履歴分析エラー。デフォルト設定を使用します:', error)
      performance = {
        studentId: request.studentId,
        subject: request.subject,
        unitName: '',
        totalAttempts: 0,
        correctAttempts: 0,
        averageScore: 0,
        weakPoints: [],
        recommendedDifficulty: 'easy'
      }
    }
    
    // 難易度の自動調整
    if (!request.difficulty) {
      request.difficulty = performance.recommendedDifficulty
    }
    
    for (let i = 0; i < request.count; i++) {
      let problem: GeneratedProblem | null = null
      
      // 1. AI生成を試行（30%の確率）
      if (ai && Math.random() < 0.3) {
        try {
          problem = await this.aiGenerator.generateWithAI(ai, request, performance)
        } catch (error) {
          console.warn('⚠️ AI生成失敗。ルールベースにフォールバック:', error)
        }
      }
      
      // 2. ルールベース生成（フォールバック）
      if (!problem) {
        try {
          problem = this.ruleBasedGenerator.generate(
            request.subject,
            request.difficulty,
            request.unitName
          )
        } catch (error) {
          console.error('❌ ルールベース生成エラー:', error)
        }
      }
      
      if (problem) {
        problems.push(problem)
      }
    }
    
    return problems
  }

  /**
   * 学習履歴分析
   */
  async analyzeStudentPerformance(
    db: D1Database,
    studentId: number,
    subject: string
  ): Promise<StudentPerformance> {
    return await this.historyAnalyzer.analyzePerformance(db, studentId, subject)
  }
}
