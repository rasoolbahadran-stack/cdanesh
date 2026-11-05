#!/usr/bin/env node
/* ==========================================================================
   کافه‌دانش — اسکریپت «بیلد استاتیک نمایشی» (نسخهٔ ۲)
   خروجی: پوشهٔ Cafe-Danesh-Static با ساختار مسطح:
     ├── index.html ، about.html ، … (همهٔ HTMLها در یک پوشه)
     └── assets/{css,js,img,fonts}
   همهٔ مسیرهای داخل HTML نسبی می‌شوند تا روی هر هاست ساده (و حتی باز کردن
   مستقیم فایل) درست نمایش داده شوند. مسیرهای سمت سرور (API، پنل مدیریت)
   در این نسخه وجود ندارند و فرم‌ها پیام «نسخهٔ نمایشی» نشان می‌دهند.
   اجرا:  npm run build:static
   ========================================================================== */
import { existsSync, mkdirSync, renameSync, rmSync, cpSync, readdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = path.join(root, 'src/pages');
const stashRoot = path.join(root, '.static-stash');
const outDir = path.join(root, 'Cafe-Danesh-Static');
const distStatic = path.join(root, 'dist-static');

/* مسیرهای سمت سرور که در نسخهٔ استاتیک جایی ندارند */
const serverDirs = ['api', 'admin', 'p'];
const serverFiles = [
  'admin-dashboard.astro',
  'admin-login.astro',
  'article.astro',
  /* ریدایرکت‌های ۳۰۱ قدیمی — در نسخهٔ استاتیک معنا ندارند */
  'web-design.astro',
  'e-commerce.astro',
  'uiux.astro',
  'seo.astro',
  'content-production.astro',
  'speed-optimization.astro',
  'ai-solutions.astro',
  'support.astro',
];

function stash() {
  if (existsSync(stashRoot)) rmSync(stashRoot, { recursive: true, force: true });
  mkdirSync(stashRoot, { recursive: true });
  for (const d of serverDirs) {
    const src = path.join(pagesDir, d);
    if (existsSync(src)) renameSync(src, path.join(stashRoot, 'dir_' + d));
  }
  for (const f of serverFiles) {
    const src = path.join(pagesDir, f);
    if (existsSync(src)) renameSync(src, path.join(stashRoot, 'file_' + f));
  }
}

function restore() {
  for (const d of serverDirs) {
    const src = path.join(stashRoot, 'dir_' + d);
    if (existsSync(src)) renameSync(src, path.join(pagesDir, d));
  }
  for (const f of serverFiles) {
    const src = path.join(stashRoot, 'file_' + f);
    if (existsSync(src)) renameSync(src, path.join(pagesDir, f));
  }
  if (existsSync(stashRoot)) rmSync(stashRoot, { recursive: true, force: true });
}

/* ---------- ابزارهای کمکی ---------- */
function walk(dir, base = dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

/* نام مسطح برای هر صفحه:  about/index.html → about.html */
function flatName(rel) {
  let r = rel.replace(/\\/g, '/');
  if (r === 'index.html') return 'index.html';
  if (r.endsWith('/index.html')) r = r.slice(0, -'/index.html'.length);
  else if (r.endsWith('.html')) r = r.slice(0, -'.html'.length);
  else return null;

  if (r === '404') return '404.html';
  const seg = r.split('/');
  if (seg.length === 1) return `${seg[0]}.html`;
  if (seg[0] === 'blog') return `article-${seg[1]}.html`;
  if (seg[0] === 'services') return `service-${seg[1]}.html`;
  if (seg[0] === 'portfolio') return `portfolio-${seg[1]}.html`;
  if (seg[0] === 'page') return `page-${seg[1]}.html`;
  return `${seg.join('-')}.html`;
}

/* نگاشت مسیر داخلی بدون پسوند → فایل مسطح */
function routeToFile(rel) {
  let r = rel.replace(/\\/g, '/');
  if (r === '') return 'index.html';
  if (r === '404') return '404.html';
  if (r.endsWith('/index.html')) r = r.slice(0, -'/index.html'.length);
  if (r.endsWith('.html')) return flatName(r);
  const seg = r.split('/');
  if (seg.length === 1) return `${seg[0]}.html`;
  if (seg[0] === 'blog') return `article-${seg[1]}.html`;
  if (seg[0] === 'services') return `service-${seg[1]}.html`;
  if (seg[0] === 'portfolio') return `portfolio-${seg[1]}.html`;
  if (seg[0] === 'page') return `page-${seg[1]}.html`;
  return `${seg.join('-')}.html`;
}

/* بازنویسی لینک‌های داخلی در HTML/CSS/JS */
function rewriteInternalLinks(html, pageDir /* '' یا 'about' برای محاسبهٔ نسبی */, renameMap) {
  const depth = pageDir ? pageDir.split('/').length : 0;
  const pre = '../'.repeat(depth);
  const rel = (flat) => (depth === 0 ? flat : pre + flat);
  const cssJs = (n) => renameMap && renameMap.get(n) ? renameMap.get(n) : n;

  return html
    /* assetها */
    .replace(/(href|src)="\/_astro\/([^"]+\.css)"/g, (_, a, n) => `${a}="assets/css/${cssJs(n)}"`)
    .replace(/(href|src)="\/_astro\/([^"]+\.js)"/g, (_, a, n) => `${a}="assets/js/${cssJs(n)}"`)
    .replace(/(href|src)="\/_astro\/([^"]+)"/g, (_, a, n) => `${a}="assets/${n}"`)
    .replace(/(href|src)="\/fonts\/([^"]+)"/g, (_, a, n) => `${a}="assets/fonts/${n}"`)
    .replace(/(href|src)="\/uploads\/([^"]+)"/g, (_, a, n) => `${a}="assets/img/uploads/${n}"`)
    .replace(/(href|src)="\/assets\/img\/([^"]+)"/g, (_, a, n) => `${a}="assets/img/${n}"`)
    .replace(/(href|src)="\/img\/([^"]+)"/g, (_, a, n) => `${a}="assets/img/${n}"`)
    .replace(/(href|src)="\.\.\/img\/([^"]+)"/g, (_, a, n) => `${a}="${rel(`assets/img/${n}`)}"`)
    .replace(/(href|src)="\.\.\/fonts\/([^"]+)"/g, (_, a, n) => `${a}="${rel(`assets/fonts/${n}`)}"`)
    .replace(/(href|src)="\.\.\/_astro\/([^"]+)"/g, (_, a, n) => `${a}="${rel(`assets/${n}`)}"`)
    /* canonical و OG با URL مطلق سایت باقی می‌مانند (برای سئو صحیح‌تر است) */
    /* لینک‌های داخلی */
    .replace(/href="\/(admin[^"]*)"/g, 'href="#" data-admin-link="1"')
    .replace(/href="\/(api\/[^"]*)"/g, 'href="#" data-api-link="1"')
    .replace(/href="\/(sitemap\.xml|robots\.txt)"/g, (_, f) => `href="${f}"`)
    .replace(/href="\/([^"@?#]*)"/g, (m, p) => {
      if (p.startsWith('/')) return m;
      const clean = p.split('#')[0].split('?')[0];
      if (!clean) return m;
      const file = routeToFile(clean);
      const [base, ...hashRest] = p.split('#');
      const hash = hashRest.length ? '#' + hashRest.join('#') : '';
      return `href="${rel(file)}${hash}"`;
    })
    .replace(/href="\//g, 'href="index.html"');
}

