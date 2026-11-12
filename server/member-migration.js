'use strict';
const crypto=require('node:crypto');
const TABLES=['users','settings','documents','meta','quote_version_counters','quote_version_allocations'];
function error(status,message){const e=new Error(message);e.status=status;throw e;}
function verifyKey(supplied,expected){
 if(typeof expected!=='string'||!/^[a-f0-9]{64}$/.test(expected))error(403,'계정 이전이 설정되지 않았습니다.');
 if(typeof supplied!=='string'||!/^[a-f0-9]{64}$/.test(supplied)||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))error(403,'계정 이전 보안 키가 올바르지 않습니다.');
}
function importTables(db,payload){
 const occupied=()=>TABLES.some(table=>db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)&&db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n>0);
 if(occupied())error(409,'이 서버에는 이미 데이터가 있습니다. 기존 계정을 덮어쓰지 않습니다.');
 if(!payload||payload.version!==1||!payload.tables||typeof payload.tables!=='object'||Array.isArray(payload.tables))error(400,'이전 데이터 형식을 확인하세요.');
 if(Object.keys(payload.tables).some(t=>!TABLES.includes(t)))error(400,'허용되지 않은 이전 항목입니다.');
 const users=payload.tables.users;
 if(!Array.isArray(users)||!users.length||users.length>5000||!users.some(u=>u&&u.role==='master'&&u.status==='active'))error(400,'활성 관리자 계정이 포함된 데이터가 필요합니다.');
 for(const u of users){
  if(!u||typeof u!=='object'||Array.isArray(u)||typeof u.id!=='string'||typeof u.email!=='string'||!u.name||!['master','member'].includes(u.role)||!['active','pending','disabled'].includes(u.status)||!/^[a-f0-9]{32}$/.test(u.salt)||!/^[a-f0-9]{128}$/.test(u.password_hash))error(400,'회원 인증 데이터가 올바르지 않습니다.');
 }
 if(payload.tables.quote_version_counters||payload.tables.quote_version_allocations)require('./quote-versions').initialize(db);
 const prepared=[];let documents=0;
 for(const table of TABLES){
  const rows=payload.tables[table]||[];
  if(!Array.isArray(rows)||rows.length>100000)error(400,'이전 항목 크기를 확인하세요.');
  if(!rows.length)continue;
  const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name);
  if(!cols.length)error(400,'서버 데이터 구조가 일치하지 않습니다.');
  for(const row of rows){
   if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).length!==cols.length||cols.some(c=>!Object.hasOwn(row,c)))error(400,'이전 데이터 열이 일치하지 않습니다.');
   if(cols.some(c=>row[c]!==null&&!['string','number'].includes(typeof row[c])))error(400,'이전 데이터 값을 확인하세요.');
   if(table==='meta'&&['shared_import_complete'].includes(row.key))error(400,'이전 기록을 다시 가져올 수 없습니다.');
   if(table==='documents'){try{JSON.parse(row.data);}catch{error(400,'문서 데이터 형식이 올바르지 않습니다.');}documents++;}
   if(table==='settings'){try{JSON.parse(row.data);}catch{error(400,'설정 데이터 형식이 올바르지 않습니다.');}}
  }
  prepared.push({table,rows,cols});
 }
 db.exec('BEGIN IMMEDIATE');
 try{
  if(occupied())error(409,'이 서버에 데이터가 이미 생성되었습니다. 다시 이전하지 않습니다.');
  for(const {table,rows,cols} of prepared){
   const stmt=db.prepare(`INSERT INTO ${table} (${cols.map(c=>'"'+c+'"').join(',')}) VALUES (${cols.map(()=>'?').join(',')})`);
   for(const row of rows)stmt.run(...cols.map(c=>row[c]));
  }
  db.prepare("INSERT OR IGNORE INTO meta VALUES ('master_initialized','1')").run();
  db.prepare("INSERT INTO meta VALUES ('shared_import_complete',?)").run(String(Date.now()));
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');error(400,'계정 이전 검증에 실패했습니다. 대상 데이터는 변경되지 않았습니다.');}
 return {ok:true,users:users.length,documents,sessionsImported:false};
}
module.exports={TABLES,verifyKey,importTables};
