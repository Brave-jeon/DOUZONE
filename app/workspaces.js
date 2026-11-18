/* Native analysis-request workspaces. External services are not embedded or impersonated. */
(function (g) {
  'use strict';
  const SERVICES = [
    { kind: 'contract', title: '계약서초안', detail: '입력한 조건과 자료를 바탕으로 계약 초안 분석을 요청합니다. 법률 검토·계약 확정 기능이 아닙니다.' },
    { kind: 'technical', title: '기술문서', detail: '사용자가 제공한 기술 자료의 요약·비교·검토를 요청하는 내장 작업공간입니다. 외부 기술문서 검색 서비스나 모델에 연결되지 않습니다.' },
    { kind: 'administrative', title: '행정사례', detail: '사용자가 제공한 행정사례 자료의 비교·근거 정리를 요청하는 내장 작업공간입니다. 외부 행정사례 데이터베이스에 연결되지 않습니다.' },
    { kind: 'public-sales', title: '공공영업', detail: '사용자가 제공한 공공영업 자료로 전략 검토를 요청하는 내장 작업공간입니다. 외부 영업 코치·조직·계정 관리 서비스에 연결되지 않습니다.' }
  ];
  const EXTERNAL_SITES = [
    { title: '공공영업 인사이트 코치', icon: 'chart', subtitle: '공공영업 상황실 — 기관·기업 동향과 영업 알림', url: 'https://public-sales-insight-coach.onrender.com/', detail: '공공기관·기업 정보를 모아 오늘의 뉴스·공고·근거 변화를 집계하고, 내 영업 알림으로 알려주는 공공영업 상황실입니다. 기관 검색부터 채용 동향, 계정 관리까지 한 화면에서 처리합니다.', features: ['전체 공공기관·기업·기관별 검색','오늘 뉴스·매체정보와 근거 변화·공고 집계','내 영업 알림 — 기관·기업 신규 소식 자동 수집','나라장터 통합검색·자치체 상담기관 조회','담당자 채용 대기 현황 확인','조직도·계정 관리와 개인 초대 링크 발급'], useCase: '공공기관·기업 동향을 매일 점검해 영업 기회를 놓치지 않을 때' },
    { title: 'ERP 통합현황', icon: 'chart', subtitle: '예산·인건비·자금·법인카드·전자결재 통합 대시보드', url: new URL('./dashboards/erp/index.html', location.href).href, detail: '첨부해 주신 통합 메뉴와 연결 대시보드를 로컬 PC에서 엽니다. 포함된 데이터는 기존 파일의 저장본이며 실시간 ERP 조회 결과가 아닙니다.', features: ['5개 업무 현황을 탭으로 전환','1920×1080 및 작은 화면에 맞춘 배치','외부 사이트로 업로드하지 않고 로컬에서 표시'], useCase: '기존 ERP·경비·결재 현황 파일을 한 화면에서 확인' },
    { title: '계약서 초안 생성기', icon: 'document', subtitle: 'AI Hub 법률 문서 서식 기반 계약서 초안', url: 'https://pray2god4u.github.io/contract-generator/', detail: '법률 문서 서식 1만 8천여 건을 86개 유형으로 정리해, 서식을 고르고 정보를 넣으면 계약서 초안을 만들어 줍니다.', features: ['대분류·중분류·계약 문서/계약 외 문서로 서식 찾기','입력 정보를 반영한 초안 생성, 사내 GenAI로 AI 초안(사내망에서만)','워드(DOCX)·한글(HWPX)·텍스트로 저장, 복사'], useCase: '표준 계약서 양식에 없는 별도 약정서·합의서 초안 작성' },
    { title: '기술문서 인텔리전스', icon: 'document', subtitle: '제조현장 기술지원용 기술문서 검색', url: 'https://pray2god4u.github.io/mfg-tech-copilot/search.html', detail: 'AI Hub 기술문서 153건을 브라우저 안에서 검색·추천·비교합니다.', features: ['하이브리드·의미·본문·카탈로그 검색 방식 선택','문서 유형(데이터 설명서, 구축·활용 가이드)·데이터셋 번호 필터','검색어는 서버로 보내지 않고 이 PC에서 처리','처음 실행 시 검색 모델(약 145MB)을 내려받음'], useCase: '제조 고객 상담 전 기술 근거 확인' },
    { title: '행정사례 AI', icon: 'scales', subtitle: '공공사업 기획 근거 작업대', url: 'https://korea-admin-case-ai-mvp04.good4min.chatgpt.site/', detail: '공공사업 기록 약 2만 4천 건에서 유사 사업을 찾아 예산·과업 범위·조달 방식을 비교합니다.', features: ['기관명·사업명·목적·추정 예산으로 유사 사업 찾기','사례 5~10건을 골라 비교표 작성','출처 URL이 들어간 엑셀·문서 초안 내려받기','지방재정365·나라장터 공개 데이터 기반'], useCase: '공공기관 제안 전 유사 사례·예산 근거 정리' },
  ];
  const mounted = new WeakMap();
  function externalLinks() {
    const area = node('section', null, 'sp-external-sites'); area.setAttribute('aria-label', '업무사이트 링크');
    const paths = { document: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 12h8M8 16h8"/>', scales: '<path d="M12 3v17M6 21h12M4 7h16M7 7l-4 7h8zM17 7l-4 7h8z"/>', chart: '<path d="M4 3v17h17M8 17v-6M13 17V6M18 17V9"/>' };
    const grid = node('div', null, 'sp-external-grid');
    EXTERNAL_SITES.forEach((site, siteIndex) => {
      const card = node('article', null, 'sp-external-card' + (siteIndex === 0 ? ' sp-featured' : '')), header = node('div', null, 'sp-site-header');
      const icon = node('div', null, 'sp-site-icon'); icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths[site.icon] + '</svg>';
      const headings = node('div', null, 'sp-site-headings'); headings.append(node('h3', site.title), node('p', site.subtitle)); header.append(icon, headings);
      const features = node('ul', null, 'sp-site-features'); site.features.forEach(text => features.append(node('li', text)));
      const useCase = node('div', null, 'sp-site-use'); useCase.append(node('strong', '이럴 때: '), node('span', site.useCase));
      const footer = node('div', null, 'sp-site-footer'), actions = node('div', null, 'sp-site-actions');
      const link = node('a', '사이트 열기 ↗', 'btn pri'); link.href = site.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', site.title + ' 새 탭에서 열기');
      const feedback = node('span', '', 'sp-site-feedback'); feedback.setAttribute('aria-live', 'polite');
      const copy = button('주소 복사', async () => {
        try { await navigator.clipboard.writeText(site.url); feedback.textContent = '주소를 복사했습니다.'; }
        catch (_) { feedback.textContent = '아래 주소를 직접 선택해 복사하세요.'; }
      });
      actions.append(link, copy); footer.append(actions, node('p', site.url, 'sp-site-address'), feedback);
      card.append(header, node('p', site.detail, 'sp-site-description'), features, useCase, footer); grid.append(card);
    });
    area.append(grid); return area;
  }
  const CSS = '.sp-workspaces{width:100%;min-width:0;color:var(--text,#17243b)}.sp-workspaces .sp-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 20px}.sp-workspaces .sp-tabs button[aria-selected="true"]{background:var(--pri,#2459d3);color:#fff}.sp-workspaces .sp-panel{background:var(--panel,#fff);border:1px solid var(--line,#dce3ee);border-radius:14px;padding:24px}.sp-workspaces h2{margin:0 0 8px}.sp-workspaces p,.sp-workspaces li{line-height:1.65}.sp-workspaces .sp-muted{color:var(--muted,#53627b);font-size:13px}.sp-workspaces .sp-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;margin-top:20px}.sp-workspaces label.sp-field{display:flex;flex-direction:column;gap:8px;margin:16px 0;font-weight:600}.sp-workspaces textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:100px;border:1px solid var(--line,#cbd5e1);border-radius:8px;padding:12px;background:var(--panel,#fff);color:inherit;font:inherit;font-weight:400}.sp-workspaces input[type="file"]{max-width:100%;font:inherit}.sp-workspaces .sp-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:16px 0}.sp-workspaces .sp-consent{display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.6}.sp-workspaces .sp-consent input{margin-top:5px;flex-shrink:0}.sp-workspaces .sp-result{white-space:pre-wrap;overflow-wrap:anywhere;max-height:560px;overflow:auto;border:1px solid var(--line,#dce3ee);border-radius:8px;padding:16px;background:var(--bg,#f8fafc);font:13px/1.65 ui-monospace,monospace}.sp-workspaces .sp-status{white-space:pre-wrap;overflow-wrap:anywhere;margin:12px 0;font-size:13px;line-height:1.65}.sp-workspaces button:focus-visible,.sp-workspaces input:focus-visible,.sp-workspaces textarea:focus-visible{outline:3px solid #508df0;outline-offset:3px}@media(max-width:800px){.sp-workspaces .sp-columns{grid-template-columns:1fr}.sp-workspaces .sp-panel{padding:16px}}';
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text != null) el.textContent = text; // Every input/result/filename is rendered as inert text.
    if (className) el.className = className;
    return el;
  }
  function button(label, action, primary) {
    const b = node('button', label, 'btn' + (primary ? ' pri' : ''));
    b.type = 'button'; b.addEventListener('click', action); return b;
  }
  function field(label, input) { const el = node('label', null, 'sp-field'); el.append(node('span', label), input); return el; }
  function initialState() { return { prompt: '', text: '', files: [], approved: false, request: null, result: null, busy: false, revision: 0, status: '' }; }
  function desktop() {
    if (!g.SalesPilotDesktop) throw new Error('Desktop 파일 전달 모듈이 로드되지 않았습니다.');
    return g.SalesPilotDesktop;
  }
  function invalidate(state) {
    state.revision++; state.request = null; state.result = null; state.approved = false;
    state.status = '입력이 변경되었습니다. 자료와 개인정보를 다시 확인한 뒤 새 요청 파일을 준비하세요.';
  }
  function showResult(box, result) { box.textContent = result ? JSON.stringify(result, null, 2) : '아직 가져온 결과가 없습니다. 요청 파일을 Desktop에 직접 첨부하고 실제 결과 JSON을 저장한 뒤 가져오세요.'; }
  function panel(service, state, instance) {
    const root = node('section', null, 'sp-panel'); root.setAttribute('role', 'tabpanel');
    root.id = instance.id + '-' + service.kind; root.setAttribute('aria-labelledby', root.id + '-tab');
    root.append(node('h2', service.title + ' · 내장 분석요청'), node('p', service.detail, 'sp-muted'));
    const steps = node('ol', null, 'sp-muted');
    ['요청내용과 필요한 자료만 입력·선택합니다. 암호·API 키·토큰은 제거하고 개인정보는 최소화하세요.', '승인 후 요청 파일을 저장합니다. 저장 상태와 파일을 직접 확인하세요.', 'ONE AI Desktop을 직접 열어 요청 JSON과 모든 자료 파일을 직접 첨부합니다. ZIP은 먼저 풀어 첨부하세요.', 'Desktop에 요청 파일의 결과 JSON 스키마대로 답하도록 요청하고 결과 JSON 파일을 직접 저장합니다.', '이 화면에서 결과 JSON을 가져옵니다. 요청 ID·서비스·형식만 검증하며 내용의 사실성이나 작성자 신원은 보증하지 않습니다.'].forEach(text => steps.append(node('li', text)));
    root.append(steps);
    if (service.kind === 'contract') {
      const open = typeof instance.options.onOpenContracts === 'function' ? instance.options.onOpenContracts : typeof instance.options.onNavigate === 'function' ? () => instance.options.onNavigate('contracts') : null;
      const b = button('기존 내장 계약서 화면으로', () => { if (open) open(); });
      b.disabled = !open; if (!open) b.title = '부모 라우터의 onOpenContracts 또는 onNavigate 연결이 필요합니다.';
      root.append(b);
    }
    const cols = node('div', null, 'sp-columns'), form = node('form'), output = node('div');
    const request = node('textarea'); request.rows = 6; request.maxLength = 200000; request.value = state.prompt;
    const body = node('textarea'); body.rows = 5; body.maxLength = 200000; body.value = state.text;
    const files = node('input'); files.type = 'file'; files.multiple = true;
    const fileList = node('ul', null, 'sp-muted'), approval = node('input'); approval.type = 'checkbox'; approval.checked = state.approved;
    const consent = node('label', null, 'sp-consent'); consent.append(approval, node('span', '이 요청과 선택한 자료의 파일 저장 및 ONE AI Desktop 직접 첨부를 승인합니다. 개인정보를 최소화했고 실제 암호·키·토큰이 없음을 확인했습니다. 바이너리 문서 내용은 자동 검사가 보장되지 않습니다.'));
    const status = node('div', state.status, 'sp-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const result = node('pre', null, 'sp-result'); result.setAttribute('aria-label', '가져온 결과 JSON 원문'); showResult(result, state.result);
    const importFile = node('input'); importFile.type = 'file'; importFile.accept = '.json,application/json';
    const controls = [request, body, files, approval, importFile];
    function sync() {
      status.textContent = state.status; approval.checked = state.approved;
      controls.forEach(el => { el.disabled = state.busy; });
      prepare.disabled = state.busy || !state.approved || !state.prompt.trim();
      importFile.disabled = state.busy || !state.request;
      saveResult.disabled = state.busy || !state.result; clear.disabled = state.busy;
      showResult(result, state.result); fileList.replaceChildren();
      state.files.forEach(file => fileList.append(node('li', file.name + ' · ' + Math.ceil(file.size / 1024) + ' KB')));
    }
    async function run(action) {
      if (state.busy) return;
      state.busy = true; sync();
      try { await action(); }
      catch (e) { state.status = e && e.message || '파일 작업에 실패했습니다. 결과는 생성하지 않았습니다.'; }
      finally { state.busy = false; sync(); }
    }
    const prepare = button('ONE AI Desktop 전달 파일 저장', () => run(async () => {
      if (!state.approved || !state.prompt.trim()) throw new Error('요청내용을 입력하고 직접 승인을 체크하세요.');
      state.request = null; state.result = null; state.status = '실제 입력으로 요청 파일을 준비하는 중입니다…'; sync();
      state.request = await desktop().prepareRequest({ kind: service.kind, prompt: state.prompt, text: state.text, files: state.files, context: null });
      state.status = (state.request.status === 'saved-to-folder' ? '개인 폴더 저장 완료' : '다운로드 요청 완료 · 실제 저장 여부는 직접 확인하세요') + '\n요청 ID: ' + state.request.requestId + '\n파일: ' + state.request.savedFiles.map(file => file.filename).join(', ') + '\n' + state.request.instructions;
    }), true);
    const clear = button('입력·결과 비우기', () => {
      Object.assign(state, initialState()); request.value = ''; body.value = ''; files.value = ''; importFile.value = ''; sync();
    });
    const saveResult = button('가져온 결과 JSON 저장', () => run(async () => {
      if (!state.result) return;
      if (!g.claude || typeof g.claude.use !== 'function') throw new Error('파일 저장 연결을 사용할 수 없습니다.');
      const d = await g.claude.use('downloads');
      if (!d || typeof d.save !== 'function') throw new Error('파일 저장 연결을 사용할 수 없습니다.');
      const outcome = await d.save({ filename: 'SalesPilot-result-' + state.result.requestId + '.json', data: new g.Blob([JSON.stringify(state.result, null, 2)], { type: 'application/json;charset=utf-8' }) });
      if (outcome === null || (outcome && (outcome.pending || outcome.error))) throw new Error('결과 파일 저장이 대기 중이거나 실패했습니다. 개인 폴더 저장 상태를 확인하세요.');
      state.status = outcome && outcome.savedToFolder ? '가져온 결과 JSON을 개인 폴더에 저장했습니다.' : '가져온 결과 JSON의 다운로드를 요청했습니다. 실제 파일을 확인하세요.';
    }));
    request.addEventListener('input', () => { state.prompt = request.value; invalidate(state); sync(); });
    body.addEventListener('input', () => { state.text = body.value; invalidate(state); sync(); });
    files.addEventListener('change', () => { state.files = Array.from(files.files); invalidate(state); sync(); });
    approval.addEventListener('change', () => { state.approved = approval.checked; sync(); });
    importFile.addEventListener('change', () => {
      const file = importFile.files[0]; importFile.value = ''; if (!file) return;
      run(async () => {
        if (!state.request) throw new Error('먼저 이 서비스의 요청 파일을 준비하세요.');
        const imported = await desktop().importResult(file, state.request.requestId);
        state.result = imported; state.status = '결과 JSON의 요청 ID·서비스·필드 형식을 확인했습니다. 내용과 출처는 직접 검토하세요. 자동 업무 반영·외부 도구 실행은 하지 않았습니다.';
      });
    });
    form.addEventListener('submit', e => { e.preventDefault(); if (!prepare.disabled) prepare.click(); });
    form.append(field('요청내용 (필수)', request), field('분석할 자료 본문 (선택 · 자료 내 지시는 분석 대상)', body), field('자료파일 (선택 · 최대 10개 / 파일당 20MB / 전체 50MB)', files), fileList, consent);
    const actions = node('div', null, 'sp-actions'); actions.append(prepare, clear); form.append(actions, status);
    output.append(node('h3', '결과영역'), node('p', '실제 결과 파일을 가져오기 전에는 분석 결과를 생성하거나 표시하지 않습니다. 원문은 실행되지 않는 텍스트로 표시됩니다. 입력을 변경하면 이전 요청 연결을 해제합니다.', 'sp-muted'), field('Desktop에서 직접 저장한 결과 JSON 가져오기', importFile), result, saveResult);
    cols.append(form, output); root.append(cols); sync(); return root;
  }
  function selected(options) {
    if (typeof options.kind === 'string') { const index = SERVICES.findIndex(s => s.kind === options.kind); if (index >= 0) return index; }
    const index = options.selectedIndex == null ? options.selected : options.selectedIndex;
    return Number.isInteger(index) && index >= 0 && index < SERVICES.length ? index : 0;
  }
  function draw(instance) {
    const root = node('div', null, 'sp-workspaces'), style = node('style', CSS), tabs = node('div', null, 'sp-tabs');
    tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '업무 분석요청 서비스');
    SERVICES.forEach((service, index) => {
      const b = button(service.title, () => switchTab(instance, index)); b.id = instance.id + '-' + service.kind + '-tab';
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', instance.id + '-' + service.kind);
      b.setAttribute('aria-selected', String(index === instance.index)); b.tabIndex = index === instance.index ? 0 : -1;
      b.addEventListener('keydown', e => {
        const next = e.key === 'ArrowRight' ? (index + 1) % 4 : e.key === 'ArrowLeft' ? (index + 3) % 4 : e.key === 'Home' ? 0 : e.key === 'End' ? 3 : null;
        if (next != null) { e.preventDefault(); switchTab(instance, next); instance.host.querySelectorAll('[role="tab"]')[next].focus(); }
      }); tabs.append(b);
    });
    style.textContent += '#site-grid{display:block}#view-sites>.page-head p{max-width:520px}.sp-external-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:20px 0 16px}.sp-external-card{box-sizing:border-box;display:flex;flex-direction:column;border:1px solid var(--line,#dfe3e9);border-radius:18px;padding:18px;background:var(--surface,#fff);color:var(--text,#242a35);font-size:13px}.sp-site-header{display:flex;align-items:center;gap:12px;margin-bottom:13px}.sp-site-icon{width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;border-radius:10px;color:#285ad2;background:#edf2ff}.sp-site-icon svg{width:21px;height:21px}.sp-site-headings h3{margin:0;font-size:16px;font-weight:700;line-height:1.5}.sp-site-headings p{margin:2px 0 0;color:var(--muted,#8993a3);font-size:12px}.sp-site-description{margin:0;line-height:1.65}.sp-site-features{margin:12px 0 10px;padding-left:18px;font-size:12px;line-height:1.65}.sp-site-features li{margin:0}.sp-site-use{padding:8px 10px;border:1px solid var(--line,#eef0f4);border-radius:9px;background:var(--bg,#f7f9fc);font-size:12px;line-height:1.6}.sp-site-use strong{color:#3e63ae}.sp-site-footer{margin-top:auto;padding-top:15px}.sp-site-actions{display:flex;gap:9px;align-items:center}.sp-site-actions .btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:33px;padding:6px 12px;border:1px solid var(--line,#d9dfe8);border-radius:9px;font:inherit;font-size:12px;text-decoration:none;white-space:nowrap;background:var(--surface,#fff);color:var(--text,#283142)}.sp-site-actions .pri{background:#2459d3;border-color:#2459d3;color:#fff}.sp-site-address{margin:8px 0 0;font-size:11px;color:var(--muted,#909aab);overflow-wrap:anywhere;user-select:text}.sp-site-feedback{font-size:12px;color:#2459d3}.sp-site-feedback:empty{display:none}.sp-external-card a:focus-visible{outline:3px solid #508df0;outline-offset:3px}.sp-native-analysis{margin-top:20px}.sp-native-analysis>summary{cursor:pointer;color:var(--muted,#66738b);font-size:13px;padding:10px 0}.sp-native-analysis .sp-tabs{margin-top:12px}@media(max-width:760px){.sp-external-grid{grid-template-columns:1fr}.sp-external-card{padding:16px}}';
    const native = node('details', null, 'sp-native-analysis'); native.open = instance.analysisOpen === true;
    native.addEventListener('toggle', () => { instance.analysisOpen = native.open; });
    native.append(node('summary', '내장 분석 작업공간 열기'), tabs, panel(SERVICES[instance.index], instance.states[instance.index], instance));
    root.append(style, externalLinks(), native); instance.host.replaceChildren(root);
  }
  function switchTab(instance, index) {
    if (instance.states.some(state => state.busy)) return;
    instance.index = index; draw(instance);
    if (typeof instance.options.onSelect === 'function') instance.options.onSelect(index, SERVICES[index].kind);
  }
  let sequence = 0;
  function render(host, options) {
    if (typeof host === 'string') host = document.querySelector(host);
    if (!host || typeof host.replaceChildren !== 'function') throw new Error('작업공간을 렌더할 실제 DOM host가 필요합니다.');
    options = options || {};
    let instance = mounted.get(host);
    if (!instance) { instance = { host, id: 'sp-workspace-' + (++sequence), options, index: selected(options), states: SERVICES.map(initialState) }; mounted.set(host, instance); }
    else { instance.options = options; if (instance.states.some(state => state.busy)) return instance.controller; if (options.kind != null || options.selectedIndex != null || options.selected != null) instance.index = selected(options); }
    instance.controller = instance.controller || Object.freeze({
      select: kindOrIndex => { const index = typeof kindOrIndex === 'number' ? kindOrIndex : SERVICES.findIndex(s => s.kind === kindOrIndex); if (Number.isInteger(index) && index >= 0 && index < 4) switchTab(instance, index); },
      hasUnsavedChanges: () => instance.states.some(state => !!(state.prompt || state.text || state.files.length || state.result)),
      isBusy: () => instance.states.some(state => state.busy),
      destroy: () => { if (instance.states.some(state => state.busy)) return false; instance.states = SERVICES.map(initialState); mounted.delete(host); host.replaceChildren(); return true; }
    });
    draw(instance); return instance.controller;
  }
  g.SalesPilotWorkspaces = Object.freeze({ render, kinds: Object.freeze(SERVICES.map(s => s.kind)) });
})(window);
