
/* ================= 할인기안 ================= */
const DC_STATUS=['작성중','상신','승인','반려'];
const DC_CATS=[['lic','1. 라이선스','일시납'],['user','2. 유저 라이선스','일시납'],['api','3. API연동','일시납'],['edu','4. 교육비',''],['cust','5. 커스터마이징','일시납'],['hw','6. 하드웨어 옵션','일시납'],['ai','7. ONE AI 사용료','연납'],['blue','8. 블루멤버십','연납'],['ext','9. 외부 옵션','일시납'],['use','10. 사용료','월납/연납']];
const DC_LUMP=['lic','user','api','edu','cust','hw','ext'];
const DC_LINES={
 direct:{approve:'2. Unit장 - 7. 센터장 - 8. 부문장(TS)',agree:'1. 영업관리팀 - 3. 담당자23 과장(ONE AI 할인 및 특이 계약 시) - 4. 담당자24 부장(ONE AI 할인 및 특이 계약 시) - 5. BM담당자 - 6. 온라인영업 센터장',ref:'담당자25 전무, 담당자22 전무, 담당자21 상무, 담당자26 이사, 담당자19 부장, PKG사업본부, A10운영부, 블루멤버십Unit, A10사업운영관리Unit'},
 bp:{approve:'해당 BP - Channel영업센터',agree:'',ref:'담당자25 전무, 담당자22 전무, 담당자21 상무, 담당자26 이사, 담당자19 부장, PKG사업본부, A10운영부, 블루멤버십Unit, A10사업운영관리Unit'}};
function dcCat(s,r){
  const st=[s.title,s.sumLabel].join(' ');const t=[r.ecat,r.esub,r.item,r.spec].join(' ');const k=catKey(s);
  if(/블루멤버십|유지보수/.test(st))return'blue';
  if(k==='ai')return'ai';if(k==='edu')return'edu';if(k==='ext')return'ext';
  if(s.payType!=='일시납')return/SSL|모바일 APP/.test(t)&&/블루/.test(st)?'blue':'use';
  if(/M\/M/.test(r.unit||'')||/커스터마이징|마이그레이션|인건비|구축|개발비|컨설턴트|IT PM/.test(t))return'cust';
  if(/API|이관 ?툴|연동비/.test(t))return'api';
  const h=[r.ecat,r.esub,r.item].join(' ');
  if(/유저|사용자|메일 사용|원챔버|탐색기팩|중앙화팩|매체제어|팩스/.test(h)||/유저 ?라이선스|사용 유저/.test(r.spec||''))return'user';
  if(k==='hw'||/하드웨어|H\/W|장비|서버|방화벽|SSL|DISK|스토리지|네트웍/.test(t+' '+st))return'hw';
  return'lic';
}
function dcRowsFromQuote(q){
  const out=[];(q.sections||[]).forEach(s=>effRows(s.rows).forEach(r=>{const std=rStd(r);if(!std)return;
    out.push({cat:dcCat(s,r),group:r.esub||r.ecat||'',item:r.item||r.spec.split('\n')[0]||'',price:num(r.price),qty:num(r.qty),unit:r.unit||'',std,amt:rAmt(r),promoRate:''})}));
  return out;
}
const dcPromo=r=>{const disc=Math.max(0,num(r.std)-num(r.amt));return Math.min(disc,Math.round(num(r.std)*num(r.promoRate)/100))};
const dcAdd=r=>Math.max(0,num(r.std)-num(r.amt)-dcPromo(r));
function dcSum(rows){const t={std:0,amt:0,promo:0,add:0};rows.forEach(r=>{t.std+=num(r.std);t.amt+=num(r.amt);t.promo+=dcPromo(r);t.add+=dcAdd(r)});return t}
const rate=(a,b)=>b?pct(a/b):'0%';
function dcBlue(d){const b=d.blue||{};const rows=d.rows.filter(r=>r.cat==='blue');const s=dcSum(rows);
  const target=num(b.target);const std=rows.length?s.std:Math.round(target*num(b.rate||15)/100);
  const promo=rows.length?s.promo:num(b.promo),add=rows.length?s.add:num(b.add);const amt=rows.length?s.amt:Math.max(0,std-promo-add);
  const monthly=Math.round(amt/12);return{target,std,promo,add,amt,monthly,free:monthly*num(b.freeMonths)}}
