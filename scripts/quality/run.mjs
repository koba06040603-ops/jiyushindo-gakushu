import fs from 'fs';
import { CASES, CASES_JA, callGemini, judge } from './harness.mjs';
const ver = process.argv[2] || 'v1';
const mod = await import(`./prompt-${ver}.mjs`);
const { buildPrompt, buildRevisePrompt } = mod;
// 第3引数: 'ja' で国語ケース、数字で単一ケース、'ja:N' で国語の1件
const arg = process.argv[3] || '';
const isJa = /^ja/.test(arg);
const pool = isJa ? CASES_JA : CASES;
const idx = arg.replace(/^ja:?/, '');
const only = idx !== '' ? [pool[+idx]] : pool;
const results = [];
for (const c of only) {
  process.stdout.write(`\n[${ver}] ${c.grade} ${c.unit} ... 生成`);
  const { text, finish } = await callGemini('gemini-3.7-flash', buildPrompt(c), 32000, 0.2);
  let cards;
  try { cards = JSON.parse(text).cards; } catch(e){ console.log(' パース失敗'); continue; }
  process.stdout.write(`(${cards.length}枚/${finish})`);
  if (buildRevisePrompt) {
    process.stdout.write(' → 推敲');
    try {
      const r2 = await callGemini('gemini-3.7-flash', buildRevisePrompt(c, cards), 32000, 0);
      const fixed = JSON.parse(r2.text).cards;
      if (Array.isArray(fixed) && fixed.length === cards.length) { cards = fixed; process.stdout.write('✓'); }
      else process.stdout.write(`✗(${fixed?.length})`);
    } catch(e){ process.stdout.write(`✗(${String(e.message).slice(0,40)})`); }
  }
  process.stdout.write(' → 採点');
  const j = await judge(cards, c);
  results.push({ case:`${c.grade} ${c.unit}`, ...j });
  const s=j.scores;
  console.log(`\n  総合 ${j.overall} | 正確${s.accuracy} 自己完結${s.self_containment} ヒント${s.hint_quality} 例題${s.example_quality} 自力${s.self_directed} 適合${s.curriculum_fit} 深さ${s.depth}`);
  if (j.critical?.length) j.critical.slice(0,4).forEach(x=>console.log(`  ⚠ [${x.severity}] card${x.card}: ${x.issue}`));
  fs.writeFileSync(`/tmp/cards_${ver}_${results.length}.json`, JSON.stringify(cards,null,1));
}
const avg = results.reduce((a,r)=>a+r.overall,0)/results.length;
console.log(`\n${'='.repeat(60)}\n[${ver}] 平均総合スコア: ${avg.toFixed(1)}`);
const keys=['accuracy','self_containment','hint_quality','example_quality','self_directed','curriculum_fit','depth'];
for(const k of keys){
  const a=results.reduce((x,r)=>x+r.scores[k],0)/results.length;
  console.log(`  ${k.padEnd(18)} ${a.toFixed(1)}`);
}
console.log('\n次に直すべきこと:');
[...new Set(results.flatMap(r=>r.improvements||[]))].slice(0,8).forEach((x,i)=>console.log(` ${i+1}. ${x}`));
fs.writeFileSync(`/tmp/result_${ver}.json`, JSON.stringify(results,null,1));
