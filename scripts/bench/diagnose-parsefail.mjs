#!/usr/bin/env node
/** JSONパース失敗の原因診断 */
import fs from 'node:fs'
const API_KEY = fs.readFileSync('.dev.vars', 'utf-8').match(/GEMINI_API_KEY=(.+)/)[1].trim()
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const PROMPT = fs.readFileSync('scripts/bench/card-prompt.txt', 'utf-8')
const MODELS = process.argv.slice(2).length ? process.argv.slice(2) : ['gemini-3.8-flash']
const N = Number(process.env.N ?? 4)
const MAXTOK = Number(process.env.MAXTOK ?? 16384)

async function run(model) {
  const res = await fetch(`${BASE}/${model}:generateContent?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: MAXTOK, responseMimeType: 'application/json' },
    }),
  })
  const d = await res.json()
  const c = d?.candidates?.[0]
  const text = c?.content?.parts?.map(p => p.text).join('') ?? ''
  let parse = 'OK'
  try { JSON.parse(text) } catch (e) { parse = e.message.slice(0, 80) }
  return {
    finish: c?.finishReason,
    out: d?.usageMetadata?.candidatesTokenCount,
    thought: d?.usageMetadata?.thoughtsTokenCount,
    total: d?.usageMetadata?.totalTokenCount,
    len: text.length,
    parse,
    tail: text.slice(-80).replace(/\n/g, '\\n'),
  }
}

for (const m of MODELS) {
  console.log(`\n=== ${m} (maxOutputTokens=${MAXTOK}) ===`)
  const rs = await Promise.all(Array.from({ length: N }, () => run(m)))
  for (const r of rs) {
    console.log(`finish=${String(r.finish).padEnd(12)} out=${String(r.out).padStart(5)} think=${String(r.thought).padStart(5)} total=${String(r.total).padStart(6)} len=${String(r.len).padStart(6)} parse=${r.parse}`)
    if (r.parse !== 'OK') console.log(`   末尾: ...${r.tail}`)
  }
}
