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
  /* checkOrigin باید خاموش باشد: روی ورسل، بازسازی Origin از هدرهای x-forwarded
     با Origin واقعی مرورگر نمی‌خواند و همهٔ آپلودهای multipart (کتابخانه رسانه)
     را با خطای 403 «Cross-site POST form submissions are forbidden» می‌بندد.
     امنیت APIها با کوکی امضاشدهٔ HMAC + محدودیت نرخ خودمان تامین می‌شود. */
  security: { checkOrigin: false },
});
