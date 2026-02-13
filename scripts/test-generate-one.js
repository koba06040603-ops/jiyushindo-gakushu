/**
 * テスト：1つの組み合わせで実データ生成
 */

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M'

async function generateUnitsForCombination(publisher, grade, subject) {
  const prompt = `あなたは日本の教育課程に精通した専門家です。以下の条件で、実際の教科書に記載されている単元名のリストを生成してください。

【条件】
- 出版社: ${publisher}
- 学年: ${grade}
- 教科: ${subject}

【要求】
1. 実際の${publisher}の教科書に記載されている単元名を、正確に列挙してください
2. 学習指導要領に準拠した、実際の教科書の章立てに基づいてください
3. 各単元名は簡潔で明確にしてください
4. 年間を通して学習する順序で並べてください

【出力形式】
JSON配列形式で出力してください。各要素は以下の形式：
{
  "unit_name": "単元名",
  "unit_goal": "この単元の学習目標（50文字程度）"
}

例：
[
  {"unit_name": "数と計算の基礎", "unit_goal": "1から100までの数を理解し、簡単な計算ができるようになる"},
  {"unit_name": "図形の性質", "unit_goal": "三角形や四角形の特徴を理解し、分類できるようになる"}
]

必ず実際の教科書に基づいた、現実的な単元名を10〜15個程度生成してください。JSON配列のみを出力してください。`

  try {
    console.log(`📚 生成中: ${publisher} - ${grade} - ${subject}`)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('API Error Details:', JSON.stringify(errorData, null, 2))
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    console.log('\n=== Gemini Response ===')
    console.log(text)
    console.log('=== End Response ===\n')
    
    // JSONを抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn(`⚠️ JSON抽出失敗`)
      return []
    }

    const units = JSON.parse(jsonMatch[0])
    console.log(`✅ 生成成功: ${units.length}単元`)
    console.log(JSON.stringify(units, null, 2))
    
    return units

  } catch (error) {
    console.error(`❌ エラー:`, error.message)
    return []
  }
}

// テスト実行
generateUnitsForCombination('東京書籍', '小学3年', '算数')
  .then(() => console.log('\n✅ テスト完了'))
  .catch(error => console.error('❌ テスト失敗:', error))
