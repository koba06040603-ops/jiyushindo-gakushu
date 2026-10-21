// ============================================================
// 学習カードの紙印刷用ページ
//
// 画面（PC/タブレット）用のSPA表示をそのまま印刷すると、
// ボタン・タブ・チャット・AI演出など紙では意味のない要素が混ざり、
// 1枚あたり数ページに膨らんでしまう。
// そこでサーバー側で「紙に必要な要素だけ」を組み直して返す。
//
// 紙面に載せるもの:
//   氏名欄 / 問題文 / 図 / 例題 / ヒント（3段すべて） / 解答欄
// 紙面に載せないもの:
//   ボタン類・タブ・AIチャット・進捗バー・「AI先生」の演出文・操作説明
//
// 答えと解説は既定では別紙（最後にまとめる）。?answers=none で省略、
// ?answers=inline で各カードの直後に出す（教師用）。
// ============================================================

export interface PrintCardRow {
  card_number?: number
  card_title?: string
  passage?: string | null
  problem_description?: string
  problem_text?: string
  problem_content?: string
  problem_image_url?: string | null
  answer?: string
  correct_answer?: string
  answer_explanation?: string
  explanation?: string
  example_problem?: string
  example_answer?: string
  example_solution?: string
  example_image_url?: string | null
  hints?: Array<{ hint_level?: number; hint_text?: string }>
}

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// 改行を保ったまま安全にHTML化する
function escMultiline(s: any): string {
  return esc(s).replace(/\n/g, '<br>')
}

/** 問題文として使うテキストを、列名のゆれを吸収して1つ選ぶ */
function pickProblem(card: PrintCardRow): string {
  return String(card.problem_description || card.problem_text || card.problem_content || '')
}

function pickAnswer(card: PrintCardRow): string {
  return String(card.answer || card.correct_answer || '')
}

function pickExplanation(card: PrintCardRow): string {
  return String(card.answer_explanation || card.explanation || '')
}

/** 図（SVGのdata URL または 画像URL）を紙面用に出す */
function figureHTML(url?: string | null): string {
  if (!url) return ''
  return `<div class="p-figure"><img src="${esc(url)}" alt=""></div>`
}

/** 解答欄の行数を、答えの長さから推定する（紙に書くスペースを確保） */
function answerBoxHeight(answer: string): string {
  const len = answer.length
  if (len <= 8) return '18mm'
  if (len <= 30) return '26mm'
  return '38mm'
}

export interface PrintOptions {
  /** 'append'(既定) = 最後にまとめて / 'inline' = 各問の直後 / 'none' = 印刷しない */
  answers?: 'append' | 'inline' | 'none'
  /** ヒントを印刷するか（既定 true） */
  hints?: boolean
  /** 例題を印刷するか（既定 true） */
  examples?: boolean
  /** 1枚のカードごとに改ページするか（既定 true）。false で詰めて印刷 */
  onePerPage?: boolean
  /** 画面上で図の差し替え・削除ボタンを出すか（印刷では非表示） */
  editable?: boolean
}

