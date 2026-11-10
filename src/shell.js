
/* ================= 앱 셸: 로그인 → 상담 업로드 → 홈 대시보드 ================= */
const IC={home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 up:'<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 18v3"/>',
 wave:'<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0"/>',txt:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
 q:'<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/>',c:'<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h5"/><path d="M14 17l1.5 1.5L19 15"/>',
 bk:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h4"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',chev:'<path d="M6 9l6 6 6-6"/>',law:'<path d="M12 3v18"/><path d="M5 7h14"/><path d="M5 7l-3 6a3 3 0 006 0z"/><path d="M19 7l-3 6a3 3 0 006 0z"/><path d="M8 21h8"/>',coach:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',ext:'<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',d:'<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',b:'<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
const NAV=[['home','홈','home'],['upload','상담 올리기','up'],null,['quotes','견적서','q','q'],['contracts','계약서','c','c'],['discounts','할인기안','d','d'],['buildreqs','구축요청','b','b']];
try{S.sitesOpen=localStorage.getItem('qd-sites-open')==='1'}catch(_){S.sitesOpen=false}
const NAV_SITES=[['계약서 초안 생성기','https://pray2god4u.github.io/contract-generator/','c','AI Hub 법률 문서 서식 기반 계약서 초안','법률 문서 서식 1만 8천여 건을 86개 유형으로 정리해, 서식을 고르고 정보를 넣으면 계약서 초안을 만들어 줍니다.',['대분류·중분류·계약 문서/계약 외 문서로 서식 찾기','입력 정보를 반영한 초안 생성, 사내 GenAI로 AI 초안(사내망에서만)','워드(DOCX)·한글(HWPX)·텍스트로 저장, 복사'],'표준 계약서 양식에 없는 별도 약정서·합의서 초안 작성'],['기술문서 인텔리전스','https://pray2god4u.github.io/mfg-tech-copilot/search.html','bk','제조현장 기술지원용 기술문서 검색','AI Hub 기술문서 153건을 브라우저 안에서 검색·추천·비교합니다.',['하이브리드·의미·본문·카탈로그 검색 방식 선택','문서 유형(데이터 설명서, 구축·활용 가이드)·데이터셋 번호 필터','검색어는 서버로 보내지 않고 이 PC에서 처리','처음 실행 시 검색 모델(약 145MB)을 내려받음'],'제조 고객 상담 전 기술 근거 확인'],
 ['행정사례 AI','https://korea-admin-case-ai-mvp04.good4min.chatgpt.site/','law','공공사업 기획 근거 작업대','공공사업 기록 약 2만 4천 건에서 유사 사업을 찾아 예산·과업 범위·조달 방식을 비교합니다.',['기관명·사업명·목적·추정 예산으로 유사 사업 찾기','사례 5~10건을 골라 비교표 작성','출처 URL이 들어간 엑셀·문서 초안 내려받기','지방재정365·나라장터 공개 데이터 기반'],'공공기관 제안 전 유사 사례·예산 근거 정리'],
 ['공공영업 인사이트 코치','https://public-sales-insight-coach.onrender.com/','coach','회사01 영업 인사이트','공공영업 인사이트와 조직·계정을 관리하는 사내 앱입니다.',['영업 인사이트 조회','조직도·명단 가져오기와 검증','임직원 계정·권한 관리, 개인 초대 링크 발급','회사 이메일로만 로그인'],'공공 고객 영업 전략·코칭']];
const TAB_ROUTE={q:'quotes',c:'contracts',d:'discounts',b:'buildreqs'},ROUTE_TAB={quotes:'q',contracts:'c',discounts:'d',buildreqs:'b'};
const TAB_HEAD={q:['견적서','표준 가격확약서 8종으로 견적을 작성하고 진행 상황을 봅니다.'],c:['계약서','제출된 견적으로 계약서를 만들고 약관을 붙여 PDF로 저장합니다.'],d:['할인기안','할인이 있는 견적의 할인기안을 작성하고 결재 상태를 관리합니다.'],b:['구축요청','체결된 계약의 구축요청서를 작성해 전자결재에 올립니다.']};
function renderNav(){const cur=S.view==='dash'?TAB_ROUTE[S.tab]:S.view==='home'?'home':S.view==='sites'?'sites':S.view==='upload'||S.view==='vedit'?'upload':S.view==='edit'||S.view==='xedit'?'quotes':S.view==='cedit'?'contracts':S.view==='dedit'?'discounts':S.view==='bedit'?'buildreqs':'';
  const cnt=homeCounts();const badge={quotes:[cnt.qDraft,false],discounts:[cnt.dNeed,cnt.dNeed>0],buildreqs:[cnt.bNeed,cnt.bNeed>0]};
  $('#snav-items').innerHTML=NAV.map(n=>n?`<a class="it" href="#${n[0]}" data-route="${n[0]}"${cur===n[0]?' aria-current="page"':''} title="${n[1]}">${svg(n[2])}<span class="lb">${n[1]}</span>${badge[n[0]]&&badge[n[0]][0]?`<span class="bd${badge[n[0]][1]?' hot':''}">${badge[n[0]][0]}</span>`:''}</a>`:'<div class="grp">문서</div>').join('')+`<button type="button" class="it grpbtn" id="snav-sites" aria-expanded="${S.sitesOpen?'true':'false'}" aria-controls="snav-sub" title="업무사이트">${svg('grid')}<span class="lb">업무사이트</span><span class="chev">${svg('chev')}</span></button><div class="sub" id="snav-sub"${S.sitesOpen?'':' hidden'}>`+NAV_SITES.map(([l,u,ic],i)=>`<a class="it" href="#sites" data-route="sites" data-site="${i}"${cur==='sites'&&S.siteSel===i?' aria-current="page"':''} title="${l}">${svg(ic)}<span class="lb">${l}</span></a>`).join('')+'</div>';
  const p=S.me;$('#snav-av').textContent=p&&p.name?p.name.slice(0,1):'?';$('#snav-nm').textContent=p&&p.name?meNR():'정보 미입력';$('#snav-og').textContent=p&&p.org?p.org:'';$('#snav-og').title=p&&p.org||''}
const editorDirty=()=>(S.view==='xedit'||S.view==='edit')&&S.dirty||S.view==='cedit'&&S.cdirty||S.view==='dedit'&&S.ddirty||S.view==='bedit'&&S.bdirty||S.view==='vedit'&&S.vdirty;
let navArm=0;
function go(route){
  if(!S.authed){show('login');return}
  if(editorDirty()&&Date.now()-navArm>3500){navArm=Date.now();toast('저장하지 않은 변경이 있습니다. 한 번 더 누르면 저장하지 않고 이동합니다.');renderNav();return}
  navArm=0;
  if(S.view==='xedit'||S.view==='edit'){S.draft=null;setDirty(false)}if(S.view==='cedit'){S.cdraft=null;setCDirty&&setCDirty(false)}if(S.view==='dedit'){S.ddraft=null;setDDirty(false)}if(S.view==='bedit'){S.bdraft=null;setBDirty(false)}if(S.view==='vedit'){S.vdraft=null;setVDirty(false)}
  if(route==='home')show('home');else if(route==='upload')show('upload');else if(route==='sites')show('sites');else if(ROUTE_TAB[route]){S.tab=ROUTE_TAB[route];show('dash')}else show('home');
  try{if(location.hash.slice(1)!==route)history.replaceState(null,'','#'+route)}catch(_){}
}
$('#snav-items').addEventListener('click',e=>{if(e.target.closest('#snav-sites')){S.sitesOpen=!S.sitesOpen;try{localStorage.setItem('qd-sites-open',S.sitesOpen?'1':'0')}catch(_){}renderNav();return}const a=e.target.closest('[data-route]');if(!a)return;e.preventDefault();if(a.dataset.site!=null)S.siteSel=+a.dataset.site;go(a.dataset.route)});
$('#snav-brand').onclick=e=>{e.preventDefault();go('home')};
$('#snav-edit').onclick=()=>openProfile(false);
$('#snav-out').onclick=()=>{if(editorDirty()){toast('먼저 저장하세요');return}try{sessionStorage.removeItem('qd-session')}catch(_){}S.authed=false;show('login')};
window.addEventListener('hashchange',()=>{const r=location.hash.slice(1);if(S.authed&&r&&r!==curRoute())go(r)});
const curRoute=()=>S.view==='dash'?TAB_ROUTE[S.tab]:S.view;
const _show=show;
show=function(v){['login','upload','home','sites'].forEach(x=>{const el=$('#view-'+x);if(el)el.hidden=v!==x});_show(v);document.body.classList.toggle('is-login',v==='login');
  if(v==='login')renderLogin();if(v==='home')renderHome();if(v==='upload')renderUpload();if(v==='sites')renderSites();
  if(v==='dash'){const [h,sub]=TAB_HEAD[S.tab]||TAB_HEAD.q;$('#view-dash header.app h1').textContent=h;$('#view-dash header.app .sub').textContent=sub}
  renderNav()};
const _setTab=setTab;setTab=function(t){_setTab(t);if(S.view==='dash'){const [h,sub]=TAB_HEAD[t]||TAB_HEAD.q;$('#view-dash header.app h1').textContent=h;$('#view-dash header.app .sub').textContent=sub;renderNav()}};

/* ----- 로그인 ----- */
function renderLogin(){const p=S.me;const back=$('#lg-back'),form=$('#lg-form');
  const known=p&&p.name&&!S.lgEdit;back.hidden=!known;$('#lg-fields').hidden=known;
  if(known){$('#lg-av').textContent=p.name.slice(0,1);$('#lg-bnm').textContent=meNR()+' 님';$('#lg-bog').textContent=[p.org,p.phone].filter(Boolean).join(' · ')}
  else{const v=p||{};$('#lg-name').value=v.name||'';$('#lg-rank').value=v.rank||'';$('#lg-org').value=v.org||'';$('#lg-phone').value=v.phone||'';$('#lg-email').value=v.email||''}
  $('#lg-lead').textContent=known?'다시 오셨네요. 다음을 누르면 상담 자료 올리기로 이어집니다.':S.meLoaded===false?'정보를 불러오는 중입니다…':'처음 한 번만 입력하면 견적서·기안서의 담당자 칸에 자동으로 들어갑니다.';
  $('#lg-err').textContent='';lgCanvas()}
$('#lg-other').onclick=()=>{S.lgEdit=true;renderLogin();setTimeout(()=>$('#lg-name').focus(),20)};
$('#lg-form').addEventListener('submit',async e=>{e.preventDefault();
  if(!$('#lg-fields').hidden){const g=id=>$(id).value.trim();const name=g('#lg-name'),org=g('#lg-org'),phone=g('#lg-phone');
    if(!name||!org||!phone){$('#lg-err').textContent=!name?'이름을 입력하세요.':!org?'소속을 입력하세요.':'연락처를 입력하세요.';return}
    $('#pf-name').value=name;$('#pf-rank').value=g('#lg-rank');$('#pf-org').value=org;$('#pf-phone').value=phone;$('#pf-email').value=g('#lg-email');$('#pf-dept').value=(S.me&&S.me.org===org&&S.me.dept)||'';
    await saveProfile();if(!S.me||S.me.name!==name)return}
  S.lgEdit=false;S.authed=true;try{if($('#lg-keep').checked)sessionStorage.setItem('qd-session','1')}catch(_){}
  go('upload')});
let lgRAF=0;function lgCanvas(){const cv=$('#lg-cv');if(!cv||lgRAF)return;const ctx=cv.getContext('2d');const R=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dots=Array.from({length:46},(_,i)=>({x:Math.random(),y:Math.random(),r:8+Math.random()*46,h:[200,215,230,260,30][i%5],a:.08+Math.random()*.22,v:.00004+Math.random()*.00012}));
  const draw=t=>{if(S.view!=='login'){lgRAF=0;return}const w=cv.clientWidth,h=cv.clientHeight,dpr=Math.min(2,devicePixelRatio||1);if(cv.width!==w*dpr){cv.width=w*dpr;cv.height=h*dpr}ctx.setTransform(dpr,0,0,dpr,0,0);
    const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#081430');g.addColorStop(.55,'#122a5c');g.addColorStop(1,'#2a1f5e');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const gl=ctx.createRadialGradient(w*.82,h*.3,0,w*.82,h*.3,w*.55);gl.addColorStop(0,'rgba(80,170,255,.35)');gl.addColorStop(1,'rgba(80,170,255,0)');ctx.fillStyle=gl;ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='lighter';dots.forEach(d=>{if(!R)d.y-=d.v*16;if(d.y<-.1)d.y=1.1;const x=d.x*w,y=d.y*h;const rg=ctx.createRadialGradient(x,y,0,x,y,d.r);rg.addColorStop(0,`hsla(${d.h},90%,70%,${d.a})`);rg.addColorStop(1,`hsla(${d.h},90%,60%,0)`);ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,d.r,0,7);ctx.fill()});
    ctx.globalCompositeOperation='source-over';ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();const y0=h*(.55+i*.07);ctx.moveTo(0,y0);for(let x=0;x<=w;x+=24)ctx.lineTo(x,y0+Math.sin(x/140+i+t/2600)*14);ctx.stroke()}
    lgRAF=R?0:requestAnimationFrame(draw)};lgRAF=requestAnimationFrame(draw)}

