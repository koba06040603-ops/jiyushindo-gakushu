/**
 * ========================================
 * 視覚的フィードバックシステム
 * ========================================
 * 目的: 正解・不正解アニメーション、進捗表示、視覚的な学習効果を向上
 * 対象: 視覚型学習者に最適化された即時フィードバック
 */

class VisualFeedback {
  constructor() {
    this.colors = {
      correct: '#10b981',    // 緑
      incorrect: '#ef4444',  // 赤
      hint: '#3b82f6',       // 青
      progress: '#8b5cf6',   // 紫
      warning: '#f59e0b'     // 橙
    };
    
    this.animations = {
      duration: 600,  // ms
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };
    
    this.initStyles();
    console.log('✅ VisualFeedback 初期化完了');
  }

  /**
   * CSSアニメーションスタイルを追加
   */
  initStyles() {
    if (document.getElementById('visual-feedback-styles')) {
      return; // すでに追加済み
    }

    const style = document.createElement('style');
    style.id = 'visual-feedback-styles';
    style.textContent = `
      /* 正解アニメーション */
      @keyframes correct-pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(16, 185, 129, 0.3); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }

      /* 不正解アニメーション */
      @keyframes incorrect-shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
      }

      /* ヒントアニメーション */
      @keyframes hint-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
      }

      /* 進捗リングアニメーション */
      @keyframes progress-fill {
        from { stroke-dashoffset: 283; }
      }

      /* 紙吹雪アニメーション */
      @keyframes confetti-fall {
        to {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }

      /* フェードイン */
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* フェードアウト */
      @keyframes fade-out {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
      }

      /* スライドアップ */
      @keyframes slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      /* バウンス */
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-20px); }
        60% { transform: translateY(-10px); }
      }

      /* 正解時のクラス */
      .correct-animation {
        animation: correct-pulse 0.6s ease-out;
        background-color: rgba(16, 185, 129, 0.1) !important;
        border-color: #10b981 !important;
      }

      /* 不正解時のクラス */
      .incorrect-animation {
        animation: incorrect-shake 0.5s ease-out;
        background-color: rgba(239, 68, 68, 0.1) !important;
        border-color: #ef4444 !important;
      }

      /* ヒント表示時のクラス */
      .hint-animation {
        animation: hint-glow 1.5s ease-in-out infinite;
      }

      /* 紙吹雪 */
      .confetti {
        position: fixed;
        width: 10px;
        height: 10px;
        pointer-events: none;
        z-index: 9999;
      }

      /* 進捗リング */
      .progress-ring {
        transform: rotate(-90deg);
      }

      .progress-ring-circle {
        transition: stroke-dashoffset 0.5s ease;
      }

      /* バッジアニメーション */
      .badge-appear {
        animation: bounce 0.8s ease-out;
      }

      /* スコア表示 */
      .score-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        animation: fade-in 0.3s ease-out;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 正解アニメーション
   * @param {HTMLElement} element - アニメーション対象の要素
   */
  showCorrectAnimation(element) {
    if (!element) return;

    // クラスを追加
    element.classList.add('correct-animation');
    
    // アニメーション終了後にクラスを削除
    setTimeout(() => {
      element.classList.remove('correct-animation');
    }, this.animations.duration);

    // 紙吹雪を表示
    this.createConfetti(element.parentElement || document.body);
  }

  /**
   * 不正解アニメーション
   * @param {HTMLElement} element - アニメーション対象の要素
   */
  showIncorrectAnimation(element) {
    if (!element) return;

    element.classList.add('incorrect-animation');
    
    setTimeout(() => {
      element.classList.remove('incorrect-animation');
    }, 500);
  }

  /**
   * ヒントアニメーション
   * @param {HTMLElement} element - アニメーション対象の要素
   */
  showHintAnimation(element) {
    if (!element) return;

    element.classList.add('hint-animation');
    
    // 3秒後に自動削除
    setTimeout(() => {
      element.classList.remove('hint-animation');
    }, 3000);
  }

  /**
   * 紙吹雪を生成
   * @param {HTMLElement} container - 紙吹雪を表示するコンテナ
   */
  createConfetti(container) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      
      container.appendChild(confetti);
      
      // アニメーション開始
      this.animateConfetti(confetti, Math.random() * 4 - 2, Math.random() * 2 + 3);
      
      // 5秒後に削除
      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  }

  /**
   * 紙吹雪をアニメーション
   */
  animateConfetti(element, vx, vy) {
    element.style.animation = 'confetti-fall 3s ease-out forwards';
  }

  /**
   * 進捗リングを表示
   * @param {number} percentage - 進捗率（0-100）
   * @param {string} containerId - コンテナのID
   */
  showProgressRing(percentage, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return;
    }

    // 既存のリングを削除
    container.innerHTML = '';

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    svg.setAttribute('class', 'progress-ring');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'progress-ring-circle');
    circle.setAttribute('stroke', this.colors.progress);
    circle.setAttribute('stroke-width', '8');
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('r', radius);
    circle.setAttribute('cx', '60');
    circle.setAttribute('cy', '60');
    circle.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);
    circle.setAttribute('stroke-dashoffset', offset);

    svg.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '60');
    text.setAttribute('y', '70');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '24');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', this.colors.progress);
    text.textContent = `${Math.round(percentage)}%`;

    svg.appendChild(text);
    container.appendChild(svg);
  }

  /**
   * スコアポップアップを表示
   * @param {number} score - スコア（0-100）
   * @param {string} message - メッセージ
   */
  showScorePopup(score, message = '') {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.innerHTML = `
      <div style="
        background: white;
        padding: 2rem 3rem;
        border-radius: 1rem;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        text-align: center;
      ">
        <div style="font-size: 4rem; font-weight: bold; color: ${this.colors.progress};">
          ${score}点
        </div>
        ${message ? `<div style="margin-top: 1rem; font-size: 1.2rem; color: #666;">${message}</div>` : ''}
      </div>
    `;

    document.body.appendChild(popup);

    // 3秒後にフェードアウト
    setTimeout(() => {
      popup.style.animation = 'fade-out 0.3s ease-out forwards';
      setTimeout(() => popup.remove(), 300);
    }, 3000);
  }

  /**
   * バッジアニメーション
   * @param {HTMLElement} badgeElement - バッジ要素
   */
  showBadgeAnimation(badgeElement) {
    if (!badgeElement) return;

    badgeElement.classList.add('badge-appear');
    
    setTimeout(() => {
      badgeElement.classList.remove('badge-appear');
    }, 800);
  }

  /**
   * スライドアップアニメーション
   * @param {HTMLElement} element - アニメーション対象
   */
  slideUp(element) {
    if (!element) return;
    element.style.animation = 'slide-up 0.5s ease-out forwards';
  }

  /**
   * フェードイン
   * @param {HTMLElement} element - アニメーション対象
   */
  fadeIn(element) {
    if (!element) return;
    element.style.animation = 'fade-in 0.3s ease-out forwards';
  }

  /**
   * フェードアウト
   * @param {HTMLElement} element - アニメーション対象
   * @param {Function} callback - アニメーション終了後のコールバック
   */
  fadeOut(element, callback) {
    if (!element) return;
    element.style.animation = 'fade-out 0.3s ease-out forwards';
    setTimeout(() => {
      if (callback) callback();
    }, 300);
  }

  /**
   * 数値カウントアップアニメーション
   * @param {HTMLElement} element - 数値を表示する要素
   * @param {number} start - 開始値
   * @param {number} end - 終了値
   * @param {number} duration - アニメーション時間（ms）
   */
  animateCount(element, start, end, duration = 1000) {
    if (!element) return;

    const range = end - start;
    const startTime = Date.now();

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * easeProgress);
      
      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }

  /**
   * ローディングスピナーを表示
   * @param {string} containerId - コンテナID
   */
  showLoadingSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div style="
          border: 4px solid rgba(139, 92, 246, 0.2);
          border-top: 4px solid #8b5cf6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        "></div>
        <p style="margin-top: 1rem; color: #666;">読み込み中...</p>
      </div>
    `;

    // スピンアニメーション
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * エラーメッセージを表示
   * @param {string} message - エラーメッセージ
   * @param {string} containerId - コンテナID
   */
  showError(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="
        background-color: #fee;
        border: 2px solid ${this.colors.incorrect};
        border-radius: 0.5rem;
        padding: 1rem;
        color: ${this.colors.incorrect};
        text-align: center;
      ">
        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <p style="font-weight: bold;">${message}</p>
      </div>
    `;
  }

  /**
   * 成功メッセージを表示
   * @param {string} message - 成功メッセージ
   * @param {string} containerId - コンテナID
   */
  showSuccess(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="
        background-color: #efe;
        border: 2px solid ${this.colors.correct};
        border-radius: 0.5rem;
        padding: 1rem;
        color: ${this.colors.correct};
        text-align: center;
      ">
        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <p style="font-weight: bold;">${message}</p>
      </div>
    `;
  }
}

// グローバルインスタンスを作成
window.visualFeedback = new VisualFeedback();

console.log('✅ visual-feedback.js 読み込み完了');
