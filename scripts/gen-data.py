#!/usr/bin/env python3
"""Generate structured data modules for the Astro project from crawled content."""
import re, json, os, html as H

FULL = "/tmp/cdanesh_full"
SITE = json.load(open("/tmp/site_content.json"))
OUT = "/home/z/my-project/cdanesh-site/src/data/content"
os.makedirs(OUT, exist_ok=True)

FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")

def txt(s): return H.unescape(re.sub(r"\s+", " ", s or "")).strip()

# ── 1) Blog listing metadata (category, date, read time) ──────────────
blog_meta = {}
for f in ["blog.html", "blog%page=2.html", "blog%page=3.html"]:
    p = f"{FULL}/{f}"
    if not os.path.exists(p): continue
    html = open(p, encoding="utf-8", errors="ignore").read()
    cards = re.findall(r'<article[^>]*>(.*?)</article>', html, re.S)
    for card in cards:
        href = re.search(r'href="/blog/([^"]+)"', card)
        if not href: continue
        slug = href.group(1)
        cat = re.search(r'class="[^"]*post-card__cat[^"]*"[^>]*>([^<]+)<', card)
        date = re.search(r'(\d+ \S+ \d{4})', card)
        mins = re.search(r'(\d+)\s*دقیقه', card)
        blog_meta[slug] = {
            "category": txt(cat.group(1)) if cat else "وب و سئو",
            "date_fa": txt(date.group(1)) if date else "",
            "read_minutes": int(mins.group(1)) if mins else 6,
        }
print("blog meta:", len(blog_meta))

# ── 2) Portfolio listing metadata (tags, categories) ─────────────────
pf_meta = {}
html = open(f"{FULL}/portfolio.html", encoding="utf-8", errors="ignore").read()
for card in re.findall(r'<a[^>]+href="/portfolio/([^"]+)"[^>]*class="pf-card"[^>]*>(.*?)</a>', html, re.S):
    slug, inner = card
    cat_attr = re.search(r'data-cat="([^"]+)"', inner)
    h3 = re.search(r'<h3[^>]*>(.*?)</h3>', inner, re.S)
    desc = re.search(r'<p[^>]*>(.*?)</p>', inner, re.S)
    tags = re.findall(r'<div class="pf-card__tags">\s*<span>(.*?)</span>', inner, re.S)
    pf_meta[slug] = {
        "tags": [txt(t) for t in tags][:6],
        "category": txt(cat_attr.group(1)) if cat_attr else "وب‌سایت",
        "desc": txt(desc.group(1)) if desc else "",
    }
print("pf meta:", len(pf_meta))

# ── 3) Portfolio live URLs ────────────────────────────────────────────
live = {
 "bazarino-astro": "https://bazarino-astro-lva12s6uw-rasoolbahadran-stacks-projects.vercel.app",
 "maison-mehr-astro": "https://maison-mehr-astro-qh6eqe6i7-rasoolbahadran-stacks-projects.vercel.app",
 "smarto-astro": "https://smarto-astro-qwg6y7jgh-rasoolbahadran-stacks-projects.vercel.app",
 "karino-job-portal-astro": "https://karino-job-portal-astro-rjzgu9cmo.vercel.app",
 "shoes-store": "https://shoes-store-l1jonvses-rasoolbahadran-stacks-projects.vercel.app",
 "smart-gadget-store": "https://smart-gadget-store-7sumgyr27-rasoolbahadran-stacks-projects.vercel.app",
 "mahpoosh-store": "https://mahpoosh-store-l7m677k0r-rasoolbahadran-stacks-projects.vercel.app",
 "simba-beauty-store": "https://simba-beauty-store-nsivjbi3o-rasoolbahadran-stacks-projects.vercel.app",
 "novinroshd-agency": "https://novinroshd-agency-l8g2njc35-rasoolbahadran-stacks-projects.vercel.app",
 "cdanesh-galaxy-source": "https://cdanesh-galaxy-source-5z1xo3ipb-rasoolbahadran-stacks-projects.vercel.app",
 "cdanesh-galaxe": "https://cdanesh-galaxe-i98bz8vz9-rasoolbahadran-stacks-projects.vercel.app",
}
conceptual = {"rosa-shop", "arman-holding", "negar-assistant"}
pf_covers = {
 "rosa-shop": "/img/pf-rosa.webp", "arman-holding": "/img/pf-arman.webp", "negar-assistant": "/img/pf-negar.webp",
 "bazarino-astro": "/img/pf/bazarino-astro.webp", "maison-mehr-astro": "/img/pf/maison-mehr-astro.webp",
 "smarto-astro": "/img/pf/smarto-astro.webp", "karino-job-portal-astro": "/img/pf/karino-job-portal-astro.webp",
 "shoes-store": "/img/pf/shoes-store.webp", "smart-gadget-store": "/img/pf/smart-gadget-store.webp",
 "mahpoosh-store": "/img/pf/mahpoosh-store.webp", "simba-beauty-store": "/img/pf/simba-beauty-store.webp",
 "novinroshd-agency": "/img/pf/novinroshd-agency.webp", "cdanesh-galaxy-source": "/img/pf/cdanesh-galaxy-source.webp",
 "cdanesh-galaxe": "/img/pf/cdanesh-galaxe.webp",
}