function quoteDiscount(q){const t=qTot(q);return{std:t.std,amt:t.amt,disc:t.std-t.amt,rate:t.std?1-t.amt/t.std:0}}
function dcTitle(type){return type==='cloud'?'Amaranth 10 Cloud 할인 기안서':'Amaranth 10 구축형 할인 기안서'}
function newDiscount(q,c){
  const now=new Date(Date.now()+9*3600e3).toISOString().slice(0,16).replace('T',' ');
  const type=c&&['cloud','csap'].includes(c.type)?'cloud':/Cloud/i.test(q?q.docTitle||'':'')?'cloud':'onprem';
  const cust=c?(c.dzFirst?c.partyB:c.partyA):{name:q?q.customer:'',bizNo:'',addr:''};
  const d={type,title:dcTitle(type),status:'작성중',quoteId:q?q.id:'',contractId:c?c.id:'',docNo:'',writtenAt:now,dept:'AX영업Unit',drafter:q?String(q.quoteOwner||'').replace(/\s*\(.*\)\s*/,''):'',
    recvRef:'',executor:'',execDate:'',subject:`할인기안 - ${q?q.customer:''} ${q?q.quoteName:''}`.trim(),channel:'direct',lines:clone(DC_LINES.direct),
    customer:{name:cust.name||'',bizNo:cust.bizNo||'',addr:cust.addr||''},promoName:'',promoRate:'',rows:q?dcRowsFromQuote(q):[],
    blue:{target:'',rate:'15',promo:'',add:'',freeMonths:''},reasons:'- \n- \n- ',
    others:{name:'',rows:[],reasons:''}};
  return d;
}
const dcNeedsAI=d=>d.rows.some(r=>r.cat==='ai'&&num(r.std)>num(r.amt));

