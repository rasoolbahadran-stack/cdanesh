import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_MgY3MZI1.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../chunks/SiteLayout_s-5jOYM5.mjs';
import { g as getPublicArticles, b as bySlugFrom } from '../chunks/ssr-articles_CRwJfqYa.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://cdanesh.ir");
const prerender = false;
const $$Article = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Article;
  const params = Astro2.url.searchParams;
  const slug = params.get("slug") || "";
  if (slug) {
    const posts = await getPublicArticles();
    const pub = bySlugFrom(posts, slug);
    if (pub) {
      return Astro2.redirect("/blog/" + slug, 301);
    }
  }
  const title = "\u067E\u06CC\u0634\u200C\u0646\u0645\u0627\u06CC\u0634 \u0645\u0642\u0627\u0644\u0647 | \u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634";
  const description = "";
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": title, "description": description, "robots": "noindex, nofollow", "mainId": "article-root" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<noscript> <div class="wrap" style="padding:160px 20px 60px; text-align:center"> <p>برای مشاهده پیش‌نمایش مقاله، لطفاً جاوااسکریپت مرورگر را فعال کنید.</p> <a class="btn btn-gold" href="/blog">مشاهده فهرست مقالات</a> </div> </noscript> ` })}`;
}, "/home/z/my-project/download/cdanesh-astro/src/pages/article.astro", void 0);

const $$file = "/home/z/my-project/download/cdanesh-astro/src/pages/article.astro";
const $$url = "/article";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Article,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
