'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const {createInterface}=require('node:readline/promises');
const {TABLES}=require('../server/member-migration');
(async()=>{
 const input=createInterface({input:process.stdin,output:process.stdout});
 let raw;
 try{raw=process.argv[2]||await input.question('배포 완료된 공유 서버 HTTPS 주소: ');}finally{input.close();}
 const url=new URL(raw.trim());
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('경로 없는 HTTPS 공유 서버 주소를 입력하세요.');
 const base=url.origin;
 const state=await fetch(base+'/api/status',{redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!state.ok)throw new Error('공유 서버 상태를 확인할 수 없습니다.');
 const status=await state.json();
 if(!status.sharedService||!status.needsImport)throw new Error('계정 이전 대기 중인 빈 공유 서버가 아닙니다. 기존 자료는 덮어쓰지 않습니다.');
 const dir=process.env.SALESPILOT_LOCAL_DATA||path.join(process.env.USERPROFILE||process.env.HOME,'.oneai','workspace','salespilot-server-data');
 const keyPath=process.env.SALESPILOT_MIGRATION_KEY_FILE||path.join(__dirname,'..','..','SalesPilot_공유서버보안키_20261112','migration-key.txt');
 const key=fs.readFileSync(keyPath,'utf8').trim();
 if(!/^[a-f0-9]{64}$/.test(key))throw new Error('공유 서버 이전용 migration-key.txt 파일을 확인하세요.');
 const db=new DatabaseSync(path.join(dir,'members.sqlite'),{readOnly:true});
 const payload={version:1,tables:{}};
 try{
  db.exec('BEGIN');
  const tables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name));
  for(const table of TABLES)if(tables.has(table))payload.tables[table]=db.prepare('SELECT * FROM '+table).all();
  db.exec('COMMIT');
 }finally{db.close();}
 const users=payload.tables.users||[],docs=payload.tables.documents||[];
 if(!users.some(u=>u.role==='master'&&u.status==='active'))throw new Error('PC의 활성 관리자 계정을 확인하세요.');
 const body=JSON.stringify(payload);
 if(Buffer.byteLength(body)>16*1024*1024)throw new Error('이전 데이터가 16MB를 초과합니다. 별도 이전 절차가 필요합니다.');
 console.log(`이전 대상: ${base}\n회원 ${users.length}건, 문서 ${docs.length}건. 기존 이메일과 비밀번호를 유지하며 로그인 세션은 이전하지 않습니다.`);
 const confirmation=createInterface({input:process.stdin,output:process.stdout});
 let answer;
 try{answer=await confirmation.question('이 주소로 계정·자료를 이전할까요? 진행하려면 예 입력: ');}finally{confirmation.close();}
 if(answer.trim()!=='예'){console.log('이전하지 않았습니다.');return;}
 const response=await fetch(base+'/api/bootstrap/import',{method:'POST',headers:{'Content-Type':'application/json','Origin':base,'X-SalesPilot-Migration-Key':key},body,redirect:'error',signal:AbortSignal.timeout(60000)});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error||result.message||'계정 이전을 완료하지 못했습니다.');
 console.log(`이전 완료: 회원 ${result.users}건, 문서 ${result.documents}건.\n${base} 에서 기존 이메일과 비밀번호로 로그인하세요.`);
 console.log('PC 원본은 그대로 유지됩니다. 앞으로 공개·PC 바로가기는 이 공유 서버를 사용하세요. 기존 PC 서버와 자동 양방향 동기화되지는 않습니다.');
})().catch(e=>{console.error('이전 중단:',e.message);process.exitCode=1;});
