// /api/payments — همان هندلر کلاسیک پروژه، متصل به Astro (SSR)
export const prerender = false;
import handler from '../../../server/handlers/payments.mjs';
import { endpoint } from '../../../server/lib/api-compat.mjs';
export const { GET, POST, PUT, DELETE } = endpoint(handler);
