// 画像生成モデルの「個数正確性」ベンチマーク
import fs from 'fs';
const KEY = fs.readFileSync('.dev.vars','utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim().replace(/['"]/g,'');

const MODELS = process.argv[2] ? [process.argv[2]] : [
  'gemini-3.1-flash-image',
  'gemini-3-pro-image',
  'gemini-2.5-flash-image',
];

const PROMPT = `日本の小学1年 算数の教科書に載る例題の図解を描いてください。

【数量の厳守 — 最重要】図に描く個数は次のとおり。1個でも多い/少ないと教材として誤りになります。
  ・あかいおはじき: ちょうど 5 こ
  ・きいろいおはじき: ちょうど 3 こ
描き終えたら必ず指さし確認するように数を数え直し、上の数と完全に一致させてください。
数が合わない場合は描き直すこと。余分な飾りのオブジェクトを増やしてはいけません。

【例題】あかい おはじきが 5こ、きいろい おはじきが 3こ あります。
1こずつ せんで むすんで くらべると、あかい おはじきは なんこ あまりますか。

条件：教科書のイラスト風。児童にわかりやすい色使い。文字は大きく日本語で。白い背景。
答えの数字は図に書かないこと。`;

async function gen(model) {
  const t0 = Date.now();
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      contents:[{role:'user',parts:[{text:PROMPT}]}],
      generationConfig:{ responseModalities:['IMAGE'], temperature: 0.2 }
    })
  });
  const ms = Date.now()-t0;
  if (!r.ok) return { model, ok:false, ms, err:(await r.text()).slice(0,120) };
  const d = await r.json();
  const part = d?.candidates?.[0]?.content?.parts?.find(p=>p.inlineData);
  if (!part) return { model, ok:false, ms, err:'no image' };
  return { model, ok:true, ms, b64: part.inlineData.data, mime: part.inlineData.mimeType };
}

const out = [];
for (const m of MODELS) {
  for (let i=1;i<=2;i++) {
    const r = await gen(m);
    if (r.ok) {
      const f = `/tmp/img_${m.replace(/[^a-z0-9]/gi,'_')}_${i}.png`;
      fs.writeFileSync(f, Buffer.from(r.b64,'base64'));
      console.log(`${m} #${i}: OK ${r.ms}ms -> ${f}`);
      out.push({model:m,run:i,file:f,ms:r.ms});
    } else {
      console.log(`${m} #${i}: NG ${r.ms}ms ${r.err}`);
    }
  }
}
fs.writeFileSync('/tmp/img_bench.json', JSON.stringify(out,null,2));
