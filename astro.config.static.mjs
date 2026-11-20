// ==========================================================================
// کافه دانش — پیکربندی «بیلد استاتیک»
// فقط صفحات عمومی به‌صورت HTML خالص ساخته می‌شوند (بدون API و پنل مدیریت).
// استفاده: npm run build:static  (اسکریپت مسیرهای سروری را موقتاً کنار می‌گذارد)
// ==========================================================================
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cdanesh.ir',
  output: 'static',
  trailingSlash: 'never',
  outDir: 'dist-static',
  build: {
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
  compressHTML: true,
});
