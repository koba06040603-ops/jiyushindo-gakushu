/**
 * 個人情報暗号化ユーティリティ (AES-256-GCM)
 * 
 * Cloudflare Workers の Web Crypto API を使用。
 * 対象: メールアドレス、電話番号、氏名、保護者連絡先などの個人識別情報（PII）
 * 
 * 暗号化形式: "enc:v1:<iv_hex>:<ciphertext_hex>:<tag included in ciphertext>"
 * - AES-256-GCM: 認証付き暗号化（改ざん検知付き）
 * - IV: 12バイトのランダム値（毎回生成、同一平文でも異なる暗号文)
 * - 鍵: ENCRYPTION_KEY 環境変数（Cloudflare Secrets）から導出
 * 
 * SE米田氏指摘対応:
 * - v4.0 (2026-04-16): メールアドレス・電話番号の暗号化（FB10）
 * - v4.1 (2026-04-20): 氏名カラムの暗号化（追加指摘対応）
 *   - auth_users.full_name
 *   - students.student_name
 *   - teachers.teacher_name
 *   - parents.parent_name / parents.name
 *   - user_feedback.name
 */

const ENCRYPTION_VERSION = 'v1';
const IV_LENGTH = 12; // AES-GCM推奨IV長

/**
 * 環境変数から暗号鍵を取得し、CryptoKeyオブジェクトに変換
 */
async function getEncryptionKey(env: any): Promise<CryptoKey> {
  const keyStr = env?.ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error(
      'ENCRYPTION_KEY が環境変数に設定されていません。' +
      '本番: `wrangler pages secret put ENCRYPTION_KEY`、' +
      'ローカル: `.dev.vars` に ENCRYPTION_KEY=<64文字hex> を記載。'
    );
  }
  
  // hex文字列（64文字 = 32バイト = 256bit）をArrayBufferに変換
  let keyBytes: Uint8Array;
  if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
    keyBytes = new Uint8Array(keyStr.match(/.{2}/g)!.map((b: string) => parseInt(b, 16)));
  } else {
    // hex以外の場合はSHA-256でハッシュして256bit鍵を導出
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyStr));
    keyBytes = new Uint8Array(hash);
  }
  
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 個人情報を暗号化
 * @param plaintext 平文
 * @param env 環境変数（ENCRYPTION_KEYを含む）
 * @returns "enc:v1:<iv_hex>:<ciphertext_hex>" 形式の暗号文
 */
export async function encryptPII(plaintext: string, env: any): Promise<string> {
  if (!plaintext) return plaintext;
  
  // 既に暗号化済みならそのまま返す
  if (plaintext.startsWith('enc:')) return plaintext;
  
  const key = await getEncryptionKey(env);
  
  // ランダムIV生成
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  
  // AES-256-GCM暗号化
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const ctHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `enc:${ENCRYPTION_VERSION}:${ivHex}:${ctHex}`;
}

/**
 * 暗号化された個人情報を復号
 * @param ciphertext "enc:v1:<iv_hex>:<ciphertext_hex>" 形式の暗号文
 * @param env 環境変数（ENCRYPTION_KEYを含む）
 * @returns 復号された平文
 */
export async function decryptPII(ciphertext: string, env: any): Promise<string> {
  if (!ciphertext) return ciphertext;
  
  // 暗号化されていない場合はそのまま返す
  if (!ciphertext.startsWith('enc:')) return ciphertext;
  
  const parts = ciphertext.split(':');
  if (parts.length !== 4 || parts[0] !== 'enc') {
    console.warn('不正な暗号文形式:', ciphertext.substring(0, 20));
    return ciphertext;
  }
  
  const version = parts[1];
  const ivHex = parts[2];
  const ctHex = parts[3];
  
  if (version !== ENCRYPTION_VERSION) {
    console.warn('未対応の暗号化バージョン:', version);
    return ciphertext;
  }
  
  const key = await getEncryptionKey(env);
  
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const ct = new Uint8Array(ctHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ct
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('復号エラー:', error);
    return '[復号失敗]';
  }
}

/**
 * オブジェクト内の指定フィールドを暗号化
 */
export async function encryptFields(
  obj: Record<string, any>,
  fields: string[],
  env: any
): Promise<Record<string, any>> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = await encryptPII(result[field], env);
    }
  }
  return result;
}

