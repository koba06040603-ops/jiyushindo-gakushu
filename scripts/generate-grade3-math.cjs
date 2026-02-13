/**
 * 個別生成：小学3年算数のみ（5社分）
 * 成功実績のある組み合わせで確実に生成
 */

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M'
const fs = require('fs')

const PUBLISHERS = ['東京書籍', '大日本図書', '学校図書', '教育出版', '啓林館']
const TARGET_GRADE = '小学3年'
const TARGET_SUBJECT = '算数'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function generateUnits(publisher, grade, subject) {
  const prompt = `あなたは日本の教育課程に精通した専門家です。

【生成条件】
- 出版社: ${publisher}
- 学年: ${grade}
- 教科: ${subject}

【指示】
${publisher}の${grade}・${subject}教科書の実際の単元名を、学習指導要領に基づき、年間の学習順序で10〜15個列挙してください。

【出力形式】JSON配列のみ：
[
  {"unit_name": "単元名"},
  ...
]`

  try {
    console.log(`📚 生成中: ${publisher} - ${grade} - ${subject}`)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000
          }
        })
      }
    )

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    const jsonMatch = text.match(/\[[\s\S]*?\]/)
    if (!jsonMatch) {
      console.warn(`⚠️ JSON抽出失敗`)
      return []
    }

    const units = JSON.parse(jsonMatch[0])
    console.log(`✅ 成功: ${units.length}単元`)
    
    return units.map(u => ({
      grade,
      subject,
      textbook_company: publisher,
      unit_name: u.unit_name
    }))

  } catch (error) {
    console.error(`❌ エラー:`, error.message)
    return []
  }
}

async function main() {
  console.log(`🚀 ${TARGET_GRADE}・${TARGET_SUBJECT} データ生成開始\n`)
  
  const allUnits = []
  
  for (const publisher of PUBLISHERS) {
    const units = await generateUnits(publisher, TARGET_GRADE, TARGET_SUBJECT)
    allUnits.push(...units)
    await delay(2000)  // レート制限対策
  }
  
  console.log(`\n✅ 生成完了: ${allUnits.length}単元`)
  
  // SQL生成
  const sql = allUnits.map(u => {
    const name = u.unit_name.replace(/'/g, "''")
    return `INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('${u.grade}', '${u.subject}', '${u.textbook_company}', '${name}');`
  }).join('\n')
  
  const content = `-- ${TARGET_GRADE}・${TARGET_SUBJECT} (${allUnits.length}単元)
-- 生成日時: ${new Date().toISOString()}

PRAGMA foreign_keys = OFF;

${sql}

PRAGMA foreign_keys = ON;
`
  
  const outputPath = `/tmp/curriculum_${TARGET_GRADE}_${TARGET_SUBJECT}.sql`
  fs.writeFileSync(outputPath, content)
  
  console.log(`\n📄 SQLファイル: ${outputPath}`)
  console.log(`📊 総単元数: ${allUnits.length}`)
}

main().catch(err => {
  console.error('❌ 失敗:', err)
  process.exit(1)
})
