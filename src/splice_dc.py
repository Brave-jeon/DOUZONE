R('<button class="btn" data-tab="c" aria-pressed="false">계약서</button></div>','<button class="btn" data-tab="c" aria-pressed="false">계약서</button><button class="btn" data-tab="d" aria-pressed="false">할인기안</button></div>')
R('<th style="text-align:right">할인율</th><th>최종 수정</th>','<th style="text-align:right">할인율</th><th>진행 현황</th>')
R("""    <td class="qn">${q.updatedAt?esc(q.updatedAt.slice(0,16).replace('T',' ')):''}</td></tr>`).join('')
    :`<tr><td colspan="9"><div class="empty">${S.quotes.size?""","""    <td>${flowChips(q)}</td></tr>`).join('')
    :`<tr><td colspan="9"><div class="empty">${S.quotes.size?""")
R('<select class="mk" id="mk-ct"','<button class="btn" id="mk-dc">할인기안 작성</button>\n      <select class="mk" id="mk-ct"')
R('''  <section id="view-cedit" hidden>''','''  <section id="view-dedit" hidden>
    <div class="ed-bar">
      <button class="btn" id="dback">← 목록</button>
      <span class="ttl" id="dc-title"></span>
      <span class="dirty" id="ddirty" hidden>저장되지 않음</span>
      <div class="sp"></div>
      <button class="btn warn" id="ddel">삭제</button>
      <button class="btn" id="dexp-html">인쇄용 HTML 저장</button>
      <button class="btn" id="dexp-pdf">PDF 저장</button>
      <button class="btn pri" id="dsave">저장</button>
    </div>
    <div class="tabs"><button class="btn" data-dtab="form" aria-pressed="true">입력</button><button class="btn" data-dtab="prev" aria-pressed="false">미리보기</button></div>
    <div class="ed-grid" id="ded-grid" data-tab="form">
      <div class="ed-form" id="dc-form"></div>
      <div class="prev-col">
        <div class="prev-head"><span id="dprev-info">A4 미리보기</span><span>전자결재 상신용</span></div>
        <div class="prev" id="dprev"></div>
      </div>
    </div>
  </section>
  <section id="view-cedit" hidden>''')
R('''    <div id="tab-c" hidden>''','''    <div id="tab-d" hidden>
      <div class="filters">
        <input id="d-search" type="search" placeholder="고객사, 제목 검색" aria-label="할인기안 검색">
        <select id="d-status" aria-label="할인기안 상태 필터"><option value="">전체 상태</option></select>
      </div>
      <div class="newct" style="margin-bottom:14px"><span class="hint">새 할인기안</span><select id="d-newq" aria-label="할인기안을 작성할 견적"></select><button class="btn pri" id="d-new">할인기안 작성</button></div>
      <div class="kpis" id="dkpis" style="grid-template-columns:repeat(4,minmax(0,1fr))"></div>
      <div id="dpend"></div>
      <div class="panel"><h2>할인기안 목록</h2>
        <div class="tbl-wrap"><table class="list"><thead><tr><th>작성일</th><th>고객사 · 제목</th><th>상태</th><th>연결 견적</th><th style="text-align:right">표준금액</th><th style="text-align:right">프로모션 할인</th><th style="text-align:right">추가 할인</th><th style="text-align:right">할인율</th><th style="text-align:right">계약금액</th></tr></thead><tbody id="dlist"></tbody></table></div>
      </div>
    </div>
    <div id="tab-c" hidden>''')
R('.ib:disabled{opacity:.45;cursor:default}','''.ib:disabled{opacity:.45;cursor:default}
.chip{display:inline-block;font-size:11.5px;padding:1px 7px;border-radius:5px;border:1px solid var(--line);color:var(--muted);margin:1px 3px 1px 0;white-space:nowrap}
.chip.ok{color:var(--s-won);border-color:currentColor}
.chip.on{color:var(--s-sent);border-color:currentColor}
.chip.warn{color:#fff;background:var(--s-lost);border-color:var(--s-lost);font-weight:600}
.dc-작성중{color:var(--s-draft)} .dc-상신{color:var(--s-sent)} .dc-승인{color:var(--s-won)} .dc-반려{color:var(--s-lost)}''')
R("""  db.collection('termdocs').onSnapshot(""","""  db.collection('discounts').onSnapshot(snap=>{const m=new Map();snap.docs.forEach(d=>{const v=d.data();if(v)m.set(d.id,Object.assign({},clone(v),{id:d.id}))});S.discounts=m;
    if(S.view==='dash')setTab(S.tab);else if(S.view==='dedit'&&!S.ddirty&&!S.disNew&&m.has(S.did)){const nd=m.get(S.did);if(JSON.stringify(nd)!==JSON.stringify(S.ddraft)){S.ddraft=clone(nd);renderDForm();scheduleDPreview()}}},()=>{});
  db.collection('termdocs').onSnapshot(""")
R("""document.querySelectorAll('.tabs .btn[data-ctab]').forEach(b=>b.onclick""","""document.querySelectorAll('.tabs .btn[data-dtab]').forEach(b=>b.onclick=()=>{$('#ded-grid').dataset.tab=b.dataset.dtab;document.querySelectorAll('.tabs .btn[data-dtab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(b.dataset.dtab==='prev')scheduleDPreview()});
document.querySelectorAll('.tabs .btn[data-ctab]').forEach(b=>b.onclick""")
R("window.addEventListener('resize',()=>{if(S.view==='edit')schedulePreview();if(S.view==='cedit')scheduleCPreview()});","window.addEventListener('resize',()=>{if(S.view==='edit')schedulePreview();if(S.view==='cedit')scheduleCPreview();if(S.view==='dedit')scheduleDPreview()});")
R("['#exp-pdf','#exp-html','#cexp-pdf','#cexp-html']","['#exp-pdf','#exp-html','#cexp-pdf','#cexp-html','#dexp-pdf','#dexp-html']")
R("견적서와 계약서를 작성·수정하고, 더존 표준 양식 그대로 PDF로 저장합니다.","견적 제출 → 계약서 → 할인기안까지 한 곳에서 작성하고, 더존 표준 양식 그대로 PDF로 저장합니다.")
R('.dash-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;align-items:start}','.dash-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}\n.dash-grid .bars{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}')
