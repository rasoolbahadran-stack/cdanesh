/* مایگریشن افزایشی امکانات مدیریتی؛ هیچ داده‌ای حذف یا بازنویسی نمی‌شود. */
import { registerMigration } from './db';
registerMigration(
"CREATE TABLE IF NOT EXISTS error_reports (id bigserial PRIMARY KEY, trace_id text NOT NULL, source text NOT NULL DEFAULT 'browser', message text NOT NULL, path text NOT NULL DEFAULT '', severity text NOT NULL DEFAULT 'error', status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved')), created_at timestamptz NOT NULL DEFAULT now());\n"+
"CREATE INDEX IF NOT EXISTS error_reports_status_time_idx ON error_reports(status, created_at DESC);\n"+
"CREATE TABLE IF NOT EXISTS slug_redirects (id bigserial PRIMARY KEY, entity text NOT NULL, old_slug text NOT NULL, new_slug text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(entity, old_slug));\n"+
"CREATE INDEX IF NOT EXISTS slug_redirects_lookup_idx ON slug_redirects(entity, old_slug);\n"+
"CREATE TABLE IF NOT EXISTS content_revisions (id bigserial PRIMARY KEY, entity text NOT NULL, entity_id integer NOT NULL, snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());\n"+
"CREATE INDEX IF NOT EXISTS content_revisions_lookup_idx ON content_revisions(entity, entity_id, created_at DESC);"
);
