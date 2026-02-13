const fs = require('fs');
const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const missing = [
  {g:'小学6年',s:'英語',p:'大日本図書'},
  {g:'小学6年',s:'英語',p:'啓林館'},
  {g:'中学1年',s:'国語',p:'啓林館'}
];

async function gen(publisher, grade, subject) {
  const hint = subject === '英語' && grade.startsWith('小学') ? '（外国語科）' : '';
  const prompt = publisher + 'の' + grade + subject + hint + '教科書の単元名を10〜15個、JSON配列で出力。例:["Unit1","Unit2"] JSON配列のみ。';
  
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + GEMINI_API_KEY, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      contents: [{parts: [{text: prompt}]}],
      generationConfig: {temperature: 0.3, maxOutputTokens: 8000, thinkingConfig: {thinkingBudget: 0}}
    })
  });
  const d = await r.json();
  const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = txt.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON: ' + txt.substring(0, 100));
  return JSON.parse(match[0]).map(u => typeof u === 'string' ? u : String(u));
}

async function main() {
  const outFile = './migrations/cur_missing.sql';
  
  for (const {g, s, p} of missing) {
    const key = g + '_' + s + '_' + p;
    if (fs.existsSync(outFile) && fs.readFileSync(outFile, 'utf8').includes('-- COMBO: ' + key)) {
      console.log('SKIP', key); continue;
    }
    try {
      const units = await gen(p, g, s);
      const lines = ['-- COMBO: ' + key];
      for (const u of units) lines.push("INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('" + g + "','" + s + "','" + p + "','" + u.replace(/'/g, "''") + "');");
      fs.appendFileSync(outFile, lines.join('\n') + '\n\n', 'utf8');
      console.log('✅', p, g, s, ':', units.length);
      await sleep(1500);
    } catch(e) {
      console.log('❌', p, g, s, ':', e.message);
    }
  }
  console.log('Done!');
}
main();
