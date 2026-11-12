export const prerender = false;
import type { APIRoute } from 'astro';
import { sessionFromCookies } from '../../../lib/auth';
import { askAi, readAiConfig } from '../../../lib/ai';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export const POST:APIRoute=async({request})=>{
 if(!sessionFromCookies(request.headers.get('cookie')||''))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);
 try{
  const b=await request.json();
  const messages=Array.isArray(b.messages)?b.messages.filter((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-10).map((m:any)=>({role:m.role,content:m.content.slice(0,8000)})):[];
  if(!messages.length||messages[messages.length-1].role!=='user')return json({ok:false,message:'پیام کاربر معتبر نیست'},400);
  const cfg=await readAiConfig();const reply=await askAi(messages);return json({ok:true,reply,model:cfg.model});
 }catch(e){return json({ok:false,message:String((e as Error)?.message||'خطای سرویس هوش مصنوعی').slice(0,500)},502);}
};
