/* خروجی CSV پیام‌ها: /api/admin/messages-csv (فقط ادمین) */
import type { APIRoute } from 'astro';
import { q } from '../../../lib/db';
import { unauthorized, serverError } from '../../../lib/http';
import { sessionFromCookies } from '../../../lib/auth';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

const admin = (request: Request) => !!sessionFromCookies(request.headers.get('cookie') || '');

function csvCell(v: unknown): string {
  const s = String(v ?? '').replace(/\r?\n/g, ' ').replace(/"/g, '""');
  return `"${s.slice(0, 2000)}"`;
}

export const GET: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const rows = await q(
      'SELECT id, name, email, phone, company, type, plan_title, message, status, admin_note, starred, created_at FROM messages ORDER BY created_at DESC LIMIT 5000',
    );
    const header = ['شناسه', 'نام', 'ایمیل', 'تلفن', 'شرکت', 'نوع', 'پکیج', 'متن پیام', 'وضعیت', 'یادداشت مدیر', 'مهم', 'تاریخ'];
    const typeLabel: Record<string, string> = { contact: 'تماس', consult: 'مشاوره', plan: 'پکیج' };
    const statusLabel: Record<string, string> = { new: 'جدید', read: 'خوانده‌شده', replied: 'پاسخ‌داده', archived: 'بایگانی' };
    const lines = [header.map(csvCell).join(',')];
    for (const r of rows) {
      lines.push(
        [
          r.id,
          r.name,
          r.email,
          r.phone,
          r.company,
          typeLabel[String(r.type)] || r.type,
          r.plan_title,
          r.message,
          statusLabel[String(r.status)] || r.status,
          r.admin_note,
          r.starred ? 'بله' : 'خیر',
          r.created_at ? new Date(String(r.created_at)).toISOString().slice(0, 19).replace('T', ' ') : '',
        ]
          .map(csvCell)
          .join(','),
      );
    }
    /* BOM برای نمایش درست فارسی در Excel */
    const csv = '\ufeff' + lines.join('\r\n');
    await logActivity('export', 'messages', null, 'خروجی CSV پیام‌ها گرفته شد');
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="cdanesh-messages-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return serverError(e);
  }
};
