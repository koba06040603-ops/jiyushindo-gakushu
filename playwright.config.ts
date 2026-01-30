import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * Phase 7: 統合テストスイート
 */

export default defineConfig({
  testDir: './tests',
  
  // テストタイムアウト
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  // 並列実行設定
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // レポート設定
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // 共通設定
  use: {
    // ベースURL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // トレース設定（失敗時のみ）
    trace: 'on-first-retry',
    
    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',
    
    // ビデオ録画（失敗時のみ）
    video: 'retain-on-failure',
  },

  // テストプロジェクト（ブラウザ別）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // モバイルテスト
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // タブレットテスト
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // ローカル開発サーバー設定（オプション）
  webServer: {
    command: 'npm run dev:sandbox',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
