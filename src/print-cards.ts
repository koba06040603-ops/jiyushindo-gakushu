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
  tactile_image_url?: string | null
  tactile_activity?: string
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
/** problem_content が {"content":..., "multimedia":...} のJSONなら、本文と「やってみよう」だけを取り出す */
function parseProblemJSON(raw: string): { content: string; tactile: string } {
  const s = raw.trim()
  if (!s.startsWith('{')) return { content: raw, tactile: '' }
  try {
    const p = JSON.parse(s)
    return { content: String(p?.content ?? ''), tactile: String(p?.multimedia?.tactile_activity ?? '') }
  } catch {
    return { content: raw, tactile: '' }
  }
}

function pickProblem(card: PrintCardRow): string {
  const raw = String(card.problem_description || card.problem_text || card.problem_content || '')
  return parseProblemJSON(raw).content
}

/** 「やってみよう」の文（画面と同じ）。problem_content のJSONから取り出す */
function pickTactileText(card: PrintCardRow): string {
  return String(card.tactile_activity || parseProblemJSON(String(card.problem_content || '')).tactile || '')
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

/** 紙の最上部に出す「どのコースか」の表示（例: 比「小学6年　算数　じっくりコース」） */
export function courseLabelText(meta: { unitName?: string; grade?: string; subject?: string; courseName?: string }): string {
  const inner = [meta.grade, meta.subject, meta.courseName].filter(Boolean).join('　')
  const unit = meta.unitName || '学習カード'
  return inner ? `${unit}「${inner}」` : unit
}

/** カードごとの「年・組・番号・氏名」欄（紙がばらけても誰のものか分かるように） */
function studentLineHTML(): string {
  return `<div class="p-student-line">
            <span>年</span><span class="p-student-blank"></span>
            <span>組</span><span class="p-student-blank"></span>
            <span>番号</span><span class="p-student-blank"></span>
            <span>氏名</span><span class="p-student-blank p-student-name"></span>
          </div>`
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
  /** 紙の最上部に出すコース名（例: 比「小学6年　算数　じっくりコース」）。各ページの先頭に入る */
  courseLabel?: string
  /** 1枚の紙の面数。1 = 表だけ（問題・図・解答欄）/ 2 = 表裏（裏にれい・ヒント）。既定 2 */
  sides?: 1 | 2
}

/** 学習カードの本体（カード列＋答えの別紙）だけを返す。枠（HTML/ヘッダー）は含まない */
export function renderCardsBodyForPrint(cards: PrintCardRow[], opts: PrintOptions = {}): string {
  const answersMode = opts.answers || 'append'
  // 学習カードにはヒントを出さない。ヒントは掲示用のヒントカード（/print/hints/course/:id）で別に印刷する
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


    const answerInline = (answersMode === 'inline')
      ? `<div class="p-answer-inline">
           <div class="p-label">こたえ</div>
           <div><strong>${escMultiline(answer)}</strong></div>
           ${pickExplanation(card) ? `<div class="p-expl">${escMultiline(pickExplanation(card))}</div>` : ''}
         </div>`
      : ''

    const cardId = (card as any).card_id ?? (card as any).id
    // 「やってみよう」: 保存済みイラストがあるカードだけ、画面と同じ文・同じ画像を紙にも出す
    const tactileImg = card.tactile_image_url || ''
    const tactileText = pickTactileText(card)
    const tactileBlock = tactileImg
      ? `<div class="p-tactile">
           <div class="p-label">やってみよう</div>
           ${tactileText ? `<div class="p-tactile-text">${escMultiline(tactileText)}</div>` : ''}
           <div class="p-figure p-tactile-fig"><img src="${esc(tactileImg)}" alt=""></div>
         </div>`
      : ''

    const figureTools = (opts.editable && cardId)
      ? `<div class="p-edit-bar no-print">
           <span>図：</span>
           <button type="button" onclick="pickFigure(${Number(cardId)}, this)">図を差し替える</button>
           <button type="button" onclick="removeFigure(${Number(cardId)}, this)">図を外す</button>
           <span class="p-edit-msg"></span>
         </div>`
      : ''

    // 表だけ（1面）: 問題・図・解答欄のみ。れい・ヒントは「ヒントカード」として別に印刷する
    // 表裏（2面）: 表＝問題・図・解答欄 ／ 裏＝れい・ヒント（＋答えを各問の下にする場合）
    // 表だけ（1面）でも、れい（やりかた）は表の解答欄の下に短く載せる（裏が使えない環境向け）
    const sides = opts.sides === 1 ? 1 : 2
    // れいは「れい → 問題」の順にするため、表・裏どちらでも表面（問題より前）に出す
    const frontAnswerInline = sides === 1 ? answerInline : ''
    const backInner = sides === 2 ? answerInline : ''
    const hasBack = backInner.trim() !== ''

    return `
      <section class="p-card${onePerPage ? ' p-break' : ''}${hasBack ? ' p-two' : ''}" data-card-id="${cardId ?? ''}">
        <div class="p-front">
          ${opts.courseLabel ? `<div class="p-course-label">${esc(opts.courseLabel)}</div>` : ''}
          ${studentLineHTML()}
          <div class="p-card-head">
            <span class="p-card-no">${no}</span>
            <h2 class="p-card-title">${esc(card.card_title || '')}</h2>
          </div>
          ${exampleBlock}
          ${passageBlock}
          <div class="p-main">
          <div class="p-problem">${escMultiline(problem)}</div>
          ${figureTools}
          ${figureHTML(card.problem_image_url)}
          ${tactileBlock}
          <div class="p-answer-box" style="min-height:${answerBoxHeight(answer)}">
            <div class="p-answer-label">じぶんの こたえ</div>
          </div>
          </div>
          ${frontAnswerInline}
        </div>
        ${hasBack ? `<div class="p-back"><div class="p-back-label">うら</div>${backInner}</div>` : ''}
      </section>`
  }).join('')

  // 答え合わせ用の別紙（児童が自分で丸つけできるようにする）
  const answerSheet = (answersMode === 'append')
    ? `<section class="p-card p-answersheet">
         ${opts.courseLabel ? `<div class="p-course-label">${esc(opts.courseLabel)}</div>` : ''}
         ${studentLineHTML()}
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
  const courseLabel = courseLabelText(meta)
  return wrapPrintDocument(title, {
    unitName: meta.unitName, grade: meta.grade, subject: meta.subject, courseName: meta.courseName,
  }, renderCardsBodyForPrint(cards, { ...opts, courseLabel }), !!opts.editable, {
    nameplate: false,
    header: false,
    links: `<a class="sub${opts.sides === 1 ? ' on' : ''}" href="?sides=1">表だけ（A4 1面）</a>
      <a class="sub${opts.sides === 1 ? '' : ' on'}" href="?sides=2">表裏（A4 2面）</a>`,
    note: opts.sides === 1
      ? 'A4・1面｜問題と解答欄だけを1枚ずつ印刷します（れい・ヒントはヒントカードで）'
      : 'A4・2面｜表＝問題と解答欄、裏＝れい・ヒント。1枚ずつ別の紙になります',
  })
}

/** ヒントカード（掲示用）の本体。学習カード1枚につきA4 1ページ。答えは入れない */
export function renderHintCardsBodyForPrint(cards: PrintCardRow[], courseLabel = ''): string {
  const label = courseLabel ? `<div class="p-course-label">${esc(courseLabel)}</div>` : ''
  const body = cards.map((card, i) => {
    const no = card.card_number ?? i + 1
    const cardId = (card as any).card_id ?? (card as any).id
    const hints = Array.isArray(card.hints) ? card.hints : []
    const hintHTML = hints.length
      ? hints.map((h, hi) => `
          <div class="p-hc-hint">
            <span class="p-hc-no">${esc(h.hint_level ?? hi + 1)}</span>
            <span class="p-hc-text">${escMultiline(h.hint_text)}</span>
          </div>`).join('')
      : '<p class="p-hc-empty">この問題のヒントはまだ登録されていません。</p>'
    return `
      <section class="p-card p-break p-hintcard" data-card-id="${cardId ?? ''}">
        ${label}
        <div class="p-card-head">
          <span class="p-card-no">${no}</span>
          <h2 class="p-card-title">${esc(card.card_title || '')}</h2>
        </div>
        <div class="p-hc-problem">${escMultiline(pickProblem(card))}</div>
        <div class="p-hc-label">ヒント（こまったときに 見よう）</div>
        ${hintHTML}
      </section>`
  }).join('')
  return body || '<p>印刷できるカードがありません。</p>'
}

/** ヒントカードの印刷ページ（掲示用）。ヒントだけを1枚ずつ別の紙にする */
export function renderHintCardsPage(
  meta: { unitName?: string; grade?: string; courseName?: string; subject?: string },
  cards: PrintCardRow[]
): string {
  const title = `${meta.unitName || 'ヒントカード'}${meta.courseName ? '（' + meta.courseName + '）' : ''}・ヒントカード`
  return wrapPrintDocument(title, {
    unitName: meta.unitName, grade: meta.grade, subject: meta.subject, courseName: meta.courseName,
  }, renderHintCardsBodyForPrint(cards, courseLabelText(meta)), false, {
    answerLinks: false,
    header: false,
    note: 'ヒントカード｜学習カード1枚につきA4 1ページ。掲示用（答えは入りません）',
  })
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

/**
 * 文字の編集と Word 保存（すべての印刷ページで使う。印刷には出ない）。
 * 「文字を直す」で紙の文字を画面上で直せる。「Word で保存」は編集後の内容を .doc で保存する
 * （Word・WPS で開いて編集・印刷できる。図は画像として入る）。
 */
function textEditorScript(): string {
  return `<script>
