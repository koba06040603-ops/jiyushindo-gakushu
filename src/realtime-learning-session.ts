/**
 * Phase 18-1-1: リアルタイム適応学習 - WebSocket基盤
 * 
 * Cloudflare Durable Objectsを使用したリアルタイム通信
 * 
 * 機能:
 * - WebSocketによる双方向通信
 * - 問題解答中のリアルタイム分析
 * - 1秒以内の動的ヒント提供
 * - 即座の学習パス調整
 * 
 * 科学的根拠:
 * - リアルタイムフィードバック: d=0.75 (Shute 2008)
 * - 即時介入: d=0.68 (Corbett & Anderson 1995)
 * - 適応的支援: d=0.64-0.71 (Belland et al. 2017)
 */

export interface Env {
  REALTIME_LEARNING: DurableObjectNamespace
  DB: D1Database
  AI: any
}

/**
 * リアルタイム学習セッション（Durable Object）
 * 
 * 各生徒ごとに1つのDurable Objectインスタンスを作成
 * WebSocket接続を管理し、リアルタイム分析を実行
 */
export class RealtimeLearningSession {
  private state: DurableObjectState
  private env: Env
  private sessions: Map<WebSocket, SessionInfo> = new Map()
  private currentProblem: ProblemState | null = null
  private theoryScores: Map<string, number> = new Map()
  private learningHistory: LearningEvent[] = []

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    
    // 永続化されたデータを復元
    this.state.blockConcurrencyWhile(async () => {
      const scores = await this.state.storage.get<Map<string, number>>('theoryScores')
      if (scores) {
        this.theoryScores = scores
      }
      
      const history = await this.state.storage.get<LearningEvent[]>('learningHistory')
      if (history) {
        this.learningHistory = history
      }
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    // WebSocketアップグレード
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)
      
      await this.handleSession(server, request)
      
      return new Response(null, {
        status: 101,
        webSocket: client
      })
    }
    
    // HTTP API（状態確認など）
    if (url.pathname === '/status') {
      return new Response(JSON.stringify({
        activeSessions: this.sessions.size,
        currentProblem: this.currentProblem,
        theoryScores: Object.fromEntries(this.theoryScores),
        eventsCount: this.learningHistory.length
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response('Not found', { status: 404 })
  }

  /**
   * WebSocketセッション処理
   */
  async handleSession(websocket: WebSocket, request: Request) {
    // セッション情報を取得
    const url = new URL(request.url)
    const studentId = url.searchParams.get('studentId')
    const sessionId = url.searchParams.get('sessionId')
    
    if (!studentId) {
      websocket.close(1008, 'studentId required')
      return
    }
    
    const sessionInfo: SessionInfo = {
      studentId,
      sessionId: sessionId || crypto.randomUUID(),
      connectedAt: Date.now(),
      lastActivity: Date.now()
    }
    
    this.sessions.set(websocket, sessionInfo)
    
    // 接続確認メッセージ
    websocket.send(JSON.stringify({
      type: 'connected',
      sessionId: sessionInfo.sessionId,
      theoryScores: Object.fromEntries(this.theoryScores),
      message: 'リアルタイム学習セッション開始'
    }))
    
    // メッセージハンドラ
    websocket.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string)
        await this.handleMessage(websocket, sessionInfo, data)
      } catch (error) {
        console.error('メッセージ処理エラー:', error)
        websocket.send(JSON.stringify({
          type: 'error',
          error: 'メッセージの処理に失敗しました'
        }))
      }
    })
    
    // 切断ハンドラ
    websocket.addEventListener('close', () => {
      this.sessions.delete(websocket)
      console.log(`セッション終了: ${studentId}`)
    })
    
    // エラーハンドラ
    websocket.addEventListener('error', (error) => {
      console.error('WebSocketエラー:', error)
      this.sessions.delete(websocket)
    })
    
