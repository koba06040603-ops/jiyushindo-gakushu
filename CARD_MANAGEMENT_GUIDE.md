# 📚 学習カード管理機能ガイド（教師専用）

> **対象**: 教師専用機能  
> **最終更新**: 2026年1月23日  
> **バージョン**: 1.1.0

---

## 🎯 概要

この機能により、教師は**単元・コースごとの学習カードを自由に追加・削除・並び替え**できます。

---

## 🆕 新機能の概要

### 📊 単元生成の拡張（10個 → 30個）

#### 変更前
- AI単元生成：最大10個
- 対応範囲：小学校低学年のみ

#### 変更後（✅ 完了）
- **AI単元生成：最大30個**
- **全学年対応**：
  - 1年生：約10単元
  - 2年生：約12単元
  - 3年生：約13単元
  - **4年生：14単元**
  - **5年生：18単元**（最大）
  - **6年生：16単元**

#### 実装内容
```typescript
// プロンプト変更
const prompt = `${grade}${subject}（${textbook}）の主要な単元名を正確に30個、1行に1つずつ日本語で出力してください。`

// 出力例（30個）
かけ算の筆算
わり算の筆算
小数のかけ算
小数のわり算
分数のたし算
分数のひき算
分数のかけ算
分数のわり算
面積の求め方
体積の学習
グラフの読み方
資料の整理
確率の基礎
図形の性質
比と比の値
速さの問題
割合の計算
平均の求め方
対称な図形
拡大図と縮図
円の面積
円周率の活用
角柱と円柱の体積
分数と小数の関係
資料の調べ方
変わり方の調べ方
比例と反比例
定義域と値域
論理的推論の基礎
集合の概念
```

---

### 🎴 学習カード管理機能

#### 1️⃣ カード追加機能

**基本ルール**:
- 各コースは**最低6枚必須**
- **7枚目、8枚目も自由に追加可能**
- カード番号は自動採番

**API仕様**:
```javascript
// 新しいカードを追加
POST /api/course/:courseId/add-card
Content-Type: application/json

{
  "card_title": "小数のわり算（発展）",
  "card_type": "main",
  "problem_description": "2.5 ÷ 0.5 の計算",
  "new_terms": "小数点、商",
  "example_problem": "2.5 ÷ 0.5 = ?",
  "example_solution": "2.5 ÷ 0.5 = 5",
  "hints": [
    {
      "hint_number": 1,
      "hint_text": "小数点の位置に注意",
      "thinking_tool_suggestion": "図に描いてみよう"
    },
    {
      "hint_number": 2,
      "hint_text": "0.5は0.5が何個分？",
      "thinking_tool_suggestion": "数直線で考えよう"
    },
    {
      "hint_number": 3,
      "hint_text": "2.5 ÷ 0.5 = 25 ÷ 5",
      "thinking_tool_suggestion": "整数に直して考えよう"
    }
  ]
}

// レスポンス
{
  "success": true,
  "cardId": 456,
  "cardNumber": 7,
  "message": "カード7を追加しました"
}
```

