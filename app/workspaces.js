/* Native analysis-request workspaces. External services are not embedded or impersonated. */
(function (g) {
  'use strict';
  const SERVICES = [
    { kind: 'contract', title: '계약서초안', detail: '입력한 조건과 자료를 바탕으로 계약 초안 분석을 요청합니다. 법률 검토·계약 확정 기능이 아닙니다.' },
    { kind: 'technical', title: '기술문서', detail: '사용자가 제공한 기술 자료의 요약·비교·검토를 요청하는 내장 작업공간입니다. 외부 기술문서 검색 서비스나 모델에 연결되지 않습니다.' },
    { kind: 'administrative', title: '행정사례', detail: '사용자가 제공한 행정사례 자료의 비교·근거 정리를 요청하는 내장 작업공간입니다. 외부 행정사례 데이터베이스에 연결되지 않습니다.' },
    { kind: 'public-sales', title: '공공영업', detail: '사용자가 제공한 공공영업 자료로 전략 검토를 요청하는 내장 작업공간입니다. 외부 영업 코치·조직·계정 관리 서비스에 연결되지 않습니다.' }
  ];
  const mounted = new WeakMap();
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
    root.append(style, tabs, panel(SERVICES[instance.index], instance.states[instance.index], instance)); instance.host.replaceChildren(root);
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
