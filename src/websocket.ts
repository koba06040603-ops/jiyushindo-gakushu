// Phase 7: リアルタイム通知機能 - Durable Object WebSocketサーバー

export interface Env {
  DB: D1Database
  PROGRESS_WEBSOCKET: DurableObjectNamespace
  GEMINI_API_KEY?: string
}

interface WebSocketSession {
  websocket: WebSocket
  userId: number
  classCode: string
  role: 'student' | 'teacher'
  sessionId: string
  connectedAt: Date
  lastHeartbeat: Date
}

export class ProgressWebSocket {
  state: DurableObjectState
  env: Env
  sessions: Map<string, WebSocketSession>
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    this.sessions = new Map()
    
    // 定期的なハートビートチェック（60秒ごと）
    this.state.blockConcurrencyWhile(async () => {
      const sessions = await this.state.storage.get<Map<string, WebSocketSession>>('sessions')
      if (sessions) {
        this.sessions = sessions
      }
    })
    
    // ハートビートチェックのインターバル設定
    setInterval(() => this.checkHeartbeats(), 60000)
  }
  
  async fetch(request: Request): Promise<Response> {
    // WebSocketアップグレード処理
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }
    
    // URLパラメータから認証情報を取得
    const url = new URL(request.url)
    const userId = parseInt(url.searchParams.get('userId') || '0')
    const classCode = url.searchParams.get('classCode') || ''
    const role = url.searchParams.get('role') as 'student' | 'teacher' || 'student'
    
    if (!userId || !classCode) {
      return new Response('Missing userId or classCode', { status: 400 })
    }
    
    // WebSocketペアの作成
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)
    
    // WebSocket接続を受け入れる
    server.accept()
    
    // セッション情報を作成
    const sessionId = `sess_${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const session: WebSocketSession = {
      websocket: server,
      userId,
      classCode,
      role,
      sessionId,
      connectedAt: new Date(),
      lastHeartbeat: new Date()
    }
    
    // セッションをマップに追加
    this.sessions.set(sessionId, session)
    await this.saveSessions()
    
    // データベースにセッション記録
    await this.recordSession(userId, classCode, sessionId, 'connected')
    
    // WebSocketメッセージハンドラーを設定
    server.addEventListener('message', async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string)
        await this.handleMessage(sessionId, data)
      } catch (error) {
        console.error('WebSocketメッセージエラー:', error)
        server.send(JSON.stringify({
          type: 'error',
          errorCode: 'INVALID_MESSAGE',
          message: 'メッセージの形式が不正です'
        }))
      }
    })
    
    // WebSocket切断ハンドラー
    server.addEventListener('close', async () => {
      await this.handleDisconnect(sessionId)
    })
    
    server.addEventListener('error', async (error) => {
      console.error('WebSocketエラー:', error)
      await this.handleDisconnect(sessionId)
    })
    
    // 接続確認メッセージを送信
    server.send(JSON.stringify({
      type: 'connected',
      sessionId,
      userId,
      timestamp: new Date().toISOString()
    }))
    
    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }
  
  async handleMessage(sessionId: string, data: any) {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.error('セッションが見つかりません:', sessionId)
      return
    }
    
    console.log('WebSocketメッセージ受信:', { sessionId, type: data.type })
    
    switch (data.type) {
      case 'ping':
        // ハートビート応答
        session.lastHeartbeat = new Date()
        await this.saveSessions()
        session.websocket.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }))
        break
      
      case 'send_notification':
        // 教師からの通知送信
        if (session.role === 'teacher') {
          await this.sendNotification(session, data)
        } else {
          session.websocket.send(JSON.stringify({
            type: 'error',
            errorCode: 'UNAUTHORIZED',
            message: '通知を送信する権限がありません'
          }))
        }
        break
      
      case 'distribute_card':
        // カード配信通知
        if (session.role === 'teacher') {
          await this.distributeCard(session, data)
        } else {
          session.websocket.send(JSON.stringify({
            type: 'error',
            errorCode: 'UNAUTHORIZED',
            message: 'カードを配信する権限がありません'
          }))
        }
        break
      
      case 'read_notification':
        // 通知既読
        await this.markNotificationAsRead(session.userId, data.notificationId)
        break
      
      default:
        session.websocket.send(JSON.stringify({
          type: 'error',
          errorCode: 'UNKNOWN_TYPE',
          message: `不明なメッセージタイプ: ${data.type}`
        }))
    }
  }
  
  async sendNotification(session: WebSocketSession, data: any) {
    const {
      notificationType,
      targetUserIds,
      title,
      message,
      priority = 'normal',
      additionalData = {}
    } = data
    
    // 通知をデータベースに保存
    const targetUsers = targetUserIds === 'all' 
      ? await this.getAllClassUsers(session.classCode)
      : targetUserIds
    
    for (const targetUserId of targetUsers) {
      // データベースに通知を保存
      const notificationId = await this.saveNotification({
        type: notificationType,
        fromUserId: session.userId,
        toUserId: targetUserId,
        classCode: session.classCode,
        title,
        message,
        data: JSON.stringify(additionalData),
        priority
      })
      
      // リアルタイムで通知を配信
      await this.sendToUser(targetUserId, {
        type: 'notification',
        notificationId,
        notificationType,
        fromUserId: session.userId,
        fromUserName: await this.getUserName(session.userId),
        title,
        message,
        priority,
        data: additionalData,
        timestamp: new Date().toISOString()
      })
    }
    
    // 送信確認を返す
    session.websocket.send(JSON.stringify({
      type: 'notification_sent',
      targetCount: targetUsers.length,
      timestamp: new Date().toISOString()
    }))
  }
  
  async distributeCard(session: WebSocketSession, data: any) {
    const {
      curriculumId,
      courseId,
      cardId,
      targetUserIds
    } = data
    
    // カード情報を取得
    const card = await this.getCard(cardId)
    if (!card) {
      session.websocket.send(JSON.stringify({
        type: 'error',
        errorCode: 'CARD_NOT_FOUND',
        message: 'カードが見つかりません'
      }))
      return
    }
    
    // 配信通知を送信
    const targetUsers = targetUserIds === 'all'
      ? await this.getAllClassUsers(session.classCode)
      : targetUserIds
    
    for (const targetUserId of targetUsers) {
      // データベースに通知を保存
      const notificationId = await this.saveNotification({
        type: 'card_distribution',
        fromUserId: session.userId,
        toUserId: targetUserId,
        classCode: session.classCode,
        curriculumId,
        title: '新しい学習カードが届きました',
        message: `学習カード「${card.card_title}」が配信されました`,
        data: JSON.stringify({ curriculumId, courseId, cardId }),
        priority: 'normal'
      })
      
      // リアルタイムで通知を配信
      await this.sendToUser(targetUserId, {
        type: 'card_distribution',
        notificationId,
        curriculumId,
        courseId,
        cardId,
        cardTitle: card.card_title,
        message: `新しい学習カード「${card.card_title}」が届きました`,
        timestamp: new Date().toISOString()
      })
    }
    
    // 配信確認を返す
    session.websocket.send(JSON.stringify({
      type: 'card_distributed',
      targetCount: targetUsers.length,
      timestamp: new Date().toISOString()
    }))
  }
  
  async sendToUser(userId: number, message: any) {
    // 特定ユーザーへメッセージを送信
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        try {
          session.websocket.send(JSON.stringify(message))
          console.log('メッセージ送信成功:', { userId, sessionId, type: message.type })
        } catch (error) {
          console.error('メッセージ送信エラー:', error)
        }
      }
    }
  }
  
  async broadcastToClass(classCode: string, message: any) {
    // クラス全体へメッセージをブロードキャスト
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.classCode === classCode) {
        try {
          session.websocket.send(JSON.stringify(message))
        } catch (error) {
          console.error('ブロードキャストエラー:', error)
        }
      }
    }
  }
  
  async handleDisconnect(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return
    
    console.log('WebSocket切断:', { sessionId, userId: session.userId })
    
    // セッションを削除
    this.sessions.delete(sessionId)
    await this.saveSessions()
    
    // データベースにセッション終了を記録
    await this.recordSession(session.userId, session.classCode, sessionId, 'disconnected')
  }
  
  async checkHeartbeats() {
    // 60秒以上ハートビートがないセッションを切断
    const now = new Date()
    const timeout = 60000 // 60秒
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceHeartbeat = now.getTime() - session.lastHeartbeat.getTime()
      if (timeSinceHeartbeat > timeout) {
        console.log('タイムアウトによる切断:', { sessionId, userId: session.userId })
        try {
          session.websocket.close(1000, 'Heartbeat timeout')
        } catch (error) {
          console.error('切断エラー:', error)
        }
        await this.handleDisconnect(sessionId)
      }
    }
  }
  
  // ヘルパーメソッド
  
  async saveSessions() {
    await this.state.storage.put('sessions', this.sessions)
  }
  
  async recordSession(userId: number, classCode: string, sessionId: string, status: string) {
    try {
      if (status === 'connected') {
        await this.env.DB.prepare(`
          INSERT INTO realtime_sessions (user_id, class_code, session_id, connection_status)
          VALUES (?, ?, ?, ?)
        `).bind(userId, classCode, sessionId, status).run()
      } else {
        await this.env.DB.prepare(`
          UPDATE realtime_sessions
          SET connection_status = ?, disconnected_at = CURRENT_TIMESTAMP
          WHERE session_id = ?
        `).bind(status, sessionId).run()
      }
    } catch (error) {
      console.error('セッション記録エラー:', error)
    }
  }
  
  async saveNotification(notification: any): Promise<number> {
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO notifications (
          type, from_user_id, to_user_id, class_code, curriculum_id,
          title, message, data, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        notification.type,
        notification.fromUserId,
        notification.toUserId,
        notification.classCode,
        notification.curriculumId || null,
        notification.title,
        notification.message,
        notification.data,
        notification.priority
      ).run()
      
      return result.meta.last_row_id as number
    } catch (error) {
      console.error('通知保存エラー:', error)
      return 0
    }
  }
  
  async markNotificationAsRead(userId: number, notificationId: number) {
    try {
      await this.env.DB.prepare(`
        UPDATE notifications
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND to_user_id = ?
      `).bind(notificationId, userId).run()
    } catch (error) {
      console.error('通知既読エラー:', error)
    }
  }
  
  async getAllClassUsers(classCode: string): Promise<number[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT id FROM users WHERE class_code = ? AND role = 'student'
      `).bind(classCode).all()
      
      return result.results.map((row: any) => row.id)
    } catch (error) {
      console.error('クラスユーザー取得エラー:', error)
      return []
    }
  }
  
  async getUserName(userId: number): Promise<string> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT name FROM users WHERE id = ?
      `).bind(userId).first()
      
      return result?.name || '不明'
    } catch (error) {
      console.error('ユーザー名取得エラー:', error)
      return '不明'
    }
  }
  
  async getCard(cardId: number): Promise<any> {
    try {
      return await this.env.DB.prepare(`
        SELECT * FROM learning_cards WHERE id = ?
      `).bind(cardId).first()
    } catch (error) {
      console.error('カード取得エラー:', error)
      return null
    }
  }
}
