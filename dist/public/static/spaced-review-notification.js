/**
 * 分散学習復習通知クライアント
 * Spaced Learning Review Notification Client
 * 
 * WebSocketを使用して復習タイミングを通知
 * 
 * @module spacedReviewNotification
 * @since 2026-01-29
 */

// =====================================================
// グローバル変数
// =====================================================
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
let heartbeatInterval = null;
let currentUserId = null;
let currentClassCode = null;
let currentRole = null;

// =====================================================
// WebSocket接続管理
// =====================================================

/**
 * WebSocket接続を初期化
 */
function connectSpacedReviewWebSocket(userId, classCode, role = 'student') {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('WebSocketは既に接続されています');
    return;
  }
  
  currentUserId = userId;
  currentClassCode = classCode;
  currentRole = role;
  
  // WebSocketプロトコルを決定
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/progress?userId=${userId}&classCode=${classCode}&role=${role}`;
  
  console.log('分散学習復習通知WebSocketに接続中...', wsUrl);
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('✅ 分散学習復習通知WebSocket接続成功');
    reconnectAttempts = 0;
    
    // ハートビート開始
    startHeartbeat();
    
    // 接続通知を表示
    showNotificationToast('復習通知システムに接続しました', 'success');
    
    // 初回復習チェック
    checkSpacedReview();
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleSpacedReviewMessage(data);
    } catch (error) {
      console.error('WebSocketメッセージ解析エラー:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ WebSocketエラー:', error);
    showNotificationToast('復習通知システムエラー', 'error');
  };
  
  ws.onclose = () => {
    console.log('WebSocket切断');
    stopHeartbeat();
    
    // 自動再接続
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`再接続試行 ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
      setTimeout(() => {
        connectSpacedReviewWebSocket(currentUserId, currentClassCode, currentRole);
      }, RECONNECT_DELAY);
    } else {
      showNotificationToast('復習通知システムとの接続が切断されました', 'warning');
    }
  };
}

/**
 * WebSocket切断
 */
function disconnectSpacedReviewWebSocket() {
  if (ws) {
    stopHeartbeat();
    ws.close();
    ws = null;
  }
}

/**
 * ハートビート開始
 */
function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000); // 30秒ごと
}

/**
 * ハートビート停止
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// =====================================================
// メッセージハンドラー
// =====================================================

/**
 * WebSocketメッセージを処理
 */
function handleSpacedReviewMessage(data) {
  console.log('WebSocketメッセージ受信:', data.type);
  
  switch (data.type) {
    case 'connected':
      console.log('接続確認:', data);
      break;
    
    case 'pong':
      // ハートビート応答
      break;
    
    case 'spaced_review_notification':
      // 復習通知
      handleReviewNotification(data.data);
      break;
    
    case 'teacher_spaced_review_reminder':
      // 教師からの復習リマインダー
      handleTeacherReminder(data.data);
      break;
    
    case 'reminder_sent':
      // 教師：リマインダー送信完了
      handleReminderSent(data.data);
      break;
    
    case 'error':
      console.error('WebSocketエラー:', data);
      showNotificationToast(data.message, 'error');
      break;
    
    default:
      console.log('不明なメッセージタイプ:', data.type);
  }
}

/**
 * 復習通知を処理
 */
