# セキュリティチェックリスト

## ✅ 完了した対策

### 1. **APIキーの管理**
- ✅ すべてのAPIキーは環境変数から読み込み
- ✅ コード内にAPIキーのハードコードなし
- ✅ テストファイルからAPIキーを削除
- ✅ .gitignoreにAPIキー関連のパターンを追加

### 2. **環境変数の使用**
- ✅ バックエンド: `env.GEMINI_API_KEY` を使用
- ✅ Cloudflare Pages: 環境変数で`GEMINI_API_KEY`を設定
- ✅ ローカル開発: `.dev.vars` ファイル（.gitignoreに含まれる）

### 3. **.gitignore設定**
```
# env
.env
.env.production
.env.local
.env.development
.dev.vars

# API keys and secrets (NEVER commit these)
**/api-keys.txt
**/secrets.json
**/*_secret*
**/*_apikey*

# test files with API keys
test_*.js
compare_*.js
debug_*.js
```

---

## 🔒 セキュリティベストプラクティス

### **APIキーの扱い**
1. **絶対にコードに直接書かない**
2. **環境変数を使用する**
3. **公開リポジトリにコミットしない**
4. **定期的にローテーションする**

### **Cloudflare Pagesでの環境変数設定**
1. Cloudflare Dashboard > Pages > jiyushindo-gakushu
2. Settings > Environment variables
3. Production/Preview タブで変数を追加
4. 暗号化オプションを有効にする（推奨）

### **ローカル開発環境**
1. `.dev.vars` ファイルを作成（.gitignoreに含まれる）
2. APIキーを記載:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. **絶対にGitにコミットしない**

---

## ⚠️ 漏洩時の対応手順

### **1. 即座にAPIキーを無効化**
- Google AI Studio (https://aistudio.google.com/app/apikey)
- 該当するAPIキーを削除またはRevokeする

### **2. 新しいAPIキーを生成**
- 新しいAPIキーを作成
- Cloudflare Pagesの環境変数を更新

### **3. Gitの履歴をクリーンアップ**
```bash
# BFG Repo-Cleaner（推奨）
brew install bfg
bfg --replace-text passwords.txt

# または git filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch <file_with_keys>' \
  --prune-empty --tag-name-filter cat -- --all
```

### **4. 強制プッシュ**
```bash
git push origin --force --all
git push origin --force --tags
```

---

## 📊 定期チェック

### **月次チェック**
- [ ] APIキーの使用状況を確認
- [ ] 不要なAPIキーを削除
- [ ] 環境変数が正しく設定されているか確認

### **コミット前チェック**
- [ ] `git diff` でAPIキーが含まれていないか確認
- [ ] `.env` ファイルが.gitignoreに含まれているか確認
- [ ] テストファイルにAPIキーが含まれていないか確認

---

## 🎯 現在のステータス

**最終確認日:** 2026-01-25

**セキュリティレベル:** ✅ 安全

**主要な保護対策:**
1. ✅ APIキーは環境変数のみ
2. ✅ .gitignoreで保護
3. ✅ テストファイル削除済み
4. ✅ 公開コードにAPIキーなし

**注意事項:**
- Cloudflare Pagesで`GEMINI_API_KEY`を設定する必要があります
- 新しいAPIキーを生成して設定してください（提供されたキーは無効化推奨）
