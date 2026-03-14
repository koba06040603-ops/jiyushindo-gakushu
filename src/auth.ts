/**
 * 認証・認可システム
 * JWT + Role-Based Access Control (RBAC)
 * 
 * セキュリティ強化 (2026-03-14):
 * - JWT秘密鍵: ハードコード → 環境変数（Cloudflare Secrets）
 * - パスワードハッシュ: SHA-256 → PBKDF2-SHA-256（10万回反復）
 * - 既存SHA-256ハッシュとの後方互換性を維持（自動移行）
 * 
 * サポートするロール:
 * - student: 学生
 * - teacher: 教師
 * - parent: 保護者
 * - admin: 管理者
 */

import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// JWT設定
// ⚠️ 秘密鍵は環境変数から取得。ハードコードは禁止。
// 本番: `npx wrangler pages secret put JWT_SECRET` で設定
// ローカル: `.dev.vars` ファイルに `JWT_SECRET=xxxxxx` を記載
const JWT_EXPIRES_IN = 60 * 60 * 24 * 7; // 7日間

// フォールバック用の秘密鍵（環境変数未設定時の警告付き）
const FALLBACK_SECRET = 'INSECURE-FALLBACK-CHANGE-ME-IN-PRODUCTION';

function getJwtSecret(env: any): string {
  const secret = env?.JWT_SECRET;
  if (!secret) {
    console.warn(
      '⚠️ JWT_SECRET が環境変数に設定されていません。' +
      'フォールバック秘密鍵を使用中です。' +
      '本番環境では必ず `wrangler pages secret put JWT_SECRET` で設定してください。'
    );
    return FALLBACK_SECRET;
  }
  return secret;
}

// =============================================================================
// パスワードハッシュ（PBKDF2-SHA-256）
// =============================================================================
// PBKDF2: Password-Based Key Derivation Function 2
// - SHA-256を10万回繰り返すことで、ブルートフォース攻撃のコストを大幅に増加
// - ソルト（ランダム値）により、同じパスワードでも異なるハッシュを生成
// - Cloudflare Workers の Web Crypto API で動作（bcryptは非対応環境あり）
// =============================================================================

const PBKDF2_ITERATIONS = 100_000;  // 反復回数（NIST推奨: 10万回以上）
const PBKDF2_KEY_LENGTH = 32;       // 出力鍵長（256bit）
const SALT_LENGTH = 16;             // ソルト長（128bit）

/**
 * PBKDF2-SHA-256 でパスワードをハッシュ化
 * 出力形式: "pbkdf2:iterations:salt_hex:hash_hex"
 */
async function hashPassword(password: string): Promise<string> {
  // ランダムソルト生成
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  
  // パスワードをインポート
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // PBKDF2でハッシュ生成
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8 // ビット単位
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 形式: "pbkdf2:100000:salt:hash"
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * レガシーSHA-256ハッシュ生成（後方互換用、新規には使用しない）
 */
async function hashPasswordLegacySHA256(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
  
  // ソルトを復元
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // パスワードをインポート
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // PBKDF2でハッシュ生成
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );
  
  const actualHashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // タイミング攻撃対策: 定数時間比較
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
 * パスワード検証（PBKDF2 + レガシーSHA-256 自動判別）
 * - 新形式（pbkdf2:...）→ PBKDF2で検証
 * - 旧形式（64文字hex）→ SHA-256で検証、成功時にPBKDF2へ自動移行
 */
async function verifyPassword(
  password: string, 
  storedHash: string,
  options?: { db?: D1Database; tableName?: string; idField?: string; userId?: number }
): Promise<boolean> {
  // 新形式: PBKDF2
  if (storedHash.startsWith('pbkdf2:')) {
    return verifyPBKDF2(password, storedHash);
  }
  
  // 旧形式: SHA-256（64文字の16進数文字列）
  const legacyHash = await hashPasswordLegacySHA256(password);
  const isValid = timingSafeEqual(legacyHash, storedHash);
  
  // 検証成功時、PBKDF2に自動移行
  if (isValid && options?.db && options?.tableName && options?.idField && options?.userId) {
    try {
      const newHash = await hashPassword(password);
      await options.db.prepare(
        `UPDATE ${options.tableName} SET password_hash = ? WHERE ${options.idField} = ?`
      ).bind(newHash, options.userId).run();
      console.log(`🔒 パスワードハッシュをPBKDF2に自動移行: ${options.tableName}#${options.userId}`);
    } catch (e) {
      console.error('パスワードハッシュ移行エラー:', e);
      // 移行失敗しても認証自体は成功させる
    }
  }
  
  return isValid;
}

// JWTペイロード型定義
interface JWTPayload {
  user_id: number;
  user_type: 'student' | 'teacher' | 'parent' | 'admin';
  role: string;
  email: string;
  name: string;
  exp: number;
  iat: number;
}

/**
 * JWTトークン生成
 * @param user ユーザー情報
 * @param env 環境変数（JWT_SECRETを含む）
 */
export async function generateJwtToken(user: {
  user_id: number;
  user_type: 'student' | 'teacher' | 'parent' | 'admin';
  role: string;
  email: string;
  name: string;
}, env?: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    ...user,
    iat: now,
    exp: now + JWT_EXPIRES_IN
  };
  
  const secret = getJwtSecret(env);
  return await sign(payload, secret);
}

