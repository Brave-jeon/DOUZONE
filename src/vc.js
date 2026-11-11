
/* ================= 내 정보(작성자 프로필) ================= */
Object.assign(S,{me:null,uid:null,meetings:new Map(),dict:null,sample:null,vdraft:null,vid:null,vdirty:false});
const ME_LS='qd-profile';
const meNR=p=>{p=p||S.me;return p?[p.name,p.rank].filter(Boolean).join(' '):''};           // 담당자28 과장
const meRN=p=>{p=p||S.me;return p?[p.rank,p.name].filter(Boolean).join(' '):''};           // 과장 담당자28
const meLine=p=>{p=p||S.me;return p?meNR(p)+(p.phone?` (${p.phone})`:''):''};             // 담당자28 과장 (010-…)
function renderMeChip(){const b=$('#me-btn');if(!b)return;b.textContent=S.me&&S.me.name?`${meNR()} · 내 정보`:'내 정보 입력';}
function openProfile(first){const p=S.me||{};
  $('#pf-first').hidden=!first;
  [['pf-org',p.org],['pf-dept',p.dept],['pf-name',p.name],['pf-rank',p.rank],['pf-phone',p.phone],['pf-email',p.email]].forEach(([id,v])=>$('#'+id).value=v||'');
  $('#pf-modal').hidden=false;setTimeout(()=>$('#pf-name').focus(),30)}
async function saveProfile(){
  const g=id=>$('#'+id).value.trim();const p={org:g('pf-org'),dept:g('pf-dept'),name:g('pf-name'),rank:g('pf-rank'),phone:g('pf-phone'),email:g('pf-email')};
  if(!p.name||!p.org||!p.phone){toast('소속, 이름, 연락처는 꼭 입력해 주세요');return}
  if(!p.dept)p.dept=p.org.split(/\s+/).pop();
  S.me=p;try{localStorage.setItem(ME_LS,JSON.stringify(p))}catch(_){}
  if(S.db&&S.uid){try{await S.db.doc('data/users/'+S.uid+'/profile').set(p)}catch(_){toast('내 정보를 공유 저장소에 저장하지 못해 이 브라우저에만 저장했습니다')}}
  $('#pf-modal').hidden=true;renderMeChip();toast('내 정보를 저장했습니다. 새로 만드는 견적·기안·구축요청에 반영됩니다.');
  if(S.view==='xedit'&&S.isNew){xlApplyMe();refreshX()}
}
$('#pf-save').onclick=saveProfile;$('#pf-cancel').onclick=()=>{$('#pf-modal').hidden=true};
$('#me-btn').onclick=()=>openProfile(false);
// 견적(엑셀 양식) 헤더·체크리스트에 작성자 정보
function xlApplyMe(){if(!S.me||!X.d)return;const d=X.d;
  [S.draft.sheet,'A10_체크리스트'].forEach(sh=>{if(!d.sheets[sh])return;Object.entries(xlInputs(d,sh)).forEach(([a,inp])=>{if(inp.t!=='text')return;const L=inp.label;
    const v=/^견적담당|^영업담당$/.test(L)?meLine():L==='영업센터'?S.me.org:L==='영업담당자'?meNR():L==='연락처'?S.me.phone:null;
    if(v!=null)setXInput(sh+'!'+a,v)})})}

/* ================= 음성 상담 → 문서 자동 작성 ================= */
const V_TEMPLATES=XQ_TPLS.map(t=>`${t.id}: ${t.name}`).join('\n');
function newMeeting(){return{title:'',status:'녹음 전',createdAt:new Date(Date.now()+9*3600e3).toISOString().slice(0,16).replace('T',' '),owner:S.uid||'',author:meNR(),transcript:'',analysis:null,quoteId:''}}
function vEarly(c){
  c.use('dictation').then(d=>{S.dict=d;vDictUi();if(!d)return;
    d.onPartial(({text})=>{$('#v-partial').textContent=text});
    d.onFinal(({text})=>{const ta=$('#v-text');if(!ta||!S.vdraft)return;const t=text.trim();if(!t)return;ta.value=(ta.value&&!/\s$/.test(ta.value)?ta.value+' ':ta.value)+t;S.vdraft.transcript=ta.value;$('#v-partial').textContent='';setVDirty(true);ta.scrollTop=ta.scrollHeight;vCount()});
    d.onState(({state,reason})=>{S.dictState=state;vDictUi();if(state==='idle'){$('#v-partial').textContent='';
      const msg={hidden:'화면을 벗어나 녹음이 멈췄습니다. 돌아와서 다시 시작하세요.',time_limit:'한 번에 최대 60분까지 녹음됩니다. 이어서 녹음하려면 다시 시작하세요.',not_granted:'마이크 사용이 허용되지 않았습니다. 대화 내용을 직접 붙여넣어 주세요.',unavailable:'이 계정이나 환경에서는 음성 받아쓰기를 쓸 수 없습니다. 대화 내용을 붙여넣어 주세요.',rate_limited:'잠시 후 다시 시작해 주세요.',upstream_error:'마이크 또는 음성 인식에 문제가 생겼습니다. 다시 시작해 주세요.'}[reason];
      if(msg)toast(msg);if(reason==='not_granted'||reason==='unavailable'){S.dictOff=true;vDictUi()}
      if(S.vdraft&&S.vdraft.status==='녹음 중'){S.vdraft.status='녹음 완료';setVDirty(true)}}})});
  c.use('sample').then(s=>{S.sample=s;vAiUi()});
}
async function vInit(c,db){
  window.addEventListener('salespilot-profile-change',event=>{
    if(event.detail&&event.detail.path==='data/users/'+S.uid+'/profile'){
      S.me=clone(event.detail.profile);
      try{localStorage.setItem(ME_LS,JSON.stringify(S.me));}catch(_){}
      renderMeChip();if(typeof renderNav==='function')renderNav();
      if(S.view==='xedit'&&S.isNew){xlApplyMe();refreshX();}
    }
  });
  window.addEventListener('salespilot-ai-change',()=>{if(window.SalesPilotPlatform){S.sample=window.SalesPilotPlatform.getSample();vAiUi();}});
  let u=null;try{u=await c.use('user')}catch(_){}
  if(u&&u.id){try{S.uid=await u.id()}catch(_){}}
  let p=null;
  if(db&&S.uid){try{const snap=await db.doc('data/users/'+S.uid+'/profile').get();if(snap.exists)p=snap.data()}catch(_){}}
  if(!p){try{p=JSON.parse(localStorage.getItem(ME_LS)||'null')}catch(_){}if(p&&db&&S.uid){db.doc('data/users/'+S.uid+'/profile').set(p).catch(()=>{})}}
  S.me=p;S.meLoaded=true;renderMeChip();
  if(db)db.collection('meetings').onSnapshot(snap=>{const m=new Map();snap.docs.forEach(d=>{const v=d.data();if(v)m.set(d.id,Object.assign({},clone(v),{id:d.id}))});S.meetings=m;
    if(S.view==='vedit'){vRenderList();if(!S.vdirty&&S.vid&&m.has(S.vid)&&!S.visNew){const nv=m.get(S.vid);if(JSON.stringify(nv)!==JSON.stringify(S.vdraft)){S.vdraft=clone(nv);vRender()}}}},()=>{});
}
function vDictUi(){const b=$('#v-rec');if(!b)return;const on=S.dictState==='listening'||S.dictState==='starting';
  b.hidden=!S.dict||S.dictOff;$('#v-nodict').hidden=!!(S.dict&&!S.dictOff);
  b.disabled=S.dictState==='processing';b.textContent=S.dictState==='processing'?'녹음 인식 중…':on?(S.dictState==='starting'?'마이크 연결 중…':'녹음 멈추기'):'녹음 시작';b.classList.toggle('rec',on);$('#v-live').hidden=!(on||S.dictState==='processing')}
