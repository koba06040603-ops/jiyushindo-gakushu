// Simple 2-Stage OCR Implementation (No Tesseract.js)
// Stage 1: Google Cloud Vision API
// Stage 2: Gemini Vision API

(function() {
  'use strict';
  
  console.log('🔧 Simple OCR Handler 初期化...');
  
  // Simple 2-stage OCR function
  async function performSimpleOCR(imageData, language = 'ja') {
    console.log('🔍 OCR認識開始（2段階フォールバック）...');
    
    try {
      const response = await axios.post('/api/ai/ocr', {
        imageData: imageData,
        language: language
      });
      
      console.log('📦 サーバーレスポンス:', response.data);
      
      if (response.data.success && response.data.text) {
        const stageInfo = response.data.stage === 1 
          ? '第1段階（Google Cloud Vision API）' 
          : '第2段階（Gemini Vision API）';
        
        console.log(`✅ ${stageInfo}で認識成功:`, response.data.text);
        
        return {
          success: true,
          text: response.data.text,
          confidence: response.data.confidence,
          method: response.data.method,
          stage: response.data.stage,
          stageInfo: stageInfo
        };
      }
      
      // Both stages failed
      console.warn('⚠️ OCR認識失敗（両方の段階）');
      
      return {
        success: false,
        text: null,
        error: response.data.error || 'テキストが検出されませんでした',
        stage: 2
      };
      
    } catch (error) {
      console.error('❌ OCR認識エラー:', error);
      return {
        success: false,
        text: null,
        error: error.message || 'OCR認識エラー',
        stage: 0
      };
    }
  }
  
  // Export to global scope
  window.performSimpleOCR = performSimpleOCR;
  
  console.log('✅ Simple OCR Handler loaded');
  console.log('📊 window.performSimpleOCR:', typeof window.performSimpleOCR);
  
})();
