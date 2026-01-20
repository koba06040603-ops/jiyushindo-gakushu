// リアルタイム通信機能（Server-Sent Events / Polling）
class RealtimeCommunicationManager {
  constructor() {
    this.eventSource = null
    this.listeners = {}
    this.pollingInterval = null
    this.isConnected = false
    this.usePolling = true // Cloudflare Pagesではpollingを使用
  }
  
  // リアルタイム接続を開始
  connect(userId, classCode) {
    if (this.isConnected) {
      console.log('⚠️ 既に接続されています')
      return
    }
    
    if (this.usePolling) {
      // ポーリング方式
      this.startPolling(userId, classCode)
    } else {
      // SSE方式（通常のサーバー用）
      this.connectSSE(userId, classCode)
    }
  }
  
  // ポーリング開始
  startPolling(userId, classCode, interval = 5000) {
    console.log('🔄 ポーリング開始:', {userId, classCode, interval})
    this.isConnected = true
    
    const poll = async () => {
      try {
        // ヘルプ要請をチェック
        const helpResponse = await axios.get(`/api/realtime/help-requests/${classCode}`)
        if (helpResponse.data.requests && helpResponse.data.requests.length > 0) {
          this.emit('help-request', helpResponse.data.requests)
        }
        
        // 進捗更新をチェック
        const progressResponse = await axios.get(`/api/realtime/progress-updates/${classCode}`)
        if (progressResponse.data.updates && progressResponse.data.updates.length > 0) {
          this.emit('progress-update', progressResponse.data.updates)
        }
        
        // お知らせをチェック
        const notificationResponse = await axios.get(`/api/realtime/notifications/${userId}`)
        if (notificationResponse.data.notifications && notificationResponse.data.notifications.length > 0) {
          this.emit('notification', notificationResponse.data.notifications)
        }
      } catch (error) {
        console.error('❌ ポーリングエラー:', error)
      }
    }
    
    // 初回実行
    poll()
    
    // 定期実行
    this.pollingInterval = setInterval(poll, interval)
  }
  
  // SSE接続（参考実装）
  connectSSE(userId, classCode) {
    const url = `/api/realtime/events?userId=${userId}&classCode=${classCode}`
    this.eventSource = new EventSource(url)
    
    this.eventSource.onopen = () => {
      this.isConnected = true
      console.log('✅ リアルタイム接続成功')
      this.emit('connected')
    }
    
    this.eventSource.onerror = (error) => {
      console.error('❌ リアルタイム接続エラー:', error)
      this.isConnected = false
      this.emit('error', error)
    }
    
    // イベントリスナー
    this.eventSource.addEventListener('help-request', (event) => {
      const data = JSON.parse(event.data)
      this.emit('help-request', data)
    })
    
    this.eventSource.addEventListener('progress-update', (event) => {
      const data = JSON.parse(event.data)
      this.emit('progress-update', data)
    })
    
    this.eventSource.addEventListener('notification', (event) => {
      const data = JSON.parse(event.data)
      this.emit('notification', data)
    })
  }
  
  // 接続解除
  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    
    this.isConnected = false
    console.log('🔌 リアルタイム接続を切断しました')
  }
  
  // イベントリスナーを登録
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }
  
  // イベントを発火
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ イベント${eventName}のコールバックエラー:`, error)
        }
      })
    }
  }
  
  // リアルタイム通知を表示
  showNotification(title, message, type = 'info') {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm animate-slide-in-right`
    
    const colors = {
      'info': 'bg-blue-500',
      'success': 'bg-green-500',
      'warning': 'bg-yellow-500',
      'error': 'bg-red-500',
      'help': 'bg-orange-500'
    }
    
    const icons = {
      'info': 'fa-info-circle',
      'success': 'fa-check-circle',
      'warning': 'fa-exclamation-triangle',
      'error': 'fa-times-circle',
      'help': 'fa-hand-paper'
    }
    
    notification.innerHTML = `
      <div class="${colors[type]} text-white p-4 rounded-lg">
        <div class="flex items-start">
          <i class="fas ${icons[type]} text-2xl mr-3 mt-1"></i>
          <div class="flex-1">
            <h4 class="font-bold text-lg mb-1">${title}</h4>
            <p class="text-sm">${message}</p>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  class="ml-2 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // 音を鳴らす（オプション）
    if (type === 'help' || type === 'warning') {
      this.playNotificationSound()
    }
    
    // 5秒後に自動で消す
    setTimeout(() => {
      notification.style.animation = 'slide-out-right 0.3s ease-out'
      setTimeout(() => notification.remove(), 300)
    }, 5000)
  }
  
  // 通知音を鳴らす
  playNotificationSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }
}

// グローバルインスタンスを作成
window.realtimeManager = new RealtimeCommunicationManager()
window.RealtimeCommunicationManager = RealtimeCommunicationManager

// CSSアニメーションを追加
const style = document.createElement('style')
style.textContent = `
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slide-out-right {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
`
document.head.appendChild(style)

console.log('✅ リアルタイム通信機能を初期化しました')