**実装コード**:
```typescript
app.post('/api/course/:courseId/add-card', async (c) => {
  const { env } = c
  const courseId = c.req.param('courseId')
  const body = await c.req.json()
  
  try {
    // 現在の最大カード番号を取得
    const maxCard = await env.DB.prepare(`
      SELECT MAX(card_number) as max_num FROM learning_cards WHERE course_id = ?
    `).bind(courseId).first()
    
    const nextCardNumber = (maxCard?.max_num || 0) + 1
    
    // カード本体を作成
    const cardResult = await env.DB.prepare(`
      INSERT INTO learning_cards (
        course_id, card_number, card_title, card_type,
        problem_description, new_terms, example_problem, example_solution,
        diagram_url, real_world_connection
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      courseId,
      nextCardNumber,
      body.card_title || '',
      body.card_type || 'main',
      body.problem_description || '',
      body.new_terms || '',
      body.example_problem || '',
      body.example_solution || '',
      body.diagram_url || '',
      body.real_world_connection || ''
    ).run()
    
    const cardId = cardResult.meta.last_row_id
    
    // ヒントカードを作成
    if (body.hints && Array.isArray(body.hints)) {
      for (const hint of body.hints) {
        await env.DB.prepare(`
          INSERT INTO hint_cards (
            learning_card_id, hint_number, hint_text, thinking_tool_suggestion
          ) VALUES (?, ?, ?, ?)
        `).bind(
          cardId,
          hint.hint_number,
          hint.hint_text || '',
          hint.thinking_tool_suggestion || ''
        ).run()
      }
    }
    
    return c.json({
      success: true,
      cardId: cardId,
      cardNumber: nextCardNumber,
      message: `カード${nextCardNumber}を追加しました`
    })
  } catch (error: any) {
    return c.json({
      success: false,
      error: 'カードの追加に失敗しました',
      details: error.message
    }, 500)
  }
})
```

---

#### 2️⃣ カード削除機能

**基本ルール**:
- **すべてのカードを削除可能**
- 削除すると関連するヒントカードも自動削除
- 削除後は自動で再採番しない（明示的に並び替えが必要）

**API仕様**:
```javascript
// カードを削除
DELETE /api/cards/:cardId

// レスポンス
{
  "success": true
}
```

**実装コード**:
```typescript
app.delete('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  
  try {
    // 関連するヒントカードも削除
    await env.DB.prepare(`
      DELETE FROM hint_cards WHERE learning_card_id = ?
    `).bind(cardId).run()
    
    // 学習カード削除
    await env.DB.prepare(`
      DELETE FROM learning_cards WHERE id = ?
    `).bind(cardId).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})
```

---

#### 3️⃣ カード並び替え機能（ドラッグ&ドロップ）

**基本ルール**:
- **ドラッグ&ドロップで直感的に並び替え**
- 並び順は`card_number`として保存
- リアルタイム反映

**API仕様**:
```javascript
// カードを並び替え
POST /api/course/:courseId/reorder-cards
Content-Type: application/json

{
  "cardIds": [5, 2, 3, 1, 4, 6, 7]  // 新しい順序
}

// レスポンス
{
  "success": true,
  "message": "カードの並び替えを保存しました",
  "count": 7
}
```

**実装コード**:
```typescript
app.post('/api/course/:courseId/reorder-cards', async (c) => {
  const { env } = c
  const courseId = c.req.param('courseId')
  const { cardIds } = await c.req.json() // [id1, id2, id3, ...]
  
  try {
    console.log(`📋 カード並び替え開始: courseId=${courseId}, cards=${cardIds.length}`)
    
    // 各カードのcard_numberを更新
    for (let i = 0; i < cardIds.length; i++) {
      await env.DB.prepare(`
        UPDATE learning_cards
        SET card_number = ?
        WHERE id = ? AND course_id = ?
      `).bind(i + 1, cardIds[i], courseId).run()
    }
    
    console.log(`✅ カード並び替え完了: ${cardIds.length}枚`)
    
    return c.json({
      success: true,
      message: 'カードの並び替えを保存しました',
      count: cardIds.length
    })
  } catch (error: any) {
    console.error('カード並び替えエラー:', error)
    return c.json({
      success: false,
      error: 'カードの並び替えに失敗しました',
      details: error.message
    }, 500)
  }
})
```

---

#### 4️⃣ カード更新機能

**基本ルール**:
- カードのすべてのフィールドを更新可能
- ヒントは別APIで更新（`PUT /api/hints/:hintId`）

**API仕様**:
```javascript
// カードを更新
PUT /api/cards/:cardId
Content-Type: application/json

{
  "card_title": "小数のわり算（改訂版）",
  "problem_description": "2.5 ÷ 0.5 の計算を考えよう",
  "example_solution": "答えは5です"
}

