p='quote-desk.html';s=open('quote-desk.v1.html').read()
ctcss=open('ct.css').read()+open('dc.css').read()+open('br.css').read();ctjs=open('ct.js').read()+'\n'+open('dc.js').read()+'\n'+open('xq.js').read()+'\n'+open('br.js').read()+'\n'+open('cp.js').read()+'\n'+open('stt.js').read()+'\n'+open('vc.js').read()+'\n'+open('cust.js').read()+'\n'+open('shell.js').read()
def R(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(s.count(a),a[:60]); s=s.replace(a,b)
R('<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>')
R('.tpl-we .wnotes{border:1px solid #bbb;padding:5px 7px;font-size:7.2px;white-space:pre-line;margin-top:8px;line-height:1.5}\n</style>',
  '.tpl-we .wnotes{border:1px solid #bbb;padding:5px 7px;font-size:7.2px;white-space:pre-line;margin-top:8px;line-height:1.5}\n'+ctcss+'</style>')
R('@media (max-width:1100px){',
 '''.seg{display:inline-flex;border:1px solid var(--line);border-radius:9px;padding:3px;background:var(--surface);gap:3px}
.seg .btn{border:none;padding:6px 14px;border-radius:7px;background:transparent}
.seg .btn[aria-pressed=true]{background:var(--accent-soft);color:var(--accent);font-weight:700}
.newct{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.newct select{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:7px 8px;max-width:260px;min-width:0}
.mk{border:1px solid var(--accent);color:var(--accent);background:var(--surface);border-radius:8px;padding:7px 8px;font-size:13px;font-weight:600}
.chk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px 10px;margin-bottom:8px}
.ct-작성중{color:var(--s-draft)} .ct-검토중{color:var(--s-nego)} .ct-발송{color:var(--s-sent)} .ct-체결완료{color:var(--s-won)} .ct-보류{color:var(--s-lost)}
.ib:disabled{opacity:.45;cursor:default}
@media (max-width:1100px){''')
R('''      <div class="sp"></div>
      <button class="btn" id="new-we">새 견적 · WEHAGO</button>
      <button class="btn pri" id="new-a10">새 견적 · Amaranth 10</button>
    </header>
    <div id="conn" class="banner-msg">견적 데이터를 불러오는 중입니다…</div>
    <div class="filters">''','''      <div class="seg" role="group" aria-label="보기 전환"><button class="btn" data-tab="q" aria-pressed="true">견적서</button><button class="btn" data-tab="c" aria-pressed="false">계약서</button></div>
      <div class="sp"></div>
    </header>
    <div id="conn" class="banner-msg">견적 데이터를 불러오는 중입니다…</div>
    <div id="tab-q">
    <div class="filters">
      <button class="btn" id="new-we">새 견적 · WEHAGO</button>
      <button class="btn pri" id="new-a10">새 견적 · Amaranth 10</button>''')
R('''        <div class="bars" id="bars"></div>
      </div>
    </div>
  </section>''','''        <div class="bars" id="bars"></div>
      </div>
    </div>
    </div>
    <div id="tab-c" hidden>
      <div class="filters">
        <input id="c-search" type="search" placeholder="거래처, 계약명 검색" aria-label="계약 검색">
        <select id="c-status" aria-label="계약 상태 필터"><option value="">전체 상태</option></select>
        <select id="c-type" aria-label="계약 종류 필터"><option value="">전체 종류</option></select>
      </div>
      <div class="newct" style="margin-bottom:14px"><span class="hint">새 계약서</span>
        <select id="c-newtype" aria-label="새 계약서 종류"></select>
        <select id="c-newq" aria-label="연결할 견적"></select>
        <button class="btn pri" id="c-new">계약서 만들기</button></div>
      <div class="kpis" id="ckpis" style="grid-template-columns:repeat(4,minmax(0,1fr))"></div>
      <div class="panel"><h2>계약서 목록</h2>
        <div class="tbl-wrap"><table class="list"><thead><tr><th>계약일</th><th>거래처 · 계약명</th><th>종류</th><th>상태</th><th>연결 견적</th><th style="text-align:right">계약 금액 합계</th><th>약관 첨부</th><th>최종 수정</th></tr></thead><tbody id="clist"></tbody></table></div>
      </div>
    </div>
  </section>''')
R('''      <button class="btn" id="dup">복제(새 버전)</button>''','''      <select class="mk" id="mk-ct" aria-label="이 견적으로 계약서 만들기"><option value="">계약서 만들기…</option><option value="cloud">Amaranth 10 Cloud 공급계약</option><option value="onprem">Amaranth 10 구축형 공급계약</option><option value="dogup">공급(도급) 계약 · 갑/을</option><option value="onepe">ONE AI Private Edition 공급계약</option></select>
      <button class="btn" id="dup">복제(새 버전)</button>''')
R('''</div>
<div id="measure"></div>''',open('cedit.html').read()+'''</div>
<div id="measure"></div>''')
a=s.index('/* ---------- 페이지 나누기 ---------- */');b=s.index('/* ---------- 상태 ---------- */')
s=s[:a]+open('pg.js').read()+s[b:]
R('''const S={quotes:new Map(),db:null,downloads:null,view:'dash',id:null,draft:null,dirty:false,isNew:false,loaded:false};''',
  '''const S={quotes:new Map(),contracts:new Map(),terms:new Map(),discounts:new Map(),db:null,downloads:null,assets:null,view:'dash',tab:'q',id:null,draft:null,dirty:false,isNew:false,loaded:false,cdraft:null,cid:null,cdirty:false,cisNew:false,ddraft:null,did:null,ddirty:false,disNew:false};''')
R('''  if(!S.draft)return;const seq=++prevSeq;const pages=await buildPages(S.draft);if(seq!==prevSeq||!S.draft)return;
  const box=$('#prev');const avail=Math.max(200,box.clientWidth-28);const sc=Math.min(1,avail/794);
  box.innerHTML=pages.map(p=>`<div class="pg-wrap" style="width:${794*sc}px;height:${1123*sc}px">${p.replace('class="page','style="transform:scale('+sc+')" class="page')}</div>`).join('');''',
'''  if(!S.draft)return;const seq=++prevSeq;const pages=await buildPages(S.draft);if(seq!==prevSeq||!S.draft)return;
  showPages(pages,$('#prev'));''')
R('''window.addEventListener('resize',()=>{if(S.view==='edit')schedulePreview()});''','''window.addEventListener('resize',()=>{if(S.view==='edit')schedulePreview();if(S.view==='cedit')scheduleCPreview()});''')
R('''document.querySelectorAll('.tabs .btn').forEach(b=>b.onclick=()=>{$('#ed-grid').dataset.tab=b.dataset.tab;document.querySelectorAll('.tabs .btn').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(b.dataset.tab==='prev')schedulePreview()});''',
'''document.querySelectorAll('.tabs .btn[data-tab]').forEach(b=>b.onclick=()=>{$('#ed-grid').dataset.tab=b.dataset.tab;document.querySelectorAll('.tabs .btn[data-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(b.dataset.tab==='prev')schedulePreview()});
document.querySelectorAll('.tabs .btn[data-ctab]').forEach(b=>b.onclick=()=>{$('#ced-grid').dataset.tab=b.dataset.ctab;document.querySelectorAll('.tabs .btn[data-ctab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(b.dataset.ctab==='prev')scheduleCPreview()});''')
R('''function show(view){S.view=view;$('#view-dash').hidden=view!=='dash';$('#view-edit').hidden=view!=='edit';window.scrollTo(0,0);if(view==='dash')renderDash()}''',
'''function show(view){S.view=view;$('#view-dash').hidden=view!=='dash';$('#view-edit').hidden=view!=='edit';$('#view-cedit').hidden=view!=='cedit';$('#view-dedit').hidden=view!=='dedit';window.scrollTo(0,0);if(view==='dash')setTab(S.tab)}''')
a=s.index("$('#exp-pdf').onclick=async()=>{");b=s.index('/* ---------- 연결 ---------- */')
s=s[:a]+open('exp.js').read()+ctjs+'\n'+s[b:]
R("""  c.use('downloads').then(d=>{S.downloads=d;if(!d){$('#exp-pdf').disabled=true;$('#exp-html').disabled=true;$('#exp-pdf').title=$('#exp-html').title='이 화면에서는 파일 저장을 사용할 수 없습니다'}});""",
"""  c.use('downloads').then(d=>{S.downloads=d;if(!d){['#exp-pdf','#exp-html','#cexp-pdf','#cexp-html'].forEach(x=>{$(x).disabled=true;$(x).title='이 화면에서는 파일 저장을 사용할 수 없습니다'})}});
  c.use('assets').then(a=>{S.assets=a;if(S.view==='cedit')renderCForm()});""")
R("""  },err=>{clearTimeout(timer);conn.hidden=false;conn.textContent='견적 데이터를 불러오지 못했습니다 ('+(err&&err.code||'오류')+'). 페이지를 다시 열어 주세요.'});""",
"""  },err=>{clearTimeout(timer);conn.hidden=false;conn.textContent='견적 데이터를 불러오지 못했습니다 ('+(err&&err.code||'오류')+'). 페이지를 다시 열어 주세요.'});
  db.collection('contracts').onSnapshot(snap=>{
    const m=new Map();snap.docs.forEach(d=>{const v=d.data();if(v)m.set(d.id,Object.assign({},clone(v),{id:d.id}))});S.contracts=m;
    if(S.view==='dash'){if(S.tab==='c')renderCtDash();else renderDash()}
    else if(S.view==='cedit'&&!S.cdirty&&!S.cisNew&&m.has(S.cid)){const nc=m.get(S.cid);if(JSON.stringify(nc)!==JSON.stringify(S.cdraft)){S.cdraft=clone(nc);renderCForm();scheduleCPreview()}}
  },()=>{});
  db.collection('termdocs').onSnapshot(snap=>{const m=new Map();snap.docs.forEach(d=>{const v=d.data();if(v)m.set(d.id,Object.assign({},clone(v),{id:d.id}))});S.terms=m;if(S.view==='cedit'&&!S.cdirty)renderCForm()},()=>{});""")
R("견적서를 작성·수정하고, Amaranth 10 / WEHAGO 표준 양식 그대로 PDF로 저장합니다.","견적서와 계약서를 작성·수정하고, 더존 표준 양식 그대로 PDF로 저장합니다.")
R('.fld textarea{min-height:110px;resize:vertical}','.fld textarea{min-height:58px;resize:vertical}\n.fld textarea[data-k=remarks]{min-height:120px}\n.term-row{border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--surface2)}')
R('<option value="cloud">Amaranth 10 Cloud 공급계약</option>','<option value="cloud">Amaranth 10 Cloud 공급계약</option><option value="csap">Amaranth 10 Cloud CSAP 공급계약(공공)</option>')
exec(open('splice_dc.py').read())
exec(open('splice_xq.py').read())
exec(open('splice_br.py').read())
exec(open('splice_cp.py').read())
exec(open('splice_vc.py').read())
exec(open('splice_shell.py').read())
from pathlib import Path
import shutil
appdir = Path('../app')
appdir.mkdir(exist_ok=True)
assert '<script>' in s, '앱 초기화 스크립트 위치 확인 필요'
s = '<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + s
# 인증 → 회원별 폴더 → 원격 DB → dictation/platform → 작업공간 순서. 구 로컬 회원설정 모듈은 로드하지 않습니다.
modules = ('shared-config.js', 'shared-entry.js', 'ai-client.js', 'member-auth.js', 'folder-storage.js', 'remote-db.js', 'dictation.js', 'standalone.js', 'desktop-handoff.js', 'workspaces.js')
# 기존 하드웨어·교육·견적 레이아웃 추가 모듈을 유지합니다.
modules += tuple(m for m in ('quote-numbering.js', 'quote-layout.js', 'quote-assistance.js', 'hardware-integration.js', 'hardware-quote-ui.js') if Path(m).is_file())
s = s.replace('id="sites-list"', 'id="site-grid"')
footer = 'CCO 공공기관본부 내부용  · Copyright © DOUZONE BIZON AX영업Unit. All rights reserved.'
s = s.replace('<div id="measure"></div>', '<footer id="sp-copyright" style="text-align:center;padding:16px;font:12px/1.6 sans-serif">'+footer+'</footer>\n<div id="measure"></div>', 1)
loaders = '\n'.join('<script src="./'+module+'?v=20261111-1"></script>' for module in modules)
s = s.replace('<script>', loaders+'\n<script>', 1)
for module in modules:
    shutil.copy2(module, appdir / module)
(appdir / 'index.html').write_text(s, encoding='utf-8')
print('ok',len(s))
