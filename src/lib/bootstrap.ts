/* ==========================================================================
   کافه‌دانش — راه‌انداز یک‌بارِ فرایند (مایگریشن + بذرپاشی)
   در اولین درخواست هر فرایند اجرا می‌شود و پس از آن فقط از کش می‌رود.
   ========================================================================== */
import './schema'; // ثبت مایگریشن‌های پایه
import './schema-v2';
import './schema-v3'; // ثبت مایگریشن افزایشی (سئو، زمان‌بندی، گالری، پیام‌ها، رمز)
import { migrate } from './db';
import { runSeed } from './seed';
import { runContentPatch } from './seed/content-patch';
import { setDbPasswordHash } from './auth';
import { q1 } from './db';

const g = globalThis as unknown as { __cd_boot?: Promise<void> };

export function boot(): Promise<void> {
  if (!g.__cd_boot) {
    g.__cd_boot = (async () => {
      await migrate();
      await runSeed();
      // پچ محتوایی نسخه‌دار: به‌روزرسانی مقالات seed موجود در دیتابیس (idempotent)
      await runContentPatch().catch((e) => console.warn('[cdanesh] content patch skipped:', e));
      /* هش رمز مدیر ذخیره‌شده در دیتابیس (تغییر رمز از پنل) را در حافظه می‌آورد؛
         اگر خالی باشد، ADMIN_PASSWORD_HASH مرجع ورود می‌ماند. */
      try {
        const u = await q1<{ password_hash: string }>(
          `SELECT password_hash FROM users WHERE username = $1`,
          [process.env.ADMIN_USERNAME || 'admin'],
        );
        setDbPasswordHash(u?.password_hash || '');
      } catch { /* جدول users ممکن است هنوز ساخته نشده باشد؛ مشکلی ایجاد نمی‌کند */ }
      console.log('[cdanesh] database ready (migrate + seed)');
    })().catch((e) => {
      g.__cd_boot = undefined;
      throw e;
    });
  }
  return g.__cd_boot;
}