// レスポンス
{
  "success": true
}
```

**実装コード**:
```typescript
app.put('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_cards SET
        card_title = ?,
        card_type = ?,
        problem_description = ?,
        new_terms = ?,
        example_problem = ?,
        example_solution = ?,
        diagram_url = ?,
        real_world_connection = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.card_title,
      body.card_type,
      body.problem_description,
      body.new_terms,
      body.example_problem,
      body.example_solution,
      body.diagram_url || '',
      body.real_world_connection || '',
      cardId
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})
```

---

## 🖥️ フロントエンドUI実装案

### 1️⃣ 単元編集画面

```html
<!-- 単元編集画面 -->
<div class="curriculum-edit">
  <h2>📚 単元編集: かけ算の筆算</h2>
  
  <!-- コースタブ -->
  <div class="course-tabs">
    <button class="tab active">しっかりコース</button>
    <button class="tab">どんどんコース</button>
  </div>
  
  <!-- カード一覧（ドラッグ可能） -->
  <div id="card-list" class="card-list sortable">
    <!-- カード1 -->
    <div class="card-item" data-card-id="123" draggable="true">
      <span class="drag-handle">☰</span>
      <span class="card-number">1</span>
      <span class="card-title">かけ算の筆算（2桁×1桁）</span>
      <div class="card-actions">
        <button class="edit-btn">✏️ 編集</button>
        <button class="delete-btn">🗑️ 削除</button>
      </div>
    </div>
    
    <!-- カード2 -->
    <div class="card-item" data-card-id="124" draggable="true">
      <span class="drag-handle">☰</span>
      <span class="card-number">2</span>
      <span class="card-title">かけ算の筆算（2桁×2桁）</span>
      <div class="card-actions">
        <button class="edit-btn">✏️ 編集</button>
        <button class="delete-btn">🗑️ 削除</button>
      </div>
    </div>
    
    <!-- ...カード3〜6... -->
  </div>
  
  <!-- カード追加ボタン -->
  <button class="add-card-btn">➕ カードを追加</button>
</div>
```

---

### 2️⃣ カード追加モーダル

```html
<!-- カード追加モーダル -->
<div id="add-card-modal" class="modal">
  <div class="modal-content">
    <h3>➕ 新しいカードを追加</h3>
    
    <form id="add-card-form">
      <!-- カードタイトル -->
      <div class="form-group">
        <label>カードタイトル</label>
        <input type="text" name="card_title" placeholder="例: かけ算の筆算（発展）" required>
      </div>
      
      <!-- 問題文 -->
      <div class="form-group">
        <label>問題文</label>
        <textarea name="problem_description" rows="3" placeholder="問題の内容を入力..." required></textarea>
      </div>
      
      <!-- 新しい用語 -->
      <div class="form-group">
        <label>新しい用語</label>
        <input type="text" name="new_terms" placeholder="例: 筆算, くり上がり">
      </div>
      
      <!-- 例題 -->
      <div class="form-group">
        <label>例題</label>
        <textarea name="example_problem" rows="2" placeholder="例: 23 × 4 = ?"></textarea>
      </div>
      
      <!-- 解答例 -->
      <div class="form-group">
        <label>解答例</label>
        <textarea name="example_solution" rows="3" placeholder="解答の説明..."></textarea>
      </div>
      
      <!-- ヒント1 -->
      <div class="form-group">
        <label>ヒント1（軽いヒント）</label>
        <input type="text" name="hint_1_text" placeholder="最初のヒント">
        <input type="text" name="hint_1_tool" placeholder="考え方ツール（例: 図に描く）">
      </div>
      
      <!-- ヒント2 -->
      <div class="form-group">
        <label>ヒント2（中くらいのヒント）</label>
        <input type="text" name="hint_2_text" placeholder="2番目のヒント">
        <input type="text" name="hint_2_tool" placeholder="考え方ツール">
      </div>
      
      <!-- ヒント3 -->
      <div class="form-group">
        <label>ヒント3（具体的なヒント）</label>
        <input type="text" name="hint_3_text" placeholder="3番目のヒント">
        <input type="text" name="hint_3_tool" placeholder="考え方ツール">
      </div>
      
      <!-- ボタン -->
      <div class="modal-actions">
        <button type="button" class="cancel-btn">キャンセル</button>
        <button type="submit" class="save-btn">保存</button>
      </div>
    </form>
  </div>
