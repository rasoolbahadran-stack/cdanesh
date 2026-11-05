// ==========================================================================
 // کافه‌دانش (CDANESH STUDIO) — پیکربندی Astro
 // آداپتور: روی Vercel → @astrojs/vercel (SSR) | محلی/سندباکس → Node standalone
 // ==========================================================================
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const isVercel = !!process.env.VERCEL || process.env.DEPLOY_TARGET === 'vercel';

export default defineConfig({
  site: 'https://cdanesh.ir',
  output: 'server',
  trailingSlash: 'never',
  adapter: isVercel ? vercel() : node({ mode: 'standalone' }),
  server: {
    port: 3000,
    host: true,
  },
  devToolbar: { enabled: false },
  compressHTML: true,
  vite: {
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  },
});