/* ----- 상담 업로드 ----- */
function renderUpload(){$('#up-rec').setAttribute('aria-disabled',String(!S.dict||!!S.dictOff));$('#up-rec small').textContent=S.dict&&!S.dictOff?'크롬 · Claude 데스크톱 앱':'이 화면에서는 사용할 수 없습니다';
  const list=[...S.meetings.values()].sort((a,b)=>(b.updatedAt||b.createdAt||'').localeCompare(a.updatedAt||a.createdAt||'')).slice(0,6);
  $('#up-recent').innerHTML=list.length?list.map(m=>`<div class="m" data-meet="${esc(m.id)}" tabindex="0" role="button"><div class="d"><b>${esc((m.createdAt||'').slice(8,10))}</b>${esc((m.createdAt||'').slice(5,7))}월</div><div class="x"><b>${esc(m.title||'(제목 없음)')}</b><span>${esc(m.author||'')} · ${esc(m.status||'')}${m.minutes?' · 회의록':''}${m.quoteId?' · 견적 연결':''}</span></div><span class="chip ${m.analysis?'ok':''}">${m.analysis?'분석 완료':'분석 전'}</span></div>`).join(''):'<div class="empty-s">아직 올린 상담이 없습니다. 위에서 녹음하거나 파일을 올려 보세요.</div>'}
