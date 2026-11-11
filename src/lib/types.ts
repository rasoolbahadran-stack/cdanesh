// انواع داده مشترک کافه دانش
export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover: string;
  date: string;
  dateFa: string;
  readMinutes: number;
  blocks: Block[];
}

export interface Service {
  slug: string;
  title: string;
  seoTitle?: string;
  group: string;
  cover: string;
  excerpt: string;
  blocks: Block[];
}

export interface PortfolioItem {
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  category: string;
  tags: string[];
  cover: string;
  preview: string;
  liveUrl: string;
  status: 'published' | 'conceptual' | 'soon';
  sort: number;
}

export interface FaqItem { q: string; a: string; }

export type Block =
  | { t: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'blockquote' | 'html'; x: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'table'; rows: string[][] }
  | { t: 'img'; src: string; alt: string };

export interface PageDoc {
  title: string;
  meta: string;
  blocks: Block[];
}

export const pfStatusLabel: Record<PortfolioItem['status'], string> = {
  published: 'نسخه زنده منتشر شده',
  conceptual: 'نمونه مفهومی',
  soon: 'در انتظار انتشار',
};
