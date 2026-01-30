# モニタリングダッシュボード実装ガイド

## 📋 概要

システムの健全性をリアルタイムで監視するダッシュボード。

---

## 📊 監視項目

### システムメトリクス
- リクエスト数/秒
- レスポンスタイム（平均・95パーセンタイル）
- エラー率
- データベース接続状態

### アプリケーションメトリクス
- アクティブユーザー数
- 学習セッション数
- API呼び出し回数（エンドポイント別）
- キャッシュヒット率

### ビジネスメトリクス
- 新規登録ユーザー数
- 日次アクティブユーザー（DAU）
- 学習完了カード数
- 平均学習時間

---

## 🏗️ システム構成

```
Cloudflare Analytics
    ↓
Workers Analytics Engine
    ↓
Dashboard API
    ↓
React Dashboard UI
```

---

## 💻 バックエンド実装

### src/monitoring-dashboard.ts

```typescript
export class MonitoringDashboard {
  constructor(private db: D1Database, private analytics: any) {}

  async getSystemMetrics() {
    return {
      requests_per_second: await this.getRequestsPerSecond(),
      average_response_time: await this.getAverageResponseTime(),
      error_rate: await this.getErrorRate(),
      database_status: await this.checkDatabaseHealth()
    };
  }

  async getApplicationMetrics() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const activeUsers = await this.db.prepare(`
      SELECT COUNT(DISTINCT student_id) as count
      FROM learning_history
      WHERE created_at >= ?
    `).bind(oneDayAgo.toISOString()).first();

    const sessions = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM learning_sessions
      WHERE session_start >= ?
    `).bind(oneDayAgo.toISOString()).first();

    const apiCalls = await this.getApiCallsByEndpoint();

    return {
      active_users: activeUsers.count,
      learning_sessions: sessions.count,
      api_calls_by_endpoint: apiCalls,
      cache_hit_rate: await this.getCacheHitRate()
    };
  }

  async getBusinessMetrics() {
    const today = new Date().toISOString().split('T')[0];

    const newUsers = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM students
      WHERE DATE(created_at) = ?
    `).bind(today).first();

    const completedCards = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM learning_history
      WHERE DATE(created_at) = ? AND is_correct = TRUE
    `).bind(today).first();

    const avgLearningTime = await this.db.prepare(`
      SELECT AVG(time_spent_seconds) / 60 as avg_minutes
      FROM learning_history
      WHERE DATE(created_at) = ?
    `).bind(today).first();

    return {
      new_users_today: newUsers.count,
      completed_cards_today: completedCards.count,
      average_learning_time_minutes: avgLearningTime.avg_minutes
    };
  }

  private async getRequestsPerSecond() {
    // Cloudflare Analytics Engine から取得
    return this.analytics.getRequestsPerSecond();
  }

  private async getAverageResponseTime() {
    // パフォーマンスミドルウェアの統計から取得
    return globalThis.performanceMetrics?.averageResponseTime || 0;
  }

  private async getErrorRate() {
    const total = await this.analytics.getTotalRequests();
    const errors = await this.analytics.getErrorRequests();
    return (errors / total) * 100;
  }

  private async checkDatabaseHealth() {
    try {
      await this.db.prepare('SELECT 1').first();
      return 'connected';
    } catch (error) {
      return 'disconnected';
    }
  }

  private async getApiCallsByEndpoint() {
    // グローバル統計から取得
    return globalThis.apiCallStats || {};
  }

  private async getCacheHitRate() {
    const stats = globalThis.cacheStats || { hits: 0, misses: 0 };
    const total = stats.hits + stats.misses;
    return total > 0 ? (stats.hits / total) * 100 : 0;
  }
}
```

### API エンドポイント

**src/index.tsx**:
```typescript
app.get('/api/monitoring/dashboard', authMiddleware, requireRole('admin', 'teacher'), async (c) => {
  const dashboard = new MonitoringDashboard(c.env.DB, c.env.ANALYTICS);
  
  const [system, application, business] = await Promise.all([
    dashboard.getSystemMetrics(),
    dashboard.getApplicationMetrics(),
    dashboard.getBusinessMetrics()
  ]);
  
  return c.json({
    success: true,
    data: {
      system,
      application,
      business,
      timestamp: new Date().toISOString()
    }
  });
});