/* فرم‌های نسخهٔ استاتیک: پیام شفاف به‌جای ارسال واقعی */
const STATIC_FORM_GUARD = `
/* نسخهٔ استاتیک نمایشی — ارسال فرم‌ها و پنل مدیریت سمت سرور فعال نیست */
document.addEventListener('submit', function (e) {
  var form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.dataset.staticDemo === 'off') return;
  e.preventDefault();
  var note = document.createElement('div');
  note.setAttribute('dir', 'rtl');
  note.style.cssText = 'position:fixed;inset-inline:0;bottom:0;z-index:9999;background:#1d1233;color:#fff;padding:14px 20px;font-family:inherit;font-size:14px;text-align:center';
  note.textContent = 'این صفحه نسخهٔ نمایشی استاتیک است؛ فرم‌ها و پنل مدیریت فقط در نسخهٔ اصلی Astro فعال هستند.';
  document.body.appendChild(note);
  setTimeout(function () { note.remove(); }, 6000);
}, true);
`;

try {
  console.log('▸ کنارگذاشتن مسیرهای سروری (api، admin، p، article) …');
  stash();

  console.log('▸ اجرای astro build با پیکربندی استاتیک …');
  execSync('npx astro build --config astro.config.static.mjs', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, STATIC_BUILD: '1', NODE_ENV: 'production' },
  });

  console.log('▸ ساخت پوشهٔ مسطح Cafe-Danesh-Static …');
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(path.join(outDir, 'assets/css'), { recursive: true });
  mkdirSync(path.join(outDir, 'assets/js'), { recursive: true });
  mkdirSync(path.join(outDir, 'assets/img'), { recursive: true });
  mkdirSync(path.join(outDir, 'assets/fonts'), { recursive: true });

  /* ---------- ۱) صفحات HTML مسطح ---------- */
  const all = walk(distStatic);
  const htmlFiles = all.filter((f) => f.endsWith('.html'));
  const flatMap = new Map(); // مسیر نسبی داخل dist-static → نام مسطح
  for (const f of htmlFiles) {
    const flat = flatName(f);
    if (!flat) continue;
    flatMap.set(f, flat);
    const html = readFileSync(path.join(distStatic, f), 'utf8');
    writeFileSync(path.join(outDir, flat), html);
  }

  /* ---------- ۲) assetها ----------
     نام‌گذاری مطابق ساختار مستندات: style.css / main.js (اگر فقط یک باندل باشد) */
  const cssNames = [];
  const jsNames = [];
  for (const f of all) {
    if (f.startsWith('_astro/') && f.endsWith('.css')) cssNames.push(path.basename(f));
    else if (f.startsWith('_astro/') && f.endsWith('.js')) jsNames.push(path.basename(f));
  }
  const renameMap = new Map(); // نام اصلی → نام نهایی
  cssNames.forEach((n, i) => renameMap.set(n, i === 0 && cssNames.length === 1 ? 'style.css' : i === 1 ? 'responsive.css' : n));
  jsNames.forEach((n, i) => renameMap.set(n, i === 0 && jsNames.length === 1 ? 'main.js' : i === 1 ? 'navigation.js' : n));

  let cssCount = 0, jsCount = 0;
  for (const f of all) {
    if (f.startsWith('_astro/') && f.endsWith('.css')) {
      cpSync(path.join(distStatic, f), path.join(outDir, 'assets/css', renameMap.get(path.basename(f)) || path.basename(f)));
      cssCount++;
    } else if (f.startsWith('_astro/') && f.endsWith('.js')) {
      cpSync(path.join(distStatic, f), path.join(outDir, 'assets/js', renameMap.get(path.basename(f)) || path.basename(f)));
      jsCount++;
    } else if (f.startsWith('fonts/')) {
      cpSync(path.join(distStatic, f), path.join(outDir, 'assets/fonts', path.basename(f)));
    } else if (f.startsWith('img/')) {
      const destDir = path.join(outDir, 'assets/img', path.dirname(f.slice('img/'.length)));
      mkdirSync(destDir, { recursive: true });
      cpSync(path.join(distStatic, f), path.join(destDir, path.basename(f)));
    } else if (f.startsWith('assets/img/')) {
      const destDir = path.join(outDir, 'assets/img', path.dirname(f.slice('assets/img/'.length)));
      mkdirSync(destDir, { recursive: true });
      cpSync(path.join(distStatic, f), path.join(destDir, path.basename(f)));
    } else if (f.startsWith('uploads/')) {
      const destDir = path.join(outDir, 'assets/img/uploads', path.dirname(f.slice('uploads/'.length)));
      mkdirSync(destDir, { recursive: true });
      cpSync(path.join(distStatic, f), path.join(destDir, path.basename(f)));
    }
  }

  /* فایل‌های ریشهٔ دیگر (favicon، robots، sitemap، …) */
  for (const f of all) {
    if (!f.includes('/')) {
      if (f.endsWith('.html')) continue;
      cpSync(path.join(distStatic, f), path.join(outDir, f));
    }
  }

  /* ---------- ۳) بازنویسی مسیرها در همهٔ HTML ---------- */
  let patched = 0;
  for (const [, flat] of flatMap) {
    const file = path.join(outDir, flat);
    let html = readFileSync(file, 'utf8');
    const origDir = Object.entries(flatMap).find(([, v]) => v === flat)?.[0] ?? '';
    const pageDir = origDir.includes('/') ? origDir.split('/')[0] : '';
    html = rewriteInternalLinks(html, pageDir, renameMap);

    /* تزریق محافظ فرم + جلوگیری از خطاهای اسکریپت‌های سروری */
    if (html.includes('</body>')) {
      html = html.replace('</body>', `<script data-static-demo>${STATIC_FORM_GUARD}</script>\n</body>`);
    }
    writeFileSync(file, html);
    patched++;
  }

  /* ---------- ۴) بازنویسی مسیرها در CSS (فونت/تصویر) ---------- */
  for (const f of walk(path.join(outDir, 'assets/css'))) {
    const file = path.join(outDir, 'assets/css', f);
    let css = readFileSync(file, 'utf8');
    css = css
      .replace(/url\((['"]?)\/_astro\//g, 'url($1../')
      .replace(/url\((['"]?)\/fonts\//g, 'url($1../fonts/')
      .replace(/url\((['"]?)\/img\//g, 'url($1../img/')
      .replace(/url\((['"]?)\/uploads\//g, 'url($1../img/uploads/')
      .replace(/url\((['"]?)\/assets\/img\//g, 'url($1../img/');
    writeFileSync(file, css);
  }
  for (const f of walk(path.join(outDir, 'assets/js'))) {
    const file = path.join(outDir, 'assets/js', f);
    let js = readFileSync(file, 'utf8');
    js = js
      .replace(/(["'])\/_astro\//g, '$1assets/')
      .replace(/(["'])\/fonts\//g, '$1assets/fonts/')
      .replace(/(["'])\/img\//g, '$1assets/img/')
      .replace(/(["'])\/uploads\//g, '$1assets/img/uploads/')
      .replace(/(["'])\/assets\/img\//g, '$1assets/img/')
      /* لینک‌های داخلی در JS (مثل مسیر جست‌وجو یا ناوبری) */
      .replace(/(["'])(\/(?:blog|services|portfolio|page|about|pricing|contact|consult|faq|privacy|terms|request))\1/g, (m, q, p) => `${q}${routeToFile(p.slice(1))}${q}`);
    writeFileSync(file, js);
  }

  /* ---------- ۵) گزارش و کنترل نهایی ---------- */
  const problems = [];
  const localAssetFiles = new Set(walk(outDir));
  for (const [, flat] of flatMap) {
    const html = readFileSync(path.join(outDir, flat), 'utf8');
    if (!/rel="stylesheet"/.test(html) || !/assets\/css\//.test(html)) problems.push(`${flat}: بدون استایل`);
    for (const m of html.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)) {
      if (!localAssetFiles.has(m[1])) problems.push(`${flat}: فایل گم‌شده ${m[1]}`);
    }
    if (/(href|src)="\/(img|fonts|_astro|uploads)\//.test(html)) problems.push(`${flat}: مسیر مطلق باقی مانده`);
    if (/href="\/(blog|services|portfolio|page|about|pricing|contact|consult|faq|privacy|terms)["/]/.test(html) && /href="\/(blog|services|portfolio|page|about|pricing|contact|consult|faq|privacy|terms)\//.test(html)) {
      problems.push(`${flat}: لینک داخلی بازنویسی نشده`);
    }
  }

  console.log(`✓ ${patched} صفحهٔ HTML مسطح ساخته شد (CSS: ${cssCount}، JS: ${jsCount})`);
  if (problems.length) {
    console.warn('⚠️ مشکلات مسیر:');
    problems.slice(0, 30).forEach((p) => console.warn('  - ' + p));
    process.exitCode = 2;
  } else {
    console.log('✓ همهٔ صفحات استایل دارند و همهٔ مسیرهای نسبی معتبرند.');
  }
  console.log('✓ بیلد استاتیک کامل شد → Cafe-Danesh-Static/');
} finally {
  console.log('▸ بازگرداندن مسیرهای سروری …');
  restore();
}