/**
 * JWTトークン検証
 * @param token JWTトークン
 * @param env 環境変数（JWT_SECRETを含む）
 */
export async function verifyToken(token: string, env?: any): Promise<JWTPayload | null> {
  try {
    const secret = getJwtSecret(env);
    const payload = await verify(token, secret) as JWTPayload;
    
    // 有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * 認証ミドルウェア
 */
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  // Authorization ヘッダーまたはCookieからトークンを取得
  let token: string | undefined;
  
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    token = getCookie(c, 'auth_token');
  }
  
  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  // 環境変数からJWT_SECRETを取得して検証
  const payload = await verifyToken(token, c.env);
  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
  
  // ユーザー情報をコンテキストに追加
  c.set('user', payload);
  
  await next();
}

/**
 * ロールベースアクセス制御ミドルウェア
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as JWTPayload | undefined;
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        error: 'Insufficient permissions',
        required_roles: allowedRoles,
        your_role: user.role
      }, 403);
    }
    
    await next();
  };
}

/**
 * ユーザータイプベースアクセス制御
 */
export function requireUserType(...allowedTypes: Array<'student' | 'teacher' | 'parent' | 'admin'>) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as JWTPayload | undefined;
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    if (!allowedTypes.includes(user.user_type)) {
      return c.json({ 
        error: 'Access denied for this user type',
        required_types: allowedTypes,
        your_type: user.user_type
      }, 403);
    }
    
    await next();
  };
}

/**
 * ユーザー登録（学生）
 */
export async function registerStudent(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const { student_name, email, password, grade_level } = await c.req.json();
  
  // バリデーション
  if (!student_name || !email || !password || !grade_level) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  if (grade_level < 1 || grade_level > 12) {
    return c.json({ error: 'Invalid grade level (1-12)' }, 400);
  }
  
  // メールアドレス重複チェック
  const existing = await DB.prepare(`
    SELECT student_id FROM students WHERE email = ?
  `).bind(email).first();
  
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }
  
  // パスワードハッシュ化
  const password_hash = await hashPassword(password);
  
  // ユーザー作成
  const result = await DB.prepare(`
    INSERT INTO students (student_name, email, password_hash, grade_level, role)
    VALUES (?, ?, ?, ?, 'student')
  `).bind(student_name, email, password_hash, grade_level).run();
  
  const student_id = result.meta.last_row_id;
  
  // JWT生成
  const token = await generateJwtToken({
    user_id: student_id as number,
    user_type: 'student',
    role: 'student',
    email,
    name: student_name
  }, c.env);
  
  // Cookieにトークンを設定
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: JWT_EXPIRES_IN
  });
  
  return c.json({
    success: true,
    user: {
      student_id,
      student_name,
      email,
      grade_level,
      role: 'student'
    },
    token
  }, 201);
}

/**
 * ユーザーログイン
 */
