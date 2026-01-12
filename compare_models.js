const apiKey = 'AIzaSyDiwl3kscg0EcYW1Zw2iq93iajLIvv7Xr0';

async function testModel(model) {
  console.log(`\n=== Testing: ${model} ===`);
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
    console.log(`Error: ${response.status} ${response.statusText}`);
    const error = await response.text();
    console.log(error.substring(0, 200));
    return;
  }
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  console.log(`Success! Response: ${text.substring(0, 100)}`);
}

(async () => {
  await testModel('gemini-3-flash-preview');
  await testModel('gemini-3-pro-preview');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.0-flash-exp');
})();
