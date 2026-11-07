// کمکی‌های SEO — متا، canonical، JSON-LD
import { SITE } from './content';

export function siteUrl(path = ''): string {
  const normalized = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${SITE.url}${normalized}`;
}

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  noindex?: boolean;
  publishedTime?: string;
}

export function ogImage(meta: PageMeta): string {
  if (meta.image) return meta.image.startsWith('http') ? meta.image : SITE.url + meta.image;
  return `${SITE.url}/img/og-default.webp`;
}

export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: 'کافه دانش',
    alternateName: 'Cafe Danesh',
    url: SITE.url,
    logo: `${SITE.url}/img/logo.svg`,
    description: 'کافه دانش (Cafe Danesh) با تمرکز بر طراحی سایت اختصاصی و تولید محتوای تخصصی فعالیت می‌کند؛ خدمات سئو نیز برای بهبود دیده‌شدن سایت ارائه می‌شود.',
    email: SITE.email,
    telephone: SITE.phoneIntl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'بوشهر',
      streetAddress: SITE.address,
      addressCountry: 'IR',
    },
    areaServed: [
      { '@type': 'City', name: 'بوشهر' },
      { '@type': 'Country', name: 'ایران' },
    ],
    knowsAbout: [
      'طراحی سایت شرکتی و فروشگاهی',
      'تولید محتوای تخصصی وب‌سایت',
      'سئوی فنی و محتوایی',
      'بهینه‌سازی سرعت وب‌سایت',
    ],
  };
}

export function jsonLdWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: 'کافه دانش',
    inLanguage: 'fa-IR',
    publisher: { '@id': `${SITE.url}/#organization` },
  };
}

export function jsonLdBreadcrumb(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.url}`,
    })),
  };
}

export function jsonLdArticle(p: {
  title: string; description: string; path: string; image: string;
  datePublished: string; dateFa: string; readMinutes: number; category: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    image: p.image.startsWith('http') ? p.image : SITE.url + p.image,
    datePublished: p.datePublished || undefined,
    inLanguage: 'fa-IR',
    articleSection: p.category,
    timeRequired: `PT${p.readMinutes}M`,
    author: { '@type': 'Organization', name: 'کافه دانش', url: SITE.url },
    publisher: { '@id': `${SITE.url}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE.url}${p.path}` },
  };
}

export function jsonLdService(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${SITE.url}${path}`,
    provider: { '@id': `${SITE.url}/#organization` },
    areaServed: { '@type': 'Country', name: 'Iran' },
  };
}

export function jsonLdFaq(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}
