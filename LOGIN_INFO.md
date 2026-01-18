# 🔐 ログイン情報 - デモアカウント

## 📋 現在利用可能なデモアカウント

本システムは現在稼働中です。以下の手順でアカウントを作成してテストできます。

---

## 🚀 アカウント作成方法

### **方法1: 本番環境で新規登録（推奨）**

1. **登録ページにアクセス**
   ```
   https://jiyushindo-gakushu.pages.dev/
   ```

2. **「新規登録」をクリック**

3. **以下の情報を入力**

#### **教師アカウント（推奨）**
```
名前: あなたの名前（例: 田中 太郎）
メールアドレス: teacher@yourdomain.com
パスワード: 任意のパスワード（8文字以上推奨）
役割: teacher（教師）
クラスコード: DEMO_2024
```

#### **生徒アカウント**
```
名前: 生徒の名前（例: 佐藤 花子）
メールアドレス: student@yourdomain.com
パスワード: 任意のパスワード
役割: student（生徒）
クラスコード: DEMO_2024
学籍番号: 001
```

#### **コーディネーターアカウント**
```
名前: コーディネーター名（例: 山田 次郎）
メールアドレス: coordinator@yourdomain.com
パスワード: 任意のパスワード
役割: coordinator（コーディネーター）
クラスコード: ALL_SCHOOLS
```

---

## 🎯 すぐにテストしたい場合

### **簡単テストアカウント（その場で作成）**

以下のコマンドをブラウザの開発者コンソールで実行してください：

```javascript
// ブラウザで https://jiyushindo-gakushu.pages.dev/ を開く
// F12キーを押して開発者コンソールを開く
// 以下をコピー＆ペースト

fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'デモ教師',
    email: 'demo-teacher@test.local',
    password: 'demo2024',
    role: 'teacher',
    class_code: 'DEMO_2024'
  })
})
.then(r => r.json())
.then(data => console.log('✅ アカウント作成成功:', data))
.catch(err => console.error('❌ エラー:', err));
```

**作成されたアカウント**:
- メールアドレス: `demo-teacher@test.local`
- パスワード: `demo2024`
- 役割: 教師

---

## 📱 ログイン方法

1. **ログインページにアクセス**
   ```
   https://jiyushindo-gakushu.pages.dev/
   ```

2. **メールアドレスとパスワードを入力**

3. **「ログイン」をクリック**

---

## 🎓 役割別の機能

### **教師（teacher）**
- ✅ ダッシュボードで全生徒の進捗を確認
- ✅ 学習カリキュラムの作成・編集
- ✅ 学習カードの管理
- ✅ AI予測とレコメンデーション
- ✅ クラス統計とレポート

### **生徒（student）**
- ✅ 自由進度学習カード
- ✅ AI対話サポート
- ✅ 自動問題生成
- ✅ 進捗追跡
- ✅ 個別最適化学習

### **コーディネーター（coordinator）**
- ✅ 複数校の管理
- ✅ クロススクール分析
- ✅ 研究データエクスポート
- ✅ 不登校児童サポート
- ✅ 論文トラッキング

---

## 🛠️ トラブルシューティング

### **ログインできない場合**

1. **メールアドレスが正しいか確認**
   - スペルミスがないか
   - @記号が含まれているか

2. **パスワードが正しいか確認**
   - 大文字小文字を区別します
   - スペースが入っていないか

3. **アカウントが存在するか確認**
   - 新規登録が必要な場合があります

4. **ブラウザのキャッシュをクリア**
   - `Ctrl+Shift+Delete`（Windows）
   - `Cmd+Shift+Delete`（Mac）

### **登録できない場合**

1. **メールアドレスが既に登録されていないか確認**
   - 別のメールアドレスを試してください

2. **必須項目がすべて入力されているか確認**
   - 名前、メールアドレス、パスワードは必須

---

## 📞 サポート情報

### **システムURL**
- **本番環境**: https://jiyushindo-gakushu.pages.dev
- **最新デプロイ**: https://74c7deec.jiyushindo-gakushu.pages.dev
- **提案書**: https://jiyushindo-gakushu.pages.dev/proposal

### **開発情報**
- **GitHub**: https://github.com/koba06040603-ops/jiyushindo-gakushu
- **ドキュメント**: README.md、EDUCATIONAL_REFORM_GUIDE.md

---

## 🎯 推奨テストフロー

### **Step 1: 教師アカウントを作成**
```
メール: your-teacher@test.com
パスワード: yourpassword
役割: teacher
クラスコード: TEST_2024
```

### **Step 2: ログインしてダッシュボードを確認**
- 左メニューから各機能を確認
- 学習カリキュラムを作成
- 学習カードを追加

### **Step 3: 生徒アカウントを作成**
```
メール: your-student@test.com
パスワード: yourpassword
役割: student
クラスコード: TEST_2024（教師と同じ）
学籍番号: 001
```

### **Step 4: 生徒としてログイン**
- 学習カードを進める
- AI対話を試す
- 進捗を記録

### **Step 5: 教師ダッシュボードで確認**
- 生徒の進捗を確認
- AI予測を確認
- レポートを生成

---

## ✅ まとめ

**今すぐテスト可能です！**

1. **https://jiyushindo-gakushu.pages.dev/** にアクセス
2. **新規登録** で教師アカウントを作成
3. **ログイン** してシステムを体験

**すべての機能がフル稼働しています！**

---

作成日: 2024年1月14日
