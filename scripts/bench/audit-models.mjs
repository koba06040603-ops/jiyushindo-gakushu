#!/usr/bin/env node
/**
 * モデル使用状況 監査ツール
 * ============================================================
 * ソース内の全 Gemini API 呼び出しを静的解析し、
 *   1. どのエンドポイントが、どのモデル（定数/ハードコード）を使っているか
 *   2. そのモデルが実際に API で生きているか（生死確認）
 *   3. 定数化されていない生モデル名・未使用定数
 * を一覧化する。
 *
 * 使い方:
 *   node scripts/bench/audit-models.mjs          # 静的解析のみ
 *   node scripts/bench/audit-models.mjs --live   # API 生死確認も実施
 */
import fs from 'node:fs'

const SRC = 'src/index.tsx'
const LIVE = process.argv.includes('--live')
const src = fs.readFileSync(SRC, 'utf-8')
const lines = src.split('\n')

// ---- 1. モデル定数の定義を収集 ----
const constDefs = new Map()
for (const m of src.matchAll(/^const (GEMINI_MODEL_[A-Z_]+)\s*=\s*'([^']+)'/gm)) {
  constDefs.set(m[1], m[2])
}

// ---- 2. 直近のエンドポイント定義を引くための索引 ----
const endpoints = []
lines.forEach((l, i) => {
  const m = l.match(/app\.(get|post|put|delete)\(\s*['"`]([^'"`]+)['"`]/)
  if (m) endpoints.push({ line: i + 1, method: m[1].toUpperCase(), path: m[2] })
})
function endpointAt(lineNo) {
  let found = null
  for (const e of endpoints) {
    if (e.line <= lineNo) found = e
    else break
  }
  return found
}

// ---- 3. 全 generateContent 呼び出しを抽出 ----
const calls = []
lines.forEach((l, i) => {
  if (!l.includes('generativelanguage.googleapis.com')) return
  const lineNo = i + 1
  let model = null
  let kind = null

  const tmpl = l.match(/models\/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/)
  const raw = l.match(/models\/(gemini-[a-z0-9.\-]+)/)
  if (tmpl) {
    model = tmpl[1]
    kind = constDefs.has(tmpl[1]) ? 'const' : 'variable'
  } else if (raw) {
    model = raw[1]
    kind = 'hardcoded'
  } else {
    return
  }

  // シングルクォート内に ${} がある = 展開されないバグ
  const brokenTemplate = /'[^']*\$\{[A-Za-z_]/.test(l) && !l.trimStart().startsWith('//')
  calls.push({ lineNo, model, kind, brokenTemplate, endpoint: endpointAt(lineNo) })
})

// ---- 4. 集計 ----
console.log('='.repeat(78))
console.log('  Gemini モデル使用状況 監査レポート')
console.log('='.repeat(78))

console.log('\n■ 定義されているモデル定数\n')
const usedConsts = new Set(calls.filter(c => c.kind === 'const').map(c => c.model))
// 定数は配列(getModelChain / models=[...]) 経由でも使われるため本文全体で検索
for (const [name, value] of constDefs) {
  const refs = (src.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length - 1 // 定義行を除く
  const flag = refs === 0 ? '⚠️ 未使用' : ''
  console.log(`  ${name.padEnd(30)} = ${value.padEnd(32)} 参照${String(refs).padStart(3)}箇所 ${flag}`)
}

console.log('\n■ ハードコードされた生モデル名（定数化推奨）\n')
const hard = calls.filter(c => c.kind === 'hardcoded')
if (hard.length === 0) console.log('  なし')
const hardAgg = new Map()
for (const c of hard) {
  if (!hardAgg.has(c.model)) hardAgg.set(c.model, [])
  hardAgg.get(c.model).push(c)
}
for (const [model, cs] of [...hardAgg].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${model.padEnd(34)} ${cs.length}箇所`)
  for (const c of cs.slice(0, 4)) {
    const ep = c.endpoint ? `${c.endpoint.method} ${c.endpoint.path}` : '(不明)'
    console.log(`      L${String(c.lineNo).padEnd(6)} ${ep}`)
  }
  if (cs.length > 4) console.log(`      ... 他${cs.length - 4}箇所`)
}

console.log('\n■ テンプレートリテラル展開バグ（シングルクォート内の ${}）\n')
const broken = calls.filter(c => c.brokenTemplate)
if (broken.length === 0) console.log('  なし ✅')
for (const c of broken) {
  const ep = c.endpoint ? `${c.endpoint.method} ${c.endpoint.path}` : '(不明)'
  console.log(`  ❌ L${c.lineNo} ${ep} — モデル名がリテラル文字列になり常に404`)
}

console.log('\n■ エンドポイント別の使用モデル\n')
const byEp = new Map()
for (const c of calls) {
  const key = c.endpoint ? `${c.endpoint.method} ${c.endpoint.path}` : '(トップレベル/ヘルパー)'
  if (!byEp.has(key)) byEp.set(key, new Set())
  byEp.get(key).add(c.kind === 'const' ? `${c.model}→${constDefs.get(c.model)}` : c.model)
}
for (const [ep, models] of [...byEp].sort()) {
  console.log(`  ${ep}`)
  console.log(`      ${[...models].join(', ')}`)
}

console.log(`\n■ 合計: ${calls.length} 箇所の Gemini API 呼び出し`)
console.log(`   定数使用 ${calls.filter(c => c.kind === 'const').length} / ハードコード ${hard.length} / 変数 ${calls.filter(c => c.kind === 'variable').length}`)

// ---- 5. 生死確認 ----
if (LIVE) {
  const keyFile = fs.readFileSync('.dev.vars', 'utf-8')
  const API_KEY = keyFile.match(/GEMINI_API_KEY=(.+)/)[1].trim()
  const targets = new Set([...constDefs.values(), ...hardAgg.keys()])

  console.log('\n■ モデル生死確認（実 API 呼び出し）\n')
  const results = await Promise.all([...targets].map(async (m) => {
    // 画像/TTS 系は専用パラメータが要るため、まず素で試し 400 なら用途別に再試行
    const base = { contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 10 } }
    const post = async (body) => {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      let msg = ''
      if (!r.ok) { try { msg = (await r.json())?.error?.message ?? '' } catch {} }
      return { status: r.status, msg }
    }
    let r = await post(base)
    let note = ''
    if (r.status === 400 && /tts/.test(m)) {
      const r2 = await post({ contents: [{ parts: [{ text: 'こんにちは' }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } })
      if (r2.status === 200) { r = r2; note = '(TTS: responseModalities 必須)' }
    }
    if (r.status === 400 && /image/.test(m)) {
      const r2 = await post({ contents: [{ parts: [{ text: 'a red circle' }] }], generationConfig: { responseModalities: ['IMAGE'] } })
      if (r2.status === 200) { r = r2; note = '(画像: responseModalities 必須)' }
    }
    return { model: m, status: r.status, msg: r.msg, note }
  }))

  for (const r of results.sort((a, b) => a.status - b.status || a.model.localeCompare(b.model))) {
    const icon = r.status === 200 ? '✅' : '❌'
    console.log(`  ${icon} ${String(r.status)} ${r.model.padEnd(34)} ${r.note}${r.msg ? ' ' + r.msg.slice(0, 70) : ''}`)
  }
  const dead = results.filter(r => r.status !== 200)
  console.log(`\n  生存 ${results.length - dead.length}/${results.length}`)
  if (dead.length) {
    console.log('  ⚠️ 要対応:')
    for (const d of dead) console.log(`     - ${d.model}: ${d.msg.slice(0, 80)}`)
  }
}
