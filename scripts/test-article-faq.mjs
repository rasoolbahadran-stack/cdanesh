#!/usr/bin/env node
/**
 * تست واحد تغییرات FAQ و رندر مقاله — src/lib/article-faq.ts و article-html.ts
 * اجرا: node scripts/test-article-faq.mjs
 * فیکسچر مقالهٔ واقعی (الگوی <section class="faq"> با متن پرسش لخت) درون‌خطی است
 * تا تست مستقل از محیط اجرا شود.
 */
let pass = 0, fail = 0;
const results = [];
function check(name, cond, extra = '') {
  (cond ? pass++ : fail++);
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : ' — ' + extra}`);
}

/* فیکسچر نمونهٔ واقعی: الگوی مقالهٔ «طراحی سایت اختصاصی…» در دیتابیس تولیدی */
const FIXTURE = `<div><article class="">
<h1>طراحی سایت اختصاصی چیست و چه زمانی به کدنویسی اختصاصی نیاز داریم؟</h1>
<p>بسیاری از کسب‌وکارها با یک سؤال مهم روبه‌رو می‌شوند: وردپرس یا کدنویسی اختصاصی؟</p>
<h2 id="c1">طراحی سایت اختصاصی چیست؟</h2>
<p>طراحی سایت اختصاصی یعنی ساخت وب‌سایتی که ظاهر، امکانات، ساختار داده و منطق عملکرد آن بر اساس نیازهای مشخص یک کسب‌وکار طراحی و توسعه داده می‌شود.</p>
<h2 id="c2">یک سایت اختصاصی چگونه طراحی و توسعه داده می‌شود؟</h2>
<p>فرایند توسعه معمولاً چند مرحله اصلی دارد.</p>
<h2 id="c3">سؤالات متداول</h2>
<section class="faq">
طراحی سایت اختصاصی چیست؟<div class="faq-answer"><p>سایت اختصاصی وب‌سایتی است که ظاهر، امکانات، ساختار داده و منطق عملکرد آن بر اساس نیازهای مشخص یک کسب‌وکار طراحی و توسعه داده می‌شود.</p></div>
آیا سایت اختصاصی از وردپرس بهتر است؟<div class="faq-answer"><p>خیر. انتخاب مناسب به نیاز، بودجه، زمان، پیچیدگی فرایندها و برنامه توسعه کسب‌وکار بستگی دارد.</p></div>
آیا طراحی سایت اختصاصی هزینه بیشتری دارد؟<div class="faq-answer"><p>در بسیاری از پروژه‌ها هزینه اولیه بیشتر است، زیرا تحلیل، طراحی و توسعه از ابتدا انجام می‌شود.</p></div>
آیا سایت اختصاصی برای سئو مناسب‌تر است؟<div class="faq-answer"><p>اختصاصی بودن به‌تنهایی مزیت سئویی ایجاد نمی‌کند. ساختار فنی، محتوا، سرعت و قابلیت خزش اهمیت دارند.</p></div>
آیا می‌توان بخشی از سایت وردپرسی را اختصاصی توسعه داد؟<div class="faq-answer"><p>بله. می‌توان امکاناتی مانند پنل مشتری یا اتصال به API را به‌صورت اختصاصی اضافه کرد.</p></div>
برای فروشگاه اینترنتی پوشاک وردپرس مناسب است یا سایت اختصاصی؟<div class="faq-answer"><p>اگر امکانات فروشگاه معمولی باشد وردپرس می‌تواند مناسب باشد؛ برای فرایندهای سفارشی بررسی شود.</p></div>
</section>
</article></div>`;

/* باندل ماژول‌های TS با esbuild به ESM برای اجرای مستقیم */
import { build } from '/home/z/my-project/cdanesh/node_modules/esbuild/lib/main.js';
let extractArticleFaq, renderArticleHtml;
await build({
  entryPoints: ['/home/z/my-project/cdanesh/src/lib/article-faq.ts'],
  bundle: true, format: 'esm', outfile: '/tmp/article-faq.mjs', platform: 'node', external: [],
});
await build({
  entryPoints: ['/home/z/my-project/cdanesh/src/lib/article-html.ts'],
  bundle: true, format: 'esm', outfile: '/tmp/article-html.mjs', platform: 'node',
});

const faqMod = await import('/tmp/article-faq.mjs');
extractArticleFaq = faqMod.extractArticleFaq;
const htmlMod = await import('/tmp/article-html.mjs');
renderArticleHtml = htmlMod.renderArticleHtml;

/* ─── ۱) fixture واقعی مقاله ۲ (سند legacy با section.faq) ─── */
{
  const blocks = [{ t: 'html', x: FIXTURE }];
  const res = extractArticleFaq(blocks);
  check('ART2: FAQ یافته شد', res.items.length === 6, `got ${res.items.length}`);
  check('ART2: heading استخراج شد', res.heading.includes('سؤالات متداول'), res.heading);
  check('ART2: اولین پرسش درست', res.items[0]?.q === 'طراحی سایت اختصاصی چیست؟', res.items[0]?.q);
  check('ART2: پاسخ اول کامل', (res.items[0]?.a || '').includes('بر اساس نیازهای مشخص'), res.items[0]?.a?.slice(0, 40));
  check('ART2: آخرین پرسش درست', (res.items[5]?.q || '').includes('پوشاک وردپرس'), res.items[5]?.q);
  const html = res.blocks[0].x;
  check('ART2: section.faq حذف شد', !html.includes('class="faq"'));
  check('ART2: بدنه مقاله باقی است', html.includes('طراحی سایت اختصاصی یعنی ساخت') && html.length > 300, `len=${html.length}`);
  check('ART2: تیترهای اصلی حذف نشدند', (html.match(/<h2/g) || []).length >= 2, (html.match(/<h2/g) || []).length);
}

/* ─── ۲) بلوک‌های ساختاریافته (الگوی مقاله فروشگاه لباس) ─── */
{
  const blocks = [
    { t: 'p', x: 'مقدمه مقاله' },
    { t: 'h2', x: 'سؤالات متداول' },
    { t: 'h3', x: 'سؤال یک؟' },
    { t: 'p', x: 'پاسخ یک' },
    { t: 'h3', x: 'سؤال دو؟' },
    { t: 'p', x: 'پاسخ دو' },
    { t: 'h2', x: 'جمع‌بندی' },
    { t: 'p', x: 'متن جمع‌بندی' },
  ];
  const res = extractArticleFaq(blocks);
  check('structured: ۲ پرسش', res.items.length === 2, `got ${res.items.length}`);
  check('structured: heading', res.heading === 'سؤالات متداول', res.heading);
  check('structured: FAQ از بلوک‌ها حذف شد', res.blocks.length === 3, `got ${res.blocks.length}`);
  check('structured: جمع‌بندی باقی است', res.blocks.some(b => b.t === 'h2' && b.x === 'جمع‌بندی'));
}

/* ─── ۳) مقاله بدون FAQ — دست‌نخورده ─── */
{
  const blocks = [{ t: 'p', x: 'پاراگراف' }, { t: 'h2', x: 'معرفی' }, { t: 'p', x: 'متن' }];
  const res = extractArticleFaq(blocks);
  check('no-faq: تغییری نکرد', res.items.length === 0 && res.blocks.length === 3);
}

/* ─── ۴) سند legacy با محتوا قبل از </head> (حالت تخریب ART1) ─── */
{
  const para = 'متن اصلی مقاله که به اشتباه قبل از بسته شدن head قرار گرفته است و باید بازیابی شود. ';
  const doc = `<!DOCTYPE html><html><head><title>x</title><meta charset="utf-8"><style>body{color:red}</style>
