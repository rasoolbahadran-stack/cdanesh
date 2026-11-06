/* مایگریشن افزایشی برای فیلدهای نمایشی CMS نسخه جدید.
   ساختار اصلی جدول‌های posts / projects / messages حفظ می‌شود. */
import { registerMigration } from './db';

registerMigration(`
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS preview_webp text NOT NULL DEFAULT '';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS display_status text NOT NULL DEFAULT 'published';

UPDATE projects
   SET display_status = CASE WHEN status = 'published' THEN 'published' ELSE 'soon' END
 WHERE display_status = 'published' AND status = 'draft';
`);
