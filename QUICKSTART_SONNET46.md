# 🚀 Sonnet 4.6 クイックスタートガイド

## 📍 現在地
- **プロジェクト**: 自由進度学習支援システム
- **Phase**: 18-2完了、Phase 19準備中
- **緊急課題**: カリキュラムデータ不足（実データ150件のみ、ダミー11,080件）

## ⚡ 最初にやるべきこと

### 1️⃣ リポジトリ確認
```bash
cd /home/user/webapp
git status
git log --oneline -5
```

### 2️⃣ 引き継ぎドキュメント確認
```bash
cat HANDOFF_TO_SONNET46.md
```
**このファイルにすべての情報があります。必読！**

### 3️⃣ データベース状態確認
```bash
cd /home/user/webapp
npx wrangler d1 execute jiyushindo-gakushu-production --local --command="SELECT COUNT(*) as total, SUM(CASE WHEN unit_name LIKE '%単元%' OR unit_name LIKE '%第_単元%' THEN 1 ELSE 0 END) as dummy_count FROM curriculum"
```

### 4️⃣ 最優先タスク開始
**Task 1: カリキュラムデータ生成**（HANDOFF_TO_SONNET46.md のTask 1参照）

---

## 🎯 5つの主要タスク

| Priority | Task | Status | Description |
|----------|------|--------|-------------|
| 🔴 最高 | Task 1: データ生成 | 🔄 進行中 | 195組み合わせの実データ生成 |
| 🔴 高 | Task 2: テスト対策連携 | ⏳ 未着手 | テスト範囲入力UI + API |
| 🔴 高 | Task 3: 動的カード調整 | ⏳ 未着手 | 内容項目数に応じた枚数調整 |
| 🔴 高 | Task 4: 自己調整学習 | ⏳ 未着手 | 計画表UI + メタ認知支援 |
| 🟡 中 | Task 5: 振り返り機能 | ⏳ 未着手 | 学習結果レビュー |

---

## 📂 重要ファイル

```
webapp/
├── HANDOFF_TO_SONNET46.md          ← 📖 完全な引き継ぎ情報（必読）
├── README.md                        ← 技術ドキュメント
├── src/index.tsx                    ← メインHonoアプリ
├── public/static/
│   ├── test-preparation.html        ← テスト対策ページ
│   └── curriculum-problem-generator.html
├── scripts/
│   └── parallel-curriculum-generator.cjs ← データ生成スクリプト
└── wrangler.jsonc                   ← Cloudflare設定
```

---

## 🔧 よく使うコマンド

### ローカル開発
```bash
# ビルド
cd /home/user/webapp && npm run build

# ローカルDB操作
npx wrangler d1 execute jiyushindo-gakushu-production --local --file=<FILE>

# 並列データ生成（タイムアウト注意）
timeout 600 node scripts/parallel-curriculum-generator.cjs
```

### デプロイ
```bash
# ビルド
npm run build

# デプロイ
npx wrangler pages deploy dist --project-name jiyushindo-gakushu
```

### Git操作
```bash
# コミット
git add -A
git commit -m "説明"

# プッシュ（setup_github_environment 実行済み）
git push origin main
```

---

## 🆘 困ったら

1. **HANDOFF_TO_SONNET46.md** を読み直す
2. **README.md** の該当セクションを確認
3. **Git履歴** を確認: `git log --oneline -20`
4. **データベース** を確認: 上記コマンド参照

---

## ✅ 成功の指標

- [ ] 実データ生成: 195組み合わせ完了（現在36/195成功）
- [ ] ダミーデータ削除: 11,080件 → 0件
- [ ] テスト対策UI実装: 範囲入力機能完成
- [ ] 動的カード調整: 内容項目数ベースのロジック実装
- [ ] 自己調整学習: 計画表UI + メタ認知支援API

---

**頑張ってください！Sonnet 4.6 🚀**
