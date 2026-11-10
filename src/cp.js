
/* ================= 전자결재 붙여넣기용 본문 (인라인 스타일 HTML) ================= */
const CP_K=1.4; // 인쇄(A4 축소) 글자 크기 → 화면 글자 크기 배율
const CP_SIDES=['top','right','bottom','left'];
function cpPx(v,k){const n=parseFloat(v);return isFinite(n)?Math.round(n*k*2)/2+'px':v}
function cpInline(root){
  const all=[root,...root.querySelectorAll('*')];const cs=new Map(all.map(e=>[e,getComputedStyle(e)]));
  const out=new Map();
  all.forEach(el=>{const c=cs.get(el);const tag=el.tagName;const st=[];
    const add=(k,v)=>{if(v!=null&&v!=='')st.push(k+':'+v)};
    if(c.fontWeight>=600||c.fontWeight==='bold')add('font-weight','bold');
    if(tag!=='BR'&&tag!=='COL'&&tag!=='COLGROUP'){
      if(el===root||c.fontSize!==cs.get(el.parentElement||root).fontSize)add('font-size',cpPx(c.fontSize,CP_K));
      if(el===root||c.color!==cs.get(el.parentElement||root).color)add('color',c.color);
    }
    if(tag==='TABLE'){add('border-collapse','collapse');add('width','100%');add('table-layout','fixed');
      const mt=parseFloat(c.marginTop),mb=parseFloat(c.marginBottom);add('margin',`${mt>0?cpPx(mt,1):'0'} 0 ${mb>0?cpPx(mb,1):'0'} 0`)}
    else if(tag==='TD'||tag==='TH'){
      CP_SIDES.forEach(s=>{const w=parseFloat(c['border-'+s+'-width']),sty=c['border-'+s+'-style'],col=c['border-'+s+'-color'];
        add('border-'+s,(w>0&&sty!=='none'&&!/rgba\(.*,\s*0\)$/.test(col))?`1px solid ${col}`:'none')});
      add('padding',CP_SIDES.map(s=>cpPx(c['padding-'+s],CP_K)).join(' '));
      if(c.backgroundColor&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor))add('background-color',c.backgroundColor);
      add('text-align',c.textAlign==='start'?'left':c.textAlign);add('vertical-align',c.verticalAlign);
      if(c.whiteSpace!=='normal')add('white-space',c.whiteSpace);
      const h=parseFloat(c.height);if(h>26)add('height',cpPx(h,CP_K));
      add('line-height','1.5');add('word-break','keep-all');
    }
    else if(tag==='DIV'||tag==='SPAN'){
      if(tag==='DIV'){const mt=parseFloat(c.marginTop),mb=parseFloat(c.marginBottom);add('margin',`${cpPx(Math.max(0,mt),1)} 0 ${cpPx(Math.max(0,mb),1)} 0`);
        const b=parseFloat(c.borderTopWidth);if(b>0&&c.borderTopStyle!=='none')add('border',`${b>1?2:1}px solid ${c.borderTopColor}`);
        if(parseFloat(c.paddingTop)>0)add('padding',CP_SIDES.map(s=>cpPx(c['padding-'+s],CP_K)).join(' '));
        if(c.textAlign==='center')add('text-align','center');if(c.whiteSpace!=='normal')add('white-space',c.whiteSpace)}
      if(tag==='SPAN'&&el.classList.contains('ck'))add('margin-right','10px');
    }
    out.set(el,st.join(';'));
  });
  // 열 너비 → %
  root.querySelectorAll('table').forEach(t=>{const W=t.getBoundingClientRect().width;const cols=[...t.querySelectorAll(':scope > colgroup > col')];
    if(cols.length&&W){const ws=cols.map(c=>c.getBoundingClientRect().width);cols.forEach((c,i)=>{c.removeAttribute('style');c.setAttribute('width',(ws[i]/W*100).toFixed(2)+'%')})}});
  all.forEach(el=>{if(el.tagName==='COL')return;const s=out.get(el);if(s)el.setAttribute('style',s);else el.removeAttribute('style')});
  all.forEach(el=>{el.removeAttribute('class');[...el.attributes].forEach(a=>{if(a.name.startsWith('data-')||a.name==='aria-label')el.removeAttribute(a.name)})});
}
function cpBuild(blocks,cls){
  const host=document.createElement('div');host.className='page '+cls;
  host.style.cssText='position:fixed;left:-30000px;top:0;height:auto;min-height:0;width:714px;padding:0;overflow:visible;box-shadow:none;margin:0';
  host.innerHTML=blocks.map(b=>b.html).join('');document.body.appendChild(host);
  // 체크박스 → 문자
  host.querySelectorAll('i.cbx').forEach(i=>{const s=document.createElement('span');s.textContent=i.classList.contains('on')?'☑ ':'☐ ';i.replaceWith(s)});
  // 이어지는 표 합치기(같은 열 구성) / 나머지는 위 테두리 겹침 제거
  const sig=t=>[...t.querySelectorAll(':scope > colgroup > col')].map(c=>c.getAttribute('style')||'').join('|');
  [...host.querySelectorAll('table')].forEach(t=>{if(t.style.marginTop!=='-1px')return;const p=t.previousElementSibling;
    if(p&&p.tagName==='TABLE'&&sig(p)&&sig(p)===sig(t)){const pb=p.tBodies[p.tBodies.length-1]||p;[...t.rows].forEach(r=>pb.appendChild(r));t.remove()}
    else{t.style.marginTop='0';const r=t.rows[0];if(r)[...r.cells].forEach(c=>c.style.borderTop='none')}});
  cpInline(host);
  const html=`<div style="font-family:'맑은 고딕','Malgun Gothic',sans-serif;font-size:${cpPx(8.6,CP_K)};color:#1b1f27;line-height:1.5">${host.innerHTML}</div>`;
  host.remove();return html;
}
async function cpCopy(html){
  const plain=(()=>{const d=document.createElement('div');d.innerHTML=html;return d.innerText})();
  try{if(navigator.clipboard&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]);return true}}catch(_){}
  const box=$('#cp-body');const r=document.createRange();r.selectNodeContents(box);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);
  let ok=false;try{ok=document.execCommand('copy')}catch(_){}
  if(ok)sel.removeAllRanges();return ok;
}
let CP={html:'',name:''};
function openCopyBody(title,blocks,cls,name){
  CP={html:cpBuild(blocks,cls),name};$('#cp-title').textContent=title;$('#cp-body').innerHTML=CP.html;$('#cp-modal').hidden=false;$('#cp-go').focus();
}
$('#cp-close').onclick=()=>{$('#cp-modal').hidden=true};
$('#cp-modal').addEventListener('click',e=>{if(e.target.id==='cp-modal')$('#cp-modal').hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#cp-modal').hidden)$('#cp-modal').hidden=true});
$('#cp-go').onclick=async()=>{const ok=await cpCopy(CP.html);toast(ok?'본문을 복사했습니다. 전자결재 본문에 Ctrl+V로 붙여넣으세요.':'자동 복사가 막혀 본문을 선택해 두었습니다. Ctrl+C(⌘+C)로 복사하세요.')};
$('#cp-save').onclick=()=>offer(CP.name+'_본문.html',`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(CP.name)}</title></head><body>${CP.html}</body></html>`);
// 할인기안: 결재 헤더(첫 블록)와 문서정보(마지막) 제외, 이어지는 표 머리(head) 제외
$('#dcopy').onclick=()=>{const B=dcBlocks(S.ddraft);openCopyBody('할인기안 본문',B.slice(1,-1),'tpl-dc',dBase())};
$('#bcopy').onclick=()=>{const B=brBlocks(S.bdraft);const last=B[B.length-1];
  const tail=Object.assign({},last,{html:last.html.replace(/<div class="meta">[\s\S]*<\/div>\s*$/,'')});
  openCopyBody('구축요청서 본문',B.slice(1,-1).concat([tail]),'tpl-dc tpl-br',bBase())};
