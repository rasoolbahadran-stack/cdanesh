/* ==========================================================================
   کافه‌دانش — راه‌انداز یک‌بارِ فرایند (مایگریشن + بذرپاشی)
   در اولین درخواست هر فرایند اجرا می‌شود و پس از آن فقط از کش می‌رود.
   ========================================================================== */
import './schema'; // ثبت مایگریشن‌ها
import { migrate } from './db';
import { runSeed } from './seed';

const g = globalThis as unknown as { __cd_boot?: Promise<void> };

export function boot(): Promise<void> {
  if (!g.__cd_boot) {
    g.__cd_boot = (async () => {
      await migrate();
      await runSeed();
      console.log('[cdanesh] database ready (migrate + seed)');
    })().catch((e) => {
      g.__cd_boot = undefined;
      throw e;
    });
  }
  return g.__cd_boot;
}
