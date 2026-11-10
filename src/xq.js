
/* ================= 표준 가격확약서(엑셀 양식) ================= */
const XQ_TPLS=[
 {id:'cloud_pkg',name:'Amaranth 10 Cloud · 패키지',ver:'Ver.3.4',kind:'cloud',title:'Amaranth 10 Cloud 가격확약서'},
 {id:'cloud_cust',name:'Amaranth 10 Cloud · 커스터마이징',ver:'Ver.1.5',kind:'cloud',title:'Amaranth 10 Cloud 가격확약서'},
 {id:'csap',name:'Amaranth 10 Cloud CSAP · 공공기관',ver:'Ver.1.1',kind:'csap',title:'Amaranth 10 Cloud CSAP 가격확약서'},
 {id:'a10_pkg',name:'Amaranth 10 설치형 · 패키지',ver:'Ver.4.0',kind:'onprem',title:'Amaranth 10 가격확약서'},
 {id:'a10_cust',name:'Amaranth 10 설치형 · 커스터마이징',ver:'Ver.4.0',kind:'onprem',title:'Amaranth 10 가격확약서'},
 {id:'mas_pkg',name:'나라장터·조달청 MAS · 패키지',ver:'Ver.4.0',kind:'onprem',title:'Amaranth 10 가격확약서'},
 {id:'mas_cust',name:'나라장터·조달청 MAS · 커스터마이징',ver:'Ver.4.0',kind:'onprem',title:'Amaranth 10 가격확약서'},
 {id:'oneai_pack',name:'ONE AI Pack',ver:'Ver.1.0',kind:'oneai',title:'ONE AI Pack 가격확약서'}];
