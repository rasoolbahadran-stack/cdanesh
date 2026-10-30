import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, u as unescapeHTML, l as Fragment, h as addAttribute, m as maybeRenderHead } from '../../chunks/astro/server_MgY3MZI1.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../../chunks/SiteLayout_s-5jOYM5.mjs';
import { g as getPublicArticles, b as bySlugFrom, t as tocFrom, r as relatedFrom, p as postCardHtml, a as renderBlocks, f as fa } from '../../chunks/ssr-articles_CRwJfqYa.mjs';
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a, _b;
const $$Astro = createAstro("https://cdanesh.ir");
const prerender = false;
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const posts = await getPublicArticles();
  const a = bySlugFrom(posts, slug || "");
  if (!a) {
    return Astro2.redirect("/blog");
  }
  const title = a.seoTitle || a.title + " | \u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634";
  const description = a.seoDesc || a.excerpt;
  const canonical = "https://cdanesh.ir/blog/" + a.slug;
  const url = canonical;
  const toc = tocFrom(a.blocks);
  const related = relatedFrom(posts, a, 3);
  const shareUrl = url, shareTxt = a.title;
  const AUTHOR_ROLE = "\u0637\u0631\u0627\u062D \u0648 \u062A\u0648\u0633\u0639\u0647\u200C\u062F\u0647\u0646\u062F\u0647\u0654 \u0648\u0628 \u0648 \u0645\u062A\u062E\u0635\u0635 \u0633\u0626\u0648";
  const authorName = !a.author || a.author === "\u062A\u06CC\u0645 \u0645\u062D\u062A\u0648\u0627\u06CC \u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634" ? "\u0631\u0633\u0648\u0644 \u0628\u0647\u0627\u062F\u0631\u0627\u0646" : a.author;
  const isPerson = authorName === "\u0631\u0633\u0648\u0644 \u0628\u0647\u0627\u062F\u0631\u0627\u0646";
  const s = String(a.sort || "");
  const isoDate = s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T08:00:00+03:30` : void 0;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description,
    image: "https://cdanesh.ir" + a.cover,
    inLanguage: "fa-IR",
    ...isoDate ? { datePublished: isoDate, dateModified: isoDate } : {},
    author: isPerson ? { "@type": "Person", name: authorName, jobTitle: AUTHOR_ROLE, url: "https://cdanesh.ir/about" } : { "@type": "Organization", name: authorName },
    publisher: { "@type": "Organization", name: "\u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634", url: "https://cdanesh.ir" },
    mainEntityOfPage: url
  };
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "\u062E\u0627\u0646\u0647", item: "https://cdanesh.ir/" },
      { "@type": "ListItem", position: 2, name: "\u0645\u062C\u0644\u0647", item: "https://cdanesh.ir/blog" },
      { "@type": "ListItem", position: 3, name: a.title, item: url }
    ]
  };
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": title, "description": description, "canonical": canonical }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template(["   ", '<section class="article-hero"> <div class="wrap"><div class="article-hero-grid"> <div class="article-head"> <nav class="breadcrumb" aria-label="\u0645\u0633\u06CC\u0631 \u0635\u0641\u062D\u0647"> <a href="/">\u062E\u0627\u0646\u0647</a> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg> <a href="/blog">\u0645\u062C\u0644\u0647</a> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg> <span>', '</span> </nav> <div class="article-cats"><span class="chip chip-gold">', "</span></div> <h1>", '</h1> <div class="article-meta"> <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"></rect><path d="M8 2v4m8-4v4M3 10h18"></path></svg> ', '</span> <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg> ', ' \u062F\u0642\u06CC\u0642\u0647 \u0645\u0637\u0627\u0644\u0639\u0647</span> <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7h-9m9 5h-9m9 5h-9M4 7l2 2-2 2m2 6 2 2-2 2"></path></svg> ', "", '</span> </div> </div> <div class="article-hero-cover"> <img', "", ' width="640" height="400" fetchpriority="high"> </div> </div></div> </section> <section class="section-tight" style="padding-top:10px"> <div class="wrap"><div class="split"> <article class="prose"> ', ' <div class="author-box"> <img src="/assets/img/founder-rasool.webp" alt="\u0631\u0633\u0648\u0644 \u0628\u0647\u0627\u062F\u0631\u0627\u0646 \u2014 \u0628\u0646\u06CC\u0627\u0646\u200C\u06AF\u0630\u0627\u0631 \u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634" width="56" height="56" loading="lazy"> <div> <b>', "</b> <span>", ' \u2014 \u0628\u0646\u06CC\u0627\u0646\u200C\u06AF\u0630\u0627\u0631 \u0627\u0633\u062A\u0648\u062F\u06CC\u0648\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644 \u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634 \u062F\u0631 \u0628\u0648\u0634\u0647\u0631</span> <a href="/about">\u0628\u06CC\u0634\u062A\u0631 \u062F\u0631\u0628\u0627\u0631\u0647\u0654 \u0646\u0648\u06CC\u0633\u0646\u062F\u0647 \u2190</a> </div> </div> <div class="share-row"><b>\u0627\u0634\u062A\u0631\u0627\u06A9\u200C\u06AF\u0630\u0627\u0631\u06CC:</b> <a id="share-tg"', ' target="_blank" rel="noopener" aria-label="\u0627\u0634\u062A\u0631\u0627\u06A9\u200C\u06AF\u0630\u0627\u0631\u06CC \u062F\u0631 \u062A\u0644\u06AF\u0631\u0627\u0645"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg></a> <a id="share-li"', ' target="_blank" rel="noopener" aria-label="\u0627\u0634\u062A\u0631\u0627\u06A9\u200C\u06AF\u0630\u0627\u0631\u06CC \u062F\u0631 \u0644\u06CC\u0646\u06A9\u062F\u06CC\u0646"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5A6 6 0 0 1 16 8Z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a> <button type="button" id="share-copy" aria-label="\u06A9\u067E\u06CC \u0644\u06CC\u0646\u06A9 \u0645\u0642\u0627\u0644\u0647"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"></path><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"></path></svg></button> <span class="copy-ok" id="copy-ok" hidden>\u0644\u06CC\u0646\u06A9 \u06A9\u067E\u06CC \u0634\u062F</span> </div> </article> <aside class="article-aside"> ', ' <div class="aside-card" style="background:linear-gradient(150deg,rgba(227,185,83,.14),rgba(227,185,83,.04)); border-color:rgba(227,185,83,.35)"> <b>\u067E\u0631\u0648\u0698\u0647 \u0645\u0634\u0627\u0628\u0647\u06CC \u062F\u0631 \u0630\u0647\u0646 \u062F\u0627\u0631\u06CC\u062F\u061F</b> <p class="muted" style="font-size:14px; margin-bottom:14px">\u062F\u0631 \u062C\u0644\u0633\u0647 \u06A9\u0648\u062A\u0627\u0647 \u0645\u0634\u0627\u0648\u0631\u0647\u060C \u0646\u06CC\u0627\u0632 \u0634\u0645\u0627 \u0628\u0631\u0631\u0633\u06CC \u0648 \u0645\u0633\u06CC\u0631 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC \u0627\u0631\u0627\u0626\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.</p> <a class="btn btn-gold btn-block" href="/request">\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0634\u0627\u0648\u0631\u0647 \u0631\u0627\u06CC\u06AF\u0627\u0646</a> </div> </aside> </div> ', ' <div style="margin-top:70px"> <div class="section-head side" style="margin-bottom:30px"><h2 class="h3">\u0645\u0642\u0627\u0644\u0627\u062A \u0645\u0631\u062A\u0628\u0637</h2></div> <div class="posts-grid" id="article-related"> ', " </div> </div> </div> </section> <script>\n  (function () {\n    var cp = document.getElementById('share-copy');\n    if (cp) cp.addEventListener('click', function () {\n      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject())\n        .then(function () { var ok = document.getElementById('copy-ok'); if (ok) { ok.hidden = false; setTimeout(function () { ok.hidden = true; }, 2200); } })\n        .catch(function () {});\n    });\n    /* \u0627\u0633\u06A9\u0631\u0648\u0644\u200C\u0627\u0633\u067E\u0627\u06CC \u0641\u0647\u0631\u0633\u062A \u0645\u0637\u0627\u0644\u0628 \u2014 \u0647\u0627\u06CC\u0644\u0627\u06CC\u062A \u0628\u062E\u0634 \u0641\u0639\u0644\u06CC \u0647\u0646\u06AF\u0627\u0645 \u062E\u0648\u0627\u0646\u062F\u0646 */\n    var tocNav = document.getElementById('article-toc');\n    if (tocNav && 'IntersectionObserver' in window) {\n      var links = Array.prototype.slice.call(tocNav.querySelectorAll('a'));\n      var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);\n      var current = null;\n      var setActive = function (id) {\n        if (id === current) return;\n        current = id;\n        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });\n      };\n      var io = new IntersectionObserver(function (entries) {\n        entries.forEach(function (en) {\n          if (en.isIntersecting) setActive(en.target.id);\n        });\n      }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });\n      targets.forEach(function (t) { io.observe(t); });\n      window.addEventListener('scroll', function () {\n        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {\n          if (targets.length) setActive(targets[targets.length - 1].id);\n        }\n      }, { passive: true });\n    }\n  })();\n<\/script> "])), maybeRenderHead(), a.catLabel, a.catLabel, a.title, a.date, fa(a.read), authorName, isPerson && renderTemplate`<span class="author-role"> — ${AUTHOR_ROLE}</span>`, addAttribute(a.cover, "src"), addAttribute(a.coverAlt || a.title, "alt"), renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(renderBlocks(a.blocks))}` }), authorName, AUTHOR_ROLE, addAttribute(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTxt)}`, "href"), addAttribute(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "href"), toc.length > 1 && renderTemplate`<div class="aside-card toc-card"><b>فهرست مطالب</b> <nav class="toc" aria-label="فهرست مطالب مقاله" id="article-toc"> ${toc.map((sh) => renderTemplate`<a${addAttribute("#" + sh.id, "href")}${addAttribute(sh.level === 3 ? "toc-l3" : "", "class")}>${sh.t}</a>`)} </nav> </div>`, a.faq && a.faq.length > 0 && renderTemplate`<div style="margin-top:64px"> <div class="section-head side" style="margin-bottom:26px"><h2 class="h3">پرسش‌های متداول این مقاله</h2></div> <div class="faq-list" data-article-faq> ${a.faq.map((it) => renderTemplate`<div class="faq-item"> <button class="faq-q" aria-expanded="false">${it.q} <span class="fx" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg></span> </button> <div class="faq-a"><div>${it.a}</div></div> </div>`)} </div> </div>`, related.map((x, i) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(postCardHtml(x, i))}` })}`)), "head": async ($$result2) => renderTemplate(_b || (_b = __template(['<script type="application/ld+json">', '<\/script><script type="application/ld+json">', "<\/script>"])), unescapeHTML(JSON.stringify(articleLd)), unescapeHTML(JSON.stringify(crumbLd))) })}`;
}, "/home/z/my-project/download/cdanesh-astro/src/pages/blog/[slug].astro", void 0);

const $$file = "/home/z/my-project/download/cdanesh-astro/src/pages/blog/[slug].astro";
const $$url = "/blog/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
