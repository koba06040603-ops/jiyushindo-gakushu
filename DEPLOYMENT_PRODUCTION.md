# Cloudflare Pages 本番デプロイ完全ガイド

## 🚀 デプロイ前チェックリスト

- [ ] **Cloudflare APIキー取得済み**（Deploy タブで設定）
- [ ] **Gemini APIキー取得済み**（Google AI Studio）
- [ ] **ローカルビルド成功確認**（`npm run build`）
- [ ] **ローカルテスト成功**（`npm test`）
- [ ] **Gitコミット完了**（全変更をコミット）

---

## Step 1: KV Namespace作成

### 1-1. 本番用KV作成
```bash
# 本番用KV Namespace作成
npx wrangler kv:namespace create "jiyushindo_kv"

# 出力例:
# ✅ Success! Created KV namespace with title "jiyushindo_kv"
# Add the following to your wrangler.jsonc:
# { binding = "KV", id = "abc123def456" }
```

### 1-2. プレビュー用KV作成
```bash
# プレビュー/開発用KV Namespace作成
npx wrangler kv:namespace create "jiyushindo_kv" --preview

# 出力例:
# ✅ Success! Created KV namespace with title "jiyushindo_kv_preview"
# Add the following to your wrangler.jsonc:
# { binding = "KV", preview_id = "xyz789uvw012" }
```

### 1-3. wrangler.jsonc更新
`wrangler.jsonc` のKVセクションを更新:
```jsonc
"kv_namespaces": [
  {
    "binding": "KV",
    "id": "abc123def456",           // 👈 本番用IDを入力
    "preview_id": "xyz789uvw012"    // 👈 プレビュー用IDを入力
  }
]
```

---

## Step 2: 本番D1データベース作成

### 2-1. D1データベース作成（既に作成済みの場合はスキップ）
```bash
# 本番D1データベース作成
npx wrangler d1 create jiyushindo-gakushu-production

# 出力例:
# ✅ Success! Created D1 database!
# database_id = "508ed099-e916-468a-acec-ae7025ad9569"
```

### 2-2. マイグレーション適用
```bash
# 本番D1データベースにマイグレーション適用
npx wrangler d1 migrations apply jiyushindo-gakushu-production --remote

# 確認プロンプト:
# ? About to apply 1 migration(s)
# Your database may not be available to serve requests during the migration, continue? (Y/n)
# → Y を入力してEnter
```

### 2-3. マイグレーション確認
```bash
# 適用済みマイグレーション確認
npx wrangler d1 migrations list jiyushindo-gakushu-production --remote

# 出力例:
# Migrations to be applied:
# ┌──────────────────────────┬────────┐
# │ name                     │ status │
# ├──────────────────────────┼────────┤
# │ 0000_init_all_tables.sql │ ✅     │
# └──────────────────────────┴────────┘
```

---

## Step 3: Cloudflare Pages プロジェクト作成

### 3-1. meta_info確認（プロジェクト名）
```bash
# プロジェクト名確認（通常は "jiyushindo-gakushu"）
# meta_info から cloudflare_project_name を読み取り
```

### 3-2. Cloudflare Pagesプロジェクト作成
```bash
# Cloudflare Pagesプロジェクト作成
npx wrangler pages project create jiyushindo-gakushu \
  --production-branch main \
  --compatibility-date 2026-01-30

# 出力例:
# ✅ Successfully created the 'jiyushindo-gakushu' project.
# 🌎 Your project is accessible at https://jiyushindo-gakushu.pages.dev
```

---

## Step 4: 環境変数＆シークレット設定

**⚠️ 重要: 環境変数はコードにハードコードせず、必ず以下の方法で管理してください**

### 📦 ローカル開発環境
`.dev.vars`ファイルに環境変数を記述（自動的にwranglerが読み込みます）:
```bash
# .dev.vars (このファイルはGitにコミットしないこと！)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret
```

**確認事項:**
- ✅ `.dev.vars` が `.gitignore` に含まれていること
- ✅ `.dev.vars` をGitリポジトリにコミットしないこと
- ✅ 本番環境のシークレットとは**別の値**を使用すること（セキュリティ向上）

### 🌍 本番環境（Cloudflare Pages）
Cloudflare Pagesのシークレット機能を使用:

### 4-1. Gemini API Key設定
```bash
# Gemini API Keyをシークレットとして設定
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu

# プロンプトが表示されたら:
# Enter a secret value: 
# → Gemini APIキーをペーストしてEnter（画面には表示されません）

# 成功例:
# ✅ Success! Uploaded secret GEMINI_API_KEY
```

**Gemini APIキー取得方法:**
1. https://aistudio.google.com/app/apikey にアクセス
2. 「Get API key」をクリック
3. 新しいプロジェクトを作成または既存プロジェクトを選択
4. 生成されたAPIキーをコピー

