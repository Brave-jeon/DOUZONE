async function htmlToPdf(pages){
  const host=$('#export-host');host.innerHTML=pages.join('');
  const pdf=new window.jspdf.jsPDF({orientation:'p',unit:'mm',format:'a4',compress:true});
  const els=[...host.children];
  for(let i=0;i<els.length;i++){
    const c=await html2canvas(els[i],{scale:2,backgroundColor:'#ffffff',logging:false,useCORS:true,width:794,height:1123,windowWidth:1200});
    if(i)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',0.93),'JPEG',0,0,210,297,undefined,'FAST');
  }
  host.innerHTML='';return pdf;
}
async function exportPdf(items,base){
  if(!window.html2canvas||!window.jspdf){toast('PDF 변환 도구를 불러오지 못했습니다. 인쇄용 HTML 저장을 이용해 주세요.');return}
  try{
    const htmlPages=items.filter(x=>typeof x==='string');let blob;
    if(htmlPages.length===items.length||!window.PDFLib){
      if(htmlPages.length!==items.length)toast('약관 PDF를 붙이는 도구를 불러오지 못해 계약서만 저장합니다');
      blob=(await htmlToPdf(htmlPages)).output('blob');
    }else{
      const L=PDFLib;const out=await L.PDFDocument.create();let buf=[];const miss=[];
      const flush=async()=>{if(!buf.length)return;const src=await L.PDFDocument.load((await htmlToPdf(buf)).output('arraybuffer'));(await out.copyPages(src,src.getPageIndices())).forEach(p=>out.addPage(p));buf=[]};
      for(const x of items){
        if(typeof x==='string'){buf.push(x);continue}
        await flush();
        try{const res=await fetch('/_blob/'+x.pdf);if(!res.ok)throw 0;const src=await L.PDFDocument.load(await res.arrayBuffer(),{ignoreEncryption:true});
          let idx=src.getPageIndices();if(x.skipFirst&&idx.length>1)idx=idx.slice(1);(await out.copyPages(src,idx)).forEach(p=>out.addPage(p))}catch(_){miss.push(x.name)}
      }
      await flush();blob=new Blob([await out.save()],{type:'application/pdf'});
      if(miss.length)toast('일부 첨부 PDF를 불러오지 못했습니다: '+miss.join(', '));
    }
    await offer(base+'.pdf',blob);
  }catch(err){toast('PDF 생성 중 오류가 발생했습니다')}
}
function exportHtml(pages,base,missing){
  const css=$('#printcss').textContent;
  const doc=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(base)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap">
<style>${css}
@page{size:A4;margin:0}
html,body{margin:0;background:#8a919c}
.page{margin:16px auto;box-shadow:0 2px 12px rgba(0,0,0,.3)}
.hint{font:13px 'Noto Sans KR',sans-serif;color:#fff;text-align:center;padding:12px;line-height:1.6}
@media print{html,body{background:#fff}.hint{display:none}.page{margin:0;box-shadow:none;page-break-after:always;break-after:page}.page:last-child{page-break-after:auto;break-after:auto}}
</style></head><body><div class="hint">Ctrl+P(⌘+P)로 인쇄하거나 ‘PDF로 저장’을 선택하세요. 용지 A4 · 여백 없음 · 배경 그래픽 켜기${missing&&missing.length?'<br>별도 첨부(이 파일에 포함되지 않음): '+missing.map(esc).join(', '):''}</div>${pages.join('')}</body></html>`;
  return offer(base+'.html',doc);
}
$('#exp-pdf').onclick=async()=>{const b=$('#exp-pdf');b.disabled=true;b.textContent='PDF 만드는 중…';try{await exportPdf(await buildPages(S.draft),fileBase())}finally{b.disabled=false;b.textContent='PDF 저장'}};
$('#exp-html').onclick=async()=>exportHtml(await buildPages(S.draft),fileBase());

