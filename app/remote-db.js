/* Server-session database adapter. No local-document migration or fallback. */
(function(g){
'use strict';
const auth=()=>g.SalesPilotAuth, listeners=new Set();
const copy=v=>v===undefined?undefined:structuredClone(v);
const active=()=>!!(auth()&&auth().isAuthenticated());
function fail(message,status){const e=new Error(message);e.status=status||0;e.code=status===401?'login_required':'invalid_response';return e;}
function owner(){const u=auth()&&auth().getUser();return active()&&u?String(u.id):null;}
async function request(path,options){
 const id=owner();if(!id)throw fail('로그인이 필요합니다.',401);
 const result=await auth().request(path,options);
 if(owner()!==id)throw fail('회원 세션이 변경되었습니다. 다시 로그인하세요.',401);
 if(!result||result.ok!==true)throw fail('회원 서버 응답이 올바르지 않습니다.');return result;
}
function snap(id,data,exists=true,path){return{id,exists,ref:path?ref(path):undefined,metadata:{fromCache:false},data:()=>copy(data)};}
function empty(){const docs=[];return{docs,size:0,empty:true,metadata:{fromCache:false},forEach:fn=>docs.forEach(fn)};}
function notify(){listeners.forEach(fn=>fn());}
function subscribe(refresh,next,onError){
 let live=true,busy=false;const run=async()=>{if(!live||busy)return;busy=true;const id=owner();try{const value=await refresh();if(live&&owner()===id)next(value);}catch(e){if(live){if(onError)onError(e);else console.warn('회원 자료 조회 실패:',e.code||'api_error');}}finally{busy=false;}};
 listeners.add(run);run();const timer=g.setInterval(run,2000);return()=>{live=false;g.clearInterval(timer);listeners.delete(run);};
}
function ref(path){
 path=String(path).replace(/^\/+|\/+$/g,'');const match=path.match(/^data\/users\/([^/]+)\/profile$/),userId=match&&match[1];
 const parts=path.split('/'),id=parts.pop(),name=parts.join('/');
 if(!id||!name||(!userId&&name.includes('/')))throw fail('문서 경로가 올바르지 않습니다.');
 const url='/api/documents/'+encodeURIComponent(name)+'/'+encodeURIComponent(id);
 async function get(){
  if(!active())return snap(id,undefined,false,path);
  if(userId){const me=await request('/api/me');if(!me.user||me.user.status!=='active'||String(me.user.id)!==owner())throw fail('회원 정보 응답이 올바르지 않습니다.');
   if(String(me.user.id)===userId)return snap(id,me.user,true,path);
   const r=await request('/api/admin/users');if(!Array.isArray(r.users))throw fail('회원 목록 응답이 올바르지 않습니다.');const u=r.users.find(u=>String(u.id)===userId);return snap(id,u,!!u,path);
  }
  try{const r=await request(url);if(r.id!==id||!Object.hasOwn(r,'data'))throw fail('문서 응답이 올바르지 않습니다.');return snap(id,r.data,true,path);}catch(e){if(e.status===404)return snap(id,undefined,false,path);throw e;}
 }
 async function set(data,options){
  if(!active())throw fail('로그인이 필요합니다.',401);
  if(userId){const values={};for(const k of ['name','email','org','dept','rank','phone','folderLabel','folderPathLabel'])if(data[k]!=null)values[k]=data[k];const r=await request(owner()===userId?'/api/me':'/api/admin/users/'+encodeURIComponent(userId),{method:'PATCH',body:values});if(!r.user||String(r.user.id)!==userId)throw fail('회원 저장 응답이 올바르지 않습니다.');if(owner()===userId)g.dispatchEvent(new CustomEvent('salespilot-profile-change',{detail:{user:r.user}}));}
  else{const r=await request(url,{method:options&&options.merge?'PATCH':'PUT',body:{data}});if(r.id!==id||!Object.hasOwn(r,'data'))throw fail('문서 저장 응답이 올바르지 않습니다.');if(g.SalesPilotFiles&&g.SalesPilotFiles.captureDocument){try{await g.SalesPilotFiles.captureDocument(path,r.data);}catch(_){g.dispatchEvent(new CustomEvent('salespilot-storage-warning',{detail:{message:'서버 저장은 완료되었지만 개인 폴더 저장을 확인하세요.'}}));}}}
  notify();
 }
 async function remove(){if(userId)throw fail('회원 삭제는 회원관리에서 처리하세요.');await request(url,{method:'DELETE'});notify();}
 return{id,path,get,set,update:data=>set(data,{merge:true}),delete:remove,onSnapshot:(next,error)=>subscribe(get,next,error)};
}
function collection(name){
 name=String(name);if(!name||name.includes('/'))throw fail('자료 목록 이름이 올바르지 않습니다.');
 const field=(v,k)=>String(k).split('.').reduce((a,x)=>a==null?undefined:a[x],v);
 const make=(filters=[],sort=null,max=null)=>{
  const query={doc:id=>ref(name+'/'+(id||crypto.randomUUID())),where:(field,op,value)=>make([...filters,{field,op,value}],sort,max),orderBy:(field,direction='asc')=>make(filters,{field,direction},max),limit:value=>make(filters,sort,Math.max(0,Number(value))),get:async()=>{
   if(!active())return empty();if(name==='_users')throw fail('회원 정보는 서버 회원관리에서 조회하세요.');
   const r=await request('/api/documents?collection='+encodeURIComponent(name));if(!Array.isArray(r.documents)||r.documents.some(d=>!d||typeof d.id!=='string'||!Object.hasOwn(d,'data')))throw fail('문서 목록 응답이 올바르지 않습니다.');
   let docs=r.documents.map(d=>snap(d.id,d.data,true,name+'/'+d.id));
   for(const f of filters)docs=docs.filter(d=>{const v=field(d.data(),f.field);switch(f.op){case '==':return v===f.value;case '!=':return v!==f.value;case '<':return v<f.value;case '<=':return v<=f.value;case '>':return v>f.value;case '>=':return v>=f.value;case 'in':return Array.isArray(f.value)&&f.value.includes(v);case 'array-contains':return Array.isArray(v)&&v.includes(f.value);default:throw fail('지원하지 않는 조회 조건입니다.');}});
   if(sort)docs.sort((a,b)=>{const x=field(a.data(),sort.field),y=field(b.data(),sort.field);return(x<y?-1:x>y?1:0)*(sort.direction==='desc'?-1:1);});if(max!=null)docs=docs.slice(0,max);
   return{docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false},forEach:fn=>docs.forEach(fn)};
  }};query.onSnapshot=(next,error)=>subscribe(query.get,next,error);return query;
 };return make();
}
g.addEventListener('salespilot-auth-change',notify);
g.SalesPilotRemoteDatabase={doc:ref,collection};
})(window);
