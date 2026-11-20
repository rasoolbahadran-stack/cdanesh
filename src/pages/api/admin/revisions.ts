export const prerender = false;
import type { APIRoute } from 'astro';
import { q, q1 } from '../../../lib/db';
import { sessionFromCookies } from '../../../lib/auth';
import { logActivity } from '../../../lib/seed';
const allowed=(r:Request)=>!!sessionFromCookies(r.headers.get('cookie')||'');
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const fields:Record<string,string[]>={posts:['title','slug','excerpt','content','cover_image','category_id','tags','author','status','featured','reading_time','seo_title','seo_description','canonical_url','og_title','og_description','og_image','noindex','published_at'],pages:['title','slug','excerpt','content','featured_image','status','seo_title','seo_description','canonical_url','og_title','og_description','og_image','noindex','sort_order']};
export const GET:APIRoute=async({request})=>{
 if(!allowed(request))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);
 const u=new URL(request.url),entity=String(u.searchParams.get('entity')||''),id=Number(u.searchParams.get('id'));
 if(!fields[entity]||!id)return json({ok:false,message:'نوع محتوا یا شناسه معتبر نیست'},400);
 try{const rows=await q('SELECT id,created_at,snapshot FROM content_revisions WHERE entity=$1 AND entity_id=$2 ORDER BY created_at DESC LIMIT 30',[entity,id]);return json({ok:true,rows});}catch{return json({ok:false,message:'تاریخچه محتوا در دسترس نیست'},500);}
};
export const POST:APIRoute=async({request})=>{
 if(!allowed(request))return json({ok:false,message:'ابتدا وارد پنل شوید'},401);
 try{
  const b=await request.json(),entity=String(b.entity||''),revisionId=Number(b.revisionId);
  if(!fields[entity]||!revisionId)return json({ok:false,message:'درخواست معتبر نیست'},400);
  const revision=await q1<{id:number;entity:string;entity_id:number;snapshot:Record<string,unknown>}>('SELECT id,entity,entity_id,snapshot FROM content_revisions WHERE id=$1 AND entity=$2',[revisionId,entity]);
  if(!revision)return json({ok:false,message:'نسخه انتخاب‌شده پیدا نشد'},404);
  const table=entity==='posts'?'posts':'pages';
  const current=await q1<Record<string,unknown>>('SELECT * FROM '+table+' WHERE id=$1',[revision.entity_id]);
  if(!current)return json({ok:false,message:'محتوای اصلی پیدا نشد'},404);
  await q('INSERT INTO content_revisions(entity,entity_id,snapshot) VALUES($1,$2,$3::jsonb)',[entity,revision.entity_id,JSON.stringify(current)]);
  const snapshot=revision.snapshot as Record<string,unknown>;
  const keys=fields[entity].filter(k=>Object.prototype.hasOwnProperty.call(snapshot,k));
  if(snapshot.slug&&current.slug&&snapshot.slug!==current.slug){await q('INSERT INTO slug_redirects(entity,old_slug,new_slug) VALUES($1,$2,$3) ON CONFLICT(entity,old_slug) DO UPDATE SET new_slug=EXCLUDED.new_slug',[entity,String(current.slug),String(snapshot.slug)]);}
  if(!keys.length)return json({ok:false,message:'نسخه داده قابل بازیابی ندارد'},400);
  const sets=keys.map((k,i)=>k+'=$'+(i+1)),values=keys.map(k=>snapshot[k]);values.push(revision.entity_id);
  await q('UPDATE '+table+' SET '+sets.join(', ')+', updated_at=now() WHERE id=$'+values.length,values);
  await logActivity('update',entity,revision.entity_id,'نسخه قبلی محتوا بازیابی شد');
  return json({ok:true,message:'نسخه انتخاب‌شده با موفقیت بازیابی شد'});
 }catch{return json({ok:false,message:'بازیابی نسخه ناموفق بود'},500);}
};