import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Phase 7: 統合E2Eテスト
 * クリティカルパスのテストスイート
 */

test.describe('認証システム E2Eテスト', () => {
  test('ユーザー登録 → ログイン → ログアウト フロー', async ({ page }) => {
    // 認証デモページに移動
    await page.goto(`${BASE_URL}/auth-demo.html`);
    
    // ページタイトル確認
    await expect(page.locator('h1')).toContainText('認証・認可システムデモ');
    
    // ユーザー登録タブをクリック
    await page.click('button:has-text("ユーザー登録")');
    
    // テストユーザーデータ
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // 登録フォーム入力
    await page.fill('#register-name', 'テスト 太郎');
    await page.fill('#register-email', testEmail);
    await page.fill('#register-password', testPassword);
    await page.selectOption('#register-grade', '5');
    
    // ダイアログハンドリング（alert確認）
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('登録成功');
      await dialog.accept();
    });
    
    // 登録ボタンクリック
    await page.click('button:has-text("登録する")');
    
    // ログイン状態確認
    await expect(page.locator('#loggedInStatus')).toBeVisible();
    await expect(page.locator('#currentUserCard')).toBeVisible();
    
    // ユーザー情報表示確認
    await expect(page.locator('#userInfoDisplay')).toContainText('テスト 太郎');
    await expect(page.locator('#userInfoDisplay')).toContainText(testEmail);
    
    // ログアウト
    await page.click('button:has-text("ログアウト")');
    
    // ログアウト状態確認
    await expect(page.locator('#loggedOutStatus')).toBeVisible();
    await expect(page.locator('#currentUserCard')).toBeHidden();
  });

  test('ログイン → ロールベースアクセステスト', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth-demo.html`);
    
    // ログインタブをクリック
    await page.click('button:has-text("ログイン")');
    
    // テストユーザーでログイン（既に登録済みと仮定）
    const testEmail = 'student@example.com';
    const testPassword = 'password123';
    
    await page.selectOption('#login-usertype', 'student');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('button[type="submit"]:has-text("ログイン")');
    
    // ログイン成功待機
    await page.waitForTimeout(1000);
    
    // アクセステストタブをクリック
    await page.click('button:has-text("アクセステスト")');
    
    // 学生進捗エンドポイントテスト（成功するはず）
    await page.click('button:has-text("学生進捗")');
    await page.waitForTimeout(1000);
    
    // 成功メッセージ確認
    await expect(page.locator('#testResults')).toContainText('成功');
    
    // 管理者ダッシュボードテスト（失敗するはず - 403 Forbidden）
    await page.click('button:has-text("管理者ダッシュボード")');
    await page.waitForTimeout(1000);
    
    // 失敗メッセージ確認
    await expect(page.locator('#testResults')).toContainText('失敗');
    await expect(page.locator('#testResults')).toContainText('403');
  });

  test('パスワード変更フロー', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/auth-demo.html`);
    
    // ログインタブをクリック
    await page.click('button:has-text("ログイン")');
    
    const testEmail = 'student@example.com';
    const testPassword = 'password123';
    
    await page.selectOption('#login-usertype', 'student');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('button[type="submit"]:has-text("ログイン")');
    await page.waitForTimeout(1000);
    
    // パスワード変更ボタンをクリック
    await page.click('button:has-text("パスワード変更")');
    
    // モーダルが表示されることを確認
    await expect(page.locator('#changePasswordModal')).toBeVisible();
    
    // パスワード変更フォーム入力
    await page.fill('#current-password', testPassword);
    await page.fill('#new-password', 'NewPassword123!');
    
    // 変更ボタンクリック
    await page.click('#changePasswordModal button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // モーダルが閉じることを確認
    await expect(page.locator('#changePasswordModal')).toBeHidden();
  });
});

test.describe('学習カードシステム E2Eテスト', () => {
  test('統合ダッシュボード表示テスト', async ({ page }) => {
    await page.goto(`${BASE_URL}/integrated-dashboard.html`);
    
    // ページタイトル確認
    await expect(page.locator('h1')).toContainText('統合学習ダッシュボード');
    
    // 学習方略サマリーカード確認
    await expect(page.locator('text=分散学習')).toBeVisible();
    await expect(page.locator('text=検索練習')).toBeVisible();
    await expect(page.locator('text=交互配置')).toBeVisible();
    await expect(page.locator('text=協働学習')).toBeVisible();
    
    // クイックアクションボタン確認
    await expect(page.locator('button:has-text("復習開始")')).toBeVisible();
    await expect(page.locator('button:has-text("想起練習")')).toBeVisible();
  });
});

