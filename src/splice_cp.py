R('''      <button class="btn" id="dexp-html">''','''      <button class="btn pri2" id="dcopy">전자결재 본문 복사</button>
      <button class="btn" id="dexp-html">''')
R('''      <button class="btn" id="bexp-html">''','''      <button class="btn pri2" id="bcopy">전자결재 본문 복사</button>
      <button class="btn" id="bexp-html">''')
R('<div id="export-host"></div>','''<div id="export-host"></div>
<div id="cp-modal" hidden><div class="cp-box" role="dialog" aria-modal="true" aria-labelledby="cp-title">
  <div class="cp-head"><b id="cp-title">본문</b><span class="hint">결재 헤더(품의번호·결재선·제목)는 전자결재 양식에 이미 있으므로 제외했습니다.</span><div class="sp"></div>
    <button class="btn" id="cp-save">HTML 파일 저장</button><button class="btn pri" id="cp-go">본문 복사</button><button class="btn" id="cp-close" aria-label="닫기">닫기</button></div>
  <div class="cp-scroll"><div id="cp-body"></div></div></div></div>''')
R('@media (max-width:1100px){','''#cp-modal{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
#cp-modal[hidden]{display:none}
.cp-box{background:var(--surface);border-radius:12px;width:min(1000px,100%);max-height:100%;display:flex;flex-direction:column;box-shadow:0 10px 40px rgba(0,0,0,.3)}
.cp-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--line)}
.cp-head .sp{flex:1}
.cp-scroll{overflow:auto;padding:16px;background:#fff}
#cp-body{color:#1b1f27;background:#fff;min-width:640px}
.btn.pri2{border-color:var(--accent);color:var(--accent);font-weight:600}
@media (max-width:1100px){''')
R("'#bexp-pdf','#bexp-html']","'#bexp-pdf','#bexp-html','#cp-save']")
