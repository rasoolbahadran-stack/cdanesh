export const prerender = false;
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { q } from '../../lib/db';
const rate=new Map<string,{n:number;until:number}>();
function safeText(v:unknown){return String(v||'').replace(/[\r\n\t]+/g,' ').replace(/Bearer\s+\S+/gi,'[توکن حذف شد]').replace(/(password|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,'$1=[حذف شد]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[ایمیل حذف شد]').slice(0,700);}
export const POST:APIRoute=async({request})=>{
 const ip=(request.headers.get('x-forwarded-for')||'unknown').split(',')[0].slice(0,80),now=Date.now(),rec=rate.get(ip);
 if(rec&&rec.until>now&&rec.n>=10)return new Response(JSON.stringify({ok:false}),{status:429});
 if(!rec||rec.until<now)rate.set(ip,{n:1,until:now+60000});else rec.n++;
 try{const b=await request.json();const message=safeText(b.message);if(!message)return new Response(JSON.stringify({ok:false}),{status:400});
  const path=String(b.path||'/').split('?')[0].slice(0,400),source=b.source==='server'?'server':'browser';
  await q('INSERT INTO error_reports(trace_id,source,message,path,severity) VALUES($1,$2,$3,$4,$5)',[crypto.randomUUID(),source,message,path,b.severity==='fatal'?'fatal':'error']);
  return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json'}});
 }catch{return new Response(JSON.stringify({ok:false}),{status:500});}
};
