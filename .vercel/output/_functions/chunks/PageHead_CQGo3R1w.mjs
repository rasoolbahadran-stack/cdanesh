import { e as createAstro, f as createComponent, h as addAttribute, r as renderTemplate, k as renderComponent, n as renderSlot, o as renderHead, l as Fragment, u as unescapeHTML } from './astro/server_MgY3MZI1.mjs';
import 'piccolore';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://cdanesh.ir");
const $$PageHead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$PageHead;
  const {
    title,
    description = "",
    canonical = "",
    og,
    schemas = true,
    robots = ""
  } = Astro2.props;
  const showOg = og ?? Boolean(canonical);
  const ORG = JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", "name": "\u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634", "alternateName": "Cdanesh Studio", "url": "https://cdanesh.ir/", "logo": "https://cdanesh.ir/assets/img/logo.svg", "email": "info@cdanesh.ir", "telephone": "+98-916-580-6207", "address": { "@type": "PostalAddress", "streetAddress": "\u062E\u06CC\u0627\u0628\u0627\u0646 \u0634\u0647\u06CC\u062F \u0631\u062C\u0627\u06CC\u06CC", "addressLocality": "\u0628\u0648\u0634\u0647\u0631", "addressCountry": "IR" }, "sameAs": ["https://github.com/rasoolbahadran-stack"], "founder": { "@type": "Person", "name": "\u0631\u0633\u0648\u0644 \u0628\u0647\u0627\u062F\u0631\u0627\u0646", "jobTitle": "\u0637\u0631\u0627\u062D \u0648 \u062A\u0648\u0633\u0639\u0647\u200C\u062F\u0647\u0646\u062F\u0647 \u0648\u0628\u200C\u0633\u0627\u06CC\u062A", "telephone": "+98-916-580-6207", "address": { "@type": "PostalAddress", "addressLocality": "\u0628\u0648\u0634\u0647\u0631", "addressCountry": "IR" }, "url": "https://www.cdanesh.ir", "sameAs": ["https://github.com/rasoolbahadran-stack"] } });
  const SITE = JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", "name": "\u06A9\u0627\u0641\u0647\u200C\u062F\u0627\u0646\u0634", "url": "https://cdanesh.ir/", "inLanguage": "fa-IR" });
  return renderTemplate`<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>${description ? renderTemplate`<meta name="description"${addAttribute(description, "content")}>` : null}${robots ? renderTemplate`<meta name="robots"${addAttribute(robots, "content")}>` : null}<link rel="icon" type="image/svg+xml" href="/assets/img/logo.svg"><link rel="apple-touch-icon" href="/assets/img/logo-180.png"><link rel="stylesheet" href="/assets/css/main.css"><link rel="stylesheet" href="/assets/css/components.css">${canonical ? renderTemplate`<link rel="canonical"${addAttribute(canonical, "href")}>` : null}${showOg && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate`<meta property="og:site_name" content="کافه‌دانش"><meta property="og:type" content="website"><meta property="og:locale" content="fa_IR"><meta property="og:title"${addAttribute(title, "content")}>${description ? renderTemplate`<meta property="og:description"${addAttribute(description, "content")}>` : null}${canonical ? renderTemplate`<meta property="og:url"${addAttribute(canonical, "content")}>` : null}<meta property="og:image" content="https://cdanesh.ir/assets/img/og-default.webp"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"${addAttribute(title, "content")}>${description ? renderTemplate`<meta name="twitter:description"${addAttribute(description, "content")}>` : null}` })}`}${schemas && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate(_a || (_a = __template(['<script type="application/ld+json" data-cd-org>', '<\/script><script type="application/ld+json" data-cd-site>', "<\/script>"])), unescapeHTML(ORG), unescapeHTML(SITE)) })}`}${renderSlot($$result, $$slots["default"])}${renderHead()}</head>`;
}, "/home/z/my-project/download/cdanesh-astro/src/components/PageHead.astro", void 0);

export { $$PageHead as $ };