// リアルタイムメトリクス（WebSocket）
app.get('/api/monitoring/realtime', authMiddleware, requireRole('admin'), async (c) => {
  // WebSocket接続でリアルタイムデータ配信
  // 1秒ごとにメトリクス更新
});
```

---

## 🎨 フロントエンド実装

### public/monitoring-dashboard.html

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>モニタリングダッシュボード</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-6">
        <h1 class="text-3xl font-bold mb-6">システムモニタリング</h1>
        
        <!-- システムメトリクス -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm text-gray-500">リクエスト/秒</h3>
                <p class="text-3xl font-bold" id="requestsPerSecond">0</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm text-gray-500">平均レスポンスタイム</h3>
                <p class="text-3xl font-bold" id="responseTime">0ms</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm text-gray-500">エラー率</h3>
                <p class="text-3xl font-bold" id="errorRate">0%</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm text-gray-500">DB状態</h3>
                <p class="text-3xl font-bold" id="dbStatus">接続中</p>
            </div>
        </div>
        
        <!-- グラフ -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold mb-4">リクエスト数推移</h3>
                <canvas id="requestsChart"></canvas>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-semibold mb-4">レスポンスタイム</h3>
                <canvas id="responseTimeChart"></canvas>
            </div>
        </div>
    </div>
    
    <script>
        class MonitoringDashboard {
            constructor() {
                this.charts = {};
                this.initCharts();
                this.startPolling();
            }
            
            initCharts() {
                // リクエスト数グラフ
                const requestsCtx = document.getElementById('requestsChart').getContext('2d');
                this.charts.requests = new Chart(requestsCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'リクエスト数',
                            data: [],
                            borderColor: 'rgb(59, 130, 246)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                
                // レスポンスタイムグラフ
                const responseCtx = document.getElementById('responseTimeChart').getContext('2d');
                this.charts.responseTime = new Chart(responseCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'レスポンスタイム (ms)',
                            data: [],
                            borderColor: 'rgb(16, 185, 129)',
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
            
            async fetchMetrics() {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/monitoring/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.updateMetrics(data.data);
                }
            }
            
            updateMetrics(data) {
                // 数値更新
                document.getElementById('requestsPerSecond').textContent = 
                    data.system.requests_per_second.toFixed(2);
                document.getElementById('responseTime').textContent = 
                    data.system.average_response_time.toFixed(0) + 'ms';
                document.getElementById('errorRate').textContent = 
                    data.system.error_rate.toFixed(2) + '%';
                document.getElementById('dbStatus').textContent = 
                    data.system.database_status === 'connected' ? '✅ 接続中' : '❌ 切断';
                
                // グラフ更新
                const now = new Date().toLocaleTimeString();
                
                // リクエスト数グラフ
                this.charts.requests.data.labels.push(now);
                this.charts.requests.data.datasets[0].data.push(data.system.requests_per_second);
                if (this.charts.requests.data.labels.length > 20) {
                    this.charts.requests.data.labels.shift();
                    this.charts.requests.data.datasets[0].data.shift();
                }
                this.charts.requests.update();
                
                // レスポンスタイムグラフ
                this.charts.responseTime.data.labels.push(now);
                this.charts.responseTime.data.datasets[0].data.push(data.system.average_response_time);
                if (this.charts.responseTime.data.labels.length > 20) {
                    this.charts.responseTime.data.labels.shift();
                    this.charts.responseTime.data.datasets[0].data.shift();
                }
                this.charts.responseTime.update();
            }
            
            startPolling() {
                this.fetchMetrics();
                setInterval(() => this.fetchMetrics(), 5000);  // 5秒ごと
            }
        }
        
        // 初期化
        const dashboard = new MonitoringDashboard();
    </script>
</body>
</html>
```

---

## 🚨 アラート設定

### 閾値設定

```typescript
const ALERT_THRESHOLDS = {
  error_rate: 5,          // 5%以上
  response_time: 500,     // 500ms以上
  database_down: true,    // DB切断時
  cache_hit_rate: 50      // 50%未満
};

// アラート送信（メール・Slack等）
async function checkAndSendAlerts(metrics) {
  if (metrics.system.error_rate > ALERT_THRESHOLDS.error_rate) {
    await sendAlert('高エラー率検出', `現在のエラー率: ${metrics.system.error_rate}%`);
  }
  
  if (metrics.system.average_response_time > ALERT_THRESHOLDS.response_time) {
    await sendAlert('レスポンス時間遅延', `平均: ${metrics.system.average_response_time}ms`);
  }
}
```

---

## 📈 使用例

### 管理者ダッシュボードアクセス
```
https://jiyushindo-gakushu.com/monitoring-dashboard.html
```

### API直接アクセス
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://jiyushindo-gakushu.com/api/monitoring/dashboard
```

---

**作成日**: 2026-01-30
