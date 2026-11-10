R('<button class="btn" data-tab="d" aria-pressed="false">할인기안</button></div>','<button class="btn" data-tab="d" aria-pressed="false">할인기안</button><button class="btn" data-tab="b" aria-pressed="false">구축요청</button></div>')
R('''    <div id="tab-c" hidden>''','''    <div id="tab-b" hidden>
      <div class="filters">
        <input id="b-search" type="search" placeholder="고객사, 제목 검색" aria-label="구축요청 검색">
        <select id="b-status" aria-label="구축요청 상태 필터"><option value="">전체 상태</option></select>
      </div>
      <div class="newct" style="margin-bottom:14px"><span class="hint">새 구축요청서</span><select id="b-newc" aria-label="구축요청서를 작성할 계약"></select><button class="btn pri" id="b-new">구축요청서 작성</button></div>
      <div class="kpis" id="bkpis" style="grid-template-columns:repeat(4,minmax(0,1fr))"></div>
      <div id="bpend"></div>
      <div class="panel"><h2>구축요청서 목록</h2>
        <div class="tbl-wrap"><table class="list"><thead><tr><th>작성일</th><th>고객사 · 구분</th><th>상태</th><th>연결 계약</th><th>유형</th><th style="text-align:right">총 계약금액</th><th>교육 시작</th></tr></thead><tbody id="blist"></tbody></table></div>
      </div>
    </div>
    <div id="tab-c" hidden>''')
R('''  <section id="view-dedit" hidden>''','''  <section id="view-bedit" hidden>
    <div class="ed-bar">
      <button class="btn" id="bback">← 목록</button>
      <span class="ttl" id="br-title"></span>
      <span class="dirty" id="bdirty" hidden>저장되지 않음</span>
      <div class="sp"></div>
      <button class="btn warn" id="bdel">삭제</button>
      <button class="btn" id="bexp-html">인쇄용 HTML 저장</button>
      <button class="btn" id="bexp-pdf">PDF 저장</button>
      <button class="btn pri" id="bsave">저장</button>
    </div>
    <div class="braibar" id="br-aibar"></div>
    <div id="br-ai" class="xai" hidden></div>
    <div class="tabs"><button class="btn" data-btab="form" aria-pressed="true">입력</button><button class="btn" data-btab="prev" aria-pressed="false">미리보기</button></div>
    <div class="ed-grid" id="bed-grid" data-tab="form">
      <div class="ed-form" id="br-form"></div>
      <div class="prev-col">
        <div class="prev-head"><span id="bprev-info">A4 미리보기</span><span>전자결재 상신용</span></div>
        <div class="prev" id="bprev"></div>
      </div>
    </div>
  </section>
  <section id="view-dedit" hidden>''')
R('''      <button class="btn" id="cdup">복제</button>''','''      <button class="btn" id="cmk-br">구축요청서 작성</button>
      <button class="btn" id="cdup">복제</button>''')
R("$('#tab-d').hidden=t!=='d';if(t==='c')renderCtDash();else if(t==='d')renderDcDash();","$('#tab-d').hidden=t!=='d';$('#tab-b').hidden=t!=='b';if(t==='c')renderCtDash();else if(t==='d')renderDcDash();else if(t==='b')renderBrDash();")
R("$('#view-dedit').hidden=view!=='dedit';window.scrollTo","$('#view-dedit').hidden=view!=='dedit';$('#view-bedit').hidden=view!=='bedit';window.scrollTo")
R("if(S.view==='dedit')scheduleDPreview()});","if(S.view==='dedit')scheduleDPreview();if(S.view==='bedit')scheduleBPreview()});")
R("'#dexp-pdf','#dexp-html']","'#dexp-pdf','#dexp-html','#bexp-pdf','#bexp-html']")
R("discounts:new Map(),","discounts:new Map(),buildreqs:new Map(),bdraft:null,bid:null,bdirty:false,bisNew:false,")
R("""  db.collection('termdocs').onSnapshot(""","""  db.collection('buildreqs').onSnapshot(snap=>{const m=new Map();snap.docs.forEach(d=>{const v=d.data();if(v)m.set(d.id,Object.assign({},clone(v),{id:d.id}))});S.buildreqs=m;
    if(S.view==='dash')setTab(S.tab);else if(S.view==='bedit'&&!S.bdirty&&!S.bisNew&&m.has(S.bid)){const nb=m.get(S.bid);if(JSON.stringify(nb)!==JSON.stringify(S.bdraft)){S.bdraft=clone(nb);renderBForm();scheduleBPreview()}}},()=>{});
  db.collection('termdocs').onSnapshot(""")
R("""  if(f.need)ch.push(`<span class="chip ${f.dcState==='승인'?'ok':f.dcState==='필요'||f.dcState==='반려'?'warn':'on'}">할인기안 ${esc(f.dcState)}</span>`);""",
"""  if(f.need)ch.push(`<span class="chip ${f.dcState==='승인'?'ok':f.dcState==='필요'||f.dcState==='반려'?'warn':'on'}">할인기안 ${esc(f.dcState)}</span>`);
  const bs=brStateOfQuote(q);if(bs)ch.push(`<span class="chip ${bs==='승인'?'ok':bs==='필요'||bs==='반려'?'warn':'on'}">구축요청 ${esc(bs)}</span>`);""")
R("견적 제출 → 계약서 → 할인기안까지","견적 제출 → 계약서 → 할인기안 → 구축요청까지")