/** 学習カードの本体（カード列＋答えの別紙）だけを返す。枠（HTML/ヘッダー）は含まない */
export function renderCardsBodyForPrint(cards: PrintCardRow[], opts: PrintOptions = {}): string {
  const answersMode = opts.answers || 'append'
  const showHints = opts.hints !== false
  const showExamples = opts.examples !== false
  const onePerPage = opts.onePerPage !== false

  const cardHTML = cards.map((card, i) => {
    const no = card.card_number ?? i + 1
    const problem = pickProblem(card)
    const answer = pickAnswer(card)
    const hints = Array.isArray(card.hints) ? card.hints : []

    const passageBlock = card.passage
      ? `<div class="p-passage">
           <div class="p-passage-label">文章</div>
           <div class="p-passage-body">${escMultiline(card.passage)}</div>
         </div>`
      : ''

    const exampleBlock = (showExamples && card.example_problem)
      ? `<div class="p-example">
           <div class="p-label">れい（やりかたの かくにん）</div>
           <div class="p-example-q">${escMultiline(card.example_problem)}</div>
           ${figureHTML(card.example_image_url)}
           ${card.example_solution ? `<div class="p-example-s">${escMultiline(card.example_solution)}</div>` : ''}
           ${card.example_answer ? `<div class="p-example-a">こたえ: ${escMultiline(card.example_answer)}</div>` : ''}
         </div>`
      : ''

    const hintBlock = (showHints && hints.length)
      ? `<div class="p-hints">
           <div class="p-label">ヒント（こまったときだけ 見よう）</div>
           ${hints.map((h, hi) => `
             <div class="p-hint">
               <span class="p-hint-no">${(h.hint_level ?? hi + 1)}</span>
               <span>${escMultiline(h.hint_text)}</span>
             </div>`).join('')}
         </div>`
      : ''

    const answerInline = (answersMode === 'inline')
      ? `<div class="p-answer-inline">
           <div class="p-label">こたえ</div>
           <div><strong>${escMultiline(answer)}</strong></div>
           ${pickExplanation(card) ? `<div class="p-expl">${escMultiline(pickExplanation(card))}</div>` : ''}
         </div>`
      : ''

    const cardId = (card as any).card_id ?? (card as any).id
    const figureTools = (opts.editable && cardId)
      ? `<div class="p-edit-bar no-print">
           <span>図：</span>
           <button type="button" onclick="pickFigure(${Number(cardId)}, this)">図を差し替える</button>
           <button type="button" onclick="removeFigure(${Number(cardId)}, this)">図を外す</button>
           <span class="p-edit-msg"></span>
         </div>`
      : ''

    return `
      <section class="p-card${onePerPage ? ' p-break' : ''}" data-card-id="${cardId ?? ''}">
        <div class="p-card-head">
          <span class="p-card-no">${no}</span>
          <h2 class="p-card-title">${esc(card.card_title || '')}</h2>
        </div>
        ${passageBlock}
        <div class="p-problem">${escMultiline(problem)}</div>
        ${figureTools}
        ${figureHTML(card.problem_image_url)}
        ${exampleBlock}
        <div class="p-answer-box" style="min-height:${answerBoxHeight(answer)}">
          <div class="p-answer-label">じぶんの こたえ</div>
        </div>
        ${hintBlock}
        ${answerInline}
      </section>`
  }).join('')

  // 答え合わせ用の別紙（児童が自分で丸つけできるようにする）
  const answerSheet = (answersMode === 'append')
    ? `<section class="p-card p-answersheet">
         <h2 class="p-sheet-title">こたえ・とき方</h2>
         <p class="p-sheet-note">じぶんで といてから 見ましょう。</p>
         ${cards.map((card, i) => {
           const no = card.card_number ?? i + 1
           const expl = pickExplanation(card)
           return `
             <div class="p-ans-row">
               <div class="p-ans-head"><span class="p-card-no-sm">${no}</span> ${esc(card.card_title || '')}</div>
               <div class="p-ans-val">こたえ: <strong>${escMultiline(pickAnswer(card))}</strong></div>
               ${expl ? `<div class="p-ans-expl">${escMultiline(expl)}</div>` : ''}
             </div>`
         }).join('')}
       </section>`
    : ''

  return `${cardHTML || '<p>印刷できるカードがありません。</p>'}
    ${answerSheet}`
}

export function renderCardsPrintPage(
  meta: { unitName?: string; grade?: string; courseName?: string; subject?: string },
  cards: PrintCardRow[],
  opts: PrintOptions = {}
): string {
  const title = `${meta.unitName || '学習カード'}${meta.courseName ? '（' + meta.courseName + '）' : ''}`
  return wrapPrintDocument(title, {
    unitName: meta.unitName, grade: meta.grade, subject: meta.subject, courseName: meta.courseName,
  }, renderCardsBodyForPrint(cards, opts), !!opts.editable)
}

export interface PrintMeta {
  unitName?: string; grade?: string; subject?: string; courseName?: string; textbook?: string
}

