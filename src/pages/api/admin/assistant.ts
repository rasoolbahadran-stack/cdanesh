export const prerender = false;
import type { APIRoute } from 'astro';
import { sessionFromCookies } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  if (!sessionFromCookies(request.headers.get('cookie') || '')) {
    return new Response(JSON.stringify({ok:false,error:'برای استفاده از دستیار باید وارد پنل شوید.'}),{status:401,headers:{'Content-Type':'application/json'}});
  }
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) return new Response(JSON.stringify({ok:false,error:'دستیار هنوز فعال نشده است. برای فعال‌سازی، کلید رایگان Gemini API را با نام GEMINI_API_KEY در متغیرهای Production پروژه Vercel ثبت کنید.'}),{status:503,headers:{'Content-Type':'application/json'}});
  try {
    const body = await request.json();
    const task = String(body.task || 'chat').slice(0,20);
    const title = String(body.title || '').slice(0,200);
    const message = String(body.message || '').slice(0,6000);
    const prompt = task === 'slug'
      ? 'Translate this Persian article title into a concise, natural English SEO URL slug. Return only lowercase English words separated by hyphens, no explanation. Title: ' + title
      : 'تو دستیار محتوایی سایت کافه دانش هستی. فقط به زبان فارسی پاسخ بده. در زمینه طراحی سایت، تولید محتوا، تجربه کاربری و سئو کمک کن. ادعاهای تأییدنشده نساز. درخواست مدیر: ' + message;
    const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').replace(/[^a-zA-Z0-9.-]/g,'');
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key), {
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.35,maxOutputTokens:task==='slug'?80:1800}})
    });
    const result = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ok:false,error:'سرویس هوش مصنوعی پاسخ نداد. کلید API، مدل و سهمیه رایگان را بررسی کنید.'}),{status:502,headers:{'Content-Type':'application/json'}});
    const responseText = (result?.candidates?.[0]?.content?.parts||[]).map((part:any)=>part.text||'').join('').trim();
    if (!responseText) return new Response(JSON.stringify({ok:false,error:'پاسخ متنی از هوش مصنوعی دریافت نشد.'}),{status:502});
    return new Response(JSON.stringify({ok:true,text:responseText}),{headers:{'Content-Type':'application/json'}});
  } catch {
    return new Response(JSON.stringify({ok:false,error:'خطا در ارتباط با دستیار هوشمند.'}),{status:500,headers:{'Content-Type':'application/json'}});
  }
};
