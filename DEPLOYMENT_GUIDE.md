# Phase 7: 本番環境デプロイガイド

## 必須設定項目

### 1. Gemini API Key設定

#### ローカル開発環境
`.dev.vars` ファイルを作成（gitignore済み）:
```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

#### 本番環境（Cloudflare Pages）
```bash
# Gemini API Keyをシークレットとして設定
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu

# プロンプトが表示されたら、APIキーを入力してEnter
```

#### API Key取得方法
1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 「Get API key」をクリック
3. 新しいプロジェクトを作成または既存プロジェクトを選択
4. 生成されたAPIキーをコピー

### 2. D1データベース作成

#### 本番D1データベース作成
```bash
# D1データベースを作成
npx wrangler d1 create jiyushindo-gakushu-production

# 出力されたdatabase_idをwrangler.jsonに設定
```

#### マイグレーション適用
```bash
# ローカル環境
npm run db:migrate:local

# 本番環境
npm run db:migrate:prod
```

### 3. 環境変数一覧

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `GEMINI_API_KEY` | Gemini AI APIキー | ✅ はい | なし |
| `SUNO_API_KEY` | Suno音楽生成APIキー | ❌ いいえ | なし |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID | ✅ はい | wrangler.jsonから自動取得 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン | ✅ はい（デプロイ時） | なし |

### 4. Cloudflare Pages デプロイ

```bash
# ビルド
npm run build

# デプロイ（初回）
npx wrangler pages project create jiyushindo-gakushu \
  --production-branch main \
  --compatibility-date 2026-01-30

# デプロイ（2回目以降）
npm run deploy
```

### 5. セキュリティ設定

#### JWTシークレット変更（本番環境）
`src/auth.ts` の `JWT_SECRET` を環境変数化:

```typescript
// 現状（開発用）
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// 本番環境では環境変数から取得
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
```

```bash
# 本番環境で設定
npx wrangler pages secret put JWT_SECRET --project-name jiyushindo-gakushu
```

#### CORS設定（必要に応じて）
`src/index.tsx` のCORS設定を本番ドメインに制限:

```typescript
app.use('/api/*', cors({
  origin: ['https://your-domain.pages.dev', 'https://your-custom-domain.com'],
  credentials: true
}))
```

### 6. 監視・ロギング設定

#### Cloudflare Workers Analytics有効化
Cloudflareダッシュボード → Workers & Pages → Analytics

#### エラートラッキング（Sentry統合例）
```bash
npm install @sentry/cloudflare

# Sentry DSN設定
npx wrangler pages secret put SENTRY_DSN --project-name jiyushindo-gakushu
```

### 7. デプロイチェックリスト

- [ ] Gemini API Key設定完了
- [ ] D1データベース作成＆マイグレーション完了
- [ ] JWT_SECRET設定完了
- [ ] ビルド成功確認（`npm run build`）
- [ ] ローカルテスト成功（`npm test`）
- [ ] 本番デプロイ実行
- [ ] 本番環境動作確認
- [ ] エラー監視設定完了

### 8. トラブルシューティング

#### 問題: Gemini APIエラー「Invalid API key」
**解決策**:
```bash
# APIキーが正しく設定されているか確認
npx wrangler pages secret list --project-name jiyushindo-gakushu

# 再設定
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu
```

#### 問題: D1データベース接続エラー
**解決策**:
```bash
# wrangler.jsonのdatabase_idを確認
cat wrangler.jsonc | grep database_id

# D1データベース一覧確認
npx wrangler d1 list

# 存在しない場合は作成
npx wrangler d1 create jiyushindo-gakushu-production
```

#### 問題: 認証エラー（401 Unauthorized）
**解決策**:
1. JWTトークンの有効期限を確認（デフォルト7日間）
2. Cookieが正しく送信されているか確認（`credentials: true`）
3. CORSヘッダーを確認

### 9. パフォーマンス最適化

#### KVキャッシュ設定例
```typescript
// よくアクセスされるデータをKVにキャッシュ
const cacheKey = `student_progress:${studentId}`;
const cached = await KV.get(cacheKey);
if (cached) return JSON.parse(cached);

// DBクエリ実行
const data = await DB.prepare(query).bind(studentId).all();

// キャッシュに保存（TTL: 5分）
await KV.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 });
```

#### INDEX追加
既にマイグレーション `0000_init_all_tables.sql` に含まれています。

### 10. 監視ダッシュボード

本番環境稼働後、以下を定期的に確認:

- **Cloudflare Analytics**: リクエスト数、エラー率、レスポンスタイム
- **D1 Metrics**: クエリ実行時間、データベースサイズ
- **Workers Logs**: エラーログ、警告ログ

---

## 連絡先

問題が発生した場合は、プロジェクト管理者に連絡してください。

---

## 参考リンク

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Gemini API Docs](https://ai.google.dev/docs)
