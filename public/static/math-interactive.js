/**
 * math-interactive.js - JSXGraphベースのインタラクティブ数学作図ツール
 * 
 * Gemini が生成した JSXGraph設定JSON を受け取り、
 * インタラクティブな図（折れ線グラフ、比例、反比例、コンパス、直線等）を描画する
 * 
 * CDN: https://cdn.jsdelivr.net/npm/jsxgraph@1.9.2/distrib/jsxgraphcore.js
 * CSS: https://cdn.jsdelivr.net/npm/jsxgraph@1.9.2/distrib/jsxgraph.css
 */

// JSXGraph CDN読み込み
(function loadJSXGraph() {
  if (window.JXG) return
  
  // CSS
  if (!document.querySelector('link[href*="jsxgraph"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/jsxgraph@1.9.2/distrib/jsxgraph.css'
    document.head.appendChild(link)
  }
  
  // JS
  if (!document.querySelector('script[src*="jsxgraph"]')) {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/jsxgraph@1.9.2/distrib/jsxgraphcore.js'
    script.async = true
    document.head.appendChild(script)
  }
})()

/**
 * JSXGraph設定JSONからインタラクティブ図を描画
 * @param {string} containerId - 描画先のdiv ID
 * @param {object} config - JSXGraph設定JSON
 * @returns {object} JSXGraph board
 */
function renderMathInteractive(containerId, config) {
  if (!window.JXG) {
    console.warn('JSXGraph未読み込み。1秒後にリトライ...')
    setTimeout(() => renderMathInteractive(containerId, config), 1000)
    return null
  }
  
  const container = document.getElementById(containerId)
  if (!container) { console.error('Container not found:', containerId); return null }
  
  // コンテナサイズ設定
  container.style.width = config.width || '100%'
  container.style.height = config.height || '400px'
  container.style.maxWidth = '600px'
  container.style.margin = '0 auto'
  
  const type = config.type || 'generic'
  
  try {
    switch (type) {
      case 'line_graph':    return renderLineGraph(containerId, config)
      case 'bar_graph':     return renderBarGraph(containerId, config)
      case 'proportion':    return renderProportion(containerId, config)
      case 'inverse_proportion': return renderInverseProportion(containerId, config)
      case 'compass':       return renderCompass(containerId, config)
      case 'line_drawing':  return renderLineDrawing(containerId, config)
      case 'number_line':   return renderNumberLine(containerId, config)
      case 'geometry':      return renderGeometry(containerId, config)
      default:              return renderGeneric(containerId, config)
    }
  } catch (err) {
    console.error('JSXGraph描画エラー:', err)
    container.innerHTML = '<p class="text-red-500 text-center p-4">図の描画に失敗しました</p>'
    return null
  }
}

// ========== 折れ線グラフ ==========
function renderLineGraph(id, config) {
  const d = config.data || {}
  const labels = d.labels || []
  const values = d.values || []
  const title = config.title || '折れ線グラフ'
  const xLabel = d.x_label || '時刻'
  const yLabel = d.y_label || ''
  const yUnit = d.y_unit || ''
  
  const maxVal = Math.max(...values) * 1.2
  const minVal = Math.min(0, Math.min(...values) - 2)
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [-1.5, maxVal + 3, labels.length + 0.5, minVal - 2],
    axis: false, grid: false, showNavigation: false, showCopyright: false,
    keepAspectRatio: false
  })
  
  // タイトル
  board.create('text', [(labels.length - 1) / 2, maxVal + 2, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  // Y軸
  board.create('axis', [[0, minVal], [0, maxVal + 1]], {
    ticks: { drawLabels: true, ticksDistance: Math.ceil(maxVal / 6), minorTicks: 0, 
             label: { offset: [-20, 0], fontSize: 12 } },
    label: { position: 'rt', offset: [-30, 10], fontSize: 13 },
    name: yLabel + (yUnit ? ' (' + yUnit + ')' : '')
  })
  
  // X軸
  board.create('axis', [[-0.5, 0], [labels.length + 0.5, 0]], {
    ticks: { drawLabels: false, majorHeight: 0, minorTicks: 0 }
  })
  
  // X軸ラベル
  labels.forEach((label, i) => {
    board.create('text', [i, minVal - 1, label], {
      fontSize: 12, anchorX: 'middle', fixed: true
    })
  })
  board.create('text', [(labels.length - 1) / 2, minVal - 2, xLabel], {
    fontSize: 13, anchorX: 'middle', fixed: true, fontWeight: 'bold'
  })
  
  // グリッド線（横）
  const tickStep = Math.ceil(maxVal / 6)
  for (let v = tickStep; v <= maxVal; v += tickStep) {
    board.create('line', [[-0.3, v], [labels.length - 0.5, v]], {
      straightFirst: false, straightLast: false, strokeWidth: 0.5,
      strokeColor: '#ddd', dash: 2, fixed: true
    })
  }
  
  // データ点とラベル
  const points = values.map((val, i) => {
    const p = board.create('point', [i, val], {
      size: 5, fillColor: '#3b82f6', strokeColor: '#1d4ed8',
      name: val + (yUnit || ''), label: { offset: [5, 12], fontSize: 13, fontWeight: 'bold', color: '#1d4ed8' },
      fixed: !config.interactive
    })
    return p
  })
  
  // 折れ線で結ぶ
  for (let i = 0; i < points.length - 1; i++) {
    board.create('segment', [points[i], points[i + 1]], {
      strokeColor: '#3b82f6', strokeWidth: 2.5, fixed: true
    })
  }
  
  return board
}

// ========== 棒グラフ ==========
function renderBarGraph(id, config) {
  const d = config.data || {}
  const labels = d.labels || []
  const values = d.values || []
  const title = config.title || '棒グラフ'
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
  
  const maxVal = Math.max(...values) * 1.2
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [-1.5, maxVal + 3, labels.length * 2 + 1, -3],
    axis: false, grid: false, showNavigation: false, showCopyright: false,
    keepAspectRatio: false
  })
  
  board.create('text', [(labels.length * 2) / 2, maxVal + 2, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  // Y軸
  board.create('axis', [[0, 0], [0, maxVal + 1]], {
    ticks: { drawLabels: true, ticksDistance: Math.ceil(maxVal / 5), minorTicks: 0,
             label: { offset: [-20, 0], fontSize: 12 } }
  })
  
  // 棒を描画
  values.forEach((val, i) => {
    const x = i * 2 + 1
    const color = colors[i % colors.length]
    
    // 棒（4点のポリゴン）
    board.create('polygon', [[x - 0.4, 0], [x + 0.4, 0], [x + 0.4, val], [x - 0.4, val]], {
      fillColor: color, fillOpacity: 0.8, borders: { strokeColor: color },
      vertices: { visible: false }, fixed: true, hasInnerPoints: false
    })
    
    // 値ラベル
    board.create('text', [x, val + 0.5, String(val)], {
      fontSize: 14, fontWeight: 'bold', anchorX: 'middle', fixed: true, color: color
    })
    
    // カテゴリラベル
    board.create('text', [x, -1.5, labels[i] || ''], {
      fontSize: 12, anchorX: 'middle', fixed: true
    })
  })
  
  return board
}

// ========== 比例 y = ax ==========
function renderProportion(id, config) {
  const d = config.data || {}
  const a = d.a || 2
  const title = config.title || `比例 y = ${a}x`
  const maxX = d.max_x || 8
  const maxY = Math.max(a * maxX, 10)
  const points = d.points || [] // [{x, y}]
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [-1, maxY + 2, maxX + 1, -2],
    axis: true, grid: true, showNavigation: false, showCopyright: false,
    keepAspectRatio: false,
    defaultAxes: {
      x: { ticks: { ticksDistance: 1, minorTicks: 0, label: { fontSize: 11 } }, name: 'x', withLabel: true,
           label: { position: 'rt', offset: [-15, -15], fontSize: 13 } },
      y: { ticks: { ticksDistance: Math.ceil(maxY / 8), minorTicks: 0, label: { fontSize: 11 } }, name: 'y', withLabel: true,
           label: { position: 'rt', offset: [10, 0], fontSize: 13 } }
    }
  })
  
  board.create('text', [maxX / 2, maxY + 1, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  // 比例の直線
  board.create('functiongraph', [x => a * x, 0, maxX], {
    strokeColor: '#ef4444', strokeWidth: 2.5, fixed: true
  })
  
  // スライダー（interactiveモード）
  if (config.interactive) {
    const slider = board.create('slider', [[1, maxY - 1], [maxX - 1, maxY - 1], [0.5, a, 5]], {
      name: 'a', snapWidth: 0.5, label: { fontSize: 13 }
    })
    board.create('functiongraph', [x => slider.Value() * x, 0, maxX], {
      strokeColor: '#3b82f6', strokeWidth: 2, dash: 2
    })
  }
  
  // データ点
  if (points.length > 0) {
    points.forEach(p => {
      board.create('point', [p.x, p.y], {
        size: 4, fillColor: '#ef4444', strokeColor: '#991b1b',
        name: `(${p.x}, ${p.y})`, label: { offset: [8, 8], fontSize: 12 },
        fixed: !config.interactive
      })
    })
  }
  
  // 数式表示
  board.create('text', [maxX - 2, 3, `y = ${a}x`], {
    fontSize: 16, fontWeight: 'bold', color: '#ef4444', fixed: true
  })
  
  return board
}

// ========== 反比例 y = a/x ==========
function renderInverseProportion(id, config) {
  const d = config.data || {}
  const a = d.a || 12
  const title = config.title || `反比例 y = ${a}/x`
  const maxX = d.max_x || 10
  const maxY = d.max_y || Math.max(a, 15)
  const points = d.points || []
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [-1, maxY + 2, maxX + 1, -2],
    axis: true, grid: true, showNavigation: false, showCopyright: false,
    keepAspectRatio: false,
    defaultAxes: {
      x: { ticks: { ticksDistance: 1, minorTicks: 0, label: { fontSize: 11 } }, name: 'x', withLabel: true,
           label: { position: 'rt', offset: [-15, -15], fontSize: 13 } },
      y: { ticks: { ticksDistance: Math.ceil(maxY / 8), minorTicks: 0, label: { fontSize: 11 } }, name: 'y', withLabel: true,
           label: { position: 'rt', offset: [10, 0], fontSize: 13 } }
    }
  })
  
  board.create('text', [maxX / 2, maxY + 1, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  // 反比例の曲線
  board.create('functiongraph', [x => x > 0.1 ? a / x : NaN, 0.1, maxX], {
    strokeColor: '#8b5cf6', strokeWidth: 2.5, fixed: true
  })
  
  // データ点
  if (points.length > 0) {
    points.forEach(p => {
      board.create('point', [p.x, p.y], {
        size: 4, fillColor: '#8b5cf6', strokeColor: '#5b21b6',
        name: `(${p.x}, ${p.y})`, label: { offset: [8, 8], fontSize: 12 },
        fixed: !config.interactive
      })
    })
  }
  
  // 数式表示
  board.create('text', [maxX - 2, maxY - 2, `y = ${a}/x`], {
    fontSize: 16, fontWeight: 'bold', color: '#8b5cf6', fixed: true
  })
  
  return board
}

// ========== コンパス（円の作図） ==========
function renderCompass(id, config) {
  const d = config.data || {}
  const title = config.title || 'コンパスで円をかこう'
  const circles = d.circles || [{ cx: 3, cy: 3, r: 2 }]
  const showPoints = d.show_points !== false
  const range = d.range || 8
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [-1, range + 1, range + 1, -1],
    axis: false, grid: true, showNavigation: false, showCopyright: false,
    keepAspectRatio: true
  })
  
  board.create('text', [range / 2, range + 0.5, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  circles.forEach((c, i) => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
    const color = colors[i % colors.length]
    
    // 中心点（ドラッグ可能）
    const center = board.create('point', [c.cx, c.cy], {
      size: 4, fillColor: color, strokeColor: color,
      name: c.label || `中心${i+1}`, label: { offset: [10, -10], fontSize: 12 },
      fixed: !config.interactive
    })
    
    // 半径の点（ドラッグで半径変更）
    if (config.interactive) {
      const radiusPoint = board.create('point', [c.cx + c.r, c.cy], {
        size: 3, fillColor: '#fbbf24', strokeColor: '#f59e0b', name: '',
      })
      board.create('circle', [center, radiusPoint], {
        strokeColor: color, strokeWidth: 2, fillColor: 'none'
      })
      // 半径線
      board.create('segment', [center, radiusPoint], {
        strokeColor: color, strokeWidth: 1, dash: 2
      })
    } else {
      board.create('circle', [center, c.r], {
        strokeColor: color, strokeWidth: 2, fillColor: 'none', fixed: true
      })
    }
    
    // 半径ラベル
    if (c.r_label) {
      board.create('text', [c.cx + c.r / 2, c.cy + 0.3, c.r_label], {
        fontSize: 13, fontWeight: 'bold', color: color, fixed: true
      })
    }
  })
  
  return board
}

