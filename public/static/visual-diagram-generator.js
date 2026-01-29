// ===== 視覚型学習支援：図解自動生成システム =====
// 算数・数学の問題を自動的に視覚化

class VisualDiagramGenerator {
  constructor() {
    this.canvas = null
    this.ctx = null
    console.log('📊 VisualDiagramGenerator 初期化')
  }
  
  /**
   * 分数の視覚化（円グラフ + 帯グラフ）
   * @param {string} fraction - "1/2", "3/4" など
   * @param {string} containerId - コンテナID
   */
  drawFractionVisual(fraction, containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    // 分数をパース
    const [numerator, denominator] = fraction.split('/').map(Number)
    if (!numerator || !denominator) return
    
    const percentage = (numerator / denominator) * 100
    
    // 色配列
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    const color = colors[Math.floor(Math.random() * colors.length)]
    
    const svg = `
      <div style="display: flex; gap: 40px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <!-- 円グラフ表示 -->
        <div>
          <h5 style="text-align: center; margin-bottom: 12px; font-weight: 600; color: #374151;">円で表すと</h5>
          <svg viewBox="0 0 200 200" style="width: 200px; height: 200px;">
            <!-- 背景円 -->
            <circle cx="100" cy="100" r="80" fill="#f3f4f6" stroke="#d1d5db" stroke-width="4"/>
            
            <!-- 分数の部分（アニメーション付き） -->
            <circle cx="100" cy="100" r="80" fill="none" 
                    stroke="${color}" stroke-width="15"
                    stroke-dasharray="${percentage * 5.026} ${500 - percentage * 5.026}"
                    stroke-dashoffset="125.7"
                    transform="rotate(-90 100 100)">
              <animate attributeName="stroke-dasharray" 
                       from="0 500" 
                       to="${percentage * 5.026} ${500 - percentage * 5.026}" 
                       dur="1.2s" 
                       fill="freeze"/>
            </circle>
            
            <!-- 中央のテキスト -->
            <text x="100" y="95" text-anchor="middle" 
                  font-size="42" font-weight="bold" fill="#1f2937">
              ${fraction}
            </text>
            <text x="100" y="130" text-anchor="middle" 
                  font-size="18" fill="#6b7280">
              ${percentage.toFixed(0)}%
            </text>
          </svg>
        </div>
        
        <!-- 帯グラフ表示 -->
        <div>
          <h5 style="text-align: center; margin-bottom: 12px; font-weight: 600; color: #374151;">帯で表すと</h5>
          <svg viewBox="0 0 ${denominator * 50 + 20} 100" style="max-width: 400px; height: 100px;">
            <!-- 全体の枠 -->
            <rect x="10" y="30" width="${denominator * 50}" height="40" 
                  fill="none" stroke="#374151" stroke-width="3" rx="8"/>
            
            <!-- 分割線 -->
            ${Array.from({length: denominator - 1}, (_, i) => 
              `<line x1="${10 + (i + 1) * 50}" y1="30" x2="${10 + (i + 1) * 50}" y2="70" 
                     stroke="#9ca3af" stroke-width="2"/>`
            ).join('')}
            
            <!-- 塗りつぶし部分（アニメーション） -->
            ${Array.from({length: numerator}, (_, i) => 
              `<rect x="${10 + i * 50 + 2}" y="32" width="46" height="36" 
                     fill="${color}" rx="6" opacity="0">
                <animate attributeName="opacity" 
                         from="0" 
                         to="0.8" 
                         begin="${i * 0.15}s" 
                         dur="0.3s" 
                         fill="freeze"/>
              </rect>`
            ).join('')}
            
            <!-- 数字ラベル -->
            ${Array.from({length: denominator}, (_, i) => 
              `<text x="${10 + i * 50 + 25}" y="55" 
                     text-anchor="middle" 
                     font-size="16" 
                     font-weight="bold" 
                     fill="${i < numerator ? 'white' : '#374151'}">
                ${i + 1}
              </text>`
            ).join('')}
          </svg>
          <p style="text-align: center; margin-top: 8px; font-size: 14px; color: #6b7280;">
            ${denominator}個中${numerator}個
          </p>
        </div>
      </div>
    `
    
    container.innerHTML = svg
  }
  
