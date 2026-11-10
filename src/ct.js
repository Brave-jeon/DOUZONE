
/* ================= 계약서 ================= */
const CT_STATUS=['작성중','검토중','발송','체결완료','보류'];
const DZ={name:'회사01',addr:'비공개',bizNo:'비공개',ceo:'담당자01, 담당자02'};
const AMT_KEYS=[['','직접 입력'],['lic','라이선스(일시납)'],['edu','교육비'],['yr','연납 사용료'],['mon','월납 사용료'],['ai','ONE AI'],['hw','하드웨어'],['ext','외부옵션'],['total','견적 전체']];
const P_CLOUD='오픈확인서 내 월사용료 과금 개시일 시점부터 1년(별도 서면 요청 없을 시 1년 단위 자동 갱신)';
const PAYNOTE_STD='1) 교육비 : 교육 시행일과 교육횟수는 교육확인서를 기준으로 한다.\n    ※ 교육비 세금계산서 발행 조건 : 매월 말일 해당월에 교육한 횟수 금액에 대해 세금계산서 발행\n2) 서비스 개시 시 : ONE AI 사용료의 과금 시작 시점이며, 오픈확인서를 통해 변경 가능\n3) 설치 시 : 웹한글기안기 설치 완료 시';
const PR=(label,kind,desc,key,timing,ratio,terms)=>({label,kind,desc,key,amount:'',timing,ratio:String(ratio),terms});
const T7='계산서 발행 후 7일 이내 납부',N10='청구 후 익월 10일 이내 납부';
const CT_TYPES={
 csap:{name:'Amaranth 10 Cloud CSAP 공급계약(공공)',title:'Amaranth 10 Cloud CSAP 공급 계약서',coverTitle:'Amaranth 10 Cloud\nCSAP 공급 계약서',contractName:'Amaranth 10 Cloud CSAP 공급 계약',
  items:['ERP모듈','ERP옵션모듈','UC모듈','UC및공통옵션모듈','교육비','유저 사용료','SSL','마이그레이션','노무관리','외부 옵션(웹한글기안기)'],
  amounts:[['라이선스','lic','1회납'],['교육비','edu','분납'],['연사용료','yr','계약기간 내 1회납'],['월사용료','mon','계약기간 내 12회납'],['외부옵션','ext','']],
  conds:[['계약기간',P_CLOUD],['설치장소','더존클라우드센터'],['교육시작','']],
  clause:'아래 고객사와 공급사는 위 계약 조건, [별첨 1] 가격확약서, [별첨 2] 결제방식, [별첨 3] 개통 및 교육 일정, [별첨 4] 서비스 이용약관, [별첨 5] 개인정보처리방침, [별첨 6] 서비스수준협약서(SLA)를 계약 내용으로 하여 상호 신의에 입각하여 이 계약을 체결하고, 그 증거로 이 계약서를 2부 작성하여 쌍방이 기명 날인한 후 각각 1부씩 보관한다.',
  atts:['가격확약서','결제방식','개통 및 교육 일정','서비스 이용약관','개인정보처리방침','서비스수준협약서(SLA)'],labels:['고객사','공급사'],dzFirst:false,
  coverLines:'서비스 제공자 : 회사01\n서비스 이용자 : {거래처}\n계 약 체 결 일 : {계약일}',
  payTitle:'Amaranth 10 Cloud CSAP 결제방식',pay:[PR('라 이 선 스','일시납','모듈 및 옵션','lic','계약 시',100,T7),PR('교 육 비¹⁾','분납','교육비','edu','월말',100,T7),PR('연 사 용 료','연납','SSL인증서,\n연말정산 유저 사용료','yr','연납',100,N10),PR('월 사 용 료','월납','유저 사용료, 원챔버,\n노무관리','mon','매월',100,N10),PR('외 부 옵 션','일시납','웹한글기안기','ext','설치 시²⁾',100,T7)],
  payNotes:'1) 교육비 : 교육 시행일과 교육횟수는 교육확인서를 기준으로 한다.\n    ※ 교육비 세금계산서 발행 조건 : 매월 말일 해당월에 교육한 횟수 금액에 대해 세금계산서 발행\n2) 설치 시 : 웹한글기안기 설치 완료 시',payTotal:false,
  schTitle:'Amaranth 10 Cloud CSAP 개통 및 교육 일정',schSec:'개통 및 교육 일정',schHeads:['분류','','기간'],sch:[['개통','','계약 후 1주일 내 개통 및 개통 확인서 날인'],['교육','1~3 회차','개통 후 2주일 내 1회차 교육 시행'],['','마지막 회차','전(3회차) 교육 후 1주일 내 교육 시행\n(오픈확인서)']],schNotes:''},
 cloud:{name:'Amaranth 10 Cloud 공급계약',title:'Amaranth 10 Cloud 공급 계약서',coverTitle:'Amaranth 10 Cloud 공급 계약서',contractName:'Amaranth 10 Cloud 공급 계약',
  items:['ERP모듈','ERP옵션모듈','UC모듈','UC및공통옵션모듈','교육비','유저 사용료','ONE AI','SSL','팩스/문자','노무관리','마이그레이션','API 연동','외부 옵션(웹한글기안기)'],
  amounts:[['라이선스','lic','1회납'],['교육비','edu','분납'],['연사용료','yr','계약기간 내 1회납'],['월사용료','mon','계약기간 내 12회납'],['ONE AI 사용료(연/월납)','ai','연납 : 계약 기간내 1회납\n월납 : 계약기간 내 12회납'],['외부옵션','ext','']],
  conds:[['계약기간',P_CLOUD],['설치장소','더존클라우드센터'],['교육시작','']],
  clause:'아래 고객사와 공급사는 위 계약 조건, [별첨 1] 가격확약서, [별첨 2] 결제방식, [별첨 3] 개통 및 교육 일정, [별첨 4] 서비스 이용약관, [별첨 5] 개인정보처리방침을 계약 내용으로 하여 상호 신의에 입각하여 이 계약을 체결하고, 그 증거로 이 계약서를 2부 작성하여 쌍방이 기명 날인한 후 각각 1부씩 보관한다.',
  atts:['가격확약서','결제방식','개통 및 교육 일정','서비스 이용약관','개인정보처리방침'],labels:['고객사','공급사'],dzFirst:false,
  coverLines:'서비스 제공자 : 회사01\n서비스 이용자 : {거래처}\n계 약 체 결 일 : {계약일}',
  payTitle:'Amaranth 10 Cloud 결제방식',pay:[PR('라 이 선 스','일시납','모듈 및 옵션','lic','계약 시',100,T7),PR('교 육 비¹⁾','분납','교육비','edu','월말',100,T7),PR('연 사 용 료','연납','SSL인증서,\n연말정산 유저 사용료','yr','연납',100,N10),PR('월 사 용 료','월납','유저 사용료, 원챔버,\n팩스/문자, 노무관리','mon','매월',100,N10),PR('ONE AI 사용료','연납','ONE AI 사용료','ai','서비스\n개시 시²⁾',100,N10),PR('외 부 옵 션','일시납','웹한글기안기','ext','설치 시³⁾',100,T7)],
  payNotes:PAYNOTE_STD,payTotal:false,
  schTitle:'Amaranth 10 Cloud 개통 및 교육 일정',schSec:'개통 및 교육 일정',schHeads:['분류','','기간'],sch:[['개통','','계약 후 1주일 내 개통 및 개통 확인서 날인'],['교육','1~7 회차','개통 후 2주일 내 1회차 교육 시행'],['','마지막 회차','전(7회차) 교육 후 1주일 내 교육 시행\n(오픈확인서)']],schNotes:''},
 onprem:{name:'Amaranth 10 구축형 공급계약',title:'Amaranth 10 공급 계약서',coverTitle:'Amaranth 10 공급 계약서',contractName:'Amaranth 10 공급 계약',
  items:['ERP모듈','ERP옵션모듈','UC모듈','UC및공통옵션모듈','교육비','유저라이선스','ONE AI','SSL','팩스/문자','노무관리','마이그레이션','API 연동','외부 옵션(웹한글기안기)','서버','NAS','기타','Red Hat','재설치및업데이트'],
  amounts:[['라이선스','lic','1회납'],['교육비','edu','분납'],['하드웨어','hw','1회납'],['ONE AI 사용료(연납)','ai','연납 : 계약 기간내 1회납\n월납 : 계약기간 내 12회납'],['외부옵션','ext','1회납']],
  conds:[['설치장소','고객사와 협의된 장소'],['교육시작',''],['블루멤버십 체결(유상)','유상 블루멤버십 개시일로부터 1년 간(별도 서면 요청 없을 시 1년 단위 자동 갱신)']],
  clause:'아래 고객사와 공급사는 위 계약 조건, [별첨 1] 가격확약서, [별첨 2] 결제방식, [별첨 3] 설치 및 교육 일정, [별첨 4] 서비스 공급약관, [별첨 5] 개인정보처리방침을 계약 내용으로 하여 상호 신의에 입각하여 이 계약을 체결하고, 그 증거로 이 계약서를 2부 작성하여 쌍방이 기명 날인한 후 각각 1부씩 보관한다.',
  atts:['가격확약서','결제방식','설치 및 교육 일정','서비스 공급약관','개인정보처리방침'],labels:['고객사','공급사'],dzFirst:false,
  coverLines:'서비스 제공자 : 회사01\n서비스 이용자 : {거래처}\n계 약 체 결 일 : {계약일}',
  payTitle:'Amaranth 10 결제방식',pay:[PR('라 이 선 스','일시납','모듈 및 옵션, 유저,\n연동 라이선스 외','lic','계약 시',100,T7),PR('교 육 비¹⁾','분납','교육비','edu','월말',100,T7),PR('하 드 웨 어','일시납','H/W, 스팸솔루션 외','hw','인도 시',100,T7),PR('ONE AI 사용료','연납','ONE AI 사용료','ai','서비스\n개시 시²⁾',100,N10),PR('외 부 옵 션','일시납','웹한글기안기','ext','설치 시³⁾',100,T7)],
  payNotes:PAYNOTE_STD,payTotal:false,
  schTitle:'Amaranth 10 설치 및 교육 일정',schSec:'설치 및 교육 일정',schHeads:['서버 설치 기준','자사 서버 구매시','자사 서버 미구매시\n(고객사 자체서버 활용시)'],sch:[['설치','계약 후 2주일 내 설치 및\n설치 확인서 날인','계약 후 1개월 내 설치 및\n설치 확인서 날인'],['1~19 회차','설치 후 2주일 내 1회차 교육 시행',''],['마지막 회차','전(19회차) 교육 이후 1주일 내 교육 시행\n(오픈확인서)','']],schNotes:'1) 자사 서버 구매시 : 표준적인 H/W 스펙에 대한 납품 기준이며, 납품처 재고에 따라 일정이 지연될 수 있습니다.'},
 dogup:{name:'공급(도급) 계약 · 갑/을',title:'공급 계약서',coverTitle:'사업 도급계약서',contractName:'',items:[],
  amounts:[['계약금액','total','']],
  conds:[['계약보증금','총 계약금액의 20%'],['지체상금','지체일수당 총 계약금액의 1,000분의 3'],['계약기간',''],['납기일','계약 종료일로부터 10일 전'],['납품장소','갑이 지정한 장소'],['하자보증기간','검수완료 익일로부터 12개월'],['하자보증금','총 계약금액의 10%']],
  clause:'"갑"과 "을"은 도급계약 개별거래조건 및 일반거래조건과 첨부서류에 근거하여 본 계약을 체결하고 신의에 따라 성실하게 계약상 의무를 이행할 것을 확약하며, 이를 증명하기 위하여 계약서 2부를 작성하여 기명날인 한 후 각 1통씩 보관한다.',
  atts:['가격제안서','결제조건','도급계약 일반거래조건','개인정보처리위탁 계약서'],labels:['갑','을'],dzFirst:true,
  coverLines:'',coverName:'회사01',
  payTitle:'결제조건',pay:[PR('라 이 선 스 외','선금','라이선스 외','total','계약 후',30,T7),PR('','잔금','라이선스 외','total','완료 후',70,T7)],payNotes:'',payTotal:true,
  schTitle:'',schSec:'',schHeads:['','',''],sch:[],schNotes:''},
 onepe:{name:'ONE AI Private Edition 공급계약',title:'ONE AI Private Edition 공급 계약서',coverTitle:'ONE AI Private Edition 계약서',contractName:'ONE AI Private Edition 계약',
  items:['ONE AI PE 라이선스','ONE AI PE 인건비','ONE AI PE 개발비','GPU H/W'],
  amounts:[['라이선스','total','']],
  conds:[['설치장소','고객사와 협의된 장소'],['구축시작',''],['블루멤버십 체결(무상)','별도 협의 후 진행'],['블루멤버십 체결(유상)','유상 블루멤버십 개시일로부터 1년 간(별도 서면 요청 없을 시 자동 갱신)']],
  clause:'아래 고객사와 공급사는 위 계약 조건, [별첨 1] ONE AI Private Edition 가격확약서, [별첨 2] ONE AI Private Edition 결제방식, [별첨 3] ONE AI Private Edition 서비스 공급약관, [별첨 4] ONE AI Private Edition용 개인정보처리방침을 계약 내용으로 하여 상호 신의에 입각하여 이 계약을 체결하고, 그 증거로 이 계약서를 2부 작성하여 쌍방이 기명 날인한 후 각각 1부씩 보관한다.',
  atts:['ONE AI Private Edition 가격확약서','ONE AI Private Edition 결제방식','ONE AI Private Edition 서비스 공급약관','ONE AI Private Edition용 개인정보처리방침'],labels:['고객사','공급사'],dzFirst:false,
  coverLines:'서비스 제공자 : 회사01\n서비스 구매자 : {거래처}\n계 약 체 결 일 : {계약일}',
  payTitle:'ONE AI Private Edition 결제방식',pay:[PR('라 이 선 스 외','선금','라이선스 외','total','계약 후',30,T7),PR('','잔금','라이선스 외','total','납품 후',70,T7)],payNotes:'',payTotal:true,
  schTitle:'',schSec:'',schHeads:['','',''],sch:[],schNotes:''}
};
function catKey(s){const t=[s.title,s.sumLabel,s.billLabel].join(' ');if(/ONE ?AI/i.test(t))return'ai';if(/교육/.test(t))return'edu';if(/외부|기안기/.test(t))return'ext';if(s.payType==='일시납'&&/하드웨어|H\/W|장비|서버/.test(t))return'hw';if(s.payType==='월납')return'mon';if(s.payType==='연납')return'yr';return'lic'}
function quoteKeySums(q){const m={total:0};(q.sections||[]).forEach(s=>{const a=secTot(s).amt;const k=catKey(s);m[k]=(m[k]||0)+a;m.total+=a});return m}
const ITEM_RX={'ERP모듈':/회계관리|인사 ?관리|급여|ERP|기본엔진|리걸테크|예산 ?관리/,'ERP옵션모듈':/금융 ?서비스|자동 ?전표|그룹 ?재무|모바일자금|근태|자산 ?관리/,'UC모듈':/UC|그룹웨어/,'교육비':/교육/,'유저 사용료':/유저/,'유저라이선스':/유저/,'ONE AI':/ONE ?AI/i,'SSL':/SSL/,'팩스/문자':/팩스/,'노무관리':/노무/,'마이그레이션':/마이그레이션/,'API 연동':/API/,'외부 옵션(웹한글기안기)':/기안기/,'서버':/서버/,'Red Hat':/RHEL|Red ?Hat/i};
function autoItems(c,q){const txt=[];(q.sections||[]).forEach(s=>effRows(s.rows).forEach(r=>{if(hasQty(r)&&!r.free&&rAmt(r)>0)txt.push([s.title,r.ecat,r.esub,r.item].join(' '))}));const all=txt.join('\n');c.items.forEach(it=>{const rx=ITEM_RX[it.label];if(rx)it.on=rx.test(all)})}
function applyQuote(c,q){
  const sums=quoteKeySums(q);c.amounts.forEach(a=>{if(a.key)a.amount=sums[a.key]||0});
  autoItems(c,q);c.vat=q.vat||'별도';
  const cust=c.dzFirst?c.partyB:c.partyA;if(!cust.name)cust.name=q.customer||'';
  if(!c.counterparty)c.counterparty=q.customer||'';
}
function newContract(type,q){
  const T=CT_TYPES[type];const d=today();
  const cust={name:q?q.customer||'':'',addr:'',bizNo:'',ceo:''};const dz=Object.assign({},DZ);
  const c={type,status:'작성중',quoteId:q?q.id:'',title:T.title,cover:true,coverTag:type==='dogup'?'':'패키지',coverName:T.coverName||'',coverTitle:T.coverTitle,coverSub:'',coverLines:T.coverLines,
    contractName:T.contractName||(q?q.quoteName:''),contractDate:d,counterparty:q?q.customer||'':'',vat:q?q.vat||'별도':'별도',
    items:T.items.map(l=>({label:l,on:false})),amounts:T.amounts.map(([label,key,note])=>({label,key,amount:'',note})),
    conds:T.conds.map(([label,value])=>({label,value})),special:'',clause:T.clause,attachments:T.atts.map(l=>({label:l,agreed:false})),
    labels:T.labels.slice(),dzFirst:T.dzFirst,partyA:T.dzFirst?dz:cust,partyB:T.dzFirst?cust:dz,
    includeQuote:!!q,quoteTitle:q?String(q.docTitle||'').replace('가격제안서','가격확약서'):'',
    payment:{title:T.payTitle,rows:clone(T.pay),notes:T.payNotes,showTotal:T.payTotal},
    schedule:{title:T.schTitle,sec:T.schSec,heads:T.schHeads.slice(),rows:T.sch.map(([c1,c2,c3])=>({c1,c2,c3})),notes:T.schNotes},
    appendPdfs:[]};
  if(type==='dogup'){c.coverName=DZ.name;c.coverTitle=(q?q.customer+' ':'')+'사업 도급계약서'}
  if(q)applyQuote(c,q);
  [...S.terms.values()].filter(t=>(t.types||[]).includes(type)).forEach(t=>c.appendPdfs.push({id:t.id,name:t.name}));
  return c;
}
const amountOf=(c,key)=>(c.amounts||[]).filter(a=>a.key===key).reduce((s,a)=>s+num(a.amount),0);
const payAmt=(c,r)=>r.key?Math.round(amountOf(c,r.key)*num(r.ratio===''?100:r.ratio)/100):num(r.amount);
const ctTotal=c=>(c.amounts||[]).reduce((s,a)=>s+num(a.amount),0);
const titleHtml=t=>esc(t).replace(/(Amaranth )10/,'$1<span class="ten">10</span>');
const CHEAD=`<div class="chead"><span class="dzlogo">DOUZONE</span><span>강촌캠퍼스 비공개 / 더존을지타워 서울특별시 중구 을지로 29</span><span class="url">www.douzone.com</span></div>`;
const CFOOT=`<div class="cpfoot">__PN__/__PT__</div>`;
const fillTok=(s,c)=>String(s||'').replace(/\{거래처\}/g,c.counterparty||'').replace(/\{계약일\}/g,kDate(c.contractDate).replace(/<[^>]+>/g,''));
function ctCover(c){
  return`<div class="page tpl-ct"><div class="ccover"><div class="mp">Maximizing<br>Potential</div>
   <div class="cn">${esc(c.coverName||c.counterparty)}</div><div class="ctt" style="white-space:pre-line">${titleHtml(c.coverTitle)}</div>${c.coverTag?`<div class="copt"><i class="cbx"></i>${esc(c.coverTag)}</div>`:''}${c.coverSub?`<div class="csub">${esc(c.coverSub)}</div>`:''}
   <div class="lines">${esc(fillTok(c.coverLines,c))}</div><div class="dot"></div><div class="arc"></div>
   <div class="logo"><div class="dzlogo">DOUZONE</div><div class="u">www.douzone.com</div></div></div>${CFOOT}</div>`;
}
function amtRow(a,c){const n=num(a.amount);return`<div class="amtg"><span>일금</span><span class="w">${n?krw(n)+'원':'-원'}</span><span>정</span><span>(₩ ${n?fmt(n):'-'})</span><span>(V.A.T ${c.vat==='포함'?'포함':'별도'})</span><span class="pn">${esc(a.note)}</span></div>`}
function partyTbl(lab,p,isDz){return`<div><div class="pl">${esc(lab)}</div><table>${[['상　　호',p.name],['주　　소',p.addr],['사업자 번호',p.bizNo]].map(([k,v])=>`<tr><td class="k">${k}</td><td class="v" colspan="2">${esc(v)}</td></tr>`).join('')}<tr><td class="k">대표이사</td><td class="v">${esc(p.ceo)}</td><td class="in">(인)</td></tr></table></div>`}
function ctMainBlocks(c){
  const B=[];
  B.push({html:`<div class="ct-title">${titleHtml(c.title)}</div><div class="ct-sec">개별 계약 조건</div>`,keep:true});
  let rows=`<tr class="first"><td class="k">계 약 명</td><td class="v" style="white-space:pre-line">${esc(c.contractName)}</td></tr>`;
  if((c.items||[]).length)rows+=`<tr><td class="k">계약물품</td><td class="v" style="padding:0 5px"><div class="items">${c.items.map(it=>`<span><i class="cbx ${it.on?'on':''}"></i>${esc(it.label)}</span>`).join('')}</div></td></tr>`;
  rows+=`<tr class="gap"><td class="k"></td><td class="v"></td></tr>`;
  rows+=(c.amounts||[]).map(a=>`<tr><td class="k">${esc(a.label)}</td><td class="v">${amtRow(a,c)}</td></tr>`).join('');
  rows+=(c.conds||[]).map(x=>`<tr><td class="k">${esc(x.label)}</td><td class="v" style="white-space:pre-line">${esc(x.value)}</td></tr>`).join('');
  B.push({html:`<table class="ctab">${rows}</table>`});
  if(c.special)B.push({html:`<div class="ct-special">${esc(c.special)}</div>`});
  B.push({html:`<div class="ct-clause">${esc(c.clause)}</div>`,keep:true});
  if((c.attachments||[]).length)B.push({html:`<div class="ct-att"><table><colgroup><col style="width:150px"><col><col style="width:90px"><col style="width:22px"><col style="width:40px"></colgroup>${c.attachments.map((a,i)=>`<tr><td>${i?'':'※ 별첨'}</td><td>${i+1}. ${esc(a.label)}</td><td>※ 동의 여부</td><td><i class="cbx ${a.agreed?'on':''}"></i></td><td>확인</td></tr>`).join('')}</table></div>`});
  const pa=partyTbl(c.labels[0],c.partyA),pb=partyTbl(c.labels[1],c.partyB);
  B.push({html:`<div class="ct-date">${kDate(c.contractDate)}</div><div class="ct-parties">${pa}${pb}</div>`});
  return B;
}
function ctAttBlocks(c,start){
  const B=[];const P=c.payment||{};const atn=rx=>{const i=(c.attachments||[]).findIndex(a=>rx.test(a.label));return i>=0?i+1:0};const payNo=atn(/결제/)||start,schNo=atn(/일정/)||payNo+1;
  if((P.rows||[]).length){
    const tot=P.rows.reduce((s,r)=>s+payAmt(c,r),0);
    B.push({html:`<div class="att-label">[별첨 ${payNo}]</div><div class="ct-title">${titleHtml(P.title)}</div>
     <div class="ct-rowhead"><span class="ct-sec">결제방식</span><span class="unit">단위 : 원(VAT ${c.vat==='포함'?'포함':'별도'})</span></div>
     <table class="paytab"><colgroup><col style="width:126px"><col style="width:52px"><col style="width:150px"><col style="width:96px"><col style="width:84px"><col style="width:44px"><col></colgroup>
     <tr><th class="blank"></th><th colspan="2">구분</th><th style="text-align:right">금액</th><th>세금계산서<br>교부시기</th><th>비율</th><th>결제조건</th></tr>
     ${P.rows.map(r=>`<tr><td class="lab">${esc(r.label)}</td><td>${esc(r.kind)}</td><td>${esc(r.desc)}</td><td class="num">${fmt(payAmt(c,r))}</td><td class="c">${esc(r.timing)}</td><td class="c">${esc(r.ratio)}${r.ratio!==''?'%':''}</td><td>${esc(r.terms)}</td></tr>`).join('')}
     ${P.showTotal?`<tr class="tt"><td class="lab"></td><td>합계</td><td></td><td class="num">${fmt(tot)}</td><td></td><td></td><td></td></tr>`:''}</table>
     ${P.notes?`<div class="notes">${esc(P.notes)}</div>`:''}`});
  }
  const Sc=c.schedule||{};
  if((Sc.rows||[]).length){
    if(B.length)B.push({brk:true});
    const W=[140,287,287];
    const hcells=[];Sc.heads.forEach((h,i)=>{if(i>0&&!h&&hcells.length){hcells[hcells.length-1].span++}else hcells.push({t:h,span:1})});
    const rs=Sc.rows;
    const body=rs.map((r,ri)=>{const cells=[];[r.c1,r.c2,r.c3].forEach((t,i)=>{if(i>0&&!t&&cells.length){cells[cells.length-1].span++}else cells.push({t,span:1,i})});
      const nx=rs[ri+1];const contNext=nx&&!nx.c1;
      return'<tr>'+cells.map(x=>`<td colspan="${x.span}" class="${x.i===0&&!x.t&&ri>0?'cont':''} ${x.i===0&&contNext?'nob':''}">${esc(x.t)}</td>`).join('')+'</tr>'}).join('');
    B.push({html:`<div class="att-label">[별첨 ${schNo}]</div><div class="ct-title">${titleHtml(Sc.title)}</div>
     <div class="ct-rowhead"><span class="ct-sec">${esc(Sc.sec||'일정')}</span><span></span></div>
     <table class="schtab">${cg(W)}<tr>${hcells.map(h=>`<th colspan="${h.span}">${esc(h.t)}</th>`).join('')}</tr>${body}</table>${Sc.notes?`<div class="notes" style="margin-left:0">${esc(Sc.notes)}</div>`:''}`});
  }
  return{blocks:B};
}
const TERM_RX={'약관':/약관/,'개인정보':/개인정보/,'SLA':/SLA|수준/};
function termAttNo(c,t){const rx=TERM_RX[t.kind||'약관'];if(!rx)return 0;const i=(c.attachments||[]).findIndex(a=>rx.test(a.label));return i>=0?i+1:0}
function termCover(c,t){const no=termAttNo(c,t);const v=t.variant||'';
  return`<div class="page tpl-ct"><div class="ccover">${no?`<div class="tlab">[별첨 ${no}]</div>`:''}<div class="mp">Maximizing<br>Potential</div>
   <div class="ctt tct">${titleHtml(t.coverTitle||t.name)}</div>
   ${v?['패키지','커스터마이징'].map(x=>`<div class="copt"><i class="cbx ${x===v?'on':''}"></i>${x}</div>`).join(''):''}
   <div class="lines" style="margin-top:70px">서비스 제공자 : 회사01\n서비스 이용자 : ${esc(c.counterparty)}</div><div class="dot"></div><div class="arc"></div>
   <div class="logo"><div class="dzlogo">DOUZONE</div><div class="u">www.douzone.com</div></div></div>${CFOOT}</div>`}
