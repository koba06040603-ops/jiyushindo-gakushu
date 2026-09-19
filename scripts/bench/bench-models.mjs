#!/usr/bin/env node
/**
 * Gemini モデル比較ベンチマーク
 * 自由進度学習システムの実タスク（カード生成 / 軽量分析 / フィードバック）で
 * 各モデルの レイテンシ・JSON妥当性・品質 を計測する。
 *
 * 使い方: node scripts/bench/bench-models.mjs [--tasks card,lite] [--runs 1]
 */
import fs from 'node:fs'
import path from 'node:path'

const envText = fs.readFileSync(path.resolve('.dev.vars'), 'utf-8')
const API_KEY = envText.match(/GEMINI_API_KEY=(.+)/)[1].trim()
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// ---- 候補モデル ----------------------------------------------------
const QUALITY_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
]
const LITE_CANDIDATES = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash-lite',
]

// ---- タスク定義 ----------------------------------------------------
const CARD_PROMPT = `あなたは小学校の自由進度学習を支援するAIです。
小学5年生・算数・単元「分数のたし算とひき算」の学習カードを4枚、JSONで生成してください。

出力形式(JSON):
{"cards":[{"card_number":1,"title":"...","learning_goal":"...","question":"...","answer":"...","answer_keywords":["","",""],"answer_explanation":"途中式を含む100字以上の解説","example_question":"...","example_answer":"...","hints":[{"hint_level":1,"hint_text":"..."},{"hint_level":2,"hint_text":"..."}],"new_terms":["",""],"ai_teacher_message":"...","difficulty":"basic|standard|advanced"}]}

厳守事項:
1. JSONのみ出力（説明文なし）
2. answer_explanation には必ず途中式・計算過程を含め100字以上
3. hints / new_terms / ai_teacher_message に answer(正解)そのものを絶対含めない
4. example_answer と answer は絶対に同じ値にしない
5. 3枚目以降は応用的・発展的内容
6. 学習指導要領の目標水準に合わせる`

const LITE_PROMPT = `児童の学習ログを分析し、JSONのみで返答してください。
学習ログ: 正答率62%、平均解答時間 3分20秒、ヒント使用率45%、直近3問連続不正解、単元「分数のたし算」
出力形式: {"state":"stagnant|growing|mastered","cause":"20字以内","next_action":"30字以内","difficulty_adjust":-1|0|1,"encouragement":"児童向け40字以内"}`

const FEEDBACK_PROMPT = `小学5年生の解答に対する形成的フィードバックを作成してください。JSONのみ出力。
問題: 2/3 + 1/4 を計算しなさい
児童の解答: 3/7
正解: 11/12
出力形式: {"is_correct":false,"misconception":"誤概念の特定(40字)","feedback":"児童向け励まし+気づきを促す問いかけ(100字程度、答えは教えない)","next_hint":"次の一手(40字)"}`

const TASKS = {
  card: {
    label: 'カード/問題生成（品質重視）',
    prompt: CARD_PROMPT,
    candidates: QUALITY_CANDIDATES,
    config: { temperature: 0.2, maxOutputTokens: 16384, responseMimeType: 'application/json' },
    validate: (json) => {
      const errs = []
      const cards = json?.cards
      if (!Array.isArray(cards) || cards.length < 3) return ['cards配列が不正']
      for (const c of cards) {
        if (!c.question || !c.answer) errs.push(`card${c.card_number}: question/answer欠落`)
        if (!c.answer_explanation || c.answer_explanation.length < 100)
          errs.push(`card${c.card_number}: 解説100字未満(${c.answer_explanation?.length ?? 0})`)
        // 答え漏洩チェック
        const leakFields = [
          ...(c.hints ?? []).map((h) => h.hint_text),
          ...(c.new_terms ?? []),
          c.ai_teacher_message,
        ].filter(Boolean)
        const ans = String(c.answer).trim()
        if (ans.length >= 2 && leakFields.some((f) => String(f).includes(ans)))
          errs.push(`card${c.card_number}: 答え漏洩`)
        if (c.example_answer && String(c.example_answer).trim() === ans)
          errs.push(`card${c.card_number}: 例題答え重複`)
        if (!Array.isArray(c.answer_keywords) || c.answer_keywords.length < 3)
          errs.push(`card${c.card_number}: キーワード不足`)
      }
      return errs
    },
  },
  lite: {
    label: '学習状態分析（軽量・高頻度）',
    prompt: LITE_PROMPT,
    candidates: [...LITE_CANDIDATES, 'gemini-3.5-flash'],
    config: { temperature: 0.3, maxOutputTokens: 2048, responseMimeType: 'application/json' },
    validate: (json) => {
      const errs = []
      if (!['stagnant', 'growing', 'mastered'].includes(json?.state)) errs.push('state不正')
      if (!json?.next_action) errs.push('next_action欠落')
      if (typeof json?.difficulty_adjust !== 'number') errs.push('difficulty_adjust不正')
      if (!json?.encouragement) errs.push('encouragement欠落')
      return errs
    },
  },
  feedback: {
    label: 'つまずきフィードバック（中量）',
    prompt: FEEDBACK_PROMPT,
    candidates: [...LITE_CANDIDATES, 'gemini-3.5-flash', 'gemini-3.8-flash'],
    config: { temperature: 0.4, maxOutputTokens: 4096, responseMimeType: 'application/json' },
    validate: (json) => {
      const errs = []
      if (json?.is_correct !== false) errs.push('正誤判定ミス')
      if (!json?.misconception) errs.push('misconception欠落')
      if (!json?.feedback) errs.push('feedback欠落')
      if (json?.feedback && String(json.feedback).includes('11/12')) errs.push('答え漏洩')
      return errs
    },
  },
}