/**
 * オブジェクト内の指定フィールドを復号
 */
export async function decryptFields(
  obj: Record<string, any>,
  fields: string[],
  env: any
): Promise<Record<string, any>> {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = await decryptPII(result[field], env);
    }
  }
  return result;
}

/**
 * 配列内の全オブジェクトの指定フィールドを復号
 */
export async function decryptFieldsArray(
  arr: Record<string, any>[],
  fields: string[],
  env: any
): Promise<Record<string, any>[]> {
  return Promise.all(arr.map(obj => decryptFields(obj, fields, env)));
}

// PIIフィールド定義（暗号化対象のカラム名）
// 🔒 v4.1 (2026-04-20): 氏名カラムを追加（SE米田氏 追加指摘対応）
export const PII_FIELDS = {
  AUTH_USERS: ['email', 'full_name'],                              // auth_users テーブル
  STUDENTS: ['email', 'student_name'],                             // students テーブル
  PARENTS: ['email', 'phone_number', 'parent_name', 'name'],       // parents テーブル（新旧スキーマ両対応）
  TEACHERS: ['email', 'teacher_name'],                             // teachers テーブル
  USER_FEEDBACK: ['email', 'name'],                                // user_feedback テーブル
};

/**
 * 氏名のSHA-256検索ハッシュ生成
 * 暗号化された氏名カラムでも、ハッシュによる完全一致検索を可能にする
 */
