/* Output-only layout. Input catalogues and spreadsheet formulas are never changed. */
(function (root) {
  'use strict';
  const W = 794, H = 1123, M = 10 * 96 / 25.4;
  const FOOT = 'CCO 공공기관본부 내부용  · Copyright © DOUZONE BIZON AX영업Unit. All rights reserved.';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const present = v => v !== '' && v != null;
  const number = v => typeof v === 'number' ? v : Number(String(v || '').replace(/,/g, ''));
  const fmt = v => !present(v) ? '' : Number.isFinite(number(v)) ? number(v).toLocaleString('ko-KR') : String(v);
  const selected = r => number(r.qty) > 0 || (present(r.amt) && number(r.amt) !== 0) || r.selected === true || r.on === true;
  function sections(q) {
    return (q.sections || []).map(s => Object.assign({}, s, {rows:(s.rows || []).filter(selected)})).filter(s => s.rows.length);
  }
  function value(r, kind, opt) {
    if (r.free) return kind === 'std' ? '—' : r.free;
    const direct = kind === 'std' ? r.stdOv : r.amt;
    if (present(direct)) return fmt(direct);
    const fn = kind === 'std' ? opt.rStd || (typeof rStd === 'function' ? rStd : null) : opt.rAmt || (typeof rAmt === 'function' ? rAmt : null);
    return fn ? fmt(fn(r)) : '';
  }
  function total(s, opt) {
    const fn = opt.secTot || (typeof secTot === 'function' ? secTot : null);
    return fn ? fn(s) : s.totals || {std:s.std, amt:s.amt};
  }
  const CSS = `.spql.page{box-sizing:border-box!important;width:${W}px!important;height:${H}px!important;padding:${M}px!important;position:relative!important;background:#fff;color:#202833;font:10px/1.5 'Noto Sans KR','Malgun Gothic',sans-serif;overflow:visible!important;transform-origin:top left}.spql *{box-sizing:border-box}.spql .ql-body{height:${H-2*M-34}px;display:flow-root}.spql h1{font-size:24px;line-height:1.3;margin:0 0 14px;color:#263651;border-bottom:3px solid #8169ff;padding-bottom:12px}.spql h2{font-size:13px;margin:10px 0 6px;color:#00668a}.spql p{margin:5px 0;white-space:pre-wrap;overflow-wrap:anywhere}.spql table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0;font-size:9px;line-height:1.45}.spql th,.spql td{border:1px solid #bac3cc;padding:5px 4px;vertical-align:middle;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal}.spql th{background:#00668a;color:#fff;font-weight:700;text-align:center}.spql .ql-n{text-align:right;font-variant-numeric:tabular-nums}.spql .ql-sum td{background:#edf3f8;font-weight:700}.spql .ql-meta{font-size:10px;margin-bottom:12px}.spql .ql-meta td{background:#fff}.spql .ql-meta td:nth-child(odd){width:15%;background:#edf3f8;font-weight:700}.spql .ql-meta td:nth-child(even){width:35%}.spql .ql-footer{position:absolute;left:${M}px;right:${M}px;bottom:${M}px;min-height:24px;border-top:1px solid #cdd4df;padding-top:7px;font-size:7.2px;line-height:1.3;text-align:center;white-space:normal;overflow-wrap:anywhere}.spql .ql-cover{padding-top:110px}.spql .ql-cover h1{font-size:34px;margin-top:30px}.spql .ql-cover .ql-customer{font-size:23px}.spql .ql-page-title{font-size:10px;color:#657184;margin-bottom:10px}.spql .ql-section{margin-bottom:10px}.spql .ql-red{color:#b3202e}.spql tr,.spql h2{break-inside:avoid}.spql .ql-label{font-size:11px;font-weight:700;margin-bottom:6px}`;
  function page(body) {
    return `<div class="page spql" data-quote-layout="a4-10mm"><style>${CSS}</style><main class="ql-body">${body}</main><footer class="ql-footer">${esc(FOOT)}</footer></div>`;
  }
  function header(q, opt, first) {
    const title = opt.title || q.docTitle || '가격제안서';
    if (!first) return `<div class="ql-page-title">${esc(title)} · ${esc(q.customer)}</div>`;
    const pairs = [['고객사',q.customer,'견적일',q.quoteDate],['담당자',q.contact,'견적번호',q.quoteNo],['견적명',q.quoteName,'영업담당',q.salesRep || q.quoteOwner],['납품장소',q.place,'유효기간',q.validity],['제안사',q.proposerName,'영업센터',q.salesCenter],['납품기일',q.deliveryDate,'지불조건',q.payTerms],['사업자번호',q.bizNo,'대표자',q.ceo],['제안사주소',q.addr,'견적담당',q.quoteOwner]];
    return `${opt.label ? `<div class="ql-label">${esc(opt.label)}</div>` : ''}<h1>${esc(title)}</h1><table class="ql-meta">${pairs.filter(a=>a[1] || a[3]).map(a=>`<tr>${a.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table>`;
  }
  function itemRow(r, opt) {
    const dc = !present(r.dc) ? '' : /%/.test(String(r.dc)) ? String(r.dc) : fmt(r.dc) + '%';
    const vals = [[r.cat || r.ecat,''],[[r.sub || r.esub,r.item].filter(Boolean).join('\n'),''],[r.spec,''],[r.free || fmt(r.price),'ql-n'],[fmt(r.qty),'ql-n'],[r.unit,''],[value(r,'std',opt),'ql-n'],[dc,'ql-n'],[value(r,'amt',opt),'ql-n'],[r.note,'']];
    return `<tr data-quote-row>${vals.map(([v,c])=>`<td class="${c}">${esc(v)}</td>`).join('')}</tr>`;
  }
  function detail(s, rows, last, opt) {
    const t = total(s,opt);
    const sum = last ? `<tr class="ql-sum"><td colspan="6">${esc(s.subtotalLabel || s.sumLabel || '소계')} ${esc(s.payLabel || s.payType)}</td><td class="ql-n">${esc(fmt(t.std))}</td><td></td><td class="ql-n">${esc(fmt(t.amt))}</td><td></td></tr>` : '';
    return `<section class="ql-section"><h2>${esc(s.title)}${last ? '' : ' (계속)'}</h2><table><colgroup>${[9,14,22,9,5,5,10,6,11,9].map(n=>`<col style="width:${n}%">`).join('')}</colgroup><thead><tr>${['구분','항목','사양','단가','수량','단위','표준금액','D/C','금액','비고'].map(v=>`<th>${v}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>itemRow(r,opt)).join('')}${sum}</tbody></table></section>`;
  }
  function summary(s, opt) {
    const t=total(s,opt);
    return `<table><tr class="ql-sum"><td style="width:60%">${esc(s.sumGroup)} ${esc(s.sumLabel || s.title)} (${esc(s.payLabel || s.payType)})</td><td class="ql-n">${esc(fmt(t.amt))}</td></tr></table>`;
  }
  function cover(q) {
    return `<div class="ql-cover"><p class="ql-customer">${esc(q.coverName || q.customer)}</p><h1>${esc(q.coverTitle || '가격제안서')}</h1>${q.coverTag ? `<p>☑ ${esc(q.coverTag)}</p>` : ''}<p>${esc(q.coverSub || q.quoteName)}</p><p>${esc(q.coverLines || '')}</p><p>${esc(q.quoteDate)}</p><p>${esc(q.proposerName)}</p></div>`;
  }
  function validate(el) {
    const main=el.querySelector('.ql-body'), bounds=main.getBoundingClientRect(), violations=[];
    if(main.scrollHeight>main.clientHeight+1) violations.push('content-height');
    el.querySelectorAll('.ql-body table,.ql-body td,.ql-body th,.ql-body h1,.ql-body h2,.ql-body p,.ql-footer').forEach(n=>{
      const r=n.getBoundingClientRect(), outer=el.getBoundingClientRect();
      if(r.left<outer.left+M-1 || r.right>outer.right-M+1 || r.top<outer.top+M-1 || r.bottom>outer.bottom-M+1) violations.push(n.tagName+'-margin');
      if(n.scrollWidth>n.clientWidth+1) violations.push(n.tagName+'-width');
      if(!n.closest('.ql-footer') && r.bottom>bounds.bottom+1) violations.push(n.tagName+'-height');
    });
    return {ok:!violations.length,violations};
  }
  async function render(q, options) {
    const opt=options || {}, secs=sections(q), outputs=[], diagnostics=[];
    if(!root.document || !document.body) throw new Error('Quote layout requires browser DOM measurement.');
    if(document.fonts) await document.fonts.ready;
    const host=document.createElement('div');
    host.style.cssText='position:fixed;left:-20000px;top:0;visibility:hidden;width:794px;pointer-events:none';
    document.body.appendChild(host);
    let current='', first=true;
    function fits(html) {host.innerHTML=page(html);return validate(host.firstElementChild).ok;}
    function emit(html) {
      host.innerHTML=page(html);const check=validate(host.firstElementChild);
      if(!check.ok) throw new Error('견적 출력 여백 초과: '+check.violations.join(', '));
      outputs.push({width:W,height:H,html:page(html)});diagnostics.push(check);
    }
    function flush() {if(current){emit(header(q,opt,first)+current);first=false;current='';}}
    function add(html) {
      if(!fits(header(q,opt,first)+current+html)) flush();
      if(!fits(header(q,opt,first)+html) && first){emit(header(q,opt,true));first=false;}
      if(!fits(header(q,opt,first)+html)) throw new Error('한 항목/안내가 A4 내용 영역보다 큽니다. 설명 길이를 조정해 주세요.');
      current+=html;
    }
    try {
      if(q.cover && opt.cover!==false) emit(cover(q));
      secs.filter(s=>s.inSummary!==false).forEach(s=>add(summary(s,opt)));
      const tot=opt.qTot || (typeof qTot==='function' ? qTot : null);
      const t=tot ? tot(q) : q.totals;
      if(t) add(`<table><tr class="ql-sum"><td>${esc(q.introLabel || '일시납 합계')}</td><td class="ql-n">${esc(fmt(t['일시납'] != null ? t['일시납'] : t.init))}</td></tr></table>`);
      if(q.summaryNote) add(`<p>${esc(q.summaryNote)}</p>`);
      for(const s of secs) {
        let start=0;
        while(start<s.rows.length) {
          let end=start;
          for(let n=start+1;n<=s.rows.length;n++) {
            // Last item and subtotal are inseparable; never leave only the subtotal behind.
            const html=detail(s,s.rows.slice(start,n),n===s.rows.length,opt);
            if(fits(header(q,opt,first)+current+html)) end=n;else break;
          }
          if(end===start){if(current){flush();continue;}add(detail(s,[s.rows[start]],start+1===s.rows.length,opt));start++;}
          else {add(detail(s,s.rows.slice(start,end),end===s.rows.length,opt));start=end;if(start<s.rows.length) flush();}
        }
        if(s.billTiming || s.billTerms) add(`<p>${esc(s.billLabel || s.title)} · ${esc(s.billTiming)}\n${esc(s.billTerms)}</p>`);
      }
      (q.remarks || '').split('\n').filter(Boolean).forEach(line=>add(`<p class="${line.startsWith('!')?'ql-red':''}">${esc(line.replace(/^!/,''))}</p>`));
      add(`<p>VAT ${esc(q.vat || '별도')}</p>`);flush();
      if(typeof opt.onValidate==='function') opt.onValidate(diagnostics);
      return outputs;
    } finally {host.remove();}
  }
  root.SalesPilotQuoteLayout={render,validate,pageSize:{width:W,height:H,marginMm:10}};
})(typeof window==='undefined'?globalThis:window);
