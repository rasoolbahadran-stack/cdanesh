/* ==========================================================================
   کافه‌دانش — اسکیمای MySQL/MariaDB (وضعیت نهایی همهٔ مایگریشن‌ها)
   ---------------------------------------------------------------------------
   این فایل معادل MySQL تمام مایگریشن‌های PostgreSQL پروژه (schema، v2، v3، v4)
   به‌همراه جدول‌های امنیتی جدید (کاربران چندنفره، محدودیت تلاش ورود) است.
   در استقرار روی cPanel فقط همین مجموعه اجرا می‌شود و _migrations ردیابی می‌کند.
   پیش‌نیاز: MySQL 8.0.13+ یا MariaDB 10.4+ (پیش‌فرض عبارتی JSON).
   ========================================================================== */

interface MySQLMigration {
  name: string;
  sql: string;
}

const BASE = `
-- کاربران پنل (چندنفره با نقش) — رمز فقط به‌صورت هش
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  display_name VARCHAR(190) NOT NULL DEFAULT 'مدیر کافه‌دانش',
  role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','editor')),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  pwd_version INT UNSIGNED NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ثبت تلاش‌های ورود (محدودسازی Brute-Force در سمت سرور و دیتابیس)
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT '',
  ip VARCHAR(64) NOT NULL DEFAULT '',
  ok TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts_user (username, ok, created_at),
  INDEX idx_login_attempts_ip (ip, ok, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- صفحات سایت
CREATE TABLE IF NOT EXISTS pages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(190) UNIQUE NOT NULL,
  excerpt TEXT,
  content MEDIUMTEXT,
  featured_image VARCHAR(500) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  seo_title VARCHAR(255) NOT NULL DEFAULT '',
  seo_description TEXT,
  system_key VARCHAR(60) UNIQUE NULL,
  sort_order INT NOT NULL DEFAULT 0,
  canonical_url VARCHAR(300) NOT NULL DEFAULT '',
  og_title VARCHAR(255) NOT NULL DEFAULT '',
  og_description TEXT,
  og_image VARCHAR(500) NOT NULL DEFAULT '',
  noindex TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- دسته‌بندی مقالات
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  slug VARCHAR(190) UNIQUE NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- مقالات مجله
CREATE TABLE IF NOT EXISTS posts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(190) UNIQUE NOT NULL,
  excerpt TEXT,
  content MEDIUMTEXT,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  category_id INT UNSIGNED NULL,
  tags JSON NOT NULL DEFAULT (JSON_ARRAY()),
  author VARCHAR(190) NOT NULL DEFAULT 'تیم کافه‌دانش',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled')),
  featured TINYINT(1) NOT NULL DEFAULT 0,
  reading_time INT NOT NULL DEFAULT 5,
  seo_title VARCHAR(255) NOT NULL DEFAULT '',
  seo_description TEXT,
  canonical_url VARCHAR(300) NOT NULL DEFAULT '',
  og_title VARCHAR(255) NOT NULL DEFAULT '',
  og_description TEXT,
  og_image VARCHAR(500) NOT NULL DEFAULT '',
  noindex TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_posts_status (status, published_at),
  INDEX idx_posts_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- خدمات
CREATE TABLE IF NOT EXISTS services (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(190) UNIQUE NOT NULL,
  icon VARCHAR(60) NOT NULL DEFAULT 'spark',
  short_desc TEXT,
  content MEDIUMTEXT,
  features JSON NOT NULL DEFAULT (JSON_ARRAY()),
  image VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  seo_title VARCHAR(255) NOT NULL DEFAULT '',
  seo_description TEXT,
  canonical_url VARCHAR(300) NOT NULL DEFAULT '',
  og_title VARCHAR(255) NOT NULL DEFAULT '',
  og_description TEXT,
  og_image VARCHAR(500) NOT NULL DEFAULT '',
  noindex TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- نمونه‌کارها
CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(190) UNIQUE NOT NULL,
  category VARCHAR(120) NOT NULL DEFAULT 'شرکتی',
  summary TEXT,
  content MEDIUMTEXT,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  tags JSON NOT NULL DEFAULT (JSON_ARRAY()),
  gallery JSON NOT NULL DEFAULT (JSON_ARRAY()),
  url VARCHAR(500) NOT NULL DEFAULT '',
  note TEXT,
  preview_webp VARCHAR(500) NOT NULL DEFAULT '',
  display_status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (display_status IN ('published','soon')),
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  seo_title VARCHAR(255) NOT NULL DEFAULT '',
  seo_description TEXT,
  canonical_url VARCHAR(300) NOT NULL DEFAULT '',
  og_title VARCHAR(255) NOT NULL DEFAULT '',
  og_description TEXT,
  og_image VARCHAR(500) NOT NULL DEFAULT '',
  noindex TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- پلن‌های تعرفه
CREATE TABLE IF NOT EXISTS plans (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  badge VARCHAR(60) NOT NULL DEFAULT '',
  price VARCHAR(60) NOT NULL,
  price_note VARCHAR(190) NOT NULL DEFAULT '',
  description TEXT,
  features JSON NOT NULL DEFAULT (JSON_ARRAY()),
  highlighted TINYINT(1) NOT NULL DEFAULT 0,
  cta_text VARCHAR(190) NOT NULL DEFAULT 'درخواست این پکیج',
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- سؤالات متداول
CREATE TABLE IF NOT EXISTS faqs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  service_slug VARCHAR(190) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- نظرات مشتریان
CREATE TABLE IF NOT EXISTS testimonials (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  role VARCHAR(190) NOT NULL DEFAULT '',
  company VARCHAR(190) NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar VARCHAR(500) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- پیام‌های تماس و درخواست مشاوره
CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) NOT NULL DEFAULT '',
  phone VARCHAR(60) NOT NULL DEFAULT '',
  company VARCHAR(190) NOT NULL DEFAULT '',
  type VARCHAR(20) NOT NULL DEFAULT 'contact' CHECK (type IN ('contact','consult','plan')),
  plan_title VARCHAR(190) NOT NULL DEFAULT '',
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
  admin_note TEXT,
  starred TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- رسانه‌ها
CREATE TABLE IF NOT EXISTS media (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  size INT NOT NULL DEFAULT 0,
  alt VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- تنظیمات سایت (کلید/مقدار)
CREATE TABLE IF NOT EXISTS settings (
  \`key\` VARCHAR(100) PRIMARY KEY,
  \`value\` JSON NOT NULL DEFAULT (JSON_OBJECT()),
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- گزارش فعالیت‌های مدیریت
CREATE TABLE IF NOT EXISTS activity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(60) NOT NULL,
  entity VARCHAR(60) NOT NULL DEFAULT '',
  entity_id INT UNSIGNED NULL,
  title VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- گزارش خطاها
CREATE TABLE IF NOT EXISTS error_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  trace_id VARCHAR(60) NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'browser',
  message TEXT NOT NULL,
  path VARCHAR(500) NOT NULL DEFAULT '',
  severity VARCHAR(20) NOT NULL DEFAULT 'error',
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX error_reports_status_time_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ریدایرکت اسلاگ‌های قدیمی
CREATE TABLE IF NOT EXISTS slug_redirects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(60) NOT NULL,
  old_slug VARCHAR(190) NOT NULL,
  new_slug VARCHAR(190) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY slug_redirects_uniq (entity, old_slug),
  INDEX slug_redirects_lookup_idx (entity, old_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- تاریخچهٔ نسخهٔ محتوا
CREATE TABLE IF NOT EXISTS content_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(60) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  snapshot JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX content_revisions_lookup_idx (entity, entity_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- سطل زباله
CREATE TABLE IF NOT EXISTS cdanesh_admin_trash (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity VARCHAR(60) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  snapshot JSON NOT NULL,
  deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restored_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- سندهای JSON بک‌اند قدیمی (سازگاری endpoints قدیمی)
CREATE TABLE IF NOT EXISTS cd_docs (
  \`key\` VARCHAR(190) PRIMARY KEY,
  \`value\` JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cd_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  doc_key VARCHAR(190) NOT NULL,
  \`data\` JSON NOT NULL,
  saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX cd_revisions_doc_idx (doc_key, saved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const MYSQL_MIGRATIONS: MySQLMigration[] = [
  { name: 'my001_base', sql: BASE },
];
