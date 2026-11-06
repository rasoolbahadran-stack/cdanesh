// لایه دیتابیس Neon — در نبود DATABASE_URL غیرفعال است و سایت از داده‌های محلی استفاده می‌کند.
// نکته: اگر ساختار دیتابیس فعلی کافه دانش متفاوت است، کوئری‌های این فایل را مطابق همان تطبیق دهید.
import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon> | null = null;

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!sql) {
    try {
      sql = neon(url);
    } catch {
      sql = null;
    }
  }
  return sql;
}

export function dbAvailable(): boolean {
  return Boolean(client());
}

export interface DbPost {
  slug: string; title: string; excerpt: string; content: string;
  category: string; cover: string; read_minutes: number;
  published: boolean; published_at: string; blocks?: unknown[];
}

export async function getPosts(): Promise<DbPost[]> {
  const c = client();
  if (!c) return [];
  const rows = await c`
    SELECT slug, title, excerpt, content, category, cover, read_minutes, published, published_at
    FROM posts WHERE published = true ORDER BY published_at DESC`;
  return rows as unknown as DbPost[];
}

export interface DbPortfolio {
  slug: string; title: string; excerpt: string; description: string;
  category: string; tags: string[]; cover: string; preview_webp: string;
  live_url: string; status: string; sort_order: number; published: boolean;
}

export async function getPortfolio(): Promise<DbPortfolio[]> {
  const c = client();
  if (!c) return [];
  const rows = await c`
    SELECT slug, title, excerpt, description, category, tags, cover,
           preview_webp, live_url, status, sort_order, published
    FROM portfolio WHERE published = true ORDER BY sort_order ASC`;
  return rows as unknown as DbPortfolio[];
}

export async function insertMessage(kind: string, data: {
  name: string; phone?: string; email?: string; service?: string; message?: string; meta?: object;
}): Promise<boolean> {
  const c = client();
  if (!c) return false;
  await c`
    INSERT INTO messages (kind, name, phone, email, service, message, meta)
    VALUES (${kind}, ${data.name}, ${data.phone ?? ''}, ${data.email ?? ''}, ${data.service ?? ''}, ${data.message ?? ''},
            ${JSON.stringify(data.meta ?? {})}::jsonb)`;
  return true;
}

export async function listMessages() {
  const c = client();
  if (!c) return [];
  const rows = await c`SELECT * FROM messages ORDER BY created_at DESC LIMIT 200`;
  return rows as unknown as Array<Record<string, unknown>>;
}

export async function markMessageRead(id: number) {
  const c = client();
  if (!c) return;
  await c`UPDATE messages SET is_read = true WHERE id = ${id}`;
}

// CRUD مقالات — پنل مدیریت
export async function upsertPost(p: {
  slug: string; title: string; excerpt: string; content: string;
  category: string; cover: string; read_minutes: number; published: boolean;
}) {
  const c = client();
  if (!c) throw new Error('DATABASE_URL تنظیم نشده است');
  await c`
    INSERT INTO posts (slug, title, excerpt, content, category, cover, read_minutes, published, published_at)
    VALUES (${p.slug}, ${p.title}, ${p.excerpt}, ${p.content}, ${p.category}, ${p.cover},
            ${p.read_minutes}, ${p.published}, now())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
      category = EXCLUDED.category, cover = EXCLUDED.cover,
      read_minutes = EXCLUDED.read_minutes, published = EXCLUDED.published,
      updated_at = now()`;
}

export async function deletePost(slug: string) {
  const c = client();
  if (!c) throw new Error('DATABASE_URL تنظیم نشده است');
  await c`DELETE FROM posts WHERE slug = ${slug}`;
}

// CRUD نمونه‌کار — پنل مدیریت
export async function upsertPortfolio(p: {
  slug: string; title: string; excerpt: string; description: string;
  category: string; tags: string[]; cover: string; preview_webp: string;
  live_url: string; status: string; sort_order: number; published: boolean;
}) {
  const c = client();
  if (!c) throw new Error('DATABASE_URL تنظیم نشده است');
  await c`
    INSERT INTO portfolio (slug, title, excerpt, description, category, tags, cover, preview_webp, live_url, status, sort_order, published)
    VALUES (${p.slug}, ${p.title}, ${p.excerpt}, ${p.description}, ${p.category}, ${p.tags}, ${p.cover},
            ${p.preview_webp}, ${p.live_url}, ${p.status}, ${p.sort_order}, ${p.published})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, description = EXCLUDED.description,
      category = EXCLUDED.category, tags = EXCLUDED.tags, cover = EXCLUDED.cover,
      preview_webp = EXCLUDED.preview_webp, live_url = EXCLUDED.live_url,
      status = EXCLUDED.status, sort_order = EXCLUDED.sort_order,
      published = EXCLUDED.published, updated_at = now()`;
}

export async function deletePortfolio(slug: string) {
  const c = client();
  if (!c) throw new Error('DATABASE_URL تنظیم نشده است');
  await c`DELETE FROM portfolio WHERE slug = ${slug}`;
}

export async function adminStats() {
  const c = client();
  if (!c) return { posts: 0, portfolio: 0, messages: 0, unread: 0 };
  const r = await c`
    SELECT
      (SELECT COUNT(*) FROM posts) AS posts,
      (SELECT COUNT(*) FROM portfolio) AS portfolio,
      (SELECT COUNT(*) FROM messages) AS messages,
      (SELECT COUNT(*) FROM messages WHERE is_read = false) AS unread`;
  const row = (r[0] ?? {}) as Record<string, string>;
  return {
    posts: Number(row.posts || 0),
    portfolio: Number(row.portfolio || 0),
    messages: Number(row.messages || 0),
    unread: Number(row.unread || 0),
  };
}
