// WebSocket用Durable Object
// リアルタイム進捗更新とヘルプ要請通知を実現

export interface Env {
  PROGRESS_WEBSOCKET: DurableObjectNamespace
  DB: D1Database
}

interface WebSocketClient {
  ws: WebSocket
  classCode: string
  userId?: number
  role?: string
}

export class ProgressWebSocket {
  private state: DurableObjectState
  private clients: Set<WebSocketClient>

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.clients = new Set()
  }

  async fetch(request: Request): Promise<Response> {
    // WebSocketアップグレード
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    // URLからクラスコードとユーザー情報を取得
    const url = new URL(request.url)
    const classCode = url.searchParams.get('classCode')
    const userId = url.searchParams.get('userId')
    const role = url.searchParams.get('role')

    if (!classCode) {
      return new Response('Missing classCode parameter', { status: 400 })
    }

    // WebSocketペアを作成
    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    // サーバー側WebSocketを受け入れ
    this.handleSession(server, classCode, userId ? parseInt(userId) : undefined, role || undefined)

    // クライアント側WebSocketを返す
    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  async handleSession(ws: WebSocket, classCode: string, userId?: number, role?: string) {
    ws.accept()

    const client: WebSocketClient = {
      ws,
      classCode,
      userId,
      role
    }

    this.clients.add(client)

    // 接続通知
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket接続が確立されました',
      classCode,
      clientCount: this.clients.size
    }))

    // メッセージハンドラー
    ws.addEventListener('message', async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string)
        await this.handleMessage(client, data)
      } catch (error) {
        console.error('Message handling error:', error)
        ws.send(JSON.stringify({
          type: 'error',
          message: 'メッセージの処理に失敗しました'
        }))
      }
    })

    // クローズハンドラー
    ws.addEventListener('close', () => {
      this.clients.delete(client)
      console.log(`WebSocket closed. Remaining clients: ${this.clients.size}`)
    })

    // エラーハンドラー
    ws.addEventListener('error', (event) => {
      console.error('WebSocket error:', event)
      this.clients.delete(client)
    })
  }

  async handleMessage(client: WebSocketClient, data: any) {
    switch (data.type) {
      case 'ping':
        // Ping/Pong for keep-alive
        client.ws.send(JSON.stringify({ type: 'pong' }))
        break

      case 'progress_update':
        // 進捗更新をブロードキャスト
        this.broadcast({
          type: 'progress_updated',
          studentId: data.studentId,
          curriculumId: data.curriculumId,
          courseId: data.courseId,
          cardId: data.cardId,
          status: data.status,
          understandingLevel: data.understandingLevel,
          timestamp: new Date().toISOString()
        }, client.classCode)
        break

      case 'help_request':
        // ヘルプ要請を教師に通知
        this.broadcast({
          type: 'help_requested',
          studentId: data.studentId,
          studentName: data.studentName,
          curriculumId: data.curriculumId,
          cardId: data.cardId,
          cardTitle: data.cardTitle,
          helpType: data.helpType,
          timestamp: new Date().toISOString()
        }, client.classCode, 'teacher')
        break

      case 'help_resolve':
        // ヘルプ解決を通知
        this.broadcast({
          type: 'help_resolved',
          studentId: data.studentId,
          timestamp: new Date().toISOString()
        }, client.classCode)
        break

      case 'activity':
        // 活動記録を更新
        this.broadcast({
          type: 'activity_updated',
          studentId: data.studentId,
          cardId: data.cardId,
          timestamp: new Date().toISOString()
        }, client.classCode, 'teacher')
        break

      default:
        client.ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }))
    }
  }

  // 同じクラスコードのクライアントにブロードキャスト
  broadcast(message: any, classCode: string, targetRole?: string) {
    const messageStr = JSON.stringify(message)
    
    for (const client of this.clients) {
      if (client.classCode === classCode) {
        // 特定の役割へのみ送信
        if (targetRole && client.role !== targetRole) {
          continue
        }
        
        try {
          client.ws.send(messageStr)
        } catch (error) {
          console.error('Broadcast error:', error)
          this.clients.delete(client)
        }
      }
    }
  }
}
