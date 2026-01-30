/**
 * 認証・認可システム
 * JWT + Role-Based Access Control (RBAC)
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
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'; // 本番環境では環境変数に
const JWT_EXPIRES_IN = 60 * 60 * 24 * 7; // 7日間

// パスワードハッシュ化（本番環境ではbcrypt等を使用）
async function hashPassword(password: string): Promise<string> {
  // Cloudflare Workers環境ではWeb Crypto APIを使用
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
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
 */
export async function generateToken(user: {
  user_id: number;
  user_type: 'student' | 'teacher' | 'parent' | 'admin';
  role: string;
  email: string;
  name: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    ...user,
    iat: now,
    exp: now + JWT_EXPIRES_IN
  };
  
  return await sign(payload, JWT_SECRET);
}

/**
 * JWTトークン検証
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET) as JWTPayload;
    
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
  
  const payload = await verifyToken(token);
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
  const token = await generateToken({
    user_id: student_id as number,
    user_type: 'student',
    role: 'student',
    email,
    name: student_name
  });
  
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
  
  // パスワード検証
  const isValid = await verifyPassword(password, user.password_hash as string);
  if (!isValid) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }
  
  // JWT生成
  const token = await generateToken({
    user_id: user.user_id as number,
    user_type: user_type as 'student' | 'teacher' | 'parent' | 'admin',
    role: user.role as string,
    email: user.email as string,
    name: user.name as string
  });
  
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
  
  // 現在のパスワード検証
  const isValid = await verifyPassword(current_password, userData.password_hash as string);
  if (!isValid) {
    return c.json({ error: 'Current password is incorrect' }, 401);
  }
  
  // 新しいパスワードハッシュ化
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