/** 図の差し替え・削除を行う画面用スクリプト（印刷には出ない）。保存はログイン中のトークンを使う */
function editorScript(): string {
  return `<script>
(function(){
  var TOKEN = null;
  try { TOKEN = localStorage.getItem('session_token'); } catch (e) {}
  function msg(btn, text){ var m = btn.parentElement.querySelector('.p-edit-msg'); if (m) m.textContent = text || ''; }
  function card(btn){ return btn.closest('section.p-card'); }
  function save(cardId, body, btn){
    if (!TOKEN) { msg(btn, 'ログインしてから保存してください（ログイン画面で開き直してください）'); return; }
    msg(btn, '保存中…');
    fetch('/api/card/' + cardId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
      body: JSON.stringify(body)
    }).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(){ msg(btn, '保存しました。印刷前に再読み込みして確認してください。'); })
      .catch(function(e){ msg(btn, '保存できませんでした（' + e.message + '）'); });
  }
  window.removeFigure = function(cardId, btn){
    if (!confirm('この問題の図を外しますか？（問題文だけになります）')) return;
    var c = card(btn); var img = c.querySelector('.p-figure'); if (img) img.remove();
    save(cardId, { problem_image_url: null }, btn);
  };
  window.pickFigure = function(cardId, btn){
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/png,image/jpeg,image/svg+xml';
    input.onchange = function(){
      var f = input.files && input.files[0]; if (!f) return;
      if (f.size > 700 * 1024) { msg(btn, '画像が大きすぎます（700KB 以下にしてください）'); return; }
      var rd = new FileReader();
      rd.onload = function(){
        var dataUrl = rd.result;
        var c = card(btn); var old = c.querySelector('.p-figure');
        var box = document.createElement('div'); box.className = 'p-figure';
        box.innerHTML = '<img alt="">'; box.firstChild.src = dataUrl;
        if (old) old.replaceWith(box); else c.querySelector('.p-edit-bar').after(box);
        save(cardId, { problem_image_url: dataUrl }, btn);
      };
      rd.readAsDataURL(f);
    };
    input.click();
  };
})();
</script>`
}