</div>
```

---

### 3️⃣ JavaScript実装（ドラッグ&ドロップ）

```javascript
// ドラッグ&ドロップ機能
let draggedCard = null

document.querySelectorAll('.card-item').forEach(card => {
  // ドラッグ開始
  card.addEventListener('dragstart', (e) => {
    draggedCard = card
    card.classList.add('dragging')
  })
  
  // ドラッグ終了
  card.addEventListener('dragend', (e) => {
    card.classList.remove('dragging')
    saveNewOrder()
  })
  
  // ドロップ可能エリア
  card.addEventListener('dragover', (e) => {
    e.preventDefault()
    const afterElement = getDragAfterElement(e.clientY)
    const cardList = document.getElementById('card-list')
    if (afterElement == null) {
      cardList.appendChild(draggedCard)
    } else {
      cardList.insertBefore(draggedCard, afterElement)
    }
  })
})

// ドロップ位置を計算
function getDragAfterElement(y) {
  const draggableElements = [...document.querySelectorAll('.card-item:not(.dragging)')]
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect()
    const offset = y - box.top - box.height / 2
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child }
    } else {
      return closest
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element
}

// 新しい順序を保存
async function saveNewOrder() {
  const cardIds = [...document.querySelectorAll('.card-item')].map(card => 
    parseInt(card.dataset.cardId)
  )
  
  const response = await fetch(`/api/course/${courseId}/reorder-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardIds })
  })
  
  if (response.ok) {
    alert('✅ カードの順序を保存しました')
  } else {
    alert('❌ 保存に失敗しました')
  }
}

// カード追加
document.getElementById('add-card-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  
  const data = {
    card_title: formData.get('card_title'),
    card_type: 'main',
    problem_description: formData.get('problem_description'),
    new_terms: formData.get('new_terms'),
    example_problem: formData.get('example_problem'),
    example_solution: formData.get('example_solution'),
    hints: [
      {
        hint_number: 1,
        hint_text: formData.get('hint_1_text'),
        thinking_tool_suggestion: formData.get('hint_1_tool')
      },
      {
        hint_number: 2,
        hint_text: formData.get('hint_2_text'),
        thinking_tool_suggestion: formData.get('hint_2_tool')
      },
      {
        hint_number: 3,
        hint_text: formData.get('hint_3_text'),
        thinking_tool_suggestion: formData.get('hint_3_tool')
      }
    ]
  }
  
  const response = await fetch(`/api/course/${courseId}/add-card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (response.ok) {
    alert('✅ カードを追加しました')
    location.reload()
  } else {
    alert('❌ 追加に失敗しました')
  }
})

