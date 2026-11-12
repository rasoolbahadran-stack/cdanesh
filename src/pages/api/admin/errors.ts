export const prerender = false;
import type { APIRoute } from 'astro';
import { q } from '../../../lib/db';
import { sessionFromCookies } from '../../../lib/auth';
import { logActivity } from '../../../lib/seed';
const allowed=(r:Request)=>!!sessionFromCookies(r.headers.get('cookie')||'');
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export const GET:APIRoute=async({request})=>{if(!allowed(request))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);try{return json({ok:true,rows:await q('SELECT id,trace_id,source,message,path,severity,status,created_at FROM error_reports ORDER BY created_at DESC LIMIT 200')});}catch{return json({ok:false,message:'بارگذاری گزارش‌ها ناموفق بود'},500);}};
export const PATCH:APIRoute=async({request})=>{if(!allowed(request))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);try{const b=await request.json();const id=Number(b.id),status=String(b.status||'');if(!id||!['open','investigating','resolved'].includes(status))return json({ok:false,message:'اطلاعات معتبر نیست'},400);const rows=await q('UPDATE error_reports SET status=$1 WHERE id=$2 RETURNING id',[status,id]);if(!rows.length)return json({ok:false,message:'گزارش پیدا نشد'},404);await logActivity('update','error_reports',id,'وضعیت گزارش خطا تغییر کرد');return json({ok:true});}catch{return json({ok:false,message:'ذخیره وضعیت ناموفق بود'},500);}};