(function(){
  var SEL = '.p-unit,.p-meta,.p-sheet-title,.p-sheet-note,.p-card-title,.p-problem,.p-passage-body,' +
    '.p-example-q,.p-example-s,.p-example-a,.p-hint > span:last-child,.p-expl,.p-answer-inline div,' +
    '.p-ans-head,.p-ans-val,.p-ans-expl,.p-check-note,.p-opt-title,.p-answer-key,.p-part-title,' +
    '.p-guide-unit,.p-guide-meta,.p-guide-body,.p-guide-box-title,.p-guide-course-name,' +
    '.p-guide-course-label,.p-guide-selection-title,.p-guide-selection-body,.p-guide-heading,' +
    '.p-hc-problem,.p-hc-label,.p-hc-text,.p-hc-empty';
  window.pTogglePrintEdit = function(btn){
    var on = btn.getAttribute('data-on') !== '1';
    var els = document.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) els[i].setAttribute('contenteditable', on ? 'true' : 'false');
    btn.setAttribute('data-on', on ? '1' : '0');
    btn.textContent = on ? '✔ 直し終えた（点線を消す）' : '✏ 文字を直す';
  };
  window.pExportWord = function(){
    var src = document.querySelector('.p-sheet');
    if (!src) return;
    var sheet = src.cloneNode(true);
    var rm = sheet.querySelectorAll('.no-print,.p-edit-bar,.p-edit-msg');
    for (var i = 0; i < rm.length; i++) rm[i].parentNode.removeChild(rm[i]);
    var ed = sheet.querySelectorAll('[contenteditable]');
    for (i = 0; i < ed.length; i++) ed[i].removeAttribute('contenteditable');
    var imgs = sheet.querySelectorAll('img');
    for (i = 0; i < imgs.length; i++) imgs[i].setAttribute('src', imgs[i].src);
    var cards = sheet.querySelectorAll('.p-card');
    for (i = 0; i < cards.length; i++) {
      cards[i].classList.remove('p-break');
      if (i > 0) cards[i].setAttribute('style', 'page-break-before: always;');
    }
    var title = (document.title || '学習カード').replace(/\s*｜.*$/, '');
    var css = document.querySelector('style') ? document.querySelector('style').textContent : '';
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + title + '</title><style>' + css + '</style></head>' +
      '<body>' + sheet.outerHTML + '</body></html>';
    var blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    var name = title.replace(/[\\/:*?"<>|]/g, '_') + '.doc';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  /* PDF 保存：html2pdf.js を必要になった時だけ読み込む（通常の印刷では読まない） */
  function pLoadHtml2Pdf(cb){
    if (window.html2pdf) { cb(null); return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload = function(){ cb(window.html2pdf ? null : new Error('html2pdf')); };
    s.onerror = function(){ cb(new Error('load')); };
    document.head.appendChild(s);
  }
  window.pExportPdf = function(btn){
    var src = document.querySelector('.p-sheet');
    if (!src) return;
    var title = (document.title || '学習カード').replace(/\s*｜.*$/, '');
    var css = document.querySelector('style') ? document.querySelector('style').textContent : '';
    var sheet = src.cloneNode(true);
    var rm = sheet.querySelectorAll('.no-print,.p-edit-bar,.p-edit-msg');
    for (var i = 0; i < rm.length; i++) rm[i].parentNode.removeChild(rm[i]);
    var ed = sheet.querySelectorAll('[contenteditable]');
    for (i = 0; i < ed.length; i++) ed[i].removeAttribute('contenteditable');
    var imgs = sheet.querySelectorAll('img');
    for (i = 0; i < imgs.length; i++) imgs[i].setAttribute('src', imgs[i].src);
    var cards = sheet.querySelectorAll('.p-card');
    for (i = 0; i < cards.length; i++) {
      /* 画面と同じ流れで続けて配置する。強制改ページはしない */
      cards[i].classList.remove('p-break');
    }
    /* 画面と同じ幅（210mm）と余白のまま使う。最小高さ（297mm）だけ外して、末尾の白紙ページを防ぐ */
    /* 下の余白（14mm）が次のページに残って白紙ページになるのを防ぐため、PDF では下余白を 0 にする */
    sheet.setAttribute('style', 'width:210mm;min-height:0;margin:0;padding-bottom:0;box-shadow:none;background:#fff;');
    var wrap = document.createElement('div');
    /* fixed 配置だと html2canvas が描画できないため、通常フローで置く（直後に除去） */
    wrap.setAttribute('style', 'width:210mm;background:#fff;');
    var st = document.createElement('style');
    st.textContent = css;
    wrap.appendChild(st);
    wrap.appendChild(sheet);
    document.body.appendChild(wrap);
    /* 1ページに収まるカードは途中で分割しない。画像などで1ページを超えるカードは分割を許可する
       （分割禁止のまま送ると、1ページ目が見出しだけの空白ページになるため） */
    var maxKeepPx = 220 * 3.7795; /* 約220mm（A4の印字可能高さ277mm以内） */
    var placed = wrap.querySelectorAll('.p-card');
    for (i = 0; i < placed.length; i++) {
      if (placed[i].offsetHeight <= maxKeepPx) {
        placed[i].style.pageBreakInside = 'avoid';
        placed[i].style.breakInside = 'avoid';
      }
    }
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'PDF を作成中…'; }
    function done(){
      if (btn) { btn.disabled = false; btn.textContent = label; }
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
    pLoadHtml2Pdf(function(err){
      if (err) { done(); alert('PDF の部品を読み込めませんでした。通信状態を確認するか、「印刷する」から「PDF に保存」を選んでください。'); return; }
      var name = title.replace(/[\\/:*?"<>|]/g, '_') + '.pdf';
      var worker = window.html2pdf().set({
        /* 左右は紙（210mm）の内側の余白で取るため0。上下だけ html2pdf の余白を使う（右端の切れ防止） */
        margin: [10, 0, 10, 0],
        filename: name,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from(wrap).toCanvas();
      /* 描画結果が白紙のまま PDF にすると 16KB 程度の白い PDF になるため、保存前に確かめる */
      worker.get('canvas').then(function(canvas){
        if (pIsBlankCanvas(canvas)) throw new Error('blank');
        return worker.toPdf().save(name);
      }).then(done, function(err){
        done();
        if (err && err.message === 'blank') {
          alert('画面の内容を PDF に描画できませんでした（白紙になるため保存していません）。\\n続けて印刷画面を開きます。送信先で「PDF に保存」を選び、「背景のグラフィック」をオンにしてください。');
          window.print();
          return;
        }
        alert('PDF の作成に失敗しました。「印刷する」から「PDF に保存」を選んでください。');
      });
    });
  };
  /* キャンバスの一部を見て、白一色（描画されていない）かを判定する */
  function pIsBlankCanvas(c){
    try {
      var w = c.width, h = c.height;
      if (!w || !h) return true;
      var d = c.getContext('2d').getImageData(0, 0, w, h).data;
      var stride = 4 * Math.max(1, Math.floor((w * h) / 20000));
      for (var i = 0; i < d.length; i += stride) {
        if (d[i + 3] > 0 && (d[i] < 245 || d[i + 1] < 245 || d[i + 2] < 245)) return false;
      }
      return true;
    } catch (e) {
      /* 読み取れない場合（外部画像で汚染など）は白紙とみなさず、通常の保存を試す */
      return false;
    }
  }
})();
</script>`
}

/** 紙の枠（ツールバー・見出し・氏名欄）で本体を包む */
export function wrapPrintDocument(
  title: string, meta: PrintMeta, bodyHTML: string, editable = false,
  bar: { note?: string; links?: string; answerLinks?: boolean; nameplate?: boolean; header?: boolean } = {}
): string {
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
  .p-student-line { display:flex; gap: 2mm; align-items:flex-end; font-size: 9.5pt; margin-bottom: 3mm; }
  .p-student-line span { white-space: nowrap; }
  .p-student-line .p-student-blank { display:inline-block; border-bottom: 1px solid var(--ink); width: 14mm; }
  .p-student-line .p-student-name { width: 44mm; }
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

  /* 問題文は紙で目立つように、大きく・太く・枠で囲む */
  .p-problem { font-size: 14pt; font-weight: 700; line-height: 1.6; border: 2px solid var(--ink); border-radius: 2mm; padding: 2.5mm 3.5mm; margin: 2mm 0 3mm; }

  .p-figure { margin: 3mm 0; text-align:center; }
  .p-figure img { max-width: 100%; height: auto; }
  /* 紙の最上部のコース名（どのコースの紙か分かるように。各カードの1ページ目に入る） */
  .p-course-label { font-size: 9.5pt; font-weight: 700; color:#222; border-bottom: 1.5px solid var(--ink); padding: 0 0 1mm; margin-bottom: 2.5mm; }
  /* 例題の図は1枚が1面に収まる大きさに抑える（大きすぎると表が2ページにまたがる） */
  .p-example .p-figure img { max-height: 40mm; width: auto; }
  .p-tactile { margin: 2mm 0 3mm; }
  .p-tactile-text { font-size: 10pt; margin-bottom: 1.5mm; }
  .p-tactile-fig img { max-height: 55mm; width: auto; }

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

  /* 表裏（2面）：裏は必ず新しい面から始める。画面では裏の始まりを点線で示す */
  .p-back { border-top: 1px dashed #b5b5b5; margin-top: 6mm; padding-top: 3mm; }
  .p-back-label { font-size: 9pt; font-weight: 700; color:#555; margin-bottom: 2mm; }
  .p-toolbar a.sub.on { background:#4F46E5; color:#fff; }

  /* ヒントカード（掲示用）：1枚につきA4 1ページ。答えは入れない */
  .p-hc-problem { font-size: 12pt; background: var(--soft); border-radius: 2mm; padding: 3mm 4mm; margin-bottom: 4mm; }
  .p-hc-label { font-size: 14pt; font-weight: 700; border-left: 5px solid var(--ink); padding: 1mm 3mm; margin: 4mm 0; }
  .p-hc-hint { display: flex; gap: 4mm; align-items: flex-start; border: 1.5px solid var(--ink); border-radius: 4mm; padding: 4mm; margin-bottom: 5mm; }
  .p-hc-no { flex: none; width: 12mm; height: 12mm; border-radius: 50%; background: var(--ink); color: #fff; font-size: 16pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .p-hc-text { font-size: 17pt; line-height: 1.7; }
  .p-hc-empty { color: #555; font-size: 11pt; }

  /* 画面での改ページ位置（印刷には出ない）。1枚ずつ別の紙になることを画面でも分かるようにする */
  .p-card.p-break { border-bottom: 1px dashed #b5b5b5; padding-bottom: 4mm; margin-bottom: 8mm; }
  .p-card.p-break::after { content: "── ここで改ページ（この下は次の1枚）──"; display: block; text-align: center; font-size: 8.5pt; color: #888; margin-top: 3mm; }

  /* 文字の編集（画面のみ）。「文字を直す」を押した部分だけ点線で囲む */
  .p-sheet [contenteditable="true"] { outline: 1px dashed #4F46E5; outline-offset: 2px; background: #FFFBEB; cursor: text; }
  .p-toolbar button.sub { background:#fff; color:#4F46E5; }

  /* ===== 印刷時 ===== */
  @media print {
    @page { size: A4 portrait; margin: 10mm; }
    [contenteditable] { outline: none !important; background: none !important; }
    body { background:#fff; font-size: 10pt; }
    .p-card { font-size: 10pt; line-height: 1.5; }
    .p-hints { margin-top: 2mm; padding: 2mm 3mm; }
    .p-hint { margin-top: 1mm; }
    .p-answer-box { min-height: 0 !important; }
    .p-sheet { width: auto; min-height: 0; margin: 0; padding: 0; }
    .p-toolbar { display: none !important; }
    .no-print { display: none !important; }
    .p-card { page-break-inside: avoid; break-inside: avoid; margin-bottom: 0; }
    /* 表（問題・図・解答欄）は1ページの中に収める。表と裏の境界（.p-back の改ページ）だけで分ける */
    .p-card.p-two { page-break-inside: auto; break-inside: auto; }
    .p-front { page-break-inside: avoid; break-inside: avoid; }
    .p-main { page-break-inside: avoid; break-inside: avoid; }
    .p-back { break-before: page; page-break-before: always; border-top: none; margin-top: 0; padding-top: 0; }
    .p-back-label { margin-bottom: 1mm; }
    .p-hc-hint { page-break-inside: avoid; break-inside: avoid; }
    .p-break { page-break-after: always; break-after: page; }
    .p-card.p-break { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
    .p-card.p-break::after { display: none; }
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
    ${bar.answerLinks === false ? '' : `<a class="sub" href="?answers=none">答えなし</a>
    <a class="sub" href="?answers=append">答えを別紙に</a>
    <a class="sub" href="?answers=inline">答えを各問の下に</a>
    `}
    ${bar.links || ''}
    <button type="button" class="sub" data-on="0" onclick="pTogglePrintEdit(this)">✏ 文字を直す</button>
    <button type="button" class="sub" onclick="pExportWord()">📄 Word（.doc）で保存</button>
    <button type="button" class="sub" onclick="pExportPdf(this)">📑 PDF で保存</button>
    <span class="hint">${esc(bar.note || 'A4・たて｜カード1枚につき1ページで出ます（画面の点線が改ページ位置）')}</span>
    <span class="hint p-word-caution">※Word（.doc）は文字の編集用です。レイアウトが崩れることがあります。画面と同じ見た目で保存したい場合は「PDF で保存」をお使いください。</span>
  </div>

  <div class="p-sheet">
    ${bar.header === false ? '' : `<div class="p-header">
      <h1 class="p-unit">${esc(meta.unitName || '学習カード')}</h1>
      <div class="p-meta">
        ${esc(meta.grade || '')}${meta.subject ? '　' + esc(meta.subject) : ''}${meta.textbook ? '　' + esc(meta.textbook) : ''}${meta.courseName ? '　' + esc(meta.courseName) : ''}
      </div>
      ${bar.nameplate === false ? '' : `<div class="p-nameplate">
        <span>組：</span><span>番号：</span><span>名前：</span>
      </div>`}
    </div>`}
    ${bodyHTML}
  </div>
${editable ? editorScript() : ''}
${textEditorScript()}
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
        <div class="p-problem">${escMultiline(stripPictographs(p.problem_text))}</div>
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
          <h2 class="p-card-title">${esc(stripPictographs(p.problem_title) || 'もんだい ' + (i + 1))}</h2>
        </div>
        <div class="p-problem">${escMultiline(stripPictographs(p.problem_content))}</div>
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
/** 紙面では絵文字が環境によって □ に化けるため、印刷・PDF からは取り除く（DB の文言は変えない） */
function stripPictographs(s: any): string {
  return String(s ?? '').replace(/\p{Extended_Pictographic}\uFE0F?\s*/gu, '').trim()
}

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
              <div class="p-guide-selection-title">✨ ${esc(stripPictographs(co.selection_title || ''))}</div>
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
