/**
 * 個人情報暗号化ユーティリティ (AES-256-GCM)
 * 
 * Cloudflare Workers の Web Crypto API を使用。
 * 対象: メールアドレス、電話番号、保護者連絡先などの個人識別情報（PII）
 * 
 * 暗号化形式: "enc:v1:<iv_hex>:<ciphertext_hex>:<tag included in ciphertext>"
 * - AES-256-GCM: 認証付き暗号化（改ざん検知付き）
 * - IV: 12バイトのランダム値（毎回生成、同一平文でも異なる暗号文）
 * - 鍵: ENCRYPTION_KEY 環境変数（Cloudflare Secrets）から導出
 * 
 * SE米田氏指摘対応: 個人情報の暗号化（FB10）
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
export const PII_FIELDS = {
  AUTH_USERS: ['email'],         // auth_users テーブル
  STUDENTS: ['email'],           // students テーブル
  PARENTS: ['email', 'phone_number'], // parents テーブル
  TEACHERS: ['email'],           // teachers テーブル
};

/**
 * 暗号化マイグレーション: 既存の平文データを暗号化
 * 管理者が1回だけ実行（/api/admin/encrypt-pii）
 */
export async function migratePIIEncryption(db: D1Database, env: any): Promise<{
  tables: Record<string, number>;
  total: number;
  errors: string[];
}> {
  const result = { tables: {} as Record<string, number>, total: 0, errors: [] as string[] };
  
  // auth_users.email
  try {
    const users = await db.prepare(
      "SELECT user_id, email FROM auth_users WHERE email IS NOT NULL AND email != '' AND email NOT LIKE 'enc:%'"
    ).all();
    let count = 0;
    for (const user of (users.results || []) as any[]) {
      try {
        const encrypted = await encryptPII(user.email, env);
        await db.prepare('UPDATE auth_users SET email = ? WHERE user_id = ?').bind(encrypted, user.user_id).run();
        count++;
      } catch (e: any) {
        result.errors.push(`auth_users#${user.user_id}: ${e.message}`);
      }
    }
    result.tables['auth_users'] = count;
    result.total += count;
  } catch (e: any) {
    result.errors.push(`auth_users: ${e.message}`);
  }
  
  // parents.email + phone_number
  try {
    const parents = await db.prepare(
      "SELECT parent_id, email, phone_number FROM parents WHERE (email IS NOT NULL AND email != '' AND email NOT LIKE 'enc:%') OR (phone_number IS NOT NULL AND phone_number != '' AND phone_number NOT LIKE 'enc:%')"
    ).all();
    let count = 0;
    for (const p of (parents.results || []) as any[]) {
      try {
        const encEmail = p.email ? await encryptPII(p.email, env) : p.email;
        const encPhone = p.phone_number ? await encryptPII(p.phone_number, env) : p.phone_number;
        await db.prepare('UPDATE parents SET email = ?, phone_number = ? WHERE parent_id = ?')
          .bind(encEmail, encPhone, p.parent_id).run();
        count++;
      } catch (e: any) {
        result.errors.push(`parents#${p.parent_id}: ${e.message}`);
      }
    }
    result.tables['parents'] = count;
    result.total += count;
  } catch (e: any) {
    result.errors.push(`parents: ${e.message}`);
  }
  
  return result;
}

/**
 * 暗号化キー生成ヘルパー（初回セットアップ用）
 */
export function generateEncryptionKey(): string {
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  return Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
