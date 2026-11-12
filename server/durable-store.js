'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const LIMIT=40*1024*1024,TABLES=['users','sessions','settings','documents','meta','quote_version_counters','quote_version_allocations'];
function problem(message='무료 계정 데이터 저장소에 연결할 수 없습니다. 잠시 후 다시 시도하세요.',status=503){const e=new Error(message);e.status=status;return e;}
function pack(bytes,key){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);return Buffer.concat([Buffer.from('SPDB1'),iv,c.update(bytes),c.final(),c.getAuthTag()]);}
function unpack(bytes,key){if(bytes.length<33||bytes.toString('ascii',0,5)!=='SPDB1')throw problem();const c=crypto.createDecipheriv('aes-256-gcm',key,bytes.subarray(5,17));c.setAuthTag(bytes.subarray(bytes.length-16));return Buffer.concat([c.update(bytes.subarray(17,bytes.length-16)),c.final()]);}
function create(env,dir,settings,options={}){
if(!settings.cloud)return {restore:async()=>{},dispatch:async(db,req,res,work)=>work()};
if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY||!/^[a-f0-9]{64}$/.test(env.STORE_ENCRYPTION_KEY||''))throw problem();
if(env.STORE_ENCRYPTION_KEY===env.MIGRATION_KEY||env.STORE_ENCRYPTION_KEY===env.ADMIN_RECOVERY_KEY)throw problem();
const u=new URL(env.SUPABASE_URL);if(u.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname)||u.username||u.password||u.pathname!=='/'||u.search||u.hash||u.port)throw problem();
const client=options.client||require('@supabase/supabase-js').createClient(u.origin,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(20000)})}});
const key=Buffer.from(env.STORE_ENCRYPTION_KEY,'hex'),dbfile=path.join(dir,'members.sqlite');let revision=-1,reload=false,tail=Promise.resolve();
async function rpc(name,args){const r=await client.rpc(name,args);if(r.error)throw problem();return r.data;}
async function state(){const s=await rpc('salespilot_snapshot_read');if(!s||!Number.isSafeInteger(s.revision)||s.revision<0||!(s.payload===null||typeof s.payload==='string')||(s.payload===null&&s.revision!==0))throw problem();return s;}
function decode(payload){if(payload===null)return null;const frame=Buffer.from(payload,'base64');if(frame.length>LIMIT)throw problem();const bytes=unpack(frame,key);if(bytes.toString('ascii',0,16)!=='SQLite format 3\u0000')throw problem();return bytes;}
async function restore(){const s=await state();const bytes=decode(s.payload);revision=s.revision;if(bytes){if(fs.existsSync(dbfile))throw problem();fs.writeFileSync(dbfile,bytes,{flag:'wx',mode:0o600});}}
async function persist(db){const c=db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();if(c.busy!==0||c.log!==c.checkpointed)throw problem();const bytes=fs.readFileSync(dbfile);if(bytes.length+33>LIMIT)throw problem();const r=await rpc('salespilot_snapshot_save',{p_expected_revision:revision,p_payload:pack(bytes,key).toString('base64')});if(!r||!r.saved)throw problem('다른 접속에서 데이터가 변경됐습니다. 다시 시도하세요.',409);if(r.revision!==revision+1)throw problem();revision=r.revision;}
function refresh(db,bytes){
let source;try{
if(bytes){const file=path.join(dir,'incoming-cache.sqlite');fs.writeFileSync(file,bytes,{mode:0o600});source=new(require('node:sqlite').DatabaseSync)(file,{readOnly:true});const names=source.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r=>r.name);if(names.some(n=>!TABLES.includes(n)))throw problem();if(names.some(n=>n.startsWith('quote_')))require('./quote-versions').initialize(db);}
const exists=(d,t)=>d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t);
const imports=[];for(const t of TABLES){if(source&&exists(source,t)){if(!exists(db,t))throw problem();const cols=db.prepare('PRAGMA table_info('+t+')').all().map(r=>r.name),other=source.prepare('PRAGMA table_info('+t+')').all().map(r=>r.name);if(JSON.stringify(cols)!==JSON.stringify(other))throw problem();imports.push({t,cols,rows:source.prepare('SELECT * FROM '+t).all()});}}
db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;');try{for(const t of [...TABLES].reverse())if(exists(db,t))db.exec('DELETE FROM '+t);for(const {t,cols,rows} of imports){const insert=db.prepare('INSERT INTO '+t+' ('+cols.join(',')+') VALUES ('+cols.map(()=>'?').join(',')+')');for(const row of rows)insert.run(...cols.map(c=>row[c]));}if(db.prepare('PRAGMA foreign_key_check').all().length)throw problem();db.exec('COMMIT;');}catch(e){db.exec('ROLLBACK;');throw e;}finally{db.exec('PRAGMA foreign_keys=ON;');}
}finally{if(source)source.close();}}
async function sync(db){const n=await rpc('salespilot_snapshot_version');if(!Number.isSafeInteger(n)||n<0)throw problem();if(reload||n!==revision){const s=await state();refresh(db,decode(s.payload));revision=s.revision;reload=false;}}
function dispatch(db,req,res,work){const operation=tail.then(async()=>{
const oldEnd=res.end,oldHead=res.writeHead;let ended=false,out;
res.end=function(body){ended=true;out=body;return this;};
if(oldHead)res.writeHead=function(status,message,headers){this.statusCode=status;if(typeof message==='string')this.statusMessage=message;const h=typeof message==='object'?message:headers;if(h)for(const [k,v]of Object.entries(h))this.setHeader(k,v);return this;};
try{await sync(db);const before=db.prepare('SELECT total_changes() AS n').get().n;await work();if(db.prepare('SELECT total_changes() AS n').get().n!==before)await persist(db);}
catch(e){reload=true;if(res.removeHeader)res.removeHeader('Set-Cookie');throw e;}
finally{res.end=oldEnd;if(oldHead)res.writeHead=oldHead;}
if(ended)oldEnd.call(res,out);
});tail=operation.catch(()=>{});return operation;}
return {restore,dispatch};
}
module.exports={create};