$('#up-recent').addEventListener('click',e=>{const x=e.target.closest('[data-meet]');if(x)openMeeting(x.dataset.meet)});
$('#up-recent').addEventListener('keydown',e=>{if(e.key==='Enter'){const x=e.target.closest('[data-meet]');if(x)openMeeting(x.dataset.meet)}});
$('#up-rec').onclick=()=>{if($('#up-rec').getAttribute('aria-disabled')==='true')return;openMeeting(null);$('#v-rec').click()};
$('#up-audio').onclick=()=>{$('#up-afile').click()};$('#up-text').onclick=()=>{$('#up-tfile').click()};$('#up-pick').onclick=()=>$('#up-anyfile').click();
const isAudio=f=>/^(audio|video)\//.test(f.type)||/\.(mp3|m4a|wav|aac|ogg|oga|opus|webm|mp4|flac|amr|3gp|wma)$/i.test(f.name);
function upFiles(fs){fs=[...fs];if(!fs.length)return;openMeeting(null);const au=fs.filter(isAudio),tx=fs.filter(f=>!isAudio(f));if(tx.length)vTextFiles(tx);if(au.length)vAudioFile(au[0]);if(au.length>1)toast('음성 파일은 한 번에 하나씩 변환됩니다. 첫 번째 파일부터 변환합니다.')}
['#up-afile','#up-tfile','#up-anyfile'].forEach(id=>$(id).onchange=e=>{const fs=[...e.target.files];e.target.value='';upFiles(fs)});
const dz=$('#up-drop');['dragenter','dragover'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add('over')}));['dragleave','drop'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove('over')}));
dz.addEventListener('drop',e=>upFiles(e.dataTransfer.files));
$('#up-skip').onclick=()=>go('home');

