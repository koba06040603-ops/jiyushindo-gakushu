const fs = require('fs');
const GEMINI_API_KEY = 'AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const missing = [
  {g:'小学6年',s:'英語',p:'大日本図書'},
  {g:'小学6年',s:'英語',p:'啓林館'},
  {g:'中学1年',s:'国語',p:'啓林館'}
];

async function gen(publisher, grade, subject) {
  const hint = subject === '英語' && grade.startsWith('小学') 
    ? '（外国語活動・外国語科の教科書です）' : '';
  const prompt = 'あなたは日本の教育課程の専門家です。' + publisher + 'の' + grade + subject + hint + '教科書の主要な単元名（Unit名/Lesson名）を10〜15個挙げてください。必ずJSON文字列配列のみ出力してください。例:["Unit 1 Hello!","Unit 2 My School"] 説明不要、JSON配列のみ。';
  
  for (let retry = 0; retry < 5; retry++) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contents: [{parts: [{text: prompt}]}],
          generationConfig: {temperature: 0.3, maxOutputTokens: 2000}
        })
      });
      const d = await r.json();
      const txt = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // より堅牢なJSON抽出
      const match = txt.match(/\[[\s\S]*\]/);
      if (!match) {
        console.log('  retry', retry, 'no match. Text len:', txt.length);
        await sleep(3000);
        continue;
      }
      
      const arr = JSON.parse(match[0]);
      if (!Array.isArray(arr) || arr.length === 0) {
        console.log('  retry', retry, 'empty array');
        await sleep(3000);
        continue;
      }
      
      return arr.map(u => typeof u === 'string' ? u : String(u));
    } catch(e) {
      console.log('  retry', retry, e.message);
      await sleep(3000);
    }
  }
  throw new Error('all retries failed');
}

async function main() {
  const outFile = './migrations/cur_missing.sql';
  // Append to existing (has data from previous run)
  
  for (const {g,s,p} of missing) {
    const key = g + '_' + s + '_' + p;
    // Check if already done
    if (fs.existsSync(outFile)) {
      const content = fs.readFileSync(outFile, 'utf8');
      if (content.includes('-- COMBO: ' + key)) {
        console.log('SKIP', key);
        continue;
      }
    }
    
    try {
      const units = await gen(p, g, s);
      const lines = ['-- COMBO: ' + key];
      for (const u of units) {
        lines.push("INSERT INTO curriculum (grade, subject, textbook_company, unit_name) VALUES ('" + g + "','" + s + "','" + p + "','" + u.replace(/'/g, "''") + "');");
      }
      fs.appendFileSync(outFile, lines.join('\n') + '\n\n', 'utf8');
      console.log('✅', p, g, s, ':', units.length);
      await sleep(2000);
    } catch(e) {
      console.log('❌', p, g, s, ':', e.message);
    }
  }
  
  console.log('Done!');
}

main();
