s=s.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@500;600;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap">','<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@500;600;700&family=Noto+Sans+KR:wght@400;500;700;900&family=Sora:wght@600;700&display=swap">',1)
R('<title>영업 견적 데스크</title>','<title>Sales Pilot</title>')
R('<div class="wrap">\n  <section id="view-dash">','''<div class="shell">
<nav class="snav" aria-label="주 메뉴">
  <a class="brand" href="#home" id="snav-brand"><span class="mk"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/></svg></span><span class="wm">Sales Pilot<small>DOUZONE AX영업</small></span></a>
  <div id="snav-items" style="display:contents"></div>
  <div class="me"><div class="av" id="snav-av">?</div><div class="tx" style="min-width:0"><div class="nm" id="snav-nm"></div><div class="og" id="snav-og"></div></div><div class="acts"><button id="snav-edit" type="button" title="내 정보 수정">정보</button><button id="snav-out" type="button" title="로그아웃">로그아웃</button></div></div>
</nav>
<div class="main">
<div class="wrap">
'''+open('shell.html').read()+'''  <section id="view-dash">''')
R('</div>\n<div id="measure"></div>','</div>\n</div></div>\n<div id="measure"></div>')
R('    <div id="x-ai" class="xai" hidden></div>','    <div id="x-cust" class="ccard" hidden></div>\n    <div id="x-ai" class="xai" hidden></div>')
R('@media (max-width:1100px){.vgrid','''.ccard{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:0 0 10px}
.cc-h{display:flex;align-items:center;gap:10px}.cc-h .sp{flex:1}.cc-h b{font-family:var(--font-head);font-size:15px}
.cc-e{font-size:11.5px;color:var(--muted);letter-spacing:.3px}
.cc-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px 18px;margin:10px 0 0}
.cc-g div{min-width:0}.cc-g dt{font-size:11.5px;color:var(--muted)}.cc-g dd{margin:2px 0 0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cc-hist{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.cc-hist span{font-size:11.5px;padding:2px 9px;border-radius:999px;background:var(--accent-soft);color:var(--accent)}
@media (max-width:1100px){.vgrid''')
s=s.replace('</style>',open('shell.css').read()+'</style>',1)
