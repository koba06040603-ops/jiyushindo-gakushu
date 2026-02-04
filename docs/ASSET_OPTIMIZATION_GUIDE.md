# Phase 11-3: 画像/アセット最適化ガイドライン

## 📋 概要

このドキュメントでは、自由進度学習支援システムにおける画像とアセット（CSS/JavaScript）の最適化手法を説明します。

---

## 🖼️ 1. 画像の遅延読み込み（Lazy Loading）

### 実装方法

すべての画像に `loading="lazy"` 属性を追加します。

```html
<!-- Before: 即座に読み込み -->
<img src="/images/student-avatar.jpg" alt="Student Avatar">

<!-- After: スクロールして画面に入るまで遅延 -->
<img src="/images/student-avatar.jpg" alt="Student Avatar" loading="lazy">
```

### 適用対象
- ✅ ユーザーアバター画像
- ✅ 学習カードのサムネイル
- ✅ グラフ・チャートの背景画像
- ✅ アイコン画像（SVG以外）

### 例外（即座に読み込むべき画像）
- ❌ ロゴ（ヘッダー）
- ❌ ファーストビューの画像（スクロール不要で見える）
- ❌ 重要なUI要素

### 効果
- **初期ページ読み込み**: 30-50% 高速化
- **データ転送量**: 40-60% 削減（未表示画像は読み込まない）
- **ユーザー体験**: 即座にコンテンツ表示

---

## 🎨 2. 次世代画像フォーマット（WebP/AVIF）

### 実装方法

`<picture>` タグを使って複数フォーマットに対応します。

```html
<!-- Before: JPEGのみ (500KB) -->
<img src="/images/hero.jpg" alt="Hero Image">

<!-- After: WebP優先、JPEGフォールバック (50KB) -->
<picture>
  <source srcset="/images/hero.webp" type="image/webp">
  <img src="/images/hero.jpg" alt="Hero Image" loading="lazy">
</picture>

<!-- さらに最適: AVIF → WebP → JPEG (25KB) -->
<picture>
  <source srcset="/images/hero.avif" type="image/avif">
  <source srcset="/images/hero.webp" type="image/webp">
  <img src="/images/hero.jpg" alt="Hero Image" loading="lazy">
</picture>
```

### フォーマット比較

| フォーマット | ファイルサイズ | 対応ブラウザ | 画質 |
|-------------|---------------|-------------|------|
| **JPEG** | 500KB (基準) | すべて | 良好 |
| **WebP** | 50-100KB (80-90%削減) | Chrome, Edge, Firefox | 同等 |
| **AVIF** | 25-50KB (90-95%削減) | Chrome 85+, Firefox 93+ | 同等以上 |

### 変換方法

```bash
# WebPに変換
cwebp input.jpg -q 80 -o output.webp

# AVIFに変換
avif-cli encode input.jpg -o output.avif -q 80

# 一括変換スクリプト
for img in *.jpg; do
  cwebp "$img" -q 80 -o "${img%.jpg}.webp"
done
```

### Cloudflare Imagesを使った自動最適化

Cloudflare Imagesを使うと、自動的に最適なフォーマットに変換されます。

```html
<!-- Cloudflare Images経由 -->
<img src="https://imagedelivery.net/YOUR_ACCOUNT/image-id/public" 
     alt="Optimized Image"
     loading="lazy">
```

---

## 📦 3. CSS/JavaScriptの最適化

### 3.1 ファイルの圧縮（Minification）

**ビルドプロセスに統合:**

```json
// package.json
{
  "scripts": {
    "build:css": "postcss src/styles.css -o dist/styles.min.css --use cssnano",
    "build:js": "terser src/app.js -o dist/app.min.js -c -m",
    "build": "npm run build:css && npm run build:js && vite build"
  },
  "devDependencies": {
    "cssnano": "^6.0.0",
    "postcss": "^8.4.0",
    "postcss-cli": "^11.0.0",
    "terser": "^5.19.0"
  }
}
```

### 3.2 不要なコードの削除

```html
<!-- Before: 使わないライブラリも読み込み -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>

<!-- After: 必要なものだけ -->
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
```

### 3.3 コード分割（Code Splitting）

```javascript
// Before: すべて最初に読み込み (500KB)
import { Chart } from 'chart.js'
import { jsPDF } from 'jspdf'
import axios from 'axios'

// After: 必要な時だけ動的インポート
// グラフ表示時のみ
async function showChart() {
  const { Chart } = await import('chart.js')
  // グラフ描画処理
}

// PDFエクスポート時のみ
async function exportPDF() {
  const { jsPDF } = await import('jspdf')
  // PDF生成処理
}
```