function vAiUi(){const ok=!!S.sample;['#v-analyze','#v-mkq','#v-sum'].forEach(x=>{const b=$(x);if(b){b.disabled=!ok;b.title=ok?'':'AI 서버 연결 설정에서 실제 API 주소와 모델을 설정해야 합니다'}})}
function setVDirty(v){S.vdirty=v;$('#vdirty').hidden=!v}
const vCount=()=>{const t=$('#v-text').value;$('#v-count').textContent=`${t.replace(/\s/g,'').length.toLocaleString()}자`};

$('#v-open').onclick=()=>openMeeting(null);
function openMeeting(id){
  const m=id&&S.meetings.get(id);S.vdraft=m?clone(m):Object.assign(newMeeting(),{id:uid().replace(/^q/,'m')});S.vid=S.vdraft.id;S.visNew=!m;setVDirty(false);
  show('vedit');vRenderList();vRender();vDictUi();vAiUi()}
function vRenderList(){const sel=$('#v-list');const list=[...S.meetings.values()].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  sel.innerHTML=`<option value="">이전 상담 불러오기 (${list.length})</option>`+list.map(m=>`<option value="${esc(m.id)}"${m.id===S.vid?' selected':''}>${esc((m.createdAt||'').slice(0,10))} · ${esc(m.title||m.analysis&&m.analysis.customer&&m.analysis.customer.name||'(제목 없음)')} · ${esc(m.author||'')}</option>`).join('')}
$('#v-list').onchange=e=>{const id=e.target.value;if(!id)return;if(S.vdirty){toast('먼저 현재 상담을 저장하세요');vRenderList();return}openMeeting(id)};
$('#v-new').onclick=()=>{if(S.vdirty){toast('먼저 현재 상담을 저장하세요');return}openMeeting(null)};

function vRender(){const m=S.vdraft;
  $('#v-title').value=m.title||'';$('#v-text').value=m.transcript||'';vCount();
  $('#v-meta').textContent=`${m.createdAt||''} · ${m.author||''}${m.quoteId&&S.quotes.get(m.quoteId)?' · 연결 견적: '+(S.quotes.get(m.quoteId).customer||''):''}`;
  vRenderAnalysis()}
$('#v-title').oninput=e=>{S.vdraft.title=e.target.value;setVDirty(true)};
$('#v-text').oninput=e=>{S.vdraft.transcript=e.target.value;setVDirty(true);vCount()};
$('#v-rec').onclick=()=>{const d=S.dict;if(!d)return;
  if(S.dictState==='listening'||S.dictState==='starting'){d.stop().catch(()=>{});return}
  d.start().catch(err=>{const c=err&&err.code;if(c==='not_granted'||c==='unavailable'){S.dictOff=true;vDictUi();toast('음성 받아쓰기를 쓸 수 없습니다. 대화 내용을 붙여넣어 주세요.')}else if(c==='rate_limited')toast('잠시 후 다시 시작해 주세요.');else if(c!=='stopped'&&c!=='dismissed')toast('녹음을 시작하지 못했습니다')});
  if(S.vdraft){S.vdraft.status='녹음 중'}};
$('#v-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  if(!/^text\/|\.txt$|\.md$|\.srt$|\.vtt$/i.test(f.type+' '+f.name)){toast('텍스트 파일(.txt, .srt, .vtt)만 불러올 수 있습니다. 음성 파일은 재생하면서 ‘녹음 시작’으로 받아쓰세요.');return}
  let t=await f.text();if(/\.(srt|vtt)$/i.test(f.name))t=t.replace(/^WEBVTT.*$/m,'').replace(/^\d+\s*$/gm,'').replace(/^[\d:.,]+\s*-->\s*[\d:.,]+.*$/gm,'').replace(/\n{2,}/g,'\n').trim();
  const ta=$('#v-text');ta.value=(ta.value?ta.value+'\n':'')+t;S.vdraft.transcript=ta.value;if(!S.vdraft.title)S.vdraft.title=f.name.replace(/\.[^.]+$/,'');$('#v-title').value=S.vdraft.title;setVDirty(true);vCount()};

async function saveMeeting(){const m=S.vdraft;m.updatedAt=new Date(Date.now()+9*3600e3).toISOString().slice(0,19);if(!m.title&&m.analysis&&m.analysis.customer)m.title=(m.analysis.customer.name||'')+' 상담';
  if(!S.db){S.meetings.set(m.id,clone(m));setVDirty(false);S.visNew=false;return true}
  try{await S.db.collection('meetings').doc(m.id).set(clone(m));S.meetings.set(m.id,clone(m));setVDirty(false);S.visNew=false;toast('상담 내용을 저장했습니다');return true}
  catch(err){toast(err&&err.code==='invalid_argument'?'저장 권한이 없습니다.':'저장하지 못했습니다');return false}}
$('#v-save').onclick=saveMeeting;
$('#v-back').onclick=()=>{const k=$('#v-back');if(S.vdirty&&!k.dataset.armed){k.dataset.armed='1';k.textContent='저장 안 하고 나가기';setTimeout(()=>{if(k.dataset.armed){delete k.dataset.armed;k.textContent='← 목록'}},3500);return}
  delete k.dataset.armed;k.textContent='← 목록';if(S.dict&&S.dictState==='listening')S.dict.stop().catch(()=>{});S.vdraft=null;setVDirty(false);show('dash')};
$('#v-del').onclick=async()=>{const x=$('#v-del');if(!x.dataset.armed){x.dataset.armed='1';x.textContent='삭제 확인';setTimeout(()=>{delete x.dataset.armed;x.textContent='삭제'},3500);return}
  delete x.dataset.armed;x.textContent='삭제';if(!S.visNew){try{if(S.db)await S.db.collection('meetings').doc(S.vid).delete();S.meetings.delete(S.vid)}catch(_){toast('삭제하지 못했습니다');return}}setVDirty(false);openMeeting(null);toast('삭제했습니다')};

