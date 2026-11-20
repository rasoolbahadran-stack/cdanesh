export const prerender = false;
import type { APIRoute } from 'astro';
import { sessionFromCookies } from '../../../lib/auth';
import { readAiConfig, saveAiConfig } from '../../../lib/ai';
const allowed=(r:Request)=>!!sessionFromCookies(r.headers.get('cookie')||'');
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export const GET:APIRoute=async({request})=>{
 if(!allowed(request))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);
 try{return json({ok:true,...await readAiConfig()});}catch{return json({ok:false,message:'خواندن تنظیمات ممکن نشد'},500);}
};
export const PUT:APIRoute=async({request})=>{
 if(!allowed(request))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);
 try{const b=await request.json();const data=await saveAiConfig({apiKey:b.apiKey,model:b.model,permissions:b.permissions});return json({ok:true,data,message:'تنظیمات دستیار ذخیره شد؛ کلید API به‌شکل رمزگذاری‌شده در سرور نگهداری می‌شود.'});}
 catch(e){return json({ok:false,message:String((e as Error)?.message||'ذخیره تنظیمات ناموفق بود').slice(0,500)},400);}
};
