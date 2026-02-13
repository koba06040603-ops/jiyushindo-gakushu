/**
 * 残りの失敗組み合わせ用の簡易生成スクリプト
 * 思考トークンを制限し、簡潔なプロンプトで生成
 */

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M';
const OUTPUT_FILE = path.join(__dirname, '..', 'migrations', 'curriculum_generated.sql');

const MISSING = [
  { grade: '小学5年', subject: '英語', publisher: '教育出版' },
  { grade: '小学5年', subject: '英語', publisher: '啓林館' },
  { grade: '小学6年', subject: '英語', publisher: '啓林館' },
  { grade: '中学1年', subject: '国語', publisher: '啓林館' },
  { grade: '中学1年', subject: '英語', publisher: '啓林館' },
  { grade: '中学2年', subject: '国語', publisher: '啓林館' },
  { grade: '中学2年', subject: '理科', publisher: '啓林館' },
  { grade: '中学2年', subject: '社会', publisher: '啓林館' },
  { grade: '中学2年', subject: '英語', publisher: '啓林館' },
  { grade: '中学3年', subject: '数学', publisher: '啓林館' },
  { grade: '中学3年', subject: '国語', publisher: '啓林館' },
  { grade: '中学3年', subject: '理科', publisher: '啓林館' },
  { grade: '中学3年', subject: '社会', publisher: '啓林館' },
  { grade: '中学3年', subject: '英語', publisher: '啓林館' },
];

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

async function generateUnits(publisher, grade, subject) {
  // 非常に簡潔なプロンプトで思考トークンを最小化
  const prompt = `${publisher}の${grade}${subject}教科書の単元名を12個、JSON配列で出力。例:["単元A","単元B"]。配列のみ。`;

  for (let retry = 0; retry < 5; retry++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1500
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (!response.ok) throw new Error(`API ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) throw new Error('No JSON');

      const units = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(units) || units.length === 0) throw new Error('Empty');

      return units.map(u => typeof u === 'string' ? u : String(u));
    } catch (error) {
      console.warn(`  ⚠️ リトライ ${retry + 1}/5: ${error.message}`);
      await delay(3000 * (retry + 1));
    }
  }
  throw new Error('All retries failed');
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
  console.log('🚀 残りの失敗組み合わせ生成（gemini-2.0-flash使用）');
  
  const completed = loadCompletedCombos();
  let success = 0, fail = 0;

  for (const item of MISSING) {
    const comboKey = `${item.grade}_${item.subject}_${item.publisher}`;
    if (completed.has(comboKey)) {
      console.log(`⏭️ スキップ（完了済み）: ${comboKey}`);
      continue;
    }

    try {
      const units = await generateUnits(item.publisher, item.grade, item.subject);
      appendToSQL(item.grade, item.subject, item.publisher, units);
      success++;
      console.log(`✅ [${success}] ${item.publisher} ${item.grade} ${item.subject}: ${units.length}単元`);
      await delay(2000);
    } catch (error) {
      fail++;
      console.error(`❌ ${item.publisher} ${item.grade} ${item.subject}: ${error.message}`);
    }
  }

  console.log(`\n📊 完了: 成功${success}, 失敗${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
