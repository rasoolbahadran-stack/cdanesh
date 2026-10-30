Cafe Danesh — Astro Static Website

A complete static website for **Cafe Danesh**, built with [Astro](https://astro.build).

The project preserves the approved visual design, page structure, and core user experience while using a lightweight static architecture.

The website can be deployed to Vercel, GitHub Pages, cPanel, or any standard static hosting provider.

## Key Features

- **Static Architecture:** No database or backend server is required to serve the website.
- **Fast Performance:** Optimized static HTML, CSS, JavaScript, and assets.
- **Responsive Design:** Designed for desktop, tablet, and mobile devices.
- **SEO Ready:** Canonical URLs, Open Graph metadata, structured data, sitemap, and robots.txt.
- **Local Fonts:** Vazirmatn is hosted locally.
- **Content Management:** Articles, portfolio projects, and FAQs are managed through project data files.
- **Admin Demo:** Includes a client-side demonstration admin panel.
- **Flexible Deployment:** Compatible with Vercel, GitHub Pages, and cPanel hosting.

---

## 1. Requirements

- Node.js 18 or later
- npm
- Git (recommended)

## 2. Run Locally

Install project dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local website:

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

The production files are generated in:

```text
dist/
```

**Note:** A prebuilt `dist/` directory may also be included in the project package. For the latest changes, always generate a fresh production build before deployment.

---

## 3. Deploy to Vercel (Recommended)

Vercel supports automatic deployment from GitHub repositories.

### Initial Setup

1. Open [Vercel](https://vercel.com/).
2. Sign in using your GitHub account.
3. Select **Add New → Project**.
4. Import the repository:

   `rasoolbahadran-stack/cdanesh`

5. Confirm the following build settings:

| Setting          | Value           |
| ---------------- | --------------- |
| Framework Preset | Astro           |
| Root Directory   | `./`            |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Install Command  | `npm install`   |

6. Click **Deploy**.

### Automatic Deployment

After connecting the repository:

- Every push to the production branch triggers a new production deployment.
- Other branches can generate preview deployments.
- Deployment logs are available in the Vercel dashboard.

For more information:

https://docs.astro.build/en/guides/deploy/vercel/

---

## 4. Deploy to GitHub Pages

The project may also be deployed through GitHub Pages using GitHub Actions.

Deployment workflow:

```text
.github/workflows/deploy.yml
```

### Configuration

1. Open the GitHub repository.
2. Navigate to **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Verify that the deployment workflow is configured for the `main` branch.
5. Push your changes to GitHub.

GitHub Actions will build and publish the website when the workflow is correctly configured.

**Important:** For a custom domain or repository-based URL, make sure the Astro `site` and `base` settings are configured correctly.

Official documentation:

https://docs.astro.build/en/guides/deploy/github/

---

## 5. Deploy to cPanel Hosting

Astro generates a static production website inside the `dist/` directory.

### Deployment Steps

1. Log in to your cPanel account.
2. Open **File Manager**.
3. Navigate to:

```text
public_html/
```

4. Upload the contents of the `dist/` directory.
5. Make sure `index.html` is directly inside `public_html/`.
6. Confirm that the website assets and images are uploaded correctly.

The project includes an `.htaccess` file for supported Apache configurations, including:

- Custom 404 error handling.
- GZIP compression.
- Browser caching.

Whenever the website is updated, run:

```bash
npm run build
```

Then upload the updated contents of `dist/`.

---

## 6. Project Structure

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
│       │   ├── admin.js
│       │   └── data/
│       │       ├── articles-a.js
│       │       ├── articles-b.js
│       │       ├── portfolio.js
│       │       └── faq.js
│       │
│       ├── fonts/
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
│
├── dist/
│   └── Production build output
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── package.json
├── package-lock.json
├── astro.config.mjs
└── README.md
```

---

## 7. Website Content Management

The following files are used to manage website content.

| Content                    | File                                                      |
| -------------------------- | --------------------------------------------------------- |
| Individual website pages   | `src/pages/`                                              |
| Homepage package pricing   | `src/pages/index.astro`                                   |
| Blog articles              | `public/assets/js/data/articles-a.js` and `articles-b.js` |
| Portfolio projects         | `public/assets/js/data/portfolio.js`                      |
| Frequently Asked Questions | `public/assets/js/data/faq.js`                            |
| Main navigation            | `src/components/Header.astro`                             |
| Website footer             | `src/components/Footer.astro`                             |
| Phone number and email     | `src/components/Footer.astro`                             |

### Package Pricing

| Package      |                        Price |
| ------------ | ---------------------------: |
| Starter      |             15 million toman |
| Professional |             19 million toman |
| E-commerce   |             40 million toman |
| Custom       | Starting at 70 million toman |

Selecting a package automatically passes the selected package to the request form:

```text
request.html?pkg=...
```

### Publishing New Articles

To publish a new article using the current static architecture:

1. Edit the appropriate article data file.
2. Add the article content and metadata.
3. Save the changes.
4. Run `npm run build`.
5. Push the updated project to GitHub.
6. Wait for Vercel to complete the production deployment.

The article will become available to all visitors after successful deployment.

---

## 8. Admin Panel — Demo Version

The project includes a demonstration admin panel.

**Admin URL:**

```text
/admin.html
```

### Important Limitations

The current admin panel is a client-side demonstration, not a production-ready content management system.

Because the website is static:

- Admin panel changes are stored in the visitor's browser using `localStorage`.
- Contact form submissions are not automatically stored on a central server.
- Changes made in one browser are not automatically visible to other visitors.
- Adding an article through this demo panel does not publish it to the live website.
- Website content must currently be updated through the project files.

**Security Notice:** Client-side password checks are not secure server-side authentication. Do not use the demonstration panel to manage confidential information or real customer data.

A future version can integrate a database and secure backend to support permanent article storage and centralized content management.

---

## 9. Technical Improvements

### Portfolio Image Scrolling

The portfolio image preview interaction has been improved.

- Uses vertical `translateY` movement.
- Calculates the movement distance based on the image and container dimensions.
- Allows visitors to preview the full image.
- Returns smoothly to its original position.
- Avoids unnecessary gradient or blur overlays.
- Respects `prefers-reduced-motion`.
- Supports touch interaction on mobile devices.

### SEO Implementation

The website includes:

- Canonical URLs.
- Open Graph metadata.
- Organization structured data.
- WebSite structured data.
- FAQPage structured data.
- XML sitemap.
- robots.txt.
- `noindex` directives for administrative pages.

### Performance

- Locally hosted Vazirmatn font.
- Static page generation.
- Optimized asset delivery.
- Browser caching through supported hosting configurations.
- Responsive layouts for different screen sizes.

---

## 10. Deployment Checklist

Before publishing a new version, verify:

- [ ] All pages load correctly.
- [ ] Navigation and footer links work.
- [ ] Images and assets load correctly.
- [ ] Articles and portfolio content are up to date.
- [ ] Forms behave as expected.
- [ ] Mobile and desktop layouts work properly.
- [ ] SEO metadata is correct.
- [ ] The 404 page works correctly.
- [ ] `npm run build` completes successfully.
- [ ] The latest version is deployed successfully.

---

## 11. Designer & Project Credits

**Designed & Created by Rasool Bahadoran**

Web Designer | UI/UX Design | Website Development

**Contact Information**

- Name: Rasool Bahadoran
- Phone: 09165806207
- Location: Shahid Rajaei Street, Bushehr, Iran
- Website: https://www.cdanesh.ir
- GitHub: https://github.com/rasoolbahadran-stack

© 2026 Rasool Bahadoran. All Rights Reserved.

---

## Project Information

| Property           | Description                                 |
| ------------------ | ------------------------------------------- |
| Project            | Cafe Danesh                                 |
| Framework          | Astro                                       |
| Architecture       | Static Site Generation (SSG)                |
| Database           | Not required for the current static version |
| Backend            | Not required for static website delivery    |
| Build Output       | `dist/`                                     |
| Primary Deployment | Vercel                                      |
| Additional Hosting | GitHub Pages, cPanel, and static hosting    |

**Cafe Danesh — A modern, lightweight, and responsive website.**
