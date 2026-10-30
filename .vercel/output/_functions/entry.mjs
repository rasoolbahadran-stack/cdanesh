import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_FU1WU8Yd.mjs';
import { manifest } from './manifest_E5O7zC3B.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/404.astro.mjs');
const _page2 = () => import('./pages/about.astro.mjs');
const _page3 = () => import('./pages/admin.astro.mjs');
const _page4 = () => import('./pages/admin-dashboard.astro.mjs');
const _page5 = () => import('./pages/admin-login.astro.mjs');
const _page6 = () => import('./pages/ai-solutions.astro.mjs');
const _page7 = () => import('./pages/api/articles.astro.mjs');
const _page8 = () => import('./pages/api/login.astro.mjs');
const _page9 = () => import('./pages/api/media.astro.mjs');
const _page10 = () => import('./pages/api/messages.astro.mjs');
const _page11 = () => import('./pages/api/pages.astro.mjs');
const _page12 = () => import('./pages/api/payments.astro.mjs');
const _page13 = () => import('./pages/article.astro.mjs');
const _page14 = () => import('./pages/blog/_slug_.astro.mjs');
const _page15 = () => import('./pages/blog.astro.mjs');
const _page16 = () => import('./pages/contact.astro.mjs');
const _page17 = () => import('./pages/content-production.astro.mjs');
const _page18 = () => import('./pages/e-commerce.astro.mjs');
const _page19 = () => import('./pages/faq.astro.mjs');
const _page20 = () => import('./pages/p/_slug_.astro.mjs');
const _page21 = () => import('./pages/portfolio.astro.mjs');
const _page22 = () => import('./pages/portfolio-arman.astro.mjs');
const _page23 = () => import('./pages/portfolio-daneshvar.astro.mjs');
const _page24 = () => import('./pages/portfolio-goldast.astro.mjs');
const _page25 = () => import('./pages/portfolio-mehr.astro.mjs');
const _page26 = () => import('./pages/portfolio-negar.astro.mjs');
const _page27 = () => import('./pages/portfolio-rosa.astro.mjs');
const _page28 = () => import('./pages/privacy.astro.mjs');
const _page29 = () => import('./pages/request.astro.mjs');
const _page30 = () => import('./pages/seo.astro.mjs');
const _page31 = () => import('./pages/services.astro.mjs');
const _page32 = () => import('./pages/sitemap.xml.astro.mjs');
const _page33 = () => import('./pages/speed-optimization.astro.mjs');
const _page34 = () => import('./pages/support.astro.mjs');
const _page35 = () => import('./pages/terms.astro.mjs');
const _page36 = () => import('./pages/uiux.astro.mjs');
const _page37 = () => import('./pages/web-design.astro.mjs');
const _page38 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/404.astro", _page1],
    ["src/pages/about.astro", _page2],
    ["src/pages/admin.astro", _page3],
    ["src/pages/admin-dashboard.astro", _page4],
    ["src/pages/admin-login.astro", _page5],
    ["src/pages/ai-solutions.astro", _page6],
    ["src/pages/api/articles.js", _page7],
    ["src/pages/api/login.js", _page8],
    ["src/pages/api/media.js", _page9],
    ["src/pages/api/messages.js", _page10],
    ["src/pages/api/pages.js", _page11],
    ["src/pages/api/payments.js", _page12],
    ["src/pages/article.astro", _page13],
    ["src/pages/blog/[slug].astro", _page14],
    ["src/pages/blog.astro", _page15],
    ["src/pages/contact.astro", _page16],
    ["src/pages/content-production.astro", _page17],
    ["src/pages/e-commerce.astro", _page18],
    ["src/pages/faq.astro", _page19],
    ["src/pages/p/[slug].astro", _page20],
    ["src/pages/portfolio.astro", _page21],
    ["src/pages/portfolio-arman.astro", _page22],
    ["src/pages/portfolio-daneshvar.astro", _page23],
    ["src/pages/portfolio-goldast.astro", _page24],
    ["src/pages/portfolio-mehr.astro", _page25],
    ["src/pages/portfolio-negar.astro", _page26],
    ["src/pages/portfolio-rosa.astro", _page27],
    ["src/pages/privacy.astro", _page28],
    ["src/pages/request.astro", _page29],
    ["src/pages/seo.astro", _page30],
    ["src/pages/services.astro", _page31],
    ["src/pages/sitemap.xml.ts", _page32],
    ["src/pages/speed-optimization.astro", _page33],
    ["src/pages/support.astro", _page34],
    ["src/pages/terms.astro", _page35],
    ["src/pages/uiux.astro", _page36],
    ["src/pages/web-design.astro", _page37],
    ["src/pages/index.astro", _page38]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "4fc61da9-991b-49c7-baf8-847ddb8958ce",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
