/**
 * 統合認証・認可システム v4.0
 * セッショントークン + Role-Based Access Control (RBAC)
 * 
 * 🔒 認証系統統合 (2026-04-16):
 * - 3つの認証系統（JWT+students/teachers/parents, session+users, session+auth_users）を1つに統合
 * - 統一テーブル: auth_users（ユーザー情報） + auth_sessions（セッション管理）
 * - セッショントークン方式: ランダム生成のトークンをD1に保存（JWTの秘密鍵管理問題を解消）
 * - パスワードハッシュ: PBKDF2-SHA-256 + bcrypt + SHA-256レガシー自動判別・移行
 * - 招待コード: 登録時に有効な招待コードが必須
 * 
 * サポートするロール:
 * - student: 学生
 * - teacher: 教師
 * - parent: 保護者
 * - admin: 管理者
 */

import { Context } from 'hono';
import { encryptPII, decryptPII } from './crypto-utils';

// =============================================================================
// セッション設定
// =============================================================================
const SESSION_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24時間（ミリ秒）
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7日間（ミリ秒）

// =============================================================================
// パスワードハッシュ（PBKDF2-SHA-256）
// =============================================================================
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/**
 * PBKDF2-SHA-256 でパスワードをハッシュ化
 * 出力形式: "pbkdf2:iterations:salt_hex:hash_hex"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, PBKDF2_KEY_LENGTH * 8
  );
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * レガシーSHA-256ハッシュ生成（後方互換用）
 */
async function hashPasswordLegacySHA256(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * PBKDF2ハッシュを検証
 */
async function verifyPBKDF2(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  
  const iterations = parseInt(parts[1], 10);
  const saltHex = parts[2];
  const expectedHashHex = parts[3];
  
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial, PBKDF2_KEY_LENGTH * 8
  );
  
  const actualHashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  return timingSafeEqual(actualHashHex, expectedHashHex);
}

/**
 * 定数時間文字列比較（タイミング攻撃対策）
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * bcryptハッシュを検証（レガシー互換）
 * Cloudflare Workers環境ではbcryptjsを使用
 */
