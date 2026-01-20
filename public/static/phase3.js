// ============================================
// Phase 3: 選択課題成果物・教師の見取り・振り返り機能
// ============================================

// グローバルステート
window.phase3State = {
  currentStudentId: null,
  currentCurriculumId: null,
  submissions: [],
  observations: [],
  reflections: []
}

// ============================================
// 1. 選択課題の成果物管理
// ============================================

// 成果物投稿モーダルを表示
window.showSubmissionModal = function(optionalProblemId, problemTitle) {
  const modalHtml = `
    <div id="submissionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-upload mr-2 text-blue-600"></i>
            成果物を提出
          </h3>
          <button onclick="closeSubmissionModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <div class="mb-4 p-4 bg-blue-50 rounded-lg">
          <p class="font-bold text-blue-800">${problemTitle}</p>
        </div>
        
        <form id="submissionForm" class="space-y-4">
          <input type="hidden" id="optionalProblemId" value="${optionalProblemId}">
          
          <!-- 提出タイプ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">提出タイプ</label>
            <select id="submissionType" class="w-full p-2 border border-gray-300 rounded-lg">
              <option value="image">画像</option>
              <option value="text">テキスト</option>
              <option value="file">ファイル</option>
            </select>
          </div>
          
          <!-- 画像アップロード（デモ版では疑似） -->
          <div id="imageUploadSection">
            <label class="block text-sm font-medium text-gray-700 mb-2">画像を選択</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <i class="fas fa-image text-4xl text-gray-400 mb-2"></i>
              <p class="text-gray-600 mb-2">画像をドラッグ＆ドロップ<br>または</p>
              <button type="button" onclick="selectDemoImage()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                <i class="fas fa-folder-open mr-2"></i>デモ画像を選択
              </button>
              <div id="selectedImagePreview" class="mt-4 hidden">
                <img id="previewImage" class="max-w-full h-48 mx-auto rounded-lg shadow-md">
                <p id="imageName" class="text-sm text-gray-600 mt-2"></p>
              </div>
            </div>
          </div>
          
          <!-- 説明 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">説明・工夫した点</label>
            <textarea id="description" rows="4" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="どんな工夫をしましたか？頑張ったところは？"></textarea>
          </div>
          
          <!-- 自己評価 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">自己評価</label>
            <div class="flex gap-2">
              ${[1,2,3,4,5].map(i => `
                <button type="button" onclick="setSelfEvaluation(${i})" 
                  class="self-eval-btn flex-1 p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 transition"
                  data-rating="${i}">
                  <div class="text-2xl mb-1">${['😢','😕','😐','😊','😄'][i-1]}</div>
                  <div class="text-xs">${['もっと','まあまあ','普通','よくできた','とてもよい'][i-1]}</div>
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="selfEvaluation" value="3">
          </div>
          
          <!-- 自分のコメント -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ひとこと</label>
            <textarea id="selfComment" rows="2" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="やってみてどうだった？"></textarea>
          </div>
          
          <!-- ボタン -->
          <div class="flex gap-3">
            <button type="button" onclick="closeSubmissionModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold">
              キャンセル
            </button>
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">
              <i class="fas fa-paper-plane mr-2"></i>提出する
            </button>
          </div>
        </form>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  // フォーム送信
  document.getElementById('submissionForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await submitOptionalProblem()
  })
}

window.closeSubmissionModal = function() {
  const modal = document.getElementById('submissionModal')
  if (modal) modal.remove()
}