const xqInfo=id=>XQ_TPLS.find(t=>t.id===id)||{name:id,ver:'',title:'가격확약서'};
const sheetLabel=n=>n.replace(/^Amaranth\s?10\s*/,'').replace(/ 견적서$/,'')||n;
const TPL={};
async function loadTpl(id){
  if(TPL[id])return TPL[id];
  const res=await fetch('tpl/'+id+'.json');if(!res.ok)throw new Error('양식 파일을 불러오지 못했습니다');
  const d=await res.json();d.models={};d.inputs={};
  const st=document.createElement('style');st.dataset.xl=id;st.textContent=xlCss(d);document.head.appendChild(st);
  TPL[id]=d;return d;
}
const BD={thin:'1px solid',hair:'1px solid',medium:'2px solid',thick:'3px solid',dashed:'1px dashed',dotted:'1px dotted',double:'3px double',mediumDashed:'2px dashed',dashDot:'1px dashed',mediumDashDot:'2px dashed',dashDotDot:'1px dotted',mediumDashDotDot:'2px dotted',slantDashDot:'2px dashed'};
function xlCss(d){
  const p=`.xl-${d.id}`;
  return d.styles.map((s,i)=>{const r=[];if(s.b)r.push('font-weight:700');if(s.i)r.push('font-style:italic');if(s.u||s.st)r.push(`text-decoration:${s.u?'underline':''}${s.st?' line-through':''}`);
    r.push(`font-size:${s.sz}pt`);if(s.fc&&s.fc!=='000000')r.push('color:#'+s.fc);if(s.fill)r.push('background:#'+s.fill);
    ['left','right','top','bottom'].forEach((k,j)=>{const b=s.bd[j];if(b)r.push(`border-${k}:${BD[b[0]]||'1px solid'} #${b[1]||'000000'}`)});
    const h={center:'center',centerContinuous:'center',right:'right',left:'left',justify:'left',distributed:'center',fill:'left'}[s.h];if(h)r.push('text-align:'+h);
    r.push('vertical-align:'+({top:'top',center:'middle',justify:'middle',distributed:'middle'}[s.v]||'bottom'));
    if(s.w)r.push('white-space:pre-wrap');if(s.ind)r.push(`padding-left:${s.ind*9}px`);
    return`${p} .s${i}{${r.join(';')}}`}).join('\n');
}
const colPx=w=>Math.round(w*7+5),rowPx=h=>Math.round(h*96/72);
function xlModel(d,sheet,area,extraCols){
  const key=sheet+'|'+area.join(',')+'|'+(extraCols||[]).join(',');if(d.models[key])return d.models[key];
  const sh=d.sheets[sheet];const [r1,c1,r2,c2]=area;
  const cw=c=>{const x=sh.cols&&sh.cols[c];return x?(x[1]?0:colPx(x[0])):colPx(sh.dcw||8.43)};
  const cols=[];for(let c=c1;c<=c2;c++)if(cw(c))cols.push({c,w:cw(c)});(extraCols||[]).forEach(c=>{if(cw(c))cols.push({c,w:cw(c),extra:1})});
  const rows=[];for(let r=r1;r<=r2;r++){const x=sh.rows&&sh.rows[r];if(x&&x[1])continue;rows.push({r,h:rowPx(x&&x[0]?x[0]:(sh.drh||15))})}
  const ci=new Map(cols.map((x,i)=>[x.c,i])),ri=new Map(rows.map((x,i)=>[x.r,i]));
  const master=new Map(),covered=new Set();
  (sh.merges||[]).forEach(([a,b,e,f])=>{if(e<r1||a>r2||f<c1||b>c2)return;
    const vr=rows.filter(x=>x.r>=a&&x.r<=e),vc=cols.filter(x=>!x.extra&&x.c>=b&&x.c<=f);if(!vr.length||!vc.length)return;
    master.set(vr[0].r+','+vc[0].c,{rs:vr.length,cs:vc.length,r2:vr[vr.length-1].r});
    vr.forEach(x=>vc.forEach(y=>{if(x!==vr[0]||y!==vc[0])covered.add(x.r+','+y.c)}))});
  let acc=0;cols.forEach(x=>{x.x=acc;acc+=x.w});const W=acc;acc=0;rows.forEach(x=>{x.y=acc;acc+=x.h});
  const m={sheet,area,cols,rows,ci,ri,master,covered,W,H:acc};d.models[key]=m;return m;
}
/* 입력 셀 찾기 */
function xlInputs(d,sheet){
  if(d.inputs[sheet])return d.inputs[sheet];
  const sh=d.sheets[sheet];const C=a=>sh.cells[a];const F=a=>{const x=C(a);return x&&'f' in x};const V=a=>{const x=C(a);return x&&'v' in x?x.v:null};
  const map={};const isChk=sheet==='A10_체크리스트';
  if(isChk){
    for(let r=1;r<=20;r++){const lab=String(V('B'+r)||'').replace(/\s/g,'');
      if(lab.startsWith('고객사명')){map['E'+r]={t:'text',label:'고객사명'};map['F'+r]={t:'text',label:'사업자등록번호'}}
      if(lab==='영업센터')map['E'+r]={t:'text',label:'영업센터'};
      if(lab.startsWith('영업담당')){map['E'+r]={t:'text',label:'영업담당자'};map['G'+r]={t:'text',label:'연락처'}}
      if(lab==='사용유저'){map['C'+r]={t:'num',label:'사용 유저 수'};map['E'+r]={t:'text',label:'서버 선택'};map['G'+r]={t:'sel',opts:['○','X'],label:'업셀 프로모션'}}
      if(lab==='버전')map['C'+r]={t:'num',label:'버전'};
      const dl=String(V('D'+r)||'');if(/IDC/.test(dl)&&!F('E'+r)&&V('E'+r)!=null&&r<16)map['E'+r]={t:'sel',opts:['○','X'],label:dl};
    }
    for(let r=15;r<=90;r++){const x=C('F'+r);if(x&&!('f' in x)&&typeof x.v==='number'&&V('C'+r))map['F'+r]={t:'num',label:'수량'}}
    return d.inputs[sheet]=map;
  }
  const pa=sh.pa||[1,1,sh.maxr,sh.maxc];let rateMode=false;
  for(let r=pa[0];r<=pa[2];r++){
    if(String(V('C'+r)||'').replace(/\s/g,'')==='항목')rateMode=/요율/.test(String(V('J'+r)||''));
    const L=C('L'+r),N=C('N'+r);
    if(!rateMode&&L&&L.f&&new RegExp('\\bJ\\$?'+r+'\\b').test(L.f)&&!F('J'+r))map['J'+r]={t:'num',label:'수량'};
    if(N&&N.f&&new RegExp('\\bM\\$?'+r+'\\b').test(N.f)&&!F('M'+r)){const nd=/할인\s*불가|할인불가/.test(String(V('S'+r)||''));map['M'+r]={t:'pct',label:'D/C',nd}}
    ['C','E'].forEach(col=>{const v=String(V(col+r)||'');if(/시트에서/.test(v)){map[col+r]={t:/ONE ?AI/i.test(v)?'oneai':'edu',label:/ONE ?AI/i.test(v)?'ONE AI 요금제':'교육비 품목'}}});
  }
  (sh.dv||[]).forEach(dv=>{if(/#REF|\\|\[/.test(dv.f))return;dv.sqref.split(/\s+/).forEach(rg=>{const m=/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(rg);if(!m)return;
    for(let r=+m[2];r<=+(m[4]||m[2]);r++){const a=m[1]+r;if(r<10||F(a))continue;map[a]={t:'sel',f:dv.f,label:'선택'}}})});
  const hdrB=/업체명|담당자|견적명|견적담당/,hdrI=/영업센터|영업담당|납품기일|납품장소|서비스장소|지불조건|유효기간/;
  for(let r=3;r<=22;r++){const b=String(V('B'+r)||'').replace(/\s/g,''),i=String(V('I'+r)||'').replace(/\s/g,'');
    if(r<=10&&hdrB.test(b)&&!F('D'+r))map['D'+r]={t:'text',label:b};
    if(hdrI.test(i)){const col=C('J'+r)?'J':(C('K'+r)?'K':'J');if(!F(col+r))map[col+r]={t:'text',label:i}}}
  return d.inputs[sheet]=map;
}
function dvOptions(d,book,f){
  if(/^".*"$/.test(f))return f.slice(1,-1).split(',');
  const m=/^'?([^'!]+)'?!\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/.exec(f);if(!m)return[];
  const out=[];for(let r=+m[3];r<=+m[5];r++){const v=book.value(m[1],r,XL.colNum(m[2]));if(v!=null&&v!=='')out.push(String(v))}return out;
}
function eduOptions(d){const sh=d.sheets['교육비'];if(!sh)return[];const V=a=>{const x=sh.cells[a];return x&&'v' in x?x.v:null};const out=[];let grpA='',grpB='';
  for(let r=3;r<=sh.maxr;r++){const a=V('A'+r),b=V('B'+r),dd=V('D'+r),e=V('E'+r),g=V('G'+r),h=V('H'+r);if(a)grpA=String(a).replace(/\n/g,' ');if(b)grpB=String(b).replace(/\n/g,' ');
    if(!e)continue;const name=(dd?String(dd):String(b||grpB)).replace(/\n/g,' ').trim();const full=(dd&&grpB&&!String(dd).includes(grpB)?grpB+' '+name:name).trim();
    out.push({name:full,spec:String(e).replace(/\n/g,' ').trim(),foex:typeof g==='number'?g:null,visit:typeof h==='number'?h:null,grp:grpA})}
  return out}
