import { defineConfig } from 'astro/config';

// https://astro.build/config
// format: 'directory' → هر صفحه در پوشهٔ خودش (blog/index.html) ساخته می‌شود؛
// نتیجه: آدرس‌ها بدون پسوند .html — مثلاً cdanesh.ir/blog
export default defineConfig({
  site: 'https://cdanesh.ir',
  build: { format: 'directory' },
  trailingSlash: 'ignore',
});
