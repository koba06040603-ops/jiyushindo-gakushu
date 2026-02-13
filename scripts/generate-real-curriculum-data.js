/**
 * 実カリキュラムデータ生成スクリプト
 * Gemini APIを使って、5社×全学年×全教科の実際の単元名を生成
 */

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M'

const PUBLISHERS = ['東京書籍', '大日本図書', '学校図書', '教育出版', '啓林館']
const GRADES = ['小学1年', '小学2年', '小学3年', '小学4年', '小学5年', '小学6年', '中学1年', '中学2年', '中学3年']

const SUBJECTS_BY_GRADE = {
  '小学1年': ['算数', '国語', '生活'],
  '小学2年': ['算数', '国語', '生活'],
  '小学3年': ['算数', '国語', '理科', '社会'],
  '小学4年': ['算数', '国語', '理科', '社会'],
  '小学5年': ['算数', '国語', '理科', '社会', '英語'],
  '小学6年': ['算数', '国語', '理科', '社会', '英語'],
  '中学1年': ['数学', '国語', '理科', '社会', '英語'],
  '中学2年': ['数学', '国語', '理科', '社会', '英語'],
  '中学3年': ['数学', '国語', '理科', '社会', '英語']
}

// APIレート制限を考慮した遅延
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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
    
    // JSONを抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn(`⚠️ JSON抽出失敗: ${publisher} - ${grade} - ${subject}`)
      return []
    }

    const units = JSON.parse(jsonMatch[0])
    console.log(`✅ 生成成功: ${units.length}単元 - ${publisher} - ${grade} - ${subject}`)
    
    return units.map(unit => ({
      grade,
      subject,
      textbook_company: publisher,
      unit_name: unit.unit_name,
      unit_goal: unit.unit_goal || ''
    }))

  } catch (error) {
    console.error(`❌ エラー: ${publisher} - ${grade} - ${subject}`, error.message)
    return []
  }
}

async function generateAllCurriculumData() {
  const allUnits = []
  let totalCount = 0

  console.log('🚀 カリキュラムデータ生成開始\n')

  for (const grade of GRADES) {
    const subjects = SUBJECTS_BY_GRADE[grade]
    
    for (const subject of subjects) {
      for (const publisher of PUBLISHERS) {
        const units = await generateUnitsForCombination(publisher, grade, subject)
        allUnits.push(...units)
        totalCount += units.length
        
        // APIレート制限対策: 1秒待機
        await delay(1000)
      }
    }
  }

  console.log(`\n✅ 生成完了: 合計 ${totalCount} 単元`)
  
  // SQLファイル生成
  const sqlStatements = []
  
  for (const unit of allUnits) {
    const escapedUnitName = unit.unit_name.replace(/'/g, "''")
    const escapedUnitGoal = unit.unit_goal.replace(/'/g, "''")
    
    sqlStatements.push(
      `INSERT INTO curriculum (grade, subject, textbook_company, unit_name, unit_goal) VALUES ('${unit.grade}', '${unit.subject}', '${unit.textbook_company}', '${escapedUnitName}', '${escapedUnitGoal}');`
    )
  }

  return {
    units: allUnits,
    sql: sqlStatements.join('\n'),
    count: totalCount
  }
}

// 実行
generateAllCurriculumData().then(result => {
  const fs = require('fs')
  const outputPath = '/tmp/real_curriculum_data.sql'
  
  // SQLファイルを保存
  const sqlContent = `-- 実カリキュラムデータ (${result.count}単元)
-- 生成日時: ${new Date().toISOString()}

PRAGMA foreign_keys = OFF;

${result.sql}

PRAGMA foreign_keys = ON;
`
  
  fs.writeFileSync(outputPath, sqlContent)
  console.log(`\n📄 SQLファイル生成: ${outputPath}`)
  console.log(`📊 合計単元数: ${result.count}`)
  
  // 学年・教科・出版社別の統計
  const stats = {}
  for (const unit of result.units) {
    const key = `${unit.grade} - ${unit.subject} - ${unit.textbook_company}`
    stats[key] = (stats[key] || 0) + 1
  }
  
  console.log('\n📈 統計:')
  Object.entries(stats).slice(0, 10).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}単元`)
  })
  
}).catch(error => {
  console.error('❌ 生成失敗:', error)
  process.exit(1)
})
