#!/usr/bin/env node
/**
 * 安定性ベンチ: 同一プロンプトを N 回ずつ並列実行し、
 * 成功率・レイテンシ分散・品質分散を計測する。
 */
import fs from 'node:fs'
import path from 'node:path'

const API_KEY = fs.readFileSync(path.resolve('.dev.vars'), 'utf-8').match(/GEMINI_API_KEY=(.+)/)[1].trim()
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const JUDGE = 'gemini-3.1-pro-preview'
const N = Number(process.env.N ?? 4)
const MODELS = process.argv.slice(2).length ? process.argv.slice(2) : ['gemini-3.8-flash', 'gemini-3.5-flash']

const PROMPT = fs.readFileSync('scripts/bench/card-prompt.txt', 'utf-8')

function mech(json) {
  const errs = []
  const cards = json?.cards
  if (!Array.isArray(cards)) return ['cards配列なし']
  if (cards.length !== 10) errs.push(`枚数${cards.length}`)
  for (const c of cards) {
    const n = c.card_number
    if (!c.question || !c.answer) errs.push(`c${n}:必須欠落`)
    if ((c.answer_explanation ?? '').length < 100) errs.push(`c${n}:解説短`)
    const ans = String(c.answer ?? '').trim()
    const leak = [...(c.hints ?? []).map(h => h.hint_text), ...(c.new_terms ?? []),
      ...(c.teacher_help_keywords ?? []), c.ai_teacher_message, c.ai_teacher_advice].filter(Boolean)
    if (ans.length >= 2 && leak.some(f => String(f).includes(ans))) errs.push(`c${n}:漏洩`)
    if (String(c.example_answer ?? '').trim() === ans && ans) errs.push(`c${n}:例題重複`)
    if ((c.answer_keywords ?? []).length < 3) errs.push(`c${n}:KW不足`)
    if ((c.hints ?? []).length < 3) errs.push(`c${n}:ヒント不足`)
  }
  return errs
}

async function call(model, prompt, config, timeout = 240000) {
  const t0 = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(`${BASE}/${model}:generateContent?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: config }),
    })
    clearTimeout(timer)
    const ms = Date.now() - t0
    if (!res.ok) return { ok: false, ms, error: `HTTP ${res.status}` }
    const d = await res.json()
    return { ok: true, ms, text: d?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? '',
      outTokens: d?.usageMetadata?.candidatesTokenCount ?? 0,
      thoughtTokens: d?.usageMetadata?.thoughtsTokenCount ?? 0,
      finish: d?.candidates?.[0]?.finishReason }
  } catch (e) { clearTimeout(timer); return { ok: false, ms: Date.now() - t0, error: e.message } }
}

async function judge(cards) {
  const p = `あなたは日本の小学校教育の専門家です。以下はAI生成の小学5年算数「分数のたし算とひき算（異分母）」自由進度学習カードです。
対象児童: 視覚優位、正答率55%、フラストレーション傾向あり（足場厚め）。
6観点を各0-10点で厳格採点しJSONのみ返答。7点が実用可能の基準。
1 curriculum_fit 指導要領適合 / 2 scaffolding ヒント3段階が答えを教えず思考を支えるか / 3 explanation_quality 途中式の数学的正確さ / 4 progression 基礎→発展の配列と重複のなさ / 5 leak_safety 答え漏洩・例題重複のなさ / 6 personalization プロファイル反映
出力: {"curriculum_fit":0,"scaffolding":0,"explanation_quality":0,"progression":0,"leak_safety":0,"personalization":0,"total":0,"comment":"60字以内"}
【対象】\n${cards.slice(0, 60000)}`
  const r = await call(JUDGE, p, { temperature: 0, maxOutputTokens: 8192, responseMimeType: 'application/json' })
  if (!r.ok) return null
  try { return JSON.parse(r.text.replace(/^```json\s*|\s*```$/g, '')) } catch { return null }
}

async function trial(model) {
  const r = await call(model, PROMPT, { temperature: 0.2, maxOutputTokens: 16384, responseMimeType: 'application/json' })
  if (!r.ok) return { ok: false, reason: r.error, ms: r.ms }
  let json
  try { json = JSON.parse(r.text.replace(/^```json\s*|\s*```$/g, '')) }
  catch { return { ok: false, reason: 'JSON_PARSE_FAIL', ms: r.ms, finish: r.finish } }
  const errs = mech(json)
  const j = await judge(JSON.stringify(json))
  return { ok: true, ms: r.ms, outTokens: r.outTokens, thoughtTokens: r.thoughtTokens, mechErrs: errs.length, errs, judge: j }
}

const summary = []
for (const model of MODELS) {
  console.log(`\n▶ ${model} × ${N}回 並列実行...`)
  const runs = await Promise.all(Array.from({ length: N }, () => trial(model)))
  const okRuns = runs.filter(r => r.ok)
  const scored = okRuns.filter(r => r.judge?.total != null)
  const totals = scored.map(r => r.judge.total)
  const times = okRuns.map(r => r.ms / 1000)
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0
  const rec = {
    model,
    successRate: `${okRuns.length}/${N}`,
    failures: runs.filter(r => !r.ok).map(r => r.reason),
    avgSec: +avg(times).toFixed(1),
    minSec: times.length ? +Math.min(...times).toFixed(1) : null,
    maxSec: times.length ? +Math.max(...times).toFixed(1) : null,
    avgScore: +avg(totals).toFixed(1),
    minScore: totals.length ? Math.min(...totals) : null,
    maxScore: totals.length ? Math.max(...totals) : null,
    avgMechErrs: +avg(okRuns.map(r => r.mechErrs)).toFixed(1),
    subscores: {
      curriculum: +avg(scored.map(r => r.judge.curriculum_fit)).toFixed(1),
      scaffolding: +avg(scored.map(r => r.judge.scaffolding)).toFixed(1),
      explanation: +avg(scored.map(r => r.judge.explanation_quality)).toFixed(1),
      progression: +avg(scored.map(r => r.judge.progression)).toFixed(1),
      leak_safety: +avg(scored.map(r => r.judge.leak_safety)).toFixed(1),
      personalization: +avg(scored.map(r => r.judge.personalization)).toFixed(1),
    },
    avgThought: Math.round(avg(okRuns.map(r => r.thoughtTokens))),
  }
  summary.push(rec)
  console.log(`  成功 ${rec.successRate} / ${rec.avgSec}s (${rec.minSec}-${rec.maxSec}) / 品質 ${rec.avgScore} (${rec.minScore}-${rec.maxScore}) / 機械エラー ${rec.avgMechErrs}`)
  console.log(`  内訳: 要領${rec.subscores.curriculum} 足場${rec.subscores.scaffolding} 解説${rec.subscores.explanation} 配列${rec.subscores.progression} 漏洩${rec.subscores.leak_safety} 個別${rec.subscores.personalization}`)
  if (rec.failures.length) console.log(`  失敗理由: ${rec.failures.join(', ')}`)
}

console.log('\n============ 総合ランキング（品質順） ============')
for (const r of [...summary].sort((a, b) => b.avgScore - a.avgScore)) {
  console.log(`${r.model.padEnd(26)} 品質${String(r.avgScore).padStart(5)}/60  ${String(r.avgSec).padStart(5)}s  成功${r.successRate}  思考T=${r.avgThought}`)
}
fs.writeFileSync('scripts/bench/stability-results.json', JSON.stringify(summary, null, 2))