async function verifyBcrypt(password: string, storedHash: string): Promise<boolean> {
  try {
    // bcryptjs dynamic import for compatibility
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

/**
 * パスワード検証（PBKDF2 / bcrypt / SHA-256 自動判別 + 自動移行）
 */
export async function verifyPasswordUnified(
  password: string,
  storedHash: string,
  options?: { db?: D1Database; userId?: number }
): Promise<boolean> {
  let isValid = false;
  let needsMigration = false;

  // 1. PBKDF2形式
  if (storedHash.startsWith('pbkdf2:')) {
    return verifyPBKDF2(password, storedHash);
  }
  
  // 2. bcrypt形式
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    isValid = await verifyBcrypt(password, storedHash);
    needsMigration = isValid;
  }
  
  // 3. レガシーSHA-256（64文字hex）
  if (!isValid && storedHash.length === 64 && /^[0-9a-f]+$/.test(storedHash)) {
    const legacyHash = await hashPasswordLegacySHA256(password);
    isValid = timingSafeEqual(legacyHash, storedHash);
    needsMigration = isValid;
  }
  
  // 検証成功時、PBKDF2に自動移行
  if (needsMigration && options?.db && options?.userId) {
    try {
      const newHash = await hashPassword(password);
      await options.db.prepare(
        'UPDATE auth_users SET password_hash = ? WHERE user_id = ?'
      ).bind(newHash, options.userId).run();
      console.log(`🔒 パスワードハッシュをPBKDF2に自動移行: auth_users#${options.userId}`);
    } catch (e) {
      console.error('パスワードハッシュ移行エラー:', e);
    }
  }
  
  return isValid;
}

/**
 * セキュアなトークン生成
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// ユーザー情報の型定義
// =============================================================================
export interface AuthUser {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;          // 'student' | 'teacher' | 'parent' | 'admin'
  user_type: string;     // roleと同値（互換性）
  school_id: string;
  class_code: string;    // school_idの別名（互換性）
  student_number?: string;
}

// =============================================================================
// パスワード強度検証
// =============================================================================
export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'パスワードは8文字以上で設定してください' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'パスワードには英字を含めてください' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'パスワードには数字を含めてください' };
  }
  return { valid: true, message: '' };
}

// =============================================================================
// ログイン試行制限（D1永続化 + インメモリフォールバック）
// =============================================================================
const loginAttemptTracker = {
  _store: new Map<string, { count: number; lockedUntil: number }>(),
  MAX_ATTEMPTS: 5,
  LOCK_DURATION_MS: 15 * 60 * 1000,

  isLocked(identifier: string): boolean {
    const record = this._store.get(identifier);
    if (!record) return false;
    if (record.lockedUntil > Date.now()) return true;
    this._store.delete(identifier);
    return false;
  },

  recordFailure(identifier: string): number {
    const record = this._store.get(identifier) || { count: 0, lockedUntil: 0 };
    record.count++;
    if (record.count >= this.MAX_ATTEMPTS) {
      record.lockedUntil = Date.now() + this.LOCK_DURATION_MS;
    }
    this._store.set(identifier, record);
    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  },

  reset(identifier: string): void {
    this._store.delete(identifier);
  }
};

// =============================================================================
// 認証ミドルウェア（統合版 - セッショントークン方式）
// =============================================================================

/**
 * 統合認証ミドルウェア
 * Authorization: Bearer <session_token> を検証し、auth_sessions + auth_users から
 * ユーザー情報を取得してコンテキストにセットする。
 */
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  
  if (!sessionToken) {
    return c.json({ error: '認証が必要です', success: false }, 401);
  }
  
  try {
    const { DB } = c.env as { DB: D1Database };
    
    // auth_sessions + auth_users でセッション検証
    const session = await DB.prepare(`
      SELECT 
        u.user_id, u.username, u.full_name, u.email, u.user_role, u.school_id, u.is_active
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(sessionToken).first() as any;
    
    if (!session) {
      return c.json({ error: 'セッションが無効または期限切れです', success: false }, 401);
    }
    
    // 🔒 v4.0: 暗号化されたメールアドレスを復号
    let email = session.email || '';
    try {
      if (email && c.env) {
        email = await decryptPII(email, c.env);
      }
    } catch { /* ENCRYPTION_KEY未設定時はそのまま */ }
    
    // ユーザー情報をコンテキストにセット（全系統で統一形式）
    const userInfo: AuthUser = {
      user_id: session.user_id,
      username: session.username || '',
      full_name: session.full_name || '',
      email,
      role: session.user_role || 'student',
      user_type: session.user_role || 'student',
      school_id: session.school_id || '',
      class_code: session.school_id || '',  // 互換性エイリアス
    };
    
    c.set('user', userInfo);
    await next();
    
  } catch (error) {
    console.error('統合認証ミドルウェアエラー:', error);
    return c.json({ error: '認証に失敗しました', success: false }, 500);
  }
}

// =============================================================================
// ロールベースアクセス制御（RBAC）ミドルウェア
// =============================================================================

/**
 * ロールベースアクセス制御
 * 引数: 許可するロールの配列（文字列 or 配列のフラット化対応）
 */
export function requireRole(...allowedRolesArgs: (string | string[])[]) {
  // 配列のフラット化（requireRole(['teacher', 'admin'])にも対応）
  const allowedRoles: string[] = allowedRolesArgs.flat();
  
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as AuthUser | undefined;
    
    if (!user) {
      return c.json({ error: '認証が必要です', success: false }, 401);
    }
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({
        error: 'このリソースへのアクセス権限がありません',
        success: false,
        required_roles: allowedRoles,
        your_role: user.role
      }, 403);
    }
    
    await next();
  };
}

/**
 * ユーザータイプベースアクセス制御（互換性ラッパー）
 */
export function requireUserType(...allowedTypes: (string | string[])[]) {
  return requireRole(...allowedTypes);
}

// =============================================================================
// 統合ログインAPI
// =============================================================================

/**
 * 統合ログイン
 * - username または email で auth_users テーブルを検索
 * - PBKDF2 / bcrypt / SHA-256 自動判別
 * - D1 永続化ログインロック
 * - セッショントークン + リフレッシュトークン発行
 */
export async function login(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const body = await c.req.json();
  const identifier = body.email || body.username || '';
  const password = body.password || '';
  const userType = body.user_type; // 任意（互換性、将来の拡張用）
  
  if (!identifier || !password) {
    return c.json({ error: 'ユーザー名/メールアドレスとパスワードは必須です', success: false }, 400);
  }
  
  // ログインロック（インメモリ）
  if (loginAttemptTracker.isLocked(identifier)) {
    return c.json({ error: 'ログイン試行回数の上限に達しました。15分後に再試行してください。', success: false }, 429);
  }
  
  try {
    // auth_users で検索（username or email）
    // 🔒 v4.0: 暗号化対応 — email検索はemail_hash（SHA-256）を使用
    let emailHash = '';
    try {
      const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identifier.toLowerCase().trim()));
      emailHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {}
    
    let user = await DB.prepare(
      'SELECT * FROM auth_users WHERE (username = ? OR email = ? OR email_hash = ?) AND is_active = 1'
    ).bind(identifier, identifier, emailHash).first() as any;
    
    if (!user) {
      loginAttemptTracker.recordFailure(identifier);
      return c.json({ error: 'ユーザー名またはパスワードが正しくありません', success: false }, 401);
    }
    
    // D1 永続化ロックチェック
    if (user.locked_until && new Date(user.locked_until as string) > new Date()) {
      return c.json({ error: 'アカウントがロックされています。しばらく待ってから再度お試しください', success: false }, 403);
    }
    
    // パスワード検証
    const isValid = await verifyPasswordUnified(password, user.password_hash as string, {
      db: DB, userId: user.user_id as number
    });
    
    if (!isValid) {
      // ログイン失敗回数をD1に記録
      const attempts = ((user.failed_login_attempts as number) || 0) + 1;
      const lockUntil = attempts >= 5
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;
      
      try {
        await DB.prepare(`
          UPDATE auth_users SET failed_login_attempts = ?, locked_until = ? WHERE user_id = ?
        `).bind(attempts, lockUntil, user.user_id).run();
      } catch {}
      
      const remaining = loginAttemptTracker.recordFailure(identifier);
      if (remaining <= 0) {
        return c.json({ error: 'ログイン試行回数の上限に達しました。15分後に再試行してください。', success: false }, 429);
      }
      return c.json({ error: 'ユーザー名またはパスワードが正しくありません', success: false, attempts_remaining: remaining }, 401);
    }
    
    // ログイン成功
    loginAttemptTracker.reset(identifier);
    
    // セッショントークン + リフレッシュトークン生成
    const sessionToken = generateSecureToken(32);
    const refreshToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN).toISOString();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN).toISOString();
    
    // セッション保存
    await DB.prepare(`
      INSERT INTO auth_sessions (user_id, session_token, refresh_token, expires_at, refresh_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(user.user_id, sessionToken, refreshToken, expiresAt, refreshExpiresAt).run();
    
    // ログイン成功: 失敗回数リセット、最終ログイン更新
    try {
      await DB.prepare(`
        UPDATE auth_users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime('now')
        WHERE user_id = ?
      `).bind(user.user_id).run();
    } catch {}
    
    // 🔒 v4.0: 暗号化されたメールアドレスを復号してレスポンスに返す
    let decryptedEmail = user.email || '';
    try {
      if (decryptedEmail && c.env) {
        decryptedEmail = await decryptPII(decryptedEmail, c.env);
      }
    } catch { /* ENCRYPTION_KEY未設定時はそのまま返す */ }
    
    return c.json({
      success: true,
      session_token: sessionToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      // 互換性のため token も返す
      token: sessionToken,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        name: user.full_name,
        full_name: user.full_name,
        username: user.username,
        email: decryptedEmail,
        role: user.user_role,
        user_type: user.user_role,
        school_id: user.school_id,
        class_code: user.school_id
      }
    });
    
  } catch (error: any) {
    console.error('統合ログインエラー:', error);
    return c.json({ success: false, error: 'ログインに失敗しました', details: error.message }, 500);
  }
}

// =============================================================================
// 統合ユーザー登録
// =============================================================================

/**
 * 統合ユーザー登録
 * - 招待コードの検証（必須）
 * - auth_users テーブルに統一登録
 */
export async function registerUser(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const body = await c.req.json();
  const { name, email, username, password, role, class_code, school_id, student_number, invitation_code } = body;
  
  try {
    // 入力バリデーション
    if (!name || !password) {
      return c.json({ error: '名前とパスワードは必須です', success: false }, 400);
    }
    if (!email && !username) {
      return c.json({ error: 'メールアドレスまたはユーザー名のいずれかが必要です', success: false }, 400);
    }
    
    // パスワード強度チェック
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return c.json({ error: pwCheck.message, success: false }, 400);
    }
    
    // 🔒 招待コード検証（必須）
    if (!invitation_code) {
      return c.json({ error: '招待コードが必要です。管理者から招待コードを取得してください。', success: false }, 400);
    }
    
    const invite = await DB.prepare(`
      SELECT * FROM invitation_codes 
      WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).bind(invitation_code).first() as any;
    
    if (!invite) {
      return c.json({ error: '招待コードが無効または期限切れです', success: false }, 400);
    }
    
    // 使用回数チェック
    if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) {
      return c.json({ error: '招待コードの使用回数上限に達しました', success: false }, 400);
    }
    
    // ロール制限チェック（招待コードで許可されたロールのみ）
    const actualRole = role || invite.allowed_role || 'student';
    if (invite.allowed_role && invite.allowed_role !== actualRole) {
      return c.json({ error: `この招待コードは ${invite.allowed_role} ロール専用です`, success: false }, 400);
    }
    
    // 重複チェック
    const usernameToUse = username || email;
    const existing = await DB.prepare(
      'SELECT user_id FROM auth_users WHERE username = ? OR email = ?'
    ).bind(usernameToUse, email || '').first();
    
    if (existing) {
      return c.json({ error: 'このユーザー名またはメールアドレスは既に登録されています', success: false }, 409);
    }
    
    // パスワードハッシュ化
    const passwordHash = await hashPassword(password);
    const schoolId = school_id || class_code || invite.school_id || '';
    
    // 🔒 v4.0: メールアドレスをAES-256-GCMで暗号化して保存
    // email_hash: SHA-256ハッシュ（暗号化済みメールの検索用）
    let emailToStore = email || '';
    let emailHash = '';
    try {
      if (email) {
        // 検索用ハッシュ生成（平文emailのSHA-256）
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.toLowerCase().trim()));
        emailHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      if (emailToStore && c.env) {
        emailToStore = await encryptPII(emailToStore, c.env);
      }
    } catch (encErr) {
      console.warn('⚠️ PII暗号化スキップ（ENCRYPTION_KEY未設定の可能性）:', encErr);
    }
    
    // ユーザー作成
    const result = await DB.prepare(`
      INSERT INTO auth_users (username, email, email_hash, password_hash, full_name, user_role, school_id, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(usernameToUse, emailToStore, emailHash, passwordHash, name, actualRole, schoolId).run();
    
    const userId = result.meta.last_row_id;
    
    // 招待コードの使用回数を更新
    await DB.prepare(`
      UPDATE invitation_codes SET used_count = used_count + 1 WHERE id = ?
    `).bind(invite.id).run();
    
    // 招待コード使用履歴を記録
    try {
      await DB.prepare(`
        INSERT INTO invitation_code_usage (code_id, user_id, used_at) VALUES (?, ?, datetime('now'))
      `).bind(invite.id, userId).run();
    } catch {}
    
    // セッショントークン自動生成（登録直後にログイン状態にする）
    const sessionToken = generateSecureToken(32);
    const refreshToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN).toISOString();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN).toISOString();
    
    await DB.prepare(`
      INSERT INTO auth_sessions (user_id, session_token, refresh_token, expires_at, refresh_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userId, sessionToken, refreshToken, expiresAt, refreshExpiresAt).run();
    
    return c.json({
      success: true,
      session_token: sessionToken,
      refresh_token: refreshToken,
      token: sessionToken,
      user: {
        id: userId,
        user_id: userId,
        name,
        full_name: name,
        username: usernameToUse,
        email: email || '',  // レスポンスには平文を返す
        role: actualRole,
        user_type: actualRole,
        school_id: schoolId,
        class_code: schoolId
      },
      message: 'ユーザー登録が完了しました'
    }, 201);
    
  } catch (error: any) {
    console.error('統合ユーザー登録エラー:', error);
    return c.json({ success: false, error: 'ユーザー登録に失敗しました', details: error.message }, 500);
  }
}

// =============================================================================
// ログアウト
// =============================================================================
export async function logout(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const authHeader = c.req.header('Authorization');
  const sessionToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  
  // セッションに基づくトークンがあればDBから削除
  let bodyToken: string | undefined;
  try {
    const body = await c.req.json();
    bodyToken = body?.session_token;
  } catch {}
  
  const tokenToDelete = sessionToken || bodyToken;
  
  if (tokenToDelete) {
    try {
      await DB.prepare('DELETE FROM auth_sessions WHERE session_token = ?').bind(tokenToDelete).run();
    } catch {}
  }
  
  return c.json({ success: true, message: 'ログアウトしました' });
}

// =============================================================================
// リフレッシュトークン
// =============================================================================
export async function refreshSession(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const { refresh_token } = await c.req.json();
  
  if (!refresh_token) {
    return c.json({ success: false, error: 'リフレッシュトークンが必要です' }, 400);
  }
  
  try {
    const session = await DB.prepare(`
      SELECT s.session_id, u.user_id, u.username, u.full_name, u.email, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.refresh_token = ? AND s.refresh_expires_at > datetime('now') AND u.is_active = 1
    `).bind(refresh_token).first() as any;
    
    if (!session) {
      return c.json({ success: false, error: 'リフレッシュトークンが無効または期限切れです' }, 401);
    }
    
    // 新しいセッショントークン生成
    const newSessionToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN).toISOString();
    
    await DB.prepare(`
      UPDATE auth_sessions SET session_token = ?, expires_at = ? WHERE session_id = ?
    `).bind(newSessionToken, expiresAt, session.session_id).run();
    
    // 🔒 v4.0: 暗号化されたメールを復号
    let refreshEmail = session.email || '';
    try {
      if (refreshEmail && c.env) {
        refreshEmail = await decryptPII(refreshEmail, c.env);
      }
    } catch {}
    
    return c.json({
      success: true,
      session_token: newSessionToken,
      token: newSessionToken,
      expires_at: expiresAt,
      user: {
        id: session.user_id,
        user_id: session.user_id,
        name: session.full_name,
        full_name: session.full_name,
        username: session.username,
        email: refreshEmail,
        role: session.user_role,
        user_type: session.user_role,
        school_id: session.school_id,
        class_code: session.school_id
      }
    });
  } catch (error: any) {
    console.error('リフレッシュトークンエラー:', error);
    return c.json({ success: false, error: 'トークンのリフレッシュに失敗しました' }, 500);
  }
}

// =============================================================================
// 現在のユーザー情報取得
// =============================================================================
export async function getCurrentUser(c: Context) {
  const user = c.get('user') as AuthUser;
  if (!user) {
    return c.json({ error: '認証が必要です', success: false }, 401);
  }
  return c.json({ success: true, user });
}

// =============================================================================
// パスワード変更
// =============================================================================
export async function changePassword(c: Context) {
  const user = c.get('user') as AuthUser;
  if (!user) {
    return c.json({ error: '認証が必要です', success: false }, 401);
  }
  
  const { DB } = c.env as { DB: D1Database };
  const { current_password, new_password } = await c.req.json();
  
  if (!current_password || !new_password) {
    return c.json({ error: '現在のパスワードと新しいパスワードは必須です', success: false }, 400);
  }
  
  const pwCheck = validatePasswordStrength(new_password);
  if (!pwCheck.valid) {
    return c.json({ error: pwCheck.message, success: false }, 400);
  }
  
  // 現在のパスワード取得
  const userData = await DB.prepare(
    'SELECT password_hash FROM auth_users WHERE user_id = ?'
  ).bind(user.user_id).first() as any;
  
  if (!userData) {
    return c.json({ error: 'ユーザーが見つかりません', success: false }, 404);
  }
  
  // 現在のパスワード検証
  const isValid = await verifyPasswordUnified(current_password, userData.password_hash as string, {
    db: DB, userId: user.user_id
  });
  if (!isValid) {
    return c.json({ error: '現在のパスワードが正しくありません', success: false }, 401);
  }
  
  // 新しいパスワードハッシュ化
  const newHash = await hashPassword(new_password);
  await DB.prepare(
    'UPDATE auth_users SET password_hash = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
  ).bind(newHash, user.user_id).run();
  
  return c.json({ success: true, message: 'パスワードを変更しました' });
}

// =============================================================================
// セッション検証API（フロントエンド用）
// =============================================================================
export async function verifySession(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const body = await c.req.json();
  const sessionToken = body?.session_token;
  
  if (!sessionToken) {
    return c.json({ success: false, error: 'セッショントークンが必要です' }, 400);
  }
  
  try {
    const session = await DB.prepare(`
      SELECT u.user_id, u.username, u.full_name, u.email, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(sessionToken).first() as any;
    
    if (!session) {
      return c.json({ success: false, error: 'セッションが無効です' }, 401);
    }
    
    // 🔒 v4.0: 暗号化されたメールを復号
    let verifyEmail = session.email || '';
    try {
      if (verifyEmail && c.env) {
        verifyEmail = await decryptPII(verifyEmail, c.env);
      }
    } catch {}
    
    return c.json({
      success: true,
      user: {
        user_id: session.user_id,
        username: session.username,
        full_name: session.full_name,
        email: verifyEmail,
        role: session.user_role,
        school_id: session.school_id
      }
    });
  } catch (error: any) {
    console.error('セッション検証エラー:', error);
    return c.json({ success: false, error: 'セッション検証に失敗しました' }, 500);
  }
}

// =============================================================================
// 招待コード管理API
// =============================================================================

/**
 * 招待コード生成（admin のみ）
 */
export async function generateInvitationCode(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const user = c.get('user') as AuthUser;
  
  const body = await c.req.json();
  const { allowed_role, school_id, max_uses, expires_days, note } = body;
  
  // 招待コード生成（8文字の英数字）
  const code = generateSecureToken(4).toUpperCase().substring(0, 8);
  const expiresAt = expires_days
    ? new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000).toISOString()
    : null;
  
  try {
    const result = await DB.prepare(`
      INSERT INTO invitation_codes (code, created_by, allowed_role, school_id, max_uses, used_count, expires_at, is_active, note, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?, datetime('now'))
    `).bind(code, user.user_id, allowed_role || null, school_id || '', max_uses || 0, expiresAt, note || '').run();
    
    return c.json({
      success: true,
      invitation_code: code,
      id: result.meta.last_row_id,
      allowed_role: allowed_role || '全ロール',
      max_uses: max_uses || '無制限',
      expires_at: expiresAt || '無期限',
      note: note || ''
    }, 201);
  } catch (error: any) {
    console.error('招待コード生成エラー:', error);
    return c.json({ success: false, error: '招待コードの生成に失敗しました' }, 500);
  }
}

