# カスタムドメイン設定ガイド

Cloudflare Pagesプロジェクトに独自ドメインを設定する方法を説明します。

---

## 前提条件

- Cloudflare Pagesプロジェクトがデプロイ済み
- 独自ドメインを所有している
- DNSの基本的な知識がある

---

## パターン1: Cloudflareで管理しているドメイン（推奨）

Cloudflareでドメインを管理している場合、最も簡単に設定できます。

### Step 1: Cloudflareにドメインを追加（未追加の場合）

1. Cloudflareダッシュボード → **Add a Site**
2. ドメイン名を入力（例: `example.com`）
3. プランを選択（Free プランで十分）
4. Cloudflareが提供するネームサーバーをドメインレジストラに設定

### Step 2: カスタムドメイン追加

1. Cloudflareダッシュボード → **Workers & Pages**
2. プロジェクト **jiyushindo-gakushu** を選択
3. **Custom domains** タブを開く
4. **Set up a custom domain** をクリック
5. カスタムドメインを入力:
   - ルートドメイン: `example.com`
   - サブドメイン: `app.example.com`（推奨）
6. **Continue** をクリック
7. **Activate domain** をクリック

Cloudflareが自動的に以下を実行します:
- DNSレコードの追加（CNAME または A/AAAA）
- SSL証明書の発行（Let's Encrypt）

### Step 3: 確認

約5-10分後、以下で確認:
```bash
# DNS伝播確認
nslookup app.example.com

# HTTPSアクセステスト
curl -I https://app.example.com/health
```

---

## パターン2: 外部DNSプロバイダー

他社（お名前.com、ムームードメイン、Route 53等）でDNSを管理している場合。

### Step 1: CNAMEレコード追加

DNSプロバイダーの管理画面で以下のCNAMEレコードを追加:

```
Type: CNAME
Name: app (または任意のサブドメイン)
Value: jiyushindo-gakushu.pages.dev
TTL: 3600 (1時間)
```

**例（お名前.comの場合）:**
- ホスト名: `app`
- TYPE: `CNAME`
- VALUE: `jiyushindo-gakushu.pages.dev`
- TTL: `3600`

### Step 2: Cloudflare Pagesでドメイン追加

1. Cloudflareダッシュボード → **Workers & Pages** → **jiyushindo-gakushu**
2. **Custom domains** タブ → **Set up a custom domain**
3. サブドメインを入力: `app.example.com`
4. **Continue** → **Activate domain**

### Step 3: SSL証明書発行

Cloudflareが自動的にSSL証明書を発行しますが、外部DNSの場合は認証が必要:

1. **DNS認証**（推奨）:
   - Cloudflareが指定するTXTレコードをDNSに追加
   - 例: `_acme-challenge.app.example.com` → `verification-token`

2. **HTTP認証**:
   - Cloudflareが指定するファイルをWebサーバーに配置

### Step 4: DNS伝播待機

DNSの変更が世界中に伝播するまで最大48時間かかる場合があります（通常は数時間）。

**伝播確認ツール:**
- https://www.whatsmydns.net/
- `app.example.com` を入力してCNAMEレコードを確認

---

## パターン3: ルートドメイン（Apex Domain）

`example.com` のようなルートドメインを使用する場合（サブドメインなし）。

### 注意点
CNAMEレコードはルートドメインに設定できないため、以下の方法を使用:

### 方法A: Cloudflare管理（推奨）
Cloudflareでドメインを管理すれば、自動的にCNAME Flatteningが適用され、ルートドメインでも動作します。

### 方法B: ALIAS/AFLAMEレコード
DNSプロバイダーがALIAS または AFLAME レコードをサポートしている場合:
```
Type: ALIAS
Name: @ (ルート)
Value: jiyushindo-gakushu.pages.dev
```

**サポートするDNSプロバイダー:**
- AWS Route 53 (ALIAS)
- DNSimple (ALIAS)
- NS1 (ALIAS)
- Cloudflare (自動CNAME Flattening)

### 方法C: Aレコード（非推奨）
Cloudflare PagesのIPアドレスは変更される可能性があるため、非推奨ですが緊急時のみ:
```bash
# Cloudflare Pages IPアドレス取得
dig jiyushindo-gakushu.pages.dev +short

# 出力例:
# 172.64.155.123
# 172.64.154.234
```

---

## SSL/TLS設定

### デフォルト設定
Cloudflareが自動的にSSL証明書を発行（Let's Encrypt）:
- 発行時間: 通常5-10分
- 有効期限: 90日（自動更新）
- 対応プロトコル: TLS 1.2, TLS 1.3

### SSL/TLSモード
Cloudflareダッシュボード → **SSL/TLS** タブで設定:

- **Flexible**: CloudflareとブラウザのみHTTPS（非推奨）
- **Full**: CloudflareとOriginもHTTPS（Cloudflare Pagesでは自動設定）
- **Full (strict)**: 証明書検証あり（推奨）

Cloudflare Pagesは自動的に **Full (strict)** が適用されます。

### HTTPS強制リダイレクト
1. Cloudflareダッシュボード → **SSL/TLS** → **Edge Certificates**
2. **Always Use HTTPS** を **On** に設定
3. HTTP リクエストが自動的に HTTPS にリダイレクトされます

---

## パフォーマンス最適化

