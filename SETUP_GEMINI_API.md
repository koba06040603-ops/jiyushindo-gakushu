# Gemini API設定ガイド

このガイドでは、本番環境と開発環境でGemini APIキーを設定する方法を説明します。

## 前提条件

- Google AI Studioアカウント
- Cloudflare Pagesプロジェクトへのアクセス権

## 手順1: Gemini APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Get API key」をクリック
4. 「Create API key」を選択
5. 既存のGoogle Cloud Projectを選択するか、新規作成
6. APIキーが生成されるのでコピーして保存（このキーは二度と表示されません）

**重要**: APIキーは機密情報です。絶対にGitリポジトリにコミットしないでください。

## 手順2: 開発環境の設定

開発環境（ローカル）でGemini APIを使用するには、`.dev.vars`ファイルを作成します。

```bash
cd /home/user/webapp

# .dev.varsファイルを作成
cat > .dev.vars << 'EOF'
# Development environment variables
GEMINI_API_KEY=取得したAPIキーをここに貼り付け
EOF
```

**注意**: `.dev.vars`ファイルは`.gitignore`に含まれており、Gitにコミットされません。

### 開発サーバーでの確認

```bash
# ビルド
npm run build

# 開発サーバー起動（.dev.varsが自動的に読み込まれます）
pm2 restart webapp

# API動作確認
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "curriculumId": 1,
    "cardId": 1,
    "question": "テスト質問",
    "context": "",
    "sessionId": "test-session"
  }'
```

## 手順3: 本番環境の設定（Cloudflare Pages）

本番環境でGemini APIを使用するには、Cloudflare Pages環境変数として設定します。

### 方法1: Wrangler CLIを使用（推奨）

```bash
cd /home/user/webapp

# Cloudflare認証（既に認証済みの場合はスキップ）
npx wrangler login

# 環境変数を設定（対話的にAPIキーを入力）
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu
```

実行すると、APIキーの入力を求められます：
```
Enter a secret value: ************************************
```

### 方法2: Cloudflare Dashboard（ブラウザ）

1. [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
2. 「Workers & Pages」→「jiyushindo-gakushu」を選択
3. 「Settings」タブをクリック
4. 「Environment Variables」セクションまでスクロール
5. 「Production」環境で「Add variable」をクリック
6. 変数名: `GEMINI_API_KEY`
7. 値: 取得したGemini APIキーを貼り付け
8. 「Encrypt」をチェック（推奨）
9. 「Save」をクリック

### 設定確認

環境変数を設定したら、再デプロイが必要です：

```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name jiyushindo-gakushu
```

デプロイ後、本番環境でAI機能が動作するか確認：

```bash
# 本番環境のURLでテスト
curl -X POST https://jiyushindo-gakushu.pages.dev/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "studentId": 1,
    "curriculumId": 1,
    "cardId": 1,
    "question": "テスト質問",
    "context": "",
    "sessionId": "test-session"
  }'
```

## 手順4: セキュリティのベストプラクティス

### APIキーの保護

1. **絶対にコミットしない**: `.dev.vars`、`.env`ファイルは`.gitignore`に含める
2. **アクセス制限**: APIキーは必要な人だけに共有
3. **定期的なローテーション**: セキュリティのため定期的にAPIキーを再生成
4. **使用量監視**: Google AI Studioでトークン使用量を監視

### APIキーの再生成（漏洩時）

APIキーが漏洩した場合：

1. Google AI Studioで古いAPIキーを削除
2. 新しいAPIキーを生成
3. 開発環境（`.dev.vars`）を更新
4. 本番環境（Cloudflare Pages）を更新
5. 再デプロイ

## トラブルシューティング

### エラー: "Gemini APIキーが設定されていません"

**原因**: 環境変数が設定されていないか、プレースホルダーのまま

**解決策**:
- 開発環境: `.dev.vars`ファイルにAPIキーを設定
- 本番環境: Cloudflare Pages環境変数を確認

### エラー: "Gemini API error: 401"

**原因**: APIキーが無効または期限切れ

**解決策**:
- Google AI StudioでAPIキーの状態を確認
- 新しいAPIキーを生成して設定

### エラー: "Gemini API error: 429"

**原因**: レート制限超過

**解決策**:
- Google AI Studioで使用量を確認
- 有料プランへのアップグレードを検討
- リクエスト頻度を調整

## 参考リンク

- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

## サポート

問題が解決しない場合は、以下を確認してください：

1. `.dev.vars`ファイルが正しい場所にあるか（プロジェクトルート）
2. APIキーに余分な空白やクォートが含まれていないか
3. Cloudflare Pages環境変数が「Production」環境に設定されているか
4. 再デプロイ後に十分な時間が経過しているか（数分かかる場合があります）