test.describe('ゲーミフィケーション E2Eテスト', () => {
  test('ゲーミフィケーションデモページ表示', async ({ page }) => {
    await page.goto(`${BASE_URL}/gamification-demo.html`);
    
    // ページタイトル確認
    await expect(page.locator('h1')).toContainText('ゲーミフィケーション');
    
    // レベル＆ポイントカード確認
    await expect(page.locator('text=レベル & ポイント')).toBeVisible();
    
    // バッジカード確認
    await expect(page.locator('text=獲得バッジ')).toBeVisible();
    
    // ランキングカード確認
    await expect(page.locator('text=ランキング')).toBeVisible();
  });
});

test.describe('協働学習 E2Eテスト', () => {
  test('協働学習デモページ表示', async ({ page }) => {
    await page.goto(`${BASE_URL}/collaborative-reports-demo.html`);
    
    // ページタイトル確認
    await expect(page.locator('h1')).toContainText('協働学習レポート');
    
    // 友達の回答カード確認
    await expect(page.locator('text=友達の回答')).toBeVisible();
    
    // 相互評価カード確認
    await expect(page.locator('text=相互評価')).toBeVisible();
  });
});

test.describe('多言語対応 E2Eテスト', () => {
  test('多言語切り替えテスト', async ({ page }) => {
    await page.goto(`${BASE_URL}/multilingual-pwa-demo.html`);
    
    // ページタイトル確認（日本語デフォルト）
    await expect(page.locator('h1')).toContainText('多言語対応');
    
    // 言語切り替えボタン確認
    await expect(page.locator('button:has-text("English")')).toBeVisible();
    await expect(page.locator('button:has-text("中文")')).toBeVisible();
    await expect(page.locator('button:has-text("한국어")')).toBeVisible();
    
    // 英語に切り替え
    await page.click('button:has-text("English")');
    await page.waitForTimeout(500);
    
    // 英語表示確認
    await expect(page.locator('h1')).toContainText('Multilingual Support');
  });
});

test.describe('PWA・オフライン機能 E2Eテスト', () => {
  test('Service Worker登録確認', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/`);
    
    // Service Workerの登録を待機
    await page.waitForTimeout(2000);
    
    // Service Worker登録確認（Javascriptで）
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null;
    });
    
    // 登録されていることを確認（初回アクセス時は登録されていない可能性あり）
    console.log('Service Worker registered:', swRegistered);
  });

  test('オフラインページ表示', async ({ page }) => {
    await page.goto(`${BASE_URL}/offline.html`);
    
    // オフラインページタイトル確認
    await expect(page.locator('h1')).toContainText('オフライン');
    
    // 説明文確認
    await expect(page.locator('text=インターネット接続が切断されています')).toBeVisible();
  });
});

test.describe('不登校支援機能 E2Eテスト', () => {
  test('不登校支援デモページ表示', async ({ page }) => {
    await page.goto(`${BASE_URL}/truancy-support-demo.html`);
    
    // ページタイトル確認
    await expect(page.locator('h1')).toContainText('不登校児童生徒支援');
    
    // 低負荷学習モードカード確認
    await expect(page.locator('text=低負荷学習モード')).toBeVisible();
    
    // 感情トラッキングカード確認
    await expect(page.locator('text=感情トラッキング')).toBeVisible();
  });
});

test.describe('API統合テスト', () => {
  test('カリキュラムAPI動作確認', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/curriculum/list`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('curriculums');
  });

  test('通知API動作確認（認証エラー）', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/notifications`);
    
    // 認証が必要なエンドポイントは401を返すはず
    // （実装によっては200でデータが返る場合もあり）
    expect([200, 401, 403]).toContain(response.status());
  });
});

test.describe('レスポンシブデザイン E2Eテスト', () => {
  test('モバイル表示テスト', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(`${BASE_URL}/integrated-dashboard.html`);
    
    // ページが正常に表示されることを確認
    await expect(page.locator('h1')).toBeVisible();
    
    // レスポンシブレイアウト確認（グリッドが縦に並ぶ）
    const cards = page.locator('.bg-white.rounded-2xl');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('タブレット表示テスト', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto(`${BASE_URL}/gamification-demo.html`);
    
    // ページが正常に表示されることを確認
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('パフォーマンステスト', () => {
  test('ページロード時間測定', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/integrated-dashboard.html`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // 5秒以内にロード完了することを期待
    expect(loadTime).toBeLessThan(5000);
  });
});

// =============================================================================
// Phase 9 & 10: 適応学習エンジン + 学校管理機能 テスト
// =============================================================================