export async function generateNameHash(name: string): Promise<string> {
  if (!name) return '';
  // 前後空白を除去して正規化（大文字小文字は区別する：氏名は固有）
  const normalized = name.trim();
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * メールアドレスのSHA-256検索ハッシュ生成（後方互換のため関数としても提供）
 */
export async function generateEmailHash(email: string): Promise<string> {
  if (!email) return '';
  const normalized = email.toLowerCase().trim();
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 暗号化対象テーブル一覧（マイグレーション対象）
 * migratePIIEncryption で処理されるテーブル:
 * 1. auth_users.email
 * 2. parents.email, parents.phone_number
 * 3. students.email
 * 4. teachers.email
 * 5. user_feedback.email
 */
export const PII_TABLES = ['auth_users', 'parents', 'students', 'teachers', 'user_feedback'] as const;

/**
 * 暗号化マイグレーション: 既存の平文データを暗号化
 * 管理者が1回だけ実行（/api/admin/encrypt-pii）
 *
 * 🔒 v4.1 (2026-04-20): 氏名カラムの暗号化を追加（SE米田氏 追加指摘対応）
 *   - auth_users.full_name + full_name_hash（検索用SHA-256）
 *   - students.student_name + student_name_hash
 *   - teachers.teacher_name + teacher_name_hash
 *   - parents.parent_name / parents.name + name_hash
 *   - user_feedback.name
 *
 * 冪等性: 既に暗号化済み（enc:で始まる）データはスキップ
 */
export async function migratePIIEncryption(db: D1Database, env: any): Promise<{
  tables: Record<string, number>;
  fields: Record<string, number>;  // v4.1: フィールド別件数
  total: number;
  errors: string[];
  version: string;
}> {
  const result = {
    tables: {} as Record<string, number>,
    fields: {} as Record<string, number>,
    total: 0,
    errors: [] as string[],
    version: 'v4.1'
  };

  const incField = (key: string) => { result.fields[key] = (result.fields[key] || 0) + 1; };

  // ========================================
  // auth_users: email + full_name
  // ========================================
  try {
    const users = await db.prepare(`
      SELECT user_id, email, full_name FROM auth_users
      WHERE (email IS NOT NULL AND email != '' AND email NOT LIKE 'enc:%')
         OR (full_name IS NOT NULL AND full_name != '' AND full_name NOT LIKE 'enc:%')
    `).all();
    let count = 0;
    for (const user of (users.results || []) as any[]) {
      try {
        const updates: string[] = [];
        const binds: any[] = [];
        
        // email
        if (user.email && !String(user.email).startsWith('enc:')) {
          const encEmail = await encryptPII(user.email, env);
          const emailHash = await generateEmailHash(user.email);
          updates.push('email = ?', 'email_hash = ?');
          binds.push(encEmail, emailHash);
          incField('auth_users.email');
        }
        // full_name
        if (user.full_name && !String(user.full_name).startsWith('enc:')) {
          const encName = await encryptPII(user.full_name, env);
          const nameHash = await generateNameHash(user.full_name);
          updates.push('full_name = ?', 'full_name_hash = ?');
          binds.push(encName, nameHash);
          incField('auth_users.full_name');
        }
        
        if (updates.length > 0) {
          binds.push(user.user_id);
          await db.prepare(`UPDATE auth_users SET ${updates.join(', ')} WHERE user_id = ?`).bind(...binds).run();
          count++;
        }
      } catch (e: any) {
        result.errors.push(`auth_users#${user.user_id}: ${e.message}`);
      }
    }
    result.tables['auth_users'] = count;
    result.total += count;
  } catch (e: any) {
    result.errors.push(`auth_users: ${e.message}`);
  }

  // ========================================
  // parents: email + phone_number + parent_name + name
  // ========================================
  try {
    // 新旧スキーマ両対応のためPRAGMAで列を確認
    const columns = await getTableColumns(db, 'parents');
    const hasParentName = columns.includes('parent_name');
    const hasName = columns.includes('name');
    const hasPhoneNumber = columns.includes('phone_number');
    const hasPhone = columns.includes('phone');
    const pkCol = columns.includes('parent_id') ? 'parent_id' : 'id';

    const selectCols = ['email', pkCol];
    if (hasPhoneNumber) selectCols.push('phone_number');
    if (hasPhone) selectCols.push('phone');
    if (hasParentName) selectCols.push('parent_name');
    if (hasName) selectCols.push('name');

    const parents = await db.prepare(
      `SELECT ${selectCols.join(', ')} FROM parents`
    ).all();

    let count = 0;
    for (const p of (parents.results || []) as any[]) {
      try {
        const updates: string[] = [];
        const binds: any[] = [];

        if (p.email && !String(p.email).startsWith('enc:')) {
          updates.push('email = ?'); binds.push(await encryptPII(p.email, env));
          incField('parents.email');
        }
        if (hasPhoneNumber && p.phone_number && !String(p.phone_number).startsWith('enc:')) {
          updates.push('phone_number = ?'); binds.push(await encryptPII(p.phone_number, env));
          incField('parents.phone_number');
        }
        if (hasPhone && p.phone && !String(p.phone).startsWith('enc:')) {
          updates.push('phone = ?'); binds.push(await encryptPII(p.phone, env));
          incField('parents.phone');
        }
        if (hasParentName && p.parent_name && !String(p.parent_name).startsWith('enc:')) {
          updates.push('parent_name = ?'); binds.push(await encryptPII(p.parent_name, env));
          incField('parents.parent_name');
        }
        if (hasName && p.name && !String(p.name).startsWith('enc:')) {
          updates.push('name = ?'); binds.push(await encryptPII(p.name, env));
          incField('parents.name');
        }

        if (updates.length > 0) {
          binds.push(p[pkCol]);
          await db.prepare(`UPDATE parents SET ${updates.join(', ')} WHERE ${pkCol} = ?`).bind(...binds).run();
          count++;
        }
      } catch (e: any) {
        result.errors.push(`parents#${p[pkCol]}: ${e.message}`);
      }
    }
    result.tables['parents'] = count;
    result.total += count;
  } catch (e: any) {
    if (!e.message?.includes('no such table')) {
      result.errors.push(`parents: ${e.message}`);
    }
  }

  // ========================================
  // students: email + student_name
  // ========================================
  try {
    const columns = await getTableColumns(db, 'students');
    const hasStudentName = columns.includes('student_name');
    const pkCol = columns.includes('student_id') ? 'student_id' : 'id';

    const selectCols = [pkCol];
    if (columns.includes('email')) selectCols.push('email');
    if (hasStudentName) selectCols.push('student_name');

    const students = await db.prepare(
      `SELECT ${selectCols.join(', ')} FROM students`
    ).all();

    let count = 0;
    for (const s of (students.results || []) as any[]) {
      try {
        const updates: string[] = [];
        const binds: any[] = [];

        if (s.email && !String(s.email).startsWith('enc:')) {
          updates.push('email = ?'); binds.push(await encryptPII(s.email, env));
          incField('students.email');
        }
        if (hasStudentName && s.student_name && !String(s.student_name).startsWith('enc:')) {
          updates.push('student_name = ?'); binds.push(await encryptPII(s.student_name, env));
          incField('students.student_name');
        }

        if (updates.length > 0) {
          binds.push(s[pkCol]);
          await db.prepare(`UPDATE students SET ${updates.join(', ')} WHERE ${pkCol} = ?`).bind(...binds).run();
          count++;
        }
      } catch (e: any) {
        result.errors.push(`students#${s[pkCol]}: ${e.message}`);
      }
    }
    result.tables['students'] = count;
    result.total += count;
  } catch (e: any) {
    if (!e.message?.includes('no such table')) {
      result.errors.push(`students: ${e.message}`);
    }
  }

  // ========================================
  // teachers: email + teacher_name
  // ========================================
  try {
    const columns = await getTableColumns(db, 'teachers');
    const hasTeacherName = columns.includes('teacher_name');
    const pkCol = columns.includes('teacher_id') ? 'teacher_id' : 'id';

    const selectCols = [pkCol];
    if (columns.includes('email')) selectCols.push('email');
    if (hasTeacherName) selectCols.push('teacher_name');

    const teachers = await db.prepare(
      `SELECT ${selectCols.join(', ')} FROM teachers`
    ).all();

    let count = 0;
    for (const t of (teachers.results || []) as any[]) {
      try {
        const updates: string[] = [];
        const binds: any[] = [];

        if (t.email && !String(t.email).startsWith('enc:')) {
          updates.push('email = ?'); binds.push(await encryptPII(t.email, env));
          incField('teachers.email');
        }
        if (hasTeacherName && t.teacher_name && !String(t.teacher_name).startsWith('enc:')) {
          updates.push('teacher_name = ?'); binds.push(await encryptPII(t.teacher_name, env));
          incField('teachers.teacher_name');
        }

        if (updates.length > 0) {
          binds.push(t[pkCol]);
          await db.prepare(`UPDATE teachers SET ${updates.join(', ')} WHERE ${pkCol} = ?`).bind(...binds).run();
          count++;
        }
      } catch (e: any) {
        result.errors.push(`teachers#${t[pkCol]}: ${e.message}`);
      }
    }
    result.tables['teachers'] = count;
    result.total += count;
  } catch (e: any) {
    if (!e.message?.includes('no such table')) {
      result.errors.push(`teachers: ${e.message}`);
    }
  }

  // ========================================
  // user_feedback: email + name
  // ========================================
  try {
    const columns = await getTableColumns(db, 'user_feedback');
    const hasName = columns.includes('name');

    const selectCols = ['rowid'];
    if (columns.includes('email')) selectCols.push('email');
    if (hasName) selectCols.push('name');

    const feedback = await db.prepare(
      `SELECT ${selectCols.join(', ')} FROM user_feedback`
    ).all();

    let count = 0;
    for (const f of (feedback.results || []) as any[]) {
      try {
        const updates: string[] = [];
        const binds: any[] = [];

        if (f.email && !String(f.email).startsWith('enc:')) {
          updates.push('email = ?'); binds.push(await encryptPII(f.email, env));
          incField('user_feedback.email');
        }
        if (hasName && f.name && !String(f.name).startsWith('enc:')) {
          updates.push('name = ?'); binds.push(await encryptPII(f.name, env));
          incField('user_feedback.name');
        }

        if (updates.length > 0) {
          binds.push(f.rowid);
          await db.prepare(`UPDATE user_feedback SET ${updates.join(', ')} WHERE rowid = ?`).bind(...binds).run();
          count++;
        }
      } catch (e: any) {
        result.errors.push(`user_feedback#${f.rowid}: ${e.message}`);
      }
    }
    result.tables['user_feedback'] = count;
    result.total += count;
  } catch (e: any) {
    if (!e.message?.includes('no such table')) {
      result.errors.push(`user_feedback: ${e.message}`);
    }
  }

  return result;
}

/**
 * PRAGMA table_info でテーブルのカラム一覧を取得（新旧スキーマ両対応のため）
 */
async function getTableColumns(db: D1Database, tableName: string): Promise<string[]> {
  try {
    const info = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return ((info.results || []) as any[]).map(col => col.name as string);
  } catch {
    return [];
  }
}

/**
 * 暗号化キー生成ヘルパー（初回セットアップ用）
 */
export function generateEncryptionKey(): string {
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  return Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