  /**
   * 筆算の視覚化（位取りを色分け）
   * @param {string} operation - "add", "subtract", "multiply", "divide"
   * @param {number} num1 - 1つ目の数
   * @param {number} num2 - 2つ目の数
   * @param {string} containerId
   */
  drawArithmeticVisual(operation, num1, num2, containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    const operations = {
      add: { symbol: '+', label: 'たし算' },
      subtract: { symbol: '-', label: 'ひき算' },
      multiply: { symbol: '×', label: 'かけ算' },
      divide: { symbol: '÷', label: 'わり算' }
    }
    
    const op = operations[operation]
    if (!op) return
    
    // 結果を計算
    let result
    switch (operation) {
      case 'add': result = num1 + num2; break
      case 'subtract': result = num1 - num2; break
      case 'multiply': result = num1 * num2; break
      case 'divide': result = Math.floor(num1 / num2); break
    }
    
    // 位取りの色
    const placeColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']
    const placeNames = ['一の位', '十の位', '百の位', '千の位']
    
    const html = `
      <div style="text-align: center;">
        <h4 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #1f2937;">
          ${op.label}の筆算
        </h4>
        
        <div style="display: inline-block; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- 位の説明 -->
          <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 16px;">
            ${placeNames.slice(0, Math.max(num1.toString().length, num2.toString().length)).reverse().map((name, i) => `
              <div style="
                padding: 6px 12px;
                background: ${placeColors[Math.max(num1.toString().length, num2.toString().length) - 1 - i]}20;
                border: 2px solid ${placeColors[Math.max(num1.toString().length, num2.toString().length) - 1 - i]};
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                color: ${placeColors[Math.max(num1.toString().length, num2.toString().length) - 1 - i]};
              ">
                ${name}
              </div>
            `).join('')}
          </div>
          
          <!-- 筆算の表示 -->
          <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;">
            <!-- 1つ目の数 -->
            <div style="text-align: right; margin-bottom: 8px;">
              ${this.colorizeDigits(num1, placeColors)}
            </div>
            
            <!-- 演算記号と2つ目の数 -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="color: #ef4444; font-size: 36px;">${op.symbol}</span>
              <span>${this.colorizeDigits(num2, placeColors)}</span>
            </div>
            
            <!-- 区切り線 -->
            <div style="height: 4px; background: #374151; margin: 12px 0;"></div>
            
            <!-- 答え -->
            <div style="text-align: right; animation: slideIn 0.5s ease 0.8s backwards;">
              ${this.colorizeDigits(result, placeColors)}
            </div>
          </div>
        </div>
      </div>
    `
    
    container.innerHTML = html
  }
  
  /**
   * 数字の各桁を色分け
   */
  colorizeDigits(number, colors) {
    const digits = number.toString().split('')
    return digits.map((digit, index) => {
      const colorIndex = digits.length - 1 - index
      return `<span style="
        color: ${colors[colorIndex] || '#374151'};
        background: ${colors[colorIndex] || '#374151'}15;
        padding: 4px 8px;
        margin: 0 2px;
        border-radius: 6px;
        display: inline-block;
        animation: popIn 0.3s ease ${index * 0.1}s backwards;
      ">${digit}</span>`
    }).join('')
  }
  
  /**
   * 数直線の描画
   * @param {number} start - 開始値
   * @param {number} end - 終了値
   * @param {number} highlight - ハイライトする値
   * @param {string} containerId
   */
  drawNumberLine(start, end, highlight, containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    const width = 700
    const height = 120
    const lineY = 60
    const step = (width - 80) / (end - start)
    
    let svg = `<svg viewBox="0 0 ${width} ${height}" style="max-width: 100%; height: auto;">`
    
    // 数直線本体
    svg += `
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#374151"/>
        </marker>
      </defs>
      
      <line x1="40" y1="${lineY}" x2="${width - 40}" y2="${lineY}" 
            stroke="#374151" stroke-width="4" marker-end="url(#arrowhead)"/>
    `
    
    // 目盛りと数字
    for (let i = start; i <= end; i++) {
      const x = 40 + (i - start) * step
      const isHighlight = i === highlight
      const isMajor = i % 5 === 0
      
      // 目盛り線
      svg += `
        <line x1="${x}" y1="${lineY - (isMajor ? 12 : 8)}" x2="${x}" y2="${lineY + (isMajor ? 12 : 8)}" 
              stroke="${isHighlight ? '#ef4444' : '#6b7280'}" 
              stroke-width="${isHighlight ? 4 : isMajor ? 3 : 2}"/>
      `
      
      // 数字（主要な目盛りのみ）
      if (isMajor || isHighlight) {
        svg += `
          <text x="${x}" y="${lineY + 35}" text-anchor="middle" 
                font-size="${isHighlight ? 20 : 16}" 
                font-weight="${isHighlight ? 'bold' : 'normal'}"
                fill="${isHighlight ? '#ef4444' : '#374151'}">
            ${i}
          </text>
        `
      }
      
      // ハイライト位置に矢印とラベル
      if (isHighlight) {
        svg += `
          <g>
            <polygon points="${x},${lineY - 28} ${x - 10},${lineY - 18} ${x + 10},${lineY - 18}" 
                     fill="#ef4444">
              <animate attributeName="opacity" 
                       values="1;0.5;1" 
                       dur="1.5s" 
                       repeatCount="indefinite"/>
            </polygon>
            <circle cx="${x}" cy="${lineY}" r="8" fill="#ef4444" opacity="0.3">
              <animate attributeName="r" 
                       from="8" 
                       to="20" 
                       dur="1s" 
                       repeatCount="indefinite"/>
              <animate attributeName="opacity" 
                       from="0.3" 
                       to="0" 
                       dur="1s" 
                       repeatCount="indefinite"/>
            </circle>
          </g>
        `
      }
    }
    
    svg += `</svg>`
    
    const html = `
      <div style="text-align: center;">
        <h5 style="font-weight: 600; margin-bottom: 16px; color: #374151;">数直線</h5>
        ${svg}
        <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">
          ${start}から${end}までの数直線で、<span style="color: #ef4444; font-weight: bold;">${highlight}</span>の位置を示しています
        </p>
      </div>
    `
    
    container.innerHTML = html
  }
  
