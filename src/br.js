
/* ================= 구축요청서 ================= */
const BR_STATUS=['작성중','상신','승인','반려'];
const BR_AGREE_RULE=[['결재','①영업담당자 > ②영업센터 Unit장 > ③영업센터 센터장'],['합의 · 서울/수도권','④담당자13차장 > ⑤담당자14차장 > ⑥담당자15부장 > ⑦담당자16부장 > ⑧담당자18이사'],['합의 · 서울/수도권 외','④담당자13차장 > ⑤담당자14차장 > ⑥담당자15부장 > ⑦담당자16부장 > ⑧담당자17부장 > ⑨담당자18이사'],['합의 · UC단독팩(ERP10 연동)','④담당자13차장 > ⑤담당자14차장 > ⑥담당자15부장 > ⑦담당자16부장 > ⑧담당자18이사'],['합의 · [전용개발]','④담당자13차장 > ⑤담당자14차장 > ⑥담당자15부장 > ⑦담당자16부장 > ⑧담당자18이사 > ⑨담당자21상무 > ⑩담당자22전무']];
const BR_REF='PKG사업본부, 블루멤버십Unit, 협업플랫폼개발1센터, ERPDEVLAP, IDC 운영 Unit, ENTUCUnit, 솔루션기술Unit';
const BR_AGREERS='차장 담당자13, 부장 담당자19, 이사 담당자18, 부장 담당자15, 이사 담당자20, 상무 담당자21, 전무 담당자22';
// [그룹, 소그룹, [[키, 표시, 자동인식 정규식, 추가입력 라벨]]]
const BR_OPTS=[
 ['도입모듈','관리',[['m_acc','회계',/^회계 ?관리$/],['m_hr','인사',/^인사 ?관리$/],['m_bud','예산',/^예산 ?관리$/],['m_ast','자산',/^자산 ?관리$/]]],
 ['도입모듈','물류·유통',[['m_sales','영업',/^영업 ?관리$/],['m_pur','구매자재',/^구매자재 ?관리$/]]],
 ['도입모듈','제조·생산',[['m_prd','생산',/^생산 ?관리$/],['m_out','외주',/^외주 ?관리$/],['m_cost','원가',/^원가 ?관리$/]]],
 ['도입모듈','UC',[['uc_ext','확장팩 (메일, 게시판, 메신저, 업무관리)',/UC 확장팩/],['uc_solo','단독팩 (EBP기본엔진 + UC확장팩)',/UC 단독팩/]]],
 ['공통 옵션','',[['o_corp','법인추가',/법인추가/,'법인 수'],['o_edu','추가교육',/추가 교육비/,'횟수'],['o_form','양식제작 (무상 5본 제외)',/양식제작/,'본'],['o_backup','백업(Amaranth10 전용 백업 라이선스)',/전용백업|백업 라이선스/,'개']]],
 ['UC 옵션','메일',[['o_rep','대표메일',/^대표 ?메일/,'유저'],['o_arc5','메일아카이빙 500유저 미만',/아카이빙.*500유저 미만/],['o_arc10','메일아카이빙 1000유저 미만',/아카이빙.*1000유저 미만/],['o_arc11','메일아카이빙 1000유저 이상',/아카이빙.*1000유저 이상/],['o_sec5','메일 보안 500유저 미만',/메일 ?보안.*500유저 미만/],['o_sec10','메일 보안 1000유저 미만',/메일 ?보안.*1000유저 미만/],['o_sec11','메일 보안 1000유저 이상',/메일 ?보안.*1000유저 이상/]]],
 ['UC 옵션','비영리',[['o_open','원문공개 (open.go.kr)',/^원문공개/],['o_seoul','서울시 원문공개',/서울시 원문공개/],['o_dist','문서유통',/문서유통/],['o_hwp','웹한글기안기연동',/기안기/]]],
 ['UC 옵션','모바일 · CRM',[['o_mobile','모바일 사용',/UC 확장팩|UC 단독팩|모바일 APP|^모바일$/],['o_crm','CRM',/^CRM$/]]],
 ['ECM 옵션','원챔버',[['o_exp','원챔버 탐색기팩',/탐색기팩/],['o_cen','원챔버 중앙화팩',/중앙화팩/],['o_med','원챔버 매체제어팩',/매체제어팩/]]],
 ['ERP 옵션','회계',[['e_fin','금융 서비스 연동',/금융 ?서비스 연동/,'연동 은행'],['e_grp','그룹 재무 제표',/그룹 ?재무 ?제표/],['e_auto','자동 전표 처리',/자동 ?전표 ?처리$|^자동 전표 처리/,'API/EXCEL'],['e_mfund','모바일자금관리',/모바일자금관리/],['e_ifrs','IFRS 18호',/IFRS/]]],
 ['ERP 옵션','인사/근태',[['e_reader','근태 리더기 연동',/근태 ?리더기/,'업체'],['e_hrx','인사근태 확장형',/인사근태 ?확장형/],['e_forme','모바일 ForMe',/^모바일 ForMe$/],['e_week','일/주단위 근무시간 정산',/일\/주단위/],['e_ext','대외활동관리',/대외활동/]]],
 ['ERP 옵션','예산',[['e_trip','출장복명 2.0',/출장복명/],['e_edu','교비회계 재무제표관리',/교비회계/],['e_pub','공익법인 예산장부',/공익법인/],['e_sme','중소기업 구매목표관리',/중소기업/],['e_univ','산학협력단 재무제표관리',/산학협력단/],['e_ctrl','예산회계 자율통제관리',/자율통제/],['e_nara','e나라도움연계서비스',/나라도움/]]],
 ['ERP 옵션','영업 · 물류',[['e_shop','온라인쇼핑몰관리',/온라인쇼핑몰/],['e_mlog','모바일물류관리 (유통 및 제조)',/모바일 물류관리/]]],
 ['서비스','팩스/문자',[['s_f60','60만포인트',/팩스.*60만/],['s_f120','120만포인트',/팩스.*120만/],['s_f240','240만포인트',/팩스.*240만/],['s_f360','360만포인트',/팩스.*360만/],['s_f600','600만포인트',/팩스.*600만/]]],
 ['서비스','스마트증빙 · 노무관리',[['s_smart','스마트 증빙(개인형/법인형)',/스마트증빙|스마트 증빙/],['s_n50','노무관리 50유저 이하',/노무관리.*50명/],['s_n100','노무관리 100유저 이하',/노무관리.*100명/],['s_n150','노무관리 150유저 이하',/노무관리.*150명/],['s_n300','노무관리 300유저 이하',/노무관리.*300명/],['s_n500','노무관리 500유저 이하',/노무관리.*500명 등록/],['s_n501','노무관리 501유저 이상',/노무관리.*500명 이상/]]],
 ['API 연동','공통 · UC · 시스템',[['a_mig','SmartA 및 iCUBE 데이터마이그레이션 (기수통합)',/iCUBE 마이그레이션/],['a_tech','UC 기술지원',/^기술 ?지원/],['a_dep','UC 배포 지원',/배포 ?지원/],['a_sys','시스템공통 API',/시스템공통/]]],
 ['API 연동','회계',[['a_acc','회계공통 API',/회계공통/],['a_auto','자동전표처리 API',/자동전표처리 API/],['a_evi','증빙데이터조회 API',/증빙데이터|증명데이터/],['a_led','회계원장조회 API',/회계원장/]]],
 ['API 연동','인사',[['a_hr','인사공통 API',/인사공통/],['a_hri','인사정보등록 API',/인사정보등록/],['a_card','인사기록카드 API',/인사기록카드/],['a_cert','증명서 API',/증명서 API/],['a_pay','상용직 급여 API',/상용직 급여/],['a_slip','급여 및 그밖의 소득 전표 API',/소득 전표/],['a_day','일용직 급여 API',/일용직/],['a_etc','그밖의소득 API',/^그밖의 ?소득 API/],['a_att','근태정보 API',/근태정보/],['a_attsum','근태결과집계 API',/근태결과/],['a_leave','연차/보상/대체휴가 API',/연차/]]],
 ['API 연동','예산 · 물류',[['a_bud','예산공통 API',/예산공통/],['a_res','결의서연동(예산) API',/결의서연동/],['a_log','물류공통 API',/물류공통/],['a_sal','영업관리 API',/영업관리 API/],['a_purapi','구매자재관리 API',/구매자재관리 API/],['a_prdapi','생산외주관리 API',/생산외주관리 API/]]]];
