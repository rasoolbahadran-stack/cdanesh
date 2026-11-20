export const prerender=false;
import type {APIRoute} from 'astro';
import {ENTITIES} from '../../../../lib/entities';
import {q} from '../../../../lib/db';
import {ok,fail,unauthorized,serverError,readJson,str,num} from '../../../../lib/http';
import {sessionFromCookies} from '../../../../lib/auth';
import {logActivity} from '../../../../lib/seed';
const admin=(request:Request)=>!!sessionFromCookies(request.headers.get('cookie')||'');
export const POST:APIRoute=async(ctx)=>{
 if(!admin(ctx.request))return unauthorized();
 try{
  const cfg=ENTITIES[String(ctx.params.entity)];if(!cfg)return fail('موجودیت ناشناخته','NOT_FOUND',404);
  const body=await readJson(ctx.request) as {action?:string;ids?:unknown;value?:unknown};
  const action=str(body.action,20),ids=Array.isArray(body.ids)?[...new Set(body.ids.map(v=>num(v,0)).filter(v=>v>0))].slice(0,200):[];
  if(!ids.length)return fail('هیچ موردی انتخاب نشده است','NO_IDS');
  if(action==='delete'){
   await q(`CREATE TABLE IF NOT EXISTS cdanesh_admin_trash(id bigserial PRIMARY KEY,entity text NOT NULL,entity_id bigint NOT NULL,snapshot jsonb NOT NULL,deleted_at timestamptz NOT NULL DEFAULT now(),restored_at timestamptz)`);
   let deleted=0;
   for(const id of ids){const moved=await q(`WITH deleted AS (DELETE FROM ${cfg.table} WHERE id=$1 RETURNING *) INSERT INTO cdanesh_admin_trash(entity,entity_id,snapshot) SELECT $2,$1,to_jsonb(deleted) FROM deleted RETURNING id`,[id,cfg.table]);if(moved.length)deleted++;}
   await logActivity('delete',cfg.table,null,`${deleted} ${cfg.label} به سطل زباله منتقل شد`);
   return ok({deleted},`${deleted} مورد به سطل زباله منتقل شد`);
  }
  if(action==='status'){
   const value=str(body.value,20),allowed=cfg.table==='messages'?['new','read','replied','archived']:['draft','published','scheduled'];
   if(!allowed.includes(value))return fail('وضعیت نامعتبر است','BAD_STATUS');
   let updated=0;for(const id of ids){try{const rows=await q(`UPDATE ${cfg.table} SET status=$1${cfg.noTimestamp?'':', updated_at=now()'} WHERE id=$2 RETURNING id`,[value,id]);if(rows.length)updated++;}catch{}}
   await logActivity('update',cfg.table,null,`وضعیت ${updated} ${cfg.label} به‌صورت گروهی تغییر کرد`);
   return ok({updated},`وضعیت ${updated} مورد تغییر کرد`);
  }
  if(action==='star'){if(cfg.table!=='messages')return fail('این عملیات فقط برای پیام‌هاست','BAD_ACTION');const value=body.value===true||body.value==='true'||body.value===1;const rows=await q('UPDATE messages SET starred=$1 WHERE id=ANY($2::bigint[]) RETURNING id',[value,ids]);return ok({updated:rows.length},value?'پیام‌ها مهم علامت‌گذاری شدند':'علامت مهم پیام‌ها برداشته شد');}
  return fail('عملیات نامعتبر است','BAD_ACTION');
 }catch(e){return serverError(e);}
};