  /**
   * かけ算の配列（ドットアレイ）
   * @param {number} a - かける数
   * @param {number} b - かけられる数
   * @param {string} containerId
   */
  drawMultiplicationArray(a, b, containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    const dotSize = 24
    const spacing = 35
    const width = b * spacing + 60
    const height = a * spacing + 100
    
    let svg = `<svg viewBox="0 0 ${width} ${height}" style="max-width: 450px; height: auto;">`
    
    // タイトル
    svg += `
      <text x="${width / 2}" y="25" text-anchor="middle" 
            font-size="20" font-weight="bold" fill="#1f2937">
        ${a} × ${b} = ${a * b}
      </text>
    `
    
    // ドットを配置（アニメーション付き）
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    
    for (let row = 0; row < a; row++) {
      for (let col = 0; col < b; col++) {
        const x = col * spacing + 40
        const y = row * spacing + 50
        const delay = (row * b + col) * 0.03
        const color = colors[row % colors.length]
        
        svg += `
          <circle cx="${x}" cy="${y}" r="${dotSize / 2}" fill="${color}">
            <animate attributeName="r" 
                     from="0" 
                     to="${dotSize / 2}" 
                     begin="${delay}s" 
                     dur="0.3s" 
                     fill="freeze"/>
            <animate attributeName="opacity" 
                     from="0" 
                     to="1" 
                     begin="${delay}s" 
                     dur="0.3s" 
                     fill="freeze"/>
          </circle>
        `
      }
      
      // 行のラベル
      svg += `
        <text x="15" y="${row * spacing + 55}" 
              text-anchor="middle" 
              font-size="14" 
              font-weight="600" 
              fill="#6b7280">
          ${row + 1}
        </text>
      `
    }
    
    // 列のラベル
    for (let col = 0; col < b; col++) {
      const x = col * spacing + 40
      svg += `
        <text x="${x}" y="${height - 15}" 
              text-anchor="middle" 
              font-size="14" 
              font-weight="600" 
              fill="#6b7280">
          ${col + 1}
        </text>
      `
    }
    
    svg += `</svg>`
    
    const html = `
      <div style="text-align: center;">
        <h5 style="font-weight: 600; margin-bottom: 16px; color: #374151;">配列で見ると</h5>
        ${svg}
        <p style="margin-top: 12px; font-size: 14px; color: #6b7280;">
          ${a}行 × ${b}列 = ${a * b}個
        </p>
      </div>
    `
    
    container.innerHTML = html
  }
  
