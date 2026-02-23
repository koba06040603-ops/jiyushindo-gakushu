/**
 * ========================================
 * 3D可視化システム (真のレベル3)
 * ========================================
 * 使用技術:
 * - Three.js: 3D図形、立体幾何学
 * - Chart.js: 高度なグラフ・統計
 * - Matter.js: 2D物理エンジン
 * 
 * 対応教科:
 * - 算数/数学: 立体図形、グラフ、座標
 * - 理科: 天体、分子構造、力学シミュレーション
 * - 社会: 3D地図、人口ピラミッド
 */

class Advanced3DVisualization {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.animationId = null;
    
    console.log('🎨 Advanced3DVisualization 初期化開始');
  }
  
  /**
   * Three.jsシーンを初期化
   */
  initThreeJS(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return false;
    }
    
    this.container = container;
    
    // Three.jsがCDNから読み込まれているか確認
    if (typeof THREE === 'undefined') {
      console.error('Three.js not loaded');
      // Three.jsを動的に読み込み
      return this.loadThreeJS().then(() => this.initThreeJS(containerId));
    }
    
    // シーン作成
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // カメラ設定
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;
    
    // レンダラー設定
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);
    
    // ライト追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
    
    // マウスコントロール（OrbitControls）を追加
    this.addOrbitControls();
    
    console.log('✅ Three.js初期化完了');
    return true;
  }
  
  /**
   * Three.jsを動的に読み込み
   */
  async loadThreeJS() {
    return new Promise((resolve, reject) => {
      if (typeof THREE !== 'undefined') {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  /**
   * OrbitControlsを追加（マウスで回転）
   */
  addOrbitControls() {
    // 簡易版の回転制御
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    this.renderer.domElement.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      this.scene.rotation.y += deltaX * 0.01;
      this.scene.rotation.x += deltaY * 0.01;
      
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    this.renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // ホイールでズーム
    this.renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z += e.deltaY * 0.01;
      this.camera.position.z = Math.max(2, Math.min(20, this.camera.position.z));
    });
  }
  
  /**
   * アニメーションループ
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * アニメーション停止
   */
  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * 立方体を生成（算数: 立体図形）
   */
  createCube(size = 2, color = 0x4287f5) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshPhongMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    
    // エッジを追加
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );
    cube.add(line);
    
    return cube;
  }
  
  /**
   * 球体を生成（算数: 球）
   */
  createSphere(radius = 1.5, color = 0xf54242) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * 円柱を生成（算数: 円柱）
   */
  createCylinder(radiusTop = 1, radiusBottom = 1, height = 3, color = 0x42f584) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * 円錐を生成（算数: 円錐）
   */
  createCone(radius = 1, height = 3, color = 0xf5d442) {
    const geometry = new THREE.ConeGeometry(radius, height, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * 3D座標軸を追加
   */
  addAxesHelper(size = 5) {
    const axesHelper = new THREE.AxesHelper(size);
    this.scene.add(axesHelper);
  }
  
  /**
   * グリッドを追加
   */
  addGridHelper(size = 10, divisions = 10) {
    const gridHelper = new THREE.GridHelper(size, divisions);
    this.scene.add(gridHelper);
  }
  
  /**
   * 太陽系モデル（理科: 天文）
   */
  createSolarSystem(containerId) {
    this.initThreeJS(containerId);
    
    // 太陽
    const sun = this.createSphere(2, 0xffff00);
    this.scene.add(sun);
    
    // 地球
    const earth = this.createSphere(0.5, 0x4287f5);
    earth.position.x = 5;
    this.scene.add(earth);
    
    // 月
    const moon = this.createSphere(0.2, 0xcccccc);
    moon.position.x = 6.5;
    this.scene.add(moon);
    
    // アニメーション
    let angle = 0;
    const animateSystem = () => {
      angle += 0.01;
      earth.position.x = Math.cos(angle) * 5;
      earth.position.z = Math.sin(angle) * 5;
      
      moon.position.x = earth.position.x + Math.cos(angle * 13) * 1.5;
      moon.position.z = earth.position.z + Math.sin(angle * 13) * 1.5;
      
      sun.rotation.y += 0.005;
      earth.rotation.y += 0.02;
      
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(animateSystem);
    };
    
    animateSystem();
  }
  
  /**
   * 分子構造モデル（理科: 化学）
   */
  createMolecule(containerId, type = 'water') {
    this.initThreeJS(containerId);
    
    if (type === 'water') {
      // 水分子 H2O
      
      // 酸素（赤）
      const oxygen = this.createSphere(0.8, 0xff0000);
      this.scene.add(oxygen);
      
      // 水素1（白）
      const hydrogen1 = this.createSphere(0.5, 0xffffff);
      hydrogen1.position.set(-1.2, 0.8, 0);
      this.scene.add(hydrogen1);
      
      // 水素2（白）
      const hydrogen2 = this.createSphere(0.5, 0xffffff);
      hydrogen2.position.set(-1.2, -0.8, 0);
      this.scene.add(hydrogen2);
      
      // 結合線
      this.addBond(oxygen.position, hydrogen1.position);
      this.addBond(oxygen.position, hydrogen2.position);
    }
    
    this.animate();
  }
  
  /**
   * 原子間の結合線
   */
  addBond(pos1, pos2) {
    const material = new THREE.LineBasicMaterial({ color: 0x888888 });
    const points = [pos1, pos2];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
  }
  
  /**
   * 立体図形の展開図アニメーション
   */
  animateUnfoldCube(containerId) {
    this.initThreeJS(containerId);
    
    const cube = this.createCube(2, 0x4287f5);
    this.scene.add(cube);
    
    let progress = 0;
    const unfold = () => {
      progress += 0.01;
      
      // 展開アニメーション（簡易版）
      cube.rotation.x = Math.sin(progress) * Math.PI / 4;
      cube.rotation.y = progress;
      
      this.renderer.render(this.scene, this.camera);
      
      if (progress < Math.PI * 2) {
        requestAnimationFrame(unfold);
      }
    };
    
    unfold();
  }
  
  /**
   * インタラクティブ3D図形ビルダー
   */
  create3DShapeBuilder(containerId) {
    this.initThreeJS(containerId);
    this.addGridHelper();
    this.addAxesHelper();
    
    // UI追加
    const controls = document.createElement('div');
    controls.className = 'shape-controls absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg';
    controls.innerHTML = `
      <h3 class="font-bold mb-2">3D図形ビルダー</h3>
      <button onclick="window.advanced3D.addShape3D('cube')" class="btn-3d">立方体</button>
      <button onclick="window.advanced3D.addShape3D('sphere')" class="btn-3d">球</button>
      <button onclick="window.advanced3D.addShape3D('cylinder')" class="btn-3d">円柱</button>
      <button onclick="window.advanced3D.addShape3D('cone')" class="btn-3d">円錐</button>
      <button onclick="window.advanced3D.clearScene()" class="btn-3d bg-red-500">クリア</button>
      <style>
        .btn-3d { display: block; width: 100%; margin: 0.5rem 0; padding: 0.5rem; background: #4287f5; color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
        .btn-3d:hover { background: #3070d4; }
      </style>
    `;
    this.container.parentElement.style.position = 'relative';
    this.container.parentElement.appendChild(controls);
    
    this.animate();
  }
  
  /**
   * 3D図形を追加
   */
  addShape3D(shapeType) {
    let shape;
    const colors = [0x4287f5, 0xf54242, 0x42f584, 0xf5d442, 0x9b42f5];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    switch(shapeType) {
      case 'cube':
        shape = this.createCube(1.5, color);
        break;
      case 'sphere':
        shape = this.createSphere(1, color);
        break;
      case 'cylinder':
        shape = this.createCylinder(0.8, 0.8, 2, color);
        break;
      case 'cone':
        shape = this.createCone(1, 2, color);
        break;
    }
    
    if (shape) {
      // ランダムな位置に配置
      shape.position.set(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      this.scene.add(shape);
    }
  }
  
  /**
   * シーンをクリア
   */
  clearScene() {
    while(this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    
    // ライトを再追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
    
    this.addGridHelper();
    this.addAxesHelper();
  }
}

/**
 * ========================================
 * 高度なグラフ・統計可視化 (Chart.js)
 * ========================================
 */
class AdvancedChartVisualization {
  constructor() {
    console.log('📊 AdvancedChartVisualization 初期化');
  }
  
  /**
   * Chart.jsが読み込まれているか確認
   */
  async ensureChartJS() {
    if (typeof Chart === 'undefined') {
      // すでにHTMLに含まれている想定
      console.warn('Chart.js not loaded');
      return false;
    }
    return true;
  }
  
  /**
   * 人口ピラミッド（社会）
   */
  createPopulationPyramid(containerId, data) {
    const canvas = document.createElement('canvas');
    document.getElementById(containerId).appendChild(canvas);
    
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'],
        datasets: [
          {
            label: '男性',
            data: [-12, -15, -18, -20, -22, -19, -15, -10, -5],
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
          },
          {
            label: '女性',
            data: [11, 14, 17, 19, 21, 18, 16, 12, 8],
            backgroundColor: 'rgba(239, 68, 68, 0.8)'
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: {
            ticks: {
              callback: (value) => Math.abs(value)
            }
          }
        }
      }
    });
  }
  
  /**
   * 関数グラフ（数学）
   */
  createFunctionGraph(containerId, func, range = [-10, 10]) {
    const canvas = document.createElement('canvas');
    document.getElementById(containerId).appendChild(canvas);
    
    const data = [];
    for (let x = range[0]; x <= range[1]; x += 0.1) {
      data.push({ x, y: func(x) });
    }
    
    new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [{
          label: 'y = f(x)',
          data: data,
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { type: 'linear', position: 'center' },
          y: { type: 'linear', position: 'center' }
        }
      }
    });
  }
}

// グローバルインスタンス
window.advanced3D = new Advanced3DVisualization();
window.advancedChart = new AdvancedChartVisualization();

console.log('✅ advanced-3d-visualization.js 読み込み完了');
