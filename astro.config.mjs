import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
// format: 'directory' → هر صفحه در پوشهٔ خودش (blog/index.html) ساخته می‌شود؛
// نتیجه: آدرس‌ها بدون پسوند .html — مثلاً cdanesh.ir/blog
// adapter + output:'static' → همهٔ صفحات استاتیک prerender می‌شوند؛
// فقط صفحاتی که در ابتدای‌شان prerender=false دارند (مجله، مقاله، نقشهٔ سایت)
// سمت سرور رندر می‌شوند تا مقالات منتشرشدهٔ ابری همیشه و برای گوگل هم دیده شوند.
export default defineConfig({
  site: 'https://cdanesh.ir',
  output: 'static',
  adapter: vercel(),
  build: { format: 'directory' },
  trailingSlash: 'ignore',
});
