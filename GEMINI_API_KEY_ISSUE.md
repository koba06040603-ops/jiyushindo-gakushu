# ⚠️ Gemini APIキー問題の解決方法

## 🔴 現在の問題

**エラー内容**:
```
Your API key was reported as leaked. Please use another API key.
```

**原因**:
- コード内にハードコードされたGemini APIキーが漏洩報告され、Googleによって無効化されました
- そのため、AI単元自動生成機能が動作していません

---

## ✅ 解決方法

### **ステップ1: 新しいGemini APIキーを取得**

1. **Google AI Studioにアクセス**
   ```
   https://aistudio.google.com/apikey
   ```

2. **Googleアカウントでログイン**

3. **「APIキーを作成」をクリック**

4. **「新しいプロジェクトでAPIキーを作成」**を選択

5. **APIキーをコピー**（例: `AIzaSy...` で始まる文字列）

---

### **ステップ2: ローカル開発環境にAPIキーを設定**

#### **方法A: .dev.varsファイルを更新（ローカル開発用）**

ファイル: `/home/user/webapp/.dev.vars`
```bash
# Development environment variables
# DO NOT COMMIT THIS FILE TO GIT
GEMINI_API_KEY=あなたの新しいAPIキーをここに貼り付け
```

#### **方法B: Wrangler Secretsに設定（本番環境用）**

```bash
cd /home/user/webapp
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu
# プロンプトが表示されたら、新しいAPIキーを貼り付け
```

---

### **ステップ3: サーバーを再起動**

```bash
cd /home/user/webapp
pm2 restart webapp --update-env
```

---

## 🛠️ 現在の回避策（一時的）

APIキーを取得するまでの間、**手動で単元名を入力**することで機能を使用できます：

### **単元生成画面で**:
1. 学年・教科・教科書会社を選択
2. **単元名を手動で入力**（例: かけ算の筆算）
3. 「AI単元自動生成を開始」をクリック

**注意**: 「AIで単元候補を表示」ボタンは現在使用できません（APIキーが必要）

---

## 📋 よくある単元名の例

### **小学1年 国語**
- ひらがな
- カタカナ
- 漢字の読み書き
- 物語文の読解
- 説明文の読解

### **小学3年 算数**
- かけ算の筆算
- わり算の筆算
- 小数
- 分数
- 円と球

### **小学5年 理科**
- 天気の変化
- 植物の発芽と成長
- メダカのたんじょう
- 流れる水のはたらき
- 電流がうみ出す力

---

## 🔐 セキュリティのベストプラクティス

### **今後のために**:

1. **APIキーをコードにハードコードしない**
   - ✅ 環境変数を使用（`.dev.vars`、Wrangler Secrets）
   - ❌ コード内に直接記述

2. **.dev.varsファイルを.gitignoreに追加**
   ```bash
   # すでに設定済み
   echo ".dev.vars" >> .gitignore
   ```

3. **定期的にAPIキーをローテーション**

---

## 📞 サポート

### **APIキー取得でお困りの場合**:

1. **Google AI Studioのドキュメント**
   - https://ai.google.dev/gemini-api/docs/api-key

2. **代替案**: 
   - 手動で単元名を入力して使用
   - 既存の学習カリキュラムを活用

---

## ✅ 確認チェックリスト

- [ ] Google AI StudioでAPIキーを取得
- [ ] `.dev.vars`ファイルにAPIキーを設定
- [ ] `pm2 restart webapp --update-env`でサーバー再起動
- [ ] 単元候補生成機能をテスト

---

## 🎯 修正後のテスト手順

1. **ブラウザで開く**
   ```
   https://jiyushindo-gakushu.pages.dev/
   ```

2. **ログイン後、「AI単元自動生成」をクリック**

3. **学年・教科・教科書会社を選択**

4. **「AIで単元候補を表示」をクリック**

5. **✅ 候補が表示されれば成功！**

---

新しいAPIキーを取得されましたら、お知らせください。設定をサポートします！
