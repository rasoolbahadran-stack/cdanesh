/* ==========================================================================
   کافه‌دانش — اسکیمای دیتابیس (مایگریشن اولیه؛ کاملاً idempotent)
   هیچ جدول یا دادهٔ موجود حذف نمی‌شود؛ فقط ساخت‌های گم‌شده ساخته می‌شوند.
   ========================================================================== */
import { registerMigration } from './db';

registerMigration(`
-- کاربران (رمز عبور در متغیر محیطی ADMIN_PASSWORD_HASH نگهداری می‌شود)
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT 'مدیر کافه‌دانش',
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- صفحات سایت
CREATE TABLE IF NOT EXISTS pages (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  featured_image text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  system_key text UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- دسته‌بندی مقالات
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- مقالات مجله
CREATE TABLE IF NOT EXISTS posts (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  category_id integer REFERENCES categories(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  author text NOT NULL DEFAULT 'تیم کافه‌دانش',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured boolean NOT NULL DEFAULT false,
  reading_time integer NOT NULL DEFAULT 5,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category_id);

-- خدمات
CREATE TABLE IF NOT EXISTS services (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'spark',
  short_desc text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]',
  image text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- نمونه‌کارها
CREATE TABLE IF NOT EXISTS projects (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'شرکتی',
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  tags jsonb NOT NULL DEFAULT '[]',
  url text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- پلن‌های تعرفه
CREATE TABLE IF NOT EXISTS plans (
  id serial PRIMARY KEY,
  title text NOT NULL,
  badge text NOT NULL DEFAULT '',
  price text NOT NULL,
  price_note text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]',
  highlighted boolean NOT NULL DEFAULT false,
  cta_text text NOT NULL DEFAULT 'درخواست این پکیج',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- سؤالات متداول
CREATE TABLE IF NOT EXISTS faqs (
  id serial PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- نظرات مشتریان (فقط با دادهٔ واقعی پر می‌شود)
CREATE TABLE IF NOT EXISTS testimonials (
  id serial PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  content text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- پیام‌های تماس و درخواست مشاوره
CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'contact' CHECK (type IN ('contact','consult','plan')),
  plan_title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status, created_at DESC);

-- رسانه‌ها
CREATE TABLE IF NOT EXISTS media (
  id serial PRIMARY KEY,
  filename text NOT NULL,
  url text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL DEFAULT 0,
  alt text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- تنظیمات سایت (کلید/مقدار)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- گزارش فعالیت‌های مدیریت
CREATE TABLE IF NOT EXISTS activity (
  id serial PRIMARY KEY,
  type text NOT NULL,
  entity text NOT NULL DEFAULT '',
  entity_id integer,
  title text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_time ON activity (created_at DESC);
`);
