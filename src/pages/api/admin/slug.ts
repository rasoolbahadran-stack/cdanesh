export const prerender = false;
import type { APIRoute } from 'astro';
import { sessionFromCookies } from '../../../lib/auth';
import { askAi } from '../../../lib/ai';
import { q1 } from '../../../lib/db';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
function fallbackSlug(title:string){
 const words:Record<string,string>={'اصول':'principles','طراحی':'design','فروشگاه':'ecommerce','اینترنتی':'online','حرفه‌ای':'professional','راهنمای':'guide','بهینه‌سازی':'optimization','سئو':'seo','سایت':'website','مقاله':'article','تولید':'creating','محتوا':'content','بازاریابی':'marketing','تجربه':'experience','کاربری':'user','امنیت':'security','سرعت':'speed','تصویر':'image','رسانه':'media','شرکتی':'corporate','قیمت':'pricing','تعرفه':'pricing','آموزش':'tutorial','اشتباهات':'mistakes','نکات':'tips','مهم':'essential'};
 return title.toLowerCase().replace(/[\u200c\s]+/g,' ').trim().split(/\s+/).map(w=>words[w]||'').filter(Boolean).join('-')||'new-content';
}
export const POST:APIRoute=async({request})=>{
 if(!sessionFromCookies(request.headers.get('cookie')||''))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);
 try{
  const b=await request.json();const title=String(b.title||'').trim().slice(0,200);if(!title)return json({ok:false,message:'عنوان مقاله الزامی است'},400);
  let candidate='';
  try{const a=await askAi([{role:'user',content:'عنوان فارسی زیر را به یک اسلاگ انگلیسی طبیعی و کوتاه تبدیل کن. فقط حروف کوچک انگلیسی و خط تیره، بدون توضیح. عنوان: '+title}]);candidate=a.toLowerCase().trim().replace(/[^a-z0-9-]/g,'').replace(/-{2,}/g,'-').replace(/^-|-$/g,'').slice(0,100);}
  catch{candidate=fallbackSlug(title);}
  if(!candidate)candidate=fallbackSlug(title);
  const base=candidate;let i=2;
  while(await q1('SELECT id FROM posts WHERE slug=$1 UNION ALL SELECT id FROM pages WHERE slug=$1 LIMIT 1',[candidate]))candidate=base+'-'+i++;
  return json({ok:true,slug:candidate});
 }catch{return json({ok:false,message:'ساخت اسلاگ ممکن نشد'},500);}
};
