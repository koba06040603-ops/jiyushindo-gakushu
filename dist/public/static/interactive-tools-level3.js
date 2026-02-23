/**
 * ========================================
 * インタラクティブ学習ツール (レベル3)
 * ========================================
 * 目的: 体感型学習を極限まで高める物理演算とインタラクティブ要素
 * 
 * ツール:
 * 1. 仮想そろばん (算数)
 * 2. 数字ブロック (算数)
 * 3. インタラクティブ時計 (算数・生活)
 * 4. 分数バー (算数)
 * 5. 図形作成ツール (算数・図工)
 * 6. 物理演算シミュレーション (理科)
 */

class InteractiveTools {
  constructor() {
    this.currentTool = null;
    console.log('✅ InteractiveTools 初期化完了');
  }
  
  /**
   * 問題に適したツールを自動選択
   */
  autoSelectTool(problemText) {
    if (problemText.includes('そろばん') || problemText.includes('計算')) {
      return 'abacus';
    } else if (problemText.includes('ブロック') || problemText.includes('数')) {
      return 'blocks';
    } else if (problemText.includes('時計') || problemText.includes('時間')) {
      return 'clock';
    } else if (problemText.includes('分数')) {
      return 'fraction';
    } else if (problemText.includes('図形') || problemText.includes('三角') || problemText.includes('四角')) {
      return 'shapes';
    }
    return 'blocks'; // デフォルト
  }
  
  /**
   * ツールを表示
   */
  showTool(toolName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return;
    }
    
    this.currentTool = toolName;
    