function oneaiOptions(d){const sh=d.sheets['ONE AI'];if(!sh)return[];const V=a=>{const x=sh.cells[a];return x&&'v' in x?x.v:null};const out=[];
  for(let r=2;r<=sh.maxr;r++){const b=V('B'+r);if(!b)continue;out.push({name:String(b).trim(),spec:String(V('C'+r)||''),price:V('F'+r),unit:/월납/.test(b)?'월':'년'})}return out}
/* 표시 값 */
function xlText(d,book,sheet,r,c){const v=book.value(sheet,r,c);if(v==null)return'';if(XL.isErr(v))return v.e;if(typeof v==='boolean')return v?'TRUE':'FALSE';
  const rc=d.sheets[sheet].cells[XL.colStr(c)+r];const st=rc&&rc.s!=null?d.styles[rc.s]:null;return XL.fmtNumber(v,st&&st.nf)}
function xlCellAlign(v,st){if(st&&st.h&&st.h!=='general')return'';return typeof v==='number'?'text-align:right;':''}
/* 시트 → 표 HTML */
function xlTable(d,book,m,rowsSub,opt){
  opt=opt||{};const sh=d.sheets[m.sheet];const inputs=opt.inputs||{};
  let h=`<table class="xls xl-${d.id}" style="width:${m.W}px"><colgroup>${m.cols.map(x=>`<col style="width:${x.w}px">`).join('')}</colgroup>`;
  const sub=rowsSub||m.rows;const first=sub[0],last=sub[sub.length-1];
  sub.forEach(row=>{h+=`<tr style="height:${row.h}px">`;
    m.cols.forEach(col=>{const k=row.r+','+col.c;
      let ms=m.master.get(k),rs=1,cs=1;
      if(m.covered.has(k)){// 페이지 첫 행에서 잘린 병합은 다시 그림
        if(row!==first)return;const top=[...m.master.entries()].find(([kk,v])=>{const [rr,cc]=kk.split(',').map(Number);return cc===col.c&&rr<row.r&&v.r2>=row.r});if(!top)return;ms={rs:0,cs:top[1].cs,r2:top[1].r2,clip:1}}
      if(ms){cs=ms.cs;rs=sub.filter(x=>x.r>=row.r&&x.r<=ms.r2).length||1}
      const a=XL.colStr(col.c)+row.r;const rc=sh.cells[a];const sid=rc&&rc.s!=null?rc.s:null;const st=sid!=null?d.styles[sid]:null;
      const v=book.value(m.sheet,row.r,col.c);const inp=inputs[a];
      const span=(rs>1?` rowspan="${rs}"`:'')+(cs>1?` colspan="${cs}"`:'');
      let cls=(sid!=null?'s'+sid:'')+(col.extra?' xx':'');
      if(inp&&opt.edit){h+=`<td class="${cls} xin"${span}>${xlInputHtml(d,book,m.sheet,a,inp,v,st)}</td>`;return}
      const txt=xlText(d,book,m.sheet,row.r,col.c);
      const al=xlCellAlign(v,st);const wrap=st&&st.w;
      let spill='';
      if(txt&&typeof v==='string'&&!wrap&&!ms&&!col.extra&&(!st||!st.h||st.h==='left'||st.h==='general')){
        let w=col.w,ix=m.ci.get(col.c)+1;
        while(ix<m.cols.length&&!m.cols[ix].extra){const c2=m.cols[ix].c,k2=row.r+','+c2;if(m.covered.has(k2)||m.master.has(k2)||inputs[XL.colStr(c2)+row.r])break;const v2=book.value(m.sheet,row.r,c2);if(v2!=null&&v2!=='')break;w+=m.cols[ix].w;ix++}
        if(w>col.w){spill=` style="width:${w-4}px"`;cls+=' sp'}}
      h+=`<td class="${cls}"${span}${rc&&rc.f&&opt.track?` data-f="${a}"`:''}${al?` style="${al}"`:''}>${txt?`<div class="xv${wrap?' w':''}"${spill}>${esc(txt)}</div>`:''}</td>`});
    h+='</tr>'});
  return h+'</table>';
}
function xlInputHtml(d,book,sheet,a,inp,v,st){
  const base=`data-xa="${esc(sheet+'!'+a)}" aria-label="${esc(inp.label||a)}"`;
  if(inp.t==='num')return`<input class="xi n" inputmode="decimal" ${base} value="${v==null||v===0?'':esc(v)}">`;
  if(inp.t==='pct')return`<input class="xi n" inputmode="decimal" ${base} ${inp.nd?'disabled title="할인 불가 품목"':''} value="${typeof v==='number'&&v?esc(+(v*100).toFixed(4)):''}" placeholder="%">`;
  if(inp.t==='text')return`<textarea class="xi t" rows="1" ${base}>${esc(v==null?'':v)}</textarea>`;
  if(inp.t==='sel'){const opts=inp.opts||dvOptions(d,book,inp.f);const cur=v==null?'':String(v);return`<select class="xi" ${base}><option value="">—</option>${opts.map(o=>`<option${o===cur?' selected':''}>${esc(o)}</option>`).join('')}${cur&&!opts.includes(cur)?`<option selected>${esc(cur)}</option>`:''}</select>`}
  if(inp.t==='edu'||inp.t==='oneai'){return`<button class="xi pick" data-pick="${inp.t}" ${base}>${esc(v&&!/시트에서/.test(v)?v:(inp.t==='edu'?'교육비 품목 선택…':'요금제 선택…'))}</button>`}
  return esc(v);
}
/* 이미지 */
function xlImages(d,m,rowFrom,rowTo,yOff){
  const sh=d.sheets[m.sheet];let h='';
  (sh.images||[]).forEach(im=>{if(!im.from)return;const fr=im.from[0]+1;if(fr<rowFrom||fr>rowTo)return;
    const xAt=(c0,off)=>{const c=c0+1;let x=0;for(const col of m.cols){if(col.c>=c)break;x+=col.w}return x+off/9525};
    const yAt=(r0,off)=>{const r=r0+1;let y=0;for(const row of m.rows){if(row.r>=r)break;y+=row.h}return y+off/9525};
    const x=xAt(im.from[1],im.from[3]),y=yAt(im.from[0],im.from[2])-yOff;
    let w,hh;if(im.to){w=xAt(im.to[1],im.to[3])-x;hh=yAt(im.to[0],im.to[2])-yOff-y}else if(im.ext){w=im.ext[0]/9525;hh=im.ext[1]/9525}
    if(!(w>2&&hh>2)||x>=m.W-2)return;
    if(im.sp){const jc={t:'flex-start',ctr:'center',b:'flex-end'}[im.anchor]||'flex-start';
      h+=`<div class="xsp" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px;justify-content:${jc};${im.fill?'background:#'+im.fill:''}">${(im.paras||[]).map(p=>`<div style="text-align:${{ctr:'center',r:'right',just:'left'}[p.al]||'left'}">${p.runs.map(r=>`<span style="font-size:${r.sz}pt;${r.b?'font-weight:700;':''}${r.c?'color:#'+r.c:''}">${esc(r.t)}</span>`).join('')||'&nbsp;'}</div>`).join('')}</div>`;return}
    h+=`<img src="${d.media[im.src]}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${hh}px" alt="">`});
  return h;
}
/* PDF 페이지 */
function xlPageSplit(d,m){
  const sh=d.sheets[m.sheet];const brk=new Set((sh.brk||[]).map(Number));
  const PW=794-60,PH=1123-70;const s=PW/m.W;const maxH=PH/s;
  const blocked=new Set();m.master.forEach((v,k)=>{const r=+k.split(',')[0];m.rows.forEach(x=>{if(x.r>r&&x.r<=v.r2)blocked.add(x.r)})});
  const pages=[];let cur=[],h=0;
  const sum=a=>a.reduce((x,y)=>x+y.h,0);
  m.rows.forEach(row=>{
    if(cur.length&&h+row.h>maxH){
      if(blocked.has(row.r)){let j=cur.length-1;while(j>0&&blocked.has(cur[j].r))j--;
        if(j>0){const rest=cur.splice(j);pages.push(cur);cur=rest;h=sum(rest)}else{pages.push(cur);cur=[];h=0}}
      else{pages.push(cur);cur=[];h=0}}
    cur.push(row);h+=row.h;
    if(brk.has(row.r)){pages.push(cur);cur=[];h=0}
  });
  if(cur.length)pages.push(cur);
  return{pages:pages.filter(p=>p.length),s};
}
function xlPageHtml(d,book,m,rows,s,label){
  const y0=rows[0].y;const hh=rows.reduce((a,x)=>a+x.h,0);
  return`<div class="page xlp"><div class="xlwrap" style="width:${m.W}px;height:${hh}px;transform:scale(${s})">${xlTable(d,book,m,rows)}${xlImages(d,m,rows[0].r,rows[rows.length-1].r,y0)}</div>${label?`<div class="xlab">${esc(label)}</div>`:''}</div>`;
}
function xlCoverHtml(d,book){
  const sh=d.sheets['표지'];if(!sh)return'';const lastR=Math.max(sh.maxr,...(sh.images||[]).map(i=>((i.to||i.from)[0]+1)));const m=xlModel(d,'표지',[1,1,lastR,Math.max(sh.maxc,14)]);
  const s=Math.min((794-40)/m.W,(1123-40)/m.H);
  return`<div class="page xlp"><div class="xlwrap" style="width:${m.W}px;height:${m.H}px;transform:scale(${s});left:${(794-m.W*s)/2}px;top:20px">${xlTable(d,book,m)}${xlImages(d,m,1,1e9,0)}</div></div>`;
}
function xlBook(d,q){const b=new XL.Book(d);(q.inputs||[]).forEach(([k,v])=>{const i=k.lastIndexOf('!');b.inputs[k]=v});
  const dt=/^(\d{4})-(\d{2})-(\d{2})/.exec(q.quoteDate||'');if(dt)b.today=XL.dateToSerial(+dt[1],+dt[2],+dt[3]);return b}