/* ----- 1단계: 대화 분석 ----- */
const V_SCHEMA=`{
 "summary": "상담 요약 3~6줄 (줄바꿈 \\n)",
 "customer": {"name":"고객사명","bizNo":"사업자등록번호","ceo":"대표자","addr":"주소","bizType":"업태","bizItem":"종목","contact":"고객 담당자 이름","contactTitle":"직급","dept":"부서","tel":"전화","hp":"휴대폰","email":"이메일","visitAddr":"방문 주소"},
 "product": {"template":"아래 양식 id 중 하나","deploy":"배포 방식 (예: Cloud, 설치형 더존IDC 일시납, 고객사 IDC, 더존IDC 임대형/VM)","profit":"영리|비영리","users":{"expert":0,"user":0,"mail":0,"yearEnd":0,"forme":0,"crm":0},"modules":["도입 모듈/옵션 이름 그대로"],"oneai":"ONE AI 요금제 (예: 50요금제)","education":"교육 요청","hardware":"하드웨어/서버 요구","customization":"커스터마이징/API 연동 요구","quoteName":"견적명"},
 "discount": {"requested":false,"rate":"요청 할인율 %","promoName":"언급된 프로모션","reasons":["할인 사유"]},
 "contract": {"expectedDate":"YYYY-MM-DD","payment":"지불 조건","period":"계약/사용 기간","special":"특약·특이사항"},
 "build": {"serverLocation":"더존 IDC|고객사 IDC|타사 IDC|자체서버","serverType":"물리서버|클라우드 서버","domain":"소유 도메인","url":"희망 접속 URL","adminId":"회사대표 ID","itName":"고객 전산담당자","itPhone":"전산담당자 연락처","eduStart":"YYYY-MM-DD","buildStart":"YYYY-MM-DD","buildEnd":"YYYY-MM-DD","migUc":"UC 마이그레이션 대상/범위","migErp":"ERP 마이그레이션 범위","firewall":false,"ssl":"기본|멀티|","notes":"구축 관련 특이사항"},
 "nextActions": ["후속 조치"]
}`;
async function vAnalyze(){const m=S.vdraft;const t=(m.transcript||'').trim();if(t.length<20){toast('분석할 대화 내용이 너무 짧습니다');return}
  if(!S.sample){toast('이 화면에서는 Claude 분석을 사용할 수 없습니다');return}
  const b=$('#v-analyze');b.disabled=true;b.textContent='분석 중…';$('#v-ai').innerHTML='<div class="empty">Claude가 상담 내용을 분석하고 있습니다…</div>';
  const prompt=`당신은 회사01 Amaranth 10 영업 지원 담당입니다. 아래는 영업 담당자와 고객의 상담(통화/미팅) 녹취 텍스트입니다. 음성 인식 결과라 오탈자가 있을 수 있습니다.
견적서·계약서·할인기안서·구축요청서 작성에 필요한 정보를 뽑아 JSON 하나로만 답하세요.
규칙: 대화에 나오지 않은 값은 빈 문자열("") 또는 0/false/빈 배열로 둡니다. 추측해서 채우지 마세요. 숫자는 숫자로. 날짜는 YYYY-MM-DD(연도가 없으면 ${today().slice(0,4)}년 기준).
"product.template"은 다음 양식 id 중 가장 알맞은 것 (판단 불가면 ""):
${V_TEMPLATES}
유저 구분: expert=전문가(ERP) 유저, user=사용자(임직원) 유저, mail=메일 유저, yearEnd=연말정산 전용, forme=모바일 ForMe 전용, crm=CRM 사용자.
형식:
${V_SCHEMA}

[작성자] ${meLine()||'(미입력)'} / ${S.me?S.me.org:''}
[상담 녹취]
${t}`;
  try{const r=await S.sample.json(prompt,{modelTier:'default',cache:false});if(!r||typeof r!=='object'||!r.customer)throw{code:'invalid_json'};
    m.analysis=vNorm(r);m.status='분석 완료';if(!m.title)m.title=(m.analysis.customer.name||'고객')+' 상담';$('#v-title').value=m.title;setVDirty(true);vRenderAnalysis();await saveMeeting()}
  catch(err){const c=err&&err.code;$('#v-ai').innerHTML='';vRenderAnalysis();
    toast(c==='not_granted'?'Claude 분석이 허용되지 않았습니다':c==='rate_limited'?'요청이 많아 잠시 후 다시 시도해 주세요':c==='invalid_json'?'분석 결과를 읽지 못했습니다. 다시 시도해 주세요':'분석하지 못했습니다'+(c?` (${c})`:''))}
  finally{b.disabled=!S.sample;b.textContent='내용 분석'}}
$('#v-analyze').onclick=vAnalyze;
function vNorm(r){const o=(x)=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};const a=x=>Array.isArray(x)?x.map(String):x?[String(x)]:[];const s=x=>x==null?'':String(x);
  const out={summary:s(r.summary),customer:o(r.customer),product:o(r.product),discount:o(r.discount),contract:o(r.contract),build:o(r.build),nextActions:a(r.nextActions)};
  Object.keys(out.customer).forEach(k=>out.customer[k]=s(out.customer[k]));out.product.users=o(out.product.users);out.product.modules=a(out.product.modules);out.discount.reasons=a(out.discount.reasons);
  if(!XQ_TPLS.some(t=>t.id===out.product.template))out.product.template='';return out}

const V_FIELDS=[
 ['고객 정보','customer',[['name','고객사명'],['bizNo','사업자등록번호'],['ceo','대표자'],['addr','주소',1],['bizType','업태'],['bizItem','종목'],['contact','담당자'],['contactTitle','직급'],['dept','부서'],['tel','전화'],['hp','휴대폰'],['email','이메일'],['visitAddr','방문 주소',1]]],
 ['견적 요구사항','product',[['template','견적 양식','tpl'],['deploy','배포 방식'],['profit','영리/비영리'],['quoteName','견적명'],['users.expert','전문가 유저','n'],['users.user','사용자(임직원) 유저','n'],['users.mail','메일 유저','n'],['users.yearEnd','연말정산 유저','n'],['users.forme','모바일 ForMe 유저','n'],['users.crm','CRM 유저','n'],['modules','도입 모듈·옵션 (쉼표)','arr'],['oneai','ONE AI 요금제'],['education','교육',1],['hardware','하드웨어·서버',1],['customization','커스터마이징·API',1]]],
 ['할인 요청','discount',[['requested','할인 요청 있음','chk'],['rate','요청 할인율 %'],['promoName','프로모션'],['reasons','할인 사유 (줄바꿈)','lines']]],
 ['계약 조건','contract',[['expectedDate','계약 예정일','date'],['payment','지불 조건'],['period','계약 기간'],['special','특이사항',1]]],
 ['구축 정보','build',[['serverLocation','서버 위치'],['serverType','서버 Type'],['domain','소유 도메인'],['url','희망 접속 URL'],['adminId','회사대표 ID'],['itName','전산담당자'],['itPhone','전산담당자 연락처'],['eduStart','교육 시작','date'],['buildStart','구축 시작','date'],['buildEnd','구축 종료','date'],['migUc','UC 마이그레이션',1],['migErp','ERP 마이그레이션',1],['firewall','전용 방화벽','chk'],['ssl','SSL (기본/멀티)'],['notes','구축 특이사항',1]]]];
