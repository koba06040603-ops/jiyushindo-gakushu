# GitHub Actions自動デプロイ設定手順

## 必要なSecrets設定

GitHubリポジトリで以下のSecretsを設定してください：

### 1. CLOUDFLARE_API_TOKEN
- 値: 既に作成済みのCloudflare API Token
- 取得方法: Cloudflare Dashboard → My Profile → API Tokens

### 2. CLOUDFLARE_ACCOUNT_ID
- 値: Cloudflareアカウント ID
- 取得方法: 
  ```bash
  npx wrangler whoami
  ```
  または Cloudflare Dashboard の URL から取得:
  `https://dash.cloudflare.com/[ACCOUNT_ID]/pages/...`

## Secrets設定手順

1. GitHubリポジトリページを開く
   https://github.com/koba06040603-ops/jiyushindo-gakushu

2. **Settings** タブをクリック

3. 左サイドバーの **Secrets and variables** → **Actions** をクリック

4. **New repository secret** ボタンをクリック

5. 以下の2つのSecretsを追加:
   - Name: `CLOUDFLARE_API_TOKEN`
     Value: [あなたのCloudflare API Token]
   
   - Name: `CLOUDFLARE_ACCOUNT_ID`
     Value: [あなたのCloudflare Account ID]

6. 保存後、GitHubにpushすると自動デプロイが開始されます

## 動作確認

1. コードを変更してcommit & push:
   ```bash
   git add .
   git commit -m "Test: GitHub Actions auto-deploy"
   git push origin main
   ```

2. GitHubリポジトリの **Actions** タブで進行状況を確認

3. デプロイ完了後、本番URLで確認:
   https://e8efc4f3.jiyushindo-gakushu.pages.dev
