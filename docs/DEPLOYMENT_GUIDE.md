# デプロイメント手順書

## 📋 目次

1. [デプロイメント概要](#デプロイメント概要)
2. [環境構成](#環境構成)
3. [デプロイ前チェックリスト](#デプロイ前チェックリスト)
4. [ローカル開発環境セットアップ](#ローカル開発環境セットアップ)
5. [本番環境デプロイ手順](#本番環境デプロイ手順)
6. [ロールバック手順](#ロールバック手順)
7. [トラブルシューティング](#トラブルシューティング)

---

## デプロイメント概要

### プラットフォーム

- **Cloudflare Pages**: 静的アセットとWorkerのホスティング
- **Cloudflare D1**: SQLiteデータベース（エッジネットワーク）
- **Cloudflare KV**: キャッシュストレージ
- **GitHub**: ソースコード管理とCI/CD

### デプロイ戦略

- **ブルーグリーンデプロイメント**: Cloudflare Pagesが自動的に新旧バージョンを管理
- **段階的ロールアウト**: プレビューURL → 本番環境
- **自動ロールバック**: エラー検出時に前バージョンに自動復帰

---

## 環境構成

### 環境の種類

| 環境 | URL | 用途 | データベース |
|------|-----|------|-------------|
| **Local** | http://localhost:3000 | 開発・テスト | ローカルD1（SQLite） |
| **Preview** | https://[hash].jiyushindo-gakushu.pages.dev | ステージング | 本番D1の別インスタンス |
| **Production** | https://jiyushindo-gakushu.pages.dev | 本番運用 | 本番D1 |

### 環境変数

**ローカル開発（.dev.vars）:**

```env
# Cloudflare API（開発用）
CLOUDFLARE_API_TOKEN=your_dev_token

# データベース（自動設定）
DB=jiyushindo-gakushu-production

# Email API（Resend）
RESEND_API_KEY=your_resend_api_key

# セキュリティ
CSRF_SECRET=your_csrf_secret_key
JWT_SECRET=your_jwt_secret_key

# デバッグモード
DEBUG=true
LOG_LEVEL=debug
```

**本番環境（Cloudflare Pages Secrets）:**

```bash
# Secretsの設定（一度だけ実行）
npx wrangler pages secret put RESEND_API_KEY --project-name jiyushindo-gakushu
npx wrangler pages secret put CSRF_SECRET --project-name jiyushindo-gakushu
npx wrangler pages secret put JWT_SECRET --project-name jiyushindo-gakushu

# Secretsの確認
npx wrangler pages secret list --project-name jiyushindo-gakushu
```

---

## デプロイ前チェックリスト

### コードレビュー

- [ ] すべてのテストが通過している
- [ ] ESLint/TypeScriptエラーがない
- [ ] コードレビュー承認済み
- [ ] 変更内容がREADME.mdに記載されている

### データベースマイグレーション

- [ ] 新しいマイグレーションファイルが作成されている
- [ ] ローカル環境でマイグレーションテスト済み
- [ ] ロールバック用のマイグレーションが準備されている
- [ ] データバックアップが取得されている

### セキュリティチェック

- [ ] APIキーやシークレットがコードに含まれていない
- [ ] .gitignoreが適切に設定されている
- [ ] XSS/SQLインジェクション対策が実装されている
- [ ] CSRF対策が有効になっている

### パフォーマンステスト

- [ ] 負荷テストが実施されている
- [ ] ページ読み込み時間が3秒以内
- [ ] APIレスポンス時間が500ms以内
- [ ] 画像・アセットが最適化されている

---

## ローカル開発環境セットアップ

### 前提条件

- Node.js 18以上
- npm 9以上
- Wrangler CLI
- Git

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/koba06040603-ops/jiyushindo-gakushu.git
cd jiyushindo-gakushu

# 2. 依存関係のインストール（300秒タイムアウト設定）
npm install

# 3. 環境変数ファイルの作成
cat > .dev.vars << 'EOF'
RESEND_API_KEY=your_api_key
CSRF_SECRET=your_secret
JWT_SECRET=your_secret
DEBUG=true
EOF

# 4. データベースマイグレーション（ローカル）
npx wrangler d1 migrations apply jiyushindo-gakushu-production --local

# 5. テストデータの投入（オプション）
npx wrangler d1 execute jiyushindo-gakushu-production --local --file=seed.sql

# 6. ビルド
npm run build

# 7. 開発サーバー起動（PM2使用）
pm2 start ecosystem.config.cjs

# 8. 動作確認
curl http://localhost:3000
curl http://localhost:3000/api/performance/health

# 9. ログ確認
pm2 logs jiyushindo-gakushu --nostream
```

---

## 本番環境デプロイ手順

### ステップ1: 事前準備

```bash
# 1. 最新のmainブランチをプル
git checkout main
git pull origin main

# 2. 依存関係の更新確認
npm outdated

# 3. ビルドテスト
npm run build

# 4. ローカルでの動作確認
npm run preview
```

### ステップ2: データベースマイグレーション（本番）

```bash
# 1. 本番データベースのバックアップ
npx wrangler d1 export jiyushindo-gakushu-production --remote --output=backup-pre-deploy-$(date +%Y%m%d-%H%M%S).sql

# 2. マイグレーション一覧の確認
npx wrangler d1 migrations list jiyushindo-gakushu-production --remote

# 3. マイグレーション適用（本番）
npx wrangler d1 migrations apply jiyushindo-gakushu-production --remote --batch-size=1

# 4. マイグレーション結果の確認
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="SELECT * FROM d1_migrations ORDER BY applied_at DESC LIMIT 5;"
```

### ステップ3: アプリケーションデプロイ

```bash
# 1. ビルド
npm run build

# 2. プレビューデプロイ（ステージング確認用）
npx wrangler pages deploy dist --project-name jiyushindo-gakushu --branch preview

# 📊 プレビューURL例: https://preview.jiyushindo-gakushu.pages.dev

# 3. プレビュー環境での動作確認
curl https://preview.jiyushindo-gakushu.pages.dev/api/performance/health
curl https://preview.jiyushindo-gakushu.pages.dev/api/auth/status

# 4. 本番デプロイ（mainブランチ）
npx wrangler pages deploy dist --project-name jiyushindo-gakushu --branch main

# 📊 本番URL例: https://jiyushindo-gakushu.pages.dev
```

### ステップ4: デプロイ後の確認

```bash
# 1. ヘルスチェック
curl https://jiyushindo-gakushu.pages.dev/api/performance/health

# 期待されるレスポンス:
# {
#   "status": "healthy",
#   "checks": {
#     "database": { "status": "healthy", "responseTime": 50 },
#     "api": { "status": "healthy", "responseTime": 10 }
#   },
#   "timestamp": "2026-02-04T12:00:00.000Z"
# }

# 2. 主要APIエンドポイントの確認
curl https://jiyushindo-gakushu.pages.dev/api/students
curl https://jiyushindo-gakushu.pages.dev/api/teachers

# 3. パフォーマンスダッシュボードの確認
open https://jiyushindo-gakushu.pages.dev/performance-dashboard.html

# 4. エラーログの確認
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://jiyushindo-gakushu.pages.dev/api/performance/error-logs
```

### ステップ5: GitHubへのプッシュとタグ付け

```bash
# 1. 変更をコミット
git add .
git commit -m "Deploy: Version 1.x.x - Feature description"

# 2. GitHubにプッシュ
git push origin main

# 3. リリースタグの作成
git tag -a v1.x.x -m "Release version 1.x.x"
git push origin v1.x.x

# 4. GitHub Releaseの作成（Web UI）
# https://github.com/koba06040603-ops/jiyushindo-gakushu/releases/new
```

---

## ロールバック手順

### 緊急ロールバック（アプリケーション）

```bash
# 1. 前バージョンのデプロイメントIDを確認
npx wrangler pages deployment list --project-name jiyushindo-gakushu

# 出力例:
# ID: abc123def  Status: Active   Created: 2026-02-04 12:00:00
# ID: xyz789ghi  Status: Inactive Created: 2026-02-03 10:00:00

# 2. 前バージョンに即座にロールバック
npx wrangler pages deployment rollback xyz789ghi --project-name jiyushindo-gakushu

# 3. ロールバック確認
curl https://jiyushindo-gakushu.pages.dev/api/performance/health
```

### データベースロールバック

```bash
# 1. バックアップファイルからリストア
npx wrangler d1 execute jiyushindo-gakushu-production --remote --file=backup-pre-deploy-20260204-120000.sql

# 2. データ整合性チェック
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="PRAGMA integrity_check;"

# 3. レコード数の確認
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="
  SELECT 'users' as table_name, COUNT(*) as count FROM users
  UNION ALL SELECT 'students', COUNT(*) FROM students
  UNION ALL SELECT 'teachers', COUNT(*) FROM teachers;
"
```

### Gitコミットのロールバック

```bash
# 1. コミット履歴の確認
git log --oneline -10

# 2. 特定のコミットに戻す（履歴を保持）
git revert HEAD
git push origin main

# または、強制的に前のコミットに戻す（注意: 履歴が失われる）
git reset --hard HEAD~1
git push -f origin main

# 3. 再デプロイ
npm run build
npx wrangler pages deploy dist --project-name jiyushindo-gakushu
```

---

## トラブルシューティング

### デプロイが失敗する

**エラー: "Worker bundle size exceeds limit"**

```bash
# 原因: Workerのサイズが10MBを超えている
# 対処法: 未使用の依存関係を削除

# バンドルサイズの確認
ls -lh dist/_worker.js

# 大きな依存関係の特定
npx wrangler bundle-inspector dist/_worker.js

# package.jsonから不要な依存関係を削除
npm uninstall <unused-package>
```

**エラー: "Database migration failed"**

```bash
# 原因: マイグレーションファイルのSQL構文エラー
# 対処法: ローカル環境で先にテスト

# ローカルでマイグレーションをテスト
npx wrangler d1 migrations apply jiyushindo-gakushu-production --local --dry-run

# エラーログの確認
cat ~/.config/.wrangler/logs/wrangler-*.log
```

### アプリケーションが起動しない

**エラー: "500 Internal Server Error"**

```bash
# 1. リアルタイムログの確認
npx wrangler tail --project-name jiyushindo-gakushu

# 2. エラーログAPIで確認
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://jiyushindo-gakushu.pages.dev/api/performance/error-logs?limit=10

# 3. ヘルスチェックで問題箇所を特定
curl https://jiyushindo-gakushu.pages.dev/api/performance/health
```

### データベース接続エラー

```bash
# 1. データベースバインディングの確認
npx wrangler pages project list

# 2. wrangler.jsoncのバインディング設定を確認
cat wrangler.jsonc | grep -A 5 "d1_databases"

# 3. データベースIDの確認
npx wrangler d1 list

# 4. 正しいバインディング名を使用しているか確認
# src/index.tsx: env.DB
```

### パフォーマンス低下

```bash
# 1. パフォーマンスダッシュボードで確認
open https://jiyushindo-gakushu.pages.dev/performance-dashboard.html

# 2. エンドポイント別パフォーマンスAPI
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://jiyushindo-gakushu.pages.dev/api/performance/dashboard

# 3. 遅いクエリの特定
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="
  SELECT endpoint, AVG(response_time_ms) as avg_time
  FROM performance_metrics
  WHERE created_at >= datetime('now', '-1 hour')
  GROUP BY endpoint
  ORDER BY avg_time DESC
  LIMIT 10;
"
```

---

## CI/CDパイプライン（GitHub Actions）

### 自動デプロイ設定

**.github/workflows/deploy.yml:**

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name jiyushindo-gakushu
```

---

## デプロイメントチェックリスト

### デプロイ前

- [ ] コードレビュー完了
- [ ] すべてのテストが通過
- [ ] データベースバックアップ取得済み
- [ ] マイグレーションファイル確認済み
- [ ] セキュリティチェック完了

### デプロイ中

- [ ] マイグレーション適用成功
- [ ] ビルド成功
- [ ] プレビュー環境での動作確認完了
- [ ] 本番デプロイ成功

### デプロイ後

- [ ] ヘルスチェックAPI正常
- [ ] 主要機能の動作確認完了
- [ ] パフォーマンスダッシュボード確認
- [ ] エラーログ確認（エラーなし）
- [ ] GitHubにタグ付け完了
- [ ] ステークホルダーへの通知完了

---

## 参考リンク

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Migrations Guide](https://developers.cloudflare.com/d1/learning/migrations/)

---

**最終更新**: 2026-02-04  
**担当者**: システム管理者  
**レビュー**: 月次
