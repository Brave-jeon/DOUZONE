/* 하드웨어 견적 업로드 적용 — 양식 수식 보존 규칙:
   I(단가)·L(표준금액)·N(금액) 등 수식 셀은 절대 직접 입력하지 않는다.
   수량은 체크리스트 연동행이면 A10_체크리스트!F{행}, 직접 입력행이면 J 열로,
   품목 선택은 F 드롭다운으로, D/C는 M 입력 셀로만 반영한다.
   적용 전 양식 수식으로 단가·금액을 재계산해 원본 값과 대조하고,
   맞지 않으면 해당 품목을 별도 하드웨어 구간으로 보류한다(값을 지어내지 않음). */
(function(root){
'use strict';
const copy=value=>JSON.parse(JSON.stringify(value));
const num=v=>{if(typeof v==='number')return Number.isFinite(v)?v:null;if(v==null||v==='')return null;const n=parseFloat(String(v).replace(/,/g,''));return Number.isFinite(n)?n:null};
const norm=s=>String(s==null?'':s).replace(/\s+/g,'').toLowerCase();
const colNum=a=>{let n=0;for(let i=0;i<a.length;i++)n=n*26+a.charCodeAt(i)-64;return n};
const won=n=>Number(Math.round(n)).toLocaleString('ko-KR');
const isF=c=>!!c&&'f' in c;
const sheetAt=(template,sheet)=>template&&template.sheets?template.sheets[sheet]:null;
const cellAt=(template,sheet,addr)=>{const sh=sheetAt(template,sheet);return sh&&sh.cells?sh.cells[addr]:null};

function keyIsFormula(template,key){
  const i=key.lastIndexOf('!');const sh=sheetAt(template,key.slice(0,i));
  if(!sh)return true;
  return isF(sh.cells[key.slice(i+1)]);
}
function checklistRowFor(book,template,sheet,row){
  const a=book.value(sheet,row,1);
  if(a==null||a==='')return null;
  const chk=sheetAt(template,'A10_체크리스트');if(!chk||!chk.cells)return null;
  const target=String(a);
  for(let r=1;r<=(chk.maxr||0);r++){const c=chk.cells['A'+r];if(c&&!isF(c)&&String(c.v)===target)return r}
  return null;
}
function dvFor(template,sheet,addr){
  const sh=sheetAt(template,sheet);if(!sh||!sh.dv)return null;
  const m=/^([A-Z]+)(\d+)$/.exec(addr);if(!m)return null;
  const c=colNum(m[1]),row=+m[2];
  for(const dv of sh.dv){
    if(/#REF|\\|\[/.test(String(dv.f||'')))continue;
    for(const rg of String(dv.sqref||'').split(/\s+/)){
      const mm=/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(rg);if(!mm)continue;
      if(c<colNum(mm[1])||c>colNum(mm[3]||mm[1])||row<+mm[2]||row>+(mm[4]||mm[2]))continue;
      return dv;
    }
  }
  return null;
}
function dvOptions(book,dv){
  const m=/^'?([^'!]+)'?!\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/.exec(String(dv.f||''));
  if(!m)return[];
  const out=[];
  for(let r=+m[3];r<=+m[5];r++){const v=book.value(m[1],r,colNum(m[2]));if(v!=null&&v!=='')out.push(String(v))}
  return out;
}
function matchOption(name,options){
  const n=norm(name);if(!n)return null;
  for(const o of options)if(norm(o)===n)return o;
  for(const o of options){const on=norm(o);if(on.length>1&&(on.includes(n)||n.includes(on)))return o}
  return null;
}

function applyItem(item,ctx){
  const template=ctx.template,book=ctx.book;
  const t=item.target,sheet=t.sheet,row=t.row;
  const sh=sheetAt(template,sheet);
  if(!sh)return{ok:false,reason:'양식에 대상 시트가 없습니다: '+sheet};
  const plan=[];
  const revert=()=>{for(const [k] of plan){if(k in ctx.savedInputs)book.inputs[k]=ctx.savedInputs[k];else delete book.inputs[k]}book.cache.clear()};
  try{
    const set=(key,v)=>{
      if(ctx.usedKeys.has(key))throw new Error('다른 품목과 입력 셀이 겹칩니다: '+key);
      if(keyIsFormula(template,key))throw new Error('양식 수식 셀은 직접 입력할 수 없습니다: '+key);
      plan.push([key,v]);
    };
    const jc=sh.cells['J'+row],jf=isF(jc)?String(jc.f):'';
    const chkLinked=isF(jc)&&/체크리스트/.test(jf);
    if(chkLinked){
      const chk=checklistRowFor(book,template,sheet,row);
      if(!chk)throw new Error('체크리스트에서 품목 키(A열)를 찾지 못했습니다: '+sheet+' '+row+'행');
      const fc=cellAt(template,'A10_체크리스트','F'+chk);
      if(isF(fc))throw new Error('체크리스트 수량 셀이 수식이라 입력 경로가 없습니다.');
      if(fc&&fc.v!=null&&fc.v!==''&&typeof fc.v!=='number')throw new Error('체크리스트 수량 셀이 숫자가 아닙니다.');
      const cur=num(book.value('A10_체크리스트',chk,6));
      if(cur==null||cur!==item.quantity)set('A10_체크리스트!F'+chk,item.quantity);
    }else if(!isF(jc)){
      const cur=num(book.value(sheet,row,colNum('J')));
      if(cur==null||cur!==item.quantity)set(sheet+'!J'+row,item.quantity);
    }else{
      throw new Error('수량 셀이 예상 밖의 수식이라 입력 경로를 확인할 수 없습니다.');
    }
    const notes=[];
    const fcell=sh.cells['F'+row];
    if(!chkLinked&&!isF(fcell)){
      const dv=dvFor(template,sheet,'F'+row);
      const cur=book.value(sheet,row,colNum('F'));
      const curS=cur==null||cur===''?'':String(cur);
      if(dv){
        const opt=matchOption(item.name,dvOptions(book,dv));
        if(opt){
          if(norm(opt)!==norm(curS)){set(sheet+'!F'+row,opt);notes.push('품목 선택을 "'+opt+'"으로 설정했습니다.')}
        }else if(!curS){
          throw new Error('양식 드롭다운 옵션에서 품목을 찾지 못했습니다: '+item.name);
        }
      }
    }
    for(const [k,v] of plan)book.inputs[k]=v;
    book.cache.clear();
    const I=num(book.value(sheet,row,colNum('I')));
    const L=num(book.value(sheet,row,colNum('L')));
    if(I==null||I<=0)throw new Error('양식 단가표에서 단가를 조회하지 못했습니다. 품목 규격을 확인해 주세요.');
    if(L==null||L<=0)throw new Error('양식 표준금액 계산이 실패했습니다.');
    const diff=item.amount-L;
    const noDc=/할인\s*불가|할인불가/.test(String((sh.cells['S'+row]||{}).v||''));
    let mVal=0;
    if(diff<-0.01){
      if(noDc)throw new Error('할인 불가 품목입니다. 양식 표준 금액('+won(L)+'원)과 원본 금액('+won(item.amount)+'원)이 다릅니다.');
      const rate=-diff/L;
      if(!(rate>0&&rate<0.95))throw new Error('원본 금액이 표준 금액 대비 95% 이상 낮아 자동 반영하지 않습니다.');
      mVal=rate;notes.push('표준 금액 대비 D/C '+(rate*100).toFixed(2)+'%를 양식 규칙으로 계산해 반영했습니다.');
    }else if(diff>0.01){
      throw new Error('원본 금액이 양식 표준 금액('+won(L)+'원)보다 높아 자동 반영하지 않습니다.');
    }
    const curM=num(book.value(sheet,row,colNum('M')));
    if(curM==null||Math.abs(curM-mVal)>=1e-9)set(sheet+'!M'+row,mVal);
    for(const [k,v] of plan)book.inputs[k]=v;
    book.cache.clear();
    const N=num(book.value(sheet,row,colNum('N')));
    if(N==null||N<=0)throw new Error('양식 절사 규칙(천원단위)에서 금액이 0이 됩니다. 원본 금액을 확인해 주세요.');
    if(Math.abs(N-item.amount)>1000)throw new Error('양식 계산 금액('+won(N)+'원)이 원본 금액('+won(item.amount)+'원)과 맞지 않습니다.');
    if(Math.abs(N-item.amount)>0.01)notes.push('양식 표기금액은 천원단위 절사 규칙으로 '+won(N)+'원입니다 (원본 '+won(item.amount)+'원).');
    return{ok:true,inputs:plan,notes};
  }catch(e){
    revert();
    return{ok:false,reason:e.message||'적용에 실패했습니다.'};
  }
}

function apply(payload,quote,template,book,setInput){
  if(!payload||!Array.isArray(payload.items)||!payload.items.length)throw new Error('적용할 하드웨어 품목이 없습니다.');
  if(!template||!template.sheets||!book||typeof book.value!=='function'||typeof setInput!=='function')throw new Error('양식·계산 엔진이 연결되지 않아 기존 견적을 변경하지 않았습니다.');
  const payloadVat=String(payload.vat||'').toLowerCase();
  for(const item of payload.items){
    if(!['KRW','WON','원'].includes(String(item.currency||'').toUpperCase()))throw new Error('현재 견적은 원화 항목만 자동 적용합니다. 원본 통화를 확인해 주세요.');
    const vatBasis=String(item.vatBasis||payloadVat||'').toLowerCase();
    if(vatBasis!=='exclusive')throw new Error('현재 견적은 부가세 별도 기준입니다. 원본의 공급가액과 단가를 확인해 주세요.');
    if(!Number.isFinite(item.quantity)||item.quantity<=0||!Number.isFinite(item.unitPrice)||item.unitPrice<0||!Number.isFinite(item.amount)||item.amount<0)throw new Error('품목 수량·단가·금액을 원본과 대조해 입력해 주세요.');
    if(Math.abs(item.unitPrice*item.quantity-item.amount)>0.01)throw new Error('단가×수량과 원본 금액이 다릅니다. 할인 또는 금액 기준을 확인해 주세요.');
  }
  const previous={inputs:copy(quote.inputs||[]),hardwareImported:quote.hardwareImported?copy(quote.hardwareImported):null};
  const ctx={template,book,usedKeys:new Set(),savedInputs:Object.assign({},book.inputs)};
  const applied=[],deferred=[],commit=[];
  for(const item of payload.items){
    if(!item.target){item.applied=false;deferred.push(item);continue}
    const res=applyItem(item,ctx);
    if(res.ok){
      item.applied=true;
      if(res.notes.length)item.notes=(Array.isArray(item.notes)?item.notes.slice():[]).concat(res.notes);
      applied.push(item);
      res.inputs.forEach(([k,v])=>{ctx.usedKeys.add(k);commit.push([k,v])});
    }else{
      item.applied=false;item.target=null;
      item.flags=Array.isArray(item.flags)?item.flags.slice():[];
      if(!item.flags.includes(res.reason))item.flags.push(res.reason);
      deferred.push(item);
    }
  }
  if(!applied.length){
    const last=deferred[deferred.length-1];
    const reason=last&&Array.isArray(last.flags)&&last.flags.length?last.flags[last.flags.length-1]:'적용 가능한 품목이 없습니다.';
    throw new Error('하드웨어 품목을 자동 반영하지 못했습니다. '+reason+' — 해당 품목은 원본 대조 후 수동 입력이 필요합니다.');
  }
  commit.forEach(([k,v])=>setInput(k,v));
  quote.hardwareIncluded=true;
  quote.hardwareImported={enabled:true,sourceFile:copy(payload.sourceFile||{}),items:copy(payload.items),previous,appliedAt:new Date().toISOString(),summary:{applied:applied.length,deferred:deferred.length}};
  return quote.hardwareImported;
}

function materialize(quote){
  if(quote.hardwareIncluded===false){quote.sections=(quote.sections||[]).filter(section=>!/하드웨어|H\/W/i.test(section.title||''));return;}
  const uploaded=quote.hardwareImported;
  if(!uploaded||!uploaded.enabled)return;
  const extra=(uploaded.items||[]).filter(item=>!item.target);
  if(!extra.length)return;
  const rows=extra.map(item=>({cat:'하드웨어',sub:'업로드 견적',item:item.name,spec:item.sku||'',price:item.unitPrice,qty:item.quantity,unit:item.unit||'',dc:0,free:'',stdOv:item.amount,amt:item.amount,note:['업로드 원본 확인 금액'].concat(Array.isArray(item.flags)?item.flags:[]).join(' / ')}));
  quote.sections=(quote.sections||[]).filter(section=>section.key!=='hardware-upload');
  quote.sections.push({key:'hardware-upload',title:'업로드 하드웨어 견적',payType:'일시납',payLabel:'일시납',sumLabel:'',sumGroup:'',subtotalLabel:'',billLabel:'',billTiming:'',billTerms:'',inSummary:true,rows});
}

root.SalesPilotHardwareIntegration={apply,materialize};
if(typeof module==='object'&&module.exports)module.exports=root.SalesPilotHardwareIntegration;
})(typeof window!=='undefined'?window:globalThis);