// ========== 直線を引く ==========
function renderLineDrawing(id, config) {
  const d = config.data || {}
  const title = config.title || '直線をひこう'
  const lines = d.lines || []
  const range = d.range || 10
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [-1, range + 1, range + 1, -1],
    axis: true, grid: true, showNavigation: false, showCopyright: false,
    keepAspectRatio: true,
    defaultAxes: {
      x: { ticks: { ticksDistance: 1, minorTicks: 0 } },
      y: { ticks: { ticksDistance: 1, minorTicks: 0 } }
    }
  })
  
  board.create('text', [range / 2, range + 0.5, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
  
  lines.forEach((line, i) => {
    const color = colors[i % colors.length]
    const p1 = board.create('point', [line.x1, line.y1], {
      size: 4, fillColor: color, strokeColor: color,
      name: line.p1_label || '', label: { offset: [-15, -10], fontSize: 12 },
      fixed: !config.interactive
    })
    const p2 = board.create('point', [line.x2, line.y2], {
      size: 4, fillColor: color, strokeColor: color,
      name: line.p2_label || '', label: { offset: [10, -10], fontSize: 12 },
      fixed: !config.interactive
    })
    
    if (line.type === 'segment') {
      board.create('segment', [p1, p2], {
        strokeColor: color, strokeWidth: 2, fixed: !config.interactive
      })
    } else if (line.type === 'ray') {
      board.create('line', [p1, p2], {
        straightFirst: false, strokeColor: color, strokeWidth: 2, fixed: !config.interactive
      })
    } else {
      board.create('line', [p1, p2], {
        strokeColor: color, strokeWidth: 2, fixed: !config.interactive
      })
    }
  })
  
  return board
}

// ========== 数直線 ==========
function renderNumberLine(id, config) {
  const d = config.data || {}
  const title = config.title || '数直線'
  const min = d.min != null ? d.min : 0
  const max = d.max != null ? d.max : 10
  const step = d.step || 1
  const markers = d.markers || [] // [{value, label, color}]
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [min - 1, 3, max + 1, -2],
    axis: false, grid: false, showNavigation: false, showCopyright: false,
    keepAspectRatio: false
  })
  
  board.create('text', [(min + max) / 2, 2.5, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  // 数直線の矢印
  board.create('arrow', [[min - 0.5, 0], [max + 0.5, 0]], {
    strokeColor: '#000', strokeWidth: 2, fixed: true
  })
  
  // 目盛り
  for (let v = min; v <= max; v += step) {
    board.create('segment', [[v, -0.2], [v, 0.2]], {
      strokeColor: '#000', strokeWidth: 1.5, fixed: true
    })
    board.create('text', [v, -0.7, String(v)], {
      fontSize: 12, anchorX: 'middle', fixed: true
    })
  }
  
  // マーカー
  markers.forEach(m => {
    const color = m.color || '#ef4444'
    board.create('point', [m.value, 0], {
      size: 5, fillColor: color, strokeColor: color,
      name: m.label || '', label: { offset: [0, 15], fontSize: 13, fontWeight: 'bold', color: color },
      fixed: !config.interactive
    })
  })
  
  return board
}

// ========== 図形（汎用ジオメトリ） ==========
function renderGeometry(id, config) {
  const d = config.data || {}
  const title = config.title || '図形'
  const range = d.range || 10
  const shapes = d.shapes || []
  
  const board = JXG.JSXGraph.initBoard(id, {
    boundingbox: [-1, range + 1, range + 1, -1],
    axis: false, grid: true, showNavigation: false, showCopyright: false,
    keepAspectRatio: true
  })
  
  board.create('text', [range / 2, range + 0.5, title], {
    fontSize: 18, fontWeight: 'bold', anchorX: 'middle', fixed: true
  })
  
  shapes.forEach(shape => {
    const color = shape.color || '#3b82f6'
    if (shape.type === 'polygon' && shape.vertices) {
      const pts = shape.vertices.map((v, i) => 
        board.create('point', [v[0], v[1]], {
          size: 3, fillColor: color, name: shape.vertex_labels?.[i] || '',
          label: { offset: [5, 10], fontSize: 12 }, fixed: !config.interactive
        })
      )
      board.create('polygon', pts, {
        fillColor: color, fillOpacity: 0.15, borders: { strokeColor: color, strokeWidth: 2 },
        fixed: true
      })
    } else if (shape.type === 'circle') {
      board.create('circle', [[shape.cx, shape.cy], shape.r], {
        strokeColor: color, strokeWidth: 2, fillColor: color, fillOpacity: 0.1, fixed: true
      })
    } else if (shape.type === 'angle' && shape.points) {
      const pts = shape.points.map((v, i) => 
        board.create('point', [v[0], v[1]], {
          size: 2, name: shape.labels?.[i] || '', visible: true, fixed: true
        })
      )
      if (pts.length === 3) {
        board.create('angle', [pts[0], pts[1], pts[2]], {
          radius: 1, fillColor: '#fbbf24', fillOpacity: 0.3, name: shape.angle_label || '',
          label: { fontSize: 13 }
        })
      }
    }
  })
  
  return board
}

// ========== 汎用 ==========
function renderGeneric(id, config) {
  const container = document.getElementById(id)
  if (container) {
    container.innerHTML = `<div class="p-4 text-center text-gray-500">
      <i class="fas fa-info-circle mr-1"></i>この図の種類はまだ対応していません
    </div>`
  }
  return null
}

// グローバルに公開
window.renderMathInteractive = renderMathInteractive
window.renderLineGraph = renderLineGraph
window.renderBarGraph = renderBarGraph
window.renderProportion = renderProportion
window.renderInverseProportion = renderInverseProportion
window.renderCompass = renderCompass
window.renderLineDrawing = renderLineDrawing
window.renderNumberLine = renderNumberLine
window.renderGeometry = renderGeometry
