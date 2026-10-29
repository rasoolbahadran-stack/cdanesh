/**
 * Seed نسخه نهایی کافه‌دانش
 * - کاربر مدیر با رمز قوی (فقط خارج از سورس تحویل می‌شود)
 * - ۱۴ مقاله از داده تأییدشده استاتیک (بلوک‌های ساختاری + FAQ اختصاصی)
 * - ۶ نمونه‌کار با محتوای کامل صفحات جزئیات
 * - FAQ صفحات خدمات، تنظیمات برند، پکیج‌های پیش‌نویس (تا تأیید تعرفه)
 * اجرا: bun run prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import { randomBytes, scryptSync } from 'crypto'
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs'
import vm from 'vm'
import { blocksToSource } from '../src/lib/blocks'

const db = new PrismaClient()
const STATIC = '/home/z/my-project/download/cdanesh-static'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

// ─── بارگذاری داده‌های استاتیک با شبیه‌سازی window ──────────────
function loadStatic(file: string, varName: string): any {
  const ctx: any = { window: {} }
  vm.createContext(ctx)
  vm.runInContext(readFileSync(`${STATIC}/assets/js/data/${file}`, 'utf8'), ctx)
  return ctx.window[varName]
}

// ─── تبدیل مسیرها و لینک‌های قدیمی به مسیرهای Next.js ───────────
const LINK_MAP: Record<string, string> = {
  'index.html': '/',
  'web-design.html': '/services/web-design',
  'seo.html': '/services/seo',
  'ai-solutions.html': '/services/ai-solutions',
  'content-production.html': '/services/content-production',
  'speed-optimization.html': '/services/speed-optimization',
  'uiux.html': '/services/uiux',
  'e-commerce.html': '/services/e-commerce',
  'support.html': '/services/support',
  'services.html': '/services',
  'portfolio.html': '/portfolio',
  'blog.html': '/blog',
  'article.html?slug=': '/blog/',
  'about.html': '/about',
  'contact.html': '/contact',
  'request.html': '/request',
  'faq.html': '/faq',
  'privacy.html': '/privacy',
  'terms.html': '/terms',
}

function mapLink(link: string): string {
  if (!link) return link
  if (link.startsWith('article.html?slug=')) return '/blog/' + link.split('=')[1]
  if (LINK_MAP[link]) return LINK_MAP[link]
  if (link.endsWith('.html')) return '/' + link.replace('.html', '')
  return link
}

function fixBlocks(blocks: any[]): any[] {
  return blocks.map((b) => {
    if (b.img) return { img: { ...b.img, src: b.img.src.replace('assets/img/', '/img/') } }
    if (b.cta) return { cta: { ...b.cta, link: mapLink(b.cta.link) } }
    return b
  })
}

// ─── تاریخ میلادی از sort (قالب YYYYMMDD) ───────────────────────
function sortToDate(sort: number): Date {
  const s = String(sort)
  return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), 9, 0, 0)
}

async function main() {
  console.log('🌱 Seed کافه‌دانش — نسخه نهایی Next.js')

  // ─── ۱) کاربر مدیر (رمز قوی؛ در فایل خصوصی خارج از سورس) ──────
  const existingAdmin = await db.user.findUnique({ where: { username: 'admin' } })
  let admin = existingAdmin
  let generatedPass = ''
  if (!admin) {
    const envPass = process.env.ADMIN_PASSWORD
    generatedPass =
      envPass ||
      'Cd-' + randomBytes(9).toString('base64url').replace(/[-_]/g, 'x') + randomBytes(2).toString('hex') + '!7'
    admin = await db.user.create({
      data: {
        username: 'admin',
        name: 'رسول بهادران',
        role: 'ADMIN',
        passwordHash: hashPassword(generatedPass),
      },
    })
    const credPath = '/home/z/my-project/download/ADMIN-LOGIN-INFO.txt'
    const credText = [
      '═══════════════════════════════════════════════════',
      ' اطلاعات محرمانه ورود مدیر — کافه‌دانش',
      '═══════════════════════════════════════════════════',
      `تاریخ ایجاد: ${new Date().toISOString()}`,
      '',
      `آدرس ورود مدیر:  /admin/login`,
      `نام کاربری:      admin`,
      `رمز عبور:        ${generatedPass}`,
      '',
      'توصیه‌های امنیتی:',
      '· این فایل را در Git، سورس پروژه یا ZIP عمومی قرار ندهید.',
      '· پس از اولین ورود، از بخش «حساب کاربری» پنل، رمز را تغییر دهید.',
      '· ورود پس از ۵ تلاش ناموفق به مدت ۱۵ دقیقه قفل می‌شود.',
      '· رمز به‌صورت هش امن (scrypt) در دیتابیس ذخیره می‌شود؛ این متن تنها نسخه قابل نمایش است.',
      '',
    ].join('\n')
    writeFileSync(credPath, credText)
    console.log(`✓ مدیر ساخته شد — اطلاعات در ${credPath} (رمز: ${generatedPass})`)
  } else {
    console.log('✓ کاربر مدیر از قبل موجود است (رمز تغییر نکرد)')
  }

  // پاک‌سازی محتوای قبلی (Seed نسخه نهایی جایگزین همه می‌شود؛ کاربران حفظ می‌شوند)
  await db.articleTag.deleteMany()
  await db.articleRevision.deleteMany()
  await db.article.deleteMany()
  await db.tag.deleteMany()
  await db.category.deleteMany()
  await db.portfolioItem.deleteMany()
  await db.faq.deleteMany()

  // ─── ۲) دسته‌بندی‌ها ───────────────────────────────────────────
  const catDefs = [
    { name: 'طراحی و تجربه کاربری', slug: 'web-design', description: 'طراحی سایت، UI/UX، رابط کاربری و مسیر تبدیل بازدیدکننده به مشتری', sortOrder: 1 },
    { name: 'سئو', slug: 'seo', description: 'سئوی تکنیکال و محتوایی، معماری اطلاعات و رشد ارگانیک پایدار', sortOrder: 2 },
    { name: 'تولید محتوا', slug: 'content', description: 'استراتژی محتوا، تقویم انتشار و نگارش سئوشده حرفه‌ای', sortOrder: 3 },
    { name: 'هوش مصنوعی', slug: 'ai', description: 'کاربرد مسئولانه هوش مصنوعی و اتوماسیون در کسب‌وکار', sortOrder: 4 },
    { name: 'عملکرد', slug: 'performance', description: 'سرعت، Core Web Vitals و بهینه‌سازی تجربه کاربری فنی', sortOrder: 5 },
  ]
  for (const c of catDefs) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }
  const cats = await db.category.findMany()
  const catBySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]))
  const CAT_MAP: Record<string, string> = {
    seo: 'seo', ai: 'ai', content: 'content',
    'web-design': 'web-design', performance: 'performance', 'طراحی و تجربه': 'web-design',
  }

  // ─── ۳) مقالات از داده تأییدشده استاتیک ───────────────────────
  const articlesA = loadStatic('articles-a.js', 'CD_ARTICLES_A') as any[]
  const articlesB = loadStatic('articles-b.js', 'CD_ARTICLES_B') as any[]
  const allStatic = [...articlesA, ...articlesB]
  console.log(`✓ داده استاتیک: ${allStatic.length} مقاله`)

  let articleCount = 0
  for (const a of allStatic) {
    const catSlug = CAT_MAP[a.cat] || 'web-design'
    const publishedAt = sortToDate(a.sort || 20251101)
    const blocks = fixBlocks(a.blocks || [])
    const data = {
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt || '',
      content: blocksToSource(blocks as any),
      status: 'PUBLISHED',
      categoryId: catBySlug[catSlug] || null,
      authorId: admin.id,
      coverImage: (a.cover || '').replace('assets/img/', '/img/') || null,
      coverAlt: a.coverAlt || a.title,
      metaTitle: a.seoTitle || null,
      metaDescription: a.seoDesc || null,
      focusKeyword: a.tags?.[0] || null,
      readTime: a.read || 5,
      relatedSlugs: JSON.stringify(a.related || []),
      publishedAt,
      scheduledAt: null,
    }
    await db.article.upsert({
      where: { slug: a.slug },
      update: data,
      create: data,
    })
    articleCount++

    // برچسب‌ها (idempotent بر اساس نام)
    for (const t of a.tags || []) {
      const tSlug = t.replace(/\s+/g, '-').toLowerCase()
      const tag =
        (await db.tag.findFirst({ where: { OR: [{ slug: tSlug }, { name: t }] } })) ||
        (await db.tag.create({ data: { name: t, slug: tSlug } }))
    }

    // FAQ اختصاصی مقاله (برای FAQPage Schema)
    const pageKey = `article:${a.slug}`
    await db.faq.deleteMany({ where: { pageKey } })
    let fSort = 0
    for (const f of a.faq || []) {
      await db.faq.create({ data: { pageKey, question: f.q, answer: f.a, sortOrder: fSort++ } })
    }
  }

  // اتصال صحیح برچسب‌ها (articleId واقعی)
  const savedArticles = await db.article.findMany({ select: { id: true, slug: true } })
  const savedById = Object.fromEntries(savedArticles.map((x) => [x.slug, x.id]))
  for (const a of allStatic) {
    const artId = savedById[a.slug]
    if (!artId) continue
    await db.articleTag.deleteMany({ where: { articleId: artId } })
    for (const t of a.tags || []) {
      const tSlug = t.replace(/\s+/g, '-').toLowerCase()
      const tag = await db.tag.findUnique({ where: { slug: tSlug } })
      if (tag) await db.articleTag.create({ data: { articleId: artId, tagId: tag.id } }).catch(() => {})
    }
  }
  console.log(`✓ ${articleCount} مقاله + برچسب‌ها + FAQ اختصاصی ذخیره شد`)

  // ─── ۴) نمونه‌کارها با محتوای کامل صفحات جزئیات ────────────────
  const portfolio = loadStatic('portfolio.js', 'CD_PORTFOLIO') as any[]
  const pfContent = JSON.parse(readFileSync('/home/z/my-project/scripts/pf-content.json', 'utf8'))
  for (const [i, p] of portfolio.entries()) {
    const extra = pfContent[p.slug] || {}
    const sections = {
      h1: extra.h1 || '',
      goal: extra.goal || [],
      points: extra.points || [],
      specs: extra.specs || [],
      features: extra.features || [],
    }
    const data = {
      title: p.title,
      slug: p.slug,
      category: p.catLabel,
      description: p.summary,
      imageUrl: p.cover.replace('assets/img/', '/img/'),
      imageHeight: p.imgH || 2800,
      chips: JSON.stringify(p.chips || []),
      sections: JSON.stringify(sections),
      isConceptual: true,
      isPublished: true,
      showOnHome: !!p.home,
      sortOrder: i,
      metaTitle: `${p.title} | نمونه‌کار کافه‌دانش`,
      metaDescription: extra.desc || p.summary,
    }
    await db.portfolioItem.upsert({ where: { slug: p.slug }, update: data, create: data })
  }
  console.log(`✓ ${portfolio.length} نمونه‌کار با بخش‌های کامل ذخیره شد`)

  // ─── ۵) FAQ صفحات خدمات ────────────────────────────────────────
  const pageFaqs = loadStatic('faq.js', 'CD_FAQ_PAGES') as Record<string, any[]>
  const FAQ_KEY_MAP: Record<string, string> = {
    'web-design': 'web-design', seo: 'seo', 'content-production': 'content-production',
    'ai-solutions': 'ai-solutions', uiux: 'uiux', support: 'support',
    speed: 'speed-optimization', services: 'services', 'e-commerce': 'e-commerce',
  }
  await db.faq.deleteMany({ where: { pageKey: { not: { startsWith: 'article:' } } } })
  const homeFaqs = [
    { q: 'برای شروع طراحی سایت چه اطلاعاتی لازم است؟', a: 'در جلسه اول فقط چند چیز پایه می‌پرسیم: کسب‌وکار شما چه می‌فروشد، مخاطبش کیست، الان سایت دارید یا نه و انتظارتان از پروژه چیست. اگر لوگو یا محتوای آماده دارید عالی است؛ اگر ندارید، بخشی از پروژه است و خودمان آماده می‌کنیم.' },
    { q: 'هزینه طراحی سایت چگونه مشخص می‌شود و چرا قیمت ثابت ندارید؟', a: 'هزینه تابع دامنه کار است: تعداد صفحات، قابلیت‌های سفارشی، حجم محتوا و سئو. قیمت «یک‌سایز-برای-همه» یا گران‌تر از نیاز شماست یا کمتر از نیاز واقعی؛ به همین دلیل پس از جلسه نیازسنجی، برآورد دقیق و شفاف ارائه می‌شود.' },
    { q: 'مدت اجرای پروژه به چه عواملی بستگی دارد؟', a: 'سه عامل اصلی: پیچیدگی قابلیت‌ها (سایت معرفی در برابر فروشگاه یا سامانه)، آماده‌بودن محتوا و سرعت بازخورد شما در مراحل تأیید. در جلسه اول، زمان‌بندی واقعی بر اساس همین عوامل اعلام می‌شود و پیشرفت هر مرحله را می‌بینید.' },
    { q: 'سئو از چه مرحله‌ای باید شروع شود و چه زمانی نتیجه می‌دهد؟', a: 'بهترین نقطه شروع، قبل یا حین طراحی سایت است تا ساختار از اول درست چیده شود — اصلاح بعدی گران‌تر است. زمان نتیجه به رقابت حوزه، سن دامنه و تداوم کار بستگی دارد و معمولاً چندماهه است؛ به همین دلیل هیچ تضمین رتبه‌ای نمی‌دهیم و گزارش شفاف کار انجام‌شده ارائه می‌شود.' },
    { q: 'چه فرایندهایی را می‌توان با هوش مصنوعی خودکار کرد و به کلید API خارجی نیاز دارد؟', a: 'رایج‌ترین‌ها: پاسخ‌گویی به سؤالات تکراری مشتریان، پیش‌نویس محتوا و جمع‌آوری اطلاعات مشتری. بله، اجرای مدل‌های هوش مصنوعی به سرویس API خارجی نیاز دارد که هزینه مصرفی آن جداگانه محاسبه می‌شود؛ اتصال کاملاً سمت سرور و امن انجام می‌شود و خروجی‌ها پیش از استفاده بازبینی انسانی می‌شوند.' },
    { q: 'پس از تحویل چه چیزهایی تحویل داده می‌شود و مالکیت کد با کیست؟', a: 'کد کامل، دسترسی کامل هاست و پنل، محتوای سایت و آموزش مدیریت آن — همه متعلق به شماست و در صورت تمایل می‌توانید با تیم دیگری ادامه دهید. پشتیبانی دوره‌ای پس از تحویل آغاز می‌شود و در صورت نیاز قرارداد نگهداری مداوم تنظیم می‌گردد.' },
  ]
  let hSort = 0
  for (const f of homeFaqs) {
    await db.faq.create({ data: { pageKey: 'home', question: f.q, answer: f.a, sortOrder: hSort++ } })
  }
  for (const [key, list] of Object.entries(pageFaqs)) {
    const pageKey = FAQ_KEY_MAP[key] || key
    let sort = 0
    for (const f of list) {
      await db.faq.create({ data: { pageKey, question: f.q, answer: f.a, sortOrder: sort++ } })
    }
  }
  console.log('✓ FAQ صفحات خدمات ذخیره شد')

  // ─── ۶) تنظیمات برند و سایت ────────────────────────────────────
  const settings: Record<string, string> = {
    siteName: 'کافه‌دانش',
    siteTagline: 'استودیو دیجیتال؛ طراحی سایت، سئو و راهکارهای هوشمند',
    ownerName: 'رسول بهادران',
    ownerTitle: 'طراح سایت',
    phone: '09165806207',
    website: 'https://www.cdanesh.ir/',
    email: '',
    address: '',
    socials: '[]',
    defaultMetaTitle: 'کافه‌دانش | طراحی سایت، سئو و راهکارهای هوشمند',
    defaultMetaDescription: 'استودیو دیجیتال کافه‌دانش؛ طراحی سایت اختصاصی، سئوی اصولی و راهکارهای هوش مصنوعی برای رشد واقعی کسب‌وکار شما.',
    ogImage: '/img/og-default.webp',
    pricingMode: 'final', // قیمت‌های تأییدشده مالک (۸ آبان ۱۴۰۵) فعال است؛ در پنل قابل تغییر به estimate
    paymentGateway: '', // zarinpal | idpay — پس از دریافت اطلاعات واقعی
  }
  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
  }
  console.log('✓ تنظیمات برند ذخیره شد (رسول بهادران / 09165806207)')

  // ─── ۷) پکیج‌های خدمات (ساختار تأییدشده؛ قیمت تا تأیید تعرفه خالی) ──
  if ((await db.package.count()) === 0) {
    const F = (arr: string[]) => JSON.stringify(arr)
    const approved = [
      // ── تب طراحی سایت ──
      { serviceType: 'web-design', slug: 'design-basic', name: 'پکیج استارتر (سایت معرفی)', audience: 'مناسب شروع کار: کسب‌وکارهایی که اولین سایت حرفه‌ای و منظم خود را می‌خواهند.', features: F(['تا ۶ صفحه حرفه‌ای و واکنش‌گرا', 'فرم تماس هوشمند', 'تنظیمات پایه سئو', 'سرعت و ساختار استاندارد', 'آموزش مدیریت محتوا']), excluded: F(['هاست و دامنه (سالانه جداگانه)', 'تولید محتوای انبوه']), duration: '۷ تا ۱۰ روز کاری', support: '۱ ماه پشتیبانی رایگان', priceToman: '15000000', priceNote: 'شروع قیمت؛ برآورد نهایی پس از جلسه نیازسنجی رایگان', note: 'زمان تحویل و پشتیبانی طبق قرارداد مشخص می‌شود.', marketBasis: 'بازار (آبان ۱۴۰۵): قالب آماده ۲۰ تا ۲۵ میلیون — حدود ۲۵٪ پایین‌تر', featured: false, sortOrder: 1 },
      { serviceType: 'web-design', slug: 'design-pro', name: 'پکیج حرفه‌ای (شرکتی اختصاصی)', audience: 'برای کسب‌وکارهایی که حضور کامل و منظم می‌خواهند و سئو بخشی از نقشه راه‌شان است.', features: F(['همه امکانات پکیج استارتر', 'طراحی اختصاصی کامل UI/UX', 'تا ۱۲ صفحه + مجله/بلاگ', 'پنل مدیریت محتوا', 'سئو تکنیکال پایه']), excluded: F(['هاست و دامنه (سالانه جداگانه)', 'کمپین سئوی ماهانه']), duration: '۲ تا ۳ هفته', support: '۳ ماه پشتیبانی رایگان', priceToman: '19000000', priceNote: 'شروع قیمت؛ برآورد نهایی پس از جلسه نیازسنجی رایگان', note: 'برجسته‌شدن این پکیج به‌معنای ادعای برتری نیست؛ بیشترین نیازهای رایج را پوشش می‌دهد.', marketBasis: 'بازار (آبان ۱۴۰۵): شرکتی حرفه‌ای ۲۵ تا ۸۵ میلیون — حدود ۲۴٪ پایین‌تر از کف رایج', featured: true, sortOrder: 2 },
      { serviceType: 'web-design', slug: 'design-shop', name: 'پکیج فروشگاهی', audience: 'برای فروش آنلاین: فروشگاه کامل با پنل مدیریت محصول و سفارش.', features: F(['پنل مدیریت محصول و سفارش‌ها', 'سبد خرید و فرایند پرداخت', 'زیرساخت درگاه پرداخت امن', 'دسته‌بندی، جست‌وجو و تخفیف', 'پنل مدیریت محتوا']), excluded: F(['هاست و دامنه (سالانه جداگانه)', 'اتصال نهایی درگاه تا ارائه مدارک کسب‌وکار', 'ورود انبوه محصولات']), duration: '۳ تا ۴ هفته', support: '۳ ماه پشتیبانی رایگان', priceToman: '40000000', priceNote: 'شروع قیمت؛ برآورد نهایی پس از جلسه نیازسنجی رایگان', note: 'زیرساخت پرداخت سمت سرور و امن پیاده می‌شود؛ اتصال به درگاه پس از تأیید اطلاعات مالی فروشگاه انجام می‌گیرد.', marketBasis: 'بازار (آبان ۱۴۰۵): فروشگاهی ۵۴ تا ۱۰۰ میلیون — حدود ۲۶٪ پایین‌تر از کف بازار', featured: false, sortOrder: 3 },
      { serviceType: 'web-design', slug: 'design-custom', name: 'پکیج اختصاصی (سفارشی)', audience: 'برای پروژه‌های خاص: سامانه سفارشی، پنل‌های اختصاصی یا قابلیت‌های منحصربه‌فرد.', features: F(['تحلیل کامل نیازمندی‌های پروژه', 'طراحی و توسعه کاملاً سفارشی', 'پنل‌ها و قابلیت‌های اختصاصی کسب‌وکار', 'معماری فنی برای مقیاس‌پذیری', 'همراهی فنی پس از انتشار']), excluded: F(['هاست و دامنه (سالانه جداگانه)', 'خدمات سئوی ماهانه']), duration: 'پس از تدوین پروپوزال', support: 'قرارداد نگهداری جداگانه', priceToman: null, priceNote: 'شروع از ۷۰,۰۰۰,۰۰۰ تومان — برآورد دقیق پس از جلسه نیازسنجی', note: 'امکانات هر پروژه بر اساس نیاز کسب‌وکار شخصی‌سازی می‌شود.', marketBasis: 'بازار (آبان ۱۴۰۵): طراحی اختصاصی کدنویسی از ۹۹ میلیون — شروع ما حدود ۳۰٪ پایین‌تر', featured: false, sortOrder: 4 },
      { serviceType: 'seo', slug: 'seo-start', name: 'شروع سئو', audience: 'برای سایتی که می‌خواهد پایه‌های سئو را درست بچیند و مسیر رشد را باز کند.', features: F(['بررسی فنی کامل سایت (آدیت سئو)', 'اصلاح ساختار آدرس‌ها و تگ‌گذاری', 'اتصال و پیکربندی Search Console', 'تحقیق کلمات کلیدی اولیه']), excluded: F(['تضمین رتبه (غیرواقعی و غیرحرفه‌ای)']), duration: 'پروژه‌ای، ۳ تا ۶ هفته', support: 'گزارش مکتوب پایان پروژه', priceToman: null, priceNote: 'برآورد پس از بررسی وضعیت فعلی سایت', note: 'نتایج سئو به رقابت حوزه و سن دامنه بستگی دارد؛ هیچ تضمین رتبه‌ای ارائه نمی‌شود.', marketBasis: 'سئو پروژه‌ای سایت کوچک بازار (۳۰ تا ۸۰ میلیون تومان)', featured: false, sortOrder: 5 },
      { serviceType: 'seo', slug: 'seo-growth', name: 'رشد سئو و محتوا', audience: 'برای سایتی که زیرساخت دارد و حالا دنبال رشد ترافیک ارگانیک و تبدیل آن است.', features: F(['همه موارد پکیج شروع سئو', 'استراتژی محتوایی ماهانه', 'تولید مقالات سئومحور (طبق تقویم)', 'معماری لینک‌سازی داخلی', 'گزارش ماهانه شفاف پیشرفت']), excluded: F(['تضمین رتبه', 'خرید بک‌لینک انبوه']), duration: 'قرارداد ۶ ماهه (قابل تمدید)', support: 'گزارش و جلسه ماهانه', priceToman: null, priceNote: 'برآورد پس از جلسه نیازسنجی و تحلیل رقبا', note: 'تعداد مقالات ماهانه بر اساس بودجه و اهداف توافق می‌شود.', marketBasis: 'سئو ماهانه بازار (۱۵ تا ۴۵ میلیون تومان در ماه)', featured: true, sortOrder: 6 },
      { serviceType: 'content', slug: 'seo-content', name: 'توسعه محتوایی مستمر', audience: 'برای برندهایی که محتوا ستون فقرات مارکتینگ‌شان است و انتشار منظم می‌خواهند.', features: F(['تقویم محتوایی سه‌ماهه', 'مقالات تخصصی + بازنویسی صفحات کلیدی', 'به‌روزرسانی محتوای قدیمی', 'پایش و بهینه‌سازی مداوم']), excluded: F(['ترجمه ماشینی بدون بازبینی انسانی']), duration: 'ماهانه', support: 'بازنویسی در صورت نیاز', priceToman: null, priceNote: 'برآورد بر اساس حجم و نوع محتوای موردنیاز', note: 'لحن برند و راهنمای سبک شما مبنای تولید محتوا خواهد بود.', marketBasis: 'قیمت هر مقاله سئوشده بازار', featured: false, sortOrder: 7 },
      // ── تب هوش مصنوعی ──
      { serviceType: 'ai-solutions', slug: 'ai-basic', name: 'راهکار پایه', audience: 'برای شروع: یک دستیار هوشمند روی سایت برای پاسخ‌گویی به سؤالات تکراری مشتریان.', features: F(['چت‌بات آموزش‌دیده با محتوای سایت', 'اتصال امن سمت سرور', 'پنل مشاهده گفتگوها', 'راهنمای به‌روزرسانی دانش دستیار']), excluded: F([]), duration: '۲ تا ۴ هفته', support: 'پشتیبانی اولیه پس از راه‌اندازی', priceToman: null, priceNote: 'هزینه ساخت + هزینه سرویس مدل بر اساس مصرف', note: 'نیاز به سرویس یا کلید API خارجی است که با تأیید شما تهیه می‌شود.', marketBasis: 'پروژه‌های سفارشی اتوماسیون بازار', featured: false, sortOrder: 8 },
      { serviceType: 'ai-solutions', slug: 'ai-pro', name: 'راهکار حرفه‌ای', audience: 'برای تیم‌هایی که فروش و پشتیبانی‌شان حجم بالای گفتگو و کار تکراری دارد.', features: F(['همه موارد راهکار پایه', 'ثبت و تحویل سرنخ به تیم فروش', 'اتوماسیون فرایندهای تکراری منتخب', 'گزارش دوره‌ای سؤالات و نقاط بهبود', 'بهینه‌سازی مستمر پاسخ‌ها']), excluded: F([]), duration: '۴ تا ۸ هفته', support: 'قرارداد نگهداری جداگانه', priceToman: null, priceNote: 'برآورد پس از تحلیل فرایندهای فعلی تیم شما', note: 'خروجی‌های هوش مصنوعی همیشه با بازبینی انسانی همراه است.', marketBasis: 'پروژه‌های اتوماسیون فروش/پشتیبانی بازار', featured: true, sortOrder: 9 },
      { serviceType: 'ai-solutions', slug: 'ai-custom', name: 'راهکار سفارشی', audience: 'برای نیازهای خاص: اتصال به نرم‌افزارهای داخلی، گردش‌کار اختصاصی یا چندکاناله.', features: F(['تحلیل و طراحی گردش‌کار اختصاصی', 'اتصال به CRM یا نرم‌افزارهای داخلی', 'پشتیبانی چندکاناله (سایت، واتس‌پپ و…)', 'آموزش تیم و مستندات کامل']), excluded: F([]), duration: 'پس از تدوین پروپوزال', support: 'قرارداد نگهداری جداگانه', priceToman: null, priceNote: 'پس از جلسه تحلیل فرایند، پروپوزال اختصاصی ارائه می‌شود', note: 'امنیت داده و سطوح دسترسی طبق سیاست سازمان شما پیاده‌سازی می‌شود.', marketBasis: 'اتوماسیون سازمانی سفارشی بازار', featured: false, sortOrder: 10 },
    ]
    for (const d of approved) await db.package.create({ data: { ...d, isPublished: true } })
    console.log('✓ ۹ پکیج ساختار تأییدشده ذخیره شد (قیمت خالی — حالت برآوردی)')
  }

  // ─── ۸) محتوای صفحات حقوقی/معرفی ───────────────────────────────
  const legalPages = [
    { key: 'privacy', title: 'حریم خصوصی', metaTitle: 'حریم خصوصی | کافه‌دانش', metaDescription: 'سیاست حریم خصوصی کافه‌دانش؛ اطلاعاتی که جمع‌آوری می‌کنیم و نحوه محافظت از آن.' },
    { key: 'terms', title: 'شرایط استفاده', metaTitle: 'شرایط استفاده | کافه‌دانش', metaDescription: 'شرایط استفاده از وب‌سایت و خدمات کافه‌دانش.' },
  ]
  for (const p of legalPages) {
    await db.pageContent.upsert({
      where: { key: p.key },
      update: { metaTitle: p.metaTitle, metaDescription: p.metaDescription },
      create: { ...p, content: 'placeholder' },
    })
  }

  console.log('🎉 Seed کامل شد')
  console.log('🔑 ورود مدیر: /admin/login (کاربر: admin)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