const BR_USERS=[['expert','전문가ERP 유저','ERP + UC + 임직원업무관리 + 연말정산 + CRM (메일 X)',/전문가/],['user','사용자(임직원) 유저','UC + 임직원업무관리 + 연말정산 (메일 X)',/^사용자|사용자\(임직원\)|사용자 유저/],['mail','메일 사용 유저','메일 사용 총 유저',/메일 사용|메일 유저|메일 단독/],['yearEnd','연말정산 유저','연말정산만 사용하는 유저',/연말정산/],['forme','모바일 ForMe 유저','모바일ForMe만 사용하는 유저',/ForMe 유저/],['crm','CRM 사용 유저','단독 사용 불가하며, 사용자 유저 필수',/CRM 사용자/]];
const BR_RANK=/^(사원|주임|대리|과장|차장|부장|팀장|매니저|이사|상무|전무|부사장|사장|대표|책임|선임|수석)$/;
function brPerson(v){const t=String(v||'').replace(/\s*\(.*?\)\s*/g,' ').trim().split(/\s+/).filter(Boolean);if(t.length===2&&BR_RANK.test(t[1])&&!BR_RANK.test(t[0]))return t[1]+' '+t[0];return t.join(' ')}
function brQuoteRows(q){const out=[];(q.sections||[]).forEach(s=>effRows(s.rows).forEach(r=>{if(hasQty(r))out.push({s,r,item:String(r.item||'').replace(/\s+/g,' ').trim(),name:[r.item,r.sub].filter(Boolean).join(' '),full:[r.item,r.sub,r.ecat,r.spec].join(' ')})}));return out}
function brSubtitle(q){if(!q)return'(더존 서버 구매, 더존 IDC)';if(q.template==='xl'){const sh=q.sheet||'';if(/Cloud|CSAP/.test(sh)||/cloud|csap|oneai/.test(q.tplId))return'(Amaranth 10 Cloud)';if(/고객IDC/.test(sh))return'(고객사 서버, 고객사 IDC)';if(/VM|임대형/.test(sh))return'(더존 IDC 임대형)';return'(더존 서버 구매, 더존 IDC)'}return/Cloud/i.test(q.docTitle||'')?'(Amaranth 10 Cloud)':'(더존 서버 구매, 더존 IDC)'}
function newBuildReq(c,q){
  const now=new Date(Date.now()+9*3600e3).toISOString().slice(0,16).replace('T',' ');
  const cust=c?(c.dzFirst?c.partyB:c.partyA):{name:q?q.customer:'',addr:'',bizNo:''};
  const b={status:'작성중',contractId:c?c.id:'',quoteId:q?q.id:(c?c.quoteId:''),subtitle:brSubtitle(q),docNo:'',writtenAt:now,dept:'AX영업Unit',drafter:q?brPerson(q.quoteOwner):'',
    recvRef:'PKG사업본부',executor:'',execDate:'',subject:`구축요청 - ${cust.name||''}`.trim(),approvers:'이사 담당자08',agreers:BR_AGREERS,ref:BR_REF,
    sales:{center:q?q.salesCenter||'':'',rep:q?q.salesRep||'':'',contractDate:c?c.contractDate:'',orderNo:''},
    customer:{name:cust.name||'',bizNo:cust.bizNo||'',addr:cust.addr||'',bizType:'',bizItem:'',dept:'',contact:q?q.contact||'':'',tel:'',hp:'',fax:'',email:'',visitAddr:''},
    type:'패키지',edu:{visit:'',foex:false,foexBase:false,ftStd:false,ftPrem:false,other:false},
    amt:{lic:'',hw:'',edu:'',cust:'',eduStart:'',eduEnd:'',custStart:'',custEnd:'',licIssue:'',licState:'',licDate:'',unissued:'',unissuedDate:'',other:'',collect:'',collectState:'',collectDate:''},
    blue:{freeMonths:'3',freeFrom:'',freeTo:'',base:'',rate:'15',amount:''},note:'',
    server:{location:'더존 IDC',type:'물리서버',os:'RedHat Linux',serverIp:'',serviceIp:'',cpu:'',ssd:'',sas:'',mem:'',sslSurvey:'',remote:'',salesQuote:'',itName:'',itPhone:'',firewall:false,ssl:''},
    scope:{corp:cust.name||'',adminId:'',domain:'',url:'',users:{},oneai:'',profit:'영리'},checks:{},vals:{},
    mig:{uc:'',ucScope:'',ucServer:'',ucIp:'',ucContact:'',erp:'',erpServer:'',erpInfo:''},
    custom:{inhouse:'',amount:'',dept:'',module:'',scope:'',outsource:'',vendor:'',vAmount:'',margin:'',vContact:'',vScope:''},
    eduDept:'더존 교육',detail:''};
  if(q)brApplyQuote(b,q,c);
  return b;
}
function brApplyQuote(b,q,c){
  const rows=brQuoteRows(q);const sums=quoteKeySums(q);
  b.amt.lic=sums.lic||0;b.amt.hw=sums.hw||0;b.amt.edu=sums.edu||0;
  b.amt.cust=(q.sections||[]).filter(s=>/커스터마이징/.test(s.title)).reduce((a,s)=>a+secTot(s).amt,0);
  if(b.amt.cust){b.type='패키지+커스터마이징';b.amt.lic=Math.max(0,b.amt.lic-b.amt.cust)}
  const blue=(q.sections||[]).filter(s=>/블루멤버십/.test(s.title));if(blue.length){const t=blue.reduce((a,s)=>a+secTot(s).amt,0);b.blue.amount=t}
  if(c){const ed=(c.conds||[]).find(x=>/교육시작/.test(x.label));if(ed){const m=String(ed.value).match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);if(m){b.amt.eduStart=`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;b.amt.eduEnd=`${m[4]}-${m[5].padStart(2,'0')}-${m[6].padStart(2,'0')}`}}b.sales.contractDate=c.contractDate}
  BR_USERS.forEach(([k,,,rx])=>{const hit=rows.filter(x=>rx.test(x.name)&&/유저|사용자|USER/i.test(x.name+x.r.unit));const H=k==='user'?hit.filter(x=>!/CRM|전문가|메일|연말정산|ForMe/.test(x.name)):hit;b.scope.users[k]=H.reduce((a,x)=>Math.max(a,num(x.r.qty)),0)||''});
  const plan=rows.find(x=>/(\d+)\s?요금제/.test(x.name));if(plan)b.scope.oneai=plan.name.match(/(\d+)\s?요금제/)[1]+'요금제';
  BR_OPTS.forEach(([,,items])=>items.forEach(([k,,rx,extra])=>{const hit=rows.filter(x=>rx.test(x.item)||(/^s_|^o_arc|^o_sec|^o_rep/.test(k)&&rx.test(x.full)));b.checks[k]=hit.length>0;if(extra&&hit.length&&/수|횟수|본|개|유저/.test(extra))b.vals[k]=hit.reduce((a,x)=>a+num(x.r.qty),0)}));
  if(b.checks.uc_ext||b.checks.uc_solo)b.checks.o_mobile=true;
  // 교육 구분: FoEX(1:N 교육센터) / 방문 교육 횟수 / 마이그레이션
  const edus=rows.filter(x=>catKey(x.s)==='edu'||/교육비/.test(x.item));
  const fo=edus.filter(x=>/FoEX/i.test(x.full)),vi=edus.filter(x=>!/FoEX/i.test(x.full));
  b.edu.foex=fo.length>0;b.edu.foexBase=fo.some(x=>!/Fast/i.test(x.full));b.edu.ftStd=edus.some(x=>/Fast-?Track.*Standard/i.test(x.full));b.edu.ftPrem=edus.some(x=>/Fast-?Track.*Premium/i.test(x.full));
  const times=x=>{const sp=String(x.r.spec||'');const t=sp.match(/총\s*(\d+)\s*회/);const n=t?+t[1]:(sp.match(/(\d+)\s*회/g)||[]).reduce((a,m)=>a+parseInt(m),0);return(n||1)*Math.max(1,num(x.r.qty))};
  const vis=vi.reduce((a,x)=>a+times(x),0);b.edu.visit=vis||'';
  b.edu.other=rows.some(x=>/마이그레이션/.test(x.full))&&!edus.length;
  const mg=rows.filter(x=>/마이그레이션|이관 툴|연동비/.test(x.full));if(mg.length&&!b.mig.uc){const ven=[...new Set(mg.map(x=>String(x.r.sub||'').replace(/\s*마이그레이션.*$/,'').trim()).filter(v=>v&&!/^(공통|옵션)$/.test(v)))];if(ven.length)b.mig.ucScope=ven.join(', ')+' 마이그레이션'}
  const fw=rows.some(x=>/전용 ?방화벽/.test(x.full));b.server.firewall=fw;
  const ssl=rows.find(x=>/SSL/.test(x.name));if(ssl)b.server.ssl=/멀티/.test(ssl.full)?'멀티':'기본';
  if(q.template==='xl'){const sh=q.sheet||'';b.server.location=/고객IDC/.test(sh)?'고객사 IDC':'더존 IDC';b.server.type=/VM|임대형|Cloud|CSAP/.test(sh)||/cloud|csap/.test(q.tplId)?'클라우드 서버':'물리서버'}
}
const brTotal=b=>['lic','hw','edu','cust'].reduce((a,k)=>a+num(b.amt[k]),0);

/* ----- 인쇄 ----- */
const cb=(on,l)=>`<span class="ck"><i class="cbx ${on?'on':''}"></i>${esc(l)}</span>`;
function brBlocks(b){
  const B=[];const won=v=>num(v)?'₩ '+fmt(num(v)):'₩';
  const ap=String(b.approvers||'').split(',').map(s=>s.trim()).filter(Boolean),ag=String(b.agreers||'').split(',').map(s=>s.trim()).filter(Boolean);
  const dz=String(b.drafter||'').split(/\s+/);const cells=(arr,n)=>{const a=arr.slice(0,n);while(a.length<n)a.push('');return a};
  const apc=cells([b.drafter?(dz.length>1?dz[0]+' '+dz.slice(1).join(' '):b.drafter):''].concat(ap),3),agc=cells(ag,7);
  const rk=s=>{const p=s.split(/\s+/);return p.length>1?p[0]:''},nm=s=>{const p=s.split(/\s+/);return p.length>1?p.slice(1).join(' '):s};
  B.push({html:`<h1 style="margin-bottom:2px">Amaranth10 구축요청서</h1><div class="c" style="font-size:11px;margin-bottom:10px">${esc(b.subtitle)}</div>
   <div class="hd"><table class="b kv"><tr><td class="k">품 의 번 호</td><td>${esc(b.docNo)}</td></tr><tr><td class="k">작 성 일 자</td><td>${esc(b.writtenAt)}</td></tr><tr><td class="k">기 안 부 서</td><td>${esc(b.dept)}</td></tr><tr><td class="k">기 안 자</td><td>${esc(b.drafter)}</td></tr></table>
   <table class="b ap" style="table-layout:fixed"><colgroup><col style="width:24px"></colgroup>
    <tr><td class="vl" rowspan="3">결재</td>${apc.map(x=>`<td>${esc(rk(x))}</td>`).join('')}<td colspan="4" style="border:none"></td></tr><tr>${apc.map((x,i)=>`<td class="tall">${x?i+1:''}</td>`).join('')}<td colspan="4" style="border:none"></td></tr><tr>${apc.map(x=>`<td>${esc(nm(x))}</td>`).join('')}<td colspan="4" style="border:none"></td></tr>
    <tr><td class="vl" rowspan="3">합의</td>${agc.map(x=>`<td>${esc(rk(x))}</td>`).join('')}</tr><tr>${agc.map((x,i)=>`<td class="tall">${x?apc.filter(Boolean).length+i+1:''}</td>`).join('')}</tr><tr>${agc.map(x=>`<td>${esc(nm(x))}</td>`).join('')}</tr></table></div>
   <table class="b rows1" style="border-top:none">${[['수신및참조',b.recvRef],['시 행 자',b.executor],['시 행 일 자',b.execDate],['제　　목',b.subject]].map(([k,v])=>`<tr><td class="k" style="border-top:none">${k}</td><td style="border-top:none">${esc(v)}</td></tr>`).join('')}</table>`});
  B.push({html:`<table class="b" style="margin-top:8px"><tr><th colspan="2" style="text-align:left">◈ 결재라인 지정방법</th></tr>${BR_AGREE_RULE.map(([k,v])=>`<tr><td class="c" style="width:150px">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}<tr><td class="c">수신참조</td><td>${esc(b.ref)}</td></tr></table>`});
  B.push({html:`<div class="fn" style="margin-top:8px">#. 구축 진행은 구축요청서 최종 결재 이후 진행됩니다.</div><table class="b"><tr><th style="width:84px">영업센터</th><td>${esc(b.sales.center)}</td><th rowspan="2" style="width:70px">계약일</th><td rowspan="2" class="c">${esc(b.sales.contractDate)}</td><th rowspan="2" style="width:70px">수주번호</th><td rowspan="2">${esc(b.sales.orderNo)}</td></tr><tr><th>영업담당자</th><td>${esc(b.sales.rep)}</td></tr></table>`});
  const c=b.customer;
  B.push({html:`<div class="fn" style="margin-top:8px">#. 모바일그룹웨어 개통시 필수 기재 사항이므로 빠짐없이 기재해 주시기 바랍니다.</div><table class="b"><colgroup><col style="width:84px"><col><col style="width:84px"><col></colgroup>
   ${[['업체명',c.name,'사업자등록번호',c.bizNo],['주 소',c.addr],['업 태',c.bizType,'종 목',c.bizItem],['부 서',c.dept,'담 당',c.contact],['전 화',c.tel,'H P',c.hp],['Fax',c.fax,'이메일',c.email],['방문주소지',c.visitAddr]].map(r=>r.length===2?`<tr><th>${r[0]}</th><td colspan="3">${esc(r[1])}</td></tr>`:`<tr><th>${r[0]}</th><td>${esc(r[1])}</td><th>${r[2]}</th><td>${esc(r[3])}</td></tr>`).join('')}</table>`});
  const a=b.amt,e=b.edu;
  B.push({html:`<div class="fn" style="margin-top:8px">#. 구축 시 확인 해야 할 구매내역이므로 빠짐없이 기재해 주시기 바랍니다.</div><table class="b"><colgroup><col style="width:84px"><col></colgroup>
   <tr><th>유형</th><td>${cb(b.type==='패키지','설치형(패키지)')} ${cb(b.type==='패키지+커스터마이징','설치형(패키지)+커스터마이징')}</td></tr>
   <tr><th>교육 구분</th><td>${cb(!!num(e.visit),'방문(추가)교육 : 교육횟수 ( '+(e.visit||' ')+' )회')}<br>${cb(e.foex,'FoEX 1:N 교육센터')} └ 1:N 기본교육 ${cb(e.foexBase,'여')} └ Fast-Track (Standard) ${cb(e.ftStd,'여')} └ Fast-Track (Premium) ${cb(e.ftPrem,'여')}<br>${cb(e.other,'기타 (마이그레이션)')}</td></tr></table>
   <table class="b" style="margin-top:-1px"><colgroup><col style="width:84px"><col style="width:52px"><col style="width:150px"><col></colgroup>
   <tr><th rowspan="11">계약 금액</th><th rowspan="7">계약<br>내역</th><td>총 계약 금액(VAT 별도)</td><td><b>${won(brTotal(b))}</b> (a+b+c+d)</td></tr>
   <tr><td>a.라이선스(VAT 별도)</td><td>${won(a.lic)}</td></tr><tr><td>b.하드웨어(VAT 별도)</td><td>${won(a.hw)}</td></tr><tr><td>c.교 육 비(VAT 별도)</td><td>${won(a.edu)}</td></tr>
   <tr><td>교 육 시 작(패키지)</td><td>${esc(a.eduStart||'연도-월-일')} ~ ${esc(a.eduEnd||'연도-월-일')} 내 1회차 교육 시작</td></tr>
   <tr><td>구축기간(커스터마이징)</td><td>${esc(a.custStart||'연도-월-일')} ~ ${esc(a.custEnd||'연도-월-일')}</td></tr>
   <tr><td>d.커스터마이징 금액(VAT 별도)</td><td>${won(a.cust)}</td></tr>
   <tr><th rowspan="4">세금<br>계산서</th><td>라이선스 발행 금액(VAT 별도)</td><td>${won(a.licIssue)} ${cb(a.licState==='발행','발행')} ${cb(a.licState==='발행예정','발행예정')} ${esc(a.licDate)}</td></tr>
   <tr><td>라이선스 미발행 금액(VAT 별도)</td><td>${won(a.unissued)} * 발행예정일 ${esc(a.unissuedDate)}</td></tr><tr><td>기타 발행 금액(VAT 별도)</td><td>${won(a.other)}</td></tr>
   <tr><td>수금(예정)액(VAT포함)</td><td>${won(a.collect)} ${cb(a.collectState==='수금','수금')} ${cb(a.collectState==='수금예정','수금예정')} ${esc(a.collectDate)}</td></tr></table>`});
  const bl=b.blue;
  B.push({html:`<table class="b" style="margin-top:-1px"><colgroup><col style="width:84px"><col style="width:202px"><col></colgroup>
   <tr><th rowspan="3">블루멤버십</th><td class="c">무상기준</td><td>( ${esc(bl.freeMonths||' ')} ) 개월</td></tr>
   <tr><td class="c">무상기간 (납기일기준으로 기간작성)</td><td>${esc(bl.freeFrom||'연도-월-일')} ~ ${esc(bl.freeTo||'연도-월-일')}</td></tr>
   <tr><td class="c">블루멤버십 계약금액</td><td>산정금액 : ${won(bl.base)}　/　블루멤버십 요율 : ${esc(bl.rate)}%　/　블루멤버십 체결 금액 : ${won(bl.amount)}</td></tr>
   <tr><th>비 고</th><td colspan="2" style="white-space:pre-line">${esc(b.note)}</td></tr>
   <tr><th>첨부파일<br>필수</th><td colspan="2" class="fn" style="margin:0">#. 구축 요청시 계약서, 견적서, 사전체크리스트 필수 첨부 해주셔야 합니다.<br>[Amaranth10] 사전 체크리스트(회계인사) / [Amaranth 10] 사전 체크리스트(물류생산)<br>#. 원피스문서 사본으로 작성 후 PDF파일로 첨부 (전모듈 WBS, 전모듈체크리스트 확인)<br>#. 변경 계약 발생 시 변경 계약 합의서 첨부</td></tr></table>`});
  const s=b.server;const yn=(v,l)=>`${cb(v==='예','예')} ${cb(v==='아니오','아니오')}`;
  B.push({html:`<div class="sec c">서　버　정　보</div><table class="b"><colgroup><col style="width:84px"><col style="width:150px"><col></colgroup>
   <tr><th>서버 위치</th><td colspan="2">${cb(true,s.location)}</td></tr><tr><th>서버 Type</th><td colspan="2">${cb(s.type==='물리서버','물리서버')} ${cb(s.type==='클라우드 서버','클라우드 서버')}</td></tr>
   <tr><th>OS 버전</th><td colspan="2">${cb(!!s.os,s.os||'RedHat Linux')}</td></tr><tr><th rowspan="2">IP</th><td class="c">서버 IP</td><td>[ ${esc(s.serverIp)} ]</td></tr><tr><td class="c">서비스 IP</td><td>[ ${esc(s.serviceIp)} ]</td></tr>
   <tr><th rowspan="4">서버<br>최소 사양</th><td>CPU: Xeon 24Core 이상</td><td>${yn(s.cpu)}</td></tr><tr><td>Application SSD-MU:1.92TB 이상 / Raid5 권장</td><td>${yn(s.ssd)}</td></tr><tr><td>attachment SAS: 4TB 이상 /data / Raid5 권장</td><td>${yn(s.sas)}</td></tr><tr><td>메모리: 128GB</td><td>${yn(s.mem)}</td></tr>
   <tr><th rowspan="6">연계솔루션<br>(회사11<br>매출견적서 발행)</th><td>SSL인증서 환경조사서 (고객사인감 날인 필수)</td><td>${cb(s.sslSurvey==='첨부','첨부')} ${cb(s.sslSurvey==='미첨부','미첨부')}</td></tr>
   <tr><td>더존IDC 원격접근동의서</td><td>${cb(s.remote==='첨부','첨부')} ${cb(s.remote==='미첨부','미첨부')} (더존IDC일 경우 첨부)</td></tr><tr><td>매출견적서</td><td>${cb(s.salesQuote==='첨부','첨부')} ${cb(s.salesQuote==='미첨부','미첨부')}</td></tr>
   <tr><td>고객사 전산담당자 연락처</td><td>담당자 : ${esc(s.itName)}　연락처 : ${esc(s.itPhone)}</td></tr><tr><td>방화벽</td><td>${cb(s.firewall,'Amaranth10 전용 방화벽')}</td></tr><tr><td>SSL 인증서</td><td>${cb(s.ssl==='기본','기본 SSL 인증서')} ${cb(s.ssl==='멀티','멀티 SSL 인증서 (두개 도메인 사용 시 적용)')}</td></tr></table>`});
  const sc=b.scope;
  B.push({html:`<div class="sec c">구　축　범　위</div><table class="b"><colgroup><col style="width:84px"><col style="width:180px"><col style="width:70px"><col></colgroup>
   <tr><th rowspan="${11+BR_USERS.length}">도입모듈<br>및<br>유저</th><td>기본 엔진</td><td colspan="2">기본 엔진(기본 유저 미포함)</td></tr><tr><td>계약 법인명</td><td colspan="2">${esc(sc.corp)}</td></tr><tr><td>회사대표 ID</td><td colspan="2">${esc(sc.adminId)}</td></tr><tr><td>소유도메인</td><td colspan="2">${esc(sc.domain)}</td></tr><tr><td>희망접속URL</td><td colspan="2">${esc(sc.url)}</td></tr>
   ${BR_USERS.map(([k,l,h])=>`<tr><td>${l} (NSM발주기준)</td><td class="c">( ${esc(sc.users[k]||' ')} )유저</td><td class="fn" style="margin:0;color:#666">${h}</td></tr>`).join('')}
   <tr><td>ONE AI 요금제</td><td colspan="2">${['25','35','50','75','100','200','300'].map(x=>cb(sc.oneai===x+'요금제',x+'요금제')).join(' ')}</td></tr><tr><td>결재구분</td><td colspan="2">${cb(sc.profit==='영리','영리')} ${cb(sc.profit==='비영리','비영리')}</td></tr>
   ${BR_OPTS.filter(g=>g[0]==='도입모듈').map(([,sub,items])=>`<tr><td>${esc(sub)}</td><td colspan="2">${items.map(([k,l])=>cb(b.checks[k],l)).join(' ')}</td></tr>`).join('')}</table>`});
  ['공통 옵션','UC 옵션','ECM 옵션','ERP 옵션','서비스','API 연동'].forEach(g=>{const subs=BR_OPTS.filter(x=>x[0]===g);
    B.push({html:`<table class="b" style="margin-top:-1px"><colgroup><col style="width:84px"><col style="width:110px"><col></colgroup>${subs.map(([,sub,items],i)=>`<tr>${i===0?`<th rowspan="${subs.length}">${esc(g)}</th>`:''}<td class="c">${esc(sub||g)}</td><td>${items.map(([k,l,,ex])=>cb(b.checks[k],l+(ex&&b.vals[k]!=null&&b.vals[k]!==''?` (${ex} ${b.vals[k]})`:''))).join(' ')}</td></tr>`).join('')}</table>`})});
  const m=b.mig;
  B.push({html:`<table class="b" style="margin-top:-1px"><colgroup><col style="width:84px"><col style="width:130px"><col></colgroup>
   <tr><th rowspan="4">마이그레이션</th><td>UC 마이그레이션 범위</td><td>${esc(m.uc)} ${esc(m.ucScope)}</td></tr><tr><td>UC 서버 정보</td><td>${esc(m.ucServer)} ${m.ucIp?'IP: '+esc(m.ucIp):''} ${m.ucContact?'담당: '+esc(m.ucContact):''}</td></tr>
   <tr><td>ERP 마이그레이션 범위 (전방제외)</td><td>${esc(m.erp)}</td></tr><tr><td>ERP 서버 정보</td><td>${esc(m.erpServer)} ${esc(m.erpInfo)}</td></tr></table>`});
  const cu=b.custom;
  B.push({html:`<table class="b" style="margin-top:-1px"><colgroup><col style="width:84px"><col style="width:130px"><col></colgroup>
   <tr><th rowspan="4">커스터마이징<br>및<br>API연동</th><td>내부 전용개발 여부</td><td>${['예','아니오','검토중'].map(x=>cb(cu.inhouse===x,x)).join(' ')}　전용개발금액 : ${won(cu.amount)}</td></tr>
   <tr><td>내부 개발 정보</td><td>부서/담당자 : ${esc(cu.dept)}　개발모듈 : ${esc(cu.module)}　개발범위 : ${esc(cu.scope)}</td></tr>
   <tr><td>외주 여부</td><td>${['예','아니오','검토중'].map(x=>cb(cu.outsource===x,x)).join(' ')}</td></tr>
   <tr><td>외주사 정보</td><td>외주업체 : ${esc(cu.vendor)}　계약금액 : ${won(cu.vAmount)}　이익률 : ${esc(cu.margin)}%　담당자/연락처 : ${esc(cu.vContact)}　외주범위 : ${esc(cu.vScope)}</td></tr>
   <tr><th>교육시행<br>부서</th><td colspan="2">${cb(b.eduDept==='더존 교육','더존 교육')} ${cb(b.eduDept==='BP사 자체 교육','BP사 자체 교육')}</td></tr></table>`});
  B.push({html:`<div class="sec">공통옵션 상세내용 및 계약정보 관련 특이사항</div><table class="b reason"><tr><td style="height:80px;vertical-align:top">${esc(b.detail)}</td></tr></table>
   <div class="meta"><div>문서유형 : 일반문서</div><div>보안등급 : 선택없음</div><div>긴급도 : 보통</div><div>보존연한 : 영구보존</div></div>`});
  return B;
}
async function buildReqPages(b){return finalize((await paginate(brBlocks(b),'tpl-dc tpl-br',CONTENT_H)).map(p=>`<div class="page tpl-dc tpl-br">${p.map(h=>`<div class="blk">${h}</div>`).join('')}${DFOOT}</div>`))}

/* ----- 진행 현황 ----- */
function brOfContract(cid){return[...S.buildreqs.values()].filter(x=>x.contractId===cid).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''))[0]}
function brStateOfQuote(q){const c=byQuote(S.contracts,q.id);if(!c||c.status!=='체결완료')return null;const b=brOfContract(c.id);return b?b.status:'필요'}