### 4-2. JWT Secret設定
```bash
# JWT Secretをシークレットとして設定
npx wrangler pages secret put JWT_SECRET --project-name jiyushindo-gakushu

# プロンプトが表示されたら:
# Enter a secret value: 
# → 強力なランダム文字列を入力（32文字以上推奨）
# 例: openssl rand -base64 32 で生成
```

**JWT Secret生成方法:**
```bash
# Linuxコマンドで生成（推奨）
openssl rand -base64 32

# または、オンラインツール:
# https://www.random.org/strings/
# Length: 32, Digits: Yes, Uppercase: Yes, Lowercase: Yes
```

### 4-3. Cloudflare API Token設定（デプロイ時のみ）
```bash
# デプロイ実行時に環境変数として指定
export CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
npx wrangler pages deploy dist --project-name jiyushindo-gakushu

# または、.dev.varsファイルに記載（ローカル開発用）
# CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

**注意:**
- Cloudflare API Tokenは**デプロイ実行時にのみ必要**
- 本番環境のランタイムでは使用しません（Pages Secretとして設定不要）
- トークンは以下の権限が必要:
  - `Account - Cloudflare Pages - Edit`
  - `Zone - DNS - Edit`（カスタムドメイン使用時）
  - `Account - Account Settings - Read`

### 4-4. シークレット確認
```bash
# 設定済みシークレット一覧確認
npx wrangler pages secret list --project-name jiyushindo-gakushu

# 出力例:
# ┌─────────────────┬────────────┐
# │ name            │ secret     │
# ├─────────────────┼────────────┤
# │ GEMINI_API_KEY  │ **********│
# │ JWT_SECRET      │ **********│
# └─────────────────┴────────────┘
```

---

## Step 5: KV Namespace バインディング設定

### 5-1. Cloudflare Pagesダッシュボードで設定
Wranglerコマンドでは設定できないため、Webダッシュボードで設定:

1. https://dash.cloudflare.com にログイン
2. **Workers & Pages** → **jiyushindo-gakushu** を選択
3. **Settings** タブ → **Functions** セクションを開く
4. **KV namespace bindings** の **Add binding** をクリック
5. 以下を入力:
   - Variable name: `KV`
   - KV namespace: `jiyushindo_kv` を選択
6. **Save** をクリック

### 5-2. D1 Database バインディング確認
同様にD1バインディングも確認:
- Variable name: `DB`
- D1 database: `jiyushindo-gakushu-production` が設定されていることを確認

---

## Step 6: ビルド＆デプロイ

### 6-1. 最終ビルド
```bash
# プロジェクトをビルド
cd /home/user/webapp
npm run build

# 成功例:
# vite v6.4.1 building SSR bundle for production...
# ✓ 55 modules transformed.
# dist/_worker.js  449.93 kB
# ✓ built in 1.78s
```

### 6-2. 本番デプロイ実行
```bash
# Cloudflare Pagesにデプロイ
npx wrangler pages deploy dist --project-name jiyushindo-gakushu

# デプロイ進行中:
# Uploading... (100%)
# ✨ Success! Uploaded 52 files (2.34 sec)
# ✅ Success! Deployed to https://jiyushindo-gakushu.pages.dev
# 
# デプロイURL:
# - Production: https://jiyushindo-gakushu.pages.dev
# - Branch: https://main.jiyushindo-gakushu.pages.dev
```

### 6-3. デプロイ確認
```bash
# ヘルスチェック
curl https://jiyushindo-gakushu.pages.dev/health

# 出力例:
# {
#   "status": "healthy",
#   "uptime_seconds": 0,
#   "database_status": "connected",
#   "api_status": {
#     "gemini": "available"
#   }
# }
```

---

## Step 7: 本番環境動作確認

### 7-1. 基本動作確認
```bash
# トップページアクセス
curl -I https://jiyushindo-gakushu.pages.dev/

# 認証デモページ
curl -I https://jiyushindo-gakushu.pages.dev/auth-demo.html

# ヘルスチェック
curl https://jiyushindo-gakushu.pages.dev/health
```

### 7-2. API動作確認
```bash
# カリキュラム一覧取得
curl https://jiyushindo-gakushu.pages.dev/api/curriculum/list

# ユーザー登録テスト（POSTリクエスト）
curl -X POST https://jiyushindo-gakushu.pages.dev/api/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "テスト太郎",
    "email": "test@example.com",
    "password": "password123",
    "grade_level": 5
  }'
