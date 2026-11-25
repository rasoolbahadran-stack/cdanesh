/* ==========================================================================
   کافه‌دانش — مایگریشن افزایشی ۵ (امنیت حساب‌ها؛ برای Postgres/PGlite)
   ---------------------------------------------------------------------------
   معادل MySQL این تغییرات در schema-mysql.ts (my001_base) هست.
   • کاربران چندنفره با نقش: is_active، must_change_password، pwd_version، last_login_at
   • جدول ثبت تلاش‌های ورود برای محدودسازی Brute-Force در سمت سرور
   هیچ دادهٔ موجودی تغییر یا حذف نمی‌شود؛ فقط افزایشی است.
   ========================================================================== */
import { registerMigration } from './db';

registerMigration(`
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pwd_version integer NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE TABLE IF NOT EXISTS login_attempts (
  id bigserial PRIMARY KEY,
  username text NOT NULL DEFAULT '',
  ip text NOT NULL DEFAULT '',
  ok boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_user_idx ON login_attempts (username, ok, created_at);
CREATE INDEX IF NOT EXISTS login_attempts_ip_idx ON login_attempts (ip, ok, created_at);
`);
