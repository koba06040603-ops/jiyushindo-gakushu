/**
 * エラー監視・ロギングシステム
 * Phase 7: 構造化ログ + Cloudflare Analytics統合
 */

import { Context } from 'hono';

// ログレベル
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

// ログエントリ型定義
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: {
    user_id?: number;
    user_type?: string;
    request_id?: string;
    path?: string;
    method?: string;
    ip?: string;
    user_agent?: string;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  metadata?: Record<string, any>;
}

/**
 * 構造化ログ出力
 */
export function log(
  level: LogLevel,
  message: string,
  options?: {
    context?: Partial<LogEntry['context']>;
    error?: Error;
    metadata?: Record<string, any>;
  }
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(options?.context && { context: options.context }),
    ...(options?.error && {
      error: {
        name: options.error.name,
        message: options.error.message,
        stack: options.error.stack,
        code: (options.error as any).code
      }
    }),
    ...(options?.metadata && { metadata: options.metadata })
  };

  // JSON形式で出力（Cloudflare Logsで解析可能）
  console.log(JSON.stringify(entry));

  // エラーレベル以上の場合は標準エラー出力にも
  if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
    console.error(JSON.stringify(entry));
  }
}

/**
 * リクエストコンテキストからログ情報を抽出
 */
export function extractContextFromRequest(c: Context): LogEntry['context'] {
  const user = c.get('user') as any;
  
  return {
    user_id: user?.user_id,
    user_type: user?.user_type,
    request_id: c.req.header('cf-request-id') || crypto.randomUUID(),
    path: c.req.path,
    method: c.req.method,
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    user_agent: c.req.header('user-agent')
  };
}

/**
 * エラーハンドリングミドルウェア
 */
export async function errorHandlingMiddleware(c: Context, next: () => Promise<void>) {
  try {
    await next();
  } catch (error) {
    const context = extractContextFromRequest(c);
    
    log(LogLevel.ERROR, 'Unhandled error in request', {
      context,
      error: error as Error,
      metadata: {
        url: c.req.url,
        body: await c.req.text().catch(() => 'Unable to parse body')
      }
    });

    // エラーレスポンス
    return c.json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'An unexpected error occurred',
      request_id: context.request_id
    }, 500);
  }
}

/**
 * リクエストロギングミドルウェア
 */
export async function requestLoggingMiddleware(c: Context, next: () => Promise<void>) {
  const startTime = Date.now();
  const context = extractContextFromRequest(c);

  log(LogLevel.INFO, 'Incoming request', {
    context,
    metadata: {
      query: c.req.query()
    }
  });

  await next();

  const duration = Date.now() - startTime;
  const status = c.res.status;

  log(
    status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO,
    'Request completed',
    {
      context,
      metadata: {
        status,
        duration_ms: duration
      }
    }
  );
}

/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * エラーレポート送信（Sentry等への統合用）
 */
export async function reportError(
  error: Error,
  context?: LogEntry['context'],
  metadata?: Record<string, any>
) {
  // ログ出力
  log(LogLevel.ERROR, 'Error reported', {
    context,
    error,
    metadata
  });

  // 本番環境ではSentry等に送信
  if (process.env.SENTRY_DSN) {
    // Sentry統合実装例（実際のSDKが必要）
    // await Sentry.captureException(error, { contexts: { ...context, ...metadata } });
  }
}

/**
 * パフォーマンス計測
 */
export class PerformanceTracker {
  private startTime: number;
  private checkpoints: Map<string, number>;

  constructor(private operationName: string) {
    this.startTime = Date.now();
    this.checkpoints = new Map();
  }

  checkpoint(name: string) {
    this.checkpoints.set(name, Date.now() - this.startTime);
  }

  finish(context?: LogEntry['context']) {
    const totalDuration = Date.now() - this.startTime;
    
    log(LogLevel.INFO, `Performance: ${this.operationName}`, {
      context,
      metadata: {
        total_duration_ms: totalDuration,
        checkpoints: Object.fromEntries(this.checkpoints)
      }
    });

    return totalDuration;
  }
}

/**
 * ヘルスチェックエンドポイント用メトリクス
 */
export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime_seconds: number;
  memory_usage_mb?: number;
  database_status: 'connected' | 'disconnected' | 'error';
  api_status: {
    gemini: 'available' | 'unavailable' | 'rate_limited';
  };
  error_rate?: number;
  last_error?: string;
}

/**
 * ヘルスチェック実行
 */
export async function performHealthCheck(c: Context): Promise<HealthMetrics> {
  const { DB, GEMINI_API_KEY } = c.env as { DB: D1Database; GEMINI_API_KEY?: string };

  // データベース接続確認
  let dbStatus: HealthMetrics['database_status'] = 'disconnected';
  try {
    await DB.prepare('SELECT 1').first();
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
    log(LogLevel.ERROR, 'Health check: Database error', { error: error as Error });
  }

  // Gemini API状態確認
  const geminiStatus = GEMINI_API_KEY ? 'available' : 'unavailable';

  // 全体ステータス判定
  let overallStatus: HealthMetrics['status'] = 'healthy';
  if (dbStatus === 'error' || geminiStatus === 'unavailable') {
    overallStatus = 'unhealthy';
  } else if (dbStatus === 'disconnected') {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    uptime_seconds: Math.floor(process.uptime?.() || 0),
    database_status: dbStatus,
    api_status: {
      gemini: geminiStatus
    }
  };
}

/**
 * Cloudflare Analytics統合用メタデータ追加
 */
export function addAnalyticsMetadata(c: Context, metadata: Record<string, string>) {
  // Cloudflare Workersでは c.res.headers にカスタムヘッダーを追加可能
  Object.entries(metadata).forEach(([key, value]) => {
    c.header(`X-Analytics-${key}`, value);
  });
}

// 便利なロガー関数
export const logger = {
  debug: (message: string, options?: Parameters<typeof log>[2]) => 
    log(LogLevel.DEBUG, message, options),
  info: (message: string, options?: Parameters<typeof log>[2]) => 
    log(LogLevel.INFO, message, options),
  warn: (message: string, options?: Parameters<typeof log>[2]) => 
    log(LogLevel.WARN, message, options),
  error: (message: string, options?: Parameters<typeof log>[2]) => 
    log(LogLevel.ERROR, message, options),
  fatal: (message: string, options?: Parameters<typeof log>[2]) => 
    log(LogLevel.FATAL, message, options),
};
