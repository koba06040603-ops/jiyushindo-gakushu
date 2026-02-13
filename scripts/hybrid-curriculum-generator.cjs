/**
 * ハイブリッド方式：既存の実データを参考にAI生成
 */

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M'
const sqlite3 = require('better-sqlite3')
const fs = require('fs')

const PUBLISHERS = ['東京書籍', '大日本図書', '学校図書', '教育出版', '啓林館']
const ALL_GRADES = ['小学1年', '小学2年', '小学3年', '小学4年', '小学5年', '小学6年', '中学1年', '中学2年', '中学3年']
const ALL_SUBJECTS = ['算数', '数学', '国語', '理科', '社会', '英語', '生活']

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ローカルDBから実データを取得
function getRealDataExamples(db) {
  const query = `
    SELECT grade, subject, textbook_company, unit_name 
    FROM curriculum 
    WHERE unit_name NOT LIKE '%単元%' 
      AND unit_name NOT LIKE '%第_単元%'
    LIMIT 100
  `
  
  return db.prepare(query).all()
}

// 同じ学年・教科の実データを取得
function getRelatedExamples(db, grade, subject) {
  const query = `
    SELECT textbook_company, unit_name 
    FROM curriculum 
    WHERE grade = ? 
      AND subject = ?
      AND unit_name NOT LIKE '%単元%' 
      AND unit_name NOT LIKE '%第_単元%'
    LIMIT 20
  `
  
  return db.prepare(query).all(grade, subject)
}

async function generateWithExamples(publisher, grade, subject, examples) {
  // 参考例をフォーマット
  const exampleText = examples.length > 0
    ? examples.map(ex => 
        `【${ex.textbook_company}】単元名: ${ex.unit_name}`
      ).join('\n')
    : '（参考例なし）'

  const prompt = `あなたは日本の教育課程に精通した専門家です。

【生成条件】
- 出版社: ${publisher}
- 学年: ${grade}
- 教科: ${subject}

【参考：同じ学年・教科の実際のデータ】
${exampleText}

【指示】
上記の参考データと同じ品質・形式で、${publisher}の${grade}・${subject}の単元名を10〜15個生成してください。
- 学習指導要領に準拠
- 実際の教科書の章立てに基づく
- 年間を通した学習順序で配列

【出力形式】
JSON配列のみを出力してください：
[
  {"unit_name": "単元名", "unit_goal": "学習目標（50文字程度）"},
  ...
]`

  try {
    console.log(`📚 生成中: ${publisher} - ${grade} - ${subject} (参考例:${examples.length}件)`)
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,  // より一貫性のある出力
            maxOutputTokens: 2000
          }
        })
      }
    )

    if (!response.ok) {
      if (response.status === 503) {
        console.warn(`⏳ API過負荷 - 5秒待機してリトライ`)
        await delay(5000)
        return await generateWithExamples(publisher, grade, subject, examples)
      }
      console.error(`API Error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn(`⚠️ JSON抽出失敗`)
      return []
    }

    const units = JSON.parse(jsonMatch[0])
    console.log(`✅ 成功: ${units.length}単元`)
    
    return units.map(unit => ({
      grade,
      subject,
      textbook_company: publisher,
      unit_name: unit.unit_name,
      unit_goal: unit.unit_goal || ''
    }))

  } catch (error) {
    console.error(`❌ エラー:`, error.message)
    return []
  }
}

async function generateAllData() {
  console.log('🚀 ハイブリッド方式カリキュラムデータ生成開始\n')
  
  // ローカルDBに接続
  const dbPath = '/home/user/webapp/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/808a74269ab53db7fa21557dca8320b35dc048162f5356c7e5515a82e3aa5aba.sqlite'
  const db = sqlite3(dbPath, { readonly: true })
  
  console.log('📖 既存の実データを読み込み中...')
  const realExamples = getRealDataExamples(db)
  console.log(`   実データ: ${realExamples.length}件\n`)
  
  const allUnits = []
  let successCount = 0
  let failCount = 0
  
  // 主要な学年・教科を優先
  const priorities = [
    { grades: ['小学3年', '小学4年', '小学5年', '小学6年'], subjects: ['算数', '国語', '理科', '社会'] },
    { grades: ['小学1年', '小学2年'], subjects: ['算数', '国語', '生活'] },
    { grades: ['中学1年', '中学2年', '中学3年'], subjects: ['数学', '国語', '理科', '社会', '英語'] }
  ]
  
  for (const priority of priorities) {
    for (const grade of priority.grades) {
      for (const subject of priority.subjects) {
        // 同じ学年・教科の参考例を取得
        const examples = getRelatedExamples(db, grade, subject)
        
        for (const publisher of PUBLISHERS) {
          const units = await generateWithExamples(publisher, grade, subject, examples)
          
          if (units.length > 0) {
            allUnits.push(...units)
            successCount++
          } else {
            failCount++
          }
          
          // レート制限対策
          await delay(1500)
        }
      }
    }
  }
  
  db.close()
  
  console.log(`\n✅ 生成完了`)
  console.log(`   成功: ${successCount}`)
  console.log(`   失敗: ${failCount}`)
  console.log(`   合計単元数: ${allUnits.length}`)
  
  // SQL生成（unit_goalなし）
  const sqlStatements = allUnits.map(unit => {
    const eName = unit.unit_name.replace(/'/g, "''")
    return `INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('${unit.grade}', '${unit.subject}', '${unit.textbook_company}', '${eName}');`
  })
  
  return {
    units: allUnits,
    sql: sqlStatements.join('\n'),
    count: allUnits.length,
    successCount,
    failCount
  }
}

// 実行
generateAllData().then(result => {
  const outputPath = '/tmp/hybrid_curriculum_data.sql'
  
  const sqlContent = `-- ハイブリッド方式生成カリキュラムデータ (${result.count}単元)
-- 生成日時: ${new Date().toISOString()}
-- 方式: 既存実データを参考例としてAI生成

PRAGMA foreign_keys = OFF;

-- 既存のダミーデータを削除
DELETE FROM curriculum WHERE unit_name LIKE '%単元%' OR unit_name LIKE '%第_単元%';

-- 新しい実データを挿入
${result.sql}

PRAGMA foreign_keys = ON;
`
  
  fs.writeFileSync(outputPath, sqlContent)
  console.log(`\n📄 SQLファイル: ${outputPath}`)
  console.log(`📊 総単元数: ${result.count}`)
  console.log(`✅ 成功率: ${Math.round(result.successCount / (result.successCount + result.failCount) * 100)}%`)
  
}).catch(error => {
  console.error('❌ 失敗:', error)
  process.exit(1)
})
