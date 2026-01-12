const apiKey = process.env.GEMINI_API_KEY;

async function testModel(model) {
  console.log(`\n=== Testing: ${model} ===`);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'こんにちは。1+1は？' }] }]
        })
      }
    );
    
    if (!response.ok) {
      console.log(`❌ Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    console.log(`✅ Success! Response: ${text.substring(0, 60)}...`);
  } catch (e) {
    console.log(`❌ Exception: ${e.message}`);
  }
}

(async () => {
  await testModel('gemini-3-flash-preview');
  await testModel('gemini-3-pro-preview');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.5-pro');
})();
