R('''      <div class="sp"></div>
    </header>''','''      <div class="sp"></div>
      <button class="btn pri" id="v-open">음성 상담으로 작성</button>
      <button class="btn" id="me-btn">내 정보</button>
    </header>''')
R('    <div id="x-body"></div>','    <div id="x-ai" class="xai" hidden></div>\n    <div id="x-body"></div>')
R("  S.draft=clone(q);S.id=q.id;S.isNew=isNew;setDirty(!!isNew);\n  $('#x-title').textContent='양식 불러오는 중…';","  S.draft=clone(q);S.id=q.id;S.isNew=isNew;setDirty(!!isNew);$('#x-ai').hidden=true;\n  $('#x-title').textContent='양식 불러오는 중…';")
R("  if(isNew&&!(S.draft.inputs||[]).length)xlResetNew();","  if(isNew&&!(S.draft.inputs||[]).length)xlResetNew();\n  if(isNew)xlApplyMe();")
R("$('#view-bedit').hidden=view!=='bedit';","$('#view-bedit').hidden=view!=='bedit';$('#view-vedit').hidden=view!=='vedit';")
R("  c.use('assets').then(","  vEarly(c);\n  c.use('assets').then(")
R("""  db.collection('termdocs').onSnapshot(""","""  vInit(c,db);
  db.collection('termdocs').onSnapshot(""")
R("""  if(!db){conn.textContent=""","""  if(!db){vInit(c,null);conn.textContent=""")
R('''  <section id="view-bedit" hidden>''','''  <section id="view-vedit" hidden>
    <div class="ed-bar">
      <button class="btn" id="v-back">← 목록</button>
      <span class="ttl">음성 상담 → 문서 작성</span>
      <span class="dirty" id="vdirty" hidden>저장되지 않음</span>
      <div class="sp"></div>
      <select id="v-list" aria-label="이전 상담 불러오기"></select>
      <button class="btn" id="v-new">새 상담</button>
      <button class="btn warn" id="v-del">삭제</button>
      <button class="btn pri" id="v-save">저장</button>
    </div>
    <div class="vgrid">
      <div class="vcol">
        <div class="card">
          <h3>1. 상담 녹음</h3>
          <div class="fgrid"><label class="fld wide"><span>상담 제목</span><input id="v-title" placeholder="예: OO기업 Amaranth 10 Cloud 도입 상담"></label></div>
          <div class="vrec-row">
            <button class="btn vrec" id="v-rec" hidden>녹음 시작</button>
            <label class="btn" for="v-audio">음성 파일 변환</label><input type="file" id="v-audio" accept="audio/*,video/mp4,video/webm,.m4a,.mp3,.wav,.aac,.ogg,.flac,.amr,.3gp" hidden>
            <label class="btn" for="v-file">녹취 텍스트 등록</label><input type="file" id="v-file" multiple accept=".txt,.srt,.vtt,.md,.csv,.json,.docx,text/plain" hidden>
            <span class="hint" id="v-count"></span>
          </div>
          <div class="vstt" id="v-stt" hidden><div class="vstt-top"><span id="v-stt-msg"></span><button class="ib" id="v-stt-stop">멈추기</button></div><div class="vstt-track"><div id="v-stt-bar"></div></div>
            <div class="hint">음성 파일은 이 PC의 브라우저 안에서 텍스트로 바뀌며 외부로 전송되지 않습니다. 처음 한 번 한국어 음성 모델(약 76MB)을 내려받고, 1시간 녹음은 보통 5~15분 걸립니다. 변환 중에는 이 화면을 열어 두세요.</div></div>
          <p class="hint" id="v-nodict" hidden>이 화면에서는 음성 받아쓰기를 쓸 수 없습니다(크롬 브라우저 또는 Claude 데스크톱 앱 메인 창에서 가능). 다른 앱의 녹취 텍스트를 붙여넣거나 불러오세요.</p>
          <div class="vlive" id="v-live" hidden><span class="dot"></span><span id="v-partial">듣고 있습니다…</span></div>
          <textarea id="v-text" class="vtext" rows="16" placeholder="‘녹음 시작’을 누르고 상담을 진행하면 대화가 여기에 받아써집니다. 휴대폰 녹음 앱·클로바노트 등의 녹취 텍스트를 붙여넣어도 됩니다." aria-label="상담 녹취"></textarea>
          <p class="hint">입력 방법 3가지 — ① 녹음 시작: 통화·미팅 중 실시간 받아쓰기 ② 음성 파일 변환: 녹음 파일(mp3·m4a·wav 등)을 올리면 텍스트로 변환 ③ 녹취 텍스트 등록: 클로바노트 등에서 받은 .txt·.docx·.srt 파일. 음성은 저장되지 않고 글만 저장됩니다.</p>
          <div class="vrec-row"><button class="btn pri" id="v-analyze">내용 분석</button><button class="btn" id="v-sum">회의록 요약</button><span class="hint" id="v-meta"></span></div>
        </div>
        <div class="card vmin" id="v-min" hidden></div>
      </div>
      <div class="vcol">
        <div id="v-ai"></div>
        <div class="card" id="v-acts" hidden>
          <h3>2. 문서 만들기</h3>
          <p class="hint" style="margin:-4px 0 10px">견적서를 만들면 이 상담과 연결됩니다. 이후 그 견적으로 계약서·할인기안·구축요청서를 만들면 고객 정보, 계약 예정일, 할인 사유, 서버·도메인·마이그레이션 같은 상담 내용이 자동으로 들어갑니다.</p>
          <div class="vrec-row"><button class="btn pri" id="v-mkq">견적서 만들기</button></div>
          <div id="v-links" style="margin-top:10px"></div>
        </div>
      </div>
    </div>
  </section>
  <section id="view-bedit" hidden>''')
