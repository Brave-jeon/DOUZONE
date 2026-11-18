(function(g){
'use strict';
const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const modules=['회계','인사','예산','구매','영업','무역','생산','원가','UC확장팩'];
function flags(text){const t=norm(text),out=new Set();modules.forEach(m=>{if(t.includes(norm(m)))out.add(m)});return out}
function rows(d,sheet,inputs){const sh=d.sheets[sheet];let section='';const license=[],education=[];
 for(let r=1;r<=sh.maxr;r++){const b=String((sh.cells['B'+r]||{}).v||'');if(/^\s*\[/.test(b))section=b;
  const e=Object.keys(inputs).find(a=>a.replace(/\D/g,'')===String(r)&&inputs[a].t==='edu');
  if(e)education.push({r,key:sheet+'!'+e});
  if(/라이선스/.test(section)&&inputs['J'+r]&&inputs['J'+r].label==='수량')license.push(r);
 }return {license,education};
}
function deleted(q,sheet){return new Set((q.excludedRows||[]).filter(k=>k.startsWith(sheet+'!')).map(k=>+k.slice(k.lastIndexOf('!')+1)))}
function canDelete(d,sheet,r,inputs){return !!(inputs['J'+r]&&inputs['J'+r].label==='수량')}
function canDeleteSection(d,sheet,r,inputs){const s=sectionOf(d,sheet,r,inputs);return !!(s&&s.items.length)}
function applyExcluded(book,q,d){for(const key of q.excludedRows||[]){const i=key.lastIndexOf('!'),s=key.slice(0,i),r=+key.slice(i+1);if(!d.sheets[s]||!Number.isInteger(r))continue;
 ['J','L','N'].forEach(c=>{if(d.sheets[s].cells[c+r])book.inputs[s+'!'+c+r]=0});}book.cache.clear();}
function put(q,book,key,value){q.inputs=q.inputs||[];const i=q.inputs.findIndex(x=>x[0]===key);if(value===null){if(i>=0)q.inputs.splice(i,1);delete book.inputs[key]}else{if(i>=0)q.inputs[i][1]=value;else q.inputs.push([key,value]);book.inputs[key]=value;}book.cache.clear();}
function proposal(d,book,sheet,inputs,options,config,q){const info=rows(d,sheet,inputs),selected=new Set(),excluded=deleted(q,sheet),unmatched=[];
 for(const r of info.license){if(excluded.has(r)||!(Number(book.value(sheet,r,10))>0))continue;
  const text=['C','D','E'].map(c=>String((d.sheets[sheet].cells[c+r]||{}).v||'')).join(' ');const fs=flags(text);fs.forEach(m=>selected.add(m));
 }
 const chosen=[],covered=new Set(),kind=config.target==='비영리'?'비영리':'영리';
 const valid=o=>typeof o[config.mode]==='number';
 const add=o=>{if(o&&!chosen.some(x=>norm(x.name)===norm(o.name))){if(valid(o))chosen.push(o);else unmatched.push(o.name+' — 선택한 교육 방식의 단가 없음')}};
 const sets=options.map(o=>({o,parts:flags(o.name.split('교육비')[0])})).filter(x=>/SET/i.test(x.o.name)&&x.parts.size&&Array.from(x.parts).every(m=>selected.has(m))).sort((a,b)=>b.parts.size-a.parts.size);
 if(config.setFirst!==false)for(const set of sets){if(Array.from(set.parts).some(m=>covered.has(m)))continue;add(set.o);set.parts.forEach(m=>covered.add(m));}
 for(const m of selected){if(covered.has(m))continue;
  const candidates=options.filter(o=>!(/SET|공통/i.test(o.name))&&flags(o.name).has(m));
  let o=candidates.find(o=>((m==='예산'||m==='UC확장팩')?norm(o.name).includes(norm(kind))&&!norm(o.name).includes(norm(kind==='영리'?'비영리':'__없음__')):true)&&norm(o.name).includes(norm(m+(m==='UC확장팩'?'':'관리')+'교육비')));
  if(!o&&candidates.length===1)o=candidates[0];
  if(o)add(o);else unmatched.push(m+' — 정확한 단가표 매핑 확인 필요');
 }
 const erp=Array.from(selected).some(m=>['회계','인사','예산','UC확장팩'].includes(m));const logistics=Array.from(selected).some(m=>['구매','영업','무역','생산','원가'].includes(m));
 if(erp&&!Array.from(covered).some(m=>['회계','인사','UC확장팩'].includes(m)))add(options.find(o=>/ERP공통/.test(o.name.replace(/\s/g,''))));
 if(logistics&&!Array.from(covered).some(m=>['구매','영업','무역','생산','원가'].includes(m)))add(options.find(o=>/물류공통/.test(o.name.replace(/\s/g,''))));
 return {info,chosen,unmatched,selected:Array.from(selected)};
}
function sync(args){const {d,book,q,sheet,inputs,options}=args;const config=q.educationConfig||{mode:'visit',target:'영리',setFirst:true};if(config.enabled===false)return {added:0,issues:[]};
 const p=proposal(d,book,sheet,inputs,options,config,q),removed=deleted(q,sheet);q.autoEducation=q.autoEducation||{};q.educationSkipped=q.educationSkipped||{};
 const desired=new Map(p.chosen.filter(o=>!(q.educationSkipped[sheet]||[]).includes(norm(o.name))).map(o=>[norm(o.name),o]));
 // Only clear values owned by the automatic generator. Manual input is retained.
 for(const [key,record] of Object.entries(q.autoEducation)){if(!key.startsWith(sheet+'!'))continue;
  if(!desired.has(norm(record.name))||removed.has(record.r)){for(const [k,v] of Object.entries(record.fields)){const input=(q.inputs||[]).find(x=>x[0]===k);if(input&&input[1]===v)put(q,book,k,null);}delete q.autoEducation[key];}
 }
 const occupied=new Set();for(const slot of p.info.education){const val=book.value(sheet,slot.r,slot.key.slice(sheet.length+1).replace(/\d/g,'').split('').reduce((n,c)=>n*26+c.charCodeAt(0)-64,0));if(val&&!/시트에서|선택|기입/.test(String(val)))occupied.add(norm(val).replace(/\(foex\)$/,''));}
 let added=0;const issues=p.unmatched.slice();
 for(const [name,o] of desired){const owned=Object.entries(q.autoEducation).find(([key,rec])=>key.startsWith(sheet+'!')&&norm(rec.name)===name);if(owned){const [key,rec]=owned;const updated={[key]:o.name+(config.mode==='foex'?' (FoEX)':''),[sheet+'!F'+rec.r]:o.spec,[sheet+'!I'+rec.r]:o[config.mode]};for(const [k,v] of Object.entries(updated)){put(q,book,k,v);rec.fields[k]=v;}continue;}if(occupied.has(name))continue;
  const slot=p.info.education.find(s=>{if(removed.has(s.r)||q.autoEducation[s.key])return false;const value=(q.inputs||[]).find(x=>x[0]===s.key);return !value||!value[1]||/시트에서|선택/.test(String(value[1]));});
  if(!slot){issues.push(o.name+' — 빈 교육비 행 부족');continue;}
  const display=o.name+(config.mode==='foex'?' (FoEX)':'');const fields={[slot.key]:display,[sheet+'!F'+slot.r]:o.spec,[sheet+'!I'+slot.r]:o[config.mode],[sheet+'!J'+slot.r]:1};
  for(const [k,v] of Object.entries(fields))put(q,book,k,v);q.autoEducation[slot.key]={r:slot.r,name:o.name,fields};occupied.add(name);added++;
 }
 return {added,count:Object.keys(q.autoEducation).filter(k=>k.startsWith(sheet+'!')).length,issues,selected:p.selected};
}
function manual(q,key){for(const [owner,rec] of Object.entries(q.autoEducation||{})){if(Object.prototype.hasOwnProperty.call(rec.fields,key)){delete q.autoEducation[owner];}}}
function remove(q,sheet,r,d,inputs){q.excludedRows=q.excludedRows||[];const key=sheet+'!'+r;if(!q.excludedRows.includes(key))q.excludedRows.push(key);
 for(const [owner,rec] of Object.entries(q.autoEducation||{})){if(owner.startsWith(sheet+'!')&&rec.r===r){q.educationSkipped=q.educationSkipped||{};q.educationSkipped[sheet]=q.educationSkipped[sheet]||[];q.educationSkipped[sheet].push(norm(rec.name));}}
 if(d)collapseEmptySections(q,d,sheet,inputs);
}
function restore(q,sheet){q.excludedRows=(q.excludedRows||[]).filter(k=>!k.startsWith(sheet+'!'));if(q.educationSkipped)delete q.educationSkipped[sheet];}
function rawSections(d,sheet){const sh=d.sheets[sheet];const out=[];let cur=null;
 for(let r=1;r<=sh.maxr;r++){const b=String((sh.cells['B'+r]||{}).v||'');
  if(/^\s*\[/.test(b)&&!/Remarks|비고|참고사항/.test(b)){cur={title:b.replace(/^\s*\[|\]\s*$/g,'').trim(),header:r,items:[],subtotals:[]};out.push(cur);continue}
  if(!cur)continue;
  const c=String((sh.cells['B'+r]||{}).v||'');
  const sumFx=['L','M','N'].some(cc=>{const cell=sh.cells[cc+r];const f=cell&&typeof cell==='object'?cell.f:null;return typeof f==='string'&&/^SUM\(/i.test(f.replace(/\s+/g,''))});
  if(/(소계|합계|총계)/.test(c.replace(/\s+/g,''))||/(소계|합계|총계)/.test(b.replace(/\s+/g,''))||sumFx)cur.subtotals.push(r);
  else cur.items.push(r);
 }return out;}
function isHeaderOrSub(d,sheet,r){const rs=rawSections(d,sheet);return rs.some(x=>x.header===r||x.subtotals.includes(r));}
function collapseEmptySections(q,d,sheet,inputs){const rs=rawSections(d,sheet);let changed=false;
 for(const s of rs){const items=s.items.filter(r=>!(q.excludedRows||[]).includes(sheet+'!'+r));
  if(items.length)continue;
  [s.header,...s.subtotals].forEach(rr=>{const key=sheet+'!'+rr;if(!(q.excludedRows||[]).includes(key)){q.excludedRows.push(key);changed=true}});}
 return changed;}
function sections(d,sheet,inputs){const sh=d.sheets[sheet];const out=[];let cur=null;
 for(let r=1;r<=sh.maxr;r++){const b=String((sh.cells['B'+r]||{}).v||'');
  if(/^\s*\[/.test(b)&&!/Remarks|비고|참고사항/.test(b)){cur={title:b.replace(/^\s*\[|\]\s*$/g,'').trim(),header:r,items:[],subtotals:[]};out.push(cur);continue}
  if(!cur)continue;
  if(canDelete(d,sheet,r,inputs))cur.items.push(r);
  const c=String((sh.cells['B'+r]||{}).v||'');
  const sumFx=['L','M','N'].some(cc=>{const cell=sh.cells[cc+r];const f=cell&&typeof cell==='object'?cell.f:null;return typeof f==='string'&&/^SUM\(/i.test(f.replace(/\s+/g,''))});
  if(/(소계|합계|총계)/.test(c.replace(/\s+/g,''))||/(소계|합계|총계)/.test(b.replace(/\s+/g,''))||sumFx)cur.subtotals.push(r);
 }return out.filter(s=>s.items.length);}
function sectionOf(d,sheet,r,inputs){const ss=sections(d,sheet,inputs);return ss.find(s=>r>=s.header&&(s.items.includes(r)||s.subtotals.includes(r))||r>s.header&&ss.indexOf(s)<ss.length-1&&r<ss[ss.indexOf(s)+1].header)||null;}
function removeSection(q,d,sheet,r,inputs){const s=sectionOf(d,sheet,r,inputs);if(!s)return false;
 q.excludedRows=q.excludedRows||[];
 [s.header,...s.items,...s.subtotals].forEach(rr=>{const key=sheet+'!'+rr;if(!q.excludedRows.includes(key))q.excludedRows.push(key)});
 for(const [owner,rec] of Object.entries(q.autoEducation||{})){if(owner.startsWith(sheet+'!')&&s.items.includes(rec.r)){q.educationSkipped=q.educationSkipped||{};q.educationSkipped[sheet]=q.educationSkipped[sheet]||[];q.educationSkipped[sheet].push(norm(rec.name));}}
 return true;}
function restoreOne(q,d,sheet,r,inputs){const key=sheet+'!'+r;q.excludedRows=(q.excludedRows||[]).filter(k=>k!==key);
 const s=sectionOf(d,sheet,r,inputs);
 if(s){const allGone=s.items.every(x=>q.excludedRows.includes(sheet+'!'+x));
  if(allGone)[s.header,...s.subtotals].forEach(rr=>{q.excludedRows=q.excludedRows.filter(k=>k!==sheet+'!'+rr)});}
 else{const rs=rawSections(d,sheet);const raw=rs.find(x=>x.header===r||x.subtotals.includes(r));
  if(raw){const anyItem=(q.excludedRows||[]).some(k=>raw.items.some(x=>k===sheet+'!'+x));
   if(!anyItem)[raw.header,...raw.subtotals].forEach(rr=>{q.excludedRows=q.excludedRows.filter(k=>k!==sheet+'!'+rr)});}}
 if(q.educationSkipped&&q.educationSkipped[sheet]){const rec=(q.autoEducation||{})[key];if(rec)q.educationSkipped[sheet]=q.educationSkipped[sheet].filter(n=>n!==norm(rec.name));}
}
function deletedList(q,d,sheet,inputs){const sh=d&&d.sheets&&d.sheets[sheet];if(!sh)return[];
 const ss=sections(d,sheet,inputs);
 const rs=rawSections(d,sheet);
 const val=a=>{const c=sh.cells[a];const v=c&&typeof c==='object'?c.v:c;return v==null?'':String(v).replace(/\s+/g,' ').trim()};
 return (q.excludedRows||[]).filter(k=>k.startsWith(sheet+'!')).map(k=>+k.slice(k.lastIndexOf('!')+1)).sort((a,b)=>a-b)
  .map(r=>{const sec=ss.find(s=>r>=s.header&&(s.items.includes(r)||s.subtotals.includes(r))||r>s.header&&ss.indexOf(s)<ss.length-1&&r<ss[ss.indexOf(s)+1].header);
   const isSec=sec&&r===sec.header;
   const raw=rs.find(x=>x.header===r||x.subtotals.includes(r));
   const title=sec?sec.title:raw?raw.title:null;
   const item=val('E'+r)||val('C'+r)||val('B'+r);
   const b=val('B'+r);
   if(title&&r===(sec?sec.header:raw.header))return {r,label:`[${title}] 구역 전체`};
   if(title&&raw&&raw.subtotals.includes(r))return {r,label:`[${title}] ${b||'소계'}`.replace('소계','소계 행')};
   if(title)return {r,label:`[${title}] ${item||r+'행'}`};
   return {r,label:item||b||r+'행'};});}
g.SalesPilotRows={rows,deleted,canDelete,canDeleteSection,applyExcluded,proposal,sync,manual,remove,restore,sections,sectionOf,removeSection,restoreOne,deletedList};
})(typeof window!=='undefined'?window:globalThis);