  /**
   * 位取りの視覚化
   * @param {number} number - 表示する数
   * @param {string} containerId
   */
  drawPlaceValue(number, containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    const digits = number.toString().split('').reverse()
    const places = ['一の位', '十の位', '百の位', '千の位', '万の位']
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    
    let html = `
      <div style="text-align: center;">
        <h5 style="font-weight: 600; margin-bottom: 20px; color: #374151; font-size: 18px;">
          ${number.toLocaleString()}の位取り
        </h5>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; max-width: 600px; margin: 0 auto;">
    `
    
    digits.forEach((digit, index) => {
      html += `
        <div style="
          background: linear-gradient(135deg, ${colors[index]} 0%, ${colors[index]}dd 100%);
          color: white;
          padding: 24px 16px;
          border-radius: 12px;
          text-align: center;
          min-width: 90px;
          box-shadow: 0 4px 12px ${colors[index]}40;
          animation: slideIn 0.5s ease ${index * 0.1}s backwards;
          transform-origin: bottom;
        ">
          <div style="font-size: 42px; font-weight: bold; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            ${digit}
          </div>
          <div style="font-size: 13px; opacity: 0.95; font-weight: 600;">
            ${places[index]}
          </div>
          <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">
            ${digit} × ${Math.pow(10, index).toLocaleString()}
          </div>
        </div>
      `
    })
    
    html += `
        </div>
        <div style="margin-top: 24px; font-size: 16px; color: #6b7280;">
          ${digits.map((d, i) => `${d} × ${Math.pow(10, i).toLocaleString()}`).reverse().join(' + ')} = <strong style="color: #1f2937;">${number.toLocaleString()}</strong>
        </div>
      </div>
    `
    
    container.innerHTML = html
  }
  
  /**
   * 問題文を自動解析して適切な図解を生成
   * @param {string} problemText - 問題文
   * @param {string} containerId - コンテナID
   */
  autoGenerateDiagram(problemText, containerId) {
    console.log('🔍 問題文を解析中:', problemText)
    
    // 分数を検出
    const fractionMatch = problemText.match(/(\d+)\s*[/／]\s*(\d+)/)
    if (fractionMatch) {
      console.log('✅ 分数を検出:', fractionMatch[0])
      this.drawFractionVisual(fractionMatch[0].replace(/／/g, '/'), containerId)
      return 'fraction'
    }
    
    // かけ算を検出（10以下）
    const multiplicationMatch = problemText.match(/(\d+)\s*[×xX]\s*(\d+)/)
    if (multiplicationMatch) {
      const a = parseInt(multiplicationMatch[1])
      const b = parseInt(multiplicationMatch[2])
      console.log('✅ かけ算を検出:', a, '×', b)
      if (a <= 10 && b <= 10) {
        this.drawMultiplicationArray(a, b, containerId)
        return 'multiplication'
      }
    }
    
    // 筆算のキーワードを検出
    const arithmeticKeywords = {
      'たし算|足し算|加える|合計': 'add',
      'ひき算|引き算|引く|差': 'subtract',
      'かけ算|掛け算|かける|積': 'multiply',
      'わり算|割り算|割る|商': 'divide'
    }
    
    for (const [keywords, operation] of Object.entries(arithmeticKeywords)) {
      const regex = new RegExp(keywords)
      if (regex.test(problemText)) {
        // 数字を抽出
        const numbers = problemText.match(/\d+/g)
        if (numbers && numbers.length >= 2) {
          const num1 = parseInt(numbers[0])
          const num2 = parseInt(numbers[1])
          console.log('✅ 筆算を検出:', operation, num1, num2)
          this.drawArithmeticVisual(operation, num1, num2, containerId)
          return 'arithmetic'
        }
      }
    }
    
    // 数直線のキーワードを検出
    if (problemText.match(/数直線|位置|どこ|何番目/)) {
      const numbers = problemText.match(/\d+/g)
      if (numbers && numbers.length >= 1) {
        const target = parseInt(numbers[0])
        const start = Math.max(0, target - 5)
        const end = target + 5
        console.log('✅ 数直線を検出:', target)
        this.drawNumberLine(start, end, target, containerId)
        return 'numberline'
      }
    }
    
    // 位取りのキーワードを検出
    if (problemText.match(/位|何の位|どの位/)) {
      const numbers = problemText.match(/\d+/g)
      if (numbers && numbers.length >= 1) {
        const number = parseInt(numbers[0])
        if (number >= 10) {
          console.log('✅ 位取りを検出:', number)
          this.drawPlaceValue(number, containerId)
          return 'placevalue'
        }
      }
    }
    
    // 一般的な数字（位取り表示）
    const numberMatch = problemText.match(/\d{2,}/)
    if (numberMatch) {
      const number = parseInt(numberMatch[0])
      console.log('✅ 大きな数字を検出:', number)
      this.drawPlaceValue(number, containerId)
      return 'placevalue'
    }
    
    console.log('⚠️ 該当する図解パターンが見つかりませんでした')
    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #9ca3af;">
          <p>この問題の図解は準備中です</p>
        </div>
      `
    }
    return null
  }
}

// CSSアニメーションを追加
const visualStyle = document.createElement('style')
visualStyle.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes popIn {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`
document.head.appendChild(visualStyle)

// グローバルインスタンスを作成
window.visualDiagramGenerator = new VisualDiagramGenerator()
console.log('✅ visual-diagram-generator.js 読み込み完了')