async function contractPages(c,mode){const forPreview=mode===true||mode==='preview';
  const out=[];
  if(c.cover)out.push(ctCover(c));
  const wrap=p=>`<div class="page tpl-ct">${CHEAD}${p.map(h=>`<div class="blk">${h}</div>`).join('')}${CFOOT}</div>`;
  (await paginate(ctMainBlocks(c),'tpl-ct',CT_H)).forEach(p=>out.push(wrap(p)));
  let n=1;const q=c.quoteId&&S.quotes.get(c.quoteId);
  if(c.includeQuote&&q){(await quotePages(q,{cover:false,label:`[별첨 ${n}]`,title:c.quoteTitle||q.docTitle})).forEach(p=>out.push(p.replace('__PT__','__PT__')));n++}
  else if(c.includeQuote&&forPreview){out.push(wrap([`<div class="att-label">[별첨 1]</div><div class="ph">연결된 견적서를 찾을 수 없습니다.<br>왼쪽 ‘연결 견적’에서 견적을 선택하세요.</div>`]));n++}
  else if(c.includeQuote)n++;
  const att=ctAttBlocks(c,2);
  if(att.blocks.length)(await paginate(att.blocks,'tpl-ct',CT_H)).forEach(p=>out.push(wrap(p)));
  (c.appendPdfs||[]).forEach(a=>{const t=Object.assign({kind:'약관',skipFirst:true},a,S.terms.get(a.id)||{});
    if(mode==='html')return;
    if(t.skipFirst)out.push(termCover(c,t));
    if(forPreview)out.push(wrap([`<div class="ph"><b>${esc(t.name)}</b><br>PDF 저장 시 업로드된 원본 PDF${t.skipFirst?'의 2쪽부터':''}가 이 위치에 그대로 붙습니다.<br>(미리보기와 인쇄용 HTML에는 표시되지 않습니다)</div>`]));
    else out.push({pdf:a.id,name:t.name,skipFirst:!!t.skipFirst});});
  return finalize(out);
}

