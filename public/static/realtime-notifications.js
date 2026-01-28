// ===== Phase 7: リアルタイム通知機能 =====
// WebSocket接続とリアルタイム通知UI

class RealtimeNotificationManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.notificationQueue = []
    this.isInitialized = false
    this.studentId = null
    this.notificationSound = null
    
    console.log('🔔 RealtimeNotificationManager 初期化')
  }
  
  /**
   * WebSocket接続を初期化
   * @param {number} studentId - 生徒ID
   */
  async initialize(studentId) {
    if (this.isInitialized) {
      console.log('⚠️ すでに初期化済みです')
      return
    }
    
    this.studentId = studentId
    this.isInitialized = true
    
    // 通知音を準備
    this.prepareNotificationSound()
    
    // 通知UIを作成
    this.createNotificationUI()
    
    // WebSocket接続を開始
    await this.connect()
    
    console.log('✅ RealtimeNotificationManager 初期化完了')
  }
  
  /**
   * 通知音を準備
   */
  prepareNotificationSound() {
    // 簡易的な通知音をAudio APIで生成
    try {
      this.notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=')
    } catch (e) {
      console.warn('⚠️ 通知音の準備に失敗:', e)
    }
  }
  
  /**
   * 通知UIを作成
   */
  createNotificationUI() {
    // 通知コンテナを作成
    if (document.getElementById('notification-container')) {
      return // すでに存在する
    }
    
    const container = document.createElement('div')
    container.id = 'notification-container'
    container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm'
    container.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 9999; max-width: 24rem;'
    document.body.appendChild(container)
    
    // 通知バッジを作成（未読通知数）
    const badge = document.createElement('div')
    badge.id = 'notification-badge'
    badge.className = 'hidden fixed top-4 right-20 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-50'
    badge.style.cssText = 'display: none; position: fixed; top: 1rem; right: 5rem; background-color: #ef4444; color: white; border-radius: 9999px; width: 1.5rem; height: 1.5rem; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; z-index: 9999;'
    badge.textContent = '0'
    document.body.appendChild(badge)
    
    console.log('✅ 通知UI作成完了')
  }
  
  /**
   * WebSocket接続を確立
   */
  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocketはすでに接続されています')
      return
    }
    
    try {
      // WebSocketエンドポイントのURLを取得
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/ws?studentId=${this.studentId}`
      
      console.log('🔌 WebSocket接続中:', wsUrl)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket接続成功')
        this.reconnectAttempts = 0
        this.reconnectDelay = 1000
        
        // 接続成功通知
        this.showNotification({
          type: 'success',
          title: '接続成功',
          message: 'リアルタイム通知が有効になりました',
          duration: 3000
        })
      }
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event)
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocketエラー:', error)
      }
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket接続が切断されました')
        this.handleReconnect()
      }
      
    } catch (error) {
      console.error('❌ WebSocket接続エラー:', error)
      this.handleReconnect()
    }
  }
  
  /**
   * WebSocketメッセージを処理
   * @param {MessageEvent} event
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data)
      console.log('📨 WebSocketメッセージ受信:', data)
      
      switch (data.type) {
        case 'teacher_message':
          this.handleTeacherMessage(data)
          break
        case 'new_card':
          this.handleNewCard(data)
          break
        case 'progress_update':
          this.handleProgressUpdate(data)
          break
        case 'achievement':
          this.handleAchievement(data)
          break
        default:
          console.log('⚠️ 未知のメッセージタイプ:', data.type)
      }
    } catch (error) {
      console.error('❌ メッセージ処理エラー:', error)
    }
  }
  
  /**
   * 先生からのメッセージを処理
   * @param {Object} data
   */
  handleTeacherMessage(data) {
    console.log('👨‍🏫 先生からのメッセージ:', data)
    
    this.showNotification({
      type: 'teacher',
      title: '先生からのメッセージ',
      message: data.message,
      duration: 0, // 手動で閉じるまで表示
      actions: [
        {
          label: '返信する',
          onClick: () => this.openTeacherChat(data.teacherId)
        }
      ]
    })
    
    // 通知音を再生
    this.playNotificationSound()
  }
  
  /**
   * 新しいカード配信通知を処理
   * @param {Object} data
   */
  handleNewCard(data) {
    console.log('🆕 新しいカード配信:', data)
    
    this.showNotification({
      type: 'new_card',
      title: '新しいカードが配信されました',
      message: `${data.courseName}: ${data.cardTitle}`,
      duration: 0,
      actions: [
        {
          label: 'カードを見る',
          onClick: () => this.openCard(data.cardId)
        }
      ]
    })
    
    // 通知音を再生
    this.playNotificationSound()
    
    // 未読バッジを更新
    this.updateUnreadBadge(1)
  }
  
  /**
   * 進捗更新通知を処理
   * @param {Object} data
   */
  handleProgressUpdate(data) {
    console.log('📊 進捗更新:', data)
    
    // 進捗バーを更新（既存の進捗表示UIがあれば）
    const progressBar = document.querySelector('.student-progress-bar')
    if (progressBar) {
      progressBar.style.width = `${data.progress}%`
      progressBar.textContent = `${data.progress}%`
    }
  }
  
  /**
   * 達成通知を処理
   * @param {Object} data
   */
  handleAchievement(data) {
    console.log('🎉 達成:', data)
    
    this.showNotification({
      type: 'achievement',
      title: '🎉 おめでとうございます！',
      message: data.message,
      duration: 5000
    })
    
    // 通知音を再生
    this.playNotificationSound()
  }
  
  /**
   * 通知を表示
   * @param {Object} options
   */
  showNotification(options) {
    const {
      type = 'info',
      title,
      message,
      duration = 5000,
      actions = []
    } = options
    
    const container = document.getElementById('notification-container')
    if (!container) return
    
    // 通知要素を作成
    const notification = document.createElement('div')
    notification.className = `notification notification-${type} bg-white rounded-lg shadow-lg p-4 mb-2 border-l-4 animate-slide-in`
    
    // タイプ別の色設定
    const borderColors = {
      success: '#10b981',
      teacher: '#3b82f6',
      new_card: '#8b5cf6',
      achievement: '#f59e0b',
      info: '#6b7280'
    }
    notification.style.borderLeftColor = borderColors[type] || borderColors.info
    
    // アイコンを設定
    const icons = {
      success: '✅',
      teacher: '👨‍🏫',
      new_card: '🆕',
      achievement: '🎉',
      info: 'ℹ️'
    }
    const icon = icons[type] || icons.info
    
    // 通知内容
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 text-2xl mr-3">
          ${icon}
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-gray-900 mb-1">${title}</h4>
          <p class="text-gray-700 text-sm">${message}</p>
          ${actions.length > 0 ? `
            <div class="mt-3 flex gap-2">
              ${actions.map((action, index) => `
                <button 
                  data-action-index="${index}"
                  class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                >
                  ${action.label}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <button class="close-notification ml-2 text-gray-400 hover:text-gray-600 text-xl font-bold">
          ×
        </button>
      </div>
    `
    
    // アクションボタンのイベントリスナー
    actions.forEach((action, index) => {
      const button = notification.querySelector(`[data-action-index="${index}"]`)
      if (button) {
        button.addEventListener('click', () => {
          action.onClick()
          notification.remove()
        })
      }
    })
    
    // 閉じるボタンのイベントリスナー
    const closeButton = notification.querySelector('.close-notification')
    closeButton.addEventListener('click', () => {
      notification.remove()
    })
    
    // 通知を追加
    container.appendChild(notification)
    
    // アニメーション
    notification.style.animation = 'slideIn 0.3s ease-out'
    
    // 自動削除（durationが0の場合は手動で閉じるまで表示）
    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in'
        setTimeout(() => notification.remove(), 300)
      }, duration)
    }
    
    // 通知キューに追加
    this.notificationQueue.push({
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date()
    })
  }
  
  /**
   * 通知音を再生
   */
  playNotificationSound() {
    if (this.notificationSound) {
      try {
        this.notificationSound.currentTime = 0
        this.notificationSound.play().catch(e => {
          console.warn('⚠️ 通知音の再生に失敗:', e)
        })
      } catch (e) {
        console.warn('⚠️ 通知音の再生に失敗:', e)
      }
    }
  }
  
  /**
   * 未読バッジを更新
   * @param {number} increment - 増加数
   */
  updateUnreadBadge(increment = 0) {
    const badge = document.getElementById('notification-badge')
    if (!badge) return
    
    const currentCount = parseInt(badge.textContent || '0')
    const newCount = currentCount + increment
    
    badge.textContent = newCount
    badge.style.display = newCount > 0 ? 'flex' : 'none'
  }
  
  /**
   * 先生とのチャットを開く
   * @param {number} teacherId - 先生ID
   */
  openTeacherChat(teacherId) {
    console.log('💬 先生とのチャット開始:', teacherId)
    // TODO: チャットUIを実装
    alert('先生とのチャット機能は準備中です')
  }
  
  /**
   * カードを開く
   * @param {number} cardId - カードID
   */
  openCard(cardId) {
    console.log('📇 カードを開く:', cardId)
    // カード詳細ページに遷移
    window.location.href = `/learning-card.html?cardId=${cardId}`
  }
  
  /**
   * 再接続を処理
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ WebSocket再接続の最大試行回数に達しました')
      this.showNotification({
        type: 'info',
        title: '接続エラー',
        message: '通知機能の接続に失敗しました。ページを再読み込みしてください。',
        duration: 0
      })
      return
    }
    
    this.reconnectAttempts++
    console.log(`🔄 WebSocket再接続中 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
    
    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay)
    
    // 再接続遅延を増加（指数バックオフ）
    this.reconnectDelay *= 2
  }
  
  /**
   * WebSocket接続を切断
   */
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    console.log('🔌 WebSocket切断')
  }
  
  /**
   * メッセージを送信
   * @param {Object} data
   */
  sendMessage(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocketが接続されていません')
      return
    }
    
    try {
      this.ws.send(JSON.stringify(data))
      console.log('📤 メッセージ送信:', data)
    } catch (error) {
      console.error('❌ メッセージ送信エラー:', error)
    }
  }
}

// グローバルインスタンスを作成
window.realtimeNotificationManager = new RealtimeNotificationManager()

// CSSアニメーションを追加
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .notification {
    animation: slideIn 0.3s ease-out;
  }
`
document.head.appendChild(style)

console.log('✅ realtime-notifications.js 読み込み完了')