    websocket.accept()
  }

  /**
   * メッセージ処理
   */
  async handleMessage(websocket: WebSocket, session: SessionInfo, data: any) {
    session.lastActivity = Date.now()
    
    switch (data.type) {
      case 'problem_start':
        await this.handleProblemStart(websocket, session, data)
        break
      
      case 'problem_progress':
        await this.handleProblemProgress(websocket, session, data)
        break
      
      case 'answer_submit':
        await this.handleAnswerSubmit(websocket, session, data)
        break
      
      case 'request_hint':
        await this.handleHintRequest(websocket, session, data)
        break
      
      case 'theory_update':
        await this.handleTheoryUpdate(websocket, session, data)
        break
      
      default:
        websocket.send(JSON.stringify({
          type: 'error',
          error: `未知のメッセージタイプ: ${data.type}`
        }))
    }
  }

  /**
   * 問題開始ハンドラ
   */
  async handleProblemStart(websocket: WebSocket, session: SessionInfo, data: any) {
    this.currentProblem = {
      problemId: data.problemId,
      startTime: Date.now(),
      difficulty: data.difficulty,
      theoryAlignment: data.theoryAlignment || [],
      progressEvents: []
    }
    
    // 学習イベント記録
    this.learningHistory.push({
      type: 'problem_start',
      timestamp: Date.now(),
      problemId: data.problemId,
      studentId: session.studentId
    })
    
    // 初期推薦を送信
    const recommendation = await this.generateInitialRecommendation(session.studentId, data.problemId)
    
    websocket.send(JSON.stringify({
      type: 'problem_started',
      problemId: data.problemId,
      recommendation,
      message: '問題を開始しました。リアルタイム分析を実行中...'
    }))
  }

  /**
   * 問題進行ハンドラ（リアルタイム分析）
   */
  async handleProblemProgress(websocket: WebSocket, session: SessionInfo, data: any) {
    if (!this.currentProblem) {
      websocket.send(JSON.stringify({
        type: 'error',
        error: '問題が開始されていません'
      }))
      return
    }
    
    // 進行イベント記録
    const progressEvent: ProgressEvent = {
      timestamp: Date.now(),
      action: data.action, // 'thinking', 'writing', 'erasing', 'paused'
      duration: data.duration || 0,
      content: data.content || null
    }
    
    this.currentProblem.progressEvents.push(progressEvent)
    
    // リアルタイム分析実行（1秒以内）
    const analysis = await this.analyzeProgress(session.studentId, this.currentProblem)
    
    // 分析結果に基づいて即座に介入
    if (analysis.needsIntervention) {
      websocket.send(JSON.stringify({
        type: 'real_time_hint',
        hint: analysis.hint,
        confidence: analysis.confidence,
        reason: analysis.reason,
        message: 'ヒント: ' + analysis.hint
      }))
      
      // F7（動的足場かけ）スコア更新
      await this.updateTheoryScore('F7', analysis.scaffoldingQuality)
    }
    
    // 学習様式の推定更新（F1）
    if (progressEvent.action === 'thinking' && progressEvent.duration > 5000) {
      // 長時間考えている = 深い思考型
      await this.updateTheoryScore('F1', 2) // +2点
    }
    
    websocket.send(JSON.stringify({
      type: 'progress_analyzed',
      analysis: {
        timeSpent: Date.now() - this.currentProblem.startTime,
        progressLevel: analysis.progressLevel,
        estimatedDifficulty: analysis.estimatedDifficulty
      }
    }))
  }

  /**
   * 回答送信ハンドラ
   */
  async handleAnswerSubmit(websocket: WebSocket, session: SessionInfo, data: any) {
    if (!this.currentProblem) {
      websocket.send(JSON.stringify({
        type: 'error',
        error: '問題が開始されていません'
      }))
      return
    }
    
    const timeSpent = Date.now() - this.currentProblem.startTime
    const isCorrect = data.isCorrect
    
    // 理論スコア即座更新
    const updates = await this.updateTheoryScoresFromAnswer(
      session.studentId,
      this.currentProblem,
      {
        isCorrect,
        timeSpent,
        hintsUsed: data.hintsUsed || 0,
        answer: data.answer
      }
    )
    
    // 次の推薦を即座に生成
    const nextRecommendation = await this.generateNextRecommendation(
      session.studentId,
      isCorrect,
      timeSpent
    )
    
    websocket.send(JSON.stringify({
      type: 'answer_processed',
      isCorrect,
      timeSpent,
      theoryUpdates: updates,
      nextRecommendation,
      message: isCorrect ? '正解です！' : '惜しい！もう一度考えてみましょう'
    }))
    
    // 学習イベント記録
    this.learningHistory.push({
      type: 'answer_submit',
      timestamp: Date.now(),
      problemId: this.currentProblem.problemId,
      studentId: session.studentId,
      isCorrect,
      timeSpent
    })
    
    // 永続化
    await this.persistState()
    
    this.currentProblem = null
  }

  /**
   * ヒントリクエストハンドラ
   */
  async handleHintRequest(websocket: WebSocket, session: SessionInfo, data: any) {
    if (!this.currentProblem) {
      websocket.send(JSON.stringify({
        type: 'error',
        error: '問題が開始されていません'
      }))
      return
    }
    
    // インテリジェントヒント生成（AI活用）
    const hint = await this.generateIntelligentHint(
      session.studentId,
      this.currentProblem,
      data.hintLevel || 1
    )
    
    websocket.send(JSON.stringify({
      type: 'hint_provided',
      hint: hint.text,
      level: hint.level,
      confidence: hint.confidence,
      message: 'ヒント: ' + hint.text
    }))
    
    // F7（動的足場かけ）スコア更新
    await this.updateTheoryScore('F7', hint.quality)
  }

  /**
   * 理論スコア更新ハンドラ
   */
  async handleTheoryUpdate(websocket: WebSocket, session: SessionInfo, data: any) {
    const { theoryCode, delta } = data
    
    await this.updateTheoryScore(theoryCode, delta)
    
    websocket.send(JSON.stringify({
      type: 'theory_updated',
      theoryCode,
      newScore: this.theoryScores.get(theoryCode) || 50,
      message: `${theoryCode}スコアを更新しました`
    }))
  }

  /**
   * リアルタイム進行分析
   */
  async analyzeProgress(studentId: string, problem: ProblemState): Promise<ProgressAnalysis> {
    const timeSpent = Date.now() - problem.startTime
    const events = problem.progressEvents
    
    // 停滞の検出
    const lastEvent = events[events.length - 1]
    const timeSinceLastAction = Date.now() - (lastEvent?.timestamp || problem.startTime)
    
    if (timeSinceLastAction > 30000) { // 30秒以上停滞
      return {
        needsIntervention: true,
        hint: '困っていますか？一つずつ考えていきましょう',
        confidence: 0.8,
        reason: '30秒以上停滞を検出',
        scaffoldingQuality: 5,
        progressLevel: 'struggling',
        estimatedDifficulty: 'too_hard'
      }
    }
    
    // 消去行動の検出
    const erasingCount = events.filter(e => e.action === 'erasing').length
    if (erasingCount > 3) {
      return {
        needsIntervention: true,
        hint: '何度も消していますね。別のアプローチを試してみましょう',
        confidence: 0.75,
        reason: '頻繁な消去行動を検出',
        scaffoldingQuality: 6,
        progressLevel: 'uncertain',
        estimatedDifficulty: 'challenging'
      }
    }
    
    // 順調な進行
    return {
      needsIntervention: false,
      hint: '',
      confidence: 0,
      reason: '順調に進行中',
      scaffoldingQuality: 8,
      progressLevel: 'on_track',
      estimatedDifficulty: 'appropriate'
    }
  }

  /**
   * 初期推薦生成
   */
  async generateInitialRecommendation(studentId: string, problemId: string): Promise<Recommendation> {
    const scores = Object.fromEntries(this.theoryScores)
    
    return {
      approach: scores.F1 > 70 ? '図を描いて考えてみましょう' : '一つずつ順番に考えてみましょう',
      estimatedTime: '3-5分',
      confidence: 0.7
    }
  }

  /**
   * 次の推薦生成
   */
  async generateNextRecommendation(
    studentId: string,
    wasCorrect: boolean,
    timeSpent: number
  ): Promise<Recommendation> {
    if (wasCorrect && timeSpent < 60000) {
      return {
        approach: '素晴らしい！もう少し難しい問題に挑戦してみましょう',
        estimatedTime: '5-7分',
        confidence: 0.85
      }
    } else if (!wasCorrect) {
      return {
        approach: '似た問題でもう一度練習してみましょう',
        estimatedTime: '3-5分',
        confidence: 0.8
      }
    }
    
    return {
      approach: '次の問題に進みましょう',
      estimatedTime: '3-5分',
      confidence: 0.7
    }
  }

  /**
   * インテリジェントヒント生成
   */
  async generateIntelligentHint(
    studentId: string,
    problem: ProblemState,
    level: number
  ): Promise<IntelligentHint> {
    // AI を使ったヒント生成
    const prompt = `
問題ID: ${problem.problemId}
難易度: ${problem.difficulty}
経過時間: ${Math.floor((Date.now() - problem.startTime) / 1000)}秒
ヒントレベル: ${level}/3

段階的なヒントを生成してください:
- レベル1: 問題の見方のヒント
- レベル2: 解法の方向性のヒント
- レベル3: 具体的な手順のヒント
`
    
    try {
      const aiResponse = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 256
      })
      
      const hintText = aiResponse.response || 'もう一度問題を読んでみましょう'
      
      return {
        text: hintText,
        level,
        confidence: 0.8,
        quality: 8
      }
    } catch (error) {
      console.error('AIヒント生成エラー:', error)
      return {
        text: '一つずつ考えていきましょう',
        level,
        confidence: 0.5,
        quality: 5
      }
    }
  }

  /**
   * 回答から理論スコア更新
   */
  async updateTheoryScoresFromAnswer(
    studentId: string,
    problem: ProblemState,
    result: AnswerResult
  ): Promise<TheoryUpdate[]> {
    const updates: TheoryUpdate[] = []
    
    // F1: 学習様式（時間と正答率から）
    if (result.isCorrect && result.timeSpent < 120000) {
      const delta = 2
      await this.updateTheoryScore('F1', delta)
      updates.push({ theoryCode: 'F1', delta, reason: '短時間で正解' })
    }
    
    // F5: 自己調整学習（ヒント使用から）
    if (result.hintsUsed === 0 && result.isCorrect) {
      const delta = 3
      await this.updateTheoryScore('F5', delta)
      updates.push({ theoryCode: 'F5', delta, reason: 'ヒントなしで正解' })
    } else if (result.hintsUsed > 2) {
      const delta = -1
      await this.updateTheoryScore('F5', delta)
      updates.push({ theoryCode: 'F5', delta, reason: 'ヒント過多' })
    }
    
    // F6: 学習方略（問題の進め方から）
    const progressQuality = problem.progressEvents.length > 5 ? 2 : 1
    await this.updateTheoryScore('F6', progressQuality)
    updates.push({ theoryCode: 'F6', delta: progressQuality, reason: '学習プロセス評価' })
    
    return updates
  }

  /**
   * 理論スコア更新
   */
  async updateTheoryScore(theoryCode: string, delta: number) {
    const currentScore = this.theoryScores.get(theoryCode) || 50
    const newScore = Math.max(0, Math.min(100, currentScore + delta))
    
    this.theoryScores.set(theoryCode, newScore)
    
    // 永続化（非同期）
    await this.state.storage.put('theoryScores', this.theoryScores)
    
    console.log(`理論スコア更新: ${theoryCode} ${currentScore} → ${newScore} (${delta > 0 ? '+' : ''}${delta})`)
  }

  /**
   * 状態の永続化
   */
  async persistState() {
    await this.state.storage.put('theoryScores', this.theoryScores)
    await this.state.storage.put('learningHistory', this.learningHistory.slice(-100)) // 最新100件のみ
  }
}

