/**
 * 分散学習状況表示コンポーネント
 * Spaced Learning Progress Display Component
 * 
 * 進捗ボードに分散学習の状況を表示
 * 
 * @module spacedLearningProgressUI
 * @since 2026-01-29
 */

// =====================================================
// グローバル変数
// =====================================================
let currentStudentId = null;
let spacedLearningData = {
  stats: null,
  todayReviews: [],
  weeklySchedule: [],
  forgettingRisk: []
};

// =====================================================
// データ取得関数
// =====================================================

/**
 * 分散学習データを取得
 */
async function loadSpacedLearningData(studentId) {
  currentStudentId = studentId;
  
  try {
    // 並列でデータを取得
    const [statsRes, reviewsRes, scheduleRes, riskRes] = await Promise.all([
      fetch(`/api/spaced-learning/mastery-stats/${studentId}`),
      fetch(`/api/spaced-learning/today-reviews/${studentId}`),
      fetch(`/api/spaced-learning/weekly-schedule/${studentId}`),
      fetch(`/api/spaced-learning/forgetting-risk/${studentId}?limit=5`)
    ]);
    
    const statsData = await statsRes.json();
    const reviewsData = await reviewsRes.json();
    const scheduleData = await scheduleRes.json();
    const riskData = await riskRes.json();
    
    if (statsData.success) {
      spacedLearningData.stats = statsData.total_cards > 0 ? {
        ...statsData,
        new_cards: statsData.new_cards || 0,
        learning_cards: statsData.learning_cards || 0,
        review_cards: statsData.review_cards || 0,
        mastered_cards: statsData.mastered_cards || 0,
        avg_mastery_level: (statsData.avg_mastery_level || 0),
        avg_leitner_box: (statsData.avg_leitner_box || 0)
      } : null;
    }
    
    if (reviewsData.success) {
      spacedLearningData.todayReviews = reviewsData.reviews || [];
    }
    
    if (scheduleData.success) {
      spacedLearningData.weeklySchedule = scheduleData.schedule || [];
    }
    
    if (riskData.success) {
      spacedLearningData.forgettingRisk = riskData.recommendations || [];
    }
    
    return spacedLearningData;
  } catch (error) {
    console.error('分散学習データ取得エラー:', error);
    return spacedLearningData;
  }
}

// =====================================================
// UI描画関数
// =====================================================

/**
 * 分散学習サマリーカードを描画
 */
