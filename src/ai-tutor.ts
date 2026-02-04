/**
 * AI Tutor Engine - 完全無料版
 * Cloudflare Workers AI + HuggingFace Inference API + ルールベースAI
 */

import type { Context } from 'hono'

// ========================================
// 型定義
// ========================================

export interface AITutorRequest {
  studentId: number
  question: string
  subject?: string
  unitName?: string
  context?: string
  conversationHistory?: ConversationMessage[]
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AITutorResponse {
  answer: string
  confidence: number
  source: 'workers-ai' | 'huggingface' | 'rule-based'
  suggestions?: string[]
  relatedConcepts?: string[]
  needsTeacherHelp?: boolean
}

export interface LearningContext {
  studentId: number
  recentTopics: string[]
  struggleAreas: string[]
  masteredConcepts: string[]
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic'
}

// ========================================
// Cloudflare Workers AI 統合
// ========================================

export class WorkersAIProvider {
  /**
   * Cloudflare Workers AI を使用してテキスト生成
   * @models @cf/meta/llama-3.1-8b-instruct (無料)
   */
  async generateResponse(
    ai: any,
    prompt: string,
    systemPrompt: string = 'あなたは優秀な教育AIアシスタントです。'
  ): Promise<string> {
    try {
      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7
      })
      
      return response.response || ''
    } catch (error) {
      console.error('❌ Workers AI エラー:', error)
      return ''
    }
  }

  /**
   * テキスト埋め込みベクトル生成（類似質問検索用）
   * @model @cf/baai/bge-base-en-v1.5 (無料)
   */
  async generateEmbedding(ai: any, text: string): Promise<number[]> {
    try {
      const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: text
      })
      
      return response.data[0] || []
    } catch (error) {
      console.error('❌ Embedding生成エラー:', error)
      return []
    }
  }

  /**
   * 感情分析（学生のストレス検知）
   * @model @cf/huggingface/distilbert-sst-2-int8 (無料)
   */
  async analyzeSentiment(ai: any, text: string): Promise<{
    label: string
    score: number
  }> {
    try {
      const response = await ai.run('@cf/huggingface/distilbert-sst-2-int8', {
        text: text
      })
      
      return response[0] || { label: 'NEUTRAL', score: 0.5 }
    } catch (error) {
      console.error('❌ 感情分析エラー:', error)
      return { label: 'NEUTRAL', score: 0.5 }
    }
  }
}

// ========================================
// HuggingFace Inference API 統合
// ========================================

