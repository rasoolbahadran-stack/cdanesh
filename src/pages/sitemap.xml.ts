/* نقشه سایت پویا: محتوای محلی نسخه جدید و محتوای مدیریت‌شده در Neon */
import { q } from '../lib/db';
import { siteUrl } from '../lib/seo';
import { getPosts, getPortfolio, getServices } from '../lib/content';

export const prerender = false;

export async function GET() {
  const [posts, pages, services, portfolio] = await Promise.all([
    getPosts(),
    q<{ slug: string }>(`SELECT slug FROM pages WHERE status='published'`),
    getServices(),
    getPortfolio(),
  ]);

  const staticPages = [
    '', '/services', '/portfolio', '/pricing', '/about', '/contact',
    '/consult', '/faq', '/blog', '/privacy', '/terms',
  ];
  const entries: string[] = [];
  const seen = new Set<string>();
  const add = (path: string, lastmod?: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    const validDate = lastmod && !Number.isNaN(new Date(lastmod).getTime())
      ? new Date(lastmod).toISOString().slice(0, 10)
      : '';
    entries.push(
      `<url><loc>${siteUrl(path)}</loc>${validDate ? `<lastmod>${validDate}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>${path === '' ? '1.0' : '0.8'}</priority></url>`
    );
  };

  staticPages.forEach((path) => add(path));
  posts.forEach((post) => add(`/blog/${post.slug}`, post.date || undefined));
  pages.forEach((page) => add(`/${page.slug}`));
  services.forEach((service) => add(`/services/${service.slug}`));
  portfolio.forEach((item) => add(`/portfolio/${item.slug}`));

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`;
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
