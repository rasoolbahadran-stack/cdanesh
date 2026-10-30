import { e as createAstro, f as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_MgY3MZI1.mjs';
import 'piccolore';
import { $ as $$ProsePage } from '../chunks/ProsePage_C0ksaAPr.mjs';
import { g as getPublicPages, p as pageBySlug } from '../chunks/ssr-pages_DOwrjuTY.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://cdanesh.ir");
const prerender = false;
const $$Terms = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Terms;
  const pages = await getPublicPages();
  const page = pageBySlug(pages, "terms");
  if (!page) {
    return Astro2.redirect("/404");
  }
  return renderTemplate`${renderComponent($$result, "ProsePage", $$ProsePage, { "page": page, "canonical": "https://cdanesh.ir/terms" })}`;
}, "/home/z/my-project/download/cdanesh-astro/src/pages/terms.astro", void 0);

const $$file = "/home/z/my-project/download/cdanesh-astro/src/pages/terms.astro";
const $$url = "/terms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Terms,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
