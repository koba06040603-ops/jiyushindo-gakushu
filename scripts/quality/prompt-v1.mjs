// v1 = 現在デプロイ済みのルール（ベースライン）
export function buildRules(grade) {
  const gn = (String(grade).match(/([0-9１-９一二三四五六])/)||[])[1];
  const map={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6};
  const n = map[gn] !== undefined ? map[gn] : (parseInt(String(gn||'').replace(/[１-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)),10) || 0);
  const low = /小学/.test(grade) && n>0 && n<=2;
  return `
════════════════════════════════════════════════
★★★★★ 最優先ルール：自由進度学習の絶対要件 ★★★★★
════════════════════════════════════════════════
【絶対要件1｜問題は文章だけで完結させる】
✗「えにかいてある りんごの かずを かぞえましょう」（絵が無いので解けない）
○「おさらに りんごが 3こ、みかんが 5こ あります。どちらが なんこ おおいですか」
【絶対要件2｜ヒントは答えを言わない。手の動かし方を教える】
○ lv1=どこに注目するか / lv2=手を動かす具体的方法 / lv3=答えの直前まで
★ answer の値そのものを hint_text に絶対に書かない
【絶対要件3｜例題は必ず付ける。本問より易しく。答えは本問と別の値】
【絶対要件4｜誤字を出さない】${low?'★ ひらがな中心・わかち書き':''}
【絶対要件5｜未習の記号・用語を使わない】${low?`
★ 数の単元では「＋ − ＝」や式（5+?=8）を一切書かない
○ ことばで:「8は 5と いくつ？」★ 1文25字以内`:'★ その学年で未習の用語・記号・公式を使わない'}
【絶対要件6｜答えは検算して確定】選択肢を出すなら answer は必ず選択肢に含める
【絶対要件7｜answer_explanation は①②③の手順で】
════════════════════════════════════════════════`;
}

export function buildPrompt(c, numCards=6) {
  return `あなたは小学校の教科指導に精通した優秀な教師です。以下の単元の学習カード${numCards}枚を生成してください。
${buildRules(c.grade)}
【単元情報】
- 学年: ${c.grade} / 教科: ${c.subject} / 教科書: 東京書籍
- 単元名: ${c.unit}
- 単元目標: ${c.goal}
- コース: しっかりコース（標準）

JSONで出力:
{"cards":[{"card_number":1,"card_title":"...","problem_description":"...","answer":"...","answer_keywords":["..."],"answer_explanation":"...","example_problem":"...","example_answer":"...","example_solution":"...","ai_teacher_message":"...","hints":[{"hint_level":1,"hint_text":"..."},{"hint_level":2,"hint_text":"..."},{"hint_level":3,"hint_text":"..."}]}]}`;
}