/* ----- 인쇄 블록 ----- */
const DCW=[66,156,62,38,74,68,40,68,40,102];
function dcBlocks(d){
  const B=[];const dz=d.drafter.split(/\s+/);const rank=dz.length>1?dz[0]:'',nm=dz.length>1?dz.slice(1).join(' '):d.drafter;
  B.push({html:`<h1>${esc(d.title)}</h1><div class="hd"><table class="b kv">
    <tr><td class="k">품 의 번 호</td><td>${esc(d.docNo)}</td></tr><tr><td class="k">작 성 일 자</td><td>${esc(d.writtenAt)}</td></tr>
    <tr><td class="k">기 안 부 서</td><td>${esc(d.dept)}</td></tr><tr><td class="k">기 안 자</td><td>${esc(d.drafter)}</td></tr></table>
    <table class="b ap"><colgroup><col style="width:28px"><col><col><col><col></colgroup>
    <tr><td class="vl" rowspan="3">결재</td><td>${esc(rank)}</td><td></td><td></td><td></td></tr><tr><td class="tall">1</td><td class="tall"></td><td class="tall"></td><td class="tall"></td></tr><tr><td>${esc(nm)}</td><td></td><td></td><td></td></tr>
    <tr><td class="vl" rowspan="2">합의</td><td class="tall"></td><td class="tall"></td><td class="tall"></td><td class="tall"></td></tr><tr><td></td><td></td><td></td><td></td></tr></table></div>
    <table class="b rows1" style="border-top:none">${[['수신및참조',d.recvRef],['시 행 자',d.executor],['시 행 일 자',d.execDate],['제　　목',d.subject]].map(([k,v])=>`<tr><td class="k" style="border-top:none">${k}</td><td style="border-top:none">${esc(v)}</td></tr>`).join('')}</table>`});
  B.push({html:`<table class="b lines">${[['■ 결재라인 :',d.lines.approve],['■ 합의라인 :',d.lines.agree],['■ 수신참조 :',d.lines.ref]].map(([k,v])=>`<tr><td class="k">${k}</td><td>${esc(v)}</td></tr>`).join('')}</table>
    ${dcNeedsAI(d)?'<div class="flag">ONE AI 할인이 포함되어 있습니다. 합의라인 3·4번(ONE AI 할인 및 특이 계약 시)을 포함하세요.</div>':''}`});
  B.push({html:`<div class="sec">■ 고객사 정보</div><table class="b"><colgroup><col style="width:84px"><col><col style="width:84px"><col style="width:200px"></colgroup>
    <tr><th>상호</th><td>${esc(d.customer.name)}</td><th>사업자번호</th><td>${esc(d.customer.bizNo)}</td></tr><tr><th>주소</th><td colspan="3">${esc(d.customer.addr)}</td></tr></table>`});
  const lump=dcSum(d.rows.filter(r=>DC_LUMP.includes(r.cat)));const rec=dcSum(d.rows.filter(r=>['ai','use'].includes(r.cat)));
  const sh=`<tr><th rowspan="3">구분</th><th rowspan="3">표준 금액</th><th colspan="4">할인 내역</th><th rowspan="3">계약금액</th></tr><tr><th colspan="2">프로모션 할인</th><th colspan="2">추가 할인</th></tr><tr><th>금액</th><th>할인율</th><th>금액</th><th>할인율</th></tr>`;
  const sr=(lab,t)=>`<tr><td>${lab}</td><td class="num">${fmt(t.std)}</td><td class="num">${fmt(t.promo)}</td><td class="c">${rate(t.promo,t.std)}</td><td class="num">${fmt(t.add)}</td><td class="c">${rate(t.add,t.std)}</td><td class="num">${fmt(t.amt)}</td></tr>`;
  B.push({html:`<div class="sec">■ 라이선스 할인 내역 - 일시납(VAT별도)</div><table class="b"><colgroup><col style="width:190px"><col><col><col style="width:50px"><col><col style="width:50px"><col></colgroup>${sh}
    ${sr('라이선스 + 교육비 + 커스터마이징 및<br>API연동 + 하드웨어 + 외부옵션',lump)}${rec.std?sr('ONE AI · 사용료 (연납/월납)',rec):''}
    <tr class="promo"><td class="c" style="font-weight:700">할인 프로모션 명</td><td colspan="6">${esc(d.promoName)}</td></tr></table>
    <div class="fn">* 프로모션 할인 금액 : 프로모션 적용으로 할인된 금액<br>* 추가 할인 : 프로모션 할인 금액 외 추가 할인 요청 금액</div>`});
  const bl=dcBlue(d);
  if(bl.std||bl.target){
    B.push({html:`<div class="sec">■ 블루멤버십 할인 내역 - 연납(VAT별도)</div><table class="b"><colgroup><col style="width:110px"><col><col><col><col style="width:50px"><col><col style="width:50px"><col></colgroup>
     <tr><th rowspan="3">구분</th><th rowspan="3">블루멤버십<br>대상 금액</th><th rowspan="3">표준 금액의<br>${esc(d.blue.rate||15)}%</th><th colspan="4">할인 내역</th><th rowspan="3">계약금액</th></tr><tr><th colspan="2">프로모션 할인</th><th colspan="2">추가 할인</th></tr><tr><th>금액</th><th>할인율</th><th>금액</th><th>할인율</th></tr>
     <tr><td class="c">블루멤버십</td><td class="num">${bl.target?fmt(bl.target):''}</td><td class="num">${fmt(bl.std)}</td><td class="num">${fmt(bl.promo)}</td><td class="c">${rate(bl.promo,bl.std)}</td><td class="num">${fmt(bl.add)}</td><td class="c">${rate(bl.add,bl.std)}</td><td class="num">${fmt(bl.amt)}</td></tr>
     <tr><th colspan="2">추가 무상 블루멤버십 제공 비용</th><th colspan="2">월납 적용 금액<br>(블루멤버십 합계 / 12개월)</th><th colspan="2">추가 무상 제공 개월 수</th><th colspan="2">추가 무상 제공 금액</th></tr>
     <tr><td colspan="2"></td><td colspan="2" class="num">${fmt(bl.monthly)}</td><td colspan="2" class="c">${esc(d.blue.freeMonths||'-')}</td><td colspan="2" class="num">${fmt(bl.free)}</td></tr></table>
     <div class="fn">* 블루멤버십 대상 금액 (라이선스) : 기본(구축비, 양식 제작 비용, SSL인증서 제외), 옵션, API 표준 금액의 합계<br>* 블루멤버십 대상 금액 (고정 유지보수 금액 라이선스) : 전용 백업 라이선스 + 스팸솔루션 유저라이선스 + APT(메일보안) 유저라이선스<br>* 블루멤버십 대상 금액 (하드웨어) : 전용방화벽 + 메일보안 엔진 + 메일아카이빙엔진 제안금액 기준<br>* 블루멤버십 대상 금액 (커스터마이징) : 제안금액 기준</div>`});
  }
  B.push({html:`<div class="sec">■ 할인 내역 상세 (VAT별도)</div>`,keep:true});
  const head=`<tr><th rowspan="3">구분</th><th rowspan="3">모듈명</th><th rowspan="3">단가</th><th rowspan="3">수량</th><th rowspan="3">표준금액</th><th colspan="4">할인</th><th rowspan="3">계약 금액</th></tr><tr><th colspan="2">프로모션 할인</th><th colspan="2">추가 할인</th></tr><tr><th>금액</th><th>할인율</th><th>금액</th><th>할인율</th></tr>`;
  DC_CATS.forEach(([k,lab,pay])=>{
    const rows=d.rows.filter(r=>r.cat===k);if(!rows.length)return;
    const title=`<div class="cat">${esc(lab)}${pay?` - <span class="pt">${esc(pay)}</span>`:''}</div>`;
    const cont=`<table class="b">${cg(DCW)}<tr><td colspan="10" style="border:none;color:#666">${esc(lab)} (계속)</td></tr>${head}</table>`;
    B.push({html:title+`<table class="b">${cg(DCW)}${head}</table>`,keep:true});
    rows.forEach((r,i)=>{const p=rows[i-1],n=rows[i+1];const first=!p||p.group!==r.group,last=!n||n.group!==r.group;
      B.push({head:cont,html:`<table class="b" style="margin-top:-1px">${cg(DCW)}<tr><td class="g ${last?'':'nob'} ${first?'':'cont'}">${first?esc(r.group):''}</td><td>${esc(r.item)}</td><td class="num">${num(r.price)?fmt(r.price):''}</td><td class="c">${num(r.qty)?fmt(r.qty)+' '+esc(r.unit):''}</td><td class="num">${fmt(r.std)}</td><td class="num">${fmt(dcPromo(r))}</td><td class="c">${rate(dcPromo(r),r.std)}</td><td class="num">${fmt(dcAdd(r))}</td><td class="c">${rate(dcAdd(r),r.std)}</td><td class="num">${fmt(r.amt)}</td></tr></table>`})});
    const t=dcSum(rows);
    B.push({head:cont,html:`<table class="b" style="margin-top:-1px">${cg(DCW)}<tr class="tot"><td colspan="4" class="c">${esc(lab.replace(/^\d+\.\s*/,''))} 합 계</td><td class="num">${fmt(t.std)}</td><td class="num">${fmt(t.promo)}</td><td class="c">${rate(t.promo,t.std)}</td><td class="num">${fmt(t.add)}</td><td class="c">${rate(t.add,t.std)}</td><td class="num">${fmt(t.amt)}</td></tr></table>`});
  });
  const all=dcSum(d.rows);
  B.push({html:`<table class="b" style="margin-top:8px">${cg(DCW)}<tr class="sum"><td colspan="4" class="c">전체 합계</td><td class="num">${fmt(all.std)}</td><td class="num">${fmt(all.promo)}</td><td class="c">${rate(all.promo,all.std)}</td><td class="num">${fmt(all.add)}</td><td class="c">${rate(all.add,all.std)}</td><td class="num">${fmt(all.amt)}</td></tr></table>`});
  const rl=String(d.reasons||'').split('\n');
  B.push({html:`<div class="sec">■ 할인 신청 사유</div><table class="b reason">${(rl.length?rl:['-']).map(l=>`<tr><td>${esc(l)||'&nbsp;'}</td></tr>`).join('')}</table>`});
  const o=d.others||{};
  if((o.rows||[]).length){
    const os=o.rows.reduce((a,r)=>{a.std+=num(r.std);a.promo+=num(r.promo);a.add+=num(r.add);return a},{std:0,promo:0,add:0});os.amt=os.std-os.promo-os.add;
    B.push({html:`<div class="sec">■ 기타솔루션 할인 (VAT별도)</div><table class="b"><tr><th style="text-align:left">솔루션 명 : ${esc(o.name)}</th><th>표준금액</th><th>프로모션 할인</th><th>추가 할인</th><th>계약금액</th></tr>
      <tr><td class="c">계약금액</td><td class="num">${fmt(os.std)}</td><td class="num">${fmt(os.promo)}</td><td class="num">${fmt(os.add)}</td><td class="num">${fmt(os.amt)}</td></tr></table>
      <div class="sec">■ 기타솔루션 할인 상세 (VAT별도)</div><table class="b"><tr><th>솔루션명</th><th>모듈</th><th>사용자수</th><th>유저/식</th><th>표준가</th><th>프로모션 금액</th><th>할인율</th><th>추가 금액</th><th>할인율</th><th>계약금액</th></tr>
      ${o.rows.map(r=>`<tr><td>${esc(r.solution)}</td><td>${esc(r.module)}</td><td class="c">${esc(r.users)}</td><td class="c">${esc(r.unit)}</td><td class="num">${fmt(num(r.std))}</td><td class="num">${fmt(num(r.promo))}</td><td class="c">${rate(num(r.promo),num(r.std))}</td><td class="num">${fmt(num(r.add))}</td><td class="c">${rate(num(r.add),num(r.std))}</td><td class="num">${fmt(num(r.std)-num(r.promo)-num(r.add))}</td></tr>`).join('')}
      <tr class="tot"><td colspan="4" class="c">합계</td><td class="num">${fmt(os.std)}</td><td class="num">${fmt(os.promo)}</td><td class="c">${rate(os.promo,os.std)}</td><td class="num">${fmt(os.add)}</td><td class="c">${rate(os.add,os.std)}</td><td class="num">${fmt(os.amt)}</td></tr></table>
      ${o.reasons?`<div class="sec">■ 기타솔루션 할인 신청 사유</div><table class="b reason">${o.reasons.split('\n').map(l=>`<tr><td>${esc(l)||'&nbsp;'}</td></tr>`).join('')}</table>`:''}`});
  }
  B.push({html:`<div class="meta"><div>문서유형 : 일반문서</div><div>보안등급 : 선택없음</div><div>긴급도 : 보통</div><div>보존연한 : 영구보존</div></div>`});
  return B;
}
const DFOOT=`<div class="pfoot"><span>${'DOUZONE'}</span><span>__PN__ / __PT__</span></div>`;
async function discountPages(d){return finalize((await paginate(dcBlocks(d),'tpl-dc',CONTENT_H)).map(p=>`<div class="page tpl-dc">${p.map(h=>`<div class="blk">${h}</div>`).join('')}${DFOOT}</div>`))}

