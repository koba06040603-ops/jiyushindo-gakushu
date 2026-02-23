// API呼び出し監視とキャッシュ機構
class APIMonitor {
  constructor() {
    this.apiCalls = []
    this.cache = new Map()
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    }
  }

  // API呼び出しをログ
  logAPICall(endpoint, method, duration, success, error = null) {
    const call = {
      endpoint,
      method,
      duration,
      success,
      error,
      timestamp: new Date().toISOString()
    }
    
    this.apiCalls.push(call)
    
    // ローカルストレージに保存（最大100件）
    if (this.apiCalls.length > 100) {
      this.apiCalls.shift()
    }
    
    localStorage.setItem('api_monitor_calls', JSON.stringify(this.apiCalls.slice(-100)))
    
    console.log(`📊 API Call: ${method} ${endpoint} | ${duration}ms | ${success ? '✅' : '❌'}`)
    
    if (!success && error) {
      console.error(`   Error: ${error}`)
    }
  }

  // キャッシュからデータを取得
  getCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`💾 Cache HIT: ${key}`)
      return cached.data
    }
    console.log(`❌ Cache MISS: ${key}`)
    return null
  }

  // キャッシュにデータを保存
  setCache(key, data, ttl = 300000) { // デフォルト5分
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}ms)`)
  }

  // キャッシュをクリア
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key)
      console.log(`🗑️ Cache CLEAR: ${key}`)
    } else {
      this.cache.clear()
      console.log(`🗑️ Cache CLEAR ALL`)
    }
  }

  // リトライ付きAPI呼び出し
  async callWithRetry(fn, retries = this.retryConfig.maxRetries) {
    let lastError
    
    for (let i = 0; i <= retries; i++) {
      try {
        const result = await fn()
        return result
      } catch (error) {
        lastError = error
        
        if (i < retries) {
          const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, i)
          console.warn(`⚠️ API呼び出し失敗 (${i + 1}/${retries + 1})。${delay}ms後にリトライ...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }

  // 統計情報を取得
  getStatistics() {
    const total = this.apiCalls.length
    const success = this.apiCalls.filter(c => c.success).length
    const failed = total - success
    const avgDuration = this.apiCalls.reduce((sum, c) => sum + c.duration, 0) / total || 0
    
    return {
      total,
      success,
      failed,
      successRate: total > 0 ? (success / total * 100).toFixed(2) + '%' : '0%',
      avgDuration: avgDuration.toFixed(2) + 'ms',
      cacheSize: this.cache.size
    }
  }

  // 統計情報を表示
  printStatistics() {
    const stats = this.getStatistics()
    console.log('📊 API Monitor Statistics:')
    console.table(stats)
    return stats
  }
}

// グローバルインスタンス
const apiMonitor = new APIMonitor()

// axiosインターセプター設定
if (typeof axios !== 'undefined') {
  // リクエストインターセプター
  axios.interceptors.request.use(
    (config) => {
      config.metadata = { startTime: Date.now() }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // レスポンスインターセプター
  axios.interceptors.response.use(
    (response) => {
      const duration = Date.now() - response.config.metadata.startTime
      apiMonitor.logAPICall(
        response.config.url,
        response.config.method.toUpperCase(),
        duration,
        true
      )
      return response
    },
    (error) => {
      const duration = error.config?.metadata?.startTime 
        ? Date.now() - error.config.metadata.startTime 
        : 0
      apiMonitor.logAPICall(
        error.config?.url || 'unknown',
        error.config?.method?.toUpperCase() || 'unknown',
        duration,
        false,
        error.message
      )
      return Promise.reject(error)
    }
  )

  console.log('✅ API Monitor initialized with axios interceptors')
}

// グローバルエクスポート
window.apiMonitor = apiMonitor