export class HuggingFaceProvider {
  private apiKey: string | undefined

  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }

  /**
   * HuggingFace Inference API（無料枠: 月10万リクエスト）
   * @model meta-llama/Llama-3.2-3B-Instruct (無料)
   */
  async generateResponse(
    prompt: string,
    systemPrompt: string = 'あなたは優秀な教育AIアシスタントです。'
  ): Promise<string> {
    if (!this.apiKey) {
      return '' // APIキーなしの場合はスキップ
    }

    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`,
            parameters: {
              max_new_tokens: 512,
              temperature: 0.7,
              return_full_text: false
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`)
      }

      const data = await response.json()
      return data[0]?.generated_text || ''
    } catch (error) {
      console.error('❌ HuggingFace API エラー:', error)
      return ''
    }
  }

  /**
   * 日本語テキスト埋め込み
   * @model intfloat/multilingual-e5-small (無料)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      return []
    }

    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/intfloat/multilingual-e5-small',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: text
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ HuggingFace Embedding エラー:', error)
      return []
    }
  }
}

// ========================================
// ルールベースAIエンジン（パターンマッチング）
// ========================================

export class RuleBasedAI {
  /**
   * パターンマッチングによる質問応答
   */
  async generateResponse(
    question: string,
    subject?: string,
    context?: string
  ): Promise<string> {
    const lowerQuestion = question.toLowerCase()

    // 数学パターン
    if (subject === '数学' || lowerQuestion.includes('計算') || lowerQuestion.includes('式')) {
      return this.handleMathQuestion(question)
    }

    // 国語パターン
    if (subject === '国語' || lowerQuestion.includes('文法') || lowerQuestion.includes('漢字')) {
      return this.handleJapaneseQuestion(question)
    }

    // 理科パターン
    if (subject === '理科' || lowerQuestion.includes('実験') || lowerQuestion.includes('観察')) {
      return this.handleScienceQuestion(question)
    }

    // 社会パターン
    if (subject === '社会' || lowerQuestion.includes('歴史') || lowerQuestion.includes('地理')) {
      return this.handleSocialStudiesQuestion(question)
    }

    // 一般的な励まし
    return this.handleGeneralQuestion(question)
  }

  private handleMathQuestion(question: string): string {
    const patterns = [
      {
        pattern: /(\d+)\s*[+＋]\s*(\d+)/,
        response: (match: RegExpMatchArray) => {
          const a = parseInt(match[1])
          const b = parseInt(match[2])
          return `${a} + ${b} の計算ですね！\n\nステップ1: ${a}から数え始めます\nステップ2: ${b}を足していきます\n答え: ${a + b}\n\n頑張りました！👏`
        }
      },
      {
        pattern: /(\d+)\s*[-－]\s*(\d+)/,
        response: (match: RegExpMatchArray) => {
          const a = parseInt(match[1])
          const b = parseInt(match[2])
          return `${a} - ${b} の計算ですね！\n\nステップ1: ${a}から始めます\nステップ2: ${b}を引いていきます\n答え: ${a - b}\n\nよくできました！✨`
        }
      }
    ]

    for (const { pattern, response } of patterns) {
      const match = question.match(pattern)
      if (match) {
        return response(match)
      }
    }

    return '数学の問題ですね！具体的にどの部分で困っていますか？\n\n例えば：\n- 計算の手順\n- 公式の使い方\n- 文章問題の読み方\n\nもう少し詳しく教えてください！📚'
  }

  private handleJapaneseQuestion(question: string): string {
    if (question.includes('漢字')) {
      return '漢字の学習ですね！\n\nおすすめの覚え方：\n1. 部首を意識する\n2. 書き順を正しく覚える\n3. 熟語で覚える\n4. 毎日少しずつ練習\n\nどの漢字について知りたいですか？📝'
    }

    if (question.includes('文法')) {
      return '文法の学習ですね！\n\nポイント：\n1. 主語と述語を見つける\n2. 修飾語に注目する\n3. 文の構造を理解する\n\nもう少し詳しく教えてください！✍️'
    }

    return '国語の学習ですね！どの分野について詳しく知りたいですか？\n\n- 読解\n- 文法\n- 漢字\n- 作文\n\n教えてください！📖'
  }

  private handleScienceQuestion(question: string): string {
    return '理科の学習ですね！\n\n学ぶポイント：\n1. 観察する\n2. 仮説を立てる\n3. 実験で確かめる\n4. 結論をまとめる\n\nどの単元について知りたいですか？🔬'
  }

  private handleSocialStudiesQuestion(question: string): string {
    return '社会の学習ですね！\n\n学ぶポイント：\n1. 時代背景を理解する\n2. 因果関係を考える\n3. 地図や資料を活用する\n\nどの分野について知りたいですか？🗺️'
  }

  private handleGeneralQuestion(question: string): string {
    return 'ご質問ありがとうございます！\n\nもう少し詳しく教えていただけますか？\n\n例えば：\n- どの教科の質問ですか？\n- どこまで理解できていますか？\n- 何が分からないですか？\n\n一緒に考えましょう！💪'
  }

  /**
   * 学習のヒントを生成
   */
  generateHints(subject: string, unitName: string): string[] {
    const hints: Record<string, string[]> = {
      '数学': [
        '計算の順序を確認しましょう',
        '図や表を使って視覚化してみましょう',
        '似た問題を復習しましょう'
      ],
      '国語': [
        '段落ごとに内容をまとめましょう',
        '重要な言葉に印をつけましょう',
        '何度も音読しましょう'
      ],
      '理科': [
        '実験手順を確認しましょう',
        '観察したことをメモしましょう',
        '予想と結果を比べましょう'
      ],
      '社会': [
        '地図や年表を確認しましょう',
        'キーワードをノートにまとめましょう',
        '原因と結果を考えましょう'
      ]
    }

    return hints[subject] || [
      '焦らず一つずつ進めましょう',
      '分からないところは先生に聞きましょう',
      '毎日少しずつ復習しましょう'
    ]
  }
}

// ========================================
// 統合AIチューターエンジン
// ========================================

export class AITutorEngine {
  private workersAI: WorkersAIProvider
  private huggingFace: HuggingFaceProvider
  private ruleBasedAI: RuleBasedAI

  constructor(huggingFaceApiKey?: string) {
    this.workersAI = new WorkersAIProvider()
    this.huggingFace = new HuggingFaceProvider(huggingFaceApiKey)
    this.ruleBasedAI = new RuleBasedAI()
  }

