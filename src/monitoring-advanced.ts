/**
 * 監視・アラート統合システム
 * Cloudflare Analytics + Sentry + カスタムメトリクス
 */

import { Context } from 'hono';

// メトリクス収集クラス
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  
  /**
   * メトリクス記録
   */
  record(metricName: string, value: number) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName)!.push(value);
  }

  /**
   * 統計計算
   */
  getStats(metricName: string) {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(values.length * 0.5)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)]
    };
  }

  /**
   * 全メトリクス取得
   */
  getAllMetrics() {
    const result: Record<string, any> = {};
    for (const [name, _] of this.metrics) {
      result[name] = this.getStats(name);
    }
    return result;
  }

  /**
   * メトリクスクリア
   */
  clear() {
    this.metrics.clear();
  }
}

// グローバルメトリクスコレクター
const metricsCollector = new MetricsCollector();

/**
 * パフォーマンス計測ミドルウェア
 */
export const performanceMiddleware = async (c: Context, next: () => Promise<void>) => {
  const startTime = Date.now();
  const path = new URL(c.req.url).pathname;

  await next();

  const duration = Date.now() - startTime;
  
  // メトリクス記録
  metricsCollector.record('request_duration_ms', duration);
  metricsCollector.record(`request_duration_${path}`, duration);
  metricsCollector.record(`status_${c.res.status}`, 1);

  // レスポンスヘッダーに追加
  c.res.headers.set('X-Response-Time', `${duration}ms`);
  c.res.headers.set('X-Request-ID', crypto.randomUUID());

  // 遅いリクエストの警告（500ms以上）
  if (duration > 500) {
    console.warn(`[SLOW REQUEST] ${path} took ${duration}ms`);
  }
};

/**
 * Cloudflare Analytics統合
 */
export class CloudflareAnalytics {
  constructor(private accountId?: string, private apiToken?: string) {}

  /**
   * カスタムイベント送信
   */
  async trackEvent(event: {
    name: string;
    properties?: Record<string, any>;
    timestamp?: Date;
  }) {
    // Cloudflare Web Analyticsへのイベント送信
    // 本番環境ではCloudflare Workers Analyticsを使用
    console.log('[CF Analytics]', event);
  }

  /**
   * ページビュー追跡
   */
  async trackPageView(path: string, userAgent?: string) {
    await this.trackEvent({
      name: 'pageview',
      properties: { path, userAgent },
      timestamp: new Date()
    });
  }

  /**
   * APIコール追跡
   */
  async trackAPICall(endpoint: string, duration: number, status: number) {
    await this.trackEvent({
      name: 'api_call',
      properties: { endpoint, duration, status },
      timestamp: new Date()
    });
  }
}

/**
 * Sentry統合（エラー監視）
 */
export class SentryIntegration {
  private dsn?: string;
  private environment: string;

  constructor(dsn?: string, environment: string = 'production') {
    this.dsn = dsn;
    this.environment = environment;
  }

  /**
   * エラーキャプチャ
   */
  captureException(error: Error, context?: Record<string, any>) {
    if (!this.dsn) {
      console.error('[Sentry] DSN not configured');
      console.error(error, context);
      return;
    }

    const payload = {
      exception: {
        values: [{
          type: error.name,
          value: error.message,
          stacktrace: {
            frames: this.parseStackTrace(error.stack || '')
          }
        }]
      },
      level: 'error',
      environment: this.environment,
      timestamp: Date.now(),
      contexts: context || {},
      platform: 'javascript'
    };

    // Sentry APIにPOST
    this.sendToSentry(payload);
  }

  /**
   * メッセージキャプチャ
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (!this.dsn) {
      console.log(`[Sentry] ${level.toUpperCase()}: ${message}`, context);
      return;
    }

    const payload = {
      message: {
        formatted: message
      },
      level,
      environment: this.environment,
      timestamp: Date.now(),
      contexts: context || {},
      platform: 'javascript'
    };

    this.sendToSentry(payload);
  }

  /**
   * パフォーマンストランザクション
   */
  startTransaction(name: string, op: string) {
    const startTime = Date.now();

    return {
      finish: () => {
        const duration = Date.now() - startTime;
        console.log(`[Sentry Transaction] ${name} (${op}): ${duration}ms`);
      }
    };
  }

