/**
 * 堅牢なカリキュラムデータ生成（中間保存版）
 * 
 * 各組み合わせ成功ごとにSQLファイルに追記するため、
 * タイムアウトしても完了分は保存される
 */

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M';
const RETRY_LIMIT = 2;
const BASE_DELAY_MS = 2000;
const MODEL = 'gemini-3-flash-preview';

const OUTPUT_FILE = path.join(__dirname, '..', 'migrations', 'curriculum_generated.sql');

const PUBLISHERS = ['東京書籍', '大日本図書', '学校図書', '教育出版', '啓林館'];
const GRADES = ['小学1年', '小学2年', '小学3年', '小学4年', '小学5年', '小学6年', '中学1年', '中学2年', '中学3年'];

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
};

const SKIP_COMBOS = new Set([
  '小学5年_算数_東京書籍',
  '小学6年_社会_東京書籍'
]);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 既に生成済みの組み合わせを読み込み
function loadCompletedCombos() {
  const completed = new Set();
  if (fs.existsSync(OUTPUT_FILE)) {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const matches = content.matchAll(/-- COMBO: (.+)/g);
    for (const m of matches) {
      completed.add(m[1]);
    }
  }
  return completed;
}

async function generateUnits(publisher, grade, subject, retryCount = 0) {
  const prompt = `日本の${publisher}の${grade}${subject}教科書の単元名を10〜15個、JSON配列で出力してください。

出力例: ["かけ算", "図形の性質", "分数のたし算"]

JSON配列のみ出力。説明文不要。`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) throw new Error('Empty response');

    // JSON配列を抽出
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error('No JSON array found');

    const units = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(units) || units.length === 0) throw new Error('Empty array');

    return units.map(u => typeof u === 'string' ? u : String(u));
  } catch (error) {
    if (retryCount < RETRY_LIMIT) {
      const wait = BASE_DELAY_MS * (retryCount + 1);
      await delay(wait);
      return generateUnits(publisher, grade, subject, retryCount + 1);
    }
    throw error;
  }
}

function appendToSQL(grade, subject, publisher, units) {
  const comboKey = `${grade}_${subject}_${publisher}`;
  const lines = [`-- COMBO: ${comboKey}`];
  for (const unit of units) {
    const escaped = unit.replace(/'/g, "''");
    lines.push(`INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('${grade}', '${subject}', '${publisher}', '${escaped}');`);
  }
  lines.push('');
  fs.appendFileSync(OUTPUT_FILE, lines.join('\n') + '\n', 'utf8');
}

async function main() {
  const startPublisher = process.argv[2] || null; // 開始出版社
  const startGrade = process.argv[3] || null;     // 開始学年
  
  console.log('🚀 カリキュラム生成（中間保存版）');
  
  const completed = loadCompletedCombos();
  console.log(`📋 既に完了: ${completed.size}組`);
  
  // 初回は出力ファイルのヘッダー追加
  if (!fs.existsSync(OUTPUT_FILE)) {
    fs.writeFileSync(OUTPUT_FILE, `-- カリキュラム実データ（Gemini API生成）\n-- 開始日時: ${new Date().toISOString()}\n\n`, 'utf8');
  }

  let total = 0, success = 0, fail = 0, skipped = 0;
  let started = !startPublisher;

  for (const publisher of PUBLISHERS) {
    if (!started && publisher === startPublisher) started = true;
    if (!started) continue;

    let gradeStarted = !startGrade;
    
    for (const grade of GRADES) {
      if (!gradeStarted && grade === startGrade) gradeStarted = true;
      if (!gradeStarted) continue;

      const subjects = SUBJECTS_BY_GRADE[grade] || [];
      for (const subject of subjects) {
        total++;
        const comboKey = `${grade}_${subject}_${publisher}`;
        
        // スキップ対象チェック
        if (SKIP_COMBOS.has(comboKey)) {
          skipped++;
          continue;
        }
        
        // 既完了チェック
        if (completed.has(comboKey)) {
          skipped++;
          continue;
        }

        try {
          const units = await generateUnits(publisher, grade, subject);
          appendToSQL(grade, subject, publisher, units);
          success++;
          console.log(`✅ [${success}] ${publisher} ${grade} ${subject}: ${units.length}単元`);
          await delay(BASE_DELAY_MS);
        } catch (error) {
          fail++;
          console.error(`❌ ${publisher} ${grade} ${subject}: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n📊 完了: 成功${success}, 失敗${fail}, スキップ${skipped}`);
  console.log(`📄 出力: ${OUTPUT_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
