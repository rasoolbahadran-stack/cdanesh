import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// ─────────────────────────────────────────────────────────────
// کافه دانش — پیکربندی Astro
// دو حالت بیلد:
//  ۱) npm run build         → پروژه کامل (Vercel + API + پنل مدیریت)
//  ۲) npm run build:static  → بیلد استاتیک عمومی (بدون admin/api) برای بازبینی
// متغیرهای محیطی:
//  SITE_URL                 → دامنه canonical (پیش‌فرض https://cdanesh.ir)
//  DATABASE_URL             → رشته اتصال Neon (در نبود آن، داده‌های محلی استفاده می‌شود)
//  STATIC_BUILD=1           → حالت استاتیک (توسط build:static تنظیم می‌شود)
// ─────────────────────────────────────────────────────────────

const siteUrl = process.env.SITE_URL || 'https://cdanesh.ir';
const isStatic = process.env.STATIC_BUILD === '1';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  trailingSlash: 'never',
  adapter: isStatic ? undefined : vercel(),
  outDir: process.env.OUT_DIR || 'dist',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
