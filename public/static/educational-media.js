/**
 * ========================================
 * 教育メディア統合システム (レベル3)
 * ========================================
 * 目的: 無料の画像・動画APIを活用して全教科に対応
 * 対応教科: 算数、国語、理科、社会、体育、図工、音楽
 * 
 * 無料API:
 * - Unsplash API (高品質写真)
 * - YouTube Data API (教育動画)
 * - Wikipedia API (教育コンテンツ)
 */

class EducationalMedia {
  constructor() {
    this.initialized = false;
    
    // 教科別キーワードマッピング
    this.subjectKeywords = {
      math: ['数学', '算数', '計算', '図形', '分数', '小数', 'グラフ'],
      science: ['理科', '実験', '生物', '化学', '物理', '地学', '天文'],
      social: ['社会', '歴史', '地理', '公民', '地図', '文化'],
      language: ['国語', '漢字', '文法', '作文', '読解'],
      pe: ['体育', '運動', 'スポーツ', '体操', 'ダンス', '水泳'],
      art: ['図工', '美術', '絵画', '工作', '彫刻', 'デザイン'],
      music: ['音楽', '楽器', '歌', 'リズム', '音符', '合唱']
    };
    
    // YouTubeの教育チャンネルID (NHK for School等)
    this.educationalChannels = {
      nhk: 'UCCTpf1LJ6yiyJ28TZ0POiIQ', // NHK for School
      // 他の教育チャンネルも追加可能
    };
    
    console.log('✅ EducationalMedia 初期化開始');
    this.init();
  }
  
  async init() {
    try {
      this.initialized = true;
      console.log('✅ EducationalMedia 初期化完了');
    } catch (error) {
      console.error('❌ EducationalMedia 初期化エラー:', error);
    }
  }
  
