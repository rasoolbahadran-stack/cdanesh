import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, l as Fragment, u as unescapeHTML, h as addAttribute } from './astro/server_MgY3MZI1.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from './SiteLayout_s-5jOYM5.mjs';
import { t as tocFrom, a as renderBlocks } from './ssr-articles_CRwJfqYa.mjs';

const $$Astro = createAstro("https://cdanesh.ir");
const $$ProsePage = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProsePage;
  const { page, canonical, robots = "" } = Astro2.props;
  const title = page.seoTitle || page.title + " | \u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634";
  const description = page.seoDesc || page.lead || "";
  const toc = tocFrom(page.blocks);
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": title, "description": description, "canonical": canonical, "robots": robots }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="page-hero"> <div class="wrap"> <nav class="breadcrumb" aria-label="مسیر صفحه"> <a href="/">خانه</a> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg> <span>${page.eyebrow || page.title}</span> </nav> <span class="eyebrow">${page.eyebrow || "\u0635\u0641\u062D\u0647"}</span> <h1 class="h1">${page.title}</h1> ${page.lead && renderTemplate`<p class="lead">${page.lead}</p>`} </div> </section> <section class="section-tight"> <div class="wrap" style="max-width:880px"> <div class="prose" style="padding-top:10px"> ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": ($$result3) => renderTemplate`${unescapeHTML(renderBlocks(page.blocks))}` })} </div> ${toc.length > 2 && renderTemplate`<div class="aside-card" style="margin-top:44px"> <b>در این صفحه</b> <nav class="toc" aria-label="فهرست مطالب"> ${toc.map((sh) => renderTemplate`<a${addAttribute("#" + sh.id, "href")}${addAttribute(sh.level === 3 ? "toc-l3" : "", "class")}>${sh.t}</a>`)} </nav> </div>`} </div> </section> ` })}`;
}, "/home/z/my-project/download/cdanesh-astro/src/components/ProsePage.astro", void 0);

export { $$ProsePage as $ };
