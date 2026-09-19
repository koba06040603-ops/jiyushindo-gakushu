#!/usr/bin/env node
/**
 * 厳密品質ベンチ: 実運用と同等の 10枚カード生成 + LLM-as-Judge による教育的品質評価
 */
import fs from 'node:fs'
import path from 'node:path'

const API_KEY = fs.readFileSync(path.resolve('.dev.vars'), 'utf-8').match(/GEMINI_API_KEY=(.+)/)[1].trim()
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const JUDGE = 'gemini-3.1-pro-preview'

const CANDIDATES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3-flash-preview']

const PROMPT = `あなたは小学校の自由進度学習を支援するAI教師です。
小学5年生・算数・単元「分数のたし算とひき算（異分母）」の学習カードを10枚、JSONで生成してください。
対象児童プロファイル: 視覚優位(visual)、ZPD位置30%（やや易しめ）、直近の正答率55%、フラストレーション傾向あり（足場を厚めに）

出力形式(JSON):
{"cards":[{"card_number":1,"title":"","learning_goal":"","question":"","answer":"","answer_keywords":["","",""],"answer_explanation":"途中式を含む100字以上","example_question":"","example_answer":"","hints":[{"hint_level":1,"hint_text":""},{"hint_level":2,"hint_text":""},{"hint_level":3,"hint_text":""}],"new_terms":[""],"ai_teacher_message":"","ai_teacher_advice":"","teacher_help_keywords":[""],"difficulty":"basic|standard|advanced","multimedia_ai_content":{"type":"illustration|diagram|animation","description":""}}]}

厳守事項:
1. JSONのみ出力
2. answer_explanation には必ず途中式・計算過程を含め100字以上
3. hints/new_terms/teacher_help_keywords/ai_teacher_message/ai_teacher_advice に answer(正解)そのものを絶対含めない
4. example_answer と answer は絶対に同じ値・同じ単語にしない
5. カード4枚目以降は応用的・発展的内容を含める
6. 学習指導要領の目標水準に合わせる
7. answerは自動採点できる明確な答えにし、answer_keywordsに判定用キーワード3つを設定
8. 視覚優位の児童向けに multimedia_ai_content を全カードに設定
9. 難易度は基礎→標準→発展へ段階的に配列すること`

// ---- 機械的検証 ----
function mechanicalCheck(json) {
  const errs = []
  const cards = json?.cards
  if (!Array.isArray(cards)) return { errs: ['cards配列なし'], count: 0 }
  if (cards.length !== 10) errs.push(`カード枚数${cards.length}/10`)
  for (const c of cards) {
    const n = c.card_number
    if (!c.question || !c.answer) errs.push(`c${n}:必須欠落`)
    if ((c.answer_explanation ?? '').length < 100) errs.push(`c${n}:解説${(c.answer_explanation ?? '').length}字`)
    const ans = String(c.answer ?? '').trim()
    const leak = [
      ...(c.hints ?? []).map((h) => h.hint_text),
      ...(c.new_terms ?? []),
      ...(c.teacher_help_keywords ?? []),
      c.ai_teacher_message,
      c.ai_teacher_advice,
    ].filter(Boolean)
    if (ans.length >= 2 && leak.some((f) => String(f).includes(ans))) errs.push(`c${n}:答え漏洩`)
    if (String(c.example_answer ?? '').trim() === ans && ans) errs.push(`c${n}:例題答え重複`)
    if ((c.answer_keywords ?? []).length < 3) errs.push(`c${n}:KW不足`)
    if ((c.hints ?? []).length < 3) errs.push(`c${n}:ヒント不足`)
    if (!c.multimedia_ai_content?.description) errs.push(`c${n}:メディア欠落`)
  }
  return { errs, count: cards.length }
}