### CDN設定
Cloudflareは自動的にコンテンツをキャッシュしますが、追加設定で最適化:

#### キャッシュレベル設定
1. Cloudflareダッシュボード → **Caching** → **Configuration**
2. **Caching Level** を **Standard** に設定

#### ブラウザキャッシュTTL
1. **Browser Cache TTL** を **4 hours** に設定（デフォルト）
2. 頻繁に更新するページは **Respect Existing Headers** を推奨

### Rocket Loader（JavaScript最適化）
1. Cloudflareダッシュボード → **Speed** → **Optimization**
2. **Rocket Loader** を **Off** に設定（Cloudflare Pagesでは不要）

### Auto Minify
1. **Auto Minify** で以下を有効化:
   - ✅ JavaScript
   - ✅ CSS
   - ✅ HTML

### HTTP/2, HTTP/3
Cloudflare Pagesは自動的にHTTP/2とHTTP/3をサポート。

---

## セキュリティ設定

### セキュリティヘッダー追加
`wrangler.jsonc` に追加（または、Cloudflare Transform Rulesで設定）:

```jsonc
{
  "routes": [
    {
      "pattern": "https://app.example.com/*",
      "custom_headers": {
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
      }
    }
  ]
}
```

### HSTS (HTTP Strict Transport Security)
1. Cloudflareダッシュボード → **SSL/TLS** → **Edge Certificates**
2. **HSTS** セクションで有効化:
   - ✅ Enable HSTS
   - Max Age: **6 months** (15768000秒)
   - ✅ Include subdomains
   - ✅ Preload

---

## DNS設定例まとめ

### Cloudflare管理（推奨）
```
Type: CNAME
Name: app
Target: jiyushindo-gakushu.pages.dev
Proxy status: Proxied (オレンジ雲マーク)
TTL: Auto
```

### 外部DNS（お名前.com）
```
ホスト名: app
TYPE: CNAME
VALUE: jiyushindo-gakushu.pages.dev
TTL: 3600
```

### 外部DNS（ムームードメイン）
```
サブドメイン: app
種別: CNAME
内容: jiyushindo-gakushu.pages.dev
優先度: (空欄)
```

### AWS Route 53
```json
{
  "Type": "ALIAS",
  "Name": "app.example.com",
  "AliasTarget": {
    "DNSName": "jiyushindo-gakushu.pages.dev",
    "EvaluateTargetHealth": false
  }
}
```

---

## 確認コマンド

### DNSレコード確認
```bash
# CNAME確認
dig app.example.com CNAME +short

# IPアドレス確認
dig app.example.com +short

# 詳細情報
nslookup app.example.com
```

### SSL証明書確認
```bash
# 証明書情報取得
openssl s_client -connect app.example.com:443 -servername app.example.com < /dev/null 2>/dev/null | openssl x509 -noout -text

# 簡易確認
curl -I https://app.example.com/
```

### HTTP/HTTPS確認
```bash
# HTTPリダイレクトテスト
curl -I http://app.example.com/

# HTTPSアクセステスト
curl -I https://app.example.com/health
```

---

## トラブルシューティング

### 問題: DNS_PROBE_FINISHED_NXDOMAIN
**原因**: DNSレコードが正しく設定されていない

**解決策**:
1. DNSレコードを再確認
2. TTLが経過するまで待機（最大48時間）
3. `nslookup` で伝播状況確認

### 問題: SSL証明書エラー
**原因**: SSL証明書が未発行または期限切れ

**解決策**:
1. Cloudflareダッシュボードで証明書ステータス確認
2. **SSL/TLS** → **Edge Certificates** → **Order SSL Certificate**
3. 5-10分待機

### 問題: リダイレクトループ
**原因**: SSL/TLSモードが不適切

**解決策**:
1. Cloudflareダッシュボード → **SSL/TLS**
2. **SSL/TLS encryption mode** を **Full** または **Full (strict)** に変更

---

## 複数ドメイン設定

複数のドメインでアクセス可能にする場合:

1. Cloudflareダッシュボード → **Workers & Pages** → **jiyushindo-gakushu**
2. **Custom domains** → **Set up a custom domain**
3. 2つ目のドメインを追加（例: `study.example.com`）

**例:**
- `app.example.com` - メインドメイン
- `study.example.com` - 別名ドメイン
- `gakushu.example.jp` - 日本語ドメイン

---

## まとめ

| 設定方法 | 難易度 | 推奨度 | SSL自動化 |
|---------|--------|--------|----------|
| Cloudflare管理 | ⭐ 簡単 | ⭐⭐⭐ 最推奨 | ✅ 自動 |
| 外部DNS（CNAME） | ⭐⭐ 普通 | ⭐⭐ 推奨 | ✅ 自動 |
| 外部DNS（ALIAS） | ⭐⭐⭐ 難 | ⭐ 条件付き | ✅ 自動 |
| 外部DNS（Aレコード） | ⭐⭐ 普通 | ❌ 非推奨 | ⚠️ 手動 |

**推奨設定:**
- **DNSプロバイダー**: Cloudflare（無料プラン）
- **ドメイン**: サブドメイン（`app.example.com`）
- **SSL/TLS**: Full (strict)
- **HTTPS強制**: On
- **HSTS**: 有効化

---

**カスタムドメイン設定完了！🎉**
