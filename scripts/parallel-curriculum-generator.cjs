/**
 * 並列カリキュラムデータ生成システム
 * 5つのGemini APIエンジンを並列実行し、効率的に実データを生成
 * 
 * 特徴:
 * - 5並列実行で生成速度5倍
 * - エラーハンドリングとリトライ機能
 * - 進捗レポート機能
 * - SQLファイル自動生成
 */

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M'
const CONCURRENCY = 5 // 並列実行数
const RETRY_LIMIT = 3 // リトライ回数
const DELAY_MS = 500 // API呼び出し間の遅延（ms）

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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 統計情報
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  units: 0,
  startTime: Date.now()
}

/**
 * Gemini APIで単元データを生成
 */
async function generateUnitsForCombination(publisher, grade, subject, retryCount = 0) {
  const prompt = `あなたは日本の教育課程に精通した専門家です。以下の条件で、実際の教科書に記載されている単元名のリストを生成してください。

【条件】
- 出版社: ${publisher}
- 学年: ${grade}
- 教科: ${subject}

【要求】
1. 実際の${publisher}の教科書に記載されている単元名を、正確に列挙してください
2. 学習指導要領に準拠した、実際の教科書の章立てに基づいてください
3. 各単元名は簡潔で明確にしてください（例: 「たし算とひき算」「分数のたし算」）
4. 年間を通して学習する順序で並べてください
5. 単元数は10〜15個程度としてください

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

必ずJSON配列のみを出力してください。説明文は不要です。`

  try {
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
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSON抽出
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('JSON extraction failed')
    }

    const units = JSON.parse(jsonMatch[0])
    
    stats.success++
    stats.units += units.length
    
    console.log(`✅ 成功 [${stats.success}/${stats.total}]: ${publisher} - ${grade} - ${subject} (${units.length}単元)`)
    
    return units.map(unit => ({
      grade,
      subject,
      textbook_company: publisher,
      unit_name: unit.unit_name,
      unit_goal: unit.unit_goal || ''
    }))
  } catch (error) {
    if (retryCount < RETRY_LIMIT) {
      console.warn(`⚠️ リトライ ${retryCount + 1}/${RETRY_LIMIT}: ${publisher} - ${grade} - ${subject}`)
      await delay(DELAY_MS * (retryCount + 1))
      return generateUnitsForCombination(publisher, grade, subject, retryCount + 1)
    }
    
    stats.failed++
    console.error(`❌ 失敗: ${publisher} - ${grade} - ${subject} - ${error.message}`)
    return []
  }
}

/**
 * タスクキューを並列実行
 */
async function executeTasksInParallel(tasks, concurrency) {
  const results = []
  const queue = [...tasks]
  
  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift()
      if (task) {
        const result = await task()
        results.push(...result)
        await delay(DELAY_MS)
      }
    }
  }
  
  // 並列ワーカーを起動
  const workers = Array(concurrency).fill(null).map(() => worker())
  await Promise.all(workers)
  
  return results
}

/**
 * SQLファイル生成
 */
function generateSQLFile(allUnits) {
  const sqlStatements = allUnits.map(unit => {
    const unitName = unit.unit_name.replace(/'/g, "''")
    const unitGoal = unit.unit_goal.replace(/'/g, "''")
    const grade = unit.grade.replace(/'/g, "''")
    const subject = unit.subject.replace(/'/g, "''")
    const company = unit.textbook_company.replace(/'/g, "''")
    
    return `INSERT OR IGNORE INTO curriculum (grade, subject, textbook_company, unit_name, unit_goal) VALUES ('${grade}', '${subject}', '${company}', '${unitName}', '${unitGoal}');`
  }).join('\n')
  
  return `-- 実カリキュラムデータ（Gemini API生成）
-- 生成日時: ${new Date().toISOString()}
-- 総単元数: ${allUnits.length}

BEGIN TRANSACTION;

${sqlStatements}

COMMIT;
`
}

/**
 * 進捗レポート表示
 */
function printProgressReport() {
  const elapsed = (Date.now() - stats.startTime) / 1000
  const successRate = stats.total > 0 ? (stats.success / stats.total * 100).toFixed(1) : 0
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 生成進捗レポート')
  console.log('='.repeat(60))
  console.log(`総タスク数: ${stats.total}`)
  console.log(`成功: ${stats.success}件 (${successRate}%)`)
  console.log(`失敗: ${stats.failed}件`)
  console.log(`生成単元数: ${stats.units}個`)
  console.log(`実行時間: ${elapsed.toFixed(1)}秒`)
  console.log(`速度: ${(stats.success / elapsed).toFixed(2)}タスク/秒`)
  console.log('='.repeat(60) + '\n')
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 並列カリキュラムデータ生成システム 起動')
  console.log(`並列数: ${CONCURRENCY}エンジン`)
  console.log('')
  
  // タスクリスト生成
  const tasks = []
  for (const publisher of PUBLISHERS) {
    for (const grade of GRADES) {
      const subjects = SUBJECTS_BY_GRADE[grade] || []
      for (const subject of subjects) {
        tasks.push(() => generateUnitsForCombination(publisher, grade, subject))
      }
    }
  }
  
  stats.total = tasks.length
  console.log(`📋 総タスク数: ${stats.total}`)
  console.log(`予想時間: ${(stats.total * DELAY_MS / 1000 / CONCURRENCY).toFixed(0)}秒\n`)
  
  // 並列実行
  const allUnits = await executeTasksInParallel(tasks, CONCURRENCY)
  
  // 進捗レポート
  printProgressReport()
  
  if (allUnits.length === 0) {
    console.error('❌ データ生成失敗: 有効な単元データがありません')
    process.exit(1)
  }
  
  // SQLファイル生成
  const fs = require('fs')
  const sqlContent = generateSQLFile(allUnits)
  const sqlPath = './migrations/generated_curriculum_data.sql'
  
  fs.writeFileSync(sqlPath, sqlContent, 'utf8')
  
  console.log(`✅ SQLファイル生成完了: ${sqlPath}`)
  console.log(`📦 生成単元数: ${allUnits.length}個`)
  console.log('')
  console.log('次のステップ:')
  console.log(`1. npx wrangler d1 execute jiyushindo-gakushu-production --local --file=${sqlPath}`)
  console.log('2. npm run build')
  console.log('3. npx wrangler pages deploy dist --project-name jiyushindo-gakushu')
}

main().catch(error => {
  console.error('❌ エラー:', error)
  process.exit(1)
})