async function call(model, prompt, config) {
  const t0 = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 240000)
  try {
    const res = await fetch(`${BASE}/${model}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: config }),
    })
    clearTimeout(timer)
    const ms = Date.now() - t0
    if (!res.ok) return { ok: false, ms, error: `HTTP ${res.status} ${(await res.text()).slice(0, 120)}` }
    const d = await res.json()
    const text = d?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
    return {
      ok: true, ms, text,
      outTokens: d?.usageMetadata?.candidatesTokenCount ?? 0,
      thoughtTokens: d?.usageMetadata?.thoughtsTokenCount ?? 0,
      finish: d?.candidates?.[0]?.finishReason,
    }
  } catch (e) {
    clearTimeout(timer)
    return { ok: false, ms: Date.now() - t0, error: e.message }
  }
}

async function judge(cardsJson) {
  const p = `あなたは日本の小学校教育の専門家（教育工学・学習科学）です。
以下はAIが生成した小学5年算数「分数のたし算とひき算（異分母）」の自由進度学習カード群です。
対象児童: 視覚優位、正答率55%、フラストレーション傾向あり（足場厚め）。

以下の6観点を各0-10点で厳格に採点し、JSONのみ返してください。甘い採点は禁止。7点が「実用可能」の基準。
1. curriculum_fit: 学習指導要領・5年算数の水準適合（易しすぎ/難しすぎは減点）
2. scaffolding: ヒント3段階が答えを教えずに思考を段階的に支える設計になっているか
3. explanation_quality: 途中式・計算過程が正確で児童に理解可能か（数学的誤りは大幅減点）
4. progression: 10枚が基礎→標準→発展へ適切に配列され、重複や飛躍がないか
5. leak_safety: 答え・例題答えの漏洩や重複が実質的にないか（表現の言い換えによる漏洩も減点）
6. personalization: 視覚優位・足場厚めというプロファイルが実際に反映されているか

出力: {"curriculum_fit":0,"scaffolding":0,"explanation_quality":0,"progression":0,"leak_safety":0,"personalization":0,"total":0,"critical_issues":["最大3件の致命的問題"],"comment":"100字以内"}

【採点対象】
${cardsJson.slice(0, 60000)}`
  const r = await call(JUDGE, p, { temperature: 0, maxOutputTokens: 8192, responseMimeType: 'application/json' })
  if (!r.ok) return { error: r.error }
  try {
    return JSON.parse(r.text.replace(/^```json\s*|\s*```$/g, ''))
  } catch (e) {
    return { error: 'judge parse fail: ' + r.text.slice(0, 200) }
  }
}

const out = []
for (const model of CANDIDATES) {
  process.stdout.write(`\n▶ ${model} 生成中...`)
  const r = await call(model, PROMPT, { temperature: 0.2, maxOutputTokens: 16384, responseMimeType: 'application/json' })
  if (!r.ok) {
    console.log(` ❌ ${r.error}`)
    out.push({ model, status: 'fail', error: r.error })
    continue
  }
  let json
  try {
    json = JSON.parse(r.text.replace(/^```json\s*|\s*```$/g, ''))
  } catch (e) {
    console.log(` ❌ JSONパース失敗 (finish=${r.finish}, out=${r.outTokens})`)
    out.push({ model, status: 'parse_fail', ms: r.ms, finish: r.finish })
    continue
  }
  const mech = mechanicalCheck(json)
  process.stdout.write(` ${(r.ms / 1000).toFixed(1)}s / 判定中...`)
  const j = await judge(JSON.stringify(json))
  console.log(' 完了')
  const rec = {
    model,
    status: 'ok',
    ms: r.ms,
    outTokens: r.outTokens,
    thoughtTokens: r.thoughtTokens,
    cardCount: mech.count,
    mechErrs: mech.errs,
    judge: j,
  }
  out.push(rec)
  fs.writeFileSync(`scripts/bench/out-${model}.json`, JSON.stringify(json, null, 2))
}

console.log('\n\n================ 結果サマリ ================')
console.log('model                      time   out  think  枚数 機械検証  LLM判定(total/60)')
for (const r of out) {
  if (r.status !== 'ok') {
    console.log(`${r.model.padEnd(26)} ${r.status} ${r.error ?? ''}`)
    continue
  }
  const t = r.judge?.total ?? '-'
  console.log(
    `${r.model.padEnd(26)} ${(r.ms / 1000).toFixed(1).padStart(5)}s ${String(r.outTokens).padStart(5)} ${String(r.thoughtTokens).padStart(6)} ${String(r.cardCount).padStart(4)} ${String(r.mechErrs.length + '件').padStart(6)}  ${String(t).padStart(5)}`
  )
  if (r.mechErrs.length) console.log(`   機械: ${r.mechErrs.slice(0, 5).join(', ')}`)
  if (r.judge && !r.judge.error) {
    console.log(
      `   内訳: 指導要領${r.judge.curriculum_fit} 足場${r.judge.scaffolding} 解説${r.judge.explanation_quality} 配列${r.judge.progression} 漏洩安全${r.judge.leak_safety} 個別化${r.judge.personalization}`
    )
    if (r.judge.critical_issues?.length) console.log(`   ⚠ ${r.judge.critical_issues.join(' / ')}`)
  } else if (r.judge?.error) console.log(`   judge error: ${r.judge.error}`)
}
fs.writeFileSync('scripts/bench/quality-results.json', JSON.stringify(out, null, 2))
