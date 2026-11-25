/* ==========================================================================
   کافه‌دانش — احراز هویت پنل مدیریت (نسخهٔ امن استقرار cPanel)
   ---------------------------------------------------------------------------
   • کاربران در دیتابیس (جدول users) با نقش admin/editor نگهداری می‌شوند؛
     رمزها با bcrypt (هزینهٔ 10) هش می‌شوند و هش SHA-256 قدیمی هم پذیرفته و
     در اولین ورود موفق به bcrypt ارتقا می‌یابد.
   • محدودسازی تلاش ورود در سمت سرور و دیتابیس: حداکثر ۳ تلاش ناموفق در
     بازهٔ ۱۵ دقیقه (به تفکیک نام کاربری و IP) → قفل ۱۵ دقیقه‌ای.
     شمارنده پس از ورود موفق بازنشانی می‌شود.
   • نشست: کوکی HttpOnly امضاشده با HMAC-SHA256 + شمارهٔ نسخهٔ رمز (vid)
     → تغییر رمز، همهٔ نشست‌های قبلی را بی‌اعتبار می‌کند.
   • ADMIN_PASSWORD_HASH (محیط) همچنان به‌عنوان مرجع راه‌اندازی اضطراری کار می‌کند.
   • پیام خطا هرگز مشخص نمی‌کند نام کاربری درست بوده یا رمز اشتباه.
   ========================================================================== */
import crypto from 'node:crypto';
import { q, q1 } from './db';

const COOKIE_NAME = 'cd_admin';
const SESSION_MS = 1000 * 60 * 60 * 12; // ۱۲ ساعت
const LOCK_WINDOW_MIN = 15;             // بازهٔ شمارش تلاش‌های ناموفق
const LOCK_MAX_FAILS = 3;               // سقف تلاش‌های ناموفق مجاز

export interface SessionPayload {
  u: string;
  uid: number;
  role: string;
  vid: number;
  mcp: boolean;
  exp: number;
}

/* ---------- هش رمز ---------- */
export function sha256(s: string): string {
  return crypto.createHash('sha256').update(String(s), 'utf-8').digest('hex');
}

/** هش امن bcrypt — فرم پایگاه‌داده: "$2a$…" یا "$2b$…" */
export async function hashPassword(plain: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(String(plain), 10);
}

/** تأیید رمز: bcrypt جدید یا SHA-256 قدیمی؛ با خروجی «نیاز به ارتقا» */
export async function verifyPassword(plain: string, stored: string): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  const v = String(stored || '');
  if (!v) return { ok: false, needsUpgrade: false };
  if (v.startsWith('$2a$') || v.startsWith('$2b$') || v.startsWith('$2y$')) {
    try {
      const bcrypt = await import('bcryptjs');
      return { ok: await bcrypt.compare(String(plain), v), needsUpgrade: false };
    } catch {
      return { ok: false, needsUpgrade: false };
    }
  }
  // هش‌های قدیمی SHA-256 (۶۴ کاراکتر هگز)
  if (/^[0-9a-f]{64}$/i.test(v)) {
    return { ok: sha256(plain) === v.toLowerCase(), needsUpgrade: true };
  }
  return { ok: false, needsUpgrade: false };
}

/* هش رمز پیکربندی‌شده در محیط: ADMIN_PASSWORD_HASH یا (سازگاری قدیم) ADMIN_PASSWORD */
export function configuredPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH || '';
  if (hash) return hash;
  const legacyPassword = process.env.ADMIN_PASSWORD || '';
  return legacyPassword ? sha256(legacyPassword) : '';
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || configuredPasswordHash() || 'cdanesh-dev-secret';
}

/* ---------- امضای نشست ---------- */
function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + mac;
}

function verify(token: string): SessionPayload | null {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 2) return null;
    const expect = crypto.createHmac('sha256', secret()).update(parts[0]).digest('base64url');
    const a = Buffer.from(parts[1]);
    const b = Buffer.from(expect);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8')) as SessionPayload;
      if (payload.exp && payload.exp < Date.now()) return null;
      return payload;
    }
  } catch {
    /* کوکی نامعتبر */
  }
  return null;
}

export function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  String(header || '')
    .split(';')
    .forEach((p) => {
      const i = p.indexOf('=');
      if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    });
  return out;
}