/* ----- 홈 대시보드 ----- */
function homeCounts(){const qs=[...S.quotes.values()],cs=[...S.contracts.values()],ds=[...S.discounts.values()],bs=[...S.buildreqs.values()];
  const dNeed=qs.filter(q=>{try{const f=flowOf(q);return f.need&&!f.dc&&q.status!=='작성중'&&q.status!=='실주'}catch(_){return false}}).length;
  const bNeed=cs.filter(c=>c.status==='체결완료'&&!brOfContract(c.id)).length;
  return{qs,cs,ds,bs,dNeed,bNeed,qDraft:qs.filter(q=>q.status==='작성중').length,wait:ds.filter(d=>d.status==='상신').length+bs.filter(b=>b.status==='상신').length}}
const ymd=()=>new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
function renderHome(){const C=homeCounts();const p=S.me||{};const now=new Date(Date.now()+9*3600e3);const ym=ymd().slice(0,7);
  const days=['일','월','화','수','목','금','토'];
  $('#hm-eyebrow').textContent=`${now.getUTCFullYear()}년 ${now.getUTCMonth()+1}월 ${now.getUTCDate()}일 ${days[now.getUTCDay()]}요일`;
  $('#hm-title').textContent=p.name?`안녕하세요, ${meNR()}님`:'안녕하세요';
  const open=C.qs.filter(q=>['제출','협상중'].includes(q.status));const openAmt=open.reduce((a,q)=>a+qTot(q).init,0);
  const wonM=C.qs.filter(q=>q.status==='수주'&&(q.updatedAt||q.quoteDate||'').slice(0,7)===ym);const wonAmt=wonM.reduce((a,q)=>a+qTot(q).init,0);
  const signed=C.cs.filter(c=>c.status==='체결완료');
  const K=[['quotes','진행 중 견적',open.length+'<small>건</small>',`일시납 ${won(openAmt)}원`,false],['quotes','이번 달 수주',won(wonAmt)+'<small>원</small>',`${wonM.length}건 · 체결 계약 누적 ${signed.length}건`,false],['discounts','결재 진행 중',C.wait+'<small>건</small>','상신한 할인기안·구축요청',false],['buildreqs','처리 필요',(C.dNeed+C.bNeed)+'<small>건</small>',`할인기안 ${C.dNeed} · 구축요청 ${C.bNeed}`,C.dNeed+C.bNeed>0]];
  $('#hm-kpi').innerHTML=K.map(([r,l,v,h,al])=>`<button class="k${al?' alert':''}" data-route="${r}"><span class="l">${l}</span><span class="v">${v}</span><span class="h">${h}</span></button>`).join('');
  // 파이프라인
  const F=[['상담',S.meetings.size,'upload','녹취·분석'],['견적',C.qs.length,'quotes',`제출 이상 ${C.qs.filter(q=>q.status!=='작성중').length}`],['계약',C.cs.length,'contracts',`체결 ${signed.length}`],['할인기안',C.ds.length,'discounts',`승인 ${C.ds.filter(d=>d.status==='승인').length}`],['구축요청',C.bs.length,'buildreqs',`승인 ${C.bs.filter(b=>b.status==='승인').length}`]];
  const mx=Math.max(1,...F.map(f=>f[1]));
  $('#hm-fun').innerHTML=F.map(([l,n,r,h])=>`<div class="r" data-route="${r}" style="cursor:pointer"><span>${l}</span><div class="tr"><div class="fl" style="width:${Math.max(2,n/mx*100)}%"></div><em>${esc(h)}</em></div><span class="n">${n}</span></div>`).join('');
  // 할 일
  const T=[];
  C.qs.forEach(q=>{let f;try{f=flowOf(q)}catch(_){return}if(f.need&&!f.dc&&q.status!=='작성중'&&q.status!=='실주')T.push({c:'var(--bad)',t:'할인기안 작성',s:`${q.customer||''} · 할인 ${fmt(f.disc.disc)}원`,act:()=>{S.tab='d';show('dash');startDiscount&&startDiscount(q.id)}})});
  C.cs.filter(c=>c.status==='체결완료'&&!brOfContract(c.id)).forEach(c=>T.push({c:'var(--bad)',t:'구축요청서 작성',s:`${c.counterparty} · 계약 ${c.contractDate||''}`,act:()=>startBuildReq(c.id)}));
  C.ds.filter(d=>d.status==='상신').forEach(d=>T.push({c:'var(--warn)',t:'할인기안 결재 대기',s:`${d.customer&&d.customer.name||''} · ${d.writtenAt||''}`,act:()=>openDiscount(d.id)}));
  C.bs.filter(b=>b.status==='상신').forEach(b=>T.push({c:'var(--warn)',t:'구축요청 결재 대기',s:`${b.customer&&b.customer.name||''}`,act:()=>openBuildReq(b.id)}));
  C.qs.filter(q=>q.status==='작성중').slice(0,4).forEach(q=>T.push({c:'var(--muted)',t:'작성 중인 견적',s:`${q.customer||'(업체명 없음)'} · ${q.quoteDate||''}`,act:()=>openQuote(q.id)}));
  S.homeTodo=T;$('#hm-todo-n').textContent=T.length?T.length+'건':'';$('#hm-todo').innerHTML=T.length?T.map((x,i)=>`<div class="t" data-todo="${i}" tabindex="0" role="button"><span class="dot" style="background:${x.c}"></span><div class="tx"><b>${esc(x.t)}</b><div>${esc(x.s)}</div></div><span class="go">열기 →</span></div>`).join(''):'<div class="empty-s">지금 처리할 일이 없습니다.</div>';
  // 최근 상담
  const ms=[...S.meetings.values()].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,5);
  $('#hm-meet').innerHTML=ms.length?ms.map(m=>`<div class="m" data-meet="${esc(m.id)}" tabindex="0" role="button"><div class="d"><b>${esc((m.createdAt||'').slice(8,10))}</b>${esc((m.createdAt||'').slice(5,7))}월</div><div class="x"><b>${esc(m.title||'(제목 없음)')}</b><span>${esc(m.author||'')}${m.analysis&&m.analysis.customer&&m.analysis.customer.name?' · '+esc(m.analysis.customer.name):''}</span></div><span class="chip ${m.quoteId?'ok':''}">${m.quoteId?'견적 연결':m.analysis?'분석 완료':'분석 전'}</span></div>`).join(''):'<div class="empty-s">아직 상담이 없습니다. ‘상담 올리기’에서 시작하세요.</div>';
  // 월별 견적 금액(일시납, 최근 6개월)
  const months=[];for(let i=5;i>=0;i--){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-i,1));months.push(d.toISOString().slice(0,7))}
  const vals=months.map(m=>C.qs.filter(q=>(q.quoteDate||'').slice(0,7)===m).reduce((a,q)=>a+qTot(q).init,0));const vmax=Math.max(1,...vals);
  const cbox=$('#hm-chart');const W=Math.max(260,Math.round(cbox.clientWidth-28)||420),H=Math.max(120,Math.min(320,Math.round(cbox.clientHeight-20)||150)),pl=8,pb=22,bw=(W-pl*2)/6;
  $('#hm-chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 6개월 견적 금액">${[0,.5,1].map(f=>`<line class="gl" x1="${pl}" x2="${W-pl}" y1="${(H-pb)-(H-pb-22)*f}" y2="${(H-pb)-(H-pb-22)*f}"/>`).join('')}
    ${vals.map((v,i)=>{const h=(H-pb-22)*v/vmax,x=pl+i*bw+bw*.22,y=H-pb-h;return`<rect class="bar${i===5?' cur':''}" x="${x}" y="${y}" width="${bw*.56}" height="${Math.max(v?2:0,h)}" rx="4"/>${v?`<text class="vl" x="${x+bw*.28}" y="${y-5}" text-anchor="middle">${won(v)}</text>`:''}<text class="ax" x="${x+bw*.28}" y="${H-7}" text-anchor="middle">${+months[i].slice(5)}월</text>`}).join('')}</svg>`;
  // 최근 문서
  const A=[];C.qs.forEach(q=>A.push({ty:'견적',cu:q.customer,st:q.status,at:q.updatedAt||q.quoteDate,act:()=>openQuote(q.id)}));C.cs.forEach(c=>A.push({ty:'계약',cu:c.counterparty,st:c.status,at:c.updatedAt||c.contractDate,act:()=>openContract(c.id)}));
  C.ds.forEach(d=>A.push({ty:'할인기안',cu:d.customer&&d.customer.name,st:d.status,at:d.updatedAt||d.writtenAt,act:()=>openDiscount(d.id)}));C.bs.forEach(b=>A.push({ty:'구축요청',cu:b.customer&&b.customer.name,st:b.status,at:b.updatedAt||b.writtenAt,act:()=>openBuildReq(b.id)}));
  A.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));S.homeAct=A.slice(0,10);
  $('#hm-act').innerHTML=S.homeAct.length?S.homeAct.map((x,i)=>`<tr data-act="${i}"><td><span class="ty">${x.ty}</span></td><td class="cu">${esc(x.cu||'(이름 없음)')}</td><td>${esc(x.st||'')}</td><td class="r">${esc(String(x.at||'').slice(5,10).replace('-','.'))}</td></tr>`).join(''):'<tr><td class="empty-s">아직 문서가 없습니다.</td></tr>';
  const sel=$('#hm-newq');if(!sel.options.length)sel.innerHTML='<option value="">새 견적 · 양식 선택…</option>'+XQ_TPLS.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}
$('#view-home').addEventListener('click',e=>{const r=e.target.closest('[data-route]');if(r){go(r.dataset.route);return}
  const t=e.target.closest('[data-todo]');if(t){S.homeTodo[+t.dataset.todo].act();return}
  const m=e.target.closest('[data-meet]');if(m){openMeeting(m.dataset.meet);return}
  const a=e.target.closest('[data-act]');if(a)S.homeAct[+a.dataset.act].act()});
$('#view-home').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const t=e.target.closest('[data-todo],[data-meet]');if(t)t.click()});
$('#hm-up').onclick=()=>go('upload');
$('#hm-newq').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;const q=newXQuote(v);q.id=uid();openXEditor(q,true)};
// 데이터가 바뀌면 홈·내비 갱신
let homeSig='';setInterval(()=>{const sig=[S.quotes.size,S.contracts.size,S.discounts.size,S.buildreqs.size,S.meetings.size,...[S.quotes,S.contracts,S.discounts,S.buildreqs,S.meetings].map(m=>[...m.values()].reduce((a,x)=>(x.updatedAt||'')>a?x.updatedAt:a,'')),S.me&&S.me.name].join('|');
  if(sig===homeSig)return;homeSig=sig;if(S.view==='home')renderHome();if(S.view==='upload')renderUpload();if(S.view==='login'&&!S.lgEdit)renderLogin();renderNav()},1500);
const _renderMeChip=renderMeChip;renderMeChip=function(){_renderMeChip();renderNav();if(S.view==='login'&&!S.lgEdit)renderLogin()};

/* ----- 시작 ----- */
(function boot(){let ok=false;try{ok=sessionStorage.getItem('qd-session')==='1'}catch(_){}
  S.authed=ok;if(S.meLoaded===undefined)S.meLoaded=false;
  if(!ok){show('login');return}
  const r=location.hash.slice(1);go(r&&(r==='home'||r==='upload'||r==='sites'||ROUTE_TAB[r])?r:'home')})();
$('#snav-av').style.cursor='pointer';$('#snav-av').title='내 정보';$('#snav-av').onclick=()=>openProfile(false);
let hmRT;window.addEventListener('resize',()=>{if(S.view!=='home')return;clearTimeout(hmRT);hmRT=setTimeout(renderHome,200)});

/* ----- 업무사이트 ----- */
function renderSites(){if(S.siteSel==null)S.siteSel=0;
  $('#sites-list').innerHTML=NAV_SITES.map(([l,u,ic,sub,desc,feats,use],i)=>`<article class="site${i===S.siteSel?' on':''}" id="site-${i}">
    <div class="site-h"><span class="ti">${svg(ic)}</span><div style="min-width:0"><h2>${esc(l)}</h2><div class="sub">${esc(sub)}</div></div></div>
    <p>${esc(desc)}</p><ul>${feats.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>
    <div class="use"><b>이럴 때</b> ${esc(use)}</div>
    <div class="site-a"><a class="btn pri" href="${esc(u)}" target="_blank" rel="noopener noreferrer">사이트 열기 ${svg('ext')}</a><button class="btn" type="button" data-copy="${i}">주소 복사</button><span class="url">${esc(u.replace(/^https:\/\//,'').replace(/\?.*$/,''))}</span></div></article>`).join('');
  const el=$('#site-'+S.siteSel);if(el)el.scrollIntoView({block:'nearest'})}
$('#sites-list').addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;const u=NAV_SITES[+b.dataset.copy][1];
  try{await navigator.clipboard.writeText(u);toast('주소를 복사했습니다')}catch(_){toast('복사가 막혀 있습니다: '+u)}});