/**
 * 招待コード一覧取得（admin のみ）
 */
export async function listInvitationCodes(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  
  try {
    const codes = await DB.prepare(`
      SELECT ic.*, au.full_name as created_by_name
      FROM invitation_codes ic
      LEFT JOIN auth_users au ON ic.created_by = au.user_id
      ORDER BY ic.created_at DESC
    `).all();
    
    return c.json({
      success: true,
      codes: codes.results || []
    });
  } catch (error: any) {
    console.error('招待コード一覧取得エラー:', error);
    return c.json({ success: false, error: '招待コード一覧の取得に失敗しました' }, 500);
  }
}

/**
 * 招待コード無効化（admin のみ）
 */
export async function revokeInvitationCode(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const codeId = c.req.param('codeId');
  
  try {
    await DB.prepare('UPDATE invitation_codes SET is_active = 0 WHERE id = ?').bind(codeId).run();
    return c.json({ success: true, message: '招待コードを無効化しました' });
  } catch (error: any) {
    return c.json({ success: false, error: '招待コードの無効化に失敗しました' }, 500);
  }
}

// =============================================================================
// DB初期化: 招待コードテーブル
// =============================================================================
export async function initInvitationTables(db: D1Database) {
  // 招待コードテーブル
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS invitation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      created_by INTEGER,
      allowed_role TEXT,
      school_id TEXT DEFAULT '',
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      is_active INTEGER DEFAULT 1,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  // 招待コード使用履歴テーブル
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS invitation_code_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (code_id) REFERENCES invitation_codes(id),
      FOREIGN KEY (user_id) REFERENCES auth_users(user_id)
    )
  `).run();
  
  // auth_users にロック関連カラムを追加（存在しない場合）
  for (const col of [
    'failed_login_attempts INTEGER DEFAULT 0',
    'locked_until DATETIME',
    'last_login_at DATETIME',
    'email TEXT DEFAULT \'\'',
    'email_hash TEXT DEFAULT \'\''  // 🔒 v4.0: 暗号化メール検索用ハッシュ
  ]) {
    try {
      await db.prepare(`ALTER TABLE auth_users ADD COLUMN ${col}`).run();
    } catch {}
  }
  
  // email_hashインデックスを作成（暗号化メール検索の高速化）
  try {
    await db.prepare('CREATE INDEX IF NOT EXISTS idx_auth_users_email_hash ON auth_users(email_hash)').run();
  } catch {}
}
