(function(g){'use strict';let pending;
const ready=()=>typeof g.html2canvas==='function'&&g.jspdf&&typeof g.jspdf.jsPDF==='function';
function load(url,timeout){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.crossOrigin='anonymous';s.referrerPolicy='no-referrer';const t=setTimeout(()=>{s.remove();reject(new Error('PDF 도구 시간 초과'));},timeout);s.onload=()=>{clearTimeout(t);resolve();};s.onerror=()=>{clearTimeout(t);s.remove();reject(new Error('PDF 도구 연결 실패'));};document.head.appendChild(s);});}
async function ensure(){if(ready())return true;if(pending)return pending;
pending=(async()=>{
 if(!g.html2canvas)try{await load('./vendor/local-pdf/html2canvas.min.js',1200);}catch(_){}
 if(!g.jspdf)try{await load('./vendor/local-pdf/jspdf.umd.min.js',1200);}catch(_){}
 if(ready())return true;
 if(!g.confirm('PDF 변환 도구가 이 PC에 없습니다. 인터넷에서 공개 라이브러리만 내려받을까요? 문서 내용은 전송하지 않습니다. 취소하면 인쇄용 HTML 저장 후 브라우저 인쇄로 PDF를 만들 수 있습니다.'))return false;
 try{if(!g.html2canvas)await load('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',8000);if(!g.jspdf)await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',8000);return !!ready();}catch(_){return false;}
})().finally(()=>{pending=null;});return pending;}
g.SalesPilotPdfTools={ensure};
})(window);