// 型定義
interface SessionInfo {
  studentId: string
  sessionId: string
  connectedAt: number
  lastActivity: number
}

interface ProblemState {
  problemId: string
  startTime: number
  difficulty: string
  theoryAlignment: string[]
  progressEvents: ProgressEvent[]
}

interface ProgressEvent {
  timestamp: number
  action: 'thinking' | 'writing' | 'erasing' | 'paused'
  duration: number
  content: string | null
}

interface LearningEvent {
  type: string
  timestamp: number
  problemId: string
  studentId: string
  isCorrect?: boolean
  timeSpent?: number
}

interface ProgressAnalysis {
  needsIntervention: boolean
  hint: string
  confidence: number
  reason: string
  scaffoldingQuality: number
  progressLevel: 'on_track' | 'struggling' | 'uncertain'
  estimatedDifficulty: 'appropriate' | 'challenging' | 'too_hard'
}

interface Recommendation {
  approach: string
  estimatedTime: string
  confidence: number
}

interface IntelligentHint {
  text: string
  level: number
  confidence: number
  quality: number
}

interface AnswerResult {
  isCorrect: boolean
  timeSpent: number
  hintsUsed: number
  answer: string
}

interface TheoryUpdate {
  theoryCode: string
  delta: number
  reason: string
}
