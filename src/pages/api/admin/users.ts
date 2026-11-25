/* مدیریت کاربران پنل — /api/admin/users
   ---------------------------------------------------------------------------
   فقط نقش admin (کنترل در میان‌افزار + دوباره در خودِ عملیات).
   عملیات: فهرست، ایجاد (رمز ≥۱۰ کاراکتر با bcrypt)، ویرایش نقش/فعال‌بودن/
   بازنشانی رمز، حذف (حساب خود مدیر یا آخرین admin فعال حذف نمی‌شود).
   بازنشانی رمز → pwd_version+1 → نشست‌های آن کاربر باطل می‌شود و
   must_change_password=1 تا در ورود بعدی رمز تازه را خودش بگذارد.
   هش رمزها هرگز در پاسخ برنمی‌گردد.
   --------------------------------------------------------------------------- */
import type { APIRoute } from 'astro';
import { ok, fail, unauthorized, serverError, readJson, str } from '../../../lib/http';
import { sessionFromCookies, hashPassword } from '../../../lib/auth';
import { q, q1 } from '../../../lib/db';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

function isAdmin(request: Request): boolean {
  const s = sessionFromCookies(request.headers.get('cookie') || '');
  return !!s && s.role === 'admin';
}

const PASSWORD_POLICY = 'رمز باید حداقل ۱۰ کاراکتر و ترکیبی از حروف و اعداد باشد';

function validatePassword(pw: string): string | null {
  if (pw.length < 10) return PASSWORD_POLICY;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(pw)).length;
  if (classes < 2) return PASSWORD_POLICY;
  return null;
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return unauthorized();
  try {
    const rows = await q(
      'SELECT id, username, display_name, role, is_active, must_change_password, last_login_at, created_at FROM users ORDER BY id ASC',
    );
    return ok(rows.map((r) => ({ ...r, password_hash: undefined })));
  } catch (e) {
    return serverError(e);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return unauthorized();
  try {
    const body = await readJson(request) as Record<string, unknown>;
    const username = str(body.username, 64).trim();
    const displayName = str(body.display_name, 120).trim() || username;
    const password = str(body.password, 128);
    const role = ['admin', 'editor'].includes(String(body.role)) ? String(body.role) : 'editor';
    if (username.length < 3) return fail('نام کاربری باید حداقل ۳ کاراکتر باشد', 'VALIDATION');
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) return fail('نام کاربری فقط می‌تواند شامل حروف لاتین، عدد، نقطه، خط تیره و زیرخط باشد', 'VALIDATION');
    const pwErr = validatePassword(password);
    if (pwErr) return fail(pwErr, 'WEAK');
    const dupe = await q1('SELECT id FROM users WHERE username = $1', [username]);
    if (dupe) return fail('این نام کاربری قبلاً ثبت شده است', 'DUPLICATE');
    const hash = await hashPassword(password);
    const row = await q1<{ id: number }>(
      'INSERT INTO users (username, display_name, role, password_hash, must_change_password) VALUES ($1,$2,$3,$4,1) RETURNING id',
      [username, displayName, role, hash],
    );
    await logActivity('create', 'users', Number(row?.id || 0), `کاربر «${username}» با نقش ${role === 'admin' ? 'مدیر' : 'ویراستار'} ایجاد شد`);
    return ok({ id: row?.id }, 'کاربر ایجاد شد');
  } catch (e) {
    return serverError(e);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return unauthorized();
  try {
    const body = await readJson(request) as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return fail('شناسه کاربر معتبر نیست', 'BAD_ID');
    const target = await q1<{ id: number; username: string; role: string; is_active: number | boolean }>(
      'SELECT id, username, role, is_active FROM users WHERE id = $1', [id],
    );
    if (!target) return fail('کاربر پیدا نشد', 'NOT_FOUND');

    if (body.password !== undefined && body.password !== '') {
      const pw = str(body.password, 128);
      const pwErr = validatePassword(pw);
      if (pwErr) return fail(pwErr, 'WEAK');
      const hash = await hashPassword(pw);
      await q('UPDATE users SET password_hash = $1, must_change_password = 1, pwd_version = pwd_version + 1, updated_at = now() WHERE id = $2', [hash, id]);
      await logActivity('security', 'users', id, `رمز کاربر «${target.username}» توسط مدیر بازنشانی شد`);
      return ok({}, 'رمز کاربر بازنشانی شد؛ در ورود بعدی باید رمز تازه را تنظیم کند');
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    if (body.role !== undefined && ['admin', 'editor'].includes(String(body.role))) {
      if (String(body.role) !== 'admin' && target.role === 'admin') {
        const admins = await q<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role='admin' AND is_active = 1 AND id <> $1", [id]);
        if (Number(admins[0]?.c || 0) === 0) return fail('حذف آخرین مدیر فعال مجاز نیست؛ ابتدا یک مدیر دیگر بسازید', 'LAST_ADMIN', 409);
      }
      values.push(String(body.role)); updates.push(`role = $${values.length}`);
    }
    if (body.is_active !== undefined) {
      const active = body.is_active === true || body.is_active === 1 || body.is_active === 'true' ? 1 : 0;
      if (!active && (target.role === 'admin' && (target.is_active === 1 || target.is_active === true))) {
        const admins = await q<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role='admin' AND is_active = 1 AND id <> $1", [id]);
        if (Number(admins[0]?.c || 0) === 0) return fail('غیرفعال‌کردن آخرین مدیر فعال مجاز نیست', 'LAST_ADMIN', 409);
      }
      values.push(active); updates.push(`is_active = $${values.length}`);
      if (!active) {
        // ابطال نشست‌های کاربر غیرفعال‌شده
        await q('UPDATE users SET pwd_version = pwd_version + 1 WHERE id = $1', [id]);
      }
    }
    if (body.display_name !== undefined) {
      values.push(str(body.display_name, 120)); updates.push(`display_name = $${values.length}`);
    }
    if (!updates.length) return fail('تغییری ارسال نشده است', 'EMPTY');
    values.push(id);
    await q(`UPDATE users SET ${updates.join(', ')}, updated_at = now() WHERE id = $${values.length}`, values);
    await logActivity('update', 'users', id, `اطلاعات کاربر «${target.username}» به‌روزرسانی شد`);
    return ok({}, 'تغییرات ذخیره شد');
  } catch (e) {
    return serverError(e);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = sessionFromCookies(request.headers.get('cookie') || '');
  if (!session || session.role !== 'admin') return unauthorized();
  try {
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) return fail('شناسه کاربر معتبر نیست', 'BAD_ID');
    if (id === session.uid) return fail('حذف حساب خودتان مجاز نیست', 'SELF_DELETE', 409);
    const target = await q1<{ id: number; username: string; role: string; is_active: number | boolean }>(
      'SELECT id, username, role, is_active FROM users WHERE id = $1', [id],
    );
    if (!target) return fail('کاربر پیدا نشد', 'NOT_FOUND');
    if (target.role === 'admin' && (target.is_active === 1 || target.is_active === true)) {
      const admins = await q<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role='admin' AND is_active = 1 AND id <> $1", [id]);
      if (Number(admins[0]?.c || 0) === 0) return fail('حذف آخرین مدیر فعال مجاز نیست', 'LAST_ADMIN', 409);
    }
    await q('DELETE FROM users WHERE id = $1', [id]);
    await logActivity('delete', 'users', id, `کاربر «${target.username}» حذف شد`);
    return ok({}, 'کاربر حذف شد');
  } catch (e) {
    return serverError(e);
  }
};
