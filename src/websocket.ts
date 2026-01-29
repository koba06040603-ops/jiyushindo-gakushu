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
      
      case 'check_spaced_review':
        // 分散学習の復習チェック（生徒用）
        await this.checkSpacedReview(session)
        break
      
      case 'send_spaced_review_reminder':
        // 分散学習の復習リマインダー送信（教師用）
        if (session.role === 'teacher') {
          await this.sendSpacedReviewReminder(session, data)
        } else {
          session.websocket.send(JSON.stringify({
            type: 'error',
            errorCode: 'UNAUTHORIZED',
            message: '復習リマインダーを送信する権限がありません'
          }))
        }
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
  
  // =====================================================
  // 分散学習復習通知機能
  // =====================================================
  
  /**
   * 生徒の復習状況をチェックして通知を送信
   */
  async checkSpacedReview(session: WebSocketSession) {
    try {
      // 今日の復習カード数を取得
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM spaced_learning_schedule
        WHERE student_id = ?
          AND DATE(next_review_date) <= DATE('now')
          AND learning_stage != 'mastered'
      `).bind(session.userId).first()
      
      const reviewCount = countResult?.count as number || 0
      
      // 復習が必要なカードがあれば詳細を取得
      if (reviewCount > 0) {
        const reviewsResult = await this.env.DB.prepare(`
          SELECT 
            s.card_id,
            s.mastery_level,
            s.leitner_box,
            s.next_review_date,
            JULIANDAY('now') - JULIANDAY(s.next_review_date) as days_overdue,
            c.card_title,
            c.card_number
          FROM spaced_learning_schedule s
          JOIN learning_cards c ON s.card_id = c.id
          WHERE s.student_id = ?
            AND DATE(s.next_review_date) <= DATE('now')
            AND s.learning_stage != 'mastered'
          ORDER BY days_overdue DESC
          LIMIT 5
        `).bind(session.userId).all()
        
        const reviews = reviewsResult.results
        
        // 優先度の高いカード（期限超過）を抽出
        const overdueCards = reviews.filter((r: any) => r.days_overdue > 0)
        
        // 通知を送信
        session.websocket.send(JSON.stringify({
          type: 'spaced_review_notification',
          data: {
            totalReviewCount: reviewCount,
            overdueCount: overdueCards.length,
            topReviews: reviews.slice(0, 3).map((r: any) => ({
              cardId: r.card_id,
              cardTitle: r.card_title,
              cardNumber: r.card_number,
              masteryLevel: Math.round((r.mastery_level as number) * 100),
              leitnerBox: r.leitner_box,
              daysOverdue: Math.floor(r.days_overdue as number)
            })),
            message: overdueCards.length > 0
              ? `${overdueCards.length}枚のカードが期限超過です！`
              : `今日は${reviewCount}枚の復習があります`,
            priority: overdueCards.length > 3 ? 'high' : 'normal',
            timestamp: new Date().toISOString()
          }
        }))
        
        // データベースに通知記録
        await this.env.DB.prepare(`
          INSERT INTO notification_logs (
            user_id,
            notification_type,
            title,
            message,
            priority,
            is_read,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          session.userId,
          'spaced_review',
          '復習のお知らせ',
          overdueCards.length > 0
            ? `${overdueCards.length}枚のカードが期限超過です！復習しましょう。`
            : `今日は${reviewCount}枚の復習があります。`,
          overdueCards.length > 3 ? 'high' : 'normal',
          0,
          new Date().toISOString()
        ).run()
      } else {
        // 復習なしの通知
        session.websocket.send(JSON.stringify({
          type: 'spaced_review_notification',
          data: {
            totalReviewCount: 0,
            overdueCount: 0,
            topReviews: [],
            message: '今日の復習は完了しています！',
            priority: 'low',
            timestamp: new Date().toISOString()
          }
        }))
      }
    } catch (error) {
      console.error('復習チェックエラー:', error)
      session.websocket.send(JSON.stringify({
        type: 'error',
        errorCode: 'SPACED_REVIEW_CHECK_ERROR',
        message: '復習状況の確認中にエラーが発生しました'
      }))
    }
  }
  
  /**
   * 教師からクラス全体に復習リマインダーを送信
   */
  async sendSpacedReviewReminder(session: WebSocketSession, data: any) {
    try {
      const { targetUserIds, customMessage } = data
      
      // 対象ユーザーのリストを取得
      const users = targetUserIds === 'all' 
        ? await this.getAllClassUsers(session.classCode)
        : targetUserIds
      
      let sentCount = 0
      
      for (const userId of users) {
        // 各生徒の復習状況を取得
        const countResult = await this.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM spaced_learning_schedule
          WHERE student_id = ?
            AND DATE(next_review_date) <= DATE('now')
            AND learning_stage != 'mastered'
        `).bind(userId).first()
        
        const reviewCount = countResult?.count as number || 0
        
        if (reviewCount > 0) {
          // 復習が必要な生徒に通知を送信
          const targetSession = Array.from(this.sessions.values()).find(
            s => s.userId === userId && s.role === 'student'
          )
          
          if (targetSession) {
            targetSession.websocket.send(JSON.stringify({
              type: 'teacher_spaced_review_reminder',
              data: {
                reviewCount,
                teacherMessage: customMessage || '先生から復習のお知らせです',
                senderName: await this.getUserName(session.userId),
                timestamp: new Date().toISOString()
              }
            }))
            sentCount++
          }
          
          // データベースに通知記録
          await this.env.DB.prepare(`
            INSERT INTO notification_logs (
              user_id,
              notification_type,
              title,
              message,
              priority,
              is_read,
              additional_data,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            userId,
            'teacher_spaced_review_reminder',
            '先生からの復習リマインダー',
            customMessage || `${reviewCount}枚の復習カードがあります。復習しましょう！`,
            'normal',
            0,
            JSON.stringify({ reviewCount, teacherId: session.userId }),
            new Date().toISOString()
          ).run()
        }
      }
      
      // 教師に送信完了通知
      session.websocket.send(JSON.stringify({
        type: 'reminder_sent',
        data: {
          sentCount,
          totalUsers: users.length,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error('復習リマインダー送信エラー:', error)
      session.websocket.send(JSON.stringify({
        type: 'error',
        errorCode: 'REMINDER_SEND_ERROR',
        message: '復習リマインダーの送信中にエラーが発生しました'
      }))
    }
  }
}
