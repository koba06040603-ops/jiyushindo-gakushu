/**
 * 全出版社5並列 一括実行
 * 各出版社を Promise.all で同時に走らせる
 */
const fs = require('fs');
const path = require('path');
const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M';
const MODEL = 'gemini-3-flash-preview';
const RETRY = 2;
const DELAY = 1000;

const PUBLISHERS = ['東京書籍','大日本図書','学校図書','教育出版','啓林館'];
const GRADES = ['小学1年','小学2年','小学3年','小学4年','小学5年','小学6年','中学1年','中学2年','中学3年'];
const SUBJECTS = {
  '小学1年':['算数','国語','生活'],'小学2年':['算数','国語','生活'],
  '小学3年':['算数','国語','理科','社会'],'小学4年':['算数','国語','理科','社会'],
  '小学5年':['算数','国語','理科','社会','英語'],'小学6年':['算数','国語','理科','社会','英語'],
  '中学1年':['数学','国語','理科','社会','英語'],'中学2年':['数学','国語','理科','社会','英語'],
  '中学3年':['数学','国語','理科','社会','英語']
};
const SKIP = new Set(['小学5年_算数_東京書籍','小学6年_社会_東京書籍']);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 全完了分ロード
function loadAllDone() {
  const done = new Set();
  const dir = path.join(__dirname, '..', 'migrations');
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith('cur') || f === 'curriculum_generated.sql') {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      for (const m of content.matchAll(/-- COMBO: (.+)/g)) done.add(m[1]);
    }
  }
  return done;
}

async function gen(publisher, grade, subject, retry=0) {
  const p = `日本の${publisher}の${grade}${subject}教科書の単元名を10〜15個、JSON配列で出力。例:["かけ算","図形"] JSON配列のみ。説明不要。`;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 20000);
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
    if (retry < RETRY) { await sleep(1500*(retry+1)); return gen(publisher,grade,subject,retry+1); }
    throw e;
  }
}

async function runPublisher(publisher, done, outFile) {
  if (!fs.existsSync(outFile)) fs.writeFileSync(outFile, `-- ${publisher}\n`, 'utf8');
  let ok=0, ng=0, skip=0;
  for (const grade of GRADES) {
    for (const subj of (SUBJECTS[grade]||[])) {
      const key = `${grade}_${subj}_${publisher}`;
      if (SKIP.has(key) || done.has(key)) { skip++; continue; }
      try {
        const units = await gen(publisher, grade, subj);
        const lines = [`-- COMBO: ${key}`];
        for (const u of units) lines.push(`INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('${grade}','${subj}','${publisher}','${u.replace(/'/g,"''")}');`);
        fs.appendFileSync(outFile, lines.join('\n')+'\n\n','utf8');
        ok++;
        console.log(`✅ ${publisher} ${grade} ${subj}: ${units.length}`);
        await sleep(DELAY);
      } catch(e) {
        ng++;
        console.log(`❌ ${publisher} ${grade} ${subj}: ${e.message}`);
      }
    }
  }
  return {publisher, ok, ng, skip};
}

async function main() {
  console.log('🚀 5出版社同時並列生成 開始');
  const done = loadAllDone();
  console.log(`📋 既完了: ${done.size}組\n`);

  const migrDir = path.join(__dirname, '..', 'migrations');
  const results = await Promise.all(PUBLISHERS.map(pub => {
    const slug = {'東京書籍':'tokyo','大日本図書':'dainippon','学校図書':'gakko','教育出版':'kyoiku','啓林館':'keirinkan'}[pub];
    return runPublisher(pub, done, path.join(migrDir, `cur_${slug}.sql`));
  }));

  console.log('\n' + '='.repeat(50));
  console.log('📊 最終結果');
  let totalOk=0, totalNg=0;
  for (const r of results) {
    console.log(`  ${r.publisher}: 成功${r.ok} 失敗${r.ng} スキップ${r.skip}`);
    totalOk += r.ok; totalNg += r.ng;
  }
  console.log(`  合計: 成功${totalOk} 失敗${totalNg}`);
}
main().catch(e=>{console.error(e);process.exit(1)});