  /**
   * 教科を自動判定
   * @param {string} text - 問題文や説明文
   * @returns {string} - 教科名
   */
  detectSubject(text) {
    for (const [subject, keywords] of Object.entries(this.subjectKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return subject;
        }
      }
    }
    return 'general';
  }
  
  /**
   * Unsplash風の無料画像を検索
   * 注: 実際のUnsplash APIは要API Key、ここではプレースホルダー
   * @param {string} query - 検索クエリ
   * @returns {Array} - 画像URL配列
   */
  async searchImages(query) {
    // 実装: Unsplash API または Pixabay API
    // 無料枠: Unsplash 50リクエスト/時間
    
    console.log(`🔍 画像検索: ${query}`);
    
    // デモ用: Lorem Picsum (無料プレースホルダー画像)
    const images = [];
    for (let i = 0; i < 3; i++) {
      images.push({
        url: `https://picsum.photos/800/600?random=${Date.now()}-${i}`,
        title: `${query} - 画像 ${i + 1}`,
        description: `教育用画像: ${query}`
      });
    }
    
    return images;
  }
  
  /**
   * YouTube教育動画を検索
   * @param {string} query - 検索クエリ
   * @returns {Array} - 動画情報配列
   */
  async searchEducationalVideos(query) {
    console.log(`🎥 動画検索: ${query}`);
    
    // デモ用: 固定の教育動画ID (実際はYouTube Data APIで検索)
    const videos = [
      {
        id: 'dQw4w9WgXcQ', // デモID
        title: `${query}の学習動画`,
        thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
        duration: '5:30'
      }
    ];
    
    return videos;
  }
  
  /**
   * Wikipedia APIで教育コンテンツを取得
   * @param {string} query - 検索クエリ
   * @returns {Object} - Wikipediaコンテンツ
   */
  async getWikipediaContent(query) {
    try {
      const url = `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Wikipedia API エラー');
      }
      
      const data = await response.json();
      
      return {
        title: data.title,
        extract: data.extract,
        thumbnail: data.thumbnail?.source || null,
        url: data.content_urls?.desktop?.page || null
      };
    } catch (error) {
      console.warn('Wikipedia取得エラー:', error);
      return null;
    }
  }
  
  /**
   * 教科別の推奨コンテンツを生成
   * @param {string} subject - 教科
   * @param {string} topic - トピック
   * @returns {Object} - コンテンツオブジェクト
   */
  async generateSubjectContent(subject, topic) {
    const content = {
      subject,
      topic,
      images: [],
      videos: [],
      wikipedia: null,
      interactive: null
    };
    
    // 画像検索
    content.images = await this.searchImages(`${subject} ${topic}`);
    
    // 動画検索（理科・社会・体育・音楽で特に有効）
    if (['science', 'social', 'pe', 'music'].includes(subject)) {
      content.videos = await this.searchEducationalVideos(`${subject} ${topic}`);
    }
    
    // Wikipedia（理科・社会で特に有効）
    if (['science', 'social'].includes(subject)) {
      content.wikipedia = await this.getWikipediaContent(topic);
    }
    
    return content;
  }
  
  /**
   * コンテンツをHTMLに変換
   * @param {Object} content - コンテンツオブジェクト
   * @returns {string} - HTML文字列
   */
  renderContent(content) {
    let html = '<div class="educational-content">';
    
    // 画像セクション
    if (content.images && content.images.length > 0) {
      html += '<div class="images-section mb-6">';
      html += '<h3 class="text-lg font-bold mb-3 text-blue-600">📸 関連画像</h3>';
      html += '<div class="grid grid-cols-3 gap-4">';
      
      content.images.forEach(img => {
        html += `
          <div class="image-card bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition cursor-pointer"
               onclick="window.educationalMedia.showImageModal('${img.url}', '${img.title}')">
            <img src="${img.url}" alt="${img.title}" class="w-full h-40 object-cover">
            <div class="p-2 text-sm text-gray-700">${img.title}</div>
          </div>
        `;
      });
      
      html += '</div></div>';
    }
    
    // 動画セクション
    if (content.videos && content.videos.length > 0) {
      html += '<div class="videos-section mb-6">';
      html += '<h3 class="text-lg font-bold mb-3 text-red-600">🎥 学習動画</h3>';
      html += '<div class="grid grid-cols-2 gap-4">';
      
      content.videos.forEach(video => {
        html += `
          <div class="video-card bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
            <div class="relative cursor-pointer" 
                 onclick="window.educationalMedia.playVideo('${video.id}')">
              <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-32 object-cover">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center">
                  <i class="fas fa-play"></i>
                </div>
              </div>
            </div>
            <div class="p-3">
              <div class="text-sm font-semibold text-gray-800">${video.title}</div>
              <div class="text-xs text-gray-500 mt-1">⏱️ ${video.duration}</div>
            </div>
          </div>
        `;
      });
      
      html += '</div></div>';
    }
    
    // Wikipediaセクション
    if (content.wikipedia) {
      html += '<div class="wikipedia-section mb-6 bg-white p-4 rounded-lg shadow">';
      html += '<h3 class="text-lg font-bold mb-3 text-gray-800">📖 Wikipedia</h3>';
      
      if (content.wikipedia.thumbnail) {
        html += `<img src="${content.wikipedia.thumbnail}" alt="${content.wikipedia.title}" 
                      class="float-right ml-4 mb-2 w-48 rounded shadow">`;
      }
      
      html += `
        <h4 class="font-bold text-blue-600 mb-2">${content.wikipedia.title}</h4>
        <p class="text-gray-700 mb-3">${content.wikipedia.extract}</p>
        <a href="${content.wikipedia.url}" target="_blank" 
           class="text-blue-500 hover:underline text-sm">
          続きを読む →
        </a>
      `;
      
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
  
  /**
   * 画像モーダルを表示
   * @param {string} url - 画像URL
   * @param {string} title - タイトル
   */
  showImageModal(url, title) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75';
    modal.innerHTML = `
      <div class="relative max-w-4xl max-h-screen p-4">
        <button onclick="this.parentElement.parentElement.remove()" 
                class="absolute top-2 right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition z-10">
          <i class="fas fa-times text-xl"></i>
        </button>
        <img src="${url}" alt="${title}" class="max-w-full max-h-screen rounded-lg shadow-2xl">
        <div class="text-white text-center mt-3 text-lg">${title}</div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  /**
   * YouTube動画を再生
   * @param {string} videoId - YouTube動画ID
   */
  playVideo(videoId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75';
    modal.innerHTML = `
      <div class="relative w-full max-w-4xl p-4">
        <button onclick="this.parentElement.parentElement.remove()" 
                class="absolute top-2 right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition z-10">
          <i class="fas fa-times text-xl"></i>
        </button>
        <div class="relative" style="padding-bottom: 56.25%;">
          <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            class="absolute top-0 left-0 w-full h-full rounded-lg shadow-2xl">
          </iframe>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  /**
   * 教科別の学習支援コンテンツを自動生成
   * @param {string} problemText - 問題文
   * @param {string} containerId - コンテナID
   */
  async autoGenerateContent(problemText, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container not found: ${containerId}`);
      return;
    }
    
    // ローディング表示
    container.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-3xl text-blue-600"></i><p class="mt-2 text-gray-600">コンテンツを読み込んでいます...</p></div>';
    
    try {
      // 教科を自動判定
      const subject = this.detectSubject(problemText);
      
      // キーワード抽出（簡易版）
      const keywords = problemText.match(/[\u4e00-\u9faf]+/g) || [];
      const topic = keywords[0] || '学習';
      
      // コンテンツ生成
      const content = await this.generateSubjectContent(subject, topic);
      
      // レンダリング
      container.innerHTML = this.renderContent(content);
      
      console.log('✅ コンテンツ生成完了:', subject, topic);
    } catch (error) {
      console.error('❌ コンテンツ生成エラー:', error);
      container.innerHTML = '<div class="text-red-600 text-center py-8">コンテンツの読み込みに失敗しました</div>';
    }
  }
}

// グローバルインスタンスを作成
window.educationalMedia = new EducationalMedia();

console.log('✅ educational-media.js 読み込み完了');