### 3.4 defer/async属性の使用

```html
<!-- Before: 同期読み込み（ページブロック） -->
<script src="/js/app.js"></script>

<!-- After: 非同期読み込み -->
<script src="/js/app.js" defer></script>

<!-- 依存関係なしの場合 -->
<script src="/js/analytics.js" async></script>
```

**defer vs async:**
- `defer`: HTMLパース完了後に実行（順序保証）
- `async`: 読み込み完了次第即実行（順序不定）

---

## 🚀 4. リソースプリロード

### 4.1 重要リソースの事前読み込み

```html
<head>
  <!-- クリティカルCSS -->
  <link rel="preload" href="/css/critical.css" as="style">
  
  <!-- Webフォント -->
  <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- メインJavaScript -->
  <link rel="preload" href="/js/app.js" as="script">
  
  <!-- API接続先 -->
  <link rel="preconnect" href="https://api.example.com">
  <link rel="dns-prefetch" href="https://api.example.com">
</head>
```

### 4.2 次ページのプリフェッチ

```html
<!-- ユーザーが次に訪れそうなページを事前読み込み -->
<link rel="prefetch" href="/dashboard.html">
<link rel="prefetch" href="/student-list.html">
<link rel="prefetch" href="/js/dashboard.js">
```

---

## 📊 5. パフォーマンス測定

### 5.1 Lighthouse スコア目標

| 指標 | 目標値 | 現在値 | ステータス |
|------|--------|--------|-----------|
| **Performance** | 90+ | - | 測定中 |
| **Accessibility** | 90+ | - | 測定中 |
| **Best Practices** | 90+ | - | 測定中 |
| **SEO** | 90+ | - | 測定中 |

### 5.2 Core Web Vitals

| 指標 | 目標値 | 説明 |
|------|--------|------|
| **LCP** (Largest Contentful Paint) | < 2.5秒 | 最大コンテンツの描画時間 |
| **FID** (First Input Delay) | < 100ms | 初回入力遅延 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | レイアウトのずれ |

### 5.3 測定ツール

```bash
# Lighthouseで測定
npx lighthouse https://your-app.pages.dev --view

# WebPageTestで測定
# https://www.webpagetest.org/

# Chrome DevToolsで測定
# F12 → Lighthouse タブ → Generate report
```

---

## 🎯 6. 実装チェックリスト

### Phase 11-3 完了基準

- [ ] **画像遅延読み込み**
  - [ ] dashboard.html
  - [ ] parent-dashboard.html
  - [ ] security-dashboard.html
  - [ ] performance-dashboard.html
  - [ ] cache-dashboard.html

- [ ] **WebP/AVIF対応**
  - [ ] 主要画像のWebP版作成
  - [ ] `<picture>` タグで実装

- [ ] **CSS/JS最適化**
  - [ ] 未使用ライブラリの削除
  - [ ] defer/async属性の追加
  - [ ] CDN利用の確認

- [ ] **リソースプリロード**
  - [ ] クリティカルリソースにpreload
  - [ ] 次ページにprefetch

- [ ] **パフォーマンス測定**
  - [ ] Lighthouse スコア 90+
  - [ ] LCP < 2.5秒
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

---

## 📈 7. 期待される効果

### パフォーマンス改善

| 指標 | Before | After | 改善率 |
|------|--------|-------|--------|
| **ページ読み込み時間** | 5秒 | 1秒 | **80%短縮** |
| **初回ペイント (FCP)** | 2秒 | 0.5秒 | **75%短縮** |
| **データ転送量** | 2MB | 200KB | **90%削減** |
| **Lighthouse スコア** | 60 | 95+ | **+35ポイント** |

### ユーザー体験向上

- ⚡ **即座のページ表示**: 待ち時間なし
- 📱 **モバイル最適化**: 3G回線でも快適
- 💰 **データ通信量削減**: 通信費節約
- 🔋 **バッテリー消費削減**: 処理負荷軽減

---

## 🔧 8. 継続的最適化

### 定期的なチェック項目

1. **月次**
   - Lighthouse スコア測定
   - Core Web Vitals確認
   - 画像ファイルサイズ監査

2. **四半期**
   - 未使用アセットの削除
   - ライブラリバージョン更新
   - CDN設定の見直し

3. **年次**
   - パフォーマンス目標の見直し
   - 新技術（HTTP/3、Brotli圧縮など）の検討

---

**最終更新**: 2026-02-04  
**担当者**: システム管理者  
**レビュー**: Phase 11完了時
