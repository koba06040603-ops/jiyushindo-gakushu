/**
 * 段階的実データ生成：主要学年・教科のみ
 * 小学3年〜小学6年の算数・国語・理科・社会のみ
 */

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M'

const PUBLISHERS = ['東京書籍', '大日本図書', '学校図書', '教育出版', '啓林館']
const PRIORITY_GRADES = ['小学3年', '小学4年', '小学5年', '小学6年']
const PRIORITY_SUBJECTS = ['算数', '国語', '理科', '社会']

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
      console.error('API Error:', errorData.error?.message || response.status)
      return []
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

async function generatePriorityData() {
  const allUnits = []
  let totalCount = 0
  let successCount = 0
  let failCount = 0

  console.log('🚀 優先カリキュラムデータ生成開始')
  console.log(`   対象: ${PRIORITY_GRADES.length}学年 × ${PRIORITY_SUBJECTS.length}教科 × ${PUBLISHERS.length}社 = ${PRIORITY_GRADES.length * PRIORITY_SUBJECTS.length * PUBLISHERS.length}組み合わせ\n`)

  for (const grade of PRIORITY_GRADES) {
    for (const subject of PRIORITY_SUBJECTS) {
      for (const publisher of PUBLISHERS) {
        const units = await generateUnitsForCombination(publisher, grade, subject)
        if (units.length > 0) {
          allUnits.push(...units)
          totalCount += units.length
          successCount++
        } else {
          failCount++
        }
        
        // APIレート制限対策: 2秒待機（503エラー対策）
        await delay(2000)
      }
    }
  }

  console.log(`\n✅ 生成完了`)
  console.log(`   成功: ${successCount}組み合わせ`)
  console.log(`   失敗: ${failCount}組み合わせ`)
  console.log(`   合計単元数: ${totalCount}`)
  
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
    count: totalCount,
    successCount,
    failCount
  }
}

// 実行
generatePriorityData().then(result => {
  const fs = require('fs')
  const outputPath = '/tmp/priority_curriculum_data.sql'
  
  // SQLファイルを保存
  const sqlContent = `-- 優先カリキュラムデータ (${result.count}単元)
-- 生成日時: ${new Date().toISOString()}
-- 対象: 小学3〜6年の算数・国語・理科・社会

PRAGMA foreign_keys = OFF;

${result.sql}

PRAGMA foreign_keys = ON;
`
  
  fs.writeFileSync(outputPath, sqlContent)
  console.log(`\n📄 SQLファイル生成: ${outputPath}`)
  console.log(`📊 合計単元数: ${result.count}`)
  console.log(`✅ 成功率: ${Math.round(result.successCount / (result.successCount + result.failCount) * 100)}%`)
  
}).catch(error => {
  console.error('❌ 生成失敗:', error)
  process.exit(1)
})