```

### 7-3. パフォーマンステスト
ブラウザで以下のURLにアクセスし、Chrome DevToolsでパフォーマンス測定:
- https://jiyushindo-gakushu.pages.dev/integrated-dashboard.html
- https://jiyushindo-gakushu.pages.dev/auth-demo.html

**目標値:**
- **FCP (First Contentful Paint)**: < 1.5秒
- **LCP (Largest Contentful Paint)**: < 2.5秒
- **TTI (Time to Interactive)**: < 3.5秒
- **Lighthouse Performance Score**: > 90

---

## Step 8: カスタムドメイン設定（オプション）

### 8-1. DNS設定
Cloudflareで管理しているドメインの場合:

1. Cloudflareダッシュボード → **Workers & Pages** → **jiyushindo-gakushu**
2. **Custom domains** タブを開く
3. **Add a custom domain** をクリック
4. カスタムドメインを入力（例: `app.example.com`）
5. **Activate domain** をクリック

Cloudflareが自動的にDNSレコードを追加します。

### 8-2. 外部DNSプロバイダーの場合
手動でCNAMEレコードを追加:
```
Type: CNAME
Name: app (または任意のサブドメイン)
Value: jiyushindo-gakushu.pages.dev
TTL: Auto
```

### 8-3. SSL証明書
Cloudflareが自動的にSSL証明書を発行します（通常5-10分）。

---

## Step 9: 監視＆ログ設定

### 9-1. Cloudflare Analytics有効化
1. Cloudflareダッシュボード → **Workers & Pages** → **jiyushindo-gakushu**
2. **Metrics** タブでリクエスト数、エラー率、レスポンスタイムを確認

### 9-2. エラーログ確認
```bash
# リアルタイムログ確認（テスト時のみ）
npx wrangler pages deployment tail --project-name jiyushindo-gakushu

# Ctrl+C で終了
```

### 9-3. ログストリーム（Logpush設定）
本番環境では、Cloudflare Logpushを設定してログを外部サービス（S3、BigQuery等）に送信:

1. Cloudflareダッシュボード → **Analytics** → **Logs**
2. **Connect a service** でログ送信先を設定

---

## Step 10: デプロイ後の定期メンテナンス

### 10-1. 定期更新
```bash
# コード変更後のデプロイ
npm run build
npx wrangler pages deploy dist --project-name jiyushindo-gakushu
```

### 10-2. D1マイグレーション追加時
```bash
# 新しいマイグレーションファイル作成
# migrations/0001_add_new_table.sql

# 本番D1に適用
npx wrangler d1 migrations apply jiyushindo-gakushu-production --remote
```

### 10-3. シークレット更新
```bash
# Gemini APIキー更新
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu

# JWT Secret更新（全ユーザーが再ログイン必要）
npx wrangler pages secret put JWT_SECRET --project-name jiyushindo-gakushu
```

---

## トラブルシューティング

### 問題: デプロイ時に「Permission denied」エラー
**原因**: Cloudflare APIトークンの権限不足

**解決策**:
1. Deploy タブで新しいAPIトークンを作成
2. 必要な権限: `Workers Scripts:Edit`, `Workers KV Storage:Edit`, `D1:Edit`

### 問題: 本番環境で「Database connection failed」
**原因**: D1バインディングが正しく設定されていない

**解決策**:
1. Cloudflareダッシュボード → **Settings** → **Functions**
2. D1 Database bindings を確認
3. Variable name: `DB`, Database: `jiyushindo-gakushu-production`

### 問題: 本番環境で「Gemini API error: Invalid API key」
**原因**: GEMINI_API_KEYシークレットが未設定または無効

**解決策**:
```bash
# シークレット確認
npx wrangler pages secret list --project-name jiyushindo-gakushu

# 再設定
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu
```

### 問題: KVキャッシュが動作しない
**原因**: KV Namespace バインディングが未設定

**解決策**:
Cloudflareダッシュボード → **Settings** → **Functions** → **KV namespace bindings** で設定

---

## 完了チェックリスト

デプロイ完了後、以下を確認:

- [ ] ✅ KV Namespace作成＆バインディング設定完了
- [ ] ✅ D1データベースマイグレーション完了
- [ ] ✅ Cloudflare Pagesプロジェクト作成完了
- [ ] ✅ 環境変数・シークレット設定完了（GEMINI_API_KEY, JWT_SECRET）
- [ ] ✅ 本番デプロイ成功
- [ ] ✅ ヘルスチェック正常（`/health` エンドポイント）
- [ ] ✅ 認証システム動作確認（ユーザー登録・ログイン）
- [ ] ✅ API動作確認（カリキュラム取得等）
- [ ] ✅ デモページ表示確認（全13ページ）
- [ ] ✅ パフォーマンステスト実施（Lighthouse Score > 90）
- [ ] ✅ カスタムドメイン設定完了（オプション）
- [ ] ✅ 監視＆ログ設定完了

---

## 本番環境URL

**プロダクションURL**: https://jiyushindo-gakushu.pages.dev

**デモページ:**
- トップページ: https://jiyushindo-gakushu.pages.dev/
- 認証デモ: https://jiyushindo-gakushu.pages.dev/auth-demo.html
- 統合ダッシュボード: https://jiyushindo-gakushu.pages.dev/integrated-dashboard.html
- ヘルスチェック: https://jiyushindo-gakushu.pages.dev/health

---

## サポート

問題が発生した場合:
1. [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
2. [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)
3. [D1 Database ドキュメント](https://developers.cloudflare.com/d1/)
4. [Cloudflare Community](https://community.cloudflare.com/)

---

**デプロイ完了！🎉**
