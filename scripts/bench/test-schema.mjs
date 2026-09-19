#!/usr/bin/env node
/** responseSchema（構造化出力）でJSON破損が解消するか検証 */
import fs from 'node:fs'
const API_KEY = fs.readFileSync('.dev.vars', 'utf-8').match(/GEMINI_API_KEY=(.+)/)[1].trim()
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const PROMPT = fs.readFileSync('scripts/bench/card-prompt.txt', 'utf-8')
const N = Number(process.env.N ?? 6)
const MODELS = process.argv.slice(2).length ? process.argv.slice(2) : ['gemini-3.8-flash']

const CARD_SCHEMA = {
  type: 'object',
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          card_number: { type: 'integer' },
          title: { type: 'string' },
          learning_goal: { type: 'string' },
          question: { type: 'string' },
          answer: { type: 'string' },
          answer_keywords: { type: 'array', items: { type: 'string' } },
          answer_explanation: { type: 'string' },
          example_question: { type: 'string' },
          example_answer: { type: 'string' },
          hints: {
            type: 'array',
            items: {
              type: 'object',
              properties: { hint_level: { type: 'integer' }, hint_text: { type: 'string' } },
              required: ['hint_level', 'hint_text'],
            },
          },
          new_terms: { type: 'array', items: { type: 'string' } },
          ai_teacher_message: { type: 'string' },
          ai_teacher_advice: { type: 'string' },
          teacher_help_keywords: { type: 'array', items: { type: 'string' } },
          difficulty: { type: 'string', enum: ['basic', 'standard', 'advanced'] },
          multimedia_ai_content: {
            type: 'object',
            properties: { type: { type: 'string' }, description: { type: 'string' } },
            required: ['type', 'description'],
          },
        },
        required: ['card_number', 'title', 'question', 'answer', 'answer_keywords',
          'answer_explanation', 'example_question', 'example_answer', 'hints',
          'ai_teacher_message', 'difficulty', 'multimedia_ai_content'],
      },
    },
  },
  required: ['cards'],
}

async function run(model, useSchema) {
  const cfg = { temperature: 0.2, maxOutputTokens: 16384, responseMimeType: 'application/json' }
  if (useSchema) cfg.responseSchema = CARD_SCHEMA
  const t0 = Date.now()
  const res = await fetch(`${BASE}/${model}:generateContent?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }], generationConfig: cfg }),
  })
  const ms = Date.now() - t0
  if (!res.ok) return { ok: false, ms, err: `HTTP ${res.status}: ${(await res.text()).slice(0, 120)}` }
  const d = await res.json()
  const text = d?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? ''
  try {
    const j = JSON.parse(text)
    return { ok: true, ms, cards: j.cards?.length ?? 0, out: d?.usageMetadata?.candidatesTokenCount }
  } catch (e) {
    return { ok: false, ms, err: 'PARSE: ' + e.message.slice(0, 60), out: d?.usageMetadata?.candidatesTokenCount }
  }
}

for (const m of MODELS) {
  for (const useSchema of [false, true]) {
    const rs = await Promise.all(Array.from({ length: N }, () => run(m, useSchema)))
    const ok = rs.filter(r => r.ok)
    const avg = ok.length ? Math.round(ok.reduce((s, r) => s + r.ms, 0) / ok.length) : 0
    console.log(`${m.padEnd(24)} schema=${String(useSchema).padEnd(5)} 成功 ${ok.length}/${N}  平均${avg}ms  枚数${ok.map(r => r.cards).join(',')}`)
    rs.filter(r => !r.ok).forEach(r => console.log(`    ✗ ${r.err}`))
  }
}
