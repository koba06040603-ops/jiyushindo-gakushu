// 比例・反比例（小学6年・算数・東京書籍「ひれいとはんぴれい」）用の
// 必須基礎条件と、ブルーム改訂版にもとづく差別化。
//
// 注意: 基礎項目は教科書本文の取り込み前の仮案。教師が教科書で確認してから確定する。
// この定義は比例・反比例の単元にだけ適用する（比（8872）など他の単元は変更しない）。

// 単元名は「比例」「反比例」のほか、東京書籍の「ひれいとはんぴれい」（ひらがな表記）も対象にする
export const PROPORTION_UNIT_RE = /比例|反比例|ひれい|はんぴれい/

export function isProportionUnit(unitName: string): boolean {
  return PROPORTION_UNIT_RE.test(unitName || '')
}

// 3コース共通の必須基礎（仮案）
export const PROPORTION_BASIC_ITEMS: { id: string; label: string }[] = [
  { id: 'B1', label: '表から対応する値を読み取る（一方が○倍になるとき、もう一方も○倍になる）' },
  { id: 'B2', label: '比例の関係を見つける（対応する値の商 y÷x が一定）' },
  { id: 'B3', label: '比例の式 y＝（一定の数）×x を求め、対応する値を計算する' },
  { id: 'B4', label: '反比例の関係を見つける（対応する値の積 x×y が一定）' },
  { id: 'B5', label: '反比例の式 x×y＝（一定の数）を求め、対応する値を計算する' },
  { id: 'B6', label: '比例と反比例を見分ける（どちらでもない例を含む）' },
  { id: 'B7', label: '比例・反比例のグラフを読む（比例は原点を通る直線、反比例はなめらかな曲線）' },
]

// コース別の認知レベルと足場かけ（ブルーム改訂版）
// キーは courseLevel（slow / steady / fast）
export const PROPORTION_COURSE_PROFILE: Record<string, string> = {
  slow: `じっくり学ぶコース（認知レベル：記憶・理解）。
- 基礎項目を「読み取る・見つける・当てはめる」1ステップの問いで扱う
- 表や図の数値を指差して確かめられる問題。選択肢・穴埋め中心
- 手順は問題文の中で明示する（例：「まず○÷△を計算します」の形の手がかり）
- 足場かけは多め。ヒントで手順を一つずつ示す
- AI先生は「一つずつ確かめよう」と寄り添う`,
  steady: `しっかり学ぶコース（認知レベル：適用・分析）。
- 基礎項目を「2ステップ」の問いで扱う（例：比例の式を求めてから値を計算する）
- 表や対応の組を比べて関係を説明する短答を含める（「なぜ比例といえる？」）
- 手順は一部だけ示し、残りは子どもが考える
- 足場かけは中くらい。ヒント1は考える方向、ヒント3で式の立て方を示す
- AI先生は「どうしてそう言える？」と対話的に問う`,
  fast: `ぐんぐん進むコース（認知レベル：分析・評価・創造）。
- 基礎項目を「複数の条件を比べる・判断の根拠を説明する」問いで扱う
- 比例か反比例かを、理由をつけて判断させる（どちらでもない例も含める）
- 逆算（値から関係の式を作る）や、表の誤りを見つけて評価する問いを含める
- 足場かけは最小限。手順は示さず、ヒントは考える視点だけ
- 時事や社会課題の題材は任意（使う場合も基礎項目の後に置き、基礎を省かない）
- AI先生は「ほかの見方はできる？」と挑発的に問う`,
}

export function buildProportionSection(courseLevel: string): string {
  const profile = PROPORTION_COURSE_PROFILE[courseLevel] || PROPORTION_COURSE_PROFILE.steady
  const items = PROPORTION_BASIC_ITEMS.map((b) => `  ${b.id}：${b.label}`).join('\n')
  return `
【★比例・反比例の必須基礎条件（全コース共通・最優先）★】
このコースも、次の基礎項目 B1〜B7 を教科書レベルで「ひとりで解ける」ところまで必ず扱うこと。
${items}
- 各基礎項目を最低1枚のカードで扱う。
- 全カードの basic_item に B1〜B7 のいずれかを入れる（基礎項目を扱わない発展だけのカードは作らない）。
- 基礎を省いたり、基礎を発展問題だけで置き換えたりしないこと。
- 差別化は、この基礎項目の上に「認知レベル」と「足場かけ（手がかりの量）」を重ねて行う。
- 各カードに bloom_level を入れる（remember / understand / apply / analyze / evaluate / create のいずれか）。
- 小学6年の範囲に限る。式は「y＝○×x」「x×y＝○」の形だけ。負の数、座標平面上の一般的な関係、中学の議論は出さない。
- 上にある「このコースの個性（学び方）」の指定より、下の認知レベルの指定を優先する。

【このコースの認知レベルと足場】
${profile}
`
}

// 品質の検査: 例題の答えが空、本問題と同じ答え、正解が空 を検出する（カード番号と理由の一覧）
export function checkProportionQuality(cards: any[]): string[] {
  const issues: string[] = []
  for (const card of cards || []) {
    const n = card?.card_number
    const ans = String(card?.answer ?? '').trim()
    const exAns = String(card?.example_answer ?? '').trim()
    if (!ans) issues.push(`#${n}: 正解(answer)が空`)
    if (!exAns) issues.push(`#${n}: 例題の答え(example_answer)が空`)
    if (ans && exAns && ans === exAns) issues.push(`#${n}: 例題の答えが本問題と同じ`)
  }
  return issues
}

// 生成されたカード群が、必須基礎 B1〜B7 を全て含んでいるか確認する。
// 戻り値は不足している基礎項目の ID 一覧（空配列なら合格）。
export function checkProportionCoverage(cards: any[]): string[] {
  const present = new Set<string>()
  for (const card of cards || []) {
    const m = String(card?.basic_item || '').match(/B[1-7]/)
    if (m) present.add(m[0])
  }
  return PROPORTION_BASIC_ITEMS.map((b) => b.id).filter((id) => !present.has(id))
}
