R('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>','<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>\n<script>\n'+open('xl.js').read().replace("if(typeof module!=='undefined')module.exports=XL;","")+'\n</script>')
R('''  <section id="view-dedit" hidden>''',open('xedit.html').read()+'''  <section id="view-dedit" hidden>''')
R('''      <button class="btn" id="new-we">새 견적 · WEHAGO</button>
      <button class="btn pri" id="new-a10">새 견적 · Amaranth 10</button>''','''      <select class="mk pri" id="new-x" aria-label="새 견적 양식 선택"></select>
      <button class="btn" id="new-we" hidden>새 견적 · WEHAGO</button>
      <button class="btn pri" id="new-a10" hidden>새 견적 · Amaranth 10</button>''')
R("<span class=\"tpl-tag\">${q.template==='we'?'WEHAGO':'Amaranth 10'}</span>","<span class=\"tpl-tag\">${q.template==='xl'?esc(xqInfo(q.tplId).name):q.template==='we'?'WEHAGO (사례)':'Amaranth 10 (사례)'}</span>")
R("function setDirty(v){S.dirty=v;$('#dirty').hidden=!v}","function setDirty(v){S.dirty=v;$('#dirty').hidden=!v;const x=document.getElementById('xdirty');if(x)x.hidden=!v}")
R("function openQuote(id){const q=S.quotes.get(id);if(q)openEditor(q,false)}","function openQuote(id){const q=S.quotes.get(id);if(!q)return;if(q.template==='xl')openXEditor(q,false);else openEditor(q,false)}")
R("async function save(){\n  const q=S.draft;q.updatedAt=","async function save(){\n  if(S.draft&&S.draft.template==='xl'&&X.d&&X.book)xlMaterialize(S.draft,X.d,X.book);\n  const q=S.draft;q.updatedAt=")
R("async function quotePages(q,opt){\n  opt=opt||{};","async function quotePages(q,opt){\n  opt=opt||{};if(q.template==='xl')return xlQuotePages(q,opt);")
R("  const css=$('#printcss').textContent;","  const css=$('#printcss').textContent+[...document.querySelectorAll('style[data-xl]')].map(x=>x.textContent).join('\\n');")
R("function show(view){S.view=view;$('#view-dash').hidden=view!=='dash';","function show(view){S.view=view;$('#view-xedit').hidden=view!=='xedit';$('#view-dash').hidden=view!=='dash';")
R("if(S.view==='dedit')scheduleDPreview()});","if(S.view==='dedit')scheduleDPreview()});",1)
R('.tpl-we .wnotes{border:1px solid #bbb;padding:5px 7px;font-size:7.2px;white-space:pre-line;margin-top:8px;line-height:1.5}\n','''.tpl-we .wnotes{border:1px solid #bbb;padding:5px 7px;font-size:7.2px;white-space:pre-line;margin-top:8px;line-height:1.5}
.page.xlp{padding:0;background:#fff;overflow:hidden}
.xlwrap{position:absolute;left:38px;top:36px;transform-origin:0 0}
.xls{border-collapse:collapse;table-layout:fixed;font-family:'Malgun Gothic','맑은 고딕','Noto Sans KR',sans-serif;font-size:11pt;color:#000;background:#fff;line-height:1.2}
.xls td{padding:0 2px;overflow:hidden;vertical-align:bottom;white-space:nowrap}
.xls .xv{overflow:hidden}
.xls td.sp{overflow:visible}
.xsp{position:absolute;display:flex;flex-direction:column;overflow:hidden;padding:4px 8px;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;line-height:1.15;color:#000;white-space:pre-wrap}
.xls td.sp .xv{position:relative;z-index:1}
.xls .xv.w{white-space:pre-wrap;word-break:keep-all}
.xlab{position:absolute;left:30px;top:10px;font:700 12px 'Noto Sans KR',sans-serif;color:#222}
''')
R('.ib:disabled{opacity:.45;cursor:default}','''.ib:disabled{opacity:.45;cursor:default}
.xtool{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
.xf{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--ink2)}
.xf select,.xf input[type=date]{border:1px solid var(--line);background:var(--surface);border-radius:7px;padding:5px 7px}
.xsum{display:flex;gap:16px;flex-wrap:wrap;align-items:baseline;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:8px;font-size:13px;font-variant-numeric:tabular-nums}
.xsum b{font-size:15px}
.xhint{font-size:12px;color:var(--muted);margin:0 2px 8px}
.xscroll{overflow:auto;background:#fff;border:1px solid var(--line);border-radius:10px;padding:4px;max-height:calc(100vh - 230px)}
.xzoom{position:relative;overflow:hidden}
.xls td.xin{background:#fff6bf!important;outline:1px solid #e3c84a;outline-offset:-1px}
.xls td.xx{background:#f6f7f9!important;color:#6b7280!important;font-size:9pt!important;white-space:pre-wrap}
.xls .xi{width:100%;border:0;background:transparent;font:inherit;color:#000;padding:0 2px;margin:0;min-width:0}
.xls input.xi.n{text-align:right}
.xls textarea.xi{resize:none;overflow:hidden;line-height:1.2;display:block}
.xls select.xi{font-size:inherit}
.xls .xi:focus{outline:2px solid #1d5fd6;background:#fff}
.xls button.xi.pick{cursor:pointer;text-align:left;color:#1d5fd6;text-decoration:underline;white-space:normal}
.xpop{position:fixed;inset:0;background:rgba(10,15,25,.45);z-index:40;display:flex;align-items:center;justify-content:center;padding:16px}
.xpop[hidden]{display:none}
.xpick{background:var(--surface);border-radius:12px;width:min(720px,100%);max-height:80vh;display:flex;flex-direction:column;border:1px solid var(--line)}
.xph{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line)}
.xpl{overflow:auto;padding:6px 14px}
.xpo{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);align-items:center}
.xpb{display:flex;gap:6px;flex:none}''')
R("const S={quotes:new Map(),","const S={quotes:new Map(),",1)