/* ----- 진행 현황 ----- */
const byQuote=(m,qid)=>[...m.values()].filter(x=>x.quoteId===qid).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''))[0];
function flowOf(q){const d=quoteDiscount(q);const c=byQuote(S.contracts,q.id);const dc=byQuote(S.discounts,q.id);
  const need=d.disc>0;return{c,dc,need,disc:d,dcState:!need?'불필요':dc?dc.status:'필요'}}
function flowChips(q){const f=flowOf(q);const ch=[];
  ch.push(`<span class="chip ${['작성중'].includes(q.status)?'':'ok'}">${q.status==='작성중'?'견적 작성중':'견적 '+esc(q.status)}</span>`);
  ch.push(f.c?`<span class="chip ${f.c.status==='체결완료'?'ok':'on'}">계약 ${esc(f.c.status)}</span>`:`<span class="chip">계약 전</span>`);
  if(f.need)ch.push(`<span class="chip ${f.dcState==='승인'?'ok':f.dcState==='필요'||f.dcState==='반려'?'warn':'on'}">할인기안 ${esc(f.dcState)}</span>`);
  return ch.join('')}

/* ----- 목록 ----- */
function dcFiltered(){const term=$('#d-search').value.trim().toLowerCase(),st=$('#d-status').value;
  return[...S.discounts.values()].filter(d=>(!st||d.status===st)&&(!term||[d.customer&&d.customer.name,d.subject].join(' ').toLowerCase().includes(term))).sort((a,b)=>(b.writtenAt||'').localeCompare(a.writtenAt||''))}
