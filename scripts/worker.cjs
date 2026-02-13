/**
 * 超高速並列カリキュラム生成 - 出版社別ワーカー
 * 使い方: node worker.cjs <出版社名> <出力ファイル>
 */
const fs = require('fs');
const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M';
const MODEL = 'gemini-3-flash-preview';
const RETRY = 2;
const DELAY = 1200;

const publisher = process.argv[2];
const outFile = process.argv[3];
if (!publisher || !outFile) { console.error('Usage: node worker.cjs <publisher> <outfile>'); process.exit(1); }

const GRADES = ['小学1年','小学2年','小学3年','小学4年','小学5年','小学6年','中学1年','中学2年','中学3年'];
const SUBJECTS = {
  '小学1年':['算数','国語','生活'],'小学2年':['算数','国語','生活'],
  '小学3年':['算数','国語','理科','社会'],'小学4年':['算数','国語','理科','社会'],
  '小学5年':['算数','国語','理科','社会','英語'],'小学6年':['算数','国語','理科','社会','英語'],
  '中学1年':['数学','国語','理科','社会','英語'],'中学2年':['数学','国語','理科','社会','英語'],
  '中学3年':['数学','国語','理科','社会','英語']
};

// 既存完了分を読み込み（メインのcurriculum_generated.sqlから）
function loadDone() {
  const done = new Set();
  const mainFile = require('path').join(__dirname, '..', 'migrations', 'curriculum_generated.sql');
  if (fs.existsSync(mainFile)) {
    for (const m of fs.readFileSync(mainFile,'utf8').matchAll(/-- COMBO: (.+)/g)) done.add(m[1]);
  }
  if (fs.existsSync(outFile)) {
    for (const m of fs.readFileSync(outFile,'utf8').matchAll(/-- COMBO: (.+)/g)) done.add(m[1]);
  }
  return done;
}

const SKIP = new Set(['小学5年_算数_東京書籍','小学6年_社会_東京書籍']);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function gen(grade, subject, retry=0) {
  const p = `日本の${publisher}の${grade}${subject}教科書の単元名を10〜15個、JSON配列で出力。例:["かけ算","図形"] JSON配列のみ。説明不要。`;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 15000);
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{parts:[{text:p}]}],generationConfig:{temperature:0.2,maxOutputTokens:1500}}),
      signal: ac.signal
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`API ${r.status}`);
    const d = await r.json();
    const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const m = txt.match(/\[[\s\S]*?\]/);
    if (!m) throw new Error('NoJSON');
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)||!arr.length) throw new Error('Empty');
    return arr.map(u => typeof u === 'string' ? u : String(u));
  } catch(e) {
    if (retry < RETRY) { await sleep(DELAY*(retry+1)); return gen(grade,subject,retry+1); }
    throw e;
  }
}

async function main() {
  const done = loadDone();
  if (!fs.existsSync(outFile)) fs.writeFileSync(outFile, `-- ${publisher} (worker)\n`, 'utf8');
  let ok=0, ng=0;
  for (const grade of GRADES) {
    for (const subj of (SUBJECTS[grade]||[])) {
      const key = `${grade}_${subj}_${publisher}`;
      if (SKIP.has(key) || done.has(key)) continue;
      try {
        const units = await gen(grade, subj);
        const lines = [`-- COMBO: ${key}`];
        for (const u of units) lines.push(`INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('${grade}','${subj}','${publisher}','${u.replace(/'/g,"''")}');`);
        fs.appendFileSync(outFile, lines.join('\n')+'\n\n','utf8');
        ok++;
        process.stdout.write(`✅ ${grade} ${subj}: ${units.length} | `);
        await sleep(DELAY);
      } catch(e) {
        ng++;
        process.stdout.write(`❌ ${grade} ${subj} | `);
      }
    }
  }
  console.log(`\n📊 ${publisher}: 成功${ok} 失敗${ng}`);
}
main().catch(e=>{console.error(e);process.exit(1)});
