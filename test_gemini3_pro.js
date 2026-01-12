const apiKey = process.env.GEMINI_API_KEY;

const models = [
  { name: 'Gemini 3 Flash Preview', id: 'gemini-3-flash-preview' },
  { name: 'Gemini 3 Pro Preview', id: 'gemini-3-pro-preview' },
  { name: 'Gemini 2.5 Flash', id: 'gemini-2.5-flash' },
  { name: 'Gemini 2.5 Pro', id: 'gemini-2.5-pro' }
];

const prompt = `小学4年生の算数「小数の計算」の単元で、つまずいている子に向けた分かりやすい説明を100文字以内で作成してください。`;

async function testModel(model) {
  console.log(`\n=== ${model.name} ===`);
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500
          }
        })
      }
    );
    
    const elapsed = Date.now() - startTime;
    
    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      const error = await response.json();
      console.log(`   ${error.error?.message || 'Unknown error'}`);
      return;
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    const tokens = data.usageMetadata?.totalTokenCount || 0;
    
    console.log(`✅ Success! (${elapsed}ms, ${tokens} tokens)`);
    console.log(`   ${text.substring(0, 100)}...`);
    
  } catch (e) {
    console.log(`❌ Exception: ${e.message}`);
  }
}

(async () => {
  for (const model of models) {
    await testModel(model);
  }
})();