function renderSpacedLearningSummary(containerId) {
  const container = document.getElementById(containerId);
  if (!container || !spacedLearningData.stats) {
    return;
  }
  
  const stats = spacedLearningData.stats;
  const totalCards = stats.total_cards || 0;
  
  // パーセンテージ計算
  const newPercent = totalCards > 0 ? Math.round((stats.new_cards / totalCards) * 100) : 0;
  const learningPercent = totalCards > 0 ? Math.round((stats.learning_cards / totalCards) * 100) : 0;
  const reviewPercent = totalCards > 0 ? Math.round((stats.review_cards / totalCards) * 100) : 0;
  const masteredPercent = totalCards > 0 ? Math.round((stats.mastered_cards / totalCards) * 100) : 0;
  
  // 習熟度バッジの色
  const masteryColor = stats.avg_mastery_level >= 0.8 ? 'green' :
                       stats.avg_mastery_level >= 0.5 ? 'yellow' : 'red';
  
  container.innerHTML = `
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-bold text-purple-700">
          <i class="fas fa-brain mr-2"></i>分散学習の状況
        </h3>
        <span class="text-sm text-gray-600">
          <i class="fas fa-calendar-check mr-1"></i>今日の復習: 
          <span class="font-bold text-purple-600">${spacedLearningData.todayReviews.length}件</span>
        </span>
      </div>
      
      <!-- 学習段階の分布 -->
      <div class="grid grid-cols-4 gap-2 mb-4">
        <div class="bg-white rounded-lg p-3 text-center border-2 border-gray-200">
          <div class="text-2xl font-bold text-gray-600">${stats.new_cards}</div>
          <div class="text-xs text-gray-500">未学習</div>
          <div class="text-xs text-gray-400">${newPercent}%</div>
        </div>
        <div class="bg-white rounded-lg p-3 text-center border-2 border-blue-200">
          <div class="text-2xl font-bold text-blue-600">${stats.learning_cards}</div>
          <div class="text-xs text-gray-500">学習中</div>
          <div class="text-xs text-gray-400">${learningPercent}%</div>
        </div>
        <div class="bg-white rounded-lg p-3 text-center border-2 border-yellow-200">
          <div class="text-2xl font-bold text-yellow-600">${stats.review_cards}</div>
          <div class="text-xs text-gray-500">復習期</div>
          <div class="text-xs text-gray-400">${reviewPercent}%</div>
        </div>
        <div class="bg-white rounded-lg p-3 text-center border-2 border-green-200">
          <div class="text-2xl font-bold text-green-600">${stats.mastered_cards}</div>
          <div class="text-xs text-gray-500">習得済み</div>
          <div class="text-xs text-gray-400">${masteredPercent}%</div>
        </div>
      </div>
      
      <!-- 習熟度とLeitnerボックス -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">平均習熟度</span>
            <span class="px-2 py-1 rounded-full text-xs font-bold bg-${masteryColor}-100 text-${masteryColor}-700">
              ${Math.round(stats.avg_mastery_level * 100)}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-${masteryColor}-500 h-3 rounded-full transition-all duration-500" 
                 style="width: ${stats.avg_mastery_level * 100}%"></div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-600">Leitnerボックス</span>
            <span class="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Box ${stats.avg_leitner_box.toFixed(1)}
            </span>
          </div>
          <div class="flex gap-1">
            ${[1, 2, 3, 4, 5].map(box => `
              <div class="flex-1 h-3 rounded ${stats.avg_leitner_box >= box ? 'bg-purple-500' : 'bg-gray-200'}"></div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 今日の復習リストを描画
 */
function renderTodayReviews(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  
  const reviews = spacedLearningData.todayReviews;
  
  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
        <i class="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
        <div class="text-green-700 font-bold">今日の復習は完了しています！</div>
        <div class="text-sm text-green-600 mt-1">次の復習は明日以降です</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="bg-white rounded-lg p-4 border-2 border-orange-200">
      <h3 class="text-lg font-bold text-orange-700 mb-3">
        <i class="fas fa-bell mr-2"></i>今日の復習 (${reviews.length}件)
      </h3>
      <div class="space-y-2 max-h-96 overflow-y-auto">
        ${reviews.map(review => {
          const priorityColor = review.priority_score >= 70 ? 'red' :
                               review.priority_score >= 40 ? 'orange' : 'yellow';
          const reasonText = {
            'scheduled': '予定通り',
            'overdue': '期限超過',
            'struggling': '苦手',
            'reinforcement': '強化推奨',
            'srl_performance': '学習支援'
          }[review.reason] || review.reason;
          
          const daysOverdueText = review.days_overdue > 0 
            ? `<span class="text-red-600">${Math.floor(review.days_overdue)}日超過</span>`
            : '';
          
          return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-l-4 border-${priorityColor}-500">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-800">カード #${review.card_id}</span>
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-${priorityColor}-100 text-${priorityColor}-700">
                    ${reasonText}
                  </span>
                  ${daysOverdueText}
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  習熟度: ${Math.round(review.mastery_level * 100)}% | 
                  Box ${review.leitner_box} | 
                  優先度: ${Math.round(review.priority_score)}
                </div>
              </div>
              <button onclick="startReview(${review.card_id})" 
                      class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-colors">
                <i class="fas fa-play mr-1"></i>復習開始
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 週間復習スケジュールを描画
 */
function renderWeeklySchedule(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  
  const schedule = spacedLearningData.weeklySchedule;
  
  if (schedule.length === 0) {
    container.innerHTML = `
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <div class="text-gray-500">今週の復習予定はありません</div>
      </div>
    `;
    return;
  }
  
  const maxCount = Math.max(...schedule.map(s => s.count));
  
  container.innerHTML = `
    <div class="bg-white rounded-lg p-4">
      <h3 class="text-lg font-bold text-blue-700 mb-3">
        <i class="fas fa-calendar-week mr-2"></i>今週の復習予定
      </h3>
      <div class="space-y-2">
        ${schedule.map(day => {
          const date = new Date(day.date);
          const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
          const isToday = day.date === new Date().toISOString().split('T')[0];
          const barWidth = (day.count / maxCount) * 100;
          
          return `
            <div class="flex items-center gap-3 ${isToday ? 'bg-blue-50 p-2 rounded' : ''}">
              <div class="w-20 text-sm ${isToday ? 'font-bold text-blue-700' : 'text-gray-600'}">
                ${date.getMonth() + 1}/${date.getDate()}(${dayName})
              </div>
              <div class="flex-1">
                <div class="w-full bg-gray-200 rounded-full h-6">
                  <div class="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500" 
                       style="width: ${barWidth}%">
                    ${day.count}件
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 忘却リスクカードを描画
 */
function renderForgettingRisk(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  
  const risks = spacedLearningData.forgettingRisk;
  
  if (risks.length === 0) {
    container.innerHTML = `
      <div class="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
        <i class="fas fa-shield-alt text-green-500 text-2xl mb-2"></i>
        <div class="text-green-700 font-bold">忘却リスクは低いです</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="bg-white rounded-lg p-4 border-2 border-red-200">
      <h3 class="text-lg font-bold text-red-700 mb-3">
        <i class="fas fa-exclamation-triangle mr-2"></i>忘却リスク（要注意）
      </h3>
      <div class="space-y-2">
        ${risks.map(risk => {
          const riskLevel = risk.priority_score >= 70 ? 'high' : 
                           risk.priority_score >= 40 ? 'medium' : 'low';
          const riskColor = riskLevel === 'high' ? 'red' : 
                           riskLevel === 'medium' ? 'orange' : 'yellow';
          
          return `
            <div class="flex items-center justify-between p-3 bg-${riskColor}-50 rounded-lg border-l-4 border-${riskColor}-500">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <i class="fas fa-exclamation-circle text-${riskColor}-600"></i>
                  <span class="font-bold text-gray-800">カード #${risk.card_id}</span>
                  <span class="text-xs text-${riskColor}-600">
                    ${Math.floor(risk.days_overdue)}日超過
                  </span>
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  習熟度: ${Math.round(risk.mastery_level * 100)}% | Box ${risk.leitner_box}
                </div>
              </div>
              <button onclick="startReview(${risk.card_id})" 
                      class="px-3 py-1 bg-${riskColor}-500 hover:bg-${riskColor}-600 text-white rounded text-sm font-bold">
                復習
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * すべてのUIを描画
 */
async function renderAllSpacedLearningUI(studentId) {
  await loadSpacedLearningData(studentId);
  
  renderSpacedLearningSummary('spaced-learning-summary');
  renderTodayReviews('today-reviews-list');
  renderWeeklySchedule('weekly-schedule-chart');
  renderForgettingRisk('forgetting-risk-cards');
}

/**
 * 復習を開始（プレースホルダー）
 */
function startReview(cardId) {
  alert(`カード #${cardId} の復習を開始します`);
  // 実際の実装では、学習カード画面に遷移
  // window.location.href = `/learning-card.html?cardId=${cardId}&mode=review`;
}

// エクスポート
window.spacedLearningProgressUI = {
  loadSpacedLearningData,
  renderSpacedLearningSummary,
  renderTodayReviews,
  renderWeeklySchedule,
  renderForgettingRisk,
  renderAllSpacedLearningUI,
  startReview
};
