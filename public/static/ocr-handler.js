// OCR Handler with 3-Stage Fallback
// Stage 1: Google Cloud Vision API
// Stage 2: Gemini Vision API  
// Stage 3: Tesseract.js (client-side)

let tesseractWorker = null;

// Initialize Tesseract.js worker
async function initTesseract() {
  if (tesseractWorker) return tesseractWorker;
  
  console.log('🔧 Tesseract.js ワーカーを初期化中...');
  
  // Load Tesseract.js from CDN
  if (typeof Tesseract === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
  }
  
  tesseractWorker = await Tesseract.createWorker('jpn', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        console.log(`📊 Tesseract.js 進捗: ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  console.log('✅ Tesseract.js ワーカー準備完了');
  return tesseractWorker;
}

// Load external script dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Main OCR function with 3-stage fallback
async function performOCR(imageData, language = 'ja', onProgress = null) {
  console.log('🔍 OCR認識開始（3段階フォールバック）...');
  
  try {
    // Stage 1 & 2: Server-side OCR (Vision API → Gemini Vision)
    if (onProgress) onProgress({ stage: 1, message: '第1段階: Google Cloud Vision API で認識中...' });
    
    const response = await axios.post('/api/ai/ocr', {
      imageData: imageData,
      language: language
    });
    
    console.log('📦 サーバーレスポンス:', response.data);
    
    // Success from Stage 1 or 2
    if (response.data.success && response.data.text) {
      const stageInfo = response.data.stage === 1 
        ? '第1段階（Google Cloud Vision API）' 
        : '第2段階（Gemini Vision API）';
      
      console.log(`✅ ${stageInfo}で認識成功:`, response.data.text);
      
      if (onProgress) onProgress({ 
        stage: response.data.stage, 
        message: `${stageInfo}で認識成功！`,
        success: true
      });
      
      return {
        success: true,
        text: response.data.text,
        confidence: response.data.confidence,
        method: response.data.method,
        stage: response.data.stage
      };
    }
    
    // Stage 3: Client-side Tesseract.js fallback
    if (response.data.useTesseract) {
      console.log('⚠️ サーバーサイドOCR失敗 → 第3段階（Tesseract.js）に移行');
      
      if (onProgress) onProgress({ 
        stage: 3, 
        message: '第3段階: Tesseract.js（クライアントサイド）で認識中...' 
      });
      
      // Initialize Tesseract
      const worker = await initTesseract();
      
      if (onProgress) onProgress({ 
        stage: 3, 
        message: 'Tesseract.js で文字認識実行中...（時間がかかる場合があります）' 
      });
      
      // Perform OCR
      const result = await worker.recognize(imageData);
      
      console.log('📊 Tesseract.js 認識結果:', result.data);
      
      if (result.data.text && result.data.text.trim()) {
        const recognizedText = result.data.text.trim();
        console.log('✅ [第3段階成功] Tesseract.js OCR認識成功:', recognizedText);
        console.log('📊 信頼度:', result.data.confidence);
        
        if (onProgress) onProgress({ 
          stage: 3, 
          message: '第3段階（Tesseract.js）で認識成功！',
          success: true
        });
        
        return {
          success: true,
          text: recognizedText,
          confidence: Math.round(result.data.confidence),
          method: 'tesseract-js',
          stage: 3
        };
      } else {
        console.warn('⚠️ Tesseract.js: テキストが検出されませんでした');
        
        if (onProgress) onProgress({ 
          stage: 3, 
          message: '全ての段階で文字認識に失敗しました',
          success: false
        });
        
        return {
          success: false,
          text: null,
          error: '3段階すべてのOCRで文字を認識できませんでした',
          stage: 3
        };
      }
    }
    
    // No fallback available
    console.error('⚠️ OCR認識失敗: フォールバックなし');
    
    if (onProgress) onProgress({ 
      stage: 2, 
      message: '文字認識に失敗しました',
      success: false
    });
    
    return {
      success: false,
      text: null,
      error: response.data.error || 'テキストが検出されませんでした',
      stage: 2
    };
    
  } catch (error) {
    console.error('❌ OCR認識エラー:', error);
    
    // Try Tesseract.js as emergency fallback
    try {
      console.log('🚨 緊急フォールバック: Tesseract.jsを直接使用...');
      
      if (onProgress) onProgress({ 
        stage: 3, 
        message: '緊急フォールバック: Tesseract.js で認識中...' 
      });
      
      const worker = await initTesseract();
      const result = await worker.recognize(imageData);
      
      if (result.data.text && result.data.text.trim()) {
        const recognizedText = result.data.text.trim();
        console.log('✅ 緊急フォールバック成功:', recognizedText);
        
        if (onProgress) onProgress({ 
          stage: 3, 
          message: '緊急フォールバック成功！',
          success: true
        });
        
        return {
          success: true,
          text: recognizedText,
          confidence: Math.round(result.data.confidence),
          method: 'tesseract-js-emergency',
          stage: 3
        };
      }
    } catch (tesseractError) {
      console.error('❌ Tesseract.js 緊急フォールバックも失敗:', tesseractError);
    }
    
    if (onProgress) onProgress({ 
      stage: 3, 
      message: 'すべての文字認識が失敗しました',
      success: false
    });
    
    return {
      success: false,
      text: null,
      error: error.message || 'OCR認識エラー',
      stage: 3
    };
  }
}

// Export to global scope
window.performOCR = performOCR;
window.initTesseract = initTesseract;

console.log('✅ OCR Handler (3-Stage Fallback) loaded');