  /**
   * マルチプロバイダー戦略で最適な回答を生成
   * 1. Workers AI（最速）
   * 2. HuggingFace（バックアップ）
   * 3. ルールベースAI（フォールバック）
   */
  async generateAnswer(
    request: AITutorRequest,
    ai?: any
  ): Promise<AITutorResponse> {
    const { question, subject, unitName, context } = request

    // システムプロンプト構築
    const systemPrompt = this.buildSystemPrompt(subject, unitName, context)

    // 1. Cloudflare Workers AI を試行（最速・無料）
    if (ai) {
      try {
        const answer = await this.workersAI.generateResponse(ai, question, systemPrompt)
        if (answer && answer.length > 10) {
          return {
            answer,
            confidence: 0.9,
            source: 'workers-ai',
            suggestions: this.ruleBasedAI.generateHints(subject || '一般', unitName || '')
          }
        }
      } catch (error) {
        console.error('Workers AI フォールバック:', error)
      }
    }

    // 2. HuggingFace を試行（バックアップ）
    try {
      const answer = await this.huggingFace.generateResponse(question, systemPrompt)
      if (answer && answer.length > 10) {
        return {
          answer,
          confidence: 0.8,
          source: 'huggingface',
          suggestions: this.ruleBasedAI.generateHints(subject || '一般', unitName || '')
        }
      }
    } catch (error) {
      console.error('HuggingFace フォールバック:', error)
    }

    // 3. ルールベースAI（必ず動作）
    const answer = await this.ruleBasedAI.generateResponse(question, subject, context)
    return {
      answer,
      confidence: 0.6,
      source: 'rule-based',
      suggestions: this.ruleBasedAI.generateHints(subject || '一般', unitName || ''),
      needsTeacherHelp: answer.includes('先生に聞きましょう')
    }
  }

  /**
   * システムプロンプト構築
   */
  private buildSystemPrompt(
    subject?: string,
    unitName?: string,
    context?: string
  ): string {
    let prompt = 'あなたは小学生向けの優秀な教育AIアシスタントです。'

    if (subject) {
      prompt += `\n専門教科: ${subject}`
    }

    if (unitName) {
      prompt += `\n学習単元: ${unitName}`
    }

    if (context) {
      prompt += `\n学習文脈: ${context}`
    }

    prompt += `

回答のルール:
1. 小学生が理解できる簡単な言葉を使う
2. ステップバイステップで説明する
3. 励ましの言葉を入れる
4. 絵文字で親しみやすくする
5. 200文字以内で簡潔に答える

それでは質問に答えてください！`

    return prompt
  }

  /**
   * 学習コンテキストを取得
   */
  async getLearningContext(
    db: D1Database,
    studentId: number
  ): Promise<LearningContext> {
    try {
      // 最近の学習トピック
      const recentTopics = await db.prepare(`
        SELECT DISTINCT lc.subject, lc.unit_name
        FROM learning_sessions ls
        JOIN learning_cards lc ON ls.session_id = lc.card_id
        WHERE ls.student_id = ?
        ORDER BY ls.session_start DESC
        LIMIT 5
      `).bind(studentId).all()

      // 苦手分野（正答率50%未満）
      const struggleAreas = await db.prepare(`
        SELECT lc.subject, lc.unit_name, 
               COUNT(*) as total,
               SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as mastered
        FROM student_progress sp
        JOIN learning_cards lc ON sp.card_id = lc.card_id
        WHERE sp.student_id = ?
        GROUP BY lc.subject, lc.unit_name
        HAVING (mastered * 1.0 / total) < 0.5
        LIMIT 5
      `).bind(studentId).all()

      // 習得済み概念
      const masteredConcepts = await db.prepare(`
        SELECT DISTINCT lc.subject, lc.unit_name
        FROM student_progress sp
        JOIN learning_cards lc ON sp.card_id = lc.card_id
        WHERE sp.student_id = ? AND sp.status = 'mastered'
        ORDER BY sp.last_attempt_date DESC
        LIMIT 10
      `).bind(studentId).all()

      return {
        studentId,
        recentTopics: recentTopics.results.map((r: any) => `${r.subject}/${r.unit_name}`),
        struggleAreas: struggleAreas.results.map((r: any) => `${r.subject}/${r.unit_name}`),
        masteredConcepts: masteredConcepts.results.map((r: any) => `${r.subject}/${r.unit_name}`)
      }
    } catch (error) {
      console.error('❌ 学習コンテキスト取得エラー:', error)
      return {
        studentId,
        recentTopics: [],
        struggleAreas: [],
        masteredConcepts: []
      }
    }
  }
}