function renderDcDash(){
  const list=dcFiltered();const pend=[...S.quotes.values()].filter(q=>{const f=flowOf(q);return f.need&&f.dcState==='필요'&&q.status!=='작성중'&&q.status!=='실주'});
  const tot=list.reduce((a,d)=>{const s=dcSum(d.rows||[]);a.std+=s.std;a.disc+=s.promo+s.add;return a},{std:0,disc:0});
  const k=[['할인기안',list.length+'건',`상신 ${list.filter(d=>d.status==='상신').length} · 승인 ${list.filter(d=>d.status==='승인').length} · 반려 ${list.filter(d=>d.status==='반려').length}`],
    ['작성 필요',pend.length+'건','할인이 있는 제출 견적 중 기안 없음'],['할인 금액 합계',won(tot.disc)+'원','프로모션 + 추가 할인'],['평균 할인율',tot.std?pct(tot.disc/tot.std):'–','표준금액 대비']];
  $('#dkpis').innerHTML=k.map(([l,v,h])=>`<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="h">${h}</div></div>`).join('');
  $('#dpend').innerHTML=pend.length?`<div class="panel" style="margin-bottom:14px"><h2>할인기안 작성이 필요한 견적</h2><div class="tbl-wrap"><table class="list"><tbody>${pend.map(q=>{const f=flowOf(q);return`<tr><td><div class="cust">${esc(q.customer)}</div><div class="qn">${esc(q.quoteNo)}</div></td><td class="n">할인 ${fmt(f.disc.disc)}원 (${pct(f.disc.rate)})</td><td>${flowChips(q)}</td><td style="text-align:right"><button class="btn pri" data-mkdc="${esc(q.id)}">할인기안 작성</button></td></tr>`}).join('')}</tbody></table></div></div>`:'';
  $('#dlist').innerHTML=list.length?list.map(d=>{const s=dcSum(d.rows||[]);const q=S.quotes.get(d.quoteId);return`<tr class="row" data-id="${esc(d.id)}" tabindex="0"><td>${esc((d.writtenAt||'').slice(0,10))}</td><td><div class="cust">${esc(d.customer&&d.customer.name||'(고객사 미입력)')}</div><div class="qn">${esc(d.subject)}</div></td>
    <td><span class="pill dc-${esc(d.status)}">${esc(d.status)}</span></td><td class="qn">${q?esc(q.quoteNo):'—'}</td><td class="n">${fmt(s.std)}</td><td class="n">${fmt(s.promo)}</td><td class="n">${fmt(s.add)}</td><td class="n">${s.std?pct((s.promo+s.add)/s.std):'–'}</td><td class="n">${fmt(s.amt)}</td></tr>`}).join('')
    :`<tr><td colspan="9"><div class="empty">아직 할인기안이 없습니다. 할인이 있는 견적에서 ‘할인기안 작성’을 누르세요.</div></td></tr>`;
  const sel=$('#d-newq');const cur=sel.value;sel.innerHTML=[...S.quotes.values()].filter(q=>quoteDiscount(q).disc>0).map(q=>`<option value="${esc(q.id)}"${q.id===cur?' selected':''}>${esc(q.customer)} · ${esc(q.quoteNo)} · 할인 ${pct(quoteDiscount(q).rate)}</option>`).join('')||'<option value="">할인이 있는 견적이 없습니다</option>';
}
$('#d-status').innerHTML+=DC_STATUS.map(s=>`<option>${s}</option>`).join('');
['#d-search','#d-status'].forEach(s=>$(s).addEventListener('input',renderDcDash));
$('#dlist').addEventListener('click',e=>{const tr=e.target.closest('tr.row');if(tr)openDiscount(tr.dataset.id)});
$('#dlist').addEventListener('keydown',e=>{if(e.key==='Enter'){const tr=e.target.closest('tr.row');if(tr)openDiscount(tr.dataset.id)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-mkdc]');if(b)startDiscount(b.dataset.mkdc)});
$('#d-new').onclick=()=>{const id=$('#d-newq').value;if(id)startDiscount(id)};
function startDiscount(qid){if((S.view==='cedit'&&S.cdirty)||(S.view==='edit'&&S.dirty)){toast('먼저 저장하세요');return}const ex=byQuote(S.discounts,qid);if(ex){openDiscount(ex.id);toast('이 견적의 할인기안이 이미 있어 열었습니다');return}
  const q=S.quotes.get(qid);if(!q)return;const d=newDiscount(q,byQuote(S.contracts,qid));d.id=uid().replace(/^q/,'d');openDEditor(d,true)}

/* ----- 편집 ----- */
const CAT_OPTS=DC_CATS.map(([k,l])=>[k,l.replace(/^\d+\.\s*/,'')]);
function renderDForm(){
  const d=S.ddraft;const q=S.quotes.get(d.quoteId);const c=d.contractId&&S.contracts.get(d.contractId);const all=dcSum(d.rows);const bl=dcBlue(d);
  const qd=q?quoteDiscount(q):null;const mismatch=q&&Math.abs(qd.amt-all.amt)>0;
  $('#dc-form').innerHTML=`
  ${mismatch?`<div class="banner-msg" style="border-color:var(--s-nego)">연결 견적의 금액이 바뀌었습니다 (견적 ${fmt(qd.amt)}원 / 기안 ${fmt(all.amt)}원). <button class="ib" data-dact="reload">견적 내용 다시 반영</button></div>`:''}
  <div class="card"><h3>기안 정보</h3><div class="fgrid">
   ${fld('양식','type',d.type,{type:'sel',opts:[['onprem','Amaranth 10 구축형 할인 기안서'],['cloud','Amaranth 10 Cloud 할인 기안서']]})}
   ${fld('진행 상태','status',d.status,{type:'sel',opts:DC_STATUS.map(s=>[s,s])})}
   ${fld('품의번호','docNo',d.docNo,{ph:'상신 후 입력'})}${fld('작성일자','writtenAt',d.writtenAt)}${fld('기안부서','dept',d.dept)}${fld('기안자 (직급 이름)','drafter',d.drafter)}
   ${fld('수신및참조','recvRef',d.recvRef)}${fld('시행자','executor',d.executor)}${fld('시행일자','execDate',d.execDate)}${fld('제목','subject',d.subject,{wide:true})}
  </div><p class="hint" style="margin:8px 0 0">연결: ${q?`견적 ${esc(q.customer)} · ${esc(q.quoteNo)}`:'견적 없음'}${c?` · 계약서 ${esc(c.status)}`:' · 계약서 없음'} ${q?'<button class="ib" data-dact="openq">견적 열기</button>':''} ${c?'<button class="ib" data-dact="openc">계약서 열기</button>':''}</p></div>
  <div class="card"><h3>결재 · 합의 · 수신참조</h3><div class="fgrid">
   ${fld('영업 채널','channel',d.channel,{type:'sel',opts:[['direct','직판 (Unit장-센터장-부문장)'],['bp','BP 채널 (해당 BP - Channel영업센터)']]})}
   ${fld('결재라인','lines.approve',d.lines.approve,{type:'ta',wide:true,rows:2})}${fld('합의라인','lines.agree',d.lines.agree,{type:'ta',wide:true,rows:2})}${fld('수신참조','lines.ref',d.lines.ref,{type:'ta',wide:true,rows:2})}</div>
   ${dcNeedsAI(d)?'<p class="hint" style="color:var(--s-lost);margin:8px 0 0">ONE AI 할인이 있어 합의라인 3·4번(ONE AI 할인 및 특이 계약 시)이 필요합니다.</p>':''}</div>
  <div class="card"><h3>고객사 정보</h3><div class="fgrid">${fld('상호','customer.name',d.customer.name)}${fld('사업자번호','customer.bizNo',d.customer.bizNo)}${fld('주소','customer.addr',d.customer.addr,{wide:true})}</div></div>
  <div class="card"><h3>프로모션</h3><div class="fgrid">${fld('할인 프로모션 명','promoName',d.promoName)}${fld('프로모션 할인율 %','promoRate',d.promoRate,{type:'n'})}</div>
   <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="ib" data-dact="applyPromo">모든 행에 프로모션 할인율 적용</button><span class="hint">각 행의 할인 중 프로모션 할인율만큼은 ‘프로모션 할인’, 나머지는 ‘추가 할인’으로 나뉩니다.</span></div></div>
  <div class="card"><h3>할인 내역 상세</h3><p class="hint" style="margin:-4px 0 8px">견적의 행이 자동으로 분류되어 들어옵니다. 분류가 다르면 ‘구분’을 바꾸세요. 표준금액과 계약금액은 견적 값입니다.</p>
   ${rowsEd('rows',[['cat','구분',120,'sel',CAT_OPTS],['group','그룹',110],['item','모듈명',170],['price','단가',100,'n'],['qty','수량',60,'n'],['unit','단위',54],['std','표준금액',110,'n'],['amt','계약금액',110,'n'],['promoRate','프로모션 %',80,'n']],{h:'프로모션 / 추가 할인',f:r=>`${fmt(dcPromo(r))} / ${fmt(dcAdd(r))}`},S.ddraft)}
   <p class="hint" style="margin:8px 0 0" id="dc-total">표준 ${fmt(all.std)} · 프로모션 ${fmt(all.promo)} · 추가 ${fmt(all.add)} · 계약 <b>${fmt(all.amt)}</b> (할인율 ${all.std?pct((all.std-all.amt)/all.std):'0%'})</p></div>
  <div class="card"><h3>블루멤버십 (연납)</h3><p class="hint" style="margin:-4px 0 8px">${d.rows.some(r=>r.cat==='blue')?'견적의 블루멤버십 행 합계를 씁니다. 대상 금액만 입력하세요.':'견적에 블루멤버십 항목이 없으면 대상 금액 × 요율로 계산합니다. 해당 없으면 비워 두세요.'}</p>
   <div class="fgrid">${fld('블루멤버십 대상 금액','blue.target',d.blue.target,{type:'n'})}${fld('요율 %','blue.rate',d.blue.rate,{type:'n'})}${fld('프로모션 할인 금액','blue.promo',d.blue.promo,{type:'n'})}${fld('추가 할인 금액','blue.add',d.blue.add,{type:'n'})}${fld('추가 무상 제공 개월 수','blue.freeMonths',d.blue.freeMonths,{type:'n'})}</div>
   <p class="hint" style="margin:8px 0 0" id="dc-blue">표준 ${fmt(bl.std)} · 계약 ${fmt(bl.amt)} · 월납 적용 ${fmt(bl.monthly)} · 추가 무상 ${fmt(bl.free)}</p></div>
  <div class="card"><h3>할인 신청 사유</h3>${fld('한 줄에 한 항목','reasons',d.reasons,{type:'ta',wide:true,rows:5})}</div>
  <div class="card"><h3>기타솔루션 할인 (선택)</h3><div class="fgrid">${fld('솔루션 명','others.name',d.others.name)}</div><div style="height:8px"></div>
   ${rowsEd('others.rows',[['solution','솔루션명',120],['module','모듈',120],['users','사용자수',70],['unit','유저/식',60],['std','표준가',110,'n'],['promo','프로모션 금액',110,'n'],['add','추가 금액',110,'n']],null,S.ddraft)}
   <div class="fgrid" style="margin-top:8px">${fld('기타솔루션 할인 신청 사유','others.reasons',d.others.reasons,{type:'ta',wide:true,rows:3})}</div></div>`;
  $('#dc-title').textContent=(d.customer.name||'새 할인기안')+' · 할인기안';
}
function setDDirty(v){S.ddirty=v;$('#ddirty').hidden=!v}
let dPrevT,dSeq=0;function scheduleDPreview(){clearTimeout(dPrevT);dPrevT=setTimeout(renderDPreview,300)}
async function renderDPreview(){if(!S.ddraft)return;const seq=++dSeq;const pages=await discountPages(S.ddraft);if(seq!==dSeq||!S.ddraft)return;showPages(pages,$('#dprev'));$('#dprev-info').textContent=`A4 미리보기 · ${pages.length}쪽`}
function refreshDCalc(){const d=S.ddraft;document.querySelectorAll('#dc-form [data-calc]').forEach(td=>{const r=getP(d,td.dataset.calc);if(r)td.textContent=`${fmt(dcPromo(r))} / ${fmt(dcAdd(r))}`});
  const a=dcSum(d.rows),bl=dcBlue(d);const t=$('#dc-total');if(t)t.innerHTML=`표준 ${fmt(a.std)} · 프로모션 ${fmt(a.promo)} · 추가 ${fmt(a.add)} · 계약 <b>${fmt(a.amt)}</b> (할인율 ${a.std?pct((a.std-a.amt)/a.std):'0%'})`;
  const b=$('#dc-blue');if(b)b.textContent=`표준 ${fmt(bl.std)} · 계약 ${fmt(bl.amt)} · 월납 적용 ${fmt(bl.monthly)} · 추가 무상 ${fmt(bl.free)}`}
$('#dc-form').addEventListener('input',e=>{const el=e.target;const p=el.dataset.p;if(!p)return;const d=S.ddraft;
  setP(d,p,el.type==='checkbox'?el.checked:el.value);
  if(p==='channel'){d.lines=clone(DC_LINES[d.channel]);renderDForm()}
  if(p==='type'){d.title=dcTitle(d.type)}
  if(/\.cat$/.test(p))renderDForm();
  refreshDCalc();setDDirty(true);scheduleDPreview()});
$('#dc-form').addEventListener('click',e=>{const b=e.target.closest('[data-cact],[data-dact]');if(!b)return;const d=S.ddraft;
  if(b.dataset.cact){const arr=getP(d,b.dataset.p);const i=+b.dataset.i;const act=b.dataset.cact;
    if(act==='add')arr.push(b.dataset.p==='rows'?{cat:'lic',group:'',item:'',price:'',qty:'',unit:'식',std:'',amt:'',promoRate:''}:{solution:'',module:'',users:'',unit:'',std:'',promo:'',add:''});
    else if(act==='del')arr.splice(i,1);else{const j=i+(act==='up'?-1:1);if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]]}}
  else{const act=b.dataset.dact;
    if(act==='applyPromo'){d.rows.forEach(r=>r.promoRate=d.promoRate)}
    else if(act==='reload'){const q=S.quotes.get(d.quoteId);if(!q)return;const old=new Map(d.rows.map(r=>[r.cat+'|'+r.item,r.promoRate]));d.rows=dcRowsFromQuote(q);d.rows.forEach(r=>{const v=old.get(r.cat+'|'+r.item);if(v!=null)r.promoRate=v});toast('견적 내용을 다시 반영했습니다')}
    else if(act==='openq'){if(S.ddirty){toast('먼저 할인기안을 저장하세요');return}openQuote(d.quoteId);return}
    else if(act==='openc'){if(S.ddirty){toast('먼저 할인기안을 저장하세요');return}openContract(d.contractId);return}}
  const sy=window.scrollY;renderDForm();window.scrollTo(0,sy);setDDirty(true);scheduleDPreview()});
