/* فرم مشاوره — /api/consult (عمومی) */
import type { APIRoute } from 'astro';
import { savePublicMessage } from '../../lib/messages';

export const prerender = false;

export const POST: APIRoute = async (ctx) => savePublicMessage(ctx.request, 'consult');