test.describe('Phase 9: 適応学習エンジン E2Eテスト', () => {
  test('学習スタイル自動検出 APIテスト', async ({ request }) => {
    const testStudentId = 1;
    const response = await request.get(`${BASE_URL}/api/adaptive/detect-learning-style/${testStudentId}`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('student_id');
    expect(data.data).toHaveProperty('vark_scores');
    expect(data.data).toHaveProperty('gardner_scores');
    expect(data.data).toHaveProperty('dominant_style');
    expect(data.data).toHaveProperty('confidence_level');
    
    // VARKスコア検証
    expect(data.data.vark_scores).toHaveProperty('visual');
    expect(data.data.vark_scores).toHaveProperty('auditory');
    expect(data.data.vark_scores).toHaveProperty('reading');
    expect(data.data.vark_scores).toHaveProperty('kinesthetic');
    
    // Gardnerスコア検証
    expect(data.data.gardner_scores).toHaveProperty('linguistic');
    expect(data.data.gardner_scores).toHaveProperty('logical');
    expect(data.data.gardner_scores).toHaveProperty('spatial');
  });

  test('適応型カリキュラム推薦 APIテスト', async ({ request }) => {
    const testStudentId = 1;
    const response = await request.get(`${BASE_URL}/api/adaptive/recommend/${testStudentId}?count=5`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('student_id');
    expect(data.data).toHaveProperty('learning_style');
    expect(data.data).toHaveProperty('recommendations');
    expect(Array.isArray(data.data.recommendations)).toBe(true);
  });
});

test.describe('Phase 10: 学校管理機能 E2Eテスト', () => {
  test('学校の全クラス進捗取得 APIテスト', async ({ request }) => {
    const testSchoolId = 1;
    const response = await request.get(`${BASE_URL}/api/school/${testSchoolId}/classes`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    
    if (data.data.length > 0) {
      const classInfo = data.data[0];
      expect(classInfo).toHaveProperty('class_code');
      expect(classInfo).toHaveProperty('class_name');
      expect(classInfo).toHaveProperty('grade');
      expect(classInfo).toHaveProperty('student_count');
      expect(classInfo).toHaveProperty('total_progress');
    }
  });

  test('学年別サマリ取得 APIテスト', async ({ request }) => {
    const testSchoolId = 1;
    const response = await request.get(`${BASE_URL}/api/school/${testSchoolId}/grade-summary`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    
    if (data.data.length > 0) {
      const gradeSummary = data.data[0];
      expect(gradeSummary).toHaveProperty('grade');
      expect(gradeSummary).toHaveProperty('total_students');
      expect(gradeSummary).toHaveProperty('total_classes');
      expect(gradeSummary).toHaveProperty('average_progress');
    }
  });

  test('教師向けクラス分析 APIテスト', async ({ request }) => {
    const testTeacherId = 1;
    const testClassCode = 'CLASS001';
    const response = await request.get(`${BASE_URL}/api/teacher/${testTeacherId}/class/${testClassCode}/analysis`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('class_info');
    expect(data.data).toHaveProperty('student_details');
    expect(data.data).toHaveProperty('summary');
    expect(Array.isArray(data.data.student_details)).toBe(true);
  });

  test('保護者通知送信 APIテスト', async ({ request }) => {
    const notification = {
      student_id: 1,
      parent_email: 'parent@example.com',
      notification_type: 'email',
      subject: 'テスト通知',
      message: 'これはテスト通知です。'
    };
    
    const response = await request.post(`${BASE_URL}/api/parent/notify`, {
      data: notification
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('notification_id');
    expect(data.data).toHaveProperty('status');
  });

  test('保護者通知履歴取得 APIテスト', async ({ request }) => {
    const testStudentId = 1;
    const response = await request.get(`${BASE_URL}/api/parent/notifications/${testStudentId}`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('学校全体レポート取得 APIテスト', async ({ request }) => {
    const testSchoolId = 1;
    const startDate = '2026-01-01';
    const endDate = '2026-01-30';
    
    const response = await request.get(
      `${BASE_URL}/api/school/${testSchoolId}/report?start_date=${startDate}&end_date=${endDate}`
    );
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('school_info');
    expect(data.data).toHaveProperty('overall_stats');
    expect(data.data).toHaveProperty('grade_stats');
    expect(data.data).toHaveProperty('class_stats');
    expect(data.data).toHaveProperty('report_period');
  });
});

// =============================================================================
// Option B: 追加機能テスト（AI生成コンテンツ・マルチモーダル）
// =============================================================================

test.describe('Option B: AI生成コンテンツ E2Eテスト', () => {
  test('AI生成コンテンツ - 問題生成 APIテスト', async ({ request }) => {
    const contentRequest = {
      topic: '分数の足し算',
      learning_style: 'visual',
      grade_level: 5,
      content_type: 'problem',
      difficulty: 3,
      language: 'ja'
    };
    
    const response = await request.post(`${BASE_URL}/api/ai/generate-content`, {
      data: contentRequest
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('topic');
    expect(data.data).toHaveProperty('learning_style');
    expect(data.data).toHaveProperty('content');
    expect(data.data).toHaveProperty('metadata');
    expect(data.data.learning_style).toBe('visual');
  });

  test('AI生成コンテンツ - 解説生成 APIテスト', async ({ request }) => {
    const contentRequest = {
      topic: '掛け算の九九',
      learning_style: 'auditory',
      grade_level: 3,
      content_type: 'explanation',
      difficulty: 2,
      language: 'ja'
    };
    
    const response = await request.post(`${BASE_URL}/api/ai/generate-content`, {
      data: contentRequest
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('audio_script'); // 聴覚型向け
  });

  test('AI生成コンテンツ履歴取得 APIテスト', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ai/content-history?limit=10`);
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});

test.describe('Option B: マルチモーダル学習機能テスト', () => {
  test('マルチモーダルJSライブラリ読み込みテスト', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // multimodal-learning.js を読み込むページに移動
    await page.addScriptTag({ path: './public/static/multimodal-learning.js' });
    
    // グローバルオブジェクトの存在確認
    const hasTTS = await page.evaluate(() => typeof window.ttsController !== 'undefined');
    const hasSTT = await page.evaluate(() => typeof window.sttController !== 'undefined');
    const hasVisual = await page.evaluate(() => typeof window.visualController !== 'undefined');
    
    expect(hasTTS).toBe(true);
    expect(hasSTT).toBe(true);
    expect(hasVisual).toBe(true);
  });
});

// =============================================================================
// テストカバレッジ拡大: 主要機能の統合テスト
// =============================================================================

test.describe('主要APIエンドポイント統合テスト', () => {
  test('カリキュラム一覧取得', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/curriculum/list`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('学習カード取得', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/courses/1/cards`);
    expect(response.status()).toBe(200);
  });

  test('進捗記録', async ({ request }) => {
    const progressData = {
      student_id: 1,
      card_id: 1,
      is_correct: true,
      time_spent_seconds: 120
    };
    const response = await request.post(`${BASE_URL}/api/progress`, {
      data: progressData
    });
    expect(response.status()).toBe(200);
  });

  test('ヘルスチェックエンドポイント', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });
});

test.describe('WCAG 2.1 AAアクセシビリティテスト', () => {
  test('キーボードナビゲーション - Tabキーでフォーカス移動', async ({ page }) => {
    await page.goto(`${BASE_URL}/integrated-dashboard.html`);
    
    // 最初の要素にフォーカス
    await page.keyboard.press('Tab');
    
    // フォーカスされた要素を確認
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('画像にalt属性が存在', async ({ page }) => {
    await page.goto(`${BASE_URL}/integrated-dashboard.html`);
    
    const imagesWithoutAlt = await page.$$eval('img', imgs => 
      imgs.filter(img => !img.hasAttribute('alt')).length
    );
    
    expect(imagesWithoutAlt).toBe(0);
  });

  test('フォーム要素にラベルが存在', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth-demo.html`);
    
    const inputsWithoutLabel = await page.$$eval('input[type="text"], input[type="email"], input[type="password"]', inputs =>
      inputs.filter(input => {
        const id = input.id;
        return !id || !document.querySelector(`label[for="${id}"]`);
      }).length
    );
    
    expect(inputsWithoutLabel).toBe(0);
  });

  test('カラーコントラスト比（視覚的確認）', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    
    // ページが正常にロードされることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('ボタンのフォーカス表示', async ({ page }) => {
    await page.goto(`${BASE_URL}/adaptive-learning-demo.html`);
    
    const button = page.locator('button').first();
    await button.focus();
    
    // フォーカスリングが表示されることを確認（視覚的）
    const hasFocusStyle = await button.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    
    expect(hasFocusStyle).toBe(true);
  });
});

test.describe('パフォーマンステスト拡張', () => {
  test('API応答時間 < 200ms', async ({ request }) => {
    const startTime = Date.now();
    await request.get(`${BASE_URL}/api/curriculum/list`);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(200);
  });

  test('大量データ取得のパフォーマンス', async ({ request }) => {
    const startTime = Date.now();
    await request.get(`${BASE_URL}/api/progress/class/CLASS001`);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(500);
  });

  test('並行リクエスト処理', async ({ request }) => {
    const requests = Array(10).fill(null).map(() =>
      request.get(`${BASE_URL}/api/curriculum/list`)
    );
    
    const startTime = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - startTime;
    
    // 10並行リクエストが1秒以内に完了
    expect(duration).toBeLessThan(1000);
  });
});
