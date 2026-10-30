/* ═══ نقشهٔ سایت پویا — /sitemap.xml ═══
   SSR: همهٔ صفحات ثابت + مقالات همراه پروژه + مقالات منتشرشدهٔ ابری
   (هر مقاله‌ای که از پنل مدیریت منتشر شود، خودکار به نقشهٔ سایت اضافه می‌شود.) */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getPublicArticles } from '../lib/ssr-articles.mjs';

const STATIC_PATHS = [
  '', '/services', '/web-design', '/e-commerce', '/uiux', '/seo',
  '/content-production', '/speed-optimization', '/ai-solutions', '/support',
  '/portfolio', '/portfolio-arman', '/portfolio-mehr', '/portfolio-negar',
  '/portfolio-rosa', '/portfolio-goldast', '/portfolio-daneshvar',
  '/blog', '/faq', '/about', '/contact', '/request', '/privacy', '/terms',
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().slice(0, 10);
  let articles = [];
  try { articles = await getPublicArticles(); } catch { articles = []; }

  const urls = STATIC_PATHS.map(p => ({
    loc: 'https://cdanesh.ir' + p,
    lastmod: today,
    cf: p === '' || p === '/blog' ? 'daily' : 'weekly',
  }));

  for (const a of articles) {
    urls.push({
      loc: 'https://cdanesh.ir/blog/' + encodeURIComponent(a.slug || ''),
      lastmod: today,
      cf: 'monthly',
    });
  }

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(u =>
      `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.cf}</changefreq></url>`
    ).join('\n')
    + '\n</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};