async function callModel(model, prompt, config) {
  const t0 = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 180000)
  try {
    const res = await fetch(`${BASE}/${model}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: config }),
    })
    clearTimeout(timer)
    const ms = Date.now() - t0
    if (!res.ok) {
      const t = await res.text()
      return { ok: false, ms, error: `HTTP ${res.status}: ${t.slice(0, 160)}` }
    }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
    const usage = data?.usageMetadata ?? {}
    let json = null
    let parseErr = null
    try {
      json = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''))
    } catch (e) {
      parseErr = e.message
    }
    return {
      ok: true,
      ms,
      text,
      json,
      parseErr,
      promptTokens: usage.promptTokenCount ?? 0,
      outTokens: usage.candidatesTokenCount ?? 0,
      thoughtTokens: usage.thoughtsTokenCount ?? 0,
      finishReason: data?.candidates?.[0]?.finishReason,
    }
  } catch (e) {
    clearTimeout(timer)
    return { ok: false, ms: Date.now() - t0, error: e.message }
  }
}

const args = process.argv.slice(2)
const taskArg = args.includes('--tasks') ? args[args.indexOf('--tasks') + 1].split(',') : Object.keys(TASKS)
const RUNS = args.includes('--runs') ? Number(args[args.indexOf('--runs') + 1]) : 1

const results = {}
for (const taskName of taskArg) {
  const task = TASKS[taskName]
  if (!task) continue
  console.log(`\n===== TASK: ${taskName} — ${task.label} =====`)
  results[taskName] = []
  for (const model of task.candidates) {
    const runs = []
    for (let i = 0; i < RUNS; i++) {
      const r = await callModel(model, task.prompt, task.config)
      runs.push(r)
    }
    const okRuns = runs.filter((r) => r.ok && r.json)
    if (okRuns.length === 0) {
      console.log(`❌ ${model.padEnd(32)} 失敗: ${runs[0].error ?? runs[0].parseErr ?? 'JSON parse失敗'}`)
      results[taskName].push({ model, status: 'fail', detail: runs[0].error ?? runs[0].parseErr })
      continue
    }
    const avgMs = Math.round(okRuns.reduce((s, r) => s + r.ms, 0) / okRuns.length)
    const avgOut = Math.round(okRuns.reduce((s, r) => s + r.outTokens, 0) / okRuns.length)
    const avgThought = Math.round(okRuns.reduce((s, r) => s + r.thoughtTokens, 0) / okRuns.length)
    const allErrs = okRuns.flatMap((r) => task.validate(r.json))
    const score = Math.max(0, 100 - allErrs.length * 10)
    console.log(
      `${allErrs.length === 0 ? '✅' : '⚠️ '} ${model.padEnd(32)} ${String(avgMs).padStart(6)}ms  out=${String(avgOut).padStart(5)} think=${String(avgThought).padStart(5)}  品質=${score}  ${allErrs.length ? allErrs.slice(0, 3).join(' / ') : 'OK'}`
    )
    results[taskName].push({ model, status: 'ok', avgMs, avgOut, avgThought, score, errs: allErrs })
  }
}

fs.writeFileSync('scripts/bench/bench-results.json', JSON.stringify(results, null, 2))
console.log('\n📄 結果を scripts/bench/bench-results.json に保存しました')