async function xlQuotePages(q,opt){
  opt=opt||{};const d=await loadTpl(q.tplId);const book=xlBook(d,q);
  const sh=d.sheets[q.sheet];const m=xlModel(d,q.sheet,sh.pa||[1,1,sh.maxr,sh.maxc]);
  const out=[];if(q.cover&&opt.cover!==false)out.push(xlCoverHtml(d,book));
  const {pages,s}=xlPageSplit(d,m);pages.forEach((rows,i)=>out.push(xlPageHtml(d,book,m,rows,s,i===0?opt.label:'')));
  return out;
}
/* 다른 화면용 데이터 만들기 */
function xlMaterialize(q,d,book){
  const sh=d.sheets[q.sheet];const S1=q.sheet;const V=(a)=>{const m=/^([A-Z]+)(\d+)$/.exec(a);const v=book.value(S1,+m[2],XL.colNum(m[1]));return XL.isErr(v)?null:v};
  const T=a=>{const v=V(a);return v==null?'':String(v).trim()};
  const hdr={};for(let r=3;r<=10;r++){const b=String((sh.cells['B'+r]||{}).v||'').replace(/\s/g,''),i=String((sh.cells['I'+r]||{}).v||'').replace(/\s/g,'');
    if(b)hdr[b]=T('D'+r);if(i)hdr[i]=T('J'+r)||T('K'+r)}
  q.customer=hdr['업체명']||'';q.contact=hdr['담당자']||'';q.quoteName=hdr['견적명']||'';q.quoteNo=hdr['견적번호']||'';q.quoteOwner=hdr['견적담당']||'';q.salesRep=hdr['영업담당']||'';q.salesCenter=hdr['영업센터']||'';
  q.docTitle=xqInfo(q.tplId).title;q.vat='별도';
  // 품목 → 섹션
  const pa=sh.pa||[1,1,sh.maxr,sh.maxc];const secs=[];let cur=null,title='';
  const mval=(col,r)=>{// 병합 셀이면 시작 셀 값
    const c=XL.colNum(col);const mg=(sh.merges||[]).find(([a,b,e,f])=>r>=a&&r<=e&&c>=b&&c<=f);return mg?V(XL.colStr(mg[1])+mg[0]):V(col+r)};
  for(let r=pa[0];r<=pa[2];r++){
    const b=T('B'+r);if(/^\[/.test(b)&&!/Remarks|비고|참고사항/.test(b)){title=b;cur=null;continue}
    if(!title||/Remarks|비고사항/.test(b))continue;
    const L=V('L'+r),N=V('N'+r),J=V('J'+r),K=T('K'+r);if(!K||typeof J!=='number'||J<=0)continue;
    if(typeof L!=='number'&&typeof L!=='string')continue;
    const grp=String(mval('B',r)||'').replace(/\s/g,'');
    let pay=/월납/.test(grp)?'월납':/연납/.test(grp)?'연납':/월납/.test(title)?'월납':/연납|블루멤버십/.test(title)?'연납':/ONE ?AI/i.test(title)?(K==='월'?'월납':'연납'):/IDC 사용료|D-Cloud 사용료/.test(title)?'월납':'일시납';
    if(/블루멤버십/.test(title)&&typeof L==='number'&&L<=0)continue;
    const key=title+'|'+pay;if(!cur||cur.key!==key){cur={key,title:title.replace(/[\[\]]/g,'').trim()+(/사용료/.test(title)&&/월납|연납/.test(grp)?` (${pay})`:''),payType:pay,payLabel:pay,sumLabel:'',sumGroup:'',subtotalLabel:'',billLabel:'',billTiming:'',billTerms:'',inSummary:true,rows:[]};secs.push(cur)}
    const item=String(mval('E',r)||mval('C',r)||'').replace(/\n/g,' ').trim();
    const free=typeof L==='string'?L:'';
    cur.rows.push({cat:String(mval('B',r)||'').replace(/\n/g,' ').trim(),sub:String(mval('C',r)||'').replace(/\n/g,' ').trim(),item,spec:String(mval('F',r)||'').trim(),
      price:typeof V('I'+r)==='number'?V('I'+r):'',qty:J,unit:K,dc:typeof V('M'+r)==='number'?+(V('M'+r)*100).toFixed(2):'',free,stdOv:typeof L==='number'?L:'',amt:typeof N==='number'?N:'',note:''});
  }
  q.sections=secs.map(s=>{delete s.key;return s});
}

/* ---------- 편집 화면 ---------- */
const X={d:null,book:null,tab:'sheet',zoom:'fit'};
async function openXEditor(q,isNew){
  S.draft=clone(q);S.id=q.id;S.isNew=isNew;setDirty(!!isNew);
  $('#x-title').textContent='양식 불러오는 중…';show('xedit');
  try{X.d=await loadTpl(q.tplId)}catch(e){toast('양식 파일을 불러오지 못했습니다');show('dash');return}
  if(!S.draft.sheet||!X.d.sheets[S.draft.sheet])S.draft.sheet=X.d.quoteSheets[0];
  X.book=xlBook(X.d,S.draft);
  if(isNew&&!(S.draft.inputs||[]).length)xlResetNew();
  xlSyncFlags();X.tab='sheet';renderXBar();renderXBody();
}
function xlResetNew(){const d=X.d;
  (d.sheets['A10_체크리스트']?['A10_체크리스트']:[]).forEach(sh=>{const ins=xlInputs(d,sh);
    Object.entries(ins).forEach(([a,inp])=>{const m=/^([A-Z]+)(\d+)$/.exec(a);const v=X.book.value(sh,+m[2],XL.colNum(m[1]));
      if(inp.t==='num'&&inp.label==='수량'&&typeof v==='number'&&v!==0)setXInput(sh+'!'+a,0);
      if(inp.t==='pct'&&typeof v==='number'&&v!==0)setXInput(sh+'!'+a,null);
      if(sh==='A10_체크리스트'&&inp.label==='고객사명')setXInput(sh+'!'+a,'')})});
  setDirty(true);
}
function xlSyncFlags(){const d=X.d,ck=d.sheets['A10_체크리스트'];if(!ck)return;const sn=S.draft.sheet;
  const want=/VM/.test(sn)?'더존IDC_VM':/임대형/.test(sn)?'더존IDC_월납':/고객IDC/.test(sn)?'고객사IDC':'더존IDC_일시납';
  for(let r=1;r<=16;r++){const lab=String((ck.cells['D'+r]||{}).v||'');if(!/IDC/.test(lab))continue;const key='A10_체크리스트!E'+r;const v=lab===want?'○':'X';if(X.book.value('A10_체크리스트',r,5)!==v)setXInput(key,v)}
}
function renderXBar(){
  const q=S.draft,d=X.d,info=xqInfo(q.tplId);
  $('#x-title').textContent=(q.customer||'새 견적')+' · '+info.name;
  $('#x-tpl').textContent=info.name+' '+info.ver;
  $('#x-sheet').innerHTML=d.quoteSheets.map(n=>`<option value="${esc(n)}"${n===q.sheet?' selected':''}>${esc(sheetLabel(n))}</option>`).join('');
  $('#x-sheet').hidden=d.quoteSheets.length<2;
  $('#x-date').value=q.quoteDate||today();$('#x-status').innerHTML=STATUS.map(s=>`<option${s===q.status?' selected':''}>${s}</option>`).join('');
  $('#x-cover').checked=!!q.cover;
  const hasChk=!!d.sheets['A10_체크리스트'];
  document.querySelectorAll('#x-tabs .btn').forEach(b=>{b.hidden=b.dataset.xt==='chk'&&!hasChk;b.setAttribute('aria-pressed',String(b.dataset.xt===X.tab))});
}
function xlSummaryHtml(){
  const q=S.draft;xlMaterialize(q,X.d,X.book);const t=qTot(q);const disc=t.std-t.amt;
  return`<div class="xsum"><span>일시납 <b>${fmt(t['일시납'])}</b></span><span>월납 <b>${fmt(t['월납'])}</b></span><span>연납 <b>${fmt(t['연납'])}</b></span><span>표준금액 대비 할인 <b>${fmt(disc)}</b> (${t.std?pct(disc/t.std):'0%'})</span><span class="hint">견적번호 ${esc(q.quoteNo||'')}</span></div>`;
}
function renderXBody(){
  const q=S.draft,d=X.d,box=$('#x-body');
  if(X.tab==='pdf'){box.innerHTML='<div class="prev" id="x-prev" style="max-height:none"></div>';xlQuotePages(q).then(p=>showPages(finalize(p),$('#x-prev')));return}
  const sheet=X.tab==='chk'?'A10_체크리스트':q.sheet;const sh=d.sheets[sheet];
  const area=X.tab==='chk'?[1,1,Math.min(sh.maxr,90),8]:(sh.pa||[1,1,sh.maxr,sh.maxc]);
  const extra=[];
  const m=xlModel(d,sheet,area,extra);const inputs=xlInputs(d,sheet);
  box.innerHTML=`${xlSummaryHtml()}<div class="xhint">${X.tab==='chk'?'노란 칸이 입력 칸입니다. 하드웨어 수량과 설치 위치를 정하면 견적서의 하드웨어·IDC·블루멤버십 금액이 자동으로 계산됩니다.':'노란 칸만 입력하면 됩니다(수량, D/C %, 선택 항목, 헤더). 단가·사양·소계·한글 금액은 양식 수식대로 자동 계산됩니다.'}</div>
    <div class="xscroll" id="x-scroll"><div class="xzoom" id="x-zoom" style="width:${m.W}px">${xlTable(d,X.book,m,null,{edit:true,inputs,track:true})}<div style="position:absolute;left:0;top:0">${xlImages(d,m,area[0],area[2],0)}</div></div></div>`;
  applyZoom(m);
}
function applyZoom(m){const sc=$('#x-scroll'),z=$('#x-zoom');if(!sc||!z)return;const W=+z.style.width.replace('px','');const f=X.zoom==='fit'?Math.min(1,(sc.clientWidth-8)/W):X.zoom;z.style.transform=`scale(${f})`;z.style.transformOrigin='0 0';z.parentElement.style.height=(z.offsetHeight*f+10)+'px'}
function refreshX(){
  X.book.cache.clear();document.querySelectorAll('#x-body td[data-f]').forEach(td=>{const a=td.dataset.f;const m=/^([A-Z]+)(\d+)$/.exec(a);
    const sheet=X.tab==='chk'?'A10_체크리스트':S.draft.sheet;const txt=xlText(X.d,X.book,sheet,+m[2],XL.colNum(m[1]));
    const cur=td.firstChild?td.firstChild.textContent:'';if(cur!==txt){if(!txt)td.innerHTML='';else if(td.firstChild)td.firstChild.textContent=txt;else td.innerHTML=`<div class="xv">${esc(txt)}</div>`}});
  const s=$('#x-body .xsum');if(s)s.outerHTML=xlSummaryHtml();
  // 버튼형 선택 표시 갱신
  document.querySelectorAll('#x-body .xi.pick').forEach(b=>{const k=b.dataset.xa;const v=X.book.inputs[k];if(v)b.textContent=v});
  $('#x-title').textContent=(S.draft.customer||'새 견적')+' · '+xqInfo(S.draft.tplId).name;
}
function setXInput(key,v){const q=S.draft;q.inputs=q.inputs||[];const i=q.inputs.findIndex(x=>x[0]===key);if(v===null||v===undefined){if(i>=0)q.inputs.splice(i,1);delete X.book.inputs[key]}else{if(i>=0)q.inputs[i][1]=v;else q.inputs.push([key,v]);X.book.inputs[key]=v}X.book.cache.clear();setDirty(true)}
let xT;
$('#x-body').addEventListener('input',e=>{const el=e.target.closest('.xi');if(!el||el.classList.contains('pick'))return;const key=el.dataset.xa;const a=key.slice(key.lastIndexOf('!')+1);
  const sheet=key.slice(0,key.lastIndexOf('!'));const inp=xlInputs(X.d,sheet)[a];let v=el.value;
  if(inp.t==='num'){v=v.trim()===''?0:num(v)}else if(inp.t==='pct'){v=v.trim()===''?null:num(v)/100}else if(inp.t==='text'){el.style.height='auto';el.style.height=el.scrollHeight+'px'}
  setXInput(key,v);clearTimeout(xT);xT=setTimeout(refreshX,150)});
$('#x-body').addEventListener('change',e=>{const el=e.target.closest('select.xi');if(el){refreshX()}});
$('#x-body').addEventListener('click',e=>{const b=e.target.closest('.xi.pick');if(!b)return;openPick(b.dataset.pick,b.dataset.xa)});
function openPick(kind,key){
  const d=X.d;const sheet=key.slice(0,key.lastIndexOf('!'));const a=key.slice(key.lastIndexOf('!')+1);const r=+a.replace(/\D/g,'');
  const opts=kind==='edu'?eduOptions(d):oneaiOptions(d);
  const pop=$('#x-pick');pop.hidden=false;
  pop.innerHTML=`<div class="xpick"><div class="xph"><b>${kind==='edu'?'교육비 품목 선택':'ONE AI 요금제 선택'}</b><button class="ib" data-close>닫기</button></div>
   <div class="xpl">${opts.map((o,i)=>kind==='edu'?`<div class="xpo"><div><b>${esc(o.name)}</b><div class="hint">${esc(o.spec)}</div></div><div class="xpb">${o.visit!=null?`<button class="ib" data-i="${i}" data-m="visit">방문 ${fmt(o.visit)}</button>`:''}${o.foex!=null?`<button class="ib" data-i="${i}" data-m="foex">FoEX ${fmt(o.foex)}</button>`:''}</div></div>`:`<div class="xpo"><div><b>${esc(o.name)}</b><div class="hint">${esc(o.spec)}</div></div><div class="xpb"><button class="ib" data-i="${i}">${fmt(o.price)}</button></div></div>`).join('')}
   <div class="xpo"><div class="hint">선택 해제 (양식 기본값으로)</div><div class="xpb"><button class="ib" data-i="-1">해제</button></div></div></div></div>`;
  pop.onclick=ev=>{if(ev.target.closest('[data-close]')||ev.target===pop){pop.hidden=true;return}const bt=ev.target.closest('[data-i]');if(!bt)return;const i=+bt.dataset.i;
    const col=a.replace(/\d+/,'');const set=(c,v)=>setXInput(sheet+'!'+c+r,v);
    if(i<0){[col,'F','I','K'].forEach(c=>setXInput(sheet+'!'+c+r,null))}
    else if(kind==='edu'){const o=opts[i];set(col,o.name+(bt.dataset.m==='foex'?' (FoEX)':''));set('F',o.spec);set('I',bt.dataset.m==='foex'?o.foex:o.visit)}
    else{const o=opts[i];set(col,o.name);set('F',o.spec);set('I',o.price);set('K',o.unit)}
    pop.hidden=true;renderXBody()};
}
document.querySelectorAll('#x-tabs .btn').forEach(b=>b.onclick=()=>{X.tab=b.dataset.xt;document.querySelectorAll('#x-tabs .btn').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderXBody()});
$('#x-sheet').onchange=e=>{S.draft.sheet=e.target.value;setDirty(true);xlSyncFlags();X.tab='sheet';renderXBar();renderXBody()};
$('#x-date').oninput=e=>{S.draft.quoteDate=e.target.value;const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(e.target.value);if(m){X.book.today=XL.dateToSerial(+m[1],+m[2],+m[3]);setDirty(true);refreshX()}};
$('#x-status').onchange=e=>{S.draft.status=e.target.value;setDirty(true)};
$('#x-cover').onchange=e=>{S.draft.cover=e.target.checked;setDirty(true);if(X.tab==='pdf')renderXBody()};
$('#x-zoomsel').onchange=e=>{X.zoom=e.target.value==='fit'?'fit':+e.target.value;applyZoom()};
window.addEventListener('resize',()=>{if(S.view==='xedit'&&X.zoom==='fit')applyZoom()});
$('#x-back').onclick=()=>{const b=$('#x-back');if(S.dirty&&!b.dataset.armed){b.dataset.armed='1';b.textContent='저장 안 하고 나가기';setTimeout(()=>{if(b.dataset.armed){delete b.dataset.armed;b.textContent='← 목록'}},3500);return}delete b.dataset.armed;b.textContent='← 목록';S.draft=null;setDirty(false);show('dash')};
$('#x-save').onclick=()=>save();
$('#x-pdf').onclick=async()=>{const b=$('#x-pdf');b.disabled=true;b.textContent='PDF 만드는 중…';try{xlMaterialize(S.draft,X.d,X.book);await exportPdf(finalize(await xlQuotePages(S.draft)),fileBase())}finally{b.disabled=false;b.textContent='PDF 저장'}};
$('#x-html').onclick=async()=>{xlMaterialize(S.draft,X.d,X.book);exportHtml(finalize(await xlQuotePages(S.draft)),fileBase())};
$('#x-dup').onclick=()=>{const q=clone(S.draft);q.id=uid();q.status='작성중';q.quoteDate=today();openXEditor(q,true);toast('복제했습니다. 저장해야 목록에 추가됩니다.')};
$('#x-del').onclick=()=>$('#del').click();
$('#x-mkct').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;const sel=$('#mk-ct');sel.value=v;sel.dispatchEvent(new Event('change'))};
$('#x-mkdc').onclick=()=>$('#mk-dc').click();
function newXQuote(tplId){return{template:'xl',tplId,sheet:'',inputs:[],status:'작성중',quoteDate:today(),cover:true,customer:'',quoteName:'',sections:[]}}
$('#new-x').onchange=e=>{const v=e.target.value;e.target.value='';if(!v)return;const q=newXQuote(v);q.id=uid();openXEditor(q,true)};
$('#new-x').innerHTML='<option value="">새 견적 · 양식 선택…</option>'+XQ_TPLS.map(t=>`<option value="${t.id}">${esc(t.name)} (${t.ver})</option>`).join('');
