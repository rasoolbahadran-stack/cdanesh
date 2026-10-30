# Cafe Danesh — Astro Static Website

A complete static rebuild of the **Cafe Danesh** website, powered by [Astro](https://astro.build).

The project preserves the approved visual design, page structure, and core website experience while eliminating the need for a server-side application or database.

## Key Features

- **100% static output:** No database, backend server, or external API is required to serve the website.
- **Portable deployment:** The generated website consists of HTML, CSS, JavaScript, and static assets.
- **Hosting flexibility:** Deploy to GitHub Pages, cPanel hosting, or any standard static web hosting provider.
- **Lightweight architecture:** Astro generates optimized static pages for fast delivery and efficient hosting.
- **SEO-ready:** Includes canonical URLs, Open Graph metadata, structured data, sitemap, and robots.txt.
- **Locally hosted fonts:** Vazirmatn is included locally, without relying on external font services.

---

## 1. Run Locally

**Requirements:** Node.js 18 or later and npm.

Install dependencies (first-time setup):

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open:

```text
http://localhost:4321
```

Build the production website:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The generated website is saved in the `dist/` directory.

> **Note:** A prebuilt `dist/` directory is already included in this package. You can deploy it directly without installing Node.js or running a build.

---

## 2. Deploy to GitHub Pages

The project includes an automated GitHub Actions workflow:

```text
.github/workflows/deploy.yml
```

Once GitHub Pages is configured, every push to the deployment branch can trigger an automatic build and deployment.

### Step 1 — Configure the Repository

The GitHub repository:

```text
https://github.com/rasoolbahadran-stack/cdanesh
```

If the repository already exists, use it instead of creating another one.

### Step 2 — Connect and Push

Check the existing remote:

```bash
git remote -v
```

If no `origin` remote exists, add it:

```bash
git remote add origin https://github.com/rasoolbahadran-stack/cdanesh.git
```

If `origin` already exists but points to another repository, update it:

```bash
git remote set-url origin https://github.com/rasoolbahadran-stack/cdanesh.git
```

Push the main branch:

```bash
git push -u origin main
```

### Step 3 — Enable GitHub Pages

In your GitHub repository:

1. Open **Settings**.
2. Select **Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Check the **Actions** tab to confirm that deployment completes successfully.

After the initial deployment, subsequent pushes can automatically publish the updated website.

### GitHub Authentication

GitHub no longer supports account passwords for Git operations over HTTPS.

There are two recommended authentication methods:

**Option 1 — Git Credential Manager**

Run `git push`. If Git Credential Manager is configured, your browser will open and prompt you to authenticate with GitHub.

**Option 2 — Personal Access Token (PAT)**

Create a fine-grained token under:

```text
GitHub → Settings → Developer settings → Personal access tokens
```

Grant access only to the required repository, with:

```text
Contents: Read and write
```

Use the token instead of your GitHub account password when prompted. Avoid storing the token in project files or committing it to Git.

### Configure the Custom Domain

To connect:

```text
cdanesh.ir
```

1. Open **Repository → Settings → Pages**.
2. Enter `cdanesh.ir` under **Custom domain**.
3. Configure the required DNS records at your domain registrar, following the records specified by GitHub Pages.
4. Wait for DNS propagation.
5. Enable **Enforce HTTPS** once GitHub makes it available.

For an apex domain such as `cdanesh.ir`, use the supported GitHub Pages A records. For a `www` subdomain, configure the appropriate CNAME record.

---

## 3. Deploy to cPanel Hosting

This is the simplest deployment method for standard shared hosting.

After running:

```bash
npm run build
```

Astro generates the production files inside:

```text
dist/
```

### Deployment Steps

1. Log in to your cPanel account.
2. Open **File Manager**.
3. Navigate to:

```text
public_html/
```

4. Upload the **contents** of the `dist/` directory, not the `dist` directory itself.
5. Extract the files if you uploaded a ZIP archive.
6. Make sure `index.html` is located directly inside `public_html/`.

Your website is now ready to serve.

The package also includes an `.htaccess` file for supported Apache configurations, including:

- Custom 404 error handling.
- GZIP compression.
- Browser caching.

Whenever you update the website:

```bash
npm run build
```

Upload the updated contents of `dist/` to `public_html/`, replacing the previous deployment files.

---

## 4. Project Structure and Content Management

```text
/
├── public/
│   └── assets/
│       ├── css/
│       │   ├── main.css
│       │   └── components.css
│       │
│       ├── js/
│       │   ├── main.js
│       │   ├── site.js
│       │   ├── forms.js
│       │   └── admin.js
│       │
│       ├── fonts/
│       │   └── Vazirmatn
│       │
│       └── img/
│
├── src/
│   ├── layouts/
│   │   ├── SiteLayout.astro
│   │   └── BareLayout.astro
│   │
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Drawer.astro
│   │   └── PageHead.astro
│   │
│   └── pages/
│       └── 29 website pages
│
├── dist/
│   └── Production-ready static files
│
└── .github/
    └── workflows/
        └── deploy.yml
```

### Where to Edit Website Content

| Content | File or Location |
|---|---|
| Individual page content | Corresponding file in `src/pages/` |
| Package pricing | `src/pages/index.astro`, section `id="pricing"` |
| Blog articles | `public/assets/js/data/articles-a.js` and `articles-b.js` |
| Portfolio projects | `public/assets/js/data/portfolio.js` |
| Frequently asked questions | `public/assets/js/data/faq.js` |
| Main navigation | `src/components/Header.astro` |
| Website footer | `src/components/Footer.astro` |
| Phone number and email | `src/components/Footer.astro` |

### Current Package Pricing

The homepage displays the following packages:

| Package | Price |
|---|---:|
| Starter | 15 million toman |
| Professional | 19 million toman |
| E-commerce | 40 million toman |
| Custom | Starting at 70 million toman |

Selecting a package automatically passes the selected package to the request form:

```text
request.html?pkg=...
```

After editing content or assets, rebuild the website:

```bash
npm run build
```

Then deploy the updated `dist/` directory.

---

## 5. Admin Panel — Demo Version

The website includes a demonstration admin panel:

```text
/admin.html
```

**Demo login password:**

```text
cdanesh1404
```

### Important Limitations

This is a client-side demonstration panel, not a production-ready administration system.

Because the website is fully static:

- Contact form submissions are stored in the visitor's browser using `localStorage`.
- Requests and messages are not sent to a server.
- Changes made through the demo panel are stored locally in the current browser.
- Content displayed on the live website must be edited through the project files described in Section 4.
- There is no server-side authentication, database, or centralized content management.

**Security warning:** The demo password is publicly visible in the project. It must not be treated as a secure administrator credential. Do not use this panel to manage confidential information or real customer data.

If a production-ready admin system is required in the future, the project can be extended with a backend, database, and proper authentication.

---

## 6. Technical Improvements and Implementation Details

### Portfolio Image Scrolling

The portfolio preview interaction has been improved to display the full image when hovering over a project card.

Implementation details:

- The image moves vertically using `translateY`.
- The movement distance is calculated from the image height minus the visible frame height.
- The animation reaches the bottom edge of the full image.
- No gradient, blur, or overlay is placed over the image.
- The image returns smoothly to its original position when the pointer leaves the card.
- The animation respects the `prefers-reduced-motion` accessibility preference.
- On mobile devices, users can explore image previews using touch gestures.

### Package Selection and Request Forms

The homepage package cards are connected to the request form.

When a visitor selects a package, its identifier is passed through the URL:

```text
request.html?pkg=...
```

This allows the request form to identify the selected package automatically.

### SEO and Search Engine Optimization

The website includes the following SEO features:

- Canonical URLs.
- Open Graph metadata.
- Organization structured data.
- WebSite structured data.
- FAQPage structured data.
- XML sitemap.
- robots.txt.
- `noindex` directives for administrative pages.

### Local Font Hosting

The Vazirmatn font is hosted locally inside the project.

This avoids external font dependencies and provides greater control over font loading and website performance.

---

## 7. Deployment Checklist

Before publishing a production update, verify the following:

- [ ] All content and page changes are saved.
- [ ] Navigation links work correctly.
- [ ] Images and static assets load correctly.
- [ ] Forms behave as expected, with their static-site limitations understood.
- [ ] SEO metadata and canonical URLs are correct.
- [ ] The 404 page works correctly.
- [ ] `npm run build` completes successfully.
- [ ] The generated `dist/` directory contains the latest files.
- [ ] The deployed website works on desktop and mobile.

---

**Project:** Cafe Danesh  
**Architecture:** Astro Static Site  
**Rendering:** Static Site Generation (SSG)  
**Database:** Not required  
**Backend:** Not required  
**Deployment Targets:** GitHub Pages, cPanel, and standard static hosting providers  
**Build Output:** `dist/`
