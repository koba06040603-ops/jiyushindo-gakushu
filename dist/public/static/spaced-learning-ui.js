/**
 * 分散学習UI - 復習スケジュールと通知
 * 作成日: 2026-01-29
 */

class SpacedLearningUI {
  constructor() {
    this.studentId = null;
    this.todayReviewCount = 0;
    this.init();
  }

  init() {
    // ログイン中のユーザー情報を取得
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.studentId = user.user_id;
      
      // 児童の場合のみ復習機能を表示
      if (user.role === 'student') {
        this.loadReviewData();
        this.setupNotifications();
      }
    }
  }

  /**
   * 復習データを読み込み
   */
  async loadReviewData() {
    if (!this.studentId) return;

    try {
      // 今日の復習予定数を取得
      const countResponse = await fetch(`/api/spaced-learning/review-count/${this.studentId}`);
      const countData = await countResponse.json();
      
      if (countData.success) {
        this.todayReviewCount = countData.count;
        this.updateReviewBadge();
      }

      // 週次スケジュールを取得
      const scheduleResponse = await fetch(`/api/spaced-learning/weekly-schedule/${this.studentId}`);
      const scheduleData = await scheduleResponse.json();
      
      if (scheduleData.success) {
        this.renderWeeklySchedule(scheduleData.schedule);
      }

      // 習熟度統計を取得
      const statsResponse = await fetch(`/api/spaced-learning/mastery-stats/${this.studentId}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        this.renderMasteryStats(statsData.stats);
      }

      // 忘却リスクを取得
      const riskResponse = await fetch(`/api/spaced-learning/forgetting-risk/${this.studentId}`);
      const riskData = await riskResponse.json();
      
      if (riskData.success && riskData.recommendations.length > 0) {
        this.showForgettingRiskAlert(riskData.recommendations);
      }

    } catch (error) {
      console.error('復習データ読み込みエラー:', error);
    }
  }

  /**
   * 復習バッジを更新
   */
  updateReviewBadge() {
    // ヘッダーに復習バッジを表示
    let badge = document.getElementById('review-badge');
    if (!badge) {
      // バッジ要素を作成
      const header = document.querySelector('header') || document.querySelector('nav');
      if (header) {
        badge = document.createElement('div');
        badge.id = 'review-badge';
        badge.className = 'fixed top-4 right-4 z-50';
        header.appendChild(badge);
      }
    }

    if (badge && this.todayReviewCount > 0) {
      badge.innerHTML = `
        <div class="bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer hover:bg-yellow-600 transition-colors"
             onclick="spacedLearningUI.showReviewModal()">
          <i class="fas fa-calendar-check"></i>
          <span class="font-bold">今日の復習: ${this.todayReviewCount}件</span>
        </div>
      `;
      badge.style.display = 'block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  /**
   * 復習モーダルを表示
   */
  async showReviewModal() {
    if (!this.studentId) return;

    try {
      const response = await fetch(`/api/spaced-learning/today-reviews/${this.studentId}`);
      const data = await response.json();

      if (!data.success || data.reviews.length === 0) {
        alert('今日の復習予定はありません！');
        return;
      }

      // モーダルを作成
      const modal = document.createElement('div');
      modal.id = 'review-modal';
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-2xl font-bold flex items-center gap-2">
                  <i class="fas fa-calendar-check"></i>
                  今日の復習
                </h2>
                <p class="text-blue-100 mt-1">復習して記憶を強化しましょう！</p>
              </div>
              <button onclick="document.getElementById('review-modal').remove()" 
                      class="text-white hover:text-gray-200 text-2xl">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div class="mb-6">
              <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p class="text-sm text-gray-700">
                  <i class="fas fa-lightbulb text-yellow-500"></i>
                  <strong>分散学習効果：</strong>
                  適切な間隔を空けて復習することで、記憶が長期的に定着します。
                </p>
              </div>
            </div>

            <div class="space-y-4">
              ${data.reviews.map((review, index) => this.renderReviewItem(review, index)).join('')}
            </div>
          </div>

          <div class="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
            <button onclick="document.getElementById('review-modal').remove()" 
                    class="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition-colors">
              閉じる
            </button>
            <button onclick="spacedLearningUI.startReviewSession()" 
                    class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <i class="fas fa-play"></i>
              復習を開始
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

    } catch (error) {
      console.error('復習モーダル表示エラー:', error);
      alert('復習データの取得に失敗しました');
    }
  }

  /**
   * 復習アイテムをレンダリング
   */
  renderReviewItem(review, index) {
    const levelColors = {
      1: 'bg-gray-100 text-gray-700',
      2: 'bg-yellow-100 text-yellow-700',
      3: 'bg-blue-100 text-blue-700',
      4: 'bg-green-100 text-green-700',
      5: 'bg-purple-100 text-purple-700'
    };

    const levelNames = {
      1: '未学習',
      2: '学習中',
      3: '定着中',
      4: '習熟',
      5: '完全習得'
    };

    const color = levelColors[review.mastery_level] || 'bg-gray-100 text-gray-700';
    const levelName = levelNames[review.mastery_level] || '未設定';

    return `
      <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-semibold text-gray-500">カード #${review.card_id}</span>
              <span class="px-2 py-1 rounded text-xs font-semibold ${color}">
                ${levelName}
              </span>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-3">
              <div>
                <i class="fas fa-check-circle text-green-500"></i>
                正答率: <strong>${Math.round(review.avg_accuracy * 100)}%</strong>
              </div>
              <div>
                <i class="fas fa-redo text-blue-500"></i>
                復習回数: <strong>${review.total_reviews}回</strong>
              </div>
              <div>
                <i class="fas fa-fire text-orange-500"></i>
                連続正解: <strong>${review.consecutive_correct}回</strong>
              </div>
              <div>
                <i class="fas fa-clock text-purple-500"></i>
                次回: <strong>${Math.round(review.interval_days)}日後</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 復習セッションを開始
   */
  async startReviewSession() {
    try {
      const response = await fetch(`/api/spaced-learning/today-reviews/${this.studentId}`);
      const data = await response.json();

      if (!data.success || data.reviews.length === 0) {
        alert('復習する項目がありません');
        return;
      }

      // 最初の復習カードへ移動
      const firstReview = data.reviews[0];
      
      // モーダルを閉じる
      const modal = document.getElementById('review-modal');
      if (modal) modal.remove();

      // 学習カードページへ遷移（復習モード）
      window.location.href = `/learning-card.html?cardId=${firstReview.card_id}&reviewMode=true`;

    } catch (error) {
      console.error('復習セッション開始エラー:', error);
      alert('復習の開始に失敗しました');
    }
  }

  /**
   * 週次スケジュールをレンダリング
   */
  renderWeeklySchedule(schedule) {
    const container = document.getElementById('weekly-schedule-container');
    if (!container) return;

    const days = ['日', '月', '火', '水', '木', '金', '土'];
    
    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="fas fa-calendar-week text-blue-500"></i>
          今週の復習予定
        </h3>
        
        <div class="grid grid-cols-7 gap-2">
          ${schedule.map((day, index) => {
            const date = new Date(day.date);
            const dayName = days[date.getDay()];
            const isToday = day.date === new Date().toISOString().split('T')[0];
            
            return `
              <div class="text-center ${isToday ? 'bg-blue-50 border-2 border-blue-500' : 'border'} rounded-lg p-3">
                <div class="text-xs font-semibold text-gray-500 mb-1">${dayName}</div>
                <div class="text-lg font-bold ${day.scheduled_items_count > 0 ? 'text-blue-600' : 'text-gray-400'}">
                  ${day.scheduled_items_count}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  ${day.estimated_duration_minutes}分
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 習熟度統計をレンダリング
   */
  renderMasteryStats(stats) {
    const container = document.getElementById('mastery-stats-container');
    if (!container) return;

    const levels = [
      { level: 5, name: '完全習得', color: 'bg-purple-500', icon: 'fa-trophy' },
      { level: 4, name: '習熟', color: 'bg-green-500', icon: 'fa-star' },
      { level: 3, name: '定着中', color: 'bg-blue-500', icon: 'fa-check' },
      { level: 2, name: '学習中', color: 'bg-yellow-500', icon: 'fa-pencil' },
      { level: 1, name: '未学習', color: 'bg-gray-400', icon: 'fa-circle' }
    ];

    const total = stats.total || 1; // ゼロ除算を防ぐ

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="fas fa-chart-pie text-purple-500"></i>
          習熟度の分布
        </h3>
        
        <div class="space-y-3">
          ${levels.map(({ level, name, color, icon }) => {
            const count = stats[`level${level}`] || 0;
            const percentage = Math.round((count / total) * 100);
            
            return `
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <i class="fas ${icon} ${color.replace('bg-', 'text-')}"></i>
                    ${name}
                  </span>
                  <span class="text-sm font-bold text-gray-900">${count}件 (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="${color} h-2 rounded-full transition-all duration-500" 
                       style="width: ${percentage}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="mt-4 pt-4 border-t">
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-800">${total}</div>
            <div class="text-sm text-gray-500">学習項目総数</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 忘却リスクアラートを表示
   */
  showForgettingRiskAlert(recommendations) {
    const container = document.getElementById('forgetting-risk-container');
    if (!container) return;

    const highPriority = recommendations.filter(r => r.priority >= 4);
    
    if (highPriority.length === 0) return;

    container.innerHTML = `
      <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-lg font-bold text-red-800 mb-2">
              ⚠️ 忘却リスクがあります
            </h3>
            <p class="text-sm text-red-700 mb-3">
              以下の項目は記憶が薄れている可能性があります。早めの復習をお勧めします。
            </p>
            <div class="space-y-2">
              ${highPriority.map(rec => `
                <div class="bg-white p-3 rounded border border-red-200">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-semibold">カード #${rec.card_id}</span>
                    <span class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                      優先度: ${rec.priority}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">${rec.message}</p>
                </div>
              `).join('')}
            </div>
            <button onclick="spacedLearningUI.showReviewModal()" 
                    class="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors">
              今すぐ復習する
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 通知を設定
   */
  setupNotifications() {
    // ブラウザ通知の許可を確認
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 1時間ごとに復習予定を確認
    setInterval(() => {
      this.checkAndNotify();
    }, 60 * 60 * 1000);

    // 初回チェック
    setTimeout(() => {
      this.checkAndNotify();
    }, 5000);
  }

  /**
   * 復習通知をチェックして送信
   */
  async checkAndNotify() {
    if (!this.studentId) return;

    try {
      const response = await fetch(`/api/spaced-learning/review-count/${this.studentId}`);
      const data = await response.json();

      if (data.success && data.count > 0) {
        this.sendNotification(data.count);
      }
    } catch (error) {
      console.error('通知チェックエラー:', error);
    }
  }

  /**
   * ブラウザ通知を送信
   */
  sendNotification(count) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('📚 復習の時間です！', {
        body: `${count}件の復習予定があります。分散学習で記憶を強化しましょう！`,
        icon: '/static/icon-review.png',
        badge: '/static/badge-review.png',
        tag: 'spaced-learning-review',
        requireInteraction: false
      });
    }
  }
}

// グローバルインスタンス
const spacedLearningUI = new SpacedLearningUI();

// ページロード時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    spacedLearningUI.init();
  });
} else {
  spacedLearningUI.init();
}