const gp=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function sp(o,p,v){const ks=p.split('.');const l=ks.pop();const t=ks.reduce((a,k)=>a[k]==null?(a[k]={}):a[k],o);t[l]=v}
function vRenderAnalysis(){const A=S.vdraft&&S.vdraft.analysis;const box=$('#v-ai');
  if(!A){box.innerHTML=`<div class="empty">녹음을 마치거나 대화 내용을 붙여넣은 뒤 <b>내용 분석</b>을 누르세요.<br>고객 정보, 유저 수·모듈, 할인 요청, 계약 조건, 구축 정보를 뽑아 견적서 → 계약서 → 할인기안 → 구축요청서에 자동으로 넣습니다.</div>`;$('#v-acts').hidden=true;return}
  const f=(sec,[k,l,t])=>{const p=sec+'.'+k;const v=gp(A,p);const a=`data-vp="${p}" aria-label="${esc(l)}"`;
    if(t==='tpl')return`<label class="fld"><span>${l}</span><select ${a}><option value="">—</option>${XQ_TPLS.map(x=>`<option value="${x.id}"${x.id===v?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label>`;
    if(t==='chk')return`<label class="fld chk"><input type="checkbox" ${a}${v?' checked':''}><span>${l}</span></label>`;
    if(t==='lines')return`<label class="fld wide"><span>${l}</span><textarea rows="3" ${a}>${esc((v||[]).join('\n'))}</textarea></label>`;
    if(t===1)return`<label class="fld wide"><span>${l}</span><textarea rows="2" ${a}>${esc(v)}</textarea></label>`;
    return`<label class="fld"><span>${l}</span><input ${t==='n'?'type="number" min="0"':t==='date'?'type="date"':''} ${a} value="${esc(t==='arr'?(v||[]).join(', '):v??'')}"></label>`};
  box.innerHTML=`<div class="card"><h3>상담 요약</h3><textarea class="vsum" rows="4" data-vp="summary" aria-label="상담 요약">${esc(A.summary)}</textarea>
    ${A.nextActions.length?`<div class="hint" style="margin-top:6px"><b>후속 조치</b><br>${A.nextActions.map(x=>'· '+esc(x)).join('<br>')}</div>`:''}</div>
    ${V_FIELDS.map(([h,sec,fs])=>`<div class="card"><h3>${h}</h3><div class="fgrid">${fs.map(x=>f(sec,x)).join('')}</div></div>`).join('')}`;
  $('#v-acts').hidden=false;vLinks()}
$('#v-ai').addEventListener('input',e=>{const el=e.target;const p=el.dataset.vp;if(!p)return;const A=S.vdraft.analysis;let v=el.type==='checkbox'?el.checked:el.value;
  if(/^product\.modules$/.test(p))v=v.split(/[,，]/).map(x=>x.trim()).filter(Boolean);else if(p==='discount.reasons')v=v.split('\n').map(x=>x.trim()).filter(Boolean);else if(el.type==='number')v=v===''?0:+v;
  sp(A,p,v);setVDirty(true)});
function vLinks(){const m=S.vdraft;const q=m.quoteId&&S.quotes.get(m.quoteId);const box=$('#v-links');
  const c=q&&byQuote(S.contracts,q.id),d=q&&byQuote(S.discounts,q.id),b=c&&brOfContract(c.id);
  box.innerHTML=q?`<span class="chip ok">견적 ${esc(q.status)}</span>${c?`<span class="chip ok">계약 ${esc(c.status)}</span>`:'<span class="chip">계약 전</span>'}${d?`<span class="chip ok">할인기안 ${esc(d.status)}</span>`:''}${b?`<span class="chip ok">구축요청 ${esc(b.status)}</span>`:''}
   <button class="ib" data-vgo="q">견적 열기</button>${c?'<button class="ib" data-vgo="c">계약서 열기</button>':''}${d?'<button class="ib" data-vgo="d">할인기안 열기</button>':''}${b?'<button class="ib" data-vgo="b">구축요청 열기</button>':''}`:'<span class="hint">아직 연결된 견적이 없습니다.</span>';
  $('#v-mkq').textContent=q?'견적서 새로 만들기':'견적서 만들기'}
$('#v-links').addEventListener('click',e=>{const x=e.target.closest('[data-vgo]');if(!x)return;if(S.vdirty){toast('먼저 상담을 저장하세요');return}const m=S.vdraft;const q=S.quotes.get(m.quoteId);if(!q)return;
  const k=x.dataset.vgo;if(k==='q')openQuote(q.id);else{const c=byQuote(S.contracts,q.id);if(k==='c'&&c)openContract(c.id);else if(k==='d'){const d=byQuote(S.discounts,q.id);if(d)openDiscount(d.id)}else if(k==='b'&&c){const b=brOfContract(c.id);if(b)openBuildReq(b.id)}}});

/* ----- 2단계: 견적서(엑셀 양식) 자동 입력 ----- */
function xlCatalog(d,book,sheet){
  const sh=d.sheets[sheet];const ins=xlInputs(d,sheet);const out=[];
  const T=(col,r)=>{const c=XL.colNum(col);const mg=(sh.merges||[]).find(([a,b,e,f])=>r>=a&&r<=e&&c>=b&&c<=f);const rr=mg?mg[0]:r,cc=mg?mg[1]:c;const v=book.value(sheet,rr,cc);return v==null||XL.isErr(v)?'':String(v).replace(/\s+/g,' ').trim()};
  let sec='';
  Object.keys(ins).sort((a,b)=>+a.replace(/\D/g,'')-+b.replace(/\D/g,'')||a.localeCompare(b)).forEach(a=>{const inp=ins[a];const r=+a.replace(/\D/g,'');const col=a.replace(/\d+/,'');
    const row=sheet==='A10_체크리스트'?[T('B',r),T('C',r),T('D',r)].filter(Boolean).join(' > '):[T('B',r),T('C',r),T('E',r)].filter((x,i,arr)=>x&&arr.indexOf(x)===i).join(' > ');
    const e={key:sheet+'!'+a,t:inp.t,label:inp.label,row};
    if(inp.t==='num'){const pr=book.value(sheet,r,9);e.desc=`${row}${T('F',r)?' | '+T('F',r).slice(0,60):''}${typeof pr==='number'?' | 단가 '+pr:''}${T('K',r)?' | '+T('K',r):''}`;e.cur=book.value(sheet,r,XL.colNum(col))}
    else if(inp.t==='pct')e.desc=`${row} | 할인율${inp.nd?' (할인 불가)':''}`;
    else if(inp.t==='sel')e.opts=dvOptions(d,book,inp.f),e.desc=`${inp.label==='선택'?row:inp.label} | 선택지: ${e.opts.join(' / ')}`;
    else if(inp.t==='edu')e.opts=eduOptions(d).map(o=>o.name),e.desc=`${row} | 교육비 품목 선택`;
    else if(inp.t==='oneai')e.opts=oneaiOptions(d).map(o=>o.name),e.desc=`${row} | ONE AI 요금제 선택`;
    else e.desc=`헤더 ${inp.label}`;
    if(inp.t==='pct'&&inp.nd)return;out.push(e)});
  return out}
async function vMapQuote(A,transcript){
  const d=X.d,book=X.book,q=S.draft;const sheets=[q.sheet].concat(d.sheets['A10_체크리스트']?['A10_체크리스트']:[]);
  const cat=sheets.flatMap(sh=>xlCatalog(d,book,sh)).filter(e=>!(e.t==='text'&&/견적담당|영업담당|영업센터|연락처|견적번호/.test(e.label)));
  cat.forEach((e,i)=>e.id='k'+(i+1));
  const eduList=eduOptions(d).map(o=>o.name),aiList=oneaiOptions(d).map(o=>o.name);
  const lines=cat.map(e=>`${e.id} [${e.t==='num'?'수량':e.t==='pct'?'D/C%':e.t==='text'?'텍스트':e.t==='sel'?'선택':e.t==='edu'?'교육':'ONEAI'}] ${e.desc}${e.t==='num'&&e.cur?' (기본값 '+e.cur+')':''}`).join('\n');
  const prompt=`더존 Amaranth 10 가격확약서(엑셀 양식 "${xqInfo(q.tplId).name}", 시트 "${q.sheet}")의 입력 칸 목록입니다. 상담 분석 결과와 녹취를 보고 각 입력 칸에 넣을 값을 정하세요.
규칙:
- 대화에서 확인된 것만 채웁니다. 근거가 없으면 넣지 마세요(양식 기본값 유지).
- [수량]은 숫자. 유저 라이선스·사용료는 유저 수, 모듈은 1. 같은 품목이 일시납/월납/연납 행에 반복되면 배포 방식에 맞는 행 하나만 채웁니다.
- [D/C%]는 0~100 숫자(고객이 할인을 요청했어도 확정된 할인율이 대화에 없으면 넣지 않음).
- [선택]/[교육]/[ONEAI]는 주어진 선택지 문자열을 그대로.
- 체크리스트 시트 칸(A10_체크리스트)은 사용 유저 수·서버·하드웨어 수량.
- 헤더 [텍스트]: 업체명, 담당자(고객 담당자 "이름 직급"), 견적명, 납품기일 등.
답: JSON 하나 {"values":{"k1":값,...},"notes":"반영하지 못했거나 확인이 필요한 요구사항 (한국어, 짧게)"}
교육 선택지: ${eduList.join(' / ')}
ONE AI 선택지: ${aiList.join(' / ')}

[입력 칸]
${lines}

[상담 분석]
${JSON.stringify(A)}

[녹취 일부]
${String(transcript||'').slice(0,12000)}`;
  const r=await S.sample.json(prompt,{modelTier:'default',cache:false});
  const vals=r&&r.values&&typeof r.values==='object'?r.values:{};let n=0;
  cat.forEach(e=>{if(!(e.id in vals))return;let v=vals[e.id];if(v==null||v==='')return;const a=e.key.slice(e.key.lastIndexOf('!')+1),sheet=e.key.slice(0,e.key.lastIndexOf('!'));const rr=+a.replace(/\D/g,'');
    if(e.t==='num'){v=num(v);if(!(v>=0))return;setXInput(e.key,v)}
    else if(e.t==='pct'){v=num(v);if(!(v>0&&v<=100))return;setXInput(e.key,v/100)}
    else if(e.t==='sel'){if(!e.opts.includes(String(v)))return;setXInput(e.key,String(v))}
    else if(e.t==='edu'){const o=eduOptions(d).find(x=>x.name===String(v).replace(/ \(FoEX\)$/,''));if(!o)return;const foex=/FoEX/.test(v)&&o.foex!=null;setXInput(e.key,o.name+(foex?' (FoEX)':''));setXInput(sheet+'!F'+rr,o.spec);setXInput(sheet+'!I'+rr,foex?o.foex:(o.visit!=null?o.visit:o.foex))}
    else if(e.t==='oneai'){const o=oneaiOptions(d).find(x=>x.name===String(v));if(!o)return;setXInput(e.key,o.name);setXInput(sheet+'!F'+rr,o.spec);setXInput(sheet+'!I'+rr,o.price);setXInput(sheet+'!K'+rr,o.unit)}
    else setXInput(e.key,String(v));n++});
  return{n,notes:r&&r.notes?String(r.notes):''}}
function vPickSheet(d,deploy){const L=d.quoteSheets;const s=String(deploy||'');
  const f=rx=>L.find(n=>rx.test(n));return(/VM/i.test(s)&&f(/VM/))||(/임대|월납/.test(s)&&f(/임대형/))||(/고객/.test(s)&&f(/고객IDC/))||(/일시납|더존 ?IDC/.test(s)&&f(/일시납/))||L[0]}
$('#v-mkq').onclick=async()=>{const m=S.vdraft;const A=m.analysis;if(!A)return;
  const tpl=A.product.template||$('#v-ai select[data-vp="product.template"]').value;if(!tpl){toast('견적 양식을 먼저 고르세요 (견적 요구사항 > 견적 양식)');return}
  if(S.vdirty||S.visNew){if(!await saveMeeting())return}
  const b=$('#v-mkq');b.disabled=true;b.textContent='견적서 작성 중…';
  try{const q=newXQuote(tpl);q.id=uid();q.meetingId=m.id;
    await openXEditor(q,true);if(S.view!=='xedit')return;
    const sh=vPickSheet(X.d,A.product.deploy);if(sh!==S.draft.sheet){S.draft.sheet=sh;xlSyncFlags();xlApplyMe()}
    $('#x-ai').hidden=false;$('#x-ai').innerHTML='<b>상담 내용을 견적서에 넣는 중…</b> 잠시 기다려 주세요.';
    // 고객 기본 정보는 바로
    const hd=xlInputs(X.d,S.draft.sheet);Object.entries(hd).forEach(([a,inp])=>{if(inp.t!=='text')return;const c=A.customer;
      const v=inp.label==='업체명'?c.name:inp.label==='담당자'?[c.contact,c.contactTitle].filter(Boolean).join(' '):inp.label==='견적명'?A.product.quoteName:null;if(v)setXInput(S.draft.sheet+'!'+a,v)});
    const ck=X.d.sheets['A10_체크리스트']&&xlInputs(X.d,'A10_체크리스트');if(ck)Object.entries(ck).forEach(([a,inp])=>{if(inp.label==='고객사명'&&A.customer.name)setXInput('A10_체크리스트!'+a,A.customer.name);if(inp.label==='사업자등록번호'&&A.customer.bizNo)setXInput('A10_체크리스트!'+a,A.customer.bizNo)});
    let res={n:0,notes:''};try{res=await vMapQuote(A,m.transcript)}catch(err){res.notes='품목 자동 입력에 실패했습니다'+(err&&err.code?` (${err.code})`:'')+'. 노란 칸을 직접 입력해 주세요.'}
    X.tab='sheet';renderXBar();renderXBody();
    $('#x-ai').innerHTML=`<b>상담 내용으로 ${res.n}개 칸을 채웠습니다.</b> 저장 전에 수량·할인을 확인하세요.${res.notes?`<div class="hint" style="margin-top:4px">확인 필요: ${esc(res.notes)}</div>`:''}`;
    m.quoteId=q.id;m.status='견적 작성';S.meetings.set(m.id,clone(m));if(S.db)S.db.collection('meetings').doc(m.id).set(clone(m)).catch(()=>{});
  }finally{b.disabled=!S.sample;b.textContent='견적서 만들기'}};

/* ----- 3단계: 계약서·할인기안·구축요청에 상담 내용 반영 ----- */
const meetingOf=q=>q&&q.meetingId?S.meetings.get(q.meetingId):null;
const _newContract=newContract;
newContract=function(type,q){const c=_newContract(type,q);const m=meetingOf(q);const A=m&&m.analysis;if(A){const cu=A.customer;const p=c.dzFirst?c.partyB:c.partyA;
    if(cu.name)p.name=cu.name;if(cu.addr)p.addr=cu.addr;if(cu.bizNo)p.bizNo=cu.bizNo;if(cu.ceo)p.ceo=cu.ceo;
    if(A.contract.expectedDate)c.contractDate=A.contract.expectedDate;if(A.contract.special)c.special=A.contract.special;
    (c.conds||[]).forEach(x=>{if(/교육시작/.test(x.label)&&A.build.eduStart){const s=A.build.eduStart.split('-');x.value=x.value.replace(/\d{4}년\s*\d{1,2}월\s*\d{1,2}일/,`${s[0]}년 ${+s[1]}월 ${+s[2]}일`)}})}
  return c};
const _newDiscount=newDiscount;
newDiscount=function(q,c){const d=_newDiscount(q,c);if(S.me){d.drafter=meRN();d.dept=S.me.dept||d.dept}
  const m=meetingOf(q);const A=m&&m.analysis;if(A){const cu=A.customer;if(cu.name&&!d.customer.name)d.customer.name=cu.name;if(cu.bizNo&&!d.customer.bizNo)d.customer.bizNo=cu.bizNo;if(cu.addr&&!d.customer.addr)d.customer.addr=cu.addr;
    if(A.discount.promoName)d.promoName=A.discount.promoName;if(A.discount.reasons.length)d.reasons=A.discount.reasons.map(x=>'- '+x.replace(/^[-·•]\s*/,'')).join('\n')}
  return d};
const _newBuildReq=newBuildReq;
newBuildReq=function(c,q){const b=_newBuildReq(c,q);if(S.me){b.drafter=meRN();b.dept=S.me.dept||b.dept;b.sales.center=S.me.org||b.sales.center;b.sales.rep=meLine()}
  const m=meetingOf(q);const A=m&&m.analysis;if(A){const cu=A.customer,B=A.build,set=(o,k,v)=>{if(v&&!o[k])o[k]=v};
    ['name','bizNo','addr','bizType','bizItem','dept','tel','hp','email','visitAddr'].forEach(k=>set(b.customer,k,cu[k]));set(b.customer,'contact',[cu.contact,cu.contactTitle].filter(Boolean).join(' '));if(cu.ceo&&!b.customer.fax){}
    if(B.serverLocation)b.server.location=B.serverLocation;if(B.serverType)b.server.type=B.serverType;if(B.firewall)b.server.firewall=true;if(/멀티|기본/.test(B.ssl||''))b.server.ssl=/멀티/.test(B.ssl)?'멀티':'기본';
    set(b.server,'itName',B.itName);set(b.server,'itPhone',B.itPhone);set(b.scope,'domain',B.domain);set(b.scope,'url',B.url);set(b.scope,'adminId',B.adminId);
    if(/비영리/.test(A.product.profit||''))b.scope.profit='비영리';
    if(B.eduStart&&!b.amt.eduStart)b.amt.eduStart=B.eduStart;if(B.buildStart)b.amt.custStart=B.buildStart;if(B.buildEnd)b.amt.custEnd=B.buildEnd;
    if(B.migUc)b.mig.ucScope=B.migUc;if(B.migErp)b.mig.erp=B.migErp;if(A.product.customization){b.custom.scope=b.custom.scope||A.product.customization}
    const det=[B.notes,A.product.education&&'교육: '+A.product.education,A.product.customization&&'커스터마이징: '+A.product.customization].filter(Boolean);if(det.length&&!b.detail)b.detail=det.map(x=>'- '+x).join('\n');
    Object.entries(A.product.users||{}).forEach(([k,v])=>{if(num(v)&&!num(b.scope.users[k]))b.scope.users[k]=num(v)})}
  return b};

/* ----- 구축요청서: 상담 내용으로 채우기 (Claude) ----- */
const BR_AI_FIELDS=[
 ['customer.name','업체명'],['customer.bizNo','사업자등록번호'],['customer.addr','주소'],['customer.bizType','업태'],['customer.bizItem','종목'],['customer.dept','고객 부서'],['customer.contact','고객 담당자 (이름 직급)'],['customer.tel','전화'],['customer.hp','휴대폰'],['customer.fax','팩스'],['customer.email','이메일'],['customer.visitAddr','방문(구축) 주소'],
 ['type','유형: 패키지 | 패키지+커스터마이징'],['edu.visit','방문(추가)교육 횟수 (숫자)'],['edu.foex','FoEX 1:N 교육센터 (true/false)'],['edu.foexBase','1:N 기본교육 (true/false)'],['edu.ftStd','Fast-Track Standard (true/false)'],['edu.ftPrem','Fast-Track Premium (true/false)'],['edu.other','기타(마이그레이션 단독) (true/false)'],['eduDept','교육시행 부서: 더존 교육 | BP사 자체 교육'],
 ['amt.eduStart','교육 시작 가능 시작일 YYYY-MM-DD'],['amt.eduEnd','교육 시작 기한 YYYY-MM-DD'],['amt.custStart','구축(커스터마이징) 시작일'],['amt.custEnd','구축 종료일'],['amt.licState','라이선스 세금계산서: 발행 | 발행예정'],['amt.licDate','세금계산서 발행(예정)일'],['amt.collectState','수금 | 수금예정'],['amt.collectDate','수금(예정)일'],
 ['blue.freeMonths','블루멤버십 무상기간 개월'],['blue.freeFrom','무상기간 시작'],['blue.freeTo','무상기간 종료'],['note','비고'],
 ['server.location','서버 위치: 더존 IDC | 고객사 IDC | 타사 IDC | 자체서버'],['server.type','서버 Type: 물리서버 | 클라우드 서버'],['server.os','OS'],['server.serverIp','서버 IP'],['server.serviceIp','서비스 IP'],['server.itName','고객사 전산담당자'],['server.itPhone','전산담당자 연락처'],['server.firewall','Amaranth10 전용 방화벽 (true/false)'],['server.ssl','SSL: 기본 | 멀티'],
 ['scope.corp','계약 법인명'],['scope.adminId','회사대표 ID'],['scope.domain','소유 도메인'],['scope.url','희망 접속 URL'],['scope.oneai','ONE AI 요금제: 25요금제|35요금제|50요금제|75요금제|100요금제|200요금제|300요금제'],['scope.profit','결재구분: 영리 | 비영리'],
 ['scope.users.expert','전문가ERP 유저 수'],['scope.users.user','사용자(임직원) 유저 수'],['scope.users.mail','메일 유저 수'],['scope.users.yearEnd','연말정산 전용 유저 수'],['scope.users.forme','모바일 ForMe 전용 유저 수'],['scope.users.crm','CRM 유저 수'],
 ['mig.uc','UC 마이그레이션 대상: B1 | Suite | NP | Alpha(영리) | Alpha(비영리) | (타사 그룹웨어명)'],['mig.ucScope','UC 마이그레이션 범위 (조직도/전자결재/공지게시/문서/일정·자원/메일)'],['mig.ucServer','UC 서버 구분: 더존 IDC | 타사 IDC | 자체서버'],['mig.ucIp','UC 서버 IP'],['mig.ucContact','UC 담당자 (성함/연락처)'],
 ['mig.erp','ERP 마이그레이션 범위 (iCUBE/Smart A, 법인수·기수·모듈)'],['mig.erpServer','ERP 서버 구분: 더존 IDC (SQL DB) | 더존 IDC (Maria DB) | 타사IDC | 자체서버 | Secure Channel'],['mig.erpInfo','ERP DB IP / Port'],
 ['custom.inhouse','내부 전용개발: 예 | 아니오 | 검토중'],['custom.amount','전용개발 금액'],['custom.dept','개발 부서/담당자'],['custom.module','개발 모듈'],['custom.scope','개발 범위'],['custom.outsource','외주: 예 | 아니오 | 검토중'],['custom.vendor','외주업체'],['custom.vAmount','외주 계약금액'],['custom.margin','이익률 %'],['custom.vContact','외주 담당자/연락처'],['custom.vScope','외주 범위'],
 ['detail','공통옵션 상세내용 및 계약정보 관련 특이사항 (법인추가, 교육장소, 커스터마이징·마이그레이션 상세 등, "- " 목록)']];
function brMeetingOf(b){if(b.meetingId&&S.meetings.get(b.meetingId))return S.meetings.get(b.meetingId);const q=b.quoteId&&S.quotes.get(b.quoteId);return meetingOf(q)}
async function brAiFill(auto){const b=S.bdraft;if(!b)return;const m=brMeetingOf(b);const box=$('#br-ai');
  if(!m){if(!auto)toast('연결된 상담이 없습니다. 상담을 선택하세요');return}
  if(!S.sample){if(!auto)toast('이 화면에서는 Claude 분석을 사용할 수 없습니다');return}
  box.hidden=false;box.innerHTML='<b>상담 내용으로 구축요청서를 채우는 중…</b> 잠시 기다려 주세요.';
  const checks=BR_OPTS.flatMap(([g,sub,items])=>items.map(([k,l,,ex])=>`${k}: ${g}${sub?' > '+sub:''} > ${l}${ex?' (수치: '+ex+')':''}`)).join('\n');
  const cur={};BR_AI_FIELDS.forEach(([p])=>{const v=gp(b,p);if(v!==''&&v!=null&&v!==false)cur[p]=v});
  const prompt=`더존 Amaranth10 구축요청서(전자결재 양식)를 작성합니다. 아래 상담 녹취/분석과 현재 입력값을 보고, 상담에서 확인된 내용으로 양식 칸을 채우세요.
규칙:
- 상담에 근거가 있는 값만 넣습니다. 근거가 없으면 그 칸은 빼세요(현재 값 유지). 추측 금지.
- 계약 금액(a~d)은 견적에서 가져오므로 건드리지 않습니다.
- 선택형 칸은 보기 중 하나를 그대로. 날짜는 YYYY-MM-DD(연도 없으면 ${today().slice(0,4)}년).
- checks는 상담에서 도입/사용이 확인된 옵션은 true, 명확히 안 쓴다고 한 것만 false. vals는 checks 항목의 수치(법인 수, 교육 횟수, 양식 본수, 백업 개수, 대표메일 유저 등).
- detail에는 양식 칸에 담지 못한 구축 관련 요구사항을 "- " 목록으로 정리.
답: JSON 하나 {"fields":{"경로":값},"checks":{"키":true|false},"vals":{"키":숫자},"notes":"확인이 필요한 사항(짧게)"}

[양식 칸 (경로: 설명)]
${BR_AI_FIELDS.map(([p,l])=>p+': '+l).join('\n')}

[체크 항목 (키: 구분 > 항목)]
${checks}

[현재 입력값]
${JSON.stringify(cur)}
[현재 체크] ${Object.keys(b.checks).filter(k=>b.checks[k]).join(', ')||'없음'}

[상담 분석]
${JSON.stringify(m.analysis||{})}

[상담 녹취]
${String(m.transcript||'').slice(0,15000)}`;
  try{const r=await S.sample.json(prompt,{modelTier:'default',cache:false});if(S.bdraft!==b)return;
    const F=r&&r.fields&&typeof r.fields==='object'?r.fields:{};let n=0;const ok=new Set(BR_AI_FIELDS.map(x=>x[0]));
    Object.entries(F).forEach(([p,v])=>{if(!ok.has(p)||v==null||v==='')return;const old=gp(b,p);if(typeof old==='boolean')v=v===true||v==='true';else if(/^scope\.users\.|^edu\.visit$|amount$|^custom\.margin$|^blue\.freeMonths$/.test(p))v=num(v)||'';else v=String(v);if(v===''||v===old)return;sp(b,p,v);n++});
    const C=r&&r.checks&&typeof r.checks==='object'?r.checks:{};const keys=new Set(BR_OPTS.flatMap(x=>x[2].map(y=>y[0])));
    Object.entries(C).forEach(([k,v])=>{if(!keys.has(k))return;const nv=v===true||v==='true';if(b.checks[k]!==nv){b.checks[k]=nv;n++}});
    const Vv=r&&r.vals&&typeof r.vals==='object'?r.vals:{};Object.entries(Vv).forEach(([k,v])=>{if(keys.has(k)&&num(v)){b.vals[k]=num(v);n++}});
    renderBForm();setBDirty(true);scheduleBPreview();
    box.innerHTML=`<b>상담 내용으로 ${n}개 항목을 채웠습니다.</b> 저장 전에 확인하세요.${r&&r.notes?`<div class="hint" style="margin-top:4px">확인 필요: ${esc(String(r.notes))}</div>`:''}`}
  catch(err){box.innerHTML='상담 내용으로 채우지 못했습니다'+(err&&err.code?` (${esc(err.code)})`:'')+'. 다시 시도하거나 직접 입력해 주세요.'}}
function brAiBar(){const b=S.bdraft;const m=brMeetingOf(b);const list=[...S.meetings.values()].sort((a,c)=>(c.createdAt||'').localeCompare(a.createdAt||''));
  $('#br-aibar').innerHTML=`<span class="hint">상담 연결</span><select id="br-meet" aria-label="연결할 상담"><option value="">상담 선택…</option>${list.map(x=>`<option value="${esc(x.id)}"${m&&m.id===x.id?' selected':''}>${esc((x.createdAt||'').slice(0,10))} · ${esc(x.title||'(제목 없음)')}</option>`).join('')}</select><button class="btn" id="br-aigo"${S.sample?'':' disabled'}>상담 내용으로 채우기</button>`;
  $('#br-meet').onchange=e=>{b.meetingId=e.target.value;setBDirty(true)};$('#br-aigo').onclick=()=>brAiFill(false)}
const _openBEditor=openBEditor;
openBEditor=function(b,isNew){_openBEditor(b,isNew);$('#br-ai').hidden=true;brAiBar();if(isNew&&brMeetingOf(S.bdraft)&&S.sample)brAiFill(true)};

/* ----- 음성 파일 → 텍스트 ----- */
$('#v-audio').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)vAudioFile(f)};
async function vAudioFile(f){
  if(STT.busy){toast('이미 변환 중입니다');return}
  if(!/^(audio|video)\//.test(f.type)&&!/\.(mp3|m4a|wav|aac|ogg|oga|opus|webm|mp4|flac|amr|3gp|wma)$/i.test(f.name)){toast('음성 파일(mp3, m4a, wav 등)을 선택하세요');return}
  STT.busy=true;STT.abort=false;const st=$('#v-stt');st.hidden=false;$('#v-stt-stop').hidden=false;const bar=$('#v-stt-bar'),msg=$('#v-stt-msg');
  const set=(t,p)=>{msg.textContent=t;if(p!=null)bar.style.width=Math.round(p*100)+'%'};
  const ta=$('#v-text');const head=`[음성 파일: ${f.name}]`;ta.value=(ta.value?ta.value.replace(/\s*$/,'')+'\n\n':'')+head+'\n';S.vdraft.transcript=ta.value;setVDirty(true);
  if(!S.vdraft.title){S.vdraft.title=f.name.replace(/\.[^.]+$/,'');$('#v-title').value=S.vdraft.title}
  try{const r=await sttTranscribe(f,set,line=>{ta.value+=line+'\n';S.vdraft.transcript=ta.value;ta.scrollTop=ta.scrollHeight;vCount()});
    set(r.stopped?'변환을 멈췄습니다. 여기까지 변환한 내용은 남아 있습니다.':`변환 완료 (${sttTs(r.dur)} 분량). 내용을 확인한 뒤 ‘내용 분석’을 누르세요.`,1);S.vdraft.status='변환 완료';setVDirty(true);if(!r.stopped)saveMeeting()}
  catch(err){console.error(err);const m=String(err&&err.message||err);
    set(/decode|EncodingError|Unable to decode/i.test(m)?'이 파일 형식을 읽지 못했습니다. mp3, m4a, wav 파일로 다시 시도해 주세요.':/fetch|script|wasm|WebAssembly|CompileError/i.test(m)?'이 환경에서는 음성 인식 엔진을 실행할 수 없습니다. 크롬 브라우저에서 열어 주세요.':'변환하지 못했습니다: '+m.slice(0,120),null)}
  finally{STT.busy=false;$('#v-stt-stop').hidden=true}}
$('#v-stt-stop').onclick=()=>{STT.abort=true;$('#v-stt-msg').textContent='멈추는 중…'};

/* ----- 녹취 텍스트 파일 (.txt .srt .vtt .csv .json .docx) ----- */
async function unzipEntry(buf,name){const u=new Uint8Array(buf),dv=new DataView(buf);let e=u.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error('zip');
  const cnt=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);
  for(let i=0;i<cnt;i++){const m=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const n=new TextDecoder().decode(u.subarray(p+46,p+46+nl));if(n===name){const ln=dv.getUint16(off+26,true),lx=dv.getUint16(off+28,true);const data=u.subarray(off+30+ln+lx,off+30+ln+lx+cs);
      if(m===0)return new TextDecoder().decode(data);const ds=new DecompressionStream('deflate-raw');const out=await new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer();return new TextDecoder().decode(out)}
    p+=46+nl+xl+cl}throw new Error('no '+name)}
async function readTranscriptFile(f){const n=f.name.toLowerCase();
  if(n.endsWith('.docx')){const xml=await unzipEntry(await f.arrayBuffer(),'word/document.xml');return xml.replace(/<w:tab\/>/g,'\t').replace(/<w:br\/>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/\n{3,}/g,'\n\n').trim()}
  let t=await f.text();
  if(/\.(srt|vtt)$/.test(n))t=t.replace(/^WEBVTT.*$/m,'').replace(/^\d+\s*$/gm,'').replace(/^([\d:.,]+)\s*-->\s*[\d:.,]+.*$/gm,(_,a)=>'['+a.replace(/[.,]\d+$/,'').replace(/^00:/,'')+']').replace(/\]\s*\n/g,'] ').replace(/\n{2,}/g,'\n').trim();
  else if(n.endsWith('.json')){try{const j=JSON.parse(t);const seg=j.segments||j.results||j.utterances||(Array.isArray(j)?j:null);if(Array.isArray(seg))t=seg.map(s=>[s.speaker||s.speakerName||'',s.text||s.transcript||s.content||''].filter(Boolean).join(': ')).join('\n');else if(j.text)t=j.text}catch(_){}}
  return t}
$('#v-file').onchange=e=>{const fs=[...e.target.files];e.target.value='';if(fs.length)vTextFiles(fs)};
async function vTextFiles(fs){const ta=$('#v-text');
  for(const f of fs){if(/\.(mp3|m4a|wav|aac|ogg|webm|mp4|flac|amr|3gp)$/i.test(f.name)||/^audio\//.test(f.type)){toast('음성 파일은 ‘음성 파일 변환’ 버튼으로 올려 주세요');continue}
    if(!/\.(txt|srt|vtt|md|csv|json|docx)$/i.test(f.name)){toast(f.name+': 텍스트(.txt .srt .vtt .csv .json) 또는 워드(.docx) 파일만 등록할 수 있습니다');continue}
    try{const t=await readTranscriptFile(f);ta.value=(ta.value?ta.value.replace(/\s*$/,'')+'\n\n':'')+`[녹취 파일: ${f.name}]\n`+t;if(!S.vdraft.title){S.vdraft.title=f.name.replace(/\.[^.]+$/,'');$('#v-title').value=S.vdraft.title}}
    catch(_){toast(f.name+'을(를) 읽지 못했습니다')}}
  S.vdraft.transcript=ta.value;setVDirty(true);vCount()}

/* ----- 회의록 요약 ----- */
async function vMinutes(){const m=S.vdraft;const t=(m.transcript||'').trim();if(t.length<20){toast('요약할 내용이 너무 짧습니다');return}if(!S.sample){toast('이 화면에서는 Claude 요약을 사용할 수 없습니다');return}
  const b=$('#v-sum');b.disabled=true;b.textContent='요약 중…';
  const prompt=`아래는 회사01 영업 담당자의 고객 상담(통화/회의) 녹취입니다(음성 인식 결과라 오탈자가 있을 수 있음). 사내 공유용 회의록으로 요약하세요.
녹취에 없는 내용은 만들지 마세요. 문장은 간결한 개조식(~함, ~예정).
답: JSON 하나
{"title":"회의 제목","date":"YYYY-MM-DD 또는 \\"\\"","attendees":["참석자(소속/이름/직급, 확인된 것만)"],"overview":"한두 문장 개요",
 "discussions":[{"topic":"논의 주제","points":["내용"]}],"customerNeeds":["고객 요구사항"],"decisions":["결정/합의 사항"],"issues":["이슈·리스크·확인 필요"],
 "actions":[{"task":"할 일","owner":"담당(더존/고객, 이름)","due":"기한"}]}

[작성자] ${meLine()}
[녹취]
${t.slice(0,60000)}`;
  try{const r=await S.sample.json(prompt,{modelTier:'default',cache:false});if(!r||typeof r!=='object')throw{code:'invalid_json'};m.minutes=r;setVDirty(true);vRenderMinutes();await saveMeeting()}
  catch(err){toast('요약하지 못했습니다'+(err&&err.code?` (${err.code})`:''))}finally{b.disabled=!S.sample;b.textContent='회의록 요약'}}
$('#v-sum').onclick=vMinutes;
function minutesHtml(r){const L=a=>Array.isArray(a)?a:[];const li=a=>L(a).length?`<ul>${L(a).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>-</p>';
  const th='border:1px solid #9aa1ab;background:#eef2f7;padding:5px 8px;text-align:left;font-weight:bold;width:110px;vertical-align:top',td='border:1px solid #9aa1ab;padding:5px 8px;vertical-align:top';
  return`<div style="font-family:'맑은 고딕','Malgun Gothic',sans-serif;font-size:13px;line-height:1.6;color:#1b1f27">
  <h2 style="font-size:18px;margin:0 0 8px">${esc(r.title||'회의록')}</h2>
  <table style="border-collapse:collapse;width:100%;margin-bottom:10px"><tr><th style="${th}">일시</th><td style="${td}">${esc(r.date||'')}</td></tr><tr><th style="${th}">참석자</th><td style="${td}">${esc(L(r.attendees).join(', '))}</td></tr><tr><th style="${th}">개요</th><td style="${td}">${esc(r.overview||'')}</td></tr></table>
  <h3 style="font-size:14px;margin:12px 0 4px">■ 논의 내용</h3>${L(r.discussions).map(d=>`<p style="margin:6px 0 2px"><b>${esc(d.topic||'')}</b></p>${li(d.points)}`).join('')||'<p>-</p>'}
  <h3 style="font-size:14px;margin:12px 0 4px">■ 고객 요구사항</h3>${li(r.customerNeeds)}
  <h3 style="font-size:14px;margin:12px 0 4px">■ 결정 사항</h3>${li(r.decisions)}
  <h3 style="font-size:14px;margin:12px 0 4px">■ 이슈 · 확인 필요</h3>${li(r.issues)}
  <h3 style="font-size:14px;margin:12px 0 4px">■ 후속 조치</h3>${L(r.actions).length?`<table style="border-collapse:collapse;width:100%"><tr><th style="${th};width:auto">할 일</th><th style="${th}">담당</th><th style="${th}">기한</th></tr>${L(r.actions).map(a=>`<tr><td style="${td}">${esc(a.task||'')}</td><td style="${td}">${esc(a.owner||'')}</td><td style="${td}">${esc(a.due||'')}</td></tr>`).join('')}</table>`:'<p>-</p>'}</div>`}
function minutesText(r){const L=a=>Array.isArray(a)?a:[];return[`${r.title||'회의록'}`,`일시: ${r.date||''}`,`참석자: ${L(r.attendees).join(', ')}`,`개요: ${r.overview||''}`,'','■ 논의 내용',...L(r.discussions).flatMap(d=>[`[${d.topic||''}]`,...L(d.points).map(x=>' - '+x)]),'','■ 고객 요구사항',...L(r.customerNeeds).map(x=>' - '+x),'','■ 결정 사항',...L(r.decisions).map(x=>' - '+x),'','■ 이슈 · 확인 필요',...L(r.issues).map(x=>' - '+x),'','■ 후속 조치',...L(r.actions).map(a=>` - ${a.task||''} (${a.owner||''}${a.due?', '+a.due:''})`)].join('\n')}
function vRenderMinutes(){const r=S.vdraft&&S.vdraft.minutes;const box=$('#v-min');if(!r){box.hidden=true;return}box.hidden=false;
  box.innerHTML=`<div class="vmin-head"><h3>회의록 요약</h3><div class="sp"></div><button class="ib" id="vm-copy">복사</button><button class="ib" id="vm-save">HTML 저장</button><button class="ib" id="vm-txt">텍스트 저장</button></div><div class="vmin-body">${minutesHtml(r)}</div>`;
  $('#vm-copy').onclick=async()=>{const h=minutesHtml(r),t=minutesText(r);let ok=false;try{await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([h],{type:'text/html'}),'text/plain':new Blob([t],{type:'text/plain'})})]);ok=true}catch(_){try{await navigator.clipboard.writeText(t);ok=true}catch(__){}}toast(ok?'회의록을 복사했습니다':'복사가 막혀 있습니다. 내용을 직접 선택해 복사하세요')};
  const base=safeName((r.title||S.vdraft.title||'회의록')+'_'+(r.date||today()));
  $('#vm-save').onclick=()=>offer(base+'.html',`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(r.title||'회의록')}</title></head><body style="max-width:860px;margin:24px auto;padding:0 16px">${minutesHtml(r)}</body></html>`);
  $('#vm-txt').onclick=()=>offer(base+'.txt',minutesText(r))}
const _vRender=vRender;vRender=function(){_vRender();vRenderMinutes()};
