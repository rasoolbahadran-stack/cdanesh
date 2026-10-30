import { g as getPublicArticles } from '../chunks/ssr-articles_CRwJfqYa.mjs';
import { g as getPublicPages } from '../chunks/ssr-pages_DOwrjuTY.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const STATIC_PATHS = [
  "",
  "/services",
  "/web-design",
  "/e-commerce",
  "/uiux",
  "/seo",
  "/content-production",
  "/speed-optimization",
  "/ai-solutions",
  "/support",
  "/portfolio",
  "/portfolio-arman",
  "/portfolio-mehr",
  "/portfolio-negar",
  "/portfolio-rosa",
  "/portfolio-goldast",
  "/portfolio-daneshvar",
  "/blog",
  "/faq",
  "/about",
  "/contact",
  "/request",
  "/privacy",
  "/terms"
];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const GET = async () => {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let articles = [];
  try {
    articles = await getPublicArticles();
  } catch {
    articles = [];
  }
  let pages = [];
  try {
    pages = (await getPublicPages()).filter((p) => p.slug !== "terms" && p.slug !== "privacy");
  } catch {
    pages = [];
  }
  const urls = STATIC_PATHS.map((p) => ({
    loc: "https://cdanesh.ir" + p,
    lastmod: today,
    cf: p === "" || p === "/blog" ? "daily" : "weekly"
  }));
  for (const pg of pages) {
    urls.push({
      loc: "https://cdanesh.ir/p/" + encodeURIComponent(pg.slug || ""),
      lastmod: today,
      cf: "monthly"
    });
  }
  for (const a of articles) {
    urls.push({
      loc: "https://cdanesh.ir/blog/" + encodeURIComponent(a.slug || ""),
      lastmod: today,
      cf: "monthly"
    });
  }
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(
    (u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.cf}</changefreq></url>`
  ).join("\n") + "\n</urlset>";
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
