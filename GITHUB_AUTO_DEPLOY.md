# GitHub自動デプロイ設定ガイド

## 📋 概要

GitHubリポジトリとCloudflare Pagesを連携させ、`main`ブランチへのプッシュで自動デプロイを実現します。

---

## 🔧 設定手順

### Step 1: Cloudflare Pagesダッシュボードにアクセス

1. Cloudflare ダッシュボードにログイン:  
   https://dash.cloudflare.com/

2. 左サイドバーから **Workers & Pages** をクリック

3. プロジェクト一覧から **jiyushindo-gakushu** を選択

---

### Step 2: Git統合を有効化

1. **Settings** タブをクリック

2. **Builds & deployments** セクションを開く

3. **Connect to Git** ボタンをクリック

---

### Step 3: GitHubアカウント接続

1. **Connect GitHub** を選択

2. GitHub認証画面が表示される:
   - **Authorize Cloudflare Pages** をクリック
   - GitHubパスワードを入力（必要に応じて）
   - 2FA（二要素認証）を完了

3. リポジトリ選択画面で:
   - **koba06040603-ops/jiyushindo-gakushu** を選択
   - または、**All repositories** を選択して全リポジトリにアクセスを許可

4. **Install & Authorize** をクリック

---

### Step 4: ビルド設定

Git統合後、ビルド設定を確認・更新します：

**Production branch**: `main`

**Build configuration**:
```
Build command: npm run build
Build output directory: /dist
Root directory: /
Node version: 20
```

**Environment variables** (既に設定済み):
- `GEMINI_API_KEY`: (Encrypted)
- `JWT_SECRET`: (Encrypted)

**Save** をクリック

---

### Step 5: 自動デプロイの動作確認

#### テスト1: mainブランチへのプッシュ

```bash
cd /home/user/webapp

# 変更を追加
echo "# GitHub Auto Deploy Test" >> test.txt
git add test.txt
git commit -m "Test: GitHub auto deploy"

# mainブランチにプッシュ
git push origin main
```

**期待される動作:**
1. GitHubにプッシュ成功
2. Cloudflare Pagesが自動的にビルド開始
3. 数分後にデプロイ完了
4. 新しいデプロイURLが生成される

#### テスト2: Pull Request（プレビュー環境）

```bash
# 新しいブランチを作成
git checkout -b feature/test-preview
echo "# Preview Test" >> preview-test.txt
git add preview-test.txt
git commit -m "Feature: Test preview deployment"
git push origin feature/test-preview
```

**GitHub上で:**
1. Pull Requestを作成
2. Cloudflare Pagesが自動的にプレビュー環境を構築
3. PRコメントにプレビューURLが表示される

---

## 🎯 自動デプロイの仕組み

### Production Deployment (本番)

```
git push origin main
    ↓
GitHub webhook → Cloudflare Pages
    ↓
自動ビルド (npm run build)
    ↓
自動デプロイ
    ↓
https://jiyushindo-gakushu.com 更新
```

### Preview Deployment (プレビュー)

```
Pull Request作成/更新
    ↓
GitHub webhook → Cloudflare Pages
    ↓
プレビュー環境ビルド
    ↓
一時的なURL生成
    ↓
https://abc123.jiyushindo-gakushu.pages.dev
```

---

## 📊 デプロイ履歴の確認

### Cloudflare Pagesダッシュボード

1. **Deployments** タブを開く

2. デプロイ履歴が表示される:
   - Commit hash
   - Branch name
   - Deploy status (Success / Failed)
   - Deploy time
   - Preview URL

3. 各デプロイをクリックして詳細確認:
   - ビルドログ
   - デプロイ時間
   - 環境変数
   - ロールバックオプション

---

## 🔄 ロールバック手順

問題のあるデプロイを元に戻す場合:

### 方法1: Cloudflare Pagesダッシュボード

1. **Deployments** タブを開く
2. 戻したいデプロイを選択
3. **Rollback to this deployment** をクリック
4. 確認して実行

### 方法2: Gitでロールバック

```bash
# 直前のコミットを取り消し
git revert HEAD
git push origin main

# または、特定のコミットに戻す
git reset --hard <commit-hash>
git push -f origin main
```