  /**
   * スタックトレース解析
   */
  private parseStackTrace(stack: string) {
    const lines = stack.split('\n').slice(1); // 最初の行（エラーメッセージ）をスキップ
    return lines.map(line => {
      const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3]),
          colno: parseInt(match[4])
        };
      }
      return { function: line.trim() };
    });
  }

  /**
   * Sentry APIへ送信
   */
  private async sendToSentry(payload: any) {
    try {
      // 実際のSentry DSNからproject IDを抽出
      const projectId = this.extractProjectId(this.dsn!);
      const url = `https://sentry.io/api/${projectId}/store/`;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': this.buildAuthHeader()
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('[Sentry] Failed to send event:', error);
    }
  }

  /**
   * DSNからProject ID抽出
   */
  private extractProjectId(dsn: string): string {
    const match = dsn.match(/sentry\.io\/(\d+)/);
    return match ? match[1] : '';
  }

  /**
   * Sentry認証ヘッダー構築
   */
  private buildAuthHeader(): string {
    const publicKey = this.dsn?.split('@')[0].split('//')[1];
    return `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=cloudflare-worker/1.0.0`;
  }
}

/**
 * 統合監視ミドルウェア
 */
export const monitoringMiddleware = (
  analytics: CloudflareAnalytics,
  sentry: SentryIntegration
) => {
  return async (c: Context, next: () => Promise<void>) => {
    const startTime = Date.now();
    const path = new URL(c.req.url).pathname;
    const transaction = sentry.startTransaction(`${c.req.method} ${path}`, 'http.server');

    try {
      await next();

      const duration = Date.now() - startTime;
      const status = c.res.status;

      // Analytics追跡
      await analytics.trackAPICall(path, duration, status);

      // メトリクス記録
      metricsCollector.record('request_duration_ms', duration);
      metricsCollector.record(`status_${status}`, 1);

      // 遅いリクエストの警告
      if (duration > 1000) {
        sentry.captureMessage(
          `Slow request: ${path} took ${duration}ms`,
          'warning',
          { path, duration, status }
        );
      }

      // エラーステータスの追跡
      if (status >= 500) {
        sentry.captureMessage(
          `Server error: ${status} on ${path}`,
          'error',
          { path, status }
        );
      }
    } catch (error) {
      // エラーキャプチャ
      sentry.captureException(error as Error, {
        request: {
          method: c.req.method,
          url: c.req.url,
          headers: Object.fromEntries(c.req.raw.headers)
        }
      });

      // エラーを再スロー
      throw error;
    } finally {
      transaction.finish();
    }
  };
};

/**
 * メトリクスエンドポイント用ハンドラ
 */
export const getMetricsHandler = async (c: Context) => {
  return c.json({
    timestamp: new Date().toISOString(),
    metrics: metricsCollector.getAllMetrics(),
    system: {
      uptime: process.uptime ? process.uptime() : 0,
      memory: process.memoryUsage ? process.memoryUsage() : {}
    }
  });
};

/**
 * ヘルスチェック強化版
 */
export const enhancedHealthCheck = async (c: Context) => {
  const { env } = c;
  const checks: Record<string, boolean> = {};

  // データベース接続チェック
  try {
    await env.DB.prepare('SELECT 1').first();
    checks.database = true;
  } catch {
    checks.database = false;
  }

  // KVストレージチェック
  try {
    if (env.LEARNING_CACHE) {
      await env.LEARNING_CACHE.put('health_check', 'ok', { expirationTtl: 60 });
      checks.kv = true;
    } else {
      checks.kv = false;
    }
  } catch {
    checks.kv = false;
  }

  // Gemini APIチェック
  checks.gemini_api = !!env.GEMINI_API_KEY;

  const allHealthy = Object.values(checks).every(v => v);

  return c.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
    metrics: metricsCollector.getStats('request_duration_ms')
  }, allHealthy ? 200 : 503);
};

// エクスポート
export { metricsCollector };
