/* سلامت سیستم — /api/health */
import type { APIRoute } from 'astro';
import { q } from '../../lib/db';
import { storageKind } from '../../lib/storage';
import { hasEnv } from '../../lib/env';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const r = await q('SELECT 1 AS ok');
    return new Response(JSON.stringify({
      ok: true,
      db: r.length ? 'connected' : 'unknown',
      storage: storageKind(),
      adminConfigured: hasEnv('ADMIN_PASSWORD_HASH') || hasEnv('ADMIN_PASSWORD'),
      time: new Date().toISOString(),
    }), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (e) {
    console.error('[health] database check failed:', e);
    return new Response(JSON.stringify({ ok: false, error: 'DATABASE_UNAVAILABLE' }), { status: 503, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
};