---

## ⚙️ 高度な設定

### ブランチ別デプロイ設定

**Settings** → **Builds & deployments** → **Branch deployments**

```
Production branch: main
Preview branches: All branches (default)
または
Preview branches: feature/*, develop
```

### ビルドキャッシュ

ビルド時間を短縮:

```
Cache npm dependencies: ✅ Enabled
Cache build output: ✅ Enabled
```

### デプロイ通知

**Settings** → **Notifications**

通知先を設定:
- Email
- Slack
- Discord
- Webhook

---

## 🛡️ セキュリティ設定

### プレビューデプロイのアクセス制限

**Settings** → **Builds & deployments** → **Preview deployments**

```
Preview deployments: Enabled
Access control: 
  ☑ Require authentication
  ☑ Restrict to organization members
```

### Environment variables管理

本番環境とプレビュー環境で異なる環境変数を使用:

```
Production environment:
  GEMINI_API_KEY=<production-key>
  JWT_SECRET=<production-secret>

Preview environment:
  GEMINI_API_KEY=<staging-key>
  JWT_SECRET=<staging-secret>
```

---

## 📝 ベストプラクティス

### 1. 明確なコミットメッセージ

```bash
# 良い例
git commit -m "feat: Add group chat feature"
git commit -m "fix: Resolve database connection issue"
git commit -m "docs: Update API documentation"

# 悪い例
git commit -m "update"
git commit -m "fix bug"
```

### 2. Pull Requestの活用

```bash
# 機能開発はブランチで
git checkout -b feature/new-feature
# 開発・テスト
git push origin feature/new-feature
# GitHubでPR作成 → レビュー → マージ
```

### 3. デプロイ前の確認

```bash
# ローカルでビルドテスト
npm run build

# ローカルでプレビュー
npx wrangler pages dev dist

# テスト実行
npm test
```

---

## 🐛 トラブルシューティング

### 問題1: ビルドが失敗する

**原因**:
- 依存関係のエラー
- ビルドコマンドの誤り
- 環境変数の未設定

**解決策**:
1. Cloudflare Pagesのビルドログを確認
2. ローカルで `npm run build` を実行してエラー確認
3. `package.json` の scripts を確認
4. Environment variables を確認

### 問題2: デプロイは成功するが動作しない

**原因**:
- 環境変数の設定ミス
- データベースバインディングの未設定
- APIエンドポイントの誤り

**解決策**:
1. ブラウザの開発者ツールでエラー確認
2. `/health` エンドポイントで動作確認
3. Cloudflare Pagesのログ確認

### 問題3: GitHub連携が切れる

**原因**:
- GitHubアクセストークンの期限切れ
- リポジトリの権限変更

**解決策**:
1. Cloudflare Pages → Settings → Git
2. **Reconnect** をクリック
3. GitHub認証を再実行

---

## 📚 参考リンク

- **Cloudflare Pages公式ドキュメント**: https://developers.cloudflare.com/pages/
- **GitHub連携ガイド**: https://developers.cloudflare.com/pages/configuration/git-integration/
- **ビルド設定**: https://developers.cloudflare.com/pages/configuration/build-configuration/
- **デプロイ通知**: https://developers.cloudflare.com/pages/configuration/notifications/

---

## 📊 現在の設定状態

- **リポジトリ**: https://github.com/koba06040603-ops/jiyushindo-gakushu
- **Production branch**: main
- **本番URL**: https://jiyushindo-gakushu.com
- **デフォルトURL**: https://e8efc4f3.jiyushindo-gakushu.pages.dev
- **自動デプロイ**: ⏳ 設定待ち
- **プレビューデプロイ**: ⏳ 設定待ち

---

## ✅ 設定完了チェックリスト

- [ ] Cloudflare PagesでGit統合を有効化
- [ ] GitHub認証完了
- [ ] リポジトリ選択完了
- [ ] ビルド設定確認
- [ ] テストプッシュで自動デプロイ確認
- [ ] Pull Requestでプレビュー環境確認
- [ ] デプロイ通知設定（オプション）
- [ ] アクセス制限設定（オプション）

---

**作成日**: 2026-01-30  
**最終更新**: 2026-01-30
