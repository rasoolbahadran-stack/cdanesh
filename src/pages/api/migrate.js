// /api/migrate — مهاجرت یک‌کلیکی داده‌های قدیمی Blob → دیتابیس Postgres
// GET  → وضعیت اتصال‌ها و وضعیت هر سند در دو سمت (فقط مدیر)
// POST → اجرای مهاجرت (فقط مدیر)
export const prerender = false;
import handler from '../../../server/handlers/migrate.mjs';
import { endpoint } from '../../../server/lib/api-compat.mjs';
export const { GET, POST, PUT, DELETE } = endpoint(handler);