<h1>عنوان مقاله بوتیک</h1><p>${para.repeat(4)}</p>
<h2>بخش اول</h2><p>${'محتوای بخش اول به اندازه کافی طولانی است تا شمارش متن از حد عبور کند و فالت‌بک فعال شود به درستی. '.repeat(4)}</p>
<h2>سؤالات متداول</h2><section class="faq">
آیا فروشگاه بوتیک نیاز به درگاه پرداخت دارد؟<div class="faq-answer"><p>بله، برای فروش اینترنتی درگاه پرداخت لازم است.</p></div>
چقدر زمان می‌برد؟<div class="faq-answer"><p>بسته به امکانات، معمولاً دو تا شش هفته.</p></div>
</section>
</head><body></body></html>`;
  const out = renderArticleHtml(doc, { postTitle: 'عنوان متفاوت' });
  const text = out.replace(/<[^>]*>/g, ' ');
  check('legacy-before-head: بدنه بازیابی شد', text.includes('متن اصلی مقاله'), out.slice(0, 120));
  check('legacy-before-head: style حذف شد', !out.includes('color:red'));
  check('legacy-before-head: script-free', !/<script/i.test(out));
  const blocks = [{ t: 'html', x: out }];
  const res = extractArticleFaq(blocks);
  check('legacy-before-head: FAQ هم استخراج شد', res.items.length === 2, `got ${res.items.length}`);
}

/* ─── ۵) سند سالم — تغییر نکند (رفتار قبلی حفظ شود) ─── */
{
  const doc = `<html><head><title>t</title></head><body><h1>عنوان</h1><p>پاراگراف سالم مقاله با متن کافی برای سنجش. ${'متن نمونه '.repeat(60)}</p><script>alert(1)</script></body></html>`;
  const out = renderArticleHtml(doc, { postTitle: 'عنوان' });
  check('healthy-doc: محتوا رندر شد', out.includes('پاراگراف سالم مقاله'), out.slice(0, 100));
  check('healthy-doc: h1 تکراری حذف شد', !out.includes('<h1'));
  check('healthy-doc: script حذف شد', !/alert/.test(out));
}

/* ─── ۶) امن‌سازی: event handler و javascript: URL ─── */
{
  const doc = `<html><body><p>${'متن '.repeat(120)}</p><a href="javascript:alert(1)">لینک خطرناک</a><img src="x" onerror="alert(1)"></body></html>`;
  const out = renderArticleHtml(doc);
  check('sanitize: javascript: حذف شد', !out.includes('javascript:'));
  check('sanitize: onerror حذف شد', !out.includes('onerror'));
}

console.log('=== RESULTS ===');
for (const r of results) console.log(r);
console.log(`TOTAL: ${pass + fail} — PASS ${pass} — FAIL ${fail}`);
process.exit(fail > 0 ? 1 : 0);