/* ---------- 계약 목록 ---------- */
function ctFiltered(){
  const term=$('#c-search').value.trim().toLowerCase(),st=$('#c-status').value,tp=$('#c-type').value;
  return[...S.contracts.values()].filter(c=>(!st||c.status===st)&&(!tp||c.type===tp)&&(!term||[c.counterparty,c.contractName,c.title].join(' ').toLowerCase().includes(term)))
   .sort((a,b)=>(b.contractDate||'').localeCompare(a.contractDate||'')||(b.updatedAt||'').localeCompare(a.updatedAt||''));
}
function renderCtDash(){
  const list=ctFiltered();const sum=a=>a.reduce((s,c)=>s+ctTotal(c),0);
  const done=list.filter(c=>c.status==='체결완료'),open=list.filter(c=>!['체결완료','보류'].includes(c.status));
  const linkedQ=new Set([...S.contracts.values()].map(c=>c.quoteId).filter(Boolean));
  const k=[['계약 건수',list.length+'건',`진행 중 ${open.length}건`],['체결 완료 금액',won(sum(done))+'원',`${done.length}건 · 계약 조건 금액 합계`],['진행 중 금액',won(sum(open))+'원','작성중 · 검토중 · 발송'],['견적 → 계약 전환',S.quotes.size?Math.round([...S.quotes.keys()].filter(id=>linkedQ.has(id)).length/S.quotes.size*100)+'%':'–',`계약서가 연결된 견적 ${[...S.quotes.keys()].filter(id=>linkedQ.has(id)).length}건 / ${S.quotes.size}건`]];
  $('#ckpis').innerHTML=k.map(([l,v,h])=>`<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="h">${h}</div></div>`).join('');
  $('#clist').innerHTML=list.length?list.map(c=>{const q=c.quoteId&&S.quotes.get(c.quoteId);return`<tr class="row" data-id="${esc(c.id)}" tabindex="0">
   <td>${esc(c.contractDate)}</td><td><div class="cust">${esc(c.counterparty||'(거래처 미입력)')}</div><div class="qn">${esc(c.contractName)}</div></td>
   <td><span class="tpl-tag">${esc((CT_TYPES[c.type]||{}).name||c.type)}</span></td><td><span class="pill ct-${esc(c.status)}">${esc(c.status)}</span></td>
   <td class="qn">${q?esc(q.quoteNo):'—'}</td><td class="n">${fmt(ctTotal(c))}</td><td class="qn">${(c.appendPdfs||[]).length?`약관 ${c.appendPdfs.length}건`:'—'}</td>
   <td class="qn">${c.updatedAt?esc(c.updatedAt.slice(0,16).replace('T',' ')):''}</td></tr>`}).join('')
   :`<tr><td colspan="8"><div class="empty">${S.contracts.size?'조건에 맞는 계약서가 없습니다.':'아직 계약서가 없습니다. 견적서 편집 화면의 ‘계약서 만들기’ 또는 위의 ‘새 계약서’로 시작하세요.'}</div></td></tr>`;
  const sel=$('#c-newq');const cur=sel.value;
  sel.innerHTML='<option value="">견적 없이 시작</option>'+[...S.quotes.values()].sort((a,b)=>(b.quoteDate||'').localeCompare(a.quoteDate||'')).map(q=>`<option value="${esc(q.id)}"${q.id===cur?' selected':''}>${esc(q.customer)} · ${esc(q.quoteNo)}</option>`).join('');
}
$('#c-status').innerHTML+=CT_STATUS.map(s=>`<option>${s}</option>`).join('');
$('#c-type').innerHTML+=Object.entries(CT_TYPES).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join('');
$('#c-newtype').innerHTML=Object.entries(CT_TYPES).map(([k,v])=>`<option value="${k}">${esc(v.name)}</option>`).join('');
['#c-search','#c-status','#c-type'].forEach(s=>$(s).addEventListener('input',renderCtDash));
$('#clist').addEventListener('click',e=>{const tr=e.target.closest('tr.row');if(tr)openContract(tr.dataset.id)});
$('#clist').addEventListener('keydown',e=>{if(e.key==='Enter'){const tr=e.target.closest('tr.row');if(tr)openContract(tr.dataset.id)}});
$('#c-new').onclick=()=>{const q=S.quotes.get($('#c-newq').value)||null;openNewContract($('#c-newtype').value,q)};
document.querySelectorAll('.seg .btn').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function setTab(t){S.tab=t;document.querySelectorAll('.seg .btn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===t)));$('#tab-q').hidden=t!=='q';$('#tab-c').hidden=t!=='c';$('#tab-d').hidden=t!=='d';if(t==='c')renderCtDash();else if(t==='d')renderDcDash();else renderDash()}

/* ---------- 계약 편집 ---------- */
const getP=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function setP(o,p,v){const ks=p.split('.');const last=ks.pop();const t=ks.reduce((a,k)=>a[k],o);t[last]=v}
const ROW_TPL={amounts:{label:'',key:'',amount:'',note:''},conds:{label:'',value:''},attachments:{label:'',agreed:false},'payment.rows':{label:'',kind:'',desc:'',key:'',amount:'',timing:'',ratio:'100',terms:''},'schedule.rows':{c1:'',c2:'',c3:''}};
function inp(p,v,o){o=o||{};const a=`data-p="${p}" aria-label="${esc(o.label||p)}"`;
  if(o.type==='sel')return`<select ${a}>${o.opts.map(([val,t])=>`<option value="${esc(val)}"${String(val)===String(v??'')?' selected':''}>${esc(t)}</option>`).join('')}</select>`;
  if(o.type==='chk')return`<input type="checkbox" ${a}${v?' checked':''}>`;
  if(o.type==='ta')return`<textarea rows="${o.rows||2}" ${a}>${esc(v)}</textarea>`;
  return`<input ${o.type==='n'?'type="number" step="any"':o.type==='date'?'type="date"':''} ${a} value="${esc(v)}"${o.ph?` placeholder="${esc(o.ph)}"`:''}>`}
function fld(label,p,v,o){o=o||{};return`<label class="fld${o.wide?' wide':''}${o.type==='chk'?' chk':''}">${o.type==='chk'?inp(p,v,Object.assign({label},o))+`<span>${label}</span>`:`<span>${label}</span>${inp(p,v,Object.assign({label},o))}`}</label>`}
function rowsEd(path,cols,extra,root){
  const rows=getP(root||S.cdraft,path)||[];
  return`<div class="rows-wrap"><table class="rows" style="min-width:${cols.reduce((s,c)=>s+c[2],0)+130}px"><thead><tr>${cols.map(c=>`<th style="width:${c[2]}px">${c[1]}</th>`).join('')}${extra?'<th style="text-align:right">'+extra.h+'</th>':''}<th></th></tr></thead><tbody>
  ${rows.map((r,i)=>`<tr>${cols.map(([k,l,w,t,opts])=>`<td>${inp(`${path}.${i}.${k}`,r[k],{type:t,opts,label:l})}</td>`).join('')}${extra?`<td class="amt" data-calc="${path}.${i}">${extra.f(r)}</td>`:''}
   <td class="act"><button class="ib" data-cact="up" data-p="${path}" data-i="${i}" title="위로">↑</button> <button class="ib" data-cact="down" data-p="${path}" data-i="${i}" title="아래로">↓</button> <button class="ib" data-cact="del" data-p="${path}" data-i="${i}" title="삭제">✕</button></td></tr>`).join('')}
  </tbody></table></div><div><button class="ib" data-cact="add" data-p="${path}">+ 행 추가</button></div>`;
}
function renderCForm(){
  const c=S.cdraft;const T=CT_TYPES[c.type]||{};const q=c.quoteId&&S.quotes.get(c.quoteId);
  const qOpts=[['','(연결 안 함)']].concat([...S.quotes.values()].map(x=>[x.id,`${x.customer} · ${x.quoteNo}`]));
  const party=(k,lab)=>`<div class="card"><h3>${esc(c.labels[k==='partyA'?0:1])} (${lab})</h3><div class="fgrid">${fld('구분 표기',`labels.${k==='partyA'?0:1}`,c.labels[k==='partyA'?0:1])}${fld('상호',k+'.name',c[k].name)}${fld('주소',k+'.addr',c[k].addr)}${fld('사업자 번호',k+'.bizNo',c[k].bizNo)}${fld('대표이사',k+'.ceo',c[k].ceo)}</div></div>`;
  const termRows=[...S.terms.values()].sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const sel=new Set((c.appendPdfs||[]).map(a=>a.id));
  const qdc=q&&quoteDiscount(q);const fl=q&&flowOf(q);
  $('#ct-form').innerHTML=`${qdc&&qdc.disc>0?`<div class="banner-msg" style="border-color:${fl.dcState==='승인'?'var(--s-won)':'var(--s-nego)'}">연결 견적에 할인 <b>${fmt(qdc.disc)}원 (${pct(qdc.rate)})</b>이 있어 할인기안이 필요합니다. 현재: <b>${esc(fl.dcState)}</b> <button class="ib" data-mkdc="${esc(q.id)}">${fl.dc?'할인기안 열기':'할인기안 작성'}</button></div>`:''}
  <div class="card"><h3>기본 정보</h3><div class="fgrid">
    ${fld('계약서 종류','type',c.type,{type:'sel',opts:Object.entries(CT_TYPES).map(([k,v])=>[k,v.name])})}
    ${fld('진행 상태','status',c.status,{type:'sel',opts:CT_STATUS.map(s=>[s,s])})}
    ${fld('연결 견적','quoteId',c.quoteId,{type:'sel',opts:qOpts})}
    ${fld('거래처(목록·표지 표시)','counterparty',c.counterparty)}
    ${fld('계약체결일','contractDate',c.contractDate,{type:'date'})}
    ${fld('부가세','vat',c.vat,{type:'sel',opts:[['별도','별도'],['포함','포함']]})}
    ${fld('문서 제목','title',c.title)}
    ${fld('계약명','contractName',c.contractName,{type:'ta',wide:true,rows:2})}
  </div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
    <button class="ib" data-cact="reapply"${q?'':' disabled'}>견적 금액·물품 다시 반영</button>
    <button class="ib" data-cact="retype">선택한 종류의 기본 문구로 다시 채우기</button>
    ${q?`<button class="ib" data-cact="openq">연결 견적 열기</button>`:''}</div>
  <p class="hint" style="margin:8px 0 0">${q?`연결 견적: ${esc(q.customer)} · ${esc(q.quoteNo)} · 초기도입 ${fmt(qTot(q).init)}원`:'견적을 연결하면 계약 금액과 [별첨 1] 가격확약서가 자동으로 채워집니다.'}</p></div>
  <div class="card"><h3>표지</h3><div class="fgrid">${fld('표지 포함','cover',c.cover,{type:'chk'})}${fld('표지 상단 회사명','coverName',c.coverName,{ph:'비우면 거래처'})}${fld('표지 제목','coverTitle',c.coverTitle)}${fld('부제 (사업명 등)','coverSub',c.coverSub)}${fld('표지 하단 문구 — {거래처}, {계약일} 자동 치환','coverLines',c.coverLines,{type:'ta',wide:true,rows:3})}</div></div>
  ${(c.items||[]).length||T.items&&T.items.length?`<div class="card"><h3>계약 물품</h3><div class="chk-grid">${(c.items||[]).map((it,i)=>`<label class="fld chk">${inp(`items.${i}.on`,it.on,{type:'chk',label:it.label})}<span>${esc(it.label)}</span></label>`).join('')}</div>
    <details class="opts"><summary>물품 목록 편집</summary><label class="fld wide"><span>한 줄에 하나씩</span><textarea data-p="__items" rows="5">${esc((c.items||[]).map(i=>i.label).join('\n'))}</textarea></label></details></div>`:''}
  <div class="card"><h3>계약 금액</h3><p class="hint" style="margin:-4px 0 8px">‘견적 연결’ 항목은 ‘견적 금액 다시 반영’을 누를 때 견적의 해당 섹션 합계로 채워집니다. 금액은 직접 고쳐도 됩니다.</p>
    ${rowsEd('amounts',[['label','항목',150],['amount','금액',130,'n'],['key','견적 연결',130,'sel',AMT_KEYS],['note','납부 표기',220,'ta']],{h:'한글 금액',f:a=>num(a.amount)?krw(num(a.amount))+'원':'-'})}
    <p class="hint" style="margin:8px 0 0">계약 금액 합계 <b id="ct-total">${fmt(ctTotal(c))}</b>원</p></div>
  <div class="card"><h3>계약 조건</h3>${rowsEd('conds',[['label','항목',150],['value','내용',460,'ta']])}</div>
  <div class="card"><h3>본문</h3><div class="fgrid">${fld('특약 문구 (계약 조건 아래, 선택)','special',c.special,{type:'ta',wide:true,rows:3})}${fld('계약 체결 문구','clause',c.clause,{type:'ta',wide:true,rows:4})}</div></div>
  <div class="card"><h3>별첨 목록</h3>${rowsEd('attachments',[['label','별첨 이름',360],['agreed','동의 확인',80,'chk']])}</div>
  ${party('partyA',c.dzFirst?'공급사':'고객사')}${party('partyB',c.dzFirst?'거래 상대':'공급사')}
  <div class="card"><h3>[별첨 1] 가격확약서</h3><div class="fgrid">${fld('연결 견적을 별첨으로 포함','includeQuote',c.includeQuote,{type:'chk'})}${fld('별첨 문서 제목','quoteTitle',c.quoteTitle)}</div></div>
  <div class="card"><h3>결제방식 별첨</h3><div class="fgrid">${fld('제목','payment.title',c.payment.title)}${fld('합계 행 표시','payment.showTotal',c.payment.showTotal,{type:'chk'})}</div><div style="height:8px"></div>
    ${rowsEd('payment.rows',[['label','항목',110],['kind','구분',70],['desc','내용',150,'ta'],['key','금액 연결',120,'sel',AMT_KEYS],['ratio','비율 %',64,'n'],['amount','금액(직접)',110,'n'],['timing','계산서 교부시기',100,'ta'],['terms','결제조건',170,'ta']],{h:'금액',f:r=>fmt(payAmt(S.cdraft,r))})}
    <div class="fgrid" style="margin-top:8px">${fld('주석','payment.notes',c.payment.notes,{type:'ta',wide:true,rows:4})}</div></div>
  <div class="card"><h3>일정 별첨</h3><p class="hint" style="margin:-4px 0 8px">행이 없으면 일정 별첨은 빠집니다. 칸을 비우면 왼쪽 칸과 합쳐지고, 첫 칸을 비우면 위 행과 같은 분류로 묶입니다.</p>
    <div class="fgrid">${fld('제목','schedule.title',c.schedule.title)}${fld('구역 이름','schedule.sec',c.schedule.sec)}${fld('머리글 1','schedule.heads.0',c.schedule.heads[0])}${fld('머리글 2','schedule.heads.1',c.schedule.heads[1])}${fld('머리글 3','schedule.heads.2',c.schedule.heads[2],{type:'ta',rows:2})}</div><div style="height:8px"></div>
    ${rowsEd('schedule.rows',[['c1','1열',130,'ta'],['c2','2열',230,'ta'],['c3','3열',230,'ta']])}
    <div class="fgrid" style="margin-top:8px">${fld('주석','schedule.notes',c.schedule.notes,{type:'ta',wide:true,rows:2})}</div></div>
  <div class="card"><h3>약관 · 개인정보처리방침 PDF</h3>
    <p class="hint" style="margin:-4px 0 8px">서비스 이용약관, 공급약관, 개인정보처리방침처럼 고정된 문서는 원본 PDF를 한 번 올려 두면, PDF 저장 시 계약서 뒤에 그대로 붙습니다. 체크한 순서대로 붙습니다.</p>
    <div style="display:grid;gap:8px">${termRows.length?termRows.map(t=>termRowHtml(t,sel.has(t.id),c)).join(''):'<p class="hint" style="margin:0">아직 올린 약관 PDF가 없습니다.</p>'}</div>
    <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">${S.assets?`<label class="btn" for="term-file">PDF 올리기</label><input type="file" id="term-file" accept="application/pdf" hidden><span class="hint">올린 파일은 이 계약서 종류의 기본 첨부로 등록됩니다. ‘설정’에서 표지 제목과 기본 첨부 종류를 바꿀 수 있습니다.</span>`:'<span class="hint">PDF를 올리려면 이 페이지의 편집 권한이 필요합니다.</span>'}</div></div>`;
  $('#ct-title').textContent=(c.counterparty||'새 계약서')+' · '+((CT_TYPES[c.type]||{}).name||'');
  const tf=$('#term-file');if(tf)tf.onchange=()=>{if(tf.files[0])uploadTerm(tf.files[0])};
}
function termRowHtml(t,on,c){const id=esc(t.id);const ts=(k,v,o)=>inp('',v,o).replace('data-p=""',`data-tset="${id}|${k}"`);
  const types=t.types||[];const no=termAttNo(c,t);
  return`<div class="term-row"><label class="fld chk"><input type="checkbox" data-term="${id}"${on?' checked':''}><span><b style="color:var(--ink)">${esc(t.name)}</b> <span class="hint">· ${esc(t.kind||'약관')}${t.variant?' · '+esc(t.variant):''}${on&&no?` · 별첨 ${no}`:''}${types.length?' · 기본: '+types.map(x=>esc((CT_TYPES[x]||{}).name||x)).join(', '):''}</span></span></label>
   <details class="opts"><summary>설정</summary><div class="fgrid">
    <label class="fld"><span>이름</span>${ts('name',t.name)}</label>
    <label class="fld"><span>문서 종류 (별첨 번호 매칭)</span>${ts('kind',t.kind||'약관',{type:'sel',opts:[['약관','약관'],['개인정보','개인정보처리방침'],['SLA','서비스수준협약서(SLA)'],['기타','기타']]})}</label>
    <label class="fld"><span>표지 구분 체크</span>${ts('variant',t.variant||'',{type:'sel',opts:[['','표시 안 함'],['패키지','패키지'],['커스터마이징','커스터마이징']]})}</label>
    <label class="fld wide"><span>표지 제목</span>${ts('coverTitle',t.coverTitle||t.name,{type:'ta',rows:2})}</label>
    <label class="fld chk wide">${ts('skipFirst',t.skipFirst!==false,{type:'chk'})}<span>원본 첫 장(‘고객사명’ 표지) 대신 거래처 이름이 들어간 표지로 바꿔 붙이기</span></label>
    ${Object.entries(CT_TYPES).map(([k,v])=>`<label class="fld chk">${ts('type.'+k,types.includes(k),{type:'chk'})}<span>기본 첨부: ${esc(v.name)}</span></label>`).join('')}
   </div></details></div>`}
async function saveTermField(el){
  const [id,k]=el.dataset.tset.split('|');const t=S.terms.get(id);if(!t)return;
  const v=el.type==='checkbox'?el.checked:el.value;const patch={};
  if(k.startsWith('type.')){const ty=k.slice(5);const set=new Set(t.types||[]);v?set.add(ty):set.delete(ty);patch.types=[...set]}else patch[k]=v;
  Object.assign(t,patch);
  if(k==='name')(S.cdraft.appendPdfs||[]).forEach(a=>{if(a.id===id)a.name=v});
  scheduleCPreview();
  if(S.db){try{await S.db.collection('termdocs').doc(id).update(patch)}catch(_){toast('약관 설정을 저장하지 못했습니다')}}
}
function setCDirty(v){S.cdirty=v;$('#cdirty').hidden=!v}
let cPrevT,cSeq=0;
function scheduleCPreview(){clearTimeout(cPrevT);cPrevT=setTimeout(renderCPreview,300)}
async function renderCPreview(){if(!S.cdraft)return;const seq=++cSeq;const pages=await contractPages(S.cdraft,true);if(seq!==cSeq||!S.cdraft)return;showPages(pages,$('#cprev'));$('#cprev-info').textContent=`A4 미리보기 · ${pages.length}쪽${(S.cdraft.appendPdfs||[]).length?' (약관 PDF 자리 포함)':''}`}
function refreshCalc(){const c=S.cdraft;document.querySelectorAll('#ct-form [data-calc]').forEach(td=>{const p=td.dataset.calc;const r=getP(c,p);if(!r)return;td.textContent=p.startsWith('amounts')?(num(r.amount)?krw(num(r.amount))+'원':'-'):fmt(payAmt(c,r))});const t=$('#ct-total');if(t)t.textContent=fmt(ctTotal(c))}
$('#ct-form').addEventListener('input',e=>{
  const el=e.target;const p=el.dataset.p;if(!p)return;const c=S.cdraft;
  const v=el.type==='checkbox'?el.checked:el.value;
  if(p==='__items'){const old=new Map((c.items||[]).map(i=>[i.label,i.on]));c.items=v.split('\n').map(s=>s.trim()).filter(Boolean).map(l=>({label:l,on:!!old.get(l)}));setCDirty(true);scheduleCPreview();return}
  setP(c,p,v);
  if(p==='quoteId'||p==='type'){renderCForm()}
  if(p==='counterparty')$('#ct-title').textContent=(c.counterparty||'새 계약서')+' · '+((CT_TYPES[c.type]||{}).name||'');
  refreshCalc();setCDirty(true);scheduleCPreview();
});
$('#ct-form').addEventListener('change',async e=>{
  if(e.target.dataset.tset){saveTermField(e.target);return}
  const id=e.target.dataset.term;if(!id)return;const c=S.cdraft;c.appendPdfs=c.appendPdfs||[];
  if(e.target.checked){const t=S.terms.get(id);if(t&&!c.appendPdfs.some(a=>a.id===id))c.appendPdfs.push({id,name:t.name})}
  else c.appendPdfs=c.appendPdfs.filter(a=>a.id!==id);
  setCDirty(true);scheduleCPreview();
});
$('#ct-form').addEventListener('click',e=>{
  const b=e.target.closest('[data-cact]');if(!b)return;const c=S.cdraft;const act=b.dataset.cact;
  const arr=b.dataset.p?getP(c,b.dataset.p):null;const i=+b.dataset.i;
  if(act==='add')arr.push(clone(ROW_TPL[b.dataset.p]||{}));
  else if(act==='del')arr.splice(i,1);
  else if(act==='up'||act==='down'){const j=i+(act==='up'?-1:1);if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]]}
  else if(act==='reapply'){const q=S.quotes.get(c.quoteId);if(!q)return;applyQuote(c,q);toast('견적 금액과 물품 체크를 다시 반영했습니다')}
  else if(act==='retype'){if(!b.dataset.armed){b.dataset.armed='1';b.textContent='한 번 더 누르면 금액·문구·별첨을 기본값으로 바꿉니다';setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent='선택한 종류의 기본 문구로 다시 채우기'}},3500);return}
    const keep={id:c.id,status:c.status,contractDate:c.contractDate,counterparty:c.counterparty,appendPdfs:c.appendPdfs};const cust=c.dzFirst?c.partyB:c.partyA;
    const n=newContract(c.type,S.quotes.get(c.quoteId)||null);Object.assign(n,keep);const nc=n.dzFirst?n.partyB:n.partyA;Object.assign(nc,cust);S.cdraft=n}
  else if(act==='openq'){const q=S.quotes.get(c.quoteId);if(q){if(S.cdirty){toast('먼저 계약서를 저장하세요');return}openQuote(q.id)}return}
  else return;
  const sy=window.scrollY;renderCForm();window.scrollTo(0,sy);setCDirty(true);scheduleCPreview();
});
async function uploadTerm(file){
  if(!S.assets||!S.db){toast('PDF를 올릴 수 없는 환경입니다');return}
  if(!/pdf$/i.test(file.type)&&!/\.pdf$/i.test(file.name)){toast('PDF 파일만 올릴 수 있습니다');return}
  toast('업로드 중…');
  try{const r=await S.assets.upload(file);const name=file.name.replace(/\.pdf$/i,'');const doc={name,assetId:r.id,types:[S.cdraft.type],kind:/개인정보/.test(name)?'개인정보':/SLA|수준협약/.test(name)?'SLA':'약관',variant:/커스터마이징/.test(name)?'커스터마이징':/패키지/.test(name)?'패키지':'',coverTitle:name.replace(/[_ ]?Ver\.?[\d.]+.*$/i,'').replace(/더존용/,'').trim(),skipFirst:true,uploadedAt:new Date().toISOString().slice(0,19)};
    await S.db.collection('termdocs').doc(r.id).set(doc);S.terms.set(r.id,Object.assign({id:r.id},doc));
    S.cdraft.appendPdfs=(S.cdraft.appendPdfs||[]).concat({id:r.id,name});renderCForm();setCDirty(true);scheduleCPreview();toast('올렸습니다: '+name)}
  catch(err){toast('업로드하지 못했습니다'+(err&&err.code?' ('+err.code+')':''))}
}
function openCEditor(c,isNew){S.cdraft=clone(c);S.cid=c.id;S.cisNew=isNew;setCDirty(!!isNew);resetCArm();renderCForm();show('cedit');renderCPreview()}
function openContract(id){const c=S.contracts.get(id);if(c)openCEditor(c,false)}
function openNewContract(type,q){const c=newContract(type,q);c.id=uid().replace(/^q/,'c');openCEditor(c,true)}
function resetCArm(){const d=$('#cdel');d.classList.remove('armed');d.textContent='삭제';delete d.dataset.armed;const b=$('#cback');b.textContent='← 목록';delete b.dataset.armed}
$('#cback').onclick=()=>{const b=$('#cback');if(S.cdirty&&!b.dataset.armed){b.dataset.armed='1';b.textContent='저장 안 하고 나가기';setTimeout(()=>{if(b.dataset.armed){delete b.dataset.armed;b.textContent='← 목록'}},3500);return}S.cdraft=null;setCDirty(false);show('dash');setTab('c')};
async function saveContract(){
  const c=S.cdraft;c.updatedAt=new Date(Date.now()+9*3600e3).toISOString().slice(0,19);
  if(!S.db){S.contracts.set(c.id,clone(c));setCDirty(false);S.cisNew=false;toast('이 화면에서만 저장했습니다 (공유 저장소 연결 안 됨)');return}
  $('#csave').disabled=true;
  try{await S.db.collection('contracts').doc(c.id).set(clone(c));S.contracts.set(c.id,clone(c));setCDirty(false);S.cisNew=false;
    const q=c.quoteId&&S.quotes.get(c.quoteId);
    if(c.status==='체결완료'&&q&&q.status!=='수주'){try{await S.db.collection('quotes').doc(q.id).update({status:'수주'});q.status='수주';toast('저장했습니다 · 연결 견적을 ‘수주’로 바꿨습니다')}catch(_){toast('저장했습니다')}}
    else toast('저장했습니다');
    if(c.status==='체결완료'&&q){const f=flowOf(q);if(f.need&&f.dcState!=='승인')setTimeout(()=>toast('주의: 이 계약의 할인기안이 아직 승인되지 않았습니다 (현재 '+f.dcState+')'),1800)}}
  catch(err){toast(err&&err.code==='invalid_argument'?'저장 권한이 없습니다. 편집 권한(Contributor 이상)이 필요합니다.':'저장하지 못했습니다: '+(err&&err.message||err))}
  finally{$('#csave').disabled=false}
}
$('#csave').onclick=saveContract;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&S.view==='cedit'){e.preventDefault();saveContract()}});
$('#cdup').onclick=()=>{const c=clone(S.cdraft);c.id=uid().replace(/^q/,'c');c.status='작성중';c.contractDate=today();c.attachments.forEach(a=>a.agreed=false);openCEditor(c,true);toast('복제했습니다. 저장해야 목록에 추가됩니다.')};
$('#cdel').onclick=async()=>{const d=$('#cdel');if(!d.dataset.armed){d.dataset.armed='1';d.classList.add('armed');d.textContent='삭제 확인';setTimeout(()=>{if(d.dataset.armed)resetCArm()},3500);return}
  const id=S.cid;resetCArm();if(!S.cisNew){try{if(S.db)await S.db.collection('contracts').doc(id).delete();S.contracts.delete(id)}catch(_){toast('삭제하지 못했습니다');return}}
  setCDirty(false);S.cdraft=null;show('dash');setTab('c');toast('삭제했습니다')};
const cBase=()=>{const c=S.cdraft;return safeName(`${c.counterparty||'거래처'}_${c.title||'계약서'}_${c.contractDate||''}`)};
$('#cexp-pdf').onclick=async()=>{const b=$('#cexp-pdf');b.disabled=true;b.textContent='PDF 만드는 중…';try{await exportPdf(await contractPages(S.cdraft,'pdf'),cBase())}finally{b.disabled=false;b.textContent='PDF 저장'}};
$('#cexp-html').onclick=async()=>exportHtml(await contractPages(S.cdraft,'html'),cBase(),(S.cdraft.appendPdfs||[]).map(a=>a.name));
$('#mk-ct').onchange=async e=>{const t=e.target.value;e.target.value='';if(!t)return;
  if(S.draft&&S.draft.status==='작성중'){S.draft.status='제출';setDirty(true);toast('견적을 ‘제출’ 상태로 바꾸고 계약서를 만듭니다')}
  if(S.dirty||S.isNew){await save();if(S.dirty)return}
  const q=S.quotes.get(S.id)||S.draft;S.draft=null;openNewContract(t,q)};