portfolio = []
order = ["bazarino-astro","maison-mehr-astro","shoes-store","smart-gadget-store","mahpoosh-store","simba-beauty-store","smarto-astro","karino-job-portal-astro","novinroshd-agency","cdanesh-galaxy-source","cdanesh-galaxe","rosa-shop","arman-holding","negar-assistant"]
for i, slug in enumerate(order):
    key = f"portfolio__{slug}"
    page = SITE.get(key) or SITE.get(f"portfolio__{slug.replace('-astro','')}")
    title, meta_desc, paras = "", "", []
    if page:
        title = re.sub(r"\s*\|\s*نمونه‌کار کافه دانش.*$", "", page.get("title", ""))
        meta_desc = page.get("meta", "")
        paras = [b["x"] for b in page.get("blocks", []) if b["t"] == "p"]
    if not title: title = slug
    # description = first meaningful paragraph excluding boilerplate
    desc = meta_desc
    long_desc = ""
    for p in paras:
        if "زیرساخت Vercel منتشر شده" in p or "پیوند شما را" in p or p.startswith("نمونه‌کارها"): continue
        if len(p) > 60: long_desc = p; break
    status = "conceptual" if slug in conceptual else "published"
    portfolio.append({
        "slug": slug, "title": title, "excerpt": desc, "description": long_desc or desc,
        "category": pf_meta.get(slug, {}).get("category", "وب‌سایت"),
        "tags": pf_meta.get(slug, {}).get("tags", []),
        "cover": pf_covers.get(slug, ""),
        "preview": pf_covers.get(slug, ""),
        "liveUrl": live.get(slug, ""),
        "status": status,
        "sort": i + 1,
    })
json.dump(portfolio, open(f"{OUT}/portfolio.json", "w"), ensure_ascii=False, indent=1)
print("portfolio:", len(portfolio))

# ── 4) Posts (28 articles, full blocks) ───────────────────────────────
posts = []
for key, page in SITE.items():
    m = re.match(r"blog__(.+)", key)
    if not m: continue
    slug = m.group(1)
    blocks = page.get("blocks", [])
    if not blocks: continue
    title = txt(blocks[0]["x"]) if blocks and blocks[0]["t"] == "h1" else page["title"]
    excerpt = page.get("meta", "")
    body = [b for b in blocks[1:] if not (b["t"] == "img" and b.get("src", "").endswith("logo.svg"))]
    cover = ""
    for b in body:
        if b["t"] == "img":
            cover = b["src"]; body.remove(b); break
    meta = blog_meta.get(slug, {})
    jsonld = page.get("jsonld", [])
    dt = ""
    for j in jsonld:
        if isinstance(j, dict) and j.get("@type") in ("BlogPosting", "Article"):
            dt = j.get("datePublished", "") or ""
    meta_info = blog_meta.get(slug, {})
    posts.append({
        "slug": slug, "title": title, "excerpt": excerpt,
        "category": meta_info.get("category", "وب و سئو"),
        "cover": cover, "date": dt,
        "dateFa": meta_info.get("date_fa", ""),
        "readMinutes": meta_info.get("read_minutes", 6),
        "blocks": body,
    })