/* ----- 목록 ----- */
function renderBrDash(){
  const term=$('#b-search').value.trim().toLowerCase(),st=$('#b-status').value;
  const list=[...S.buildreqs.values()].filter(b=>(!st||b.status===st)&&(!term||[b.customer&&b.customer.name,b.subject].join(' ').toLowerCase().includes(term))).sort((a,b)=>(b.writtenAt||'').localeCompare(a.writtenAt||''));
  const pend=[...S.contracts.values()].filter(c=>c.status==='체결완료'&&!brOfContract(c.id));
  const k=[['구축요청',list.length+'건',`상신 ${list.filter(b=>b.status==='상신').length} · 승인 ${list.filter(b=>b.status==='승인').length} · 반려 ${list.filter(b=>b.status==='반려').length}`],['작성 필요',pend.length+'건','체결완료 계약 중 구축요청 없음'],['총 계약 금액',won(list.reduce((a,b)=>a+brTotal(b),0))+'원','구축요청서 기준 (a+b+c+d)'],['승인 대기',list.filter(b=>b.status==='상신').length+'건','결재 진행 중']];
  $('#bkpis').innerHTML=k.map(([l,v,h])=>`<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="h">${h}</div></div>`).join('');
  $('#bpend').innerHTML=pend.length?`<div class="panel" style="margin-bottom:14px"><h2>구축요청서 작성이 필요한 계약</h2><div class="tbl-wrap"><table class="list"><tbody>${pend.map(c=>`<tr><td><div class="cust">${esc(c.counterparty)}</div><div class="qn">${esc(c.contractName)}</div></td><td>${esc(c.contractDate)}</td><td class="n">${fmt(ctTotal(c))}</td><td style="text-align:right"><button class="btn pri" data-mkbr="${esc(c.id)}">구축요청서 작성</button></td></tr>`).join('')}</tbody></table></div></div>`:'';
  $('#blist').innerHTML=list.length?list.map(b=>{const c=S.contracts.get(b.contractId);return`<tr class="row" data-id="${esc(b.id)}" tabindex="0"><td>${esc((b.writtenAt||'').slice(0,10))}</td><td><div class="cust">${esc(b.customer&&b.customer.name||'(업체명 미입력)')}</div><div class="qn">${esc(b.subtitle)}</div></td><td><span class="pill dc-${esc(b.status)}">${esc(b.status)}</span></td><td class="qn">${c?esc(c.contractName||c.title):'—'}</td><td>${esc(b.type)}</td><td class="n">${fmt(brTotal(b))}</td><td class="qn">${esc(b.amt.eduStart||'')}</td></tr>`}).join('')
   :`<tr><td colspan="7"><div class="empty">아직 구축요청서가 없습니다. 체결완료된 계약에서 ‘구축요청서 작성’을 누르세요.</div></td></tr>`;
  const sel=$('#b-newc');const cur=sel.value;sel.innerHTML='<option value="">계약 선택</option>'+[...S.contracts.values()].sort((a,b)=>(b.contractDate||'').localeCompare(a.contractDate||'')).map(c=>`<option value="${esc(c.id)}"${c.id===cur?' selected':''}>${esc(c.counterparty)} · ${esc(c.status)} · ${esc(c.contractDate)}</option>`).join('');
}
$('#b-status').innerHTML+=BR_STATUS.map(s=>`<option>${s}</option>`).join('');
['#b-search','#b-status'].forEach(s=>$(s).addEventListener('input',renderBrDash));
$('#blist').addEventListener('click',e=>{const tr=e.target.closest('tr.row');if(tr)openBuildReq(tr.dataset.id)});
$('#blist').addEventListener('keydown',e=>{if(e.key==='Enter'){const tr=e.target.closest('tr.row');if(tr)openBuildReq(tr.dataset.id)}});
document.addEventListener('click',e=>{const x=e.target.closest('[data-mkbr]');if(x)startBuildReq(x.dataset.mkbr)});
$('#b-new').onclick=()=>{const id=$('#b-newc').value;if(id)startBuildReq(id);else toast('계약서를 먼저 선택하세요')};
function startBuildReq(cid){if((S.view==='cedit'&&S.cdirty)){toast('먼저 계약서를 저장하세요');return}
  const ex=brOfContract(cid);if(ex){openBuildReq(ex.id);toast('이 계약의 구축요청서가 이미 있어 열었습니다');return}
  const c=S.contracts.get(cid);if(!c)return;if(c.status!=='체결완료')toast('참고: 계약이 아직 체결완료 상태가 아닙니다');
  const q=c.quoteId&&S.quotes.get(c.quoteId);const b=newBuildReq(c,q||null);b.id=uid().replace(/^q/,'b');openBEditor(b,true)}

