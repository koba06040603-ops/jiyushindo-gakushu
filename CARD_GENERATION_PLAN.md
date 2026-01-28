# 学習カード生成の完全性 - 実装計画

## 現状の問題

1. **カード枚数の不安定性**
   - 3コース×6枚=18枚が確実に生成されない
   - JSON パースエラーで途中で止まる可能性

2. **JSON整合性の問題**
   - マークダウンコードブロック（```json```）が混入
   - 配列要素間のカンマ欠落
   - 不完全なJSON出力

3. **再試行ロジックの欠如**
   - 1回の失敗で即終了
   - フォールバック機能が不十分

## 解決策

### 1. カード生成API強化 (`/api/ai/generate-course`)

#### A. プロンプト改善
```
- 必ず6枚のカードを生成
- 各カードに必ず3つのヒント
- 完全なJSONのみ出力（説明文なし）
```

#### B. JSON検証強化
```typescript
// カード枚数チェック
if (!courseData.cards || courseData.cards.length !== 6) {
  throw new Error(`カードが6枚ではありません: ${courseData.cards?.length || 0}枚`)
}

// 各カードのヒントチェック
for (let i = 0; i < courseData.cards.length; i++) {
  const card = courseData.cards[i]
  if (!card.hints || card.hints.length < 3) {
    throw new Error(`カード${i+1}のヒントが3つ未満です`)
  }
}
```

#### C. 再試行ロジック
```typescript
const MAX_RETRIES = 3
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  try {
    // カード生成
    const courseData = await generateCourse()
    
    // 検証
    if (validateCourseData(courseData)) {
      return courseData
    }
  } catch (error) {
    if (attempt === MAX_RETRIES) throw error
    console.log(`リトライ ${attempt}/${MAX_RETRIES}...`)
    await delay(2000 * attempt) // 段階的な遅延
  }
}
```

### 2. カード生成の完全性保証

#### A. 段階的検証
```typescript
// ステップ1: JSON構造チェック
// ステップ2: カード枚数チェック（6枚）
// ステップ3: 各カードの必須フィールドチェック
// ステップ4: ヒント枚数チェック（各カード3つ）
```

#### B. 欠損カードの自動補完
```typescript
// カードが不足している場合、デフォルト値で補完
while (courseData.cards.length < 6) {
  courseData.cards.push(createDefaultCard(courseData.cards.length + 1))
}
```

### 3. JSON整合性の完全保証

#### A. マークダウンコードブロック除去の強化
```typescript
// ```json と ``` を除去
let cleanedResponse = aiResponse
  .replace(/```json\s*/gi, '')
  .replace(/```\s*/g, '')
  .trim()

// さらに念のため、先頭と末尾の余分な文字を削除
cleanedResponse = cleanedResponse.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '')
```

#### B. extractJSON関数の強化（既存）
- 配列要素間のカンマ欠落修正
- 未閉じ文字列の修正
- 不正な制御文字の削除

### 4. 生成進捗の可視化

#### A. フロントエンドでの進捗表示
```javascript
// コース1生成中... (1/3)
// コース2生成中... (2/3)
// コース3生成中... (3/3)
// 完了！18枚のカードを生成しました
```

## 実装順序

1. ✅ カード生成API の検証強化
2. ✅ 再試行ロジックの実装
3. ✅ JSON整合性チェックの強化
4. ✅ デフォルト値での補完機能
5. ✅ テストと検証
6. ✅ デプロイ

## 期待される成果

- **100%の成功率**: 3コース×6枚=18枚を確実に生成
- **堅牢なエラーハンドリング**: 失敗時は自動リトライ
- **完全なJSON出力**: パースエラー0%
- **ユーザー体験の向上**: 進捗表示とエラーメッセージの改善
