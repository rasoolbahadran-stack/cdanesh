/* لایه سازگاری محتوای نسخه جدید با جداول موجود کافه دانش.
   این فایل از ساختار فعلی posts / projects / messages استفاده می‌کند؛
   جدول تازه‌ای به نام portfolio ایجاد نمی‌کند و داده‌های فعلی را حذف نمی‌کند. */
import { env } from './env';
import { q, q1 } from './db';
import { sanitizeHtml, slugify } from './http';

type Row = Record<string, unknown>;

function textValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : value == null ? fallback : String(value);
}
function numberValue(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function boolValue(value: unknown): boolean {
  return value === true || value === 'true' || value === 1;
}
function dateValue(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}
function dateFa(value: Date | null): string {
  return value ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(value) : '';
}
function parseBlocks(content: string): unknown[] {
  if (!content.trim()) return [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* محتوای قدیمی HTML است، نه JSON بلوک‌ها */ }
  return [{ t: 'html', x: sanitizeHtml(content) }];
}

/** وجود DATABASE_URL یعنی CMS می‌تواند از Neon استفاده کند. */
export function dbAvailable(): boolean {
  return Boolean(env('DATABASE_URL'));
}

async function queryPosts(onlyPublished: boolean): Promise<Row[]> {
  return q<Row>(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.content,
            p.cover_image AS cover, COALESCE(c.name, 'عمومی') AS category,
            p.reading_time AS read_minutes, p.status,
            (p.status = 'published') AS published,
            p.published_at, p.created_at
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       ${onlyPublished ? "WHERE p.status = 'published'" : ''}
      ORDER BY COALESCE(p.published_at, p.created_at) DESC, p.id DESC`
  );
}

function mapPost(row: Row) {
  const publishedAt = dateValue(row.published_at) || dateValue(row.created_at);
  const content = textValue(row.content);
  return {
    id: numberValue(row.id),
    slug: textValue(row.slug),
    title: textValue(row.title),
    excerpt: textValue(row.excerpt),
    content,
    category: textValue(row.category, 'عمومی'),
    cover: textValue(row.cover),
    date: publishedAt?.toISOString() || '',
    dateFa: dateFa(publishedAt),
    read_minutes: numberValue(row.read_minutes, 5),
    readMinutes: numberValue(row.read_minutes, 5),
    published: boolValue(row.published),
    status: textValue(row.status),
    published_at: publishedAt?.toISOString() || '',
    blocks: parseBlocks(content),
  };
}

/** مقاله‌های منتشرشده برای صفحات عمومی */
export async function getPosts() {
  return (await queryPosts(true)).map(mapPost);
}

/** همه مقاله‌ها برای پنل مدیریت، شامل پیش‌نویس‌ها */
export async function listAdminPosts() {
  return (await queryPosts(false)).map(mapPost);
}

export async function upsertPost(post: {
  id?: number; slug: string; title: string; excerpt: string; content: string;
  category: string; cover: string; read_minutes: number; published: boolean;
}) {
  const category = textValue(post.category, 'عمومی').slice(0, 80);
  const categorySlug = slugify(category, 'category');
  const categoryRow = await q1<{ id: number }>(
    `INSERT INTO categories (name, slug) VALUES ($1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [category, categorySlug],
  );
  if (!categoryRow?.id) throw new Error('دسته‌بندی مقاله ذخیره نشد');
  const status = post.published ? 'published' : 'draft';
  const values = [
    textValue(post.title).slice(0, 200), textValue(post.slug).slice(0, 120),
    textValue(post.excerpt).slice(0, 600), sanitizeHtml(textValue(post.content)),
    textValue(post.cover).slice(0, 300), categoryRow.id, status,
    Math.max(1, Math.min(120, numberValue(post.read_minutes, 6))),
  ];
  if (post.id && post.id > 0) {
    const updated = await q1<{ id: number }>(
      `UPDATE posts SET title=$1, slug=$2, excerpt=$3, content=$4, cover_image=$5,
       category_id=$6, status=$7, reading_time=$8,
       published_at=CASE WHEN $7='published' THEN COALESCE(published_at, now()) ELSE NULL END,
       updated_at=now() WHERE id=$9 RETURNING id`,
      [...values, post.id],
    );
    if (!updated) throw new Error('مقاله موردنظر پیدا نشد');
  } else {
    await q(`INSERT INTO posts
      (title, slug, excerpt, content, cover_image, category_id, status, reading_time, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CASE WHEN $7='published' THEN now() ELSE NULL END)`, values);
  }
}

export async function deletePost(slug: string) {
  await q('DELETE FROM posts WHERE slug = $1', [textValue(slug).slice(0, 120)]);
}

async function queryPortfolio(): Promise<Row[]> {
  return q<Row>(
    `SELECT id, slug, title, summary AS excerpt, content AS description,
            category, tags, cover_image AS cover, preview_webp,
            url AS live_url, status, display_status, sort_order, created_at
       FROM projects
      ORDER BY sort_order ASC, created_at DESC`
  );
}

function mapPortfolio(row: Row) {
  let tags: unknown = row.tags;
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  const dbPublished = textValue(row.status) === 'published';
  const displayStatus = textValue(row.display_status,
    dbPublished ? 'published' : 'soon');
  return {
    id: numberValue(row.id),
    slug: textValue(row.slug),
    title: textValue(row.title),
    excerpt: textValue(row.excerpt),
    description: textValue(row.description),
    category: textValue(row.category, 'وب‌سایت'),
    tags: Array.isArray(tags) ? tags.map((tag) => textValue(tag)).filter(Boolean) : [],
    cover: textValue(row.cover),
    preview_webp: textValue(row.preview_webp),
    preview: textValue(row.preview_webp) || textValue(row.cover),
    live_url: textValue(row.live_url),
    liveUrl: textValue(row.live_url),
    status: ['published', 'conceptual', 'soon'].includes(displayStatus) ? displayStatus : (dbPublished ? 'published' : 'soon'),
    sort_order: numberValue(row.sort_order, 100),
    sort: numberValue(row.sort_order, 100),
    published: dbPublished,
  };
}

/** نمونه‌کارهای منتشرشده برای صفحات عمومی */
export async function getPortfolio() {
  return (await queryPortfolio()).map(mapPortfolio).filter((item) => item.published);
}

/** همه نمونه‌کارها برای پنل مدیریت */
export async function listAdminPortfolio() {
  return (await queryPortfolio()).map(mapPortfolio);
}

export async function upsertPortfolio(item: {
  slug: string; title: string; excerpt: string; description: string;
  category: string; tags: string[]; cover: string; preview_webp: string;
  live_url: string; status: string; sort_order: number; published: boolean;
}) {
  const displayStatus = ['published', 'conceptual', 'soon'].includes(item.status) ? item.status : 'soon';
  const dbStatus = item.published ? 'published' : 'draft';
  await q(
    `INSERT INTO projects
       (title, slug, category, summary, content, cover_image, tags, url,
        sort_order, status, preview_webp, display_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       category = EXCLUDED.category,
       summary = EXCLUDED.summary,
       content = EXCLUDED.content,
       cover_image = EXCLUDED.cover_image,
       tags = EXCLUDED.tags,
       url = EXCLUDED.url,
       sort_order = EXCLUDED.sort_order,
       status = EXCLUDED.status,
       preview_webp = EXCLUDED.preview_webp,
       display_status = EXCLUDED.display_status,
       updated_at = now()`,
    [
      textValue(item.title).slice(0, 200),
      textValue(item.slug).slice(0, 120),
      textValue(item.category, 'وب‌سایت').slice(0, 80),
      textValue(item.excerpt).slice(0, 600),
      textValue(item.description).slice(0, 12000),
      textValue(item.cover).slice(0, 300),
      JSON.stringify(Array.isArray(item.tags) ? item.tags.slice(0, 12) : []),
      textValue(item.live_url).slice(0, 400),
      numberValue(item.sort_order, 100),
      dbStatus,
      textValue(item.preview_webp).slice(0, 300),
      displayStatus,
    ],
  );
}

export async function deletePortfolio(slug: string) {
  await q('DELETE FROM projects WHERE slug = $1', [textValue(slug).slice(0, 120)]);
}

/** پیام‌های جدول messages موجود در دیتابیس فعلی */
export async function listMessages() {
  return q<Row>(
    `SELECT id, name, email, phone, plan_title AS service,
            type AS kind, message, status,
            (status <> 'new') AS is_read, created_at
       FROM messages
      WHERE status <> 'archived'
      ORDER BY created_at DESC
      LIMIT 200`
  );
}

export async function markMessageRead(id: number) {
  await q("UPDATE messages SET status = 'read' WHERE id = $1 AND status = 'new'", [id]);
}

export async function adminStats() {
  const rows = await q<Row>(`SELECT
    (SELECT COUNT(*) FROM posts WHERE status='published') AS posts,
    (SELECT COUNT(*) FROM posts WHERE status='draft') AS draft_posts,
    (SELECT COUNT(*) FROM posts WHERE status='scheduled') AS scheduled_posts,
    (SELECT COUNT(*) FROM pages WHERE status='published') AS published_pages,
    (SELECT COUNT(*) FROM projects WHERE status='published') AS portfolio,
    (SELECT COUNT(*) FROM messages WHERE status<>'archived') AS messages,
    (SELECT COUNT(*) FROM messages WHERE status='new') AS unread`);
  const row = rows[0] || {};
  return {
    posts:numberValue(row.posts), draftPosts:numberValue(row.draft_posts),
    scheduledPosts:numberValue(row.scheduled_posts), publishedPages:numberValue(row.published_pages),
    portfolio:numberValue(row.portfolio), messages:numberValue(row.messages), unread:numberValue(row.unread),
  };
}
