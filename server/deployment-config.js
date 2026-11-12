'use strict';
function config(env,port){
 const external=env.PUBLIC_URL||env.RENDER_EXTERNAL_URL||'';
 if(!external)return {cloud:false,base:`http://127.0.0.1:${port}`,host:'127.0.0.1',origins:new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]),secure:''};
 const url=new URL(external);
 if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('공유 서버 PUBLIC_URL은 경로 없는 HTTPS 주소여야 합니다.');
 if(env.RENDER!=='true')throw new Error('공유 모드는 Render의 보호된 HTTPS 프록시에서만 실행하세요.');
 if(!env.APP_DATA_DIR)throw new Error('공유 서버의 영구 APP_DATA_DIR을 지정하세요.');
 if(env.MIGRATION_KEY&&!/^[a-f0-9]{64}$/.test(env.MIGRATION_KEY))throw new Error('MIGRATION_KEY 형식을 확인하세요.');
 if(env.ADMIN_RECOVERY_KEY&&!/^[a-f0-9]{64}$/.test(env.ADMIN_RECOVERY_KEY))throw new Error('ADMIN_RECOVERY_KEY 형식을 확인하세요.');
 if(env.MIGRATION_KEY&&env.ADMIN_RECOVERY_KEY===env.MIGRATION_KEY)throw new Error('이전 키와 관리자 복구 키는 서로 달라야 합니다.');
 return {cloud:true,base:url.origin,host:'0.0.0.0',origins:new Set([url.origin]),secure:'; Secure'};
}
function checkRequest(req,url,settings){
 const host=(req.headers.host||'').toLowerCase();
 // Read-only readiness is also available to the platform's internal health probe.
 if(settings.cloud&&req.method==='GET'&&url.pathname==='/api/status')return true;
 if(settings.cloud){
  if(host!==new URL(settings.base).host.toLowerCase())return false;
  // Render edge terminates TLS; the application port is not exposed directly.
  if(req.headers['x-forwarded-proto']!=='https'&&url.pathname!=='/api/status')return false;
 }else if(!settings.origins.has('http://'+host))return false;
 return true;
}
module.exports={config,checkRequest};