/** 紙の枠（ツールバー・見出し・氏名欄）で本体を包む */
export function wrapPrintDocument(title: string, meta: PrintMeta, bodyHTML: string, editable = false): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} ｜ 印刷</title>
<style>
  /* 紙を基準に組む。画面でも同じ見た目でプレビューできるようにする */
  :root { --ink:#111; --line:#8a8a8a; --soft:#f4f4f4; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif;
    color: var(--ink); background: #e9e9e9;
    font-size: 11pt; line-height: 1.7;
  }
  .p-sheet { background:#fff; width: 210mm; min-height: 297mm; margin: 10mm auto; padding: 14mm 13mm; }

  /* 操作バー（印刷時は消える） */
  .p-toolbar {
    position: sticky; top: 0; z-index: 10;
    background:#fff; border-bottom:1px solid #ccc;
    padding: 10px 14px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;
  }
  .p-toolbar button, .p-toolbar a {
    font: inherit; font-size: 10pt; padding: 7px 14px; border-radius: 6px;
    border: 1px solid #4F46E5; background:#4F46E5; color:#fff; cursor:pointer; text-decoration:none;
  }
  .p-toolbar a.sub { background:#fff; color:#4F46E5; }
  .p-toolbar .hint { color:#555; font-size: 9.5pt; }

  /* 見出し */
  .p-header { border-bottom: 2px solid var(--ink); padding-bottom: 3mm; margin-bottom: 5mm; }
  .p-unit { font-size: 15pt; font-weight: 700; margin: 0 0 1mm; }
  .p-meta { font-size: 9.5pt; color:#444; }
  .p-nameplate { display:flex; gap: 8mm; margin-top: 3mm; font-size: 10pt; }
  .p-nameplate span { border-bottom: 1px solid var(--ink); flex: 1; padding-bottom: 1mm; }

  /* カード */
  .p-card { margin-bottom: 8mm; }
  .p-card-head { display:flex; align-items:center; gap: 3mm; margin-bottom: 3mm; }
  .p-card-no {
    display:inline-flex; align-items:center; justify-content:center;
    width: 9mm; height: 9mm; border: 2px solid var(--ink); border-radius: 50%;
    font-weight: 700; font-size: 11pt; flex: none;
  }
  .p-card-no-sm {
    display:inline-flex; align-items:center; justify-content:center;
    width: 6mm; height: 6mm; border: 1.5px solid var(--ink); border-radius: 50%;
    font-weight: 700; font-size: 9pt;
  }
  .p-card-title { font-size: 12.5pt; font-weight: 700; margin: 0; }

  .p-label { font-size: 9pt; font-weight: 700; color:#333; margin-bottom: 1.5mm; }

  /* 本文（国語の読解用） */
  .p-passage { border:1px solid var(--line); padding: 4mm; margin-bottom: 4mm; background: var(--soft); }
  .p-passage-label { font-size: 9pt; font-weight:700; margin-bottom: 2mm; }
  .p-passage-body { line-height: 2.0; }

  .p-problem { font-size: 11.5pt; margin-bottom: 3mm; }

  .p-figure { margin: 3mm 0; text-align:center; }
  .p-figure img { max-width: 100%; height: auto; }

  /* 例題 */
  .p-example { border-left: 3px solid var(--line); padding: 2mm 0 2mm 4mm; margin: 3mm 0; font-size: 10.5pt; }
  .p-example-s { color:#333; margin-top: 1.5mm; }
  .p-example-a { margin-top: 1.5mm; font-weight: 700; }

  /* 解答欄（紙の主役） */
  .p-answer-box { border: 1.5px solid var(--ink); padding: 3mm; margin: 4mm 0; position: relative; }
  .p-answer-label { font-size: 8.5pt; color:#555; }

  /* ヒント */
  .p-hints { border: 1px dashed var(--line); padding: 3mm; margin-top: 3mm; font-size: 10pt; }
  .p-hint { display:flex; gap: 2.5mm; margin-top: 1.5mm; }
  .p-hint-no {
    display:inline-flex; align-items:center; justify-content:center;
    width: 5mm; height: 5mm; border-radius:50%; background: var(--ink); color:#fff;
    font-size: 8pt; font-weight:700; flex: none; margin-top: 1mm;
  }

  .p-answer-inline { border-top: 1px solid var(--line); margin-top: 4mm; padding-top: 2mm; font-size: 10.5pt; }
  .p-expl { color:#333; margin-top: 1.5mm; }

  /* 答え合わせ用紙 */
  .p-answersheet { border-top: 2px solid var(--ink); padding-top: 4mm; }
  .p-sheet-title { font-size: 14pt; margin: 0 0 1mm; }
  .p-sheet-note { font-size: 9.5pt; color:#444; margin: 0 0 4mm; }
  .p-ans-row { border-bottom: 1px solid #ddd; padding: 2.5mm 0; }
  .p-ans-head { font-weight: 700; font-size: 10.5pt; }
  .p-ans-val { font-size: 10.5pt; }
  .p-ans-expl { font-size: 9.5pt; color:#333; }

  /* 図の編集ツール（画面のみ） */
  .p-edit-bar { display:flex; gap:2mm; align-items:center; font-size: 9.5pt; margin: 2mm 0; }
  .p-edit-bar button { font: inherit; font-size: 9pt; padding: 2px 8px; border: 1px solid #4F46E5; background:#fff; color:#4F46E5; border-radius: 4px; cursor: pointer; }
  .p-edit-bar button:hover { background:#EEF2FF; }
  .p-edit-msg { color:#b91c1c; }

  /* 単元印刷の区切り（てびき・チェックテスト・えらべるもんだい） */
  .p-part-title { font-size: 13pt; font-weight: 700; border-left: 5px solid var(--ink); padding: 1mm 3mm; margin: 2mm 0 4mm; }
  .p-check-q { margin-bottom: 4mm; page-break-inside: avoid; break-inside: avoid; }
  .p-check-q .p-problem { margin-bottom: 2mm; }
  .p-check-note { font-size: 9.5pt; color:#444; margin: 0 0 4mm; }
  .p-guide-unit { font-size: 16pt; font-weight: bold; text-align:center; margin: 1mm 0; }
  .p-guide-meta { font-size: 10pt; color:#444; text-align:center; margin: 0 0 4mm; }
  .p-guide-box { border-left: 2mm solid #2563eb; background:#eff6ff; border-radius: 2mm; padding: 3mm 4mm; margin: 0 0 3mm; }
  .p-guide-box-title { font-size: 11pt; font-weight: bold; margin-bottom: 1mm; }
  .p-guide-box-goal { border-left-color:#2563eb; }
  .p-guide-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 3mm; }
  .p-guide-box-heart { border-left-color:#16a34a; background:#f0fdf4; margin: 0; }
  .p-guide-box-time { border-left-color:#9333ea; background:#faf5ff; margin: 0; }
  .p-guide-hours { font-size: 16pt; font-weight: bold; color:#7e22ce; }
  .p-guide-body { font-size: 10.5pt; line-height: 1.6; white-space: pre-wrap; }
  .p-guide-heading { font-size: 12pt; text-align:center; margin: 5mm 0 3mm; padding-bottom: 1mm; border-bottom: 0.4mm solid #999; }
  .p-guide-courses { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; }
  .p-guide-course { border: 0.6mm solid #94a3b8; border-radius: 3mm; padding: 3mm; }
  .p-guide-course-no { text-align:center; font-weight:bold; color:#fff; background:#16a34a; border-radius: 99mm; width: 7mm; margin: 0 auto 1mm; }
  .p-guide-course-name { font-size: 11pt; font-weight: bold; text-align:center; }
  .p-guide-course-label { font-size: 9pt; color:#444; text-align:center; margin-bottom: 2mm; }
  .p-guide-selection { border: 0.3mm solid #cbd5e1; border-radius: 2mm; padding: 2mm; }
  .p-guide-selection-title { font-size: 9.5pt; font-weight: bold; }
  .p-guide-selection-body { font-size: 8.5pt; line-height: 1.5; white-space: pre-wrap; }
  .p-check-answer-box { border: 1.5px solid var(--ink); min-height: 14mm; margin-top: 2mm; }
  .p-answer-key { border-top: 1px dashed var(--line); margin-top: 2mm; padding-top: 1mm; font-size: 9.5pt; color:#333; }
  .p-opt-title { font-weight: 700; font-size: 11.5pt; margin: 0 0 1mm; }
  .p-opt-chip { display:inline-block; font-size: 8.5pt; border:1px solid var(--line); padding: 0 2mm; margin-left: 2mm; }

  /* チェックテスト・えらべるもんだい：チェックテストは紙1枚、えらべるもんだいは表裏2ページに収める詰め方 */
  .p-part-intro { margin: 0 0 2mm; }
  .p-part-intro .p-sheet-title { font-size: 13pt; margin: 0; }
  .p-part .p-check-note { font-size: 9pt; margin: 0 0 2mm; }
  .p-part .p-check-q { margin-bottom: 3mm; }
  .p-part .p-card-head { margin-bottom: 1mm; gap: 2mm; }
  .p-part .p-card-no { width: 7mm; height: 7mm; font-size: 10pt; border-width: 1.5px; }
  .p-part .p-card-title { font-size: 11pt; }
  .p-part .p-problem { font-size: 10pt; line-height: 1.55; margin-bottom: 1.5mm; }
  .p-part .p-figure { margin: 1.5mm 0; }
  .p-part .p-check-answer-box { min-height: 10mm; margin-top: 1mm; padding: 1mm 2mm; }
  .p-part .p-answer-label { font-size: 8pt; }
  .p-part .p-answer-key { font-size: 9pt; margin-top: 1mm; }
  .p-part .p-check-q { page-break-inside: avoid; break-inside: avoid; }
  /* 部分ごとの印刷：各部分は新しい紙（ページ）から始める。先頭の部分はヘッダーの直後から */
  .p-part { break-before: page; page-break-before: always; }
  .p-header + .p-part { break-before: auto; page-break-before: auto; }

  /* ===== 印刷時 ===== */
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    body { background:#fff; font-size: 10pt; }
    .p-card { font-size: 10pt; line-height: 1.5; }
    .p-hints { margin-top: 2mm; padding: 2mm 3mm; }
    .p-hint { margin-top: 1mm; }
    .p-answer-box { min-height: 0 !important; }
    .p-sheet { width: auto; min-height: 0; margin: 0; padding: 0; }
    .p-toolbar { display: none !important; }
    .no-print { display: none !important; }
    .p-card { page-break-inside: avoid; break-inside: avoid; margin-bottom: 0; }
    .p-break { page-break-after: always; break-after: page; }
    .p-card:last-child, .p-answersheet { page-break-after: auto; break-after: auto; }
    .p-answersheet { page-break-before: always; break-before: page; }
    .p-passage, .p-figure, .p-hints, .p-answer-box, .p-example {
      page-break-inside: avoid; break-inside: avoid;
    }
    h1,h2 { page-break-after: avoid; break-after: avoid; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="p-toolbar no-print">
    <button onclick="window.print()">🖨 印刷する</button>
    <a class="sub" href="?answers=none">答えなし</a>
    <a class="sub" href="?answers=append">答えを別紙に</a>
    <a class="sub" href="?answers=inline">答えを各問の下に</a>
    <a class="sub" href="?hints=0">ヒントなし</a>
    <span class="hint">A4・たて｜カード1枚につき1ページで出ます</span>
  </div>

  <div class="p-sheet">
    <div class="p-header">
      <h1 class="p-unit">${esc(meta.unitName || '学習カード')}</h1>
      <div class="p-meta">
        ${esc(meta.grade || '')}${meta.subject ? '　' + esc(meta.subject) : ''}${meta.textbook ? '　' + esc(meta.textbook) : ''}${meta.courseName ? '　' + esc(meta.courseName) : ''}
      </div>
      <div class="p-nameplate">
        <span>組：</span><span>番号：</span><span>名前：</span>
      </div>
    </div>
    ${bodyHTML}
  </div>
${editable ? editorScript() : ''}
</body>
</html>`
}

// ============================================================
// 単元印刷: チェックテスト / えらべるもんだい
//   児童が紙に解答する前提。答えは各問の下に小さく「答え（先生用）」として
//   出すが、?answers=none 相当で隠せるように showAnswers で切り替える。
// ============================================================

export interface CheckProblemRow {
  problem_number?: number
  problem_text?: string
  answer?: string
  difficulty?: string
  problem_image_url?: string | null
}

export function renderCheckTestForPrint(title: string, problems: CheckProblemRow[], showAnswers = false): string {
  if (problems.length === 0) {
    return `<section class="p-card p-break"><h2 class="p-sheet-title">${esc(title)}</h2><p>この単元のチェックテストはまだ登録されていません。</p></section>`
  }
  const items = problems.map((p, i) => {
    const no = p.problem_number ?? i + 1
    return `
      <section class="p-check-q">
        <div class="p-card-head">
          <span class="p-card-no">${no}</span>
          <h2 class="p-card-title">もんだい ${no}</h2>
        </div>
        <div class="p-problem">${escMultiline(p.problem_text || '')}</div>
        ${figureHTML(p.problem_image_url)}
        <div class="p-check-answer-box"><div class="p-answer-label">じぶんの こたえ</div></div>
        ${showAnswers && p.answer ? `<div class="p-answer-key">こたえ（先生用）: ${escMultiline(p.answer)}</div>` : ''}
      </section>`
  }).join('')
  return `
    <div class="p-part">
    <section class="p-part-intro">
      <h2 class="p-sheet-title">${esc(title)}</h2>
      <p class="p-check-note">ぜんぶ じぶんの ちからで といてみよう。</p>
    </section>
    ${items}
    </div>`
}

export interface OptionalRow {
  problem_title?: string
  problem_content?: string
  answer?: string
  problem_image_url?: string | null
}

export function renderOptionalForPrint(items: OptionalRow[], showAnswers = false): string {
  if (items.length === 0) {
    return `<section class="p-card p-break"><h2 class="p-sheet-title">えらべるもんだい</h2><p>この単元のえらべるもんだいはまだ登録されていません。</p></section>`
  }
  const body = items.map((p, i) => `
      <section class="p-check-q">
        <div class="p-card-head">
          <span class="p-card-no">${i + 1}</span>
          <h2 class="p-card-title">${esc(p.problem_title || 'もんだい ' + (i + 1))}</h2>
        </div>
        <div class="p-problem">${escMultiline(p.problem_content || '')}</div>
        ${figureHTML(p.problem_image_url)}
        <div class="p-check-answer-box"><div class="p-answer-label">じぶんの こたえ</div></div>
        ${showAnswers && p.answer ? `<div class="p-answer-key">こたえ（先生用）: ${escMultiline(p.answer)}</div>` : ''}
      </section>`).join('')
  return `
    <div class="p-part">
    <section class="p-part-intro">
      <h2 class="p-sheet-title">えらべるもんだい</h2>
      <p class="p-check-note">チェックテストに合格したら、やりたいもんだいを えらんで といてみよう。</p>
    </section>
    ${body}
    </div>`
}

// ============================================================
// 📘 学習のてびき（紙面）
//   画面の「学習のてびき」と同じ順番で、紙に必要な部分だけを載せる：
//   単元のもくひょう → こころのせいちょう・じゅぎょうじかん → コースをえらぼう（3コース）
//   学習カード・問題本文は含めない。
// ============================================================
export interface GuideCourseRow {
  course_name?: string
  course_label?: string | null
  description?: string
  selection_title?: string
  selection_content?: string
}

export interface GuideUnitRow {
  unit_name?: string
  grade?: string
  subject?: string
  textbook?: string
  unit_goal?: string | null
  non_cognitive_goal?: string | null
  total_hours?: number | null
}

export function renderGuideForPrint(unit: GuideUnitRow, courses: GuideCourseRow[]): string {
  const headLine = [unit.grade, unit.subject, unit.textbook].filter(Boolean).map(esc).join(' ・ ')
  const goal = (unit.unit_goal || '').trim()
  const heart = (unit.non_cognitive_goal || '').trim()
  const hours = unit.total_hours ? `ぜんぶで ${esc(unit.total_hours)} じかん` : ''

  const courseCards = courses.length === 0
    ? '<p class="p-guide-body">この単元のコースは まだ とうろくされていません。</p>'
    : `<div class="p-guide-courses">${courses.map((co, i) => `
        <section class="p-guide-course">
          <div class="p-guide-course-no">${i + 1}</div>
          <div class="p-guide-course-name">${esc(co.course_name || 'コース')}</div>
          <div class="p-guide-course-label">${esc(co.course_label || co.description || '')}</div>
          ${co.selection_title || co.selection_content ? `
            <div class="p-guide-selection">
              <div class="p-guide-selection-title">✨ ${esc(co.selection_title || '')}</div>
              <div class="p-guide-selection-body">${escMultiline(co.selection_content || '')}</div>
            </div>` : ''}
        </section>`).join('')}</div>`

  return `
    <section class="p-card p-break p-guide">
      <h2 class="p-sheet-title">学習のてびき</h2>
      <div class="p-guide-unit">${esc(unit.unit_name || '単元')}</div>
      ${headLine ? `<p class="p-guide-meta">${headLine}</p>` : ''}

      <div class="p-guide-box p-guide-box-goal">
        <div class="p-guide-box-title">たんげんのもくひょう</div>
        <div class="p-guide-body">${goal ? escMultiline(goal) : '（先生が入力します）'}</div>
      </div>

      <div class="p-guide-grid">
        <div class="p-guide-box p-guide-box-heart">
          <div class="p-guide-box-title">こころのせいちょう</div>
          <div class="p-guide-body">${heart ? escMultiline(heart) : '（先生が入力します）'}</div>
        </div>
        <div class="p-guide-box p-guide-box-time">
          <div class="p-guide-box-title">じゅぎょうじかん</div>
          <div class="p-guide-hours">${hours || '（先生が入力します）'}</div>
        </div>
      </div>

      <h3 class="p-guide-heading">コースをえらぼう！（3つのコースから1つえらんでね）</h3>
      ${courseCards}
    </section>`
}
