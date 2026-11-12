> **Status: inactive / archived**  
> This PHP implementation is no longer served by the live site. The active Cafe Danesh admin is the Astro panel under `src/pages/admin`. This directory is retained only as an archive; Vercel does not route any live path to this PHP service.

# Cafe Danesh PHP Admin service

Isolated FrankenPHP service. Public Astro source remains in the repository root and is not copied into this image.

The `.payload` directory contains the compressed PHP application source. Docker expands it into `/app`; only `/app/public` is exposed by Caddy. `/admin` is intended to be routed to this service, with the Astro site remaining the fallback for all other paths.

The service must use the existing Neon Postgres database and existing CMS tables. It must not run destructive migrations or reset live content.
