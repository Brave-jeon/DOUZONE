/* ---------- 페이지 나누기 ---------- */
const CONTENT_H=1123-34-46,CT_H=1123-84-46;
let fontsReady=document.fonts?document.fonts.ready.catch(()=>{}):Promise.resolve();
async function paginate(blocks,cls,H){
  await fontsReady;
  const real=blocks.filter(b=>!b.brk);
  const m=$('#measure');m.innerHTML=`<div class="page ${cls} measure" id="m-in"></div>`;const mi=$('#m-in');
  const heads=[...new Set(real.map(b=>b.head).filter(Boolean))];
  mi.innerHTML=real.map(b=>`<div class="blk">${b.html}</div>`).join('')+heads.map(h=>`<div class="blk">${h}</div>`).join('');
  const kids=[...mi.children];const hm=new Map();real.forEach((b,i)=>hm.set(b,kids[i].getBoundingClientRect().height));
  const hh=new Map(heads.map((h,i)=>[h,kids[real.length+i].getBoundingClientRect().height]));
  m.innerHTML='';
  const pages=[];let cur=[],used=0;
  blocks.forEach((b,i)=>{
    if(b.brk){if(cur.length){pages.push(cur);cur=[];used=0}return}
    const nx=blocks[i+1];const h=hm.get(b);
    const need=h+(b.keep&&nx&&!nx.brk?hm.get(nx):0);
    if(used>0&&used+need>H){pages.push(cur);cur=[];used=0;if(b.head){cur.push(b.head);used+=hh.get(b.head)}}
    cur.push(b.html);used+=h;
  });
  if(cur.length)pages.push(cur);
  return pages;
}
const QFOOT=`<div class="pfoot"><span>Copyright ⓒ 회사01. All rights reserved.</span><span>__PN__ / __PT__</span></div>`;
async function quotePages(q,opt){
  opt=opt||{};const tpl=q.template==='we'?'we':'a10';
  const qq=opt.title?Object.assign({},q,{docTitle:opt.title}):q;
  const blocks=tpl==='we'?weBlocks(qq):a10Blocks(qq);
  if(opt.label)blocks.unshift({html:`<div class="att-label">${esc(opt.label)}</div>`,keep:true});
  const pages=await paginate(blocks,'tpl-'+tpl,CONTENT_H);
  const out=[];
  if(tpl==='a10'&&q.cover&&opt.cover!==false){
    out.push(`<div class="page tpl-a10"><div class="cover"><div class="band"></div><div class="mid"><div class="cn">${esc(q.customer)}</div><div class="line"></div><div class="ct">${esc(q.coverTitle||'가격제안서')}</div><div class="cs">회사01 Estimate statement</div></div>
     <div class="bot"><div><div class="cd">${kDate(q.quoteDate)}</div><div class="cr">Copyright ⓒ 회사01. All rights reserved.</div></div><span class="dzlogo">DOUZONE</span></div></div></div>`);
  }
  pages.forEach(p=>out.push(`<div class="page tpl-${tpl}">${p.map(h=>`<div class="blk">${h}</div>`).join('')}${QFOOT}</div>`));
  return out;
}
function finalize(pages){const n=pages.filter(p=>typeof p==='string').length;let k=0;return pages.map(p=>typeof p==='string'?p.replace(/__PN__/g,String(++k)).replace(/__PT__/g,String(n)):p)}
async function buildPages(q){return finalize(await quotePages(q))}
function showPages(pages,box){
  const avail=Math.max(200,box.clientWidth-28);const sc=Math.min(1,avail/794);
  box.innerHTML=pages.map(p=>`<div class="pg-wrap" style="width:${794*sc}px;height:${1123*sc}px">${p.replace('class="page','style="transform:scale('+sc+')" class="page')}</div>`).join('');
}

