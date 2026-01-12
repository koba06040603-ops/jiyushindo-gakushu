const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyDiwl3kscg0EcYW1Zw2iq93iajLIvv7Xr0';

const prompt = `以下の条件で小学生向けの学習単元を生成してください：

学年: 小学3年
教科: 算数
教科書会社: 東京書籍
単元名: たし算

以下のJSON形式で出力してください：
{
  "curriculum": {
    "grade": "小学3年",
    "subject": "算数",
    "textbook_company": "東京書籍",
    "unit_name": "たし算",
    "total_hours": 8,
    "unit_goal": "...",
    "non_cognitive_goal": "..."
  },
  "courses": [
    {
      "course_name": "じっくりコース",
      "description": "...",
      "cards": [...]
    }
  ]
}

必ず完全なJSONのみを出力してください。`;

async function test() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 8000
        }
      })
    }
  );
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('=== Gemini 3 Response ===');
  console.log(text.substring(0, 1000));
}

test();