function handleReviewNotification(data) {
  const { totalReviewCount, overdueCount, topReviews, message, priority } = data;
  
  if (totalReviewCount === 0) {
    // 復習なし
    showNotificationToast(message, 'success', {
      icon: '✅',
      duration: 3000
    });
    return;
  }
  
  // 復習が必要な場合
  const priorityIcon = priority === 'high' ? '🔴' : priority === 'normal' ? '🟡' : '🟢';
  const notificationHtml = `
    <div class="spaced-review-notification ${priority === 'high' ? 'urgent' : ''}">
      <div class="notification-header">
        <span class="icon">${priorityIcon}</span>
        <span class="title">${message}</span>
      </div>
      <div class="notification-body">
        <div class="review-stats">
          <span>復習カード: <strong>${totalReviewCount}枚</strong></span>
          ${overdueCount > 0 ? `<span class="overdue">期限超過: <strong>${overdueCount}枚</strong></span>` : ''}
        </div>
        ${topReviews && topReviews.length > 0 ? `
          <div class="top-reviews">
            <div class="label">優先度の高いカード:</div>
            ${topReviews.map(review => `
              <div class="review-card">
                <span class="card-title">${review.cardTitle || `カード #${review.cardNumber}`}</span>
                <span class="mastery">習熟度: ${review.masteryLevel}%</span>
                ${review.daysOverdue > 0 ? `<span class="overdue-days">${review.daysOverdue}日超過</span>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="notification-actions">
        <button onclick="goToSpacedReviewPage()" class="btn-primary">
          復習を開始
        </button>
        <button onclick="dismissNotification()" class="btn-secondary">
          後で
        </button>
      </div>
    </div>
  `;
  
  showNotificationModal(notificationHtml, priority);
  
  // 音声通知（オプション）
  if (priority === 'high' && overdueCount > 3) {
    playNotificationSound('urgent');
  } else if (totalReviewCount > 0) {
    playNotificationSound('normal');
  }
  
  // バッジ更新
  updateReviewBadge(totalReviewCount);
}

/**
 * 教師からの復習リマインダーを処理
 */
function handleTeacherReminder(data) {
  const { reviewCount, teacherMessage, senderName } = data;
  
  showNotificationToast(
    `${senderName}先生からのお知らせ: ${teacherMessage}`,
    'info',
    {
      icon: '👨‍🏫',
      duration: 10000,
      actions: [
        {
          label: '復習を開始',
          callback: () => goToSpacedReviewPage()
        }
      ]
    }
  );
  
  playNotificationSound('teacher');
  updateReviewBadge(reviewCount);
}

/**
 * リマインダー送信完了を処理（教師用）
 */
function handleReminderSent(data) {
  const { sentCount, totalUsers } = data;
  
  showNotificationToast(
    `復習リマインダーを${sentCount}/${totalUsers}人の生徒に送信しました`,
    'success',
    { icon: '📤', duration: 5000 }
  );
}

// =====================================================
// WebSocketメッセージ送信
// =====================================================

/**
 * 復習状況をチェック
 */
function checkSpacedReview() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'check_spaced_review' }));
  } else {
    console.warn('WebSocket未接続');
  }
}

/**
 * 復習リマインダーを送信（教師用）
 */
function sendSpacedReviewReminder(targetUserIds = 'all', customMessage = '') {
  if (currentRole !== 'teacher') {
    showNotificationToast('復習リマインダーを送信する権限がありません', 'error');
    return;
  }
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'send_spaced_review_reminder',
      targetUserIds,
      customMessage
    }));
  } else {
    showNotificationToast('WebSocket未接続です', 'error');
  }
}

// =====================================================
// UI ヘルパー関数
// =====================================================

/**
 * トースト通知を表示
 */
function showNotificationToast(message, type = 'info', options = {}) {
  const {
    icon = '🔔',
    duration = 5000,
    actions = []
  } = options;
  
  // 既存のトースト通知システムがある場合はそれを使用
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
    return;
  }
  
  // シンプルなトースト実装
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="icon">${icon}</span>
    <span class="message">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * モーダル通知を表示
 */
function showNotificationModal(htmlContent, priority = 'normal') {
  // 既存のモーダルがあれば削除
  const existingModal = document.getElementById('spaced-review-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'spaced-review-modal';
  modal.className = `notification-modal priority-${priority}`;
  modal.innerHTML = `
    <div class="modal-overlay" onclick="dismissNotification()"></div>
    <div class="modal-content">
      ${htmlContent}
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => {
    modal.classList.add('show');
  }, 100);
}

/**
 * 通知を閉じる
 */
function dismissNotification() {
  const modal = document.getElementById('spaced-review-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

/**
 * 復習ページに移動
 */
function goToSpacedReviewPage() {
  dismissNotification();
  window.location.href = '/spaced-learning-progress-demo.html';
}

/**
 * 復習バッジを更新
 */
function updateReviewBadge(count) {
  const badge = document.getElementById('review-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

/**
 * 通知音を再生
 */
function playNotificationSound(type = 'normal') {
  // ブラウザの通知音再生（オプション）
  try {
    const audio = new Audio();
    switch (type) {
      case 'urgent':
        audio.src = '/static/sounds/urgent.mp3';
        break;
      case 'teacher':
        audio.src = '/static/sounds/teacher.mp3';
        break;
      default:
        audio.src = '/static/sounds/notification.mp3';
    }
    audio.play().catch(err => console.log('音声再生エラー:', err));
  } catch (error) {
    console.log('音声再生未対応:', error);
  }
}

// =====================================================
// 自動チェック機能
// =====================================================

/**
 * 定期的な復習チェック（1時間ごと）
 */
function startAutoReviewCheck() {
  // ページ読み込み時に1回チェック
  checkSpacedReview();
  
  // 1時間ごとに自動チェック
  setInterval(() => {
    checkSpacedReview();
  }, 60 * 60 * 1000);
}

// エクスポート
window.spacedReviewNotification = {
  connect: connectSpacedReviewWebSocket,
  disconnect: disconnectSpacedReviewWebSocket,
  checkReview: checkSpacedReview,
  sendReminder: sendSpacedReviewReminder,
  startAutoCheck: startAutoReviewCheck
};