/* ---------- محدودسازی تلاش ورود (دیتابیس، سمت سرور) ---------- */
async function countRecentFails(column: 'username' | 'ip', value: string): Promise<number> {
  const rows = await q<{ c: number }>(
    `SELECT COUNT(*) AS c FROM login_attempts WHERE ok = 0 AND ${column} = $1 AND created_at > DATE_SUB(now(), INTERVAL ${LOCK_WINDOW_MIN} MINUTE)`,
    [value],
  );
  return Number(rows[0]?.c || 0);
}

async function isLoginLocked(username: string, ip: string): Promise<boolean> {
  try {
    const byUser = await countRecentFails('username', username);
    if (byUser >= LOCK_MAX_FAILS) return true;
    if (ip && ip !== 'local') {
      const byIp = await countRecentFails('ip', ip);
      if (byIp >= LOCK_MAX_FAILS) return true;
    }
    return false;
  } catch {
    return false; // جدول در دسترس نیست — ورود متوقف نشود
  }
}

async function recordAttempt(username: string, ip: string, ok: boolean): Promise<void> {
  try {
    await q('INSERT INTO login_attempts(username, ip, ok) VALUES($1,$2,$3)', [username.slice(0, 64), ip.slice(0, 64), ok]);
  } catch { /* ثبت تلاش نباید جریان ورود را بشکند */ }
}

async function resetAttempts(username: string, ip: string): Promise<void> {
  try {
    await q('DELETE FROM login_attempts WHERE (username = $1 OR ip = $2) AND ok = 0', [username, ip]);
  } catch { /* بی‌اثر */ }
}

/** پیام عمومی — هرگز تفاوت نام کاربری/رمز را لو نمی‌دهد */
const GENERIC_LOGIN_ERROR = 'نام کاربری یا رمز عبور نادرست است';

export interface LoginResult {
  ok: boolean;
  error?: string;
  message?: string;
  cookie?: string;
  user?: { uid: number; username: string; role: string; displayName: string; mustChangePassword: boolean };
}

export async function login(username: string, password: string, ip: string, secureRequest: boolean): Promise<LoginResult> {
  const u = String(username || '').trim();
  const p = String(password || '');
  if (u.length > 64 || p.length > 128) {
    return { ok: false, error: 'BAD_CREDENTIALS', message: GENERIC_LOGIN_ERROR };
  }

  // قفل ۱۵ دقیقه‌ای بر اساس نام کاربری و IP هم‌زمان
  if (await isLoginLocked(u, ip)) {
    await recordAttempt(u, ip, false);
    return {
      ok: false,
      error: 'LOGIN_LOCKED',
      message: `به‌دلیل تلاش‌های ناموفق مکرر، ورود موقتاً مسدود شده است. ${LOCK_WINDOW_MIN} دقیقهٔ دیگر دوباره تلاش کنید.`,
    };
  }

  // ۱) کاربر دیتابیس
  let matched: { uid: number; username: string; role: string; displayName: string; mustChangePassword: boolean; vid: number } | null = null;
  try {
    const row = await q1<{
      id: number; username: string; display_name: string; role: string;
      is_active: number | boolean; password_hash: string; must_change_password: number | boolean; pwd_version: number;
    }>('SELECT id, username, display_name, role, is_active, password_hash, must_change_password, pwd_version FROM users WHERE username = $1', [u]);
    if (row) {
      const active = row.is_active === 1 || row.is_active === true;
      if (!active) {
        await recordAttempt(u, ip, false);
        return { ok: false, error: 'BAD_CREDENTIALS', message: GENERIC_LOGIN_ERROR };
      }
      if (row.password_hash) {
        const verdict = await verifyPassword(p, row.password_hash);
        if (verdict.ok) {
          // ارتقای هش قدیمی SHA-256 به bcrypt
          if (verdict.needsUpgrade) {
            try {
              const upgraded = await hashPassword(p);
              await q('UPDATE users SET password_hash = $1, pwd_version = pwd_version + 1 WHERE id = $2', [upgraded, row.id]);
              row.pwd_version = row.pwd_version + 1;
            } catch { /* ارتقا اختیاری است */ }
          }
          matched = {
            uid: Number(row.id), username: row.username, role: String(row.role || 'editor'),
            displayName: String(row.display_name || ''), mustChangePassword: row.must_change_password === 1 || row.must_change_password === true,
            vid: Number(row.pwd_version || 1),
          };
        }
      }
    }
  } catch {
    /* جدول users هنوز ساخته نشده — به مرجع محیطی می‌رویم */
  }

  // ۲) مرجع اضطراری محیطی (اگر هیچ کاربر دیتابیسی مطابق نبود)
  if (!matched) {
    const envHash = configuredPasswordHash();
    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const dbHash = (globalThis as { __cd_admin_dbhash?: string }).__cd_admin_dbhash || '';
    const okUser = u === envUser;
    const okPass = dbHash ? sha256(p) === dbHash : envHash ? sha256(p) === envHash : false;
    if (okUser && okPass) {
      matched = { uid: 0, username: u, role: 'admin', displayName: 'مدیر کافه‌دانش', mustChangePassword: false, vid: 0 };
    }
  }

  if (!matched) {
    await recordAttempt(u, ip, false);
    return { ok: false, error: 'BAD_CREDENTIALS', message: GENERIC_LOGIN_ERROR };
  }

  await recordAttempt(u, ip, true);
  await resetAttempts(u, ip);
  if (matched.uid > 0) {
    try { await q('UPDATE users SET last_login_at = now() WHERE id = $1', [matched.uid]); } catch { /* بی‌اثر */ }
  }
  const cookie = issueSession(matched, secureRequest);
  return {
    ok: true,
    cookie: cookie.cookie,
    user: { uid: matched.uid, username: matched.username, role: matched.role, displayName: matched.displayName, mustChangePassword: matched.mustChangePassword },
  };
}