# sort newest first by date
posts.sort(key=lambda p: p.get("date") or "", reverse=True)
json.dump(posts, open(f"{OUT}/posts.json", "w"), ensure_ascii=False, indent=1)
print("posts:", len(posts))

# ── 5) Services (8 pages) ─────────────────────────────────────────────
svc_meta = {
 "company-website": ("طراحی سایت شرکتی", "/img/svc-company.webp", "طراحی و توسعه وب"),
 "ecommerce": ("طراحی فروشگاه اینترنتی", "/img/svc-ecommerce.webp", "طراحی و توسعه وب"),
 "speed-optimization": ("بهینه‌سازی سرعت و عملکرد", "/img/svc-speed.webp", "سئو و تولید محتوا"),
 "ui-ux": ("طراحی رابط و تجربه کاربری", "/img/svc-uiux.webp", "طراحی و توسعه وب"),
 "seo": ("سئو تکنیکال و محتوایی", "/img/svc-seo.webp", "سئو و تولید محتوا"),
 "content": ("تولید مقالات سئومحور", "/img/svc-content.webp", "سئو و تولید محتوا"),
 "support": ("پشتیبانی و نگهداری سایت", "/img/svc-support.webp", "هوش مصنوعی و پشتیبانی"),
 "ai-automation": ("هوش مصنوعی و اتوماسیون", "/img/svc-ai.webp", "هوش مصنوعی و پشتیبانی"),
}
services = []
for slug, (title, cover, group) in svc_meta.items():
    page = SITE.get(f"services__{slug}", {})
    blocks = page.get("blocks", [])
    title2 = txt(blocks[0]["x"]) if blocks and blocks[0]["t"] == "h1" else title
    body = [b for b in blocks[1:] if b["t"] != "img"]
    services.append({
        "slug": slug, "title": title2, "group": group, "cover": cover,
        "excerpt": page.get("meta", ""), "blocks": body,
    })
json.dump(services, open(f"{OUT}/services.json", "w"), ensure_ascii=False, indent=1)
print("services:", len(services))

# ── 6) Static pages blocks ────────────────────────────────────────────
pages = {}
for key in ["about", "contact", "consult", "pricing", "faq", "privacy", "terms", "services", "404"]:
    if key in SITE:
        pages[key] = {"title": SITE[key]["title"], "meta": SITE[key]["meta"], "blocks": SITE[key]["blocks"]}
json.dump(pages, open(f"{OUT}/pages.json", "w"), ensure_ascii=False, indent=1)
print("pages:", list(pages.keys()))

# ── 7) FAQ structured ─────────────────────────────────────────────────
faq = []
raw_faq = open(f"{FULL}/faq.html", encoding="utf-8", errors="ignore").read()
main_faq = re.search(r"<main[^>]*>(.*)</main>", raw_faq, re.S)
if main_faq:
    for item in re.findall(
        r'<div class="faq-item[^"]*"[^>]*>(.*?)</button>\s*<div class="faq-item__panel"[^>]*>\s*<div class="faq-item__panel-inner">(.*?)</div>',
        main_faq.group(1), re.S):
        q = txt(re.sub(r"<[^>]+>", "", item[0]))
        a = txt(re.sub(r"<[^>]+>", "", item[1]))
        if q and a: faq.append({"q": q, "a": a})
json.dump(faq, open(f"{OUT}/faq.json", "w"), ensure_ascii=False, indent=1)
print("faq:", len(faq))
