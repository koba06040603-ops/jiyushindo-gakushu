/**
 * 共通UIコンポーネント - ローディング・エラー表示
 * すべてのページで統一されたUX提供
 */

// ============================================
// ローディングスピナー
// ============================================

/**
 * 統一されたローディングスピナーを表示
 * @param {string} containerId - 表示するコンテナのID
 * @param {string} message - 表示するメッセージ（オプション）
 */
function showLoading(containerId, message = '読み込み中...') {
  const container = document.getElementById(containerId)
  if (!container) return
  
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12">
      <div class="relative">
        <!-- スピナー -->
        <div class="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <!-- 中心の点滅ドット -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div class="w-4 h-4 bg-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p class="mt-4 text-gray-600 font-medium">${escapeHtml(message)}</p>
    </div>
  `
}

/**
 * インラインローディングスピナー（ボタン内など）
 */
function getInlineSpinner() {
  return `
    <svg class="inline-block animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  `
}

// ============================================
// エラー表示
// ============================================

export interface ErrorOptions {
  title?: string
  message: string
  details?: string
  actionLabel?: string
  actionHandler?: () => void
  type?: 'error' | 'warning' | 'info'
}

/**
 * 統一されたエラーメッセージを表示
 */
export function showError(containerId: string, options: ErrorOptions) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  const {
    title = 'エラーが発生しました',
    message,
    details,
    actionLabel = 'ページを再読み込み',
    actionHandler = () => window.location.reload(),
    type = 'error'
  } = options
  
  const colors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      icon: 'text-red-500',
      iconClass: 'fa-exclamation-circle',
      title: 'text-red-800',
      text: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      icon: 'text-yellow-500',
      iconClass: 'fa-exclamation-triangle',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      icon: 'text-blue-500',
      iconClass: 'fa-info-circle',
      title: 'text-blue-800',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  }
  
  const style = colors[type]
  
  container.innerHTML = `
    <div class="${style.bg} border-l-4 ${style.border} rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div class="flex items-start">
        <i class="fas ${style.iconClass} ${style.icon} text-3xl mr-4 mt-1"></i>
        <div class="flex-1">
          <h3 class="text-xl font-bold ${style.title} mb-2">${escapeHtml(title)}</h3>
          <p class="${style.text} mb-3 whitespace-pre-wrap">${escapeHtml(message)}</p>
          ${details ? `
            <details class="mt-3">
              <summary class="${style.text} font-semibold cursor-pointer hover:underline">
                詳細を表示
              </summary>
              <pre class="${style.text} text-sm mt-2 p-3 bg-white rounded border overflow-x-auto">${escapeHtml(details)}</pre>
            </details>
          ` : ''}
          <div class="mt-4">
            <button 
              id="errorActionBtn"
              class="px-4 py-2 ${style.button} text-white rounded-lg transition font-medium"
            >
              <i class="fas fa-redo mr-2"></i>${escapeHtml(actionLabel)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  
  // イベントハンドラーをアタッチ
  const btn = document.getElementById('errorActionBtn')
  if (btn) {
    btn.addEventListener('click', actionHandler)
  }
}

/**
 * トースト通知を表示（右上に一時表示）
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
  const toastId = `toast-${Date.now()}`
  
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    info: 'fa-info-circle'
  }
  
  const toast = document.createElement('div')
  toast.id = toastId
  toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-slide-in-right`
  toast.innerHTML = `
    <i class="fas ${icons[type]} text-xl"></i>
    <span class="font-medium">${escapeHtml(message)}</span>
    <button class="ml-2 hover:opacity-75" onclick="document.getElementById('${toastId}').remove()">
      <i class="fas fa-times"></i>
    </button>
  `
  
  document.body.appendChild(toast)
  
  // 自動削除
  setTimeout(() => {
    toast.classList.add('animate-slide-out-right')
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

// ============================================
// 成功メッセージ
// ============================================

/**
 * 成功メッセージを表示
 */
export function showSuccess(containerId: string, options: { title?: string; message: string; icon?: string }) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  const { title = '成功しました', message, icon = 'fa-check-circle' } = options
  
  container.innerHTML = `
    <div class="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div class="flex items-start">
        <i class="fas ${icon} text-green-500 text-3xl mr-4 mt-1"></i>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-green-800 mb-2">${escapeHtml(title)}</h3>
          <p class="text-green-700 whitespace-pre-wrap">${escapeHtml(message)}</p>
        </div>
      </div>
    </div>
  `
}

// ============================================
// プログレスバー
// ============================================

/**
 * プログレスバーを更新
 */
export function updateProgress(progressId: string, percent: number, label?: string) {
  const progressBar = document.getElementById(progressId)
  if (!progressBar) return
  
  progressBar.innerHTML = `
    <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      <div 
        class="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center text-white text-xs font-bold"
        style="width: ${Math.min(100, Math.max(0, percent))}%"
      >
        ${percent >= 10 ? `${Math.round(percent)}%` : ''}
      </div>
    </div>
    ${label ? `<p class="text-sm text-gray-600 mt-2 text-center">${escapeHtml(label)}</p>` : ''}
  `
}

// ============================================
// ユーティリティ
// ============================================

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ============================================
// CSS アニメーション（必要に応じて追加）
// ============================================

// Tailwind CSSに以下を追加してください：
/*
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

.animate-slide-out-right {
  animation: slide-out-right 0.3s ease-in;
}
*/
