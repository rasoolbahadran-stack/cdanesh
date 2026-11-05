/* ==========================================================================
   کافه‌دانش — بارگذاری متغیرهای محیطی
   در Vercel متغیرها از پنل تنظیم می‌شوند؛ در محلی از فایل .env خوانده می‌شوند.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';

let loaded = false;

function loadDotEnv() {
  if (loaded) return;
  loaded = true;
  try {
    const file = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    /* فایل محیطی اختیاری است */
  }
}

loadDotEnv();

export function env(name: string): string | undefined {
  return process.env[name];
}

export function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export function hasEnv(name: string): boolean {
  return !!process.env[name];
}
