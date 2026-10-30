import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute, l as Fragment, u as unescapeHTML } from '../chunks/astro/server_MgY3MZI1.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../chunks/SiteLayout_s-5jOYM5.mjs';
import { g as getPublicArticles, C as CATS, p as postCardHtml, f as fa } from '../chunks/ssr-articles_CRwJfqYa.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://cdanesh.ir");
const prerender = false;
const $$Blog = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Blog;
  const title = "\u0645\u062C\u0644\u0647 \u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634 | \u0645\u0642\u0627\u0644\u0627\u062A \u062A\u062E\u0635\u0635\u06CC \u0637\u0631\u0627\u062D\u06CC \u0633\u0627\u06CC\u062A\u060C \u0633\u0626\u0648 \u0648 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC";
  const description = "\u0645\u0642\u0627\u0644\u0627\u062A \u062A\u062E\u0635\u0635\u06CC \u0637\u0631\u0627\u062D\u06CC \u0633\u0627\u06CC\u062A\u060C \u0633\u0626\u0648\u060C \u062A\u0648\u0644\u06CC\u062F \u0645\u062D\u062A\u0648\u0627\u060C \u0633\u0631\u0639\u062A \u0648 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u2014 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0633\u0627\u062F\u0647\u060C \u0628\u062F\u0648\u0646 \u0627\u063A\u0631\u0627\u0642 \u0648 \u0628\u0627 \u06A9\u0627\u0631\u0628\u0631\u062F \u0639\u0645\u0644\u06CC \u0628\u0631\u0627\u06CC \u06A9\u0633\u0628\u200C\u0648\u06A9\u0627\u0631 \u0634\u0645\u0627.";
  const canonical = "https://cdanesh.ir/blog";
  const posts = await getPublicArticles();
  const PER = 6;
  const params = Astro2.url.searchParams;
  const cat = CATS.some((c) => c.key === params.get("cat")) ? params.get("cat") : "all";
  let page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const filtered = cat === "all" ? posts : posts.filter((a) => a.cat === cat);
  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  if (page > pages) page = pages;
  const slice = filtered.slice((page - 1) * PER, page * PER);
  cat === "all" ? "\u0645\u0642\u0627\u0644\u0627\u062A" : (CATS.find((c) => c.key === cat) || {}).label || "\u0645\u0642\u0627\u0644\u0627\u062A";
  const pageUrl = (n) => {
    const q = [];
    if (cat !== "all") q.push("cat=" + cat);
    if (n > 1) q.push("page=" + n);
    return "/blog" + (q.length ? "?" + q.join("&") : "");
  };
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": title, "description": description, "canonical": canonical }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="page-hero"> <div class="wrap"> <nav class="breadcrumb" aria-label="مسیر صفحه"> <a href="/">خانه</a> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg> <span>مجله</span> </nav> <span class="eyebrow">مجله کافه‌دانش</span> <h1 class="h1">دانش دیجیتال، <span class="gold">به زبان ساده</span></h1> <p class="lead">مقالات تخصصی طراحی سایت، سئو، تولید محتوا و هوش مصنوعی — بدون اغراق و پیچیدگی غیرضروری.</p> </div> </section> <section class="section-tight"> <div class="wrap"> <!-- ابزار جست‌وجو و دسته‌بندی — دکمه‌های دسته از دادهٔ واقعی مقالات ساخته می‌شوند --> <div class="blog-tools"> <div class="blog-search"> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg> <input class="control" id="blog-search" type="search" placeholder="جست‌وجو در مقالات…" aria-label="جست‌وجو در مقالات"> </div> <div class="blog-cats" role="group" aria-label="دسته‌بندی مقالات"> ${CATS.map((c) => renderTemplate`<button type="button"${addAttribute(c.key, "data-cat")}${addAttribute(c.key === cat ? "active" : "", "class")}>${c.label}</button>`)} </div> </div> <!-- فهرست مقالات در HTML واقعی صفحه — بدون نیاز به جاوااسکریپت، قابل خزش برای گوگل --> <div class="posts-grid" id="posts-grid" aria-live="polite"> ${slice.map((a, i) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(postCardHtml(a, i % 3))}` })}`)} </div> <div class="blog-empty" id="blog-empty" style="display:none"> <p>مقاله‌ای با این مشخصات پیدا نشد؛ عبارت دیگری امتحان کنید یا دسته‌بندی را عوض کنید.</p> </div> <nav class="pagination" id="blog-pagination" aria-label="صفحه‌بندی مقالات"> ${pages > 1 && (page > 1 ? renderTemplate`<a${addAttribute(pageUrl(page - 1), "href")}${addAttribute(page - 1, "data-page")} aria-label="صفحه قبل">→</a>` : null)} ${pages > 1 && Array.from({ length: pages }, (_, i) => i + 1).map((n) => n === page ? renderTemplate`<span class="current" aria-current="page">${fa(n)}</span>` : renderTemplate`<a${addAttribute(pageUrl(n), "href")}${addAttribute(n, "data-page")}${addAttribute("\u0635\u0641\u062D\u0647 " + fa(n), "aria-label")}>${fa(n)}</a>`)} ${pages > 1 && page < pages ? renderTemplate`<a${addAttribute(pageUrl(page + 1), "href")}${addAttribute(page + 1, "data-page")} aria-label="صفحه بعد">←</a>` : null} </nav> </div> </section> ` })}`;
}, "/home/z/my-project/download/cdanesh-astro/src/pages/blog.astro", void 0);

const $$file = "/home/z/my-project/download/cdanesh-astro/src/pages/blog.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Blog,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