/* ----- 편집 ----- */

function renderBForm(){
  const b=S.bdraft;const c=S.contracts.get(b.contractId);const q=b.quoteId&&S.quotes.get(b.quoteId);
  const ckGroup=g=>BR_OPTS.filter(x=>x[0]===g).map(([,sub,items])=>`<div class="brg"><div class="hint">${esc(sub||g)}</div><div class="chk-grid">${items.map(([k,l,,ex])=>`<label class="fld chk">${inp('checks.'+k,b.checks[k],{type:'chk',label:l})}<span>${esc(l)}</span>${ex?inp('vals.'+k,b.vals[k]??'',{label:ex,ph:ex}).replace('<input','<input style="width:80px;margin-left:6px;border:1px solid var(--line);border-radius:5px;padding:2px 5px"'):''}</label>`).join('')}</div></div>`).join('');
  const sel=(p,v,opts,l)=>fld(l,p,v,{type:'sel',opts:opts.map(x=>[x,x||'—'])});
  $('#br-form').innerHTML=`
  <div class="card"><h3>기안 정보</h3><div class="fgrid">
   ${fld('진행 상태','status',b.status,{type:'sel',opts:BR_STATUS.map(s=>[s,s])})}${fld('부제 (서버/IDC 구분)','subtitle',b.subtitle)}${fld('품의번호','docNo',b.docNo,{ph:'상신 후 입력'})}${fld('작성일자','writtenAt',b.writtenAt)}${fld('기안부서','dept',b.dept)}${fld('기안자 (직급 이름)','drafter',b.drafter)}${fld('수신및참조','recvRef',b.recvRef)}${fld('시행자','executor',b.executor)}${fld('시행일자','execDate',b.execDate)}${fld('제목','subject',b.subject,{wide:true})}
   ${fld('결재 (기안자 다음, "직급 이름"을 쉼표로)','approvers',b.approvers,{wide:true})}${fld('합의 (쉼표로 구분, 최대 7명)','agreers',b.agreers,{wide:true})}${fld('수신참조','ref',b.ref,{type:'ta',wide:true,rows:2})}</div>
   <p class="hint" style="margin:8px 0 0">연결: ${c?`계약 ${esc(c.counterparty)} · ${esc(c.status)}`:'계약 없음'}${q?` · 견적 ${esc(q.quoteNo||'')}`:''} ${q?'<button class="ib" data-bact="reload">견적·계약 내용 다시 반영</button>':''} ${c?'<button class="ib" data-bact="openc">계약서 열기</button>':''}</p></div>
  <div class="card"><h3>영업 · 고객 정보</h3><div class="fgrid">${fld('영업센터','sales.center',b.sales.center)}${fld('영업담당자','sales.rep',b.sales.rep)}${fld('계약일','sales.contractDate',b.sales.contractDate,{type:'date'})}${fld('수주번호','sales.orderNo',b.sales.orderNo)}
   ${[['name','업체명'],['bizNo','사업자등록번호'],['addr','주소'],['bizType','업태'],['bizItem','종목'],['dept','부서'],['contact','담당'],['tel','전화'],['hp','HP'],['fax','Fax'],['email','이메일'],['visitAddr','방문주소지']].map(([k,l])=>fld(l,'customer.'+k,b.customer[k])).join('')}</div></div>
  <div class="card"><h3>유형 · 교육</h3><div class="fgrid">${sel('type',b.type,['패키지','패키지+커스터마이징'],'유형')}${fld('방문(추가)교육 횟수','edu.visit',b.edu.visit,{type:'n'})}${fld('FoEX 1:N 교육센터','edu.foex',b.edu.foex,{type:'chk'})}${fld('1:N 기본교육','edu.foexBase',b.edu.foexBase,{type:'chk'})}${fld('Fast-Track (Standard)','edu.ftStd',b.edu.ftStd,{type:'chk'})}${fld('Fast-Track (Premium)','edu.ftPrem',b.edu.ftPrem,{type:'chk'})}${fld('기타 (마이그레이션 단독)','edu.other',b.edu.other,{type:'chk'})}${sel('eduDept',b.eduDept,['더존 교육','BP사 자체 교육'],'교육시행 부서')}</div></div>
  <div class="card"><h3>계약 금액</h3><p class="hint" style="margin:-4px 0 8px">견적 금액에서 자동으로 채웠습니다. 총 계약 금액 = a+b+c+d = <b id="br-total">${fmt(brTotal(b))}</b>원</p><div class="fgrid">
   ${fld('a. 라이선스','amt.lic',b.amt.lic,{type:'n'})}${fld('b. 하드웨어','amt.hw',b.amt.hw,{type:'n'})}${fld('c. 교육비','amt.edu',b.amt.edu,{type:'n'})}${fld('d. 커스터마이징','amt.cust',b.amt.cust,{type:'n'})}
   ${fld('교육 시작 (부터)','amt.eduStart',b.amt.eduStart,{type:'date'})}${fld('교육 시작 (까지)','amt.eduEnd',b.amt.eduEnd,{type:'date'})}${fld('구축기간 시작','amt.custStart',b.amt.custStart,{type:'date'})}${fld('구축기간 종료','amt.custEnd',b.amt.custEnd,{type:'date'})}
   ${fld('라이선스 발행 금액','amt.licIssue',b.amt.licIssue,{type:'n'})}${sel('amt.licState',b.amt.licState,['','발행','발행예정'],'발행 상태')}${fld('발행(예정)일','amt.licDate',b.amt.licDate,{type:'date'})}
   ${fld('라이선스 미발행 금액','amt.unissued',b.amt.unissued,{type:'n'})}${fld('미발행분 발행예정일','amt.unissuedDate',b.amt.unissuedDate,{type:'date'})}${fld('기타 발행 금액','amt.other',b.amt.other,{type:'n'})}
   ${fld('수금(예정)액 (VAT포함)','amt.collect',b.amt.collect,{type:'n'})}${sel('amt.collectState',b.amt.collectState,['','수금','수금예정'],'수금 상태')}${fld('수금(예정)일','amt.collectDate',b.amt.collectDate,{type:'date'})}</div></div>
  <div class="card"><h3>블루멤버십</h3><div class="fgrid">${fld('무상기준 (개월)','blue.freeMonths',b.blue.freeMonths,{type:'n'})}${fld('무상기간 시작','blue.freeFrom',b.blue.freeFrom,{type:'date'})}${fld('무상기간 종료','blue.freeTo',b.blue.freeTo,{type:'date'})}${fld('산정금액','blue.base',b.blue.base,{type:'n'})}${fld('요율 %','blue.rate',b.blue.rate,{type:'n'})}${fld('체결 금액','blue.amount',b.blue.amount,{type:'n'})}${fld('비고','note',b.note,{type:'ta',wide:true,rows:2})}</div></div>
  <div class="card"><h3>서버 정보</h3><div class="fgrid">${sel('server.location',b.server.location,['더존 IDC','고객사 IDC','타사 IDC','자체서버'],'서버 위치')}${sel('server.type',b.server.type,['물리서버','클라우드 서버'],'서버 Type')}${fld('OS 버전','server.os',b.server.os)}${fld('서버 IP','server.serverIp',b.server.serverIp)}${fld('서비스 IP','server.serviceIp',b.server.serviceIp)}
   ${[['cpu','CPU Xeon 24Core 이상'],['ssd','SSD-MU 1.92TB 이상'],['sas','SAS 4TB 이상'],['mem','메모리 128GB']].map(([k,l])=>sel('server.'+k,b.server[k],['','예','아니오'],l)).join('')}
   ${sel('server.sslSurvey',b.server.sslSurvey,['','첨부','미첨부'],'SSL인증서 환경조사서')}${sel('server.remote',b.server.remote,['','첨부','미첨부'],'더존IDC 원격접근동의서')}${sel('server.salesQuote',b.server.salesQuote,['','첨부','미첨부'],'매출견적서')}${fld('고객사 전산담당자','server.itName',b.server.itName)}${fld('전산담당자 연락처','server.itPhone',b.server.itPhone)}${fld('Amaranth10 전용 방화벽','server.firewall',b.server.firewall,{type:'chk'})}${sel('server.ssl',b.server.ssl,['','기본','멀티'],'SSL 인증서')}</div></div>
  <div class="card"><h3>구축 범위 · 도입모듈 및 유저</h3><p class="hint" style="margin:-4px 0 8px">견적 품목에서 유저 수, ONE AI 요금제, 도입 모듈과 옵션을 자동으로 체크했습니다. 확인 후 수정하세요.</p>
   <div class="fgrid">${fld('계약 법인명','scope.corp',b.scope.corp)}${fld('회사대표 ID','scope.adminId',b.scope.adminId)}${fld('소유도메인','scope.domain',b.scope.domain)}${fld('희망접속URL','scope.url',b.scope.url)}
   ${BR_USERS.map(([k,l])=>fld(l+' (유저)','scope.users.'+k,b.scope.users[k],{type:'n'})).join('')}${sel('scope.oneai',b.scope.oneai,['','25요금제','35요금제','50요금제','75요금제','100요금제','200요금제','300요금제'],'ONE AI 요금제')}${sel('scope.profit',b.scope.profit,['영리','비영리'],'결재구분')}</div>
   ${ckGroup('도입모듈')}</div>
  <div class="card"><h3>옵션 기능 · 서비스</h3>${ckGroup('공통 옵션')}${ckGroup('UC 옵션')}${ckGroup('ECM 옵션')}${ckGroup('ERP 옵션')}${ckGroup('서비스')}</div>
  <div class="card"><h3>마이그레이션</h3><div class="fgrid">${sel('mig.uc',b.mig.uc,['','B1','Suite','NP','Alpha(영리)','Alpha(비영리)'],'UC 마이그레이션 대상')}${fld('UC 범위 (조직도/전자결재/공지게시/문서/일정·자원/메일)','mig.ucScope',b.mig.ucScope)}${sel('mig.ucServer',b.mig.ucServer,['','더존 IDC','타사 IDC','자체서버'],'UC 서버 구분')}${fld('UC 서버 IP','mig.ucIp',b.mig.ucIp)}${fld('UC 담당자 (성함/연락처)','mig.ucContact',b.mig.ucContact)}
   ${fld('ERP 마이그레이션 범위 (iCUBE/Smart A, 법인수·기수·모듈)','mig.erp',b.mig.erp,{type:'ta',wide:true,rows:2})}${sel('mig.erpServer',b.mig.erpServer,['','더존 IDC (SQL DB)','더존 IDC (Maria DB)','타사IDC','자체서버','Secure Channel'],'ERP 서버 구분')}${fld('ERP 서버 정보 (DB IP / Port)','mig.erpInfo',b.mig.erpInfo)}</div></div>
  <div class="card"><h3>커스터마이징 및 API연동</h3><div class="fgrid">${sel('custom.inhouse',b.custom.inhouse,['','예','아니오','검토중'],'내부 전용개발 여부')}${fld('전용개발금액','custom.amount',b.custom.amount,{type:'n'})}${fld('부서/담당자','custom.dept',b.custom.dept)}${fld('개발모듈','custom.module',b.custom.module)}${fld('개발범위','custom.scope',b.custom.scope)}
   ${sel('custom.outsource',b.custom.outsource,['','예','아니오','검토중'],'외주 여부')}${fld('외주업체','custom.vendor',b.custom.vendor)}${fld('외주 계약금액','custom.vAmount',b.custom.vAmount,{type:'n'})}${fld('이익률 %','custom.margin',b.custom.margin,{type:'n'})}${fld('외주 담당자/연락처','custom.vContact',b.custom.vContact)}${fld('외주범위','custom.vScope',b.custom.vScope)}</div>
   ${ckGroup('API 연동')}</div>
  <div class="card"><h3>공통옵션 상세내용 및 계약정보 관련 특이사항</h3>${fld('법인추가, 교육장소, 커스터마이징 내용, 마이그레이션 상세 등','detail',b.detail,{type:'ta',wide:true,rows:6})}</div>`;
  $('#br-title').textContent=(b.customer.name||'새 구축요청')+' · 구축요청서';
}
function setBDirty(v){S.bdirty=v;$('#bdirty').hidden=!v}
let bPrevT,bSeq=0;function scheduleBPreview(){clearTimeout(bPrevT);bPrevT=setTimeout(renderBPreview,350)}
async function renderBPreview(){if(!S.bdraft)return;const seq=++bSeq;const pages=await buildReqPages(S.bdraft);if(seq!==bSeq||!S.bdraft)return;showPages(pages,$('#bprev'));$('#bprev-info').textContent=`A4 미리보기 · ${pages.length}쪽`}
$('#br-form').addEventListener('input',e=>{const el=e.target;const p=el.dataset.p;if(!p)return;const b=S.bdraft;
  const ks=p.split('.');let t=b;for(let i=0;i<ks.length-1;i++){if(t[ks[i]]==null)t[ks[i]]={};t=t[ks[i]]}t[ks[ks.length-1]]=el.type==='checkbox'?el.checked:el.value;
  const tt=$('#br-total');if(tt)tt.textContent=fmt(brTotal(b));if(p==='customer.name')$('#br-title').textContent=(b.customer.name||'새 구축요청')+' · 구축요청서';
  setBDirty(true);scheduleBPreview()});