    switch(toolName) {
      case 'abacus':
        this.renderAbacus(container);
        break;
      case 'blocks':
        this.renderNumberBlocks(container);
        break;
      case 'clock':
        this.renderClock(container);
        break;
      case 'fraction':
        this.renderFractionBars(container);
        break;
      case 'shapes':
        this.renderShapeTool(container);
        break;
      default:
        console.warn('Unknown tool:', toolName);
    }
  }
  
  /**
   * 仮想そろばん
   */
  renderAbacus(container) {
    const rows = 10;
    const beadsPerRow = 5;
    
    let html = '<div class="abacus-tool bg-gradient-to-br from-amber-50 to-orange-100 p-6 rounded-lg">';
    html += '<h3 class="text-lg font-bold mb-4 text-orange-800">🧮 仮想そろばん</h3>';
    html += '<div class="abacus-frame bg-amber-800 p-4 rounded-lg inline-block">';
    
    for (let row = 0; row < rows; row++) {
      html += `<div class="abacus-row flex items-center gap-2 mb-2">`;
      html += `<div class="row-label text-white font-bold w-8 text-right">${Math.pow(10, rows - row - 1)}</div>`;
      html += `<div class="beads-container flex gap-1">`;
      
      // 珠
      for (let bead = 0; bead < beadsPerRow; bead++) {
        html += `
          <div class="bead bg-red-600 w-10 h-10 rounded-full cursor-pointer hover:bg-red-700 transition shadow-lg"
               onclick="window.interactiveTools.toggleBead(${row}, ${bead})">
          </div>
        `;
      }
      
      html += '</div></div>';
    }
    
    html += '</div>';
    html += '<div class="mt-4 text-center">';
    html += '<div class="text-2xl font-bold text-orange-800">合計: <span id="abacus-total">0</span></div>';
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
  }
  
  /**
   * 数字ブロック
   */
  renderNumberBlocks(container) {
    let html = '<div class="number-blocks-tool bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg">';
    html += '<h3 class="text-lg font-bold mb-4 text-blue-800">🧱 数字ブロック</h3>';
    html += '<div class="blocks-palette grid grid-cols-5 gap-3 mb-4">';
    
    // 1-10の数字ブロック
    for (let i = 1; i <= 10; i++) {
      html += `
        <div class="block-card bg-white rounded-lg shadow-lg p-4 cursor-move hover:shadow-xl transition"
             draggable="true"
             ondragstart="window.interactiveTools.dragStart(event, ${i})"
             onclick="window.interactiveTools.addBlock(${i})">
          <div class="text-3xl font-bold text-blue-600 text-center">${i}</div>
        </div>
      `;
    }
    
    html += '</div>';
    
    // 作業エリア
    html += '<div class="work-area bg-white rounded-lg p-6 min-h-[200px] border-2 border-dashed border-blue-300">';
    html += '<div class="text-gray-400 text-center mb-4">ここにブロックをドラッグ＆ドロップ</div>';
    html += '<div id="blocks-workspace" class="flex flex-wrap gap-3"></div>';
    html += '</div>';
    
    html += '<div class="mt-4 flex gap-4 justify-center">';
    html += '<button onclick="window.interactiveTools.calculateBlocks()" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">💡 合計を計算</button>';
    html += '<button onclick="window.interactiveTools.clearBlocks()" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">🗑️ クリア</button>';
    html += '</div>';
    
    html += '<div class="mt-4 text-center">';
    html += '<div class="text-2xl font-bold text-blue-800">合計: <span id="blocks-total">0</span></div>';
    html += '</div>';
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // ドロップエリアのイベント
    const workArea = document.querySelector('.work-area');
    if (workArea) {
      workArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        workArea.classList.add('bg-blue-50');
      });
      
      workArea.addEventListener('dragleave', (e) => {
        workArea.classList.remove('bg-blue-50');
      });
      
      workArea.addEventListener('drop', (e) => {
        e.preventDefault();
        workArea.classList.remove('bg-blue-50');
        const value = e.dataTransfer.getData('value');
        if (value) {
          this.addBlock(parseInt(value));
        }
      });
    }
  }
  
  /**
   * インタラクティブ時計
   */
  renderClock(container) {
    let html = '<div class="clock-tool bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg">';
    html += '<h3 class="text-lg font-bold mb-4 text-green-800">⏰ インタラクティブ時計</h3>';
    html += '<div class="clock-display relative w-64 h-64 mx-auto bg-white rounded-full border-8 border-green-800 shadow-2xl">';
    
    // 文字盤の数字
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x = Math.cos(angle) * 100 + 128;
      const y = Math.sin(angle) * 100 + 128;
      html += `<div class="clock-number absolute text-xl font-bold text-gray-800" style="left: ${x-10}px; top: ${y-10}px; width: 20px; text-align: center;">${i}</div>`;
    }
    
    // 針
    html += '<div id="hour-hand" class="absolute bg-gray-800 rounded-full" style="width: 6px; height: 60px; left: 125px; top: 68px; transform-origin: 3px 60px; transition: transform 0.5s;"></div>';
    html += '<div id="minute-hand" class="absolute bg-blue-600 rounded-full" style="width: 4px; height: 90px; left: 126px; top: 38px; transform-origin: 2px 90px; transition: transform 0.5s;"></div>';
    html += '<div class="absolute bg-red-600 rounded-full w-4 h-4" style="left: 124px; top: 124px;"></div>';
    
    html += '</div>';
    
    // コントロール
    html += '<div class="controls mt-6 flex justify-center gap-4">';
    html += '<div>';
    html += '<label class="block text-sm font-medium text-gray-700 mb-2">時</label>';
    html += '<input type="number" id="hour-input" min="1" max="12" value="3" class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center" oninput="window.interactiveTools.updateClock()">';
    html += '</div>';
    html += '<div>';
    html += '<label class="block text-sm font-medium text-gray-700 mb-2">分</label>';
    html += '<input type="number" id="minute-input" min="0" max="59" value="15" class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center" oninput="window.interactiveTools.updateClock()">';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="mt-4 text-center">';
    html += '<div class="text-2xl font-bold text-green-800" id="time-display">3:15</div>';
    html += '</div>';
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // 初期表示
    setTimeout(() => this.updateClock(), 100);
  }
  
  /**
   * 分数バー
   */
  renderFractionBars(container) {
    let html = '<div class="fraction-bars-tool bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg">';
    html += '<h3 class="text-lg font-bold mb-4 text-purple-800">📊 分数バー</h3>';
    
    const fractions = [
      { label: '1/2', parts: 2, color: 'bg-red-400' },
      { label: '1/3', parts: 3, color: 'bg-blue-400' },
      { label: '1/4', parts: 4, color: 'bg-green-400' },
      { label: '1/5', parts: 5, color: 'bg-yellow-400' },
      { label: '1/6', parts: 6, color: 'bg-purple-400' }
    ];
    
    fractions.forEach(frac => {
      html += `<div class="fraction-row mb-4">`;
      html += `<div class="text-sm font-medium text-gray-700 mb-1">${frac.label}</div>`;
      html += `<div class="flex gap-1">`;
      
      for (let i = 0; i < frac.parts; i++) {
        html += `
          <div class="fraction-part ${frac.color} h-12 flex-1 border border-white cursor-pointer hover:opacity-75 transition"
               onclick="window.interactiveTools.toggleFractionPart(this)">
          </div>
        `;
      }
      
      html += `</div></div>`;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
  }
  
  /**
   * 図形作成ツール
   */
  renderShapeTool(container) {
    let html = '<div class="shape-tool bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-lg">';
    html += '<h3 class="text-lg font-bold mb-4 text-indigo-800">📐 図形ツール</h3>';
    
    html += '<div class="shape-buttons flex gap-2 mb-4 flex-wrap">';
    const shapes = [
      { name: '円', icon: '⭕' },
      { name: '三角形', icon: '🔺' },
      { name: '四角形', icon: '🟦' },
      { name: '五角形', icon: '⬟' },
      { name: '六角形', icon: '⬡' }
    ];
    
    shapes.forEach(shape => {
      html += `
        <button onclick="window.interactiveTools.drawShape('${shape.name}')"
                class="px-4 py-2 bg-white rounded-lg shadow hover:shadow-lg transition">
          ${shape.icon} ${shape.name}
        </button>
      `;
    });
    html += '</div>';
    
    html += '<canvas id="shape-canvas" width="600" height="400" class="bg-white rounded-lg shadow-lg cursor-crosshair"></canvas>';
    html += '<div class="mt-4 flex gap-2">';
    html += '<button onclick="window.interactiveTools.clearCanvas()" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">🗑️ クリア</button>';
    html += '</div>';
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Canvasイベント
    const canvas = document.getElementById('shape-canvas');
    if (canvas) {
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.addShapeAtPosition(x, y);
      });
    }
  }
  
  // ユーティリティメソッド
  
  dragStart(event, value) {
    event.dataTransfer.setData('value', value);
  }
  
  addBlock(value) {
    const workspace = document.getElementById('blocks-workspace');
    if (!workspace) return;
    
    const block = document.createElement('div');
    block.className = 'block bg-blue-500 text-white text-2xl font-bold px-6 py-4 rounded-lg shadow-lg';
    block.textContent = value;
    block.dataset.value = value;
    workspace.appendChild(block);
    
    // 効果音
    if (window.enhancedSoundEffects) {
      window.enhancedSoundEffects.playClickSound();
    }
  }
  
  calculateBlocks() {
    const workspace = document.getElementById('blocks-workspace');
    if (!workspace) return;
    
    const blocks = workspace.querySelectorAll('.block');
    let total = 0;
    blocks.forEach(block => {
      total += parseInt(block.dataset.value);
    });
    
    document.getElementById('blocks-total').textContent = total;
    
    // アニメーション
    if (window.visualFeedback) {
      window.visualFeedback.showScorePopup(total, '合計');
    }
    
    // 効果音
    if (window.enhancedSoundEffects) {
      window.enhancedSoundEffects.playCorrectSound();
    }
  }
  
  clearBlocks() {
    const workspace = document.getElementById('blocks-workspace');
    if (workspace) {
      workspace.innerHTML = '';
      document.getElementById('blocks-total').textContent = '0';
    }
  }
  
  updateClock() {
    const hour = parseInt(document.getElementById('hour-input')?.value || 0);
    const minute = parseInt(document.getElementById('minute-input')?.value || 0);
    
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const timeDisplay = document.getElementById('time-display');
    
    if (hourHand && minuteHand && timeDisplay) {
      const hourAngle = (hour % 12) * 30 + minute * 0.5;
      const minuteAngle = minute * 6;
      
      hourHand.style.transform = `rotate(${hourAngle}deg)`;
      minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
      
      timeDisplay.textContent = `${hour}:${minute.toString().padStart(2, '0')}`;
    }
  }
  
  toggleFractionPart(element) {
    element.classList.toggle('opacity-50');
    
    if (window.enhancedSoundEffects) {
      window.enhancedSoundEffects.playClickSound();
    }
  }
  
  drawShape(shapeName) {
    console.log('図形を描画:', shapeName);
    this.currentShape = shapeName;
  }
  
  addShapeAtPosition(x, y) {
    const canvas = document.getElementById('shape-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 50;
    
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    
    switch(this.currentShape) {
      case '円':
        ctx.arc(x, y, size, 0, Math.PI * 2);
        break;
      case '三角形':
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.closePath();
        break;
      case '四角形':
        ctx.rect(x - size, y - size, size * 2, size * 2);
        break;
      default:
        ctx.arc(x, y, size, 0, Math.PI * 2);
    }
    
    ctx.fill();
    ctx.stroke();
    
    if (window.enhancedSoundEffects) {
      window.enhancedSoundEffects.playClickSound();
    }
  }
  
  clearCanvas() {
    const canvas = document.getElementById('shape-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

// グローバルインスタンス
window.interactiveTools = new InteractiveTools();

console.log('✅ interactive-tools-level3.js 読み込み完了');
