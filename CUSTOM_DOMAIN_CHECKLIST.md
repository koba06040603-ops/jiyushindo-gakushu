# カスタムドメイン設定後チェックリスト

## ✅ 設定完了後の確認項目

### 1. DNS設定確認
```bash
# ターミナルで実行
nslookup あなたのドメイン.com
# または
dig あなたのドメイン.com CNAME
```

**期待される結果:**
```
あなたのドメイン.com
canonical name = jiyushindo-gakushu.pages.dev
```

---

### 2. SSL/TLS証明書確認

**ブラウザで確認:**
1. `https://あなたのドメイン.com` にアクセス
2. アドレスバーの🔒アイコンをクリック
3. 証明書の詳細を表示
4. 発行者が「Cloudflare」であることを確認

**期待される結果:**
- 証明書の種類: Universal SSL
- 発行者: Cloudflare Inc
- 有効期限: 90日間（自動更新）

---

### 3. HTTPSリダイレクト確認

```bash
# HTTP（非SSL）でアクセス
curl -I http://あなたのドメイン.com
```

**期待される結果:**
```
HTTP/1.1 301 Moved Permanently
Location: https://あなたのドメイン.com/
```

---

### 4. 全デモページ動作確認

以下のURLにアクセスして正常に表示されることを確認:

- [ ] トップページ: `https://あなたのドメイン.com/`
- [ ] ヘルスチェック: `https://あなたのドメイン.com/health`
- [ ] 統合ダッシュボード: `https://あなたのドメイン.com/integrated-dashboard.html`
- [ ] 適応学習デモ: `https://あなたのドメイン.com/adaptive-learning-demo.html`
- [ ] 学校管理デモ: `https://あなたのドメイン.com/school-management-demo.html`
- [ ] ゲーミフィケーション: `https://あなたのドメイン.com/gamification-demo.html`
- [ ] 認証システム: `https://あなたのドメイン.com/auth-demo.html`

---

### 5. API動作確認

```bash
# ヘルスチェックAPI
curl https://あなたのドメイン.com/health

# 期待される結果
{
  "status": "healthy",
  "uptime_seconds": 0,
  "database_status": "connected",
  "api_status": {
    "gemini": "available"
  }
}
```

---

### 6. Cloudflare Analytics確認

1. Cloudflare ダッシュボードにログイン
2. Workers & Pages → jiyushindo-gakushu
3. **Analytics** タブを開く
4. トラフィック、リクエスト数、レスポンスタイムを確認

---

### 7. パフォーマンステスト

**Google PageSpeed Insights:**
1. https://pagespeed.web.dev/ にアクセス
2. カスタムドメインのURLを入力
3. 分析を実行

**目標スコア:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Core Web Vitals目標:**
- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- TTI (Time to Interactive): < 3.5s
- CLS (Cumulative Layout Shift): < 0.1

---

### 8. セキュリティヘッダー確認

```bash
curl -I https://あなたのドメイン.com
```

**確認すべきヘッダー:**
- `Strict-Transport-Security`: HTTPSの強制
- `X-Content-Type-Options`: MIMEタイプスニッフィング防止
- `X-Frame-Options`: クリックジャッキング防止
- `Content-Security-Policy`: XSS攻撃防止

---

### 9. モバイル動作確認

**スマートフォンで確認:**
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] レスポンシブデザインが正常に動作

**開発者ツールで確認:**
1. ブラウザの開発者ツールを開く (F12)
2. デバイスツールバーを有効化
3. 各種デバイスサイズで表示確認

---

### 10. README更新

カスタムドメイン設定完了後、READMEを更新:

```markdown
## 🌐 本番環境URL

- **カスタムドメイン**: https://あなたのドメイン.com ✅
- **Pagesデフォルト**: https://e8efc4f3.jiyushindo-gakushu.pages.dev
```

---

## 🎯 設定完了後の推奨アクション

### A. カスタムドメインをデフォルトに設定

Cloudflare Pages ダッシュボードで:
1. Custom domains → あなたのドメイン
2. **Set as default** をクリック
3. これにより、デフォルトURLがカスタムドメインに変更される

### B. 古いURLからのリダイレクト設定

`_redirects` ファイルを作成（オプション）:
```
# public/_redirects
https://e8efc4f3.jiyushindo-gakushu.pages.dev/* https://あなたのドメイン.com/:splat 301!
```

### C. Google Search Console登録

1. https://search.google.com/search-console にアクセス
2. プロパティを追加: `https://あなたのドメイン.com`
3. DNS認証またはHTML認証で所有権確認
4. サイトマップ送信（必要に応じて）

### D. OGP（Open Graph Protocol）設定

HTMLヘッダーにメタタグ追加:
```html
<meta property="og:url" content="https://あなたのドメイン.com" />
<meta property="og:type" content="website" />
<meta property="og:title" content="自由進度学習支援システム" />
<meta property="og:description" content="子どもたちが自ら考え実行する力を育む" />
<meta property="og:image" content="https://あなたのドメイン.com/og-image.png" />
```

---

## 📞 サポート情報

問題が発生した場合:

1. **Cloudflare Community**: https://community.cloudflare.com/
2. **Cloudflare Support**: https://support.cloudflare.com/
3. **このプロジェクトのREADME**: `/home/user/webapp/README.md`
4. **デプロイガイド**: `/home/user/webapp/DEPLOYMENT_PRODUCTION.md`

---

## 📝 変更履歴

- 2026-01-30: 初版作成（本番デプロイ完了時）