$('#br-form').addEventListener('click',e=>{const x=e.target.closest('[data-bact]');if(!x)return;const b=S.bdraft;const a=x.dataset.bact;
  if(a==='reload'){const q=S.quotes.get(b.quoteId);if(!q)return;b.checks={};b.vals={};b.scope.users={};brApplyQuote(b,q,S.contracts.get(b.contractId));renderBForm();setBDirty(true);scheduleBPreview();toast('견적·계약 내용을 다시 반영했습니다')}
  else if(a==='openc'){if(S.bdirty){toast('먼저 구축요청서를 저장하세요');return}openContract(b.contractId)}});
function openBEditor(b,isNew){S.bdraft=clone(b);S.bid=b.id;S.bisNew=isNew;setBDirty(!!isNew);resetBArm();renderBForm();show('bedit');renderBPreview()}
function openBuildReq(id){const b=S.buildreqs.get(id);if(b)openBEditor(b,false)}
function resetBArm(){const x=$('#bdel');x.classList.remove('armed');x.textContent='삭제';delete x.dataset.armed;const k=$('#bback');k.textContent='← 목록';delete k.dataset.armed}
$('#bback').onclick=()=>{const k=$('#bback');if(S.bdirty&&!k.dataset.armed){k.dataset.armed='1';k.textContent='저장 안 하고 나가기';setTimeout(()=>{if(k.dataset.armed){delete k.dataset.armed;k.textContent='← 목록'}},3500);return}S.bdraft=null;setBDirty(false);show('dash');setTab('b')};
async function saveBuildReq(){const b=S.bdraft;b.updatedAt=new Date(Date.now()+9*3600e3).toISOString().slice(0,19);
  if(!S.db){S.buildreqs.set(b.id,clone(b));setBDirty(false);S.bisNew=false;toast('이 화면에서만 저장했습니다 (공유 저장소 연결 안 됨)');return}
  $('#bsave').disabled=true;try{await S.db.collection('buildreqs').doc(b.id).set(clone(b));S.buildreqs.set(b.id,clone(b));setBDirty(false);S.bisNew=false;toast('저장했습니다')}
  catch(err){toast(err&&err.code==='invalid_argument'?'저장 권한이 없습니다. 편집 권한(Contributor 이상)이 필요합니다.':'저장하지 못했습니다')}finally{$('#bsave').disabled=false}}