export async function login(c: Context) {
  const { DB } = c.env as { DB: D1Database };
  const { email, password, user_type } = await c.req.json();
  
  if (!email || !password || !user_type) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  let query: string;
  let userIdField: string;
  let nameField: string;
  
  // ユーザータイプに応じたテーブル選択
  switch (user_type) {
    case 'student':
      query = 'SELECT student_id as user_id, student_name as name, email, password_hash, role FROM students WHERE email = ?';
      userIdField = 'student_id';
      nameField = 'student_name';
      break;
    case 'teacher':
      query = 'SELECT teacher_id as user_id, teacher_name as name, email, password_hash, role FROM teachers WHERE email = ?';
      userIdField = 'teacher_id';
      nameField = 'teacher_name';
      break;
    case 'parent':
      query = 'SELECT parent_id as user_id, parent_name as name, email, password_hash, role FROM parents WHERE email = ?';
      userIdField = 'parent_id';
      nameField = 'parent_name';
      break;
    default:
      return c.json({ error: 'Invalid user type' }, 400);
  }
  
  const user = await DB.prepare(query).bind(email).first() as any;
  
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }
  
  // パスワード検証（PBKDF2 + レガシーSHA-256 自動判別・移行）
  let tableName = '';
  let idField = '';
  switch (user_type) {
    case 'student': tableName = 'students'; idField = 'student_id'; break;
    case 'teacher': tableName = 'teachers'; idField = 'teacher_id'; break;
    case 'parent': tableName = 'parents'; idField = 'parent_id'; break;
  }
  const isValid = await verifyPassword(password, user.password_hash as string, {
    db: DB, tableName, idField, userId: user.user_id as number
  });
  if (!isValid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }
  
  // JWT生成（環境変数のJWT_SECRETを使用）
  const token = await generateJwtToken({
    user_id: user.user_id as number,
    user_type: user_type as 'student' | 'teacher' | 'parent' | 'admin',
    role: user.role as string,
    email: user.email as string,
    name: user.name as string
  }, c.env);
  
  // Cookieにトークンを設定
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: JWT_EXPIRES_IN
  });
  
  return c.json({
    success: true,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      user_type,
      role: user.role
    },
    token
  });
}

/**
 * ユーザーログアウト
 */
export async function logout(c: Context) {
  deleteCookie(c, 'auth_token');
  return c.json({ success: true, message: 'Logged out successfully' });
}

/**
 * 現在のユーザー情報取得
 */
export async function getCurrentUser(c: Context) {
  const user = c.get('user') as JWTPayload;
  
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const { DB } = c.env as { DB: D1Database };
  let query: string;
  
  switch (user.user_type) {
    case 'student':
      query = `SELECT student_id as user_id, student_name as name, email, grade_level, role, is_active 
               FROM students WHERE student_id = ?`;
      break;
    case 'teacher':
      query = `SELECT teacher_id as user_id, teacher_name as name, email, specialization, role, is_active 
               FROM teachers WHERE teacher_id = ?`;
      break;
    case 'parent':
      query = `SELECT parent_id as user_id, parent_name as name, email, phone_number, role, is_active 
               FROM parents WHERE parent_id = ?`;
      break;
    default:
      return c.json({ error: 'Invalid user type' }, 400);
  }
  
  const userData = await DB.prepare(query).bind(user.user_id).first();
  
  if (!userData) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({
    success: true,
    user: {
      ...userData,
      user_type: user.user_type
    }
  });
}

/**
 * パスワード変更
 */
export async function changePassword(c: Context) {
  const user = c.get('user') as JWTPayload;
  
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const { DB } = c.env as { DB: D1Database };
  const { current_password, new_password } = await c.req.json();
  
  if (!current_password || !new_password) {
    return c.json({ error: 'Missing required fields' }, 400);
  }
  
  if (new_password.length < 8) {
    return c.json({ error: 'New password must be at least 8 characters' }, 400);
  }
  
  // 現在のパスワードハッシュ取得
  let query: string;
  let tableName: string;
  let idField: string;
  
  switch (user.user_type) {
    case 'student':
      tableName = 'students';
      idField = 'student_id';
      break;
    case 'teacher':
      tableName = 'teachers';
      idField = 'teacher_id';
      break;
    case 'parent':
      tableName = 'parents';
      idField = 'parent_id';
      break;
    default:
      return c.json({ error: 'Invalid user type' }, 400);
  }
  
  query = `SELECT password_hash FROM ${tableName} WHERE ${idField} = ?`;
  const userData = await DB.prepare(query).bind(user.user_id).first() as any;
  
  if (!userData) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  // 現在のパスワード検証（PBKDF2 + レガシーSHA-256 自動判別・移行）
  const isValid = await verifyPassword(current_password, userData.password_hash as string, {
    db: DB, tableName, idField, userId: user.user_id
  });
  if (!isValid) {
    return c.json({ error: 'Current password is incorrect' }, 401);
  }
  
  // 新しいパスワードハッシュ化（PBKDF2）
  const new_password_hash = await hashPassword(new_password);
  
  // パスワード更新
  await DB.prepare(`
    UPDATE ${tableName} 
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE ${idField} = ?
  `).bind(new_password_hash, user.user_id).run();
  
  return c.json({
    success: true,
    message: 'Password changed successfully'
  });
}
