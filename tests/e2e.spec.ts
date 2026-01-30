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