function openDEditor(d,isNew){S.ddraft=clone(d);S.did=d.id;S.disNew=isNew;setDDirty(!!isNew);resetDArm();renderDForm();show('dedit');renderDPreview()}
function openDiscount(id){const d=S.discounts.get(id);if(d)openDEditor(d,false)}
function resetDArm(){const x=$('#ddel');x.classList.remove('armed');x.textContent='삭제';delete x.dataset.armed;const b=$('#dback');b.textContent='← 목록';delete b.dataset.armed}
$('#dback').onclick=()=>{const b=$('#dback');if(S.ddirty&&!b.dataset.armed){b.dataset.armed='1';b.textContent='저장 안 하고 나가기';setTimeout(()=>{if(b.dataset.armed){delete b.dataset.armed;b.textContent='← 목록'}},3500);return}S.ddraft=null;setDDirty(false);show('dash');setTab('d')};
async function saveDiscount(){const d=S.ddraft;d.updatedAt=new Date(Date.now()+9*3600e3).toISOString().slice(0,19);
  if(!d.contractId){const c=byQuote(S.contracts,d.quoteId);if(c)d.contractId=c.id}
  if(!S.db){S.discounts.set(d.id,clone(d));setDDirty(false);S.disNew=false;toast('이 화면에서만 저장했습니다 (공유 저장소 연결 안 됨)');return}
  $('#dsave').disabled=true;
  try{await S.db.collection('discounts').doc(d.id).set(clone(d));S.discounts.set(d.id,clone(d));setDDirty(false);S.disNew=false;toast('저장했습니다')}
  catch(err){toast(err&&err.code==='invalid_argument'?'저장 권한이 없습니다. 편집 권한(Contributor 이상)이 필요합니다.':'저장하지 못했습니다')}
  finally{$('#dsave').disabled=false}}
