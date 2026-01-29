/**
 * 学習カード - 分散学習統合
 * 復習記録と品質評価機能
 */

// 学習カード完了時に復習を記録
async function recordCardCompletion(cardId, studentId, isCorrect, responseTime) {
  // URLパラメータから復習モードかチェック
  const urlParams = new URLSearchParams(window.location.search);
  const isReviewMode = urlParams.get('reviewMode') === 'true';

  if (!isReviewMode) {
    // 通常の学習モードでは復習記録しない
    return;
  }

  try {
    // 品質評価を自動判定
    const qualityRating = calculateQualityRating(isCorrect, responseTime);

    // 復習記録を送信
    const response = await fetch('/api/spaced-learning/record-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: studentId,
        cardId: cardId,
        qualityRating: qualityRating,
        isCorrect: isCorrect,
        responseTime: responseTime,
        reviewType: 'scheduled',
        srlStage: 'performance'
      })
    });

    const data = await response.json();

    if (data.success) {
      // 復習結果をフィードバック
      showReviewFeedback(data.mastery);
    }

  } catch (error) {
    console.error('復習記録エラー:', error);
  }
}

/**
 * 品質評価を計算
 * SuperMemo SM-2の品質指標 (0-5)
 */
function calculateQualityRating(isCorrect, responseTime) {
  if (!isCorrect) {
    // 不正解
    if (responseTime < 30) {
      return 1; // 不正解だが少し思い出せた
    } else {
      return 0; // 完全に忘れた
    }
  }

  // 正解の場合、回答時間で判定
  if (responseTime < 10) {
    return 5; // 完璧（10秒以内）
  } else if (responseTime < 30) {
    return 4; // 正解、少し迷った（30秒以内）
  } else {
    return 3; // 正解、でも困難（30秒以上）
  }
}

/**
 * 復習フィードバックを表示
 */
function showReviewFeedback(mastery) {
  const levelNames = {
    1: '未学習',
    2: '学習中',
    3: '定着中',
    4: '習熟',
    5: '完全習得'
  };

  const levelColors = {
    1: 'gray',
    2: 'yellow',
    3: 'blue',
    4: 'green',
    5: 'purple'
  };

  const levelName = levelNames[mastery.mastery_level] || '未設定';
  const color = levelColors[mastery.mastery_level] || 'gray';
  const nextReviewDate = new Date(mastery.next_review_date);
  const daysUntilNext = Math.ceil((nextReviewDate - new Date()) / (1000 * 60 * 60 * 24));

  // フィードバックモーダルを表示
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div class="text-center">
        <div class="mb-4">
          <i class="fas fa-chart-line text-${color}-500 text-5xl"></i>
        </div>
        
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          復習完了！
        </h3>
        
        <div class="bg-${color}-100 border-l-4 border-${color}-500 p-4 rounded mb-4">
          <div class="text-lg font-bold text-${color}-800 mb-2">
            現在の習熟度: ${levelName}
          </div>
          <div class="text-sm text-${color}-700">
            正答率: ${Math.round(mastery.avg_accuracy * 100)}% 
            (${mastery.correct_reviews}/${mastery.total_reviews}回正解)
          </div>
        </div>

        <div class="bg-blue-50 p-4 rounded mb-4">
          <div class="text-sm text-gray-700 mb-2">
            <i class="fas fa-calendar-alt text-blue-500"></i>
            <strong>次回の復習:</strong>
          </div>
          <div class="text-lg font-bold text-blue-800">
            ${daysUntilNext}日後 (${nextReviewDate.toLocaleDateString('ja-JP')})
          </div>
        </div>

        <div class="text-sm text-gray-600 mb-6">
          <i class="fas fa-lightbulb text-yellow-500"></i>
          分散学習効果により、記憶が長期的に定着します
        </div>

        <div class="flex gap-3">
          <button onclick="this.closest('.fixed').remove()" 
                  class="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition-colors">
            閉じる
          </button>
          <button onclick="continueReviewSession()" 
                  class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            次の復習へ
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

/**
 * 復習セッションを継続
 */
async function continueReviewSession() {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData) return;

  try {
    const response = await fetch(`/api/spaced-learning/today-reviews/${userData.user_id}`);
    const data = await response.json();

    if (data.success && data.reviews.length > 0) {
      // 次の復習カードへ移動
      const nextReview = data.reviews[0];
      window.location.href = `/learning-card.html?cardId=${nextReview.card_id}&reviewMode=true`;
    } else {
      // 復習完了
      alert('すべての復習が完了しました！お疲れ様でした！');
      window.location.href = '/student-dashboard.html';
    }

  } catch (error) {
    console.error('復習継続エラー:', error);
    // モーダルを閉じる
    document.querySelector('.fixed')?.remove();
  }
}

/**
 * 復習開始バナーを表示
 */
function showReviewModeBanner() {
  const urlParams = new URLSearchParams(window.location.search);
  const isReviewMode = urlParams.get('reviewMode') === 'true';

  if (!isReviewMode) return;

  const banner = document.createElement('div');
  banner.className = 'fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-3 text-center z-40 shadow-lg';
  banner.innerHTML = `
    <div class="flex items-center justify-center gap-2">
      <i class="fas fa-redo animate-spin"></i>
      <span class="font-bold">復習モード</span>
      <span class="text-sm">- 記憶を強化しています</span>
    </div>
  `;

  document.body.prepend(banner);

  // メインコンテンツを下にずらす
  const main = document.querySelector('main');
  if (main) {
    main.style.marginTop = '60px';
  }
}

// ページロード時に復習モードバナーを表示
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showReviewModeBanner);
} else {
  showReviewModeBanner();
}

// 既存の学習カード完了関数をフック
// 注: 実際の学習カードページの完了関数名に合わせて調整が必要
if (typeof window.onCardComplete === 'function') {
  const originalOnCardComplete = window.onCardComplete;
  window.onCardComplete = async function(cardId, studentId, isCorrect, responseTime) {
    // 元の処理を実行
    await originalOnCardComplete(cardId, studentId, isCorrect, responseTime);
    
    // 復習記録を追加
    await recordCardCompletion(cardId, studentId, isCorrect, responseTime);
  };
}