// カード削除
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    if (!confirm('本当に削除しますか？')) return
    
    const cardItem = e.target.closest('.card-item')
    const cardId = cardItem.dataset.cardId
    
    const response = await fetch(`/api/cards/${cardId}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      cardItem.remove()
      alert('✅ カードを削除しました')
    } else {
      alert('❌ 削除に失敗しました')
    }
  })
})
```

---

## 📊 データベーススキーマ

```sql
-- learning_cards テーブル
CREATE TABLE learning_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  card_number INTEGER NOT NULL,  -- 並び順（1, 2, 3, ...）
  card_title TEXT NOT NULL,
  card_type TEXT DEFAULT 'main',
  problem_description TEXT,
  new_terms TEXT,
  example_problem TEXT,
  example_solution TEXT,
  diagram_url TEXT,
  real_world_connection TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- hint_cards テーブル
CREATE TABLE hint_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learning_card_id INTEGER NOT NULL,
  hint_number INTEGER NOT NULL,  -- 1, 2, 3
  hint_text TEXT NOT NULL,
  thinking_tool_suggestion TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (learning_card_id) REFERENCES learning_cards(id) ON DELETE CASCADE
);
```

---

## 🎯 使用シナリオ例

### シナリオ1: 7枚目のカードを追加

```
【状況】
- 「しっかりコース」の6枚では物足りない
- もう1枚、発展問題を追加したい

【操作手順】
1. 単元編集画面を開く
2. 「しっかりコース」を選択
3. 「➕ カードを追加」ボタンをクリック
4. フォームに入力：
   - タイトル: 「かけ算の筆算（3桁×2桁）」
   - 問題文: 「237 × 48 を計算しよう」
   - ヒント1〜3を入力
5. 「保存」ボタンをクリック
6. ✅ カード7が追加される
```

---

### シナリオ2: カードの順序を変更

```
【状況】
- カード3とカード4の順序を入れ替えたい

【操作手順】
1. 単元編集画面を開く
2. カード3をドラッグ
3. カード4の下にドロップ
4. 自動的に保存される
5. ✅ カード3が4番目、カード4が3番目になる
```

---

### シナリオ3: 不要なカードを削除

```
【状況】
- カード5が重複しているので削除したい

【操作手順】
1. 単元編集画面を開く
2. カード5の「🗑️ 削除」ボタンをクリック
3. 確認ダイアログで「OK」をクリック
4. ✅ カード5が削除される
5. カード番号は自動的に再採番されない（必要なら並び替え機能を使用）
```

---

## 🔒 権限管理

### アクセス制御

```typescript
// 教師専用機能のミドルウェア
const requireTeacher = async (c, next) => {
  const user = c.get('user')
  
  if (!user || user.role !== 'teacher') {
    return c.json({ error: '教師権限が必要です' }, 403)
  }
  
  await next()
}

// ルートに適用
app.post('/api/course/:courseId/add-card', requireTeacher, async (c) => {
  // ...
})

app.delete('/api/cards/:cardId', requireTeacher, async (c) => {
  // ...
})

app.post('/api/course/:courseId/reorder-cards', requireTeacher, async (c) => {
  // ...
})
```

---

## 📈 今後の拡張案

### 1️⃣ カードテンプレート機能
```
- 「計算問題」テンプレート
- 「文章題」テンプレート
- 「図形問題」テンプレート
- テンプレートから新規カード作成
```

### 2️⃣ カード複製機能
```
- 既存カードを複製
- 少し修正して新しいカードに
- 時間短縮
```

### 3️⃣ AIカード生成機能
```
- 単元名を入力
- AIが6枚のカードを自動生成
- ヒントも自動生成
```

### 4️⃣ カードプレビュー機能
```
- 編集画面でプレビュー表示
- 生徒視点でカードを確認
- レイアウト確認
```

---

## 🎉 まとめ

### ✅ 実装完了機能

1. **単元生成の拡張**（10個 → 30個）
   - すべての学年の教科書単元に対応
   - 5年生の18単元も余裕でカバー

2. **カード追加機能**
   - 7枚目、8枚目も自由に追加
   - ヒントカードも同時作成
   - API: `POST /api/course/:courseId/add-card`

3. **カード削除機能**
   - すべてのカードを削除可能
   - 関連ヒントも自動削除
   - API: `DELETE /api/cards/:cardId`

4. **カード並び替え機能**
   - ドラッグ&ドロップで直感的
   - リアルタイム保存
   - API: `POST /api/course/:courseId/reorder-cards`

5. **検証ロジックの変更**
   - 変更前: 6枚固定
   - 変更後: **最低6枚**、追加自由

---

### 📊 デプロイ情報

- **最新デプロイURL**: https://1c1f2d00.jiyushindo-gakushu.pages.dev
- **GitHub**: https://github.com/koba06040603-ops/jiyushindo-gakushu
- **コミット**: a6a3d19

---

### 💬 フィードバック・質問

- **不具合報告**: GitHub Issues
- **機能要望**: GitHub Discussions
- **質問**: 直接お問い合わせください

---

**作成日**: 2026年1月23日  
**最終更新**: 2026年1月23日  
**バージョン**: 1.1.0  
