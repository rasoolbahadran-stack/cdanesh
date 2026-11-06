-- ─────────────────────────────────────────────────────────────
-- کافه دانش — اسکیمای پیشنهادی Neon Postgres
-- نکته مهم: اگر دیتابیس فعلی کافه دانش ساختار متفاوتی دارد،
-- نام جداول/ستون‌ها را در src/lib/db.ts با دیتابیس موجود تطبیق دهید.
-- این اسکیما حداقلی و سازگار با کد این پروژه است.
-- ─────────────────────────────────────────────────────────────

-- مقالات مجله
CREATE TABLE IF NOT EXISTS posts (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT NOT NULL DEFAULT '',
  content       TEXT NOT NULL DEFAULT '',      -- HTML محتوای مقاله
  category      TEXT NOT NULL DEFAULT 'عمومی',
  cover         TEXT NOT NULL DEFAULT '',      -- مسیر تصویر شاخص
  read_minutes  INT  NOT NULL DEFAULT 6,
  published     BOOLEAN NOT NULL DEFAULT false,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published, published_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);

-- نمونه‌کارها
CREATE TABLE IF NOT EXISTS portfolio (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'سایت شرکتی',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  cover         TEXT NOT NULL DEFAULT '',
  preview_webp  TEXT NOT NULL DEFAULT '',      -- پیش‌نمایش تمام‌صفحه برای اسکرول هنگام hover
  live_url      TEXT NOT NULL DEFAULT '',      -- نسخهٔ زنده (در صورت انتشار)
  status        TEXT NOT NULL DEFAULT 'soon',  -- published | conceptual | soon
  sort_order    INT  NOT NULL DEFAULT 100,
  published     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_sort_idx ON portfolio (sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_slug_idx ON portfolio (slug);

-- پیام‌های فرم تماس و مشاوره
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  kind        TEXT NOT NULL DEFAULT 'contact',  -- contact | consult
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  service     TEXT NOT NULL DEFAULT '',
  message     TEXT NOT NULL DEFAULT '',
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages (created_at DESC);