$('#dsave').onclick=saveDiscount;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&S.view==='dedit'){e.preventDefault();saveDiscount()}});
$('#ddel').onclick=async()=>{const x=$('#ddel');if(!x.dataset.armed){x.dataset.armed='1';x.classList.add('armed');x.textContent='삭제 확인';setTimeout(()=>{if(x.dataset.armed)resetDArm()},3500);return}
  const id=S.did;resetDArm();if(!S.disNew){try{if(S.db)await S.db.collection('discounts').doc(id).delete();S.discounts.delete(id)}catch(_){toast('삭제하지 못했습니다');return}}
  setDDirty(false);S.ddraft=null;show('dash');setTab('d');toast('삭제했습니다')};
const dBase=()=>{const d=S.ddraft;return safeName(`${d.customer.name||'고객사'}_할인기안_${(d.writtenAt||'').slice(0,10)}`)};
$('#dexp-pdf').onclick=async()=>{const b=$('#dexp-pdf');b.disabled=true;b.textContent='PDF 만드는 중…';try{await exportPdf(await discountPages(S.ddraft),dBase())}finally{b.disabled=false;b.textContent='PDF 저장'}};
$('#dexp-html').onclick=async()=>exportHtml(await discountPages(S.ddraft),dBase());
$('#mk-dc').onclick=async()=>{if(S.dirty||S.isNew){await save();if(S.dirty)return}const q=S.quotes.get(S.id);if(!q)return;
  if(quoteDiscount(q).disc<=0){toast('할인이 없는 견적입니다. 할인기안이 필요하지 않습니다.');return}
  if(q.status==='작성중'){toast('견적을 먼저 ‘제출’ 상태로 바꾼 뒤 할인기안을 작성하세요');return}
  S.draft=null;startDiscount(q.id)};