/* ساخت کوکی نشست — توسط login و تغییر رمز استفاده می‌شود */
export function issueSession(user: { uid: number; username: string; role: string; mustChangePassword?: boolean; vid?: number }, secureRequest: boolean): LoginResult {
  const payload: SessionPayload = {
    u: user.username,
    uid: user.uid,
    role: user.role || 'admin',
    vid: user.vid ?? 0,
    mcp: !!user.mustChangePassword,
    exp: Date.now() + SESSION_MS,
  };
  const token = sign(payload);
  const secure = secureRequest ? '; Secure' : '';
  return {
    ok: true,
    cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${SESSION_MS / 1000}`,
  };
}

/* تازه‌سازی نشست فعلی (پس از تغییر رمز یا ارتقای هش) */
export function refreshSession(session: { u: string; uid?: number; role: string; vid?: number }, secureRequest: boolean): string | null {
  const r = issueSession({ uid: session.uid ?? 0, username: session.u, role: session.role, vid: session.vid ?? 0, mustChangePassword: false }, secureRequest);
  return r.ok ? r.cookie || null : null;
}

/* هش رمز ذخیره‌شده در دیتابیس را برای مرجع اضطراری ثبت می‌کند (در boot خوانده می‌شود) */
export function setDbPasswordHash(hash: string): void {
  (globalThis as { __cd_admin_dbhash?: string }).__cd_admin_dbhash = hash || '';
}

export function sessionFromCookies(header: string): SessionPayload | null {
  const c = parseCookies(header)[COOKIE_NAME];
  if (!c) return null;
  const payload = verify(c);
  return payload || null;
}

export function logoutCookie(secureRequest: boolean): string {
  const secure = secureRequest ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}

export function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '');
  return proto === 'https';
}

/* ---------- محدودسازی سرعتی سبک در حافظه (لایهٔ اول؛ قفل اصلی در دیتابیس است) ---------- */
const attempts = new Map<string, { count: number; reset: number }>();

export function loginThrottle(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 60_000 });
    return { allowed: true };
  }
  rec.count += 1;
  if (rec.count > 12) {
    return { allowed: false, retryAfter: Math.ceil((rec.reset - now) / 1000) };
  }
  return { allowed: true };
}

export function clientIp(request: Request): string {
  /* روی cPanel تنها Apache محلی این هدر را می‌نویسد؛ اولین مقدار زنجیرهٔ
     x-forwarded-for آی‌پی واقعی کاربر است. در اجرای مستقیم مقدار local دارد. */
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  );
}
