/* ذخیره پیام‌های عمومی فرم‌ها (تماس/مشاوره/پلن) — اعتبارسنجی سمت سرور + ثبت واقعی در دیتابیس */
import { q1 } from './db';
import { ok, fail, readJson, str, EMAIL_RE } from './http';
import { logActivity } from './seed';

type Kind = 'contact' | 'consult' | 'plan';

export async function savePublicMessage(request: Request, kind: Kind): Promise<Response> {
  try {
    const body = await readJson(request);
    const name = str(body.name, 120);
    const phone = str(body.phone, 30).replace(/\s|-/g, '');
    const email = str(body.email, 200);
    const company = str(body.company, 120);
    const planTitle = str(body.plan_title, 150);
    const message = str(body.message, 3000);

    /* اعتبارسنجی سمت سرور */
    if (!name || name.length < 2) return fail('نام را کامل بنویسید', 'VALIDATION');
    if (!/^0\d{9,10}$/.test(phone)) return fail('شماره موبایل معتبر وارد کنید (مثل 09123456789)', 'VALIDATION');
    if (email && !EMAIL_RE.test(email)) return fail('ایمیل معتبر نیست', 'VALIDATION');
    if (!message || message.length < 10) return fail('متن پیام حداقل ۱۰ کاراکتر باشد', 'VALIDATION');

    const row = await q1(
      `INSERT INTO messages (name, email, phone, company, type, plan_title, message) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [name, email, phone, company, kind, planTitle, message],
    );
    if (!row) return fail('ذخیره پیام ناموفق بود؛ دوباره تلاش کنید', 'INSERT_FAIL', 500);

    await logActivity(kind, 'messages', Number(row.id), `پیام جدید از ${name}`);

    return ok(
      { id: row.id },
      kind === 'consult'
        ? 'درخواست مشاوره شما ثبت شد؛ در ساعات کاری برای هماهنگی جلسه تماس می‌گیریم.'
        : 'پیام شما با موفقیت ثبت شد؛ به‌زودی پاسخ می‌دهیم.',
    );
  } catch (e) {
    console.error('[messages]', e);
    return fail('خطای غیرمنتظره در ثبت پیام؛ دوباره تلاش کنید', 'SERVER_ERROR', 500);
  }
}