window.selectDemoImage = function() {
  // デモ画像を選択（実際の実装では file input を使用）
  const demoImages = [
    { url: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Math+Work+1', name: 'math-work-1.jpg' },
    { url: 'https://via.placeholder.com/400x300/06B6D4/FFFFFF?text=Math+Work+2', name: 'math-work-2.jpg' },
    { url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Math+Work+3', name: 'math-work-3.jpg' }
  ]
  
  const selected = demoImages[Math.floor(Math.random() * demoImages.length)]
  
  document.getElementById('selectedImagePreview').classList.remove('hidden')
  document.getElementById('previewImage').src = selected.url
  document.getElementById('imageName').textContent = selected.name
  
  // URLを保存
  window.selectedImageUrl = selected.url
  window.selectedImageName = selected.name
}

window.setSelfEvaluation = function(rating) {
  document.getElementById('selfEvaluation').value = rating
  
  // ボタンのスタイル更新
  document.querySelectorAll('.self-eval-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'bg-blue-50')
    btn.classList.add('border-gray-300')
  })
  
  const selectedBtn = document.querySelector(`[data-rating="${rating}"]`)
  selectedBtn.classList.remove('border-gray-300')
  selectedBtn.classList.add('border-blue-500', 'bg-blue-50')
}

window.submitOptionalProblem = async function() {
  const data = {
    student_id: window.phase3State.currentStudentId || 3,
    curriculum_id: window.phase3State.currentCurriculumId || 1,
    optional_problem_id: parseInt(document.getElementById('optionalProblemId').value),
    submission_type: document.getElementById('submissionType').value,
    file_url: window.selectedImageUrl || null,
    file_name: window.selectedImageName || null,
    description: document.getElementById('description').value,
    self_evaluation: parseInt(document.getElementById('selfEvaluation').value),
    self_comment: document.getElementById('selfComment').value
  }
  
  try {
    const response = await fetch('/api/optional-problems/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('✅ 成果物を提出しました！')
      closeSubmissionModal()
      loadSubmissions(data.student_id)
    } else {
      alert('❌ 提出に失敗しました')
    }
  } catch (error) {
    console.error('提出エラー:', error)
    alert('❌ エラーが発生しました')
  }
}

// 成果物一覧を読み込み
window.loadSubmissions = async function(studentId) {
  try {
    const response = await fetch(`/api/optional-problems/submissions/${studentId}`)
    const result = await response.json()
    
    if (result.success) {
      window.phase3State.submissions = result.submissions
      renderSubmissions(result.submissions)
    }
  } catch (error) {
    console.error('成果物取得エラー:', error)
  }
}

// 成果物一覧を表示
function renderSubmissions(submissions) {
  if (!submissions || submissions.length === 0) {
    return '<div class="text-center py-8 text-gray-500">まだ提出した成果物はありません</div>'
  }
  
  return submissions.map(sub => `
    <div class="bg-white rounded-lg shadow-md p-6 mb-4">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h4 class="font-bold text-lg text-gray-800">${sub.problem_title}</h4>
          <p class="text-sm text-gray-600">
            <i class="fas fa-clock mr-1"></i>
            ${new Date(sub.submitted_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold ${
          sub.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
          sub.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }">
          ${sub.difficulty_level}
        </span>
      </div>
      
      ${sub.file_url ? `
        <div class="mb-4">
          <img src="${sub.file_url}" class="w-full h-48 object-cover rounded-lg">
        </div>
      ` : ''}
      
      ${sub.description ? `
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-700">${sub.description}</p>
        </div>
      ` : ''}
      
      <div class="flex items-center gap-4 mb-4">
        <div>
          <span class="text-sm text-gray-600">自己評価:</span>
          <span class="ml-2">${'⭐'.repeat(sub.self_evaluation)}</span>
        </div>
        ${sub.self_comment ? `
          <div class="flex-1">
            <span class="text-sm text-gray-600">ひとこと:</span>
            <span class="ml-2 text-sm">${sub.self_comment}</span>
          </div>
        ` : ''}
      </div>
      
      ${sub.teacher_comment ? `
        <div class="border-t pt-4">
          <div class="flex items-start gap-2">
            <i class="fas fa-user-tie text-blue-600 mt-1"></i>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-700">先生のコメント</p>
              <p class="text-sm text-gray-600 mt-1">${sub.teacher_comment}</p>
              ${sub.teacher_evaluation ? `
                <div class="mt-2">
                  <span class="text-sm text-gray-600">評価:</span>
                  <span class="ml-2">${'⭐'.repeat(sub.teacher_evaluation)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      ` : `
        <div class="border-t pt-4">
          <button onclick="showTeacherCommentForm(${sub.id})" class="text-sm text-blue-600 hover:text-blue-700">
            <i class="fas fa-comment mr-1"></i>先生のコメントを追加
          </button>
        </div>
      `}
    </div>
  `).join('')
}

// 教師コメントフォームを表示
window.showTeacherCommentForm = function(submissionId) {
  const modalHtml = `
    <div id="teacherCommentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-comment-dots mr-2 text-blue-600"></i>
          先生のコメント
        </h3>
        
        <form id="teacherCommentForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">コメント</label>
            <textarea id="teacherComment" rows="4" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="頑張ったところや次へのアドバイスを書きましょう" required></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">評価</label>
            <div class="flex gap-2">
              ${[1,2,3,4,5].map(i => `
                <button type="button" onclick="setTeacherEvaluation(${i})" 
                  class="teacher-eval-btn flex-1 p-2 border-2 border-gray-300 rounded-lg hover:border-blue-500"
                  data-rating="${i}">
                  ${'⭐'.repeat(i)}
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="teacherEvaluation" value="3">
          </div>
          
          <div class="flex gap-3">
            <button type="button" onclick="closeTeacherCommentModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg">
              キャンセル
            </button>
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  document.getElementById('teacherCommentForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await submitTeacherComment(submissionId)
  })
}

window.closeTeacherCommentModal = function() {
  const modal = document.getElementById('teacherCommentModal')
  if (modal) modal.remove()
}

window.setTeacherEvaluation = function(rating) {
  document.getElementById('teacherEvaluation').value = rating
  
  document.querySelectorAll('.teacher-eval-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'bg-blue-50')
  })
  
  const selectedBtn = document.querySelector(`.teacher-eval-btn[data-rating="${rating}"]`)
  selectedBtn.classList.add('border-blue-500', 'bg-blue-50')
}

window.submitTeacherComment = async function(submissionId) {
  const data = {
    teacher_comment: document.getElementById('teacherComment').value,
    teacher_evaluation: parseInt(document.getElementById('teacherEvaluation').value)
  }
  
  try {
    const response = await fetch(`/api/optional-problems/submissions/${submissionId}/teacher-comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('✅ コメントを追加しました！')
      closeTeacherCommentModal()
      loadSubmissions(window.phase3State.currentStudentId || 3)
    }
  } catch (error) {
    console.error('コメント追加エラー:', error)
    alert('❌ エラーが発生しました')
  }
}

// ============================================
// 2. 教師の見取り機能
// ============================================

// 見取り記録モーダルを表示
window.showObservationModal = function(studentId, studentName) {
  window.phase3State.currentStudentId = studentId
  
  const modalHtml = `
    <div id="observationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-eye mr-2 text-green-600"></i>
            ${studentName}さんの見取り記録
          </h3>
          <button onclick="closeObservationModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <form id="observationForm" class="space-y-4">
          <!-- 記録日 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">記録日</label>
            <input type="date" id="observationDate" class="w-full p-2 border border-gray-300 rounded-lg" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          
          <!-- 観察タイプ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">観察の種類</label>
            <select id="observationType" class="w-full p-2 border border-gray-300 rounded-lg" required>
              <option value="learning_attitude">学習態度</option>
              <option value="collaboration">協働性</option>
              <option value="understanding">理解の深まり</option>
              <option value="creativity">創造性</option>
              <option value="challenge">挑戦する姿勢</option>
              <option value="other">その他</option>
            </select>
          </div>
          
          <!-- 観察内容 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">観察内容</label>
            <textarea id="observationText" rows="5" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="どのような様子を観察しましたか？" required></textarea>
          </div>
          
          <!-- 文脈・場面 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">文脈・場面</label>
            <input type="text" id="context" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="例：グループ活動中、発表の場面">
          </div>
          
          <!-- 関連活動 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">関連活動</label>
            <input type="text" id="relatedActivity" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="例：かけ算の筆算、選択課題3">
          </div>
          
          <!-- 非認知能力タグ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">非認知能力タグ（該当するものを選択）</label>
            <div class="grid grid-cols-2 gap-2">
              ${['粘り強さ', '自己調整', '協働性', '好奇心', 'メタ認知', '成長マインドセット'].map(tag => `
                <label class="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" class="non-cognitive-tag mr-2" value="${tag}">
                  <span class="text-sm">${tag}</span>
                </label>
              `).join('')}
            </div>
          </div>
          
          <!-- ポジティブ/成長点 -->
          <div>
            <label class="flex items-center">
              <input type="checkbox" id="isPositive" checked class="mr-2">
              <span class="text-sm font-medium text-gray-700">ポジティブな観察（強み・成長）</span>
            </label>
          </div>
          
          <!-- 保護者と共有 -->
          <div>
            <label class="flex items-center">
              <input type="checkbox" id="isSharedWithParents" class="mr-2">
              <span class="text-sm font-medium text-gray-700">保護者と共有する</span>
            </label>
          </div>
          
          <!-- ボタン -->
          <div class="flex gap-3">
            <button type="button" onclick="closeObservationModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold">
              キャンセル
            </button>
            <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">
              <i class="fas fa-save mr-2"></i>保存
            </button>
          </div>
        </form>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  document.getElementById('observationForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await submitObservation()
  })
}

window.closeObservationModal = function() {
  const modal = document.getElementById('observationModal')
  if (modal) modal.remove()
}

window.submitObservation = async function() {
  const selectedTags = Array.from(document.querySelectorAll('.non-cognitive-tag:checked'))
    .map(cb => cb.value)
    .join(',')
  
  const data = {
    student_id: window.phase3State.currentStudentId,
    curriculum_id: window.phase3State.currentCurriculumId || 1,
    observation_date: document.getElementById('observationDate').value,
    observation_type: document.getElementById('observationType').value,
    observation_text: document.getElementById('observationText').value,
    context: document.getElementById('context').value,
    related_activity: document.getElementById('relatedActivity').value,
    non_cognitive_tags: selectedTags,
    is_positive: document.getElementById('isPositive').checked,
    is_shared_with_parents: document.getElementById('isSharedWithParents').checked,
    created_by: 1 // デモ：教師ID
  }
  
  try {
    const response = await fetch('/api/teacher-observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('✅ 見取り記録を保存しました！')
      closeObservationModal()
      loadObservations(data.student_id)
    }
  } catch (error) {
    console.error('見取り記録エラー:', error)
    alert('❌ エラーが発生しました')
  }
}

// 見取り記録を読み込み
window.loadObservations = async function(studentId) {
  try {
    const response = await fetch(`/api/teacher-observations/${studentId}`)
    const result = await response.json()
    
    if (result.success) {
      window.phase3State.observations = result.observations
      renderObservations(result.observations)
    }
  } catch (error) {
    console.error('見取り取得エラー:', error)
  }
}

// 見取り記録を表示
function renderObservations(observations) {
  if (!observations || observations.length === 0) {
    return '<div class="text-center py-8 text-gray-500">まだ見取り記録はありません</div>'
  }
  
  return observations.map(obs => `
    <div class="bg-white rounded-lg shadow-md p-6 mb-4 ${obs.is_positive ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}">
      <div class="flex justify-between items-start mb-3">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${
            obs.observation_type === 'learning_attitude' ? 'bg-blue-100 text-blue-800' :
            obs.observation_type === 'collaboration' ? 'bg-purple-100 text-purple-800' :
            obs.observation_type === 'creativity' ? 'bg-pink-100 text-pink-800' :
            'bg-gray-100 text-gray-800'
          }">
            ${obs.observation_type}
          </span>
          ${obs.is_shared_with_parents ? '<span class="ml-2 text-xs text-gray-600"><i class="fas fa-share-alt mr-1"></i>保護者共有</span>' : ''}
        </div>
        <p class="text-sm text-gray-600">
          ${new Date(obs.observation_date).toLocaleDateString('ja-JP')}
        </p>
      </div>
      
      <p class="text-gray-800 mb-3">${obs.observation_text}</p>
      
      ${obs.context ? `
        <div class="mb-2">
          <span class="text-sm text-gray-600"><i class="fas fa-map-marker-alt mr-1"></i>場面:</span>
          <span class="text-sm text-gray-800 ml-1">${obs.context}</span>
        </div>
      ` : ''}
      
      ${obs.related_activity ? `
        <div class="mb-2">
          <span class="text-sm text-gray-600"><i class="fas fa-tasks mr-1"></i>関連活動:</span>
          <span class="text-sm text-gray-800 ml-1">${obs.related_activity}</span>
        </div>
      ` : ''}
      
      ${obs.non_cognitive_tags ? `
        <div class="flex flex-wrap gap-1 mt-3">
          ${obs.non_cognitive_tags.split(',').map(tag => `
            <span class="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">${tag.trim()}</span>
          `).join('')}
        </div>
      ` : ''}
      
      ${obs.unit_name ? `
        <div class="mt-3 text-xs text-gray-500">
          <i class="fas fa-book mr-1"></i>${obs.unit_name}
        </div>
      ` : ''}
    </div>
  `).join('')
}

// ============================================
// 3. 生徒の振り返り記録
// ============================================

// 振り返りモーダルを表示
window.showReflectionModal = function(studentId, studentName) {
  window.phase3State.currentStudentId = studentId
  
  const modalHtml = `
    <div id="reflectionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-pencil-alt mr-2 text-purple-600"></i>
            ${studentName}さんの振り返り
          </h3>
          <button onclick="closeReflectionModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <form id="reflectionForm" class="space-y-4">
          <!-- 振り返り日 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">振り返り日</label>
            <input type="date" id="reflectionDate" class="w-full p-2 border border-gray-300 rounded-lg" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          
          <!-- 振り返りタイプ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">振り返りの種類</label>
            <select id="reflectionType" class="w-full p-2 border border-gray-300 rounded-lg" required>
              <option value="daily">今日の振り返り</option>
              <option value="weekly">今週の振り返り</option>
              <option value="unit">単元の振り返り</option>
              <option value="project">プロジェクトの振り返り</option>
            </select>
          </div>
          
          <!-- 学んだこと -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>今日学んだこと
            </label>
            <textarea id="whatLearned" rows="3" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="どんなことを学びましたか？"></textarea>
          </div>
          
          <!-- わかったこと -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-check-circle text-green-500 mr-1"></i>わかったこと・できるようになったこと
            </label>
            <textarea id="whatUnderstood" rows="3" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="どんなことがわかりましたか？"></textarea>
          </div>
          
          <!-- むずかしかったこと -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-question-circle text-orange-500 mr-1"></i>むずかしかったこと・もっと知りたいこと
            </label>
            <textarea id="whatDifficult" rows="3" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="どんなことがむずかしかったですか？"></textarea>
          </div>
          
          <!-- 楽しかったこと -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-smile text-blue-500 mr-1"></i>楽しかったこと・おもしろかったこと
            </label>
            <textarea id="whatEnjoyed" rows="3" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="どんなことが楽しかったですか？"></textarea>
          </div>
          
          <!-- 次の目標 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-flag text-red-500 mr-1"></i>次の目標
            </label>
            <textarea id="nextGoals" rows="2" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="次はどんなことにチャレンジしたいですか？"></textarea>
          </div>
          
          <!-- 気分評価 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">今日の気分</label>
            <div class="flex gap-2">
              ${[1,2,3,4,5].map(i => `
                <button type="button" onclick="setMoodRating(${i})" 
                  class="mood-rating-btn flex-1 p-3 border-2 border-gray-300 rounded-lg hover:border-purple-500 transition"
                  data-rating="${i}">
                  <div class="text-2xl">${['😢','😕','😐','😊','😄'][i-1]}</div>
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="moodRating" value="3">
          </div>
          
          <!-- 努力評価 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">がんばり度</label>
            <div class="flex gap-2">
              ${[1,2,3,4,5].map(i => `
                <button type="button" onclick="setEffortRating(${i})" 
                  class="effort-rating-btn flex-1 p-2 border-2 border-gray-300 rounded-lg hover:border-purple-500"
                  data-rating="${i}">
                  ${'💪'.repeat(i)}
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="effortRating" value="3">
          </div>
          
          <!-- 理解度評価 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">わかった度</label>
            <div class="flex gap-2">
              ${[1,2,3,4,5].map(i => `
                <button type="button" onclick="setUnderstandingRating(${i})" 
                  class="understanding-rating-btn flex-1 p-2 border-2 border-gray-300 rounded-lg hover:border-purple-500"
                  data-rating="${i}">
                  ${'✨'.repeat(i)}
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="understandingRating" value="3">
          </div>
          
          <!-- ボタン -->
          <div class="flex gap-3">
            <button type="button" onclick="closeReflectionModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold">
              キャンセル
            </button>
            <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold">
              <i class="fas fa-save mr-2"></i>保存
            </button>
          </div>
        </form>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  document.getElementById('reflectionForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await submitReflection()
  })
}

window.closeReflectionModal = function() {
  const modal = document.getElementById('reflectionModal')
  if (modal) modal.remove()
}

window.setMoodRating = function(rating) {
  setRating('moodRating', 'mood-rating-btn', rating)
}

window.setEffortRating = function(rating) {
  setRating('effortRating', 'effort-rating-btn', rating)
}

window.setUnderstandingRating = function(rating) {
  setRating('understandingRating', 'understanding-rating-btn', rating)
}

function setRating(inputId, btnClass, rating) {
  document.getElementById(inputId).value = rating
  
  document.querySelectorAll(`.${btnClass}`).forEach(btn => {
    btn.classList.remove('border-purple-500', 'bg-purple-50')
    btn.classList.add('border-gray-300')
  })
  
  const selectedBtn = document.querySelector(`.${btnClass}[data-rating="${rating}"]`)
  selectedBtn.classList.remove('border-gray-300')
  selectedBtn.classList.add('border-purple-500', 'bg-purple-50')
}

window.submitReflection = async function() {
  const data = {
    student_id: window.phase3State.currentStudentId,
    curriculum_id: window.phase3State.currentCurriculumId || 1,
    reflection_date: document.getElementById('reflectionDate').value,
    reflection_type: document.getElementById('reflectionType').value,
    what_learned: document.getElementById('whatLearned').value,
    what_understood: document.getElementById('whatUnderstood').value,
    what_difficult: document.getElementById('whatDifficult').value,
    what_enjoyed: document.getElementById('whatEnjoyed').value,
    next_goals: document.getElementById('nextGoals').value,
    mood_rating: parseInt(document.getElementById('moodRating').value),
    effort_rating: parseInt(document.getElementById('effortRating').value),
    understanding_rating: parseInt(document.getElementById('understandingRating').value)
  }
  
  try {
    const response = await fetch('/api/student-reflections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('✅ 振り返りを保存しました！')
      closeReflectionModal()
      loadReflections(data.student_id)
    }
  } catch (error) {
    console.error('振り返り投稿エラー:', error)
    alert('❌ エラーが発生しました')
  }
}

// 振り返りを読み込み
window.loadReflections = async function(studentId) {
  try {
    const response = await fetch(`/api/student-reflections/${studentId}`)
    const result = await response.json()
    
    if (result.success) {
      window.phase3State.reflections = result.reflections
      renderReflections(result.reflections)
    }
  } catch (error) {
    console.error('振り返り取得エラー:', error)
  }
}

// 振り返りを表示
function renderReflections(reflections) {
  if (!reflections || reflections.length === 0) {
    return '<div class="text-center py-8 text-gray-500">まだ振り返りはありません</div>'
  }
  
  return reflections.map(ref => `
    <div class="bg-white rounded-lg shadow-md p-6 mb-4">
      <div class="flex justify-between items-start mb-4">
        <div>
          <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${
            ref.reflection_type === 'daily' ? 'bg-blue-100 text-blue-800' :
            ref.reflection_type === 'weekly' ? 'bg-green-100 text-green-800' :
            ref.reflection_type === 'unit' ? 'bg-purple-100 text-purple-800' :
            'bg-orange-100 text-orange-800'
          }">
            ${ref.reflection_type}
          </span>
        </div>
        <p class="text-sm text-gray-600">
          ${new Date(ref.reflection_date).toLocaleDateString('ja-JP')}
        </p>
      </div>
      
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="text-center p-2 bg-yellow-50 rounded-lg">
          <div class="text-2xl mb-1">${['😢','😕','😐','😊','😄'][ref.mood_rating-1]}</div>
          <p class="text-xs text-gray-600">気分</p>
        </div>
        <div class="text-center p-2 bg-red-50 rounded-lg">
          <div class="text-xl mb-1">${'💪'.repeat(ref.effort_rating)}</div>
          <p class="text-xs text-gray-600">がんばり</p>
        </div>
        <div class="text-center p-2 bg-blue-50 rounded-lg">
          <div class="text-xl mb-1">${'✨'.repeat(ref.understanding_rating)}</div>
          <p class="text-xs text-gray-600">わかった度</p>
        </div>
      </div>
      
      ${ref.what_learned ? `
        <div class="mb-3">
          <p class="text-sm font-medium text-gray-700 mb-1">
            <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>学んだこと
          </p>
          <p class="text-sm text-gray-600 ml-5">${ref.what_learned}</p>
        </div>
      ` : ''}
      
      ${ref.what_understood ? `
        <div class="mb-3">
          <p class="text-sm font-medium text-gray-700 mb-1">
            <i class="fas fa-check-circle text-green-500 mr-1"></i>わかったこと
          </p>
          <p class="text-sm text-gray-600 ml-5">${ref.what_understood}</p>
        </div>
      ` : ''}
      
      ${ref.what_difficult ? `
        <div class="mb-3">
          <p class="text-sm font-medium text-gray-700 mb-1">
            <i class="fas fa-question-circle text-orange-500 mr-1"></i>むずかしかったこと
          </p>
          <p class="text-sm text-gray-600 ml-5">${ref.what_difficult}</p>
        </div>
      ` : ''}
      
      ${ref.what_enjoyed ? `
        <div class="mb-3">
          <p class="text-sm font-medium text-gray-700 mb-1">
            <i class="fas fa-smile text-blue-500 mr-1"></i>楽しかったこと
          </p>
          <p class="text-sm text-gray-600 ml-5">${ref.what_enjoyed}</p>
        </div>
      ` : ''}
      
      ${ref.next_goals ? `
        <div class="mb-3">
          <p class="text-sm font-medium text-gray-700 mb-1">
            <i class="fas fa-flag text-red-500 mr-1"></i>次の目標
          </p>
          <p class="text-sm text-gray-600 ml-5">${ref.next_goals}</p>
        </div>
      ` : ''}
      
      ${ref.teacher_feedback ? `
        <div class="border-t pt-3 mt-3">
          <p class="text-sm font-medium text-gray-700 mb-1">
            <i class="fas fa-user-tie text-blue-600 mr-1"></i>先生からのコメント
          </p>
          <p class="text-sm text-gray-600 ml-5">${ref.teacher_feedback}</p>
        </div>
      ` : ''}
      
      ${ref.unit_name ? `
        <div class="mt-3 text-xs text-gray-500">
          <i class="fas fa-book mr-1"></i>${ref.unit_name}
        </div>
      ` : ''}
    </div>
  `).join('')
}

// ============================================
// 4. 教科横断評価（非認知能力評価）
// ============================================

// 教科横断評価モーダルを表示
window.showCrossSubjectEvaluationModal = function(studentId, studentName) {
  window.phase3State.currentStudentId = studentId
  
  const modalHtml = `
    <div id="crossEvalModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-chart-line mr-2 text-indigo-600"></i>
            ${studentName}さんの教科横断評価
          </h3>
          <button onclick="closeCrossEvalModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <form id="crossEvalForm" class="space-y-6">
          <!-- 評価期間 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">評価期間（開始）</label>
              <input type="date" id="periodStart" class="w-full p-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">評価期間（終了）</label>
              <input type="date" id="periodEnd" class="w-full p-2 border border-gray-300 rounded-lg" value="${new Date().toISOString().split('T')[0]}" required>
            </div>
          </div>
          
          <!-- 教科横断的スキル -->
          <div class="bg-blue-50 p-4 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-3">
              <i class="fas fa-book mr-2"></i>教科横断的スキル
            </h4>
            <div class="grid grid-cols-2 gap-4">
              ${[
                { id: 'readingComprehension', label: '読解力', icon: 'book-reader' },
                { id: 'writingExpression', label: '表現力', icon: 'pen-fancy' },
                { id: 'logicalThinking', label: '論理的思考', icon: 'brain' },
                { id: 'creativeThinking', label: '創造的思考', icon: 'lightbulb' },
                { id: 'problemSolving', label: '問題解決', icon: 'puzzle-piece' }
              ].map(skill => `
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-${skill.icon} mr-1"></i>${skill.label}
                  </label>
                  <input type="range" id="${skill.id}" min="0" max="100" value="50" 
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    oninput="updateScoreDisplay('${skill.id}')">
                  <div class="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0</span>
                    <span id="${skill.id}Value" class="font-bold text-blue-600">50</span>
                    <span>100</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 非認知能力 -->
          <div class="bg-purple-50 p-4 rounded-lg">
            <h4 class="font-bold text-purple-800 mb-3">
              <i class="fas fa-heart mr-2"></i>非認知能力
            </h4>
            <div class="grid grid-cols-2 gap-4">
              ${[
                { id: 'persistenceScore', label: '粘り強さ', icon: 'fist-raised' },
                { id: 'selfRegulationScore', label: '自己調整', icon: 'balance-scale' },
                { id: 'collaborationScore', label: '協働性', icon: 'users' },
                { id: 'curiosityScore', label: '好奇心', icon: 'search' },
                { id: 'metacognitionScore', label: 'メタ認知', icon: 'eye' },
                { id: 'growthMindsetScore', label: '成長マインドセット', icon: 'seedling' }
              ].map(skill => `
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-${skill.icon} mr-1"></i>${skill.label}
                  </label>
                  <input type="range" id="${skill.id}" min="0" max="100" value="50" 
                    class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    oninput="updateScoreDisplay('${skill.id}')">
                  <div class="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0</span>
                    <span id="${skill.id}Value" class="font-bold text-purple-600">50</span>
                    <span>100</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 総合コメント -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">総合コメント</label>
            <textarea id="overallComment" rows="3" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="全体的な成長の様子"></textarea>
          </div>
          
          <!-- 強み -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-star text-yellow-500 mr-1"></i>強み
            </label>
            <textarea id="strengths" rows="2" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="特に優れている点"></textarea>
          </div>
          
          <!-- 成長の余地 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-arrow-up text-green-500 mr-1"></i>成長の余地
            </label>
            <textarea id="areasForGrowth" rows="2" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="今後伸ばしていきたい点"></textarea>
          </div>
          
          <!-- 推奨事項 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lightbulb text-orange-500 mr-1"></i>推奨事項
            </label>
            <textarea id="recommendations" rows="2" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="具体的な指導・支援の提案"></textarea>
          </div>
          
          <!-- ボタン -->
          <div class="flex gap-3">
            <button type="button" onclick="closeCrossEvalModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold">
              キャンセル
            </button>
            <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold">
              <i class="fas fa-save mr-2"></i>保存
            </button>
          </div>
        </form>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  // 初期値表示
  document.querySelectorAll('input[type="range"]').forEach(input => {
    updateScoreDisplay(input.id)
  })
  
  document.getElementById('crossEvalForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await submitCrossEvaluation()
  })
}

window.closeCrossEvalModal = function() {
  const modal = document.getElementById('crossEvalModal')
  if (modal) modal.remove()
}

window.updateScoreDisplay = function(inputId) {
  const input = document.getElementById(inputId)
  const display = document.getElementById(`${inputId}Value`)
  if (input && display) {
    display.textContent = input.value
  }
}

window.submitCrossEvaluation = async function() {
  const data = {
    student_id: window.phase3State.currentStudentId,
    evaluation_period_start: document.getElementById('periodStart').value,
    evaluation_period_end: document.getElementById('periodEnd').value,
    reading_comprehension: parseInt(document.getElementById('readingComprehension').value),
    writing_expression: parseInt(document.getElementById('writingExpression').value),
    logical_thinking: parseInt(document.getElementById('logicalThinking').value),
    creative_thinking: parseInt(document.getElementById('creativeThinking').value),
    problem_solving: parseInt(document.getElementById('problemSolving').value),
    persistence_score: parseInt(document.getElementById('persistenceScore').value),
    self_regulation_score: parseInt(document.getElementById('selfRegulationScore').value),
    collaboration_score: parseInt(document.getElementById('collaborationScore').value),
    curiosity_score: parseInt(document.getElementById('curiosityScore').value),
    metacognition_score: parseInt(document.getElementById('metacognitionScore').value),
    growth_mindset_score: parseInt(document.getElementById('growthMindsetScore').value),
    overall_comment: document.getElementById('overallComment').value,
    strengths: document.getElementById('strengths').value,
    areas_for_growth: document.getElementById('areasForGrowth').value,
    recommendations: document.getElementById('recommendations').value
  }
  
  try {
    const response = await fetch('/api/cross-subject-evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (result.success) {
      alert('✅ 教科横断評価を保存しました！')
      closeCrossEvalModal()
      loadCrossEvaluations(data.student_id)
    }
  } catch (error) {
    console.error('評価保存エラー:', error)
    alert('❌ エラーが発生しました')
  }
}

// 教科横断評価を読み込み
window.loadCrossEvaluations = async function(studentId) {
  try {
    const response = await fetch(`/api/cross-subject-evaluations/${studentId}`)
    const result = await response.json()
    
    if (result.success) {
      window.phase3State.evaluations = result.evaluations
      renderCrossEvaluations(result.evaluations)
    }
  } catch (error) {
    console.error('評価取得エラー:', error)
  }
}

// 教科横断評価を表示（レーダーチャート付き）
function renderCrossEvaluations(evaluations) {
  if (!evaluations || evaluations.length === 0) {
    return '<div class="text-center py-8 text-gray-500">まだ教科横断評価はありません</div>'
  }
  
  return evaluations.map((eval, index) => {
    const chartId = `crossEvalChart${index}`
    
    // Chart.jsでレーダーチャート描画（遅延実行）
    setTimeout(() => {
      const ctx = document.getElementById(chartId)
      if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['読解力', '表現力', '論理思考', '創造思考', '問題解決', '粘り強さ', '自己調整', '協働性', '好奇心', 'メタ認知', '成長MS'],
            datasets: [{
              label: '評価スコア',
              data: [
                eval.reading_comprehension || 0,
                eval.writing_expression || 0,
                eval.logical_thinking || 0,
                eval.creative_thinking || 0,
                eval.problem_solving || 0,
                eval.persistence_score || 0,
                eval.self_regulation_score || 0,
                eval.collaboration_score || 0,
                eval.curiosity_score || 0,
                eval.metacognition_score || 0,
                eval.growth_mindset_score || 0
              ],
              fill: true,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderColor: 'rgb(99, 102, 241)',
              pointBackgroundColor: 'rgb(99, 102, 241)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(99, 102, 241)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20
                }
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        })
      }
    }, 100)
    
    return `
      <div class="bg-white rounded-lg shadow-md p-6 mb-4">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="font-bold text-lg text-gray-800">
              教科横断評価
            </h4>
            <p class="text-sm text-gray-600">
              ${new Date(eval.evaluation_period_start).toLocaleDateString('ja-JP')} 
              〜 
              ${new Date(eval.evaluation_period_end).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
        
        <!-- レーダーチャート -->
        <div class="mb-4 bg-gray-50 rounded-lg p-4" style="height: 400px;">
          <canvas id="${chartId}"></canvas>
        </div>
        
        <!-- スコア詳細（2列） -->
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-blue-50 p-3 rounded-lg">
            <h5 class="font-bold text-blue-800 text-sm mb-2">教科横断的スキル</h5>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>読解力:</span>
                <span class="font-bold">${eval.reading_comprehension || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>表現力:</span>
                <span class="font-bold">${eval.writing_expression || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>論理的思考:</span>
                <span class="font-bold">${eval.logical_thinking || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>創造的思考:</span>
                <span class="font-bold">${eval.creative_thinking || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>問題解決:</span>
                <span class="font-bold">${eval.problem_solving || 0}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-purple-50 p-3 rounded-lg">
            <h5 class="font-bold text-purple-800 text-sm mb-2">非認知能力</h5>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span>粘り強さ:</span>
                <span class="font-bold">${eval.persistence_score || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>自己調整:</span>
                <span class="font-bold">${eval.self_regulation_score || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>協働性:</span>
                <span class="font-bold">${eval.collaboration_score || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>好奇心:</span>
                <span class="font-bold">${eval.curiosity_score || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>メタ認知:</span>
                <span class="font-bold">${eval.metacognition_score || 0}</span>
              </div>
              <div class="flex justify-between">
                <span>成長MS:</span>
                <span class="font-bold">${eval.growth_mindset_score || 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        ${eval.overall_comment ? `
          <div class="mb-3 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm font-medium text-gray-700 mb-1">総合コメント</p>
            <p class="text-sm text-gray-600">${eval.overall_comment}</p>
          </div>
        ` : ''}
        
        <div class="grid grid-cols-3 gap-3">
          ${eval.strengths ? `
            <div class="p-3 bg-yellow-50 rounded-lg">
              <p class="text-xs font-medium text-yellow-800 mb-1">
                <i class="fas fa-star mr-1"></i>強み
              </p>
              <p class="text-xs text-gray-700">${eval.strengths}</p>
            </div>
          ` : ''}
          
          ${eval.areas_for_growth ? `
            <div class="p-3 bg-green-50 rounded-lg">
              <p class="text-xs font-medium text-green-800 mb-1">
                <i class="fas fa-arrow-up mr-1"></i>成長の余地
              </p>
              <p class="text-xs text-gray-700">${eval.areas_for_growth}</p>
            </div>
          ` : ''}
          
          ${eval.recommendations ? `
            <div class="p-3 bg-orange-50 rounded-lg">
              <p class="text-xs font-medium text-orange-800 mb-1">
                <i class="fas fa-lightbulb mr-1"></i>推奨事項
              </p>
              <p class="text-xs text-gray-700">${eval.recommendations}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }).join('')
}

console.log('✅ Phase 3 機能を読み込みました')
