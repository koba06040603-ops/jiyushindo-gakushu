// モデル比較テスト（DBには書かない。結果は /tmp/model-compare に保存）
// 同一プロンプトで各モデルに1回ずつ生成させ、速度・JSON完成度・基本構造を記録する。
import fs from 'fs'
import { buildPrompt } from '../prompt-v14.mjs'
import { callGemini } from '../harness.mjs'

const MODELS = (process.env.MODELS || 'gemini-3.7-flash,gemini-3.8-flash,gemini-3.5-flash,gemini-3.5-flash-lite').split(',')
const NUM = Number(process.env.NUM || 6)
const ctx = { grade: '小学6年', subject: '算数', unit: '比', goal: '比の意味や性質を理解し、比を用いて数量の関係を表すことができる' }
const prompt = buildPrompt(ctx, NUM)
const OUT = '/tmp/model-compare'
fs.mkdirSync(OUT, { recursive: true })

function parseJSON(text) {
  const t = String(text || '').replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  const s = t.indexOf('{'), e = t.lastIndexOf('}')
  try { return JSON.parse(t.slice(s, e + 1)) } catch { return null }
}

const summary = []
for (const model of MODELS) {
  const t0 = Date.now()
  let res, err = null
  try { res = await callGemini(model, prompt, 24000, 0.2) } catch (e) { err = String(e.message || e) }
  const sec = ((Date.now() - t0) / 1000).toFixed(1)
  const json = res ? parseJSON(res.text) : null
  const cards = json?.cards || []
  const withHints = cards.filter(c => Array.isArray(c.hints) && c.hints.length === 3).length
  const withAnswer = cards.filter(c => c.answer && String(c.answer).trim()).length
  const row = { model, sec, finish: res?.finish, ok_json: !!json, cards: cards.length, hints3: withHints, answer_ok: withAnswer, error: err }
  summary.push(row)
  fs.writeFileSync(`${OUT}/${model}.txt`, res?.text || err || '')
  console.log(JSON.stringify(row))
}
fs.writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2))