R('<div id="export-host"></div>','''<div id="export-host"></div>
<div id="pf-modal" class="mdl" hidden><div class="mdl-box" role="dialog" aria-modal="true" aria-labelledby="pf-h">
  <h3 id="pf-h">내 정보</h3>
  <p class="hint" id="pf-first">처음 사용하시네요. 소속·이름·연락처를 한 번 입력해 두면 새로 만드는 견적서(견적담당·영업담당·영업센터), 할인기안·구축요청서(기안자·기안부서·영업담당자)에 자동으로 들어갑니다.</p>
  <div class="fgrid">
    <label class="fld wide"><span>소속 (영업센터) *</span><input id="pf-org" placeholder="예: 솔루션영업본부 솔루션영업 1Unit"></label>
    <label class="fld"><span>이름 *</span><input id="pf-name" placeholder="담당자28"></label>
    <label class="fld"><span>직급</span><input id="pf-rank" placeholder="과장"></label>
    <label class="fld"><span>연락처 *</span><input id="pf-phone" placeholder="전화번호 비공개"></label>
    <label class="fld"><span>이메일</span><input id="pf-email" type="email"></label>
    <label class="fld wide"><span>기안 부서 (전자결재 표기)</span><input id="pf-dept" placeholder="비워 두면 소속의 마지막 단어"></label>
  </div>
  <div class="mdl-act"><button class="btn" id="pf-cancel">나중에</button><button class="btn pri" id="pf-save">저장</button></div>
</div></div>''')
R('@media (max-width:1100px){','''.mdl{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:210;display:flex;align-items:center;justify-content:center;padding:16px}
.mdl[hidden]{display:none}
.mdl-box{background:var(--surface);border-radius:12px;width:min(560px,100%);padding:18px 20px;box-shadow:0 10px 40px rgba(0,0,0,.3);max-height:100%;overflow:auto}
.mdl-box h3{margin:0 0 6px;font-size:17px}
.mdl-act{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
.vgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:14px;align-items:start}
.vcol{display:flex;flex-direction:column;gap:14px;min-width:0}
.vcol .card{margin:0}
#v-ai{display:flex;flex-direction:column;gap:14px}
#v-ai .empty{background:var(--surface);border:1px dashed var(--line);border-radius:10px;padding:26px 18px;line-height:1.7}
.vrec-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0}
.vrec.rec{background:#d93025;color:#fff;border-color:#d93025}
.vtext{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:8px;padding:10px;font:inherit;font-size:14px;line-height:1.6;resize:vertical;background:var(--surface);color:var(--text)}
.vsum{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:8px;padding:8px;font:inherit;line-height:1.6;resize:vertical;background:var(--surface);color:var(--text)}
.vlive[hidden],.vstt [hidden]{display:none}
.vlive{display:flex;gap:8px;align-items:center;color:#d93025;font-size:13px;margin-bottom:6px}
.vlive .dot{width:9px;height:9px;border-radius:50%;background:#d93025;animation:vb 1s infinite}
@keyframes vb{50%{opacity:.25}}
#v-list{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:7px 8px;max-width:300px;color:var(--text)}
.vstt{border:1px solid var(--line);border-radius:8px;padding:10px 12px;margin:6px 0 10px;background:var(--surface2)}
.vstt-top{display:flex;gap:8px;align-items:center;justify-content:space-between;font-size:13px;margin-bottom:6px}
.vstt-track{height:6px;border-radius:3px;background:var(--line);overflow:hidden;margin-bottom:6px}
#v-stt-bar{height:100%;width:0;background:var(--accent);transition:width .3s}
.vmin-head{display:flex;gap:6px;align-items:center;margin-bottom:8px}.vmin-head h3{margin:0}.vmin-head .sp{flex:1}
.vmin-body{background:#fff;border:1px solid var(--line);border-radius:8px;padding:14px 16px;max-height:560px;overflow:auto}
.vmin-body ul{margin:2px 0 6px;padding-left:20px}
.braibar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px}
.braibar select{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:7px 8px;max-width:340px;color:var(--text)}
.xai{border:1px solid var(--accent);background:var(--accent-soft);border-radius:8px;padding:9px 12px;margin:0 0 10px;font-size:13px}
@media (max-width:1100px){.vgrid{grid-template-columns:minmax(0,1fr)}}
@media (max-width:1100px){''')
