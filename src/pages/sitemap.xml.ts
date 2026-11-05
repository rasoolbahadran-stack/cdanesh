/* نقشه سایت پویا: مقالات و صفحات از دیتابیس، نمونه‌کارها از فهرست پروژه‌های واقعی Astro */
import { q } from '../lib/db';
import { siteUrl } from '../lib/seo';
import { ASTRO_PROJECTS } from '../lib/portfolio-projects';

export async function GET() {
  const [posts, pages, services] = await Promise.all([
    q<{ slug: string; published_at: string }>(`SELECT slug, published_at FROM posts WHERE status='published'`),
    q<{ slug: string }>(`SELECT slug FROM pages WHERE status='published'`),
    q<{ slug: string }>(`SELECT slug FROM services WHERE status='published'`),
  ]);

  const staticPages = ['', '/services', '/portfolio', '/pricing', '/about', '/contact', '/consult', '/faq', '/blog', '/privacy', '/terms'];
  const entries: string[] = [];
  const add = (path: string, lastmod?: string) => {
    entries.push(`<url><loc>${siteUrl(path)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>${path === '' ? '1.0' : '0.8'}</priority></url>`);
  };

  staticPages.forEach((path) => add(path));
  posts.forEach((post) => add(`/blog/${post.slug}`, post.published_at));
  pages.forEach((page) => add(`/${page.slug}`));
  services.forEach((service) => add(`/services/${service.slug}`));
  ASTRO_PROJECTS.forEach((project) => add(`/portfolio/${project.slug}`));

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`;
  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
