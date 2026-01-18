// デモアカウント作成スクリプト
// 使い方: node create_demo_accounts.js

const accounts = [
  {
    name: '田中 太郎（教師）',
    email: 'teacher@demo.local',
    password: 'demo2024',
    role: 'teacher',
    class_code: 'DEMO_CLASS_2024'
  },
  {
    name: '佐藤 花子（生徒）',
    email: 'student1@demo.local',
    password: 'demo2024',
    role: 'student',
    class_code: 'DEMO_CLASS_2024',
    student_number: '001'
  },
  {
    name: '鈴木 一郎（生徒）',
    email: 'student2@demo.local',
    password: 'demo2024',
    role: 'student',
    class_code: 'DEMO_CLASS_2024',
    student_number: '002'
  },
  {
    name: '山田 次郎（コーディネーター）',
    email: 'coordinator@demo.local',
    password: 'demo2024',
    role: 'coordinator',
    class_code: 'ALL_SCHOOLS'
  }
];

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function createAccounts() {
  console.log('🚀 デモアカウント作成を開始します...\n');
  
  for (const account of accounts) {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(account)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${account.name} (${account.email}) を作成しました`);
        console.log(`   ユーザーID: ${result.user_id}`);
      } else {
        console.log(`⚠️  ${account.name} (${account.email}): ${result.error || result.message}`);
      }
    } catch (error) {
      console.error(`❌ ${account.name} の作成に失敗: ${error.message}`);
    }
  }
  
  console.log('\n✨ デモアカウント作成が完了しました！');
  console.log('\n📋 ログイン情報:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  accounts.forEach(acc => {
    console.log(`\n【${acc.role}】`);
    console.log(`  メールアドレス: ${acc.email}`);
    console.log(`  パスワード: ${acc.password}`);
  });
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

createAccounts().catch(console.error);
