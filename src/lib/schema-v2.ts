/* ==========================================================================
   کافه‌دانش — مایگریشن دوم (فقط افزایشی؛ بدون حذف یا بازنویسی هیچ داده‌ای)
   ---------------------------------------------------------------------------
   • فیلدهای سئوی پیشرفته برای مقاله/صفحه/خدمت/نمونه‌کار:
     canonical_url، og_title، og_description، og_image، noindex
   • وضعیت «زمان‌بندی‌شده» برای مقالات (scheduled) + گالری تصاویر نمونه‌کار
   • یادداشت داخلی و ستارهٔ مهم برای پیام‌ها
   • اتصال سؤالات متداول به خدمت (service_slug اختیاری)
   • امکان تغییر رمز مدیر از پنل (users.password_hash — اگر خالی باشد،
     متغیر محیطی ADMIN_PASSWORD_HASH به‌عنوان مرجع باقی می‌ماند)
   همهٔ دستورها idempotent هستند و در صورت وجود ستون، تغییری اعمال نمی‌کنند.
   ========================================================================== */
import { registerMigration } from './db';

registerMigration(`
-- ستون‌های سئوی پیشرفته (افزایشی)
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS canonical_url text NOT NULL DEFAULT '';
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS og_title text NOT NULL DEFAULT '';
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS og_description text NOT NULL DEFAULT '';
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '';
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;

ALTER TABLE pages    ADD COLUMN IF NOT EXISTS canonical_url text NOT NULL DEFAULT '';
ALTER TABLE pages    ADD COLUMN IF NOT EXISTS og_title text NOT NULL DEFAULT '';
ALTER TABLE pages    ADD COLUMN IF NOT EXISTS og_description text NOT NULL DEFAULT '';
ALTER TABLE pages    ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '';
ALTER TABLE pages    ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;

ALTER TABLE services ADD COLUMN IF NOT EXISTS canonical_url text NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS og_title text NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS og_description text NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS canonical_url text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS og_title text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS og_description text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS og_image text NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;

-- گالری تصاویر نمونه‌کار
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]';

-- وضعیت زمان‌بندی‌شده برای مقالات (بدون دست‌زدن به دادهٔ موجود)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'published', 'scheduled'));

-- پیام‌ها: یادداشت داخلی مدیر + علامت مهم
ALTER TABLE messages ADD COLUMN IF NOT EXISTS admin_note text NOT NULL DEFAULT '';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS starred boolean NOT NULL DEFAULT false;

-- سؤالات متداول مرتبط با یک خدمت (اختیاری)
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS service_slug text NOT NULL DEFAULT '';

-- تغییر رمز مدیر از پنل: اگر password_hash در دیتابیس ست شده باشد
-- بر متغیر محیطی مقدم است؛ در غیر این صورت ADMIN_PASSWORD_HASH معتبر می‌ماند.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
`);