$('#bsave').onclick=saveBuildReq;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&S.view==='bedit'){e.preventDefault();saveBuildReq()}});
$('#bdel').onclick=async()=>{const x=$('#bdel');if(!x.dataset.armed){x.dataset.armed='1';x.classList.add('armed');x.textContent='삭제 확인';setTimeout(()=>{if(x.dataset.armed)resetBArm()},3500);return}
  const id=S.bid;resetBArm();if(!S.bisNew){try{if(S.db)await S.db.collection('buildreqs').doc(id).delete();S.buildreqs.delete(id)}catch(_){toast('삭제하지 못했습니다');return}}setBDirty(false);S.bdraft=null;show('dash');setTab('b');toast('삭제했습니다')};
const bBase=()=>{const b=S.bdraft;return safeName(`${b.customer.name||'고객사'}_구축요청서_${(b.writtenAt||'').slice(0,10)}`)};
$('#bexp-pdf').onclick=async()=>{const x=$('#bexp-pdf');x.disabled=true;x.textContent='PDF 만드는 중…';try{await exportPdf(await buildReqPages(S.bdraft),bBase())}finally{x.disabled=false;x.textContent='PDF 저장'}};
$('#bexp-html').onclick=async()=>exportHtml(await buildReqPages(S.bdraft),bBase());
document.querySelectorAll('.tabs .btn[data-btab]').forEach(x=>x.onclick=()=>{$('#bed-grid').dataset.tab=x.dataset.btab;document.querySelectorAll('.tabs .btn[data-btab]').forEach(y=>y.setAttribute('aria-pressed',String(y===x)));if(x.dataset.btab==='prev')scheduleBPreview()});
$('#cmk-br').onclick=()=>{if(S.cdirty||S.cisNew){toast('먼저 계약서를 저장하세요');return}startBuildReq(S.cid)};
