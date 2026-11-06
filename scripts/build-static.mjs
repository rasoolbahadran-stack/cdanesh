#!/usr/bin/env node
/**
 * بیلد استاتیک عمومی کافه دانش
 * مسیرهای server-only (/admin و /api) موقتاً کنار گذاشته می‌شوند تا
 * خروجی کاملاً استاتیک و قابل بازبینی قبل از پوش به گیت ساخته شود.
 * خروجی: dist-static/
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const adminDir = path.join(root, 'src/pages/admin');
const apiDir = path.join(root, 'src/pages/api');
const stash = path.join(root, '.server-only-stash');
const mwFile = path.join(root, 'src/middleware.ts');
const mwStash = path.join(stash, 'middleware.ts');

const moved = [];
function ensureStash() {
  if (!fs.existsSync(stash)) fs.mkdirSync(stash, { recursive: true });
}
function move(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
  moved.push([dest, src]);
}
function restore() {
  while (moved.length) {
    const [dest, src] = moved.pop();
    fs.renameSync(dest, src);
  }
}

try {
  ensureStash();
  move(adminDir, path.join(stash, 'admin'));
  move(apiDir, path.join(stash, 'api'));
  if (fs.existsSync(mwFile)) move(mwFile, mwStash);
  fs.writeFileSync(path.join(root, '.static-marker'), '1');
  console.log('▸ حالت استاتیک فعال شد (admin/api کنارگذاشته شد)');
  execSync('npx astro build', { cwd: root, stdio: 'inherit', env: { ...process.env, STATIC_BUILD: '1', OUT_DIR: 'dist-static' } });
  console.log('✔ بیلد استاتیک کامل شد → dist-static/');
} finally {
  restore();
  const marker = path.join(root, '.static-marker');
  if (fs.existsSync(marker)) fs.unlinkSync(marker);
  console.log('▸ ساختار پروژه بازیابی شد');
}
