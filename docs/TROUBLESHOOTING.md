# トラブルシューティングガイド

**バージョン**: 1.0  
**最終更新**: 2026-02-04

---

## 📋 目次

1. [ログイン問題](#ログイン問題)
2. [データ表示問題](#データ表示問題)
3. [パフォーマンス問題](#パフォーマンス問題)
4. [エラーメッセージ](#エラーメッセージ)
5. [PWA関連問題](#pwa関連問題)
6. [データベース問題](#データベース問題)

---

## ログイン問題

### ❌ 「ユーザー名またはパスワードが正しくありません」

**原因:**
- ユーザー名またはパスワードの入力ミス
- アカウントが無効化されている
- データベース接続エラー

**解決方法:**

1. **入力確認**
   - ユーザー名の大文字小文字を確認
   - 半角/全角スペースの確認
   - Caps Lockの確認

2. **アカウント状態確認**
   ```sql
   SELECT username, is_active 
   FROM auth_users 
   WHERE username = 'teacher1';
   ```
   - `is_active = 0` の場合、アカウントが無効化されています
   - 有効化: `UPDATE auth_users SET is_active = 1 WHERE username = 'teacher1'`

3. **パスワードリセット**
   ```bash
   # 新しいパスワード（例: newpassword123）のハッシュを生成
   # bcryptで生成したハッシュで更新
   npx wrangler d1 execute jiyushindo-gakushu-production --remote \
     --command="UPDATE auth_users SET password_hash = '$2a$10$...' WHERE username = 'teacher1'"
   ```

---

### ❌ 「セッションが期限切れです」

**原因:**
- セッショントークンの有効期限切れ（24時間）
- ブラウザのCookieが削除された

**解決方法:**
1. ページをリロード
2. 再ログイン
3. 「ログイン状態を保持する」オプションを有効にする

---

## データ表示問題

### ❌ ダッシュボードにデータが表示されない

**原因:**
- APIエラー
- 権限不足
- データが存在しない

**解決方法:**

1. **ブラウザコンソールを確認**
   - F12キーを押してコンソールを開く
   - エラーメッセージを確認

2. **権限確認**
   ```sql
   SELECT user_role, school_id 
   FROM auth_users 
   WHERE username = 'teacher1';
   ```

3. **データ存在確認**
   ```sql
   -- 学習ログの確認
   SELECT COUNT(*) as count 
   FROM learning_logs 
   WHERE school_id = 1;
   
   -- 学生数の確認
   SELECT COUNT(*) as count 
   FROM students 
   WHERE school_id = 1;
   ```

4. **APIヘルスチェック**
   - `/api/performance/health` にアクセス
   - ステータスが `healthy` であることを確認

---

### ❌ グラフが表示されない

**原因:**
- Chart.jsの読み込みエラー
- データフォーマットエラー
- ブラウザの互換性問題

**解決方法:**

1. **ページリロード**
   - Ctrl + F5 (キャッシュクリア付きリロード)

2. **ブラウザコンソール確認**
   - Chart.js関連のエラーを確認
   - ネットワークタブでCDNの読み込み確認

3. **対応ブラウザ確認**
   - Chrome: 最新版
   - Firefox: 最新版
   - Safari: 最新版
   - Edge: 最新版

---

## パフォーマンス問題

### ❌ ページの読み込みが遅い

**原因:**
- 大量のデータ取得
- ネットワーク遅延
- サーバー負荷

**解決方法:**

1. **パフォーマンス監視ダッシュボード確認**
   - `/performance-dashboard.html` にアクセス
   - 平均応答時間を確認

2. **キャッシュクリア**
   ```javascript
   // ブラウザコンソールで実行
   caches.keys().then(keys => {
     keys.forEach(key => caches.delete(key))
   })
   ```

3. **データ量制限**
   - 大量のログを一度に表示しない
   - ページネーション機能を使用
   - 日付範囲でフィルタリング

---

### ❌ API応答が遅い（1秒以上）

**原因:**
- データベースクエリの最適化不足
- インデックスの欠如
- 大量のデータ処理

**解決方法:**

1. **スロークエリの特定**
   ```sql
   -- パフォーマンスメトリクスから遅いエンドポイントを確認
   SELECT endpoint, AVG(response_time_ms) as avg_time
   FROM performance_metrics
   WHERE created_at >= datetime('now', '-24 hours')
   GROUP BY endpoint
   ORDER BY avg_time DESC
   LIMIT 10;
   ```

2. **インデックスの確認**
   ```sql
   -- インデックス一覧
   SELECT name FROM sqlite_master 
   WHERE type = 'index';
   ```

3. **データベース最適化**
   ```bash
   # VACUUM実行（データベースの最適化）
   npx wrangler d1 execute jiyushindo-gakushu-production --remote \
     --command="VACUUM"
   ```

---

## エラーメッセージ

### ❌ 「リクエスト制限に達しました」(HTTP 429)

**原因:**
- レート制限超過（100リクエスト/分）

**解決方法:**
1. 1分間待機
2. リクエスト頻度を減らす
3. バッチ処理に変更

---

### ❌ 「CSRFトークンが必要です」(HTTP 403)

**原因:**
- CSRFトークンが送信されていない
- トークンの有効期限切れ

**解決方法:**

1. **トークン取得**
   ```javascript
   const response = await axios.get('/api/security/csrf-token')
   const token = response.data.csrfToken
   ```

2. **トークンを含めてリクエスト**
   ```javascript
   await axios.post('/api/some-endpoint', data, {
     headers: { 'X-CSRF-Token': token }
   })
   ```

---

### ❌ 「管理者権限が必要です」(HTTP 403)

**原因:**
- 管理者専用機能に一般ユーザーがアクセス

**解決方法:**
1. 管理者アカウントでログイン
2. 権限が必要な場合、管理者に連絡

---

## PWA関連問題

### ❌ PWAとしてインストールできない

**原因:**
- HTTPSでアクセスしていない
- Service Workerの登録エラー
- Manifestファイルの問題

**解決方法:**

1. **HTTPSアクセス確認**
   - URLが `https://` で始まることを確認

2. **Service Worker確認**
   ```javascript
   // ブラウザコンソールで確認
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('登録されたService Worker:', regs)
   })
   ```

3. **Manifest確認**
   - `/manifest.json` にアクセス
   - JSONが正しくパースできることを確認

---

### ❌ オフライン時にページが表示されない

**原因:**
- Service Workerのキャッシュ不足
- ネットワークエラー

**解決方法:**

1. **Service Worker再登録**
   ```javascript
   // ブラウザコンソールで実行
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.unregister())
   })
   // ページリロード後、自動で再登録
   ```

2. **キャッシュ確認**
   ```javascript
   caches.keys().then(keys => {
     console.log('キャッシュストア:', keys)
   })
   ```

---

## データベース問題

### ❌ マイグレーションエラー

**原因:**
- SQLシンタックスエラー
- 既存テーブルとの競合
- 外部キー制約違反

**解決方法:**

1. **エラーメッセージ確認**
   ```bash
   npx wrangler d1 migrations apply jiyushindo-gakushu-production --remote
   # エラー内容を確認
   ```

2. **マイグレーション履歴確認**
   ```bash
   npx wrangler d1 migrations list jiyushindo-gakushu-production --remote
   ```

3. **手動ロールバック**
   ```sql
   -- エラーが発生したテーブルを削除
   DROP TABLE IF EXISTS problem_table;
   ```

---

### ❌ データベース接続エラー

**原因:**
- Cloudflare D1 の一時的な問題
- 認証情報の誤り
- ネットワーク問題

**解決方法:**

1. **ヘルスチェック**
   - `/api/performance/health` にアクセス

2. **Cloudflare ダッシュボード確認**
   - https://dash.cloudflare.com/
   - D1データベースのステータス確認

3. **再接続試行**
   - 数分待ってから再試行
   - Cloudflare サポートに連絡

---

## 一般的なトラブルシューティング手順

### 1. ログ確認
```bash
# Wranglerログの確認
cat ~/.config/.wrangler/logs/wrangler-*.log | tail -100
```

### 2. ブラウザキャッシュクリア
- Chrome: Ctrl + Shift + Delete
- Firefox: Ctrl + Shift + Delete
- Safari: Command + Option + E

### 3. 開発者ツール活用
- F12キーでコンソール開く
- Networkタブでリクエスト確認
- Consoleタブでエラー確認

### 4. サポートへの連絡
問題が解決しない場合：
- GitHub Issues: https://github.com/koba06040603-ops/jiyushindo-gakushu/issues
- 以下の情報を含める:
  - エラーメッセージ全文
  - ブラウザとバージョン
  - 操作手順
  - スクリーンショット

---

**このガイドは定期的に更新されます。**
