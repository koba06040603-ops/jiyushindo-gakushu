// Gemini APIを直接テストするスクリプト
const fs = require('fs');

// .dev.vars からAPIキーを読み込む
const devVars = fs.readFileSync('.dev.vars', 'utf8');
const apiKey = devVars.match(/GEMINI_API_KEY=["']?([^"'\n]+)["']?/)[1];

console.log('APIキー:', apiKey.substring(0, 10) + '...');

const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];

async function testModel(model) {
  const prompt = '日本語で「こんにちは」と返答してください。';
  
  console.log(`\n🧪 テスト: ${model}`);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
        })
      }
    );
    
    console.log(`📊 HTTPステータス: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ エラー:`, errorText);
      return false;
    }
    
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (content) {
      console.log(`✅ 成功: ${content}`);
      return true;
    } else {
      console.error(`❌ 応答なし`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 例外: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('========== Gemini API テスト開始 ==========\n');
  
  for (const model of models) {
    const success = await testModel(model);
    if (success) {
      console.log(`\n✅ ${model} は動作します！`);
      break;
    }
  }
  
  console.log('\n========== テスト完了 ==========');
}

main();
