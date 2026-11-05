/* ==========================================================================
   کافه‌دانش — لایهٔ یکپارچهٔ نمونه‌کارها
   عمومی: از جدول projects دیتابیس (مدیریت‌شده از پنل) خوانده می‌شود؛
   اگر دیتابیس در دسترس نبود، دادهٔ واقعی استاتیک (ASTRO_PROJECTS) جایگزین می‌شود
   تا صفحهٔ نمونه‌کارها هرگز خالی نماند.
   ========================================================================== */
import { ASTRO_PROJECTS, type AstroProject } from './portfolio-projects';

export interface UnifiedProject {
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  html: string;
  coverImage: string;
  coverAlt: string;
  url: string;
  tags: string[];
  note: string;
  gallery: string[];
  seoTitle: string;
  seoDescription: string;
}

const fromStatic = (p: AstroProject): UnifiedProject => ({
  slug: p.slug,
  title: p.title,
  category: p.category,
  summary: p.summary,
  description: p.description,
  html: '',
  coverImage: p.coverImage,
  coverAlt: p.coverAlt,
  url: p.url,
  tags: p.tags,
  note: '',
  gallery: [],
  seoTitle: p.seoTitle,
  seoDescription: p.seoDescription,
});

export async function getPublishedProjects(): Promise<UnifiedProject[]> {
  try {
    const { q } = await import('./db');
    const rows = await q<Record<string, unknown>>(
      `SELECT title, slug, category, summary, content, cover_image, tags, url, note, gallery, seo_title, seo_description
       FROM projects WHERE status = 'published' ORDER BY sort_order, id ASC`,
    );
    if (rows.length) {
      return rows.map((r) => ({
        slug: String(r.slug),
        title: String(r.title),
        category: String(r.category || 'پروژه'),
        summary: String(r.summary || ''),
        description: String(r.summary || ''),
        html: String(r.content || ''),
        coverImage: String(r.cover_image || ''),
        coverAlt: `${String(r.title)} — نمونه‌کار کافه دانش`,
        url: String(r.url || ''),
        tags: Array.isArray(r.tags) ? (r.tags as unknown[]).map(String).filter(Boolean) : [],
        note: String(r.note || ''),
        gallery: Array.isArray(r.gallery) ? (r.gallery as unknown[]).map(String).filter(Boolean) : [],
        seoTitle: String(r.seo_title || r.title || ''),
        seoDescription: String(r.seo_description || r.summary || ''),
      }));
    }
  } catch {
    /* دیتابیس در دسترس نیست → دادهٔ استاتیک واقعی */
  }
  return ASTRO_PROJECTS.map(fromStatic);
}

export async function getProjectBySlug(slug: string): Promise<UnifiedProject | null> {
  const all = await getPublishedProjects();
  return all.find((p) => p.slug === slug) ?? null;
}
