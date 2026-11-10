
/* ================= 고객사 정보 카드 (견적 편집 화면) ================= */
S.companies=new Map();
const cid=k=>{let h=0x811c9dc5;for(const ch of k){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0}return'c'+h.toString(16)};
const ckey=n=>String(n||'').replace(/\(주\)|주식회사|㈜|\(유\)|\(유한\)|법무법인|\s/g,'').toLowerCase();
{const t=setInterval(()=>{if(!S.db)return;clearInterval(t);S.db.collection('companies').onSnapshot(snap=>{const m=new Map();snap.docs.forEach(d=>{const v=d.data();if(v&&v.name)m.set(ckey(v.name),Object.assign({},clone(v),{id:d.id}))});S.companies=m;if(S.view==='xedit')renderCust()},()=>{})},500)}
function custProfile(name){const k=ckey(name);if(!k)return null;const P={name,fields:{},src:{},quotes:[],contracts:[],meetings:[]};
  const put=(f,v,src)=>{if(v&&!P.fields[f]){P.fields[f]=String(v);P.src[f]=src}};
  const co=S.companies.get(k);if(co){['bizNo','ceo','addr','bizType','bizItem','founded','industry','employees','employeesAt','sales','homepage','memo'].forEach(f=>put(f,co[f],'기업 정보'))}
  [...S.contracts.values()].forEach(c=>{const p=c.dzFirst?c.partyB:c.partyA;if(p&&ckey(p.name)===k||ckey(c.counterparty)===k){P.contracts.push(c);if(p){put('bizNo',p.bizNo,'계약서');put('ceo',p.ceo,'계약서');put('addr',p.addr,'계약서')}}});
  [...S.buildreqs.values()].forEach(b=>{const c=b.customer||{};if(ckey(c.name)!==k)return;put('bizNo',c.bizNo,'구축요청');put('addr',c.addr,'구축요청');put('bizType',c.bizType,'구축요청');put('bizItem',c.bizItem,'구축요청');put('contact',c.contact,'구축요청');put('tel',c.tel||c.hp,'구축요청');put('email',c.email,'구축요청')});
  [...S.discounts.values()].forEach(d=>{const c=d.customer||{};if(ckey(c.name)!==k)return;put('bizNo',c.bizNo,'할인기안');put('addr',c.addr,'할인기안')});
  [...S.meetings.values()].forEach(m=>{const c=m.analysis&&m.analysis.customer||{};if(ckey(c.name)!==k)return;P.meetings.push(m);put('bizNo',c.bizNo,'상담');put('ceo',c.ceo,'상담');put('addr',c.addr,'상담');put('bizType',c.bizType,'상담');put('bizItem',c.bizItem,'상담');put('contact',[c.contact,c.contactTitle].filter(Boolean).join(' '),'상담');put('tel',c.hp||c.tel,'상담');put('email',c.email,'상담')});
  [...S.quotes.values()].forEach(q=>{if(ckey(q.customer)===k)P.quotes.push(q)});
  return P}
const CUST_F=[['bizNo','사업자등록번호'],['ceo','대표자'],['addr','주소'],['bizType','업태'],['bizItem','종목'],['industry','업종'],['founded','설립일'],['employees','임직원 수'],['sales','매출액'],['contact','고객 담당자'],['tel','연락처'],['email','이메일'],['homepage','홈페이지']];
function renderCust(){const box=$('#x-cust');if(!box)return;const q=S.draft;if(!q||S.view!=='xedit'){box.hidden=true;return}
  const P=custProfile(q.customer);if(!P){box.hidden=true;return}box.hidden=false;
  const f=P.fields;const shown=CUST_F.filter(([k])=>f[k]);
  const others=P.quotes.filter(x=>x.id!==q.id);
  box.innerHTML=`<div class="cc-h"><div><div class="cc-e">고객사 정보</div><b>${esc(q.customer)}</b></div><div class="sp"></div>
    <button class="ib" id="cc-edit">${S.companies.get(ckey(q.customer))?'기업 정보 수정':'기업 정보 추가'}</button></div>
    ${shown.length?`<dl class="cc-g">${shown.map(([k,l])=>`<div><dt>${l}</dt><dd title="출처: ${esc(P.src[k])}">${esc(k==='employees'?f[k]+'명'+(f.employeesAt?` (${f.employeesAt} 국민연금 기준)`:''):f[k])}</dd></div>`).join('')}</dl>`:'<p class="hint" style="margin:6px 0 0">아직 등록된 정보가 없습니다. 계약서·상담·구축요청에서 입력한 정보가 여기에 모입니다.</p>'}
    <div class="cc-hist">${others.length?`<span>이전 견적 ${others.length}건</span>`:'<span>첫 견적</span>'}${P.contracts.length?`<span>계약 ${P.contracts.length}건 (체결 ${P.contracts.filter(c=>c.status==='체결완료').length})</span>`:''}${P.meetings.length?`<span>상담 ${P.meetings.length}건</span>`:''}</div>
    <div id="cc-form" hidden></div>`;
  $('#cc-edit').onclick=()=>custEdit(q.customer)}
function custEdit(name){const k=ckey(name);const co=S.companies.get(k)||{};const P=custProfile(name);const box=$('#cc-form');box.hidden=false;
  const flds=[['bizNo','사업자등록번호'],['ceo','대표자'],['addr','주소'],['bizType','업태'],['bizItem','종목'],['industry','업종 (DART)'],['founded','설립일'],['employees','임직원 수 (국민연금 가입자)'],['employeesAt','기준월 (YYYY-MM)'],['sales','매출액'],['homepage','홈페이지'],['memo','메모']];
  box.innerHTML=`<div class="fgrid" style="margin-top:10px">${flds.map(([f,l])=>`<label class="fld${f==='addr'||f==='memo'?' wide':''}"><span>${l}</span><input id="cc-${f}" value="${esc(co[f]||P.fields[f]||'')}"></label>`).join('')}</div>
    <div class="vrec-row"><button class="btn pri" id="cc-save">기업 정보 저장</button><button class="btn" id="cc-cancel">닫기</button><span class="hint">DART 기업개황·국민연금 가입자 수는 자동 조회 연결 전까지 직접 입력합니다.</span></div>`;
  $('#cc-cancel').onclick=()=>{box.hidden=true};
  $('#cc-save').onclick=async()=>{const v={name};flds.forEach(([f])=>{const x=$('#cc-'+f).value.trim();if(x)v[f]=x});v.updatedAt=new Date(Date.now()+9*3600e3).toISOString().slice(0,19);
    try{if(S.db)await S.db.collection('companies').doc(cid(k)).set(v);S.companies.set(k,v);toast('기업 정보를 저장했습니다');renderCust()}catch(_){toast('저장하지 못했습니다')}}}
const _renderXBar=renderXBar;renderXBar=function(){_renderXBar();renderCust()};
const _refreshX=refreshX;let ccT;refreshX=function(){_refreshX();clearTimeout(ccT);ccT=setTimeout(()=>{if(!document.activeElement||!document.activeElement.closest('#x-cust'))renderCust()},400)};
