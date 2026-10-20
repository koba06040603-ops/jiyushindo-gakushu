// 教材品質ハーネス: 生成 → 採点 を一括で回す
import fs from 'fs';
const KEY = fs.readFileSync('/home/user/webapp/.dev.vars','utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim().replace(/['"]/g,'');
const GEN_MODEL = 'gemini-3.7-flash';
const JUDGE_MODEL = 'gemini-3.1-pro-preview';

export const CASES = [
  { grade:'小学1年', subject:'算数', unit:'かずとすうじ',
    goal:'1から10までの数の概念を理解し、数を正しく数えたり数字を書いたり順序を表したりできる' },
  { grade:'小学3年', subject:'算数', unit:'わり算',
    goal:'等分除・包含除の意味を理解し、わり算の式に表して答えを求めることができる' },
  { grade:'小学5年', subject:'算数', unit:'分数のたし算とひき算',
    goal:'異分母分数の加減の計算ができ、通分の意味を理解する' },
];

// 国語のケース（算数とは異なる難しさ: ①本文が無いと解けない ②答えが一意に定まりにくい）
export const CASES_JA = [
  { grade:'小学2年', subject:'国語', unit:'かん字の読み書き（にているかん字）',
    goal:'2年生で習う漢字を正しく読み書きし、形や意味の似た漢字を使い分けることができる' },
  { grade:'小学4年', subject:'国語', unit:'説明文の読み取り（段落のつながり）',
    goal:'段落ごとの中心となる語や文をとらえ、段落相互の関係を考えながら文章を読むことができる' },
  { grade:'小学6年', subject:'国語', unit:'物語文の読み取り（人物の心情の変化）',
    goal:'登場人物の相互関係や心情の変化を、描写を根拠にとらえることができる' },
];

export async function callGemini(model, prompt, maxTok=24000, temp=0.2) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ contents:[{parts:[{text:prompt}]}],
      generationConfig:{ temperature:temp, maxOutputTokens:maxTok, responseMimeType:'application/json' }})
  });
  if (!r.ok) throw new Error(`${model} ${r.status}: ${(await r.text()).slice(0,150)}`);
  const d = await r.json();
  const t = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text: t, finish: d?.candidates?.[0]?.finishReason };
}

export const JUDGE_RUBRIC = `あなたは小学校教育の教材評価の専門家です。
評価対象は「自由進度学習支援システム」がAI生成した学習カードです。
このシステムの目的は「児童が先生に頼らず、自分ひとりで学び進められること」です。

忖度せず、実際の教室で使えるかを基準に採点してください。
各観点は100点満点。満点は「そのまま印刷して児童に配れる」水準です。

【観点】
1. accuracy（正確性）: 答えは正しいか。問題文と矛盾しないか。誤字はないか。
2. self_containment（自己完結性）: 与えられた情報（問題文＋添付図の説明）だけで解けるか。
   ※ diagram フィールドがあるカードは「その図が画面に表示されている」前提で評価すること。
3. hint_quality（ヒントの質）: 答えを言わず、段階的に思考を促し、自力解決の足場になっているか。
4. example_quality（例題の質）: 本問より易しく、同じ考え方の練習になっているか。欠落はないか。
5. self_directed（自力学習の成立度）: 一人で読み、考え、答え合わせし、次に進めるか。
6. curriculum_fit（学年・単元適合）: 学年で未習の記号・用語・内容が混入していないか。
   単元名と問題内容がずれていないか。
7. depth（学習の深まり）: 作業・暗記でなく概念理解につながるか。

【出力形式】JSONのみ:
{"scores":{"accuracy":N,"self_containment":N,"hint_quality":N,"example_quality":N,"self_directed":N,"curriculum_fit":N,"depth":N},
 "overall":N,
 "critical":[{"card":N,"issue":"致命的な問題","severity":"high|mid"}],
 "improvements":["次に直すべきことを具体的に、優先度順に"]}
overall は7観点の平均とし、致命的問題が1つでもあれば大きく減点すること。`;

// 国語専用ルーブリック。算数用では「本文の有無」「解答の一意性」を見抜けないため分ける。
export const JUDGE_RUBRIC_JA = `あなたは小学校国語科の教材評価の専門家です。
評価対象は「自由進度学習支援システム」がAI生成した学習カードです。
このシステムの目的は「児童が先生に頼らず、自分ひとりで学び進められること」です。

忖度せず、実際の教室で使えるかを基準に採点してください。
各観点は100点満点。満点は「そのまま印刷して児童に配れる」水準です。

★国語で特に厳しく見るべき点★
・読解問題なのに **本文が添付されていない** カードは、それだけで自己完結性を大幅減点する。
　（「次の文章を読んで」と書いてあるのに本文が無い、教科書の作品名だけ挙げる等は失格）
　※ passage フィールドに本文があるカードは「その本文が画面に表示されている」前提で評価する。
　　 passage があるなら本文は存在するので、自己完結性を本文欠落で減点してはならない。
・答えが一意に定まらない問い（「どう思いますか」等）を、
　○×判定するシステムで出していないか。採点不能な問いは自力学習成立度を減点する。
・漢字の問題で、その学年の配当漢字を超えていないか。
・抜き出し問題で、指定字数と実際の答えの字数が合っているか。

【観点】
1. accuracy（正確性）: 答えは本文から正しく導けるか。字数指定と答えは一致するか。
   漢字の字形・読み・送りがなは正しいか。誤字はないか。
2. self_containment（自己完結性）: 与えられた情報（本文＋設問）だけで解けるか。
   ※読解問題は本文が添付されて初めて成立する。本文が無ければ大幅減点。
3. hint_quality（ヒントの質）: 答えを言わず、本文のどこに着目するかを段階的に示せているか。
4. example_quality（例題の質）: 本問と同じ読み方の練習になっているか。欠落はないか。
5. self_directed（自力学習の成立度）: 一人で読み、考え、**答え合わせ**し、次に進めるか。
   答えが一意に定まらない問いは、自動採点できないため減点する。
6. curriculum_fit（学年・単元適合）: 配当漢字・語彙・文法用語が学年相応か。
   単元名と問題内容がずれていないか。
7. depth（学習の深まり）: 文字面の照合作業でなく、読みの力（根拠づけ・解釈）につながるか。

【出力形式】JSONのみ:
{"scores":{"accuracy":N,"self_containment":N,"hint_quality":N,"example_quality":N,"self_directed":N,"curriculum_fit":N,"depth":N},
 "overall":N,
 "critical":[{"card":N,"issue":"致命的な問題","severity":"high|mid"}],
 "improvements":["次に直すべきことを具体的に、優先度順に"]}
overall は7観点の平均とし、致命的問題が1つでもあれば大きく減点すること。`;

export async function judge(cards, ctx, rubric) {
  const prompt = `${rubric || (ctx.subject === '国語' ? JUDGE_RUBRIC_JA : JUDGE_RUBRIC)}

【対象】${ctx.grade} ${ctx.subject}「${ctx.unit}」
${JSON.stringify(cards, null, 1)}`;
  const { text } = await callGemini(JUDGE_MODEL, prompt, 16384, 0);
  return JSON.parse(text);
}
