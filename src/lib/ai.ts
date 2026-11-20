import crypto from 'node:crypto';
import { q1, q } from './db';
import { env } from './env';

type AiConfig = { provider: 'openrouter'; model: string; encryptedKey: string; permissions: { draft: boolean; seo: boolean; edit: boolean; publish: boolean } };
const SETTINGS_KEY = 'admin_ai_config';
function encryptionKey() {
  const source = env('ADMIN_SESSION_SECRET') || env('ADMIN_PASSWORD_HASH') || env('ADMIN_PASSWORD');
  if (!source) throw new Error('کلید امن سرور برای رمزگذاری تنظیمات هوش مصنوعی موجود نیست');
  return crypto.createHash('sha256').update(source).digest();
}
function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join('.');
}
function decrypt(value: string) {
  const [iv, tag, body] = value.split('.');
  if (!iv || !tag || !body) throw new Error('تنظیمات رمزگذاری‌شده معتبر نیست');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8');
}
export async function readAiConfig() {
  const row = await q1<{ value: AiConfig }>('SELECT value FROM settings WHERE key=$1', [SETTINGS_KEY]);
  const c = row?.value;
  return { configured: !!c?.encryptedKey, provider: 'OpenRouter', model: c?.model || 'openrouter/free',
    permissions: c?.permissions || { draft: true, seo: true, edit: false, publish: false } };
}
export async function saveAiConfig(input: { apiKey?: string; model?: string; permissions?: Partial<AiConfig['permissions']> }) {
  const row = await q1<{ value: AiConfig }>('SELECT value FROM settings WHERE key=$1', [SETTINGS_KEY]);
  const current = row?.value;
  const apiKey = String(input.apiKey || '').trim();
  const model = String(input.model || current?.model || 'openrouter/free').trim().slice(0, 120);
  if (apiKey && apiKey.length < 12) throw new Error('کلید API معتبر به نظر نمی‌رسد');
  const config: AiConfig = {
    provider: 'openrouter', model: model || 'openrouter/free',
    encryptedKey: apiKey ? encrypt(apiKey) : (current?.encryptedKey || ''),
    permissions: {
      draft: input.permissions?.draft ?? current?.permissions?.draft ?? true,
      seo: input.permissions?.seo ?? current?.permissions?.seo ?? true,
      edit: input.permissions?.edit ?? current?.permissions?.edit ?? false,
      publish: input.permissions?.publish ?? current?.permissions?.publish ?? false,
    }
  };
  await q('INSERT INTO settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()', [SETTINGS_KEY, JSON.stringify(config)]);
  return readAiConfig();
}
export async function askAi(messages: { role: 'user' | 'assistant'; content: string }[]) {
  const row = await q1<{ value: AiConfig }>('SELECT value FROM settings WHERE key=$1', [SETTINGS_KEY]);
  const config = row?.value;
  if (!config?.encryptedKey) throw new Error('ابتدا کلید OpenRouter را در تنظیمات دستیار ثبت کنید');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + decrypt(config.encryptedKey), 'Content-Type': 'application/json', 'HTTP-Referer': 'https://cdanesh.ir', 'X-Title': 'Cafe Danesh Admin' },
    body: JSON.stringify({
      model: config.model || 'openrouter/free',
      messages: [
        { role: 'system', content: 'تو دستیار محتوایی فارسی کافه دانش هستی. به زبان فارسی، دقیق و کاربردی پاسخ بده. در تولید مقاله، ساختار محتوا، ویرایش، سئو و راهنمایی مدیریت سایت کمک کن. هرگز ادعا نکن که تغییری در سایت ذخیره یا منتشر کرده‌ای. تو فقط پیشنهاد و متن تولید می‌کنی؛ ذخیره، ویرایش یا انتشار باید در پنل و با اقدام مدیر انجام شود.' },
        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content.slice(0, 8000) }))
      ],
      temperature: 0.4
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data?.error?.message || data?.message || 'پاسخ سرویس هوش مصنوعی دریافت نشد').slice(0, 500));
  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error('پاسخ خالی از سرویس هوش مصنوعی دریافت شد');
  return answer.slice(0, 16000);
}
