/* SalesPilot 개인 브라우저 사용자 관리. appRole은 인증/접근 권한이 아닙니다. */
(function (g) {
  'use strict';
  const ACTIVE_KEY = 'salespilot-active-user-id';
  const ownProfileWrites = new Set();
  const FIELDS = [['name', '이름'], ['rank', '직급'], ['org', '소속'], ['dept', '부서'], ['phone', '연락처'], ['email', '이메일']];
  let dialog, initialized = false, observer, editingId = '', rows = [], operation = Promise.resolve(), booting, fallbackOwner;
  const localMode = () => !!(g.SalesPilotPlatform && g.SalesPilotPlatform.mode === 'browser' && g.SalesPilotPlatform.database);
  const db = () => { if (!localMode()) throw new Error('사용자 관리는 개인 브라우저 저장 모드에서만 사용할 수 있습니다. 외부 사용자 정보는 조회하지 않습니다.'); return g.SalesPilotPlatform.database; };
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const validId = id => typeof id === 'string' && id.length > 0 && !/[\/\\\u0000-\u001f]/.test(id);
  const profilePath = id => 'data/users/' + id + '/profile';
  const userRef = id => db().collection('_users').doc(id);
  const storedId = () => g.localStorage.getItem(ACTIVE_KEY);
  const serial = fn => { const result = operation.then(fn); operation = result.catch(() => {}); return result; };
  async function readRows() {
    const snap = await db().collection('_users').get();
    return snap.docs.map(d => Object.assign({}, d.data(), { id: d.id }));
  }
  function observed(profile) {
    const result = {};
    FIELDS.forEach(([key]) => { if (profile && Object.prototype.hasOwnProperty.call(profile, key)) result[key] = profile[key]; });
    return result;
  }
  function baseUser(id, profile) {
    return Object.assign({ id, name: '', rank: '', org: '', phone: '', email: '', dept: '', appRole: '일반사용자', active: true }, observed(profile));
  }
  async function bootstrap(fallbackId) {
    if (!localMode()) return fallbackId || null;
    if (validId(fallbackId)) fallbackOwner = fallbackId;
    if (booting) { await booting; return resolveActive(); }
    booting = serial(async () => {
      const existing = await readRows();
      if (!existing.length) {
        const owner = fallbackOwner || g.localStorage.getItem('salespilot-browser-id');
        const id = validId(owner) ? owner : g.crypto.randomUUID();
        const snap = await db().doc(profilePath(id)).get();
        await userRef(id).set(baseUser(id, snap.exists ? snap.data() : null));
        g.localStorage.setItem(ACTIVE_KEY, id);
      }
    });
    try { await booting; } finally { booting = null; }
    return resolveActive();
  }
  async function resolveActive() {
    const list = await readRows();
    const selected = storedId();
    const current = list.find(u => u.id === selected && u.active !== false) || list.find(u => u.id === fallbackOwner && u.active !== false) || list.find(u => u.active !== false);
    if (!current) throw new Error('활성 사용자가 없습니다. 사용자 저장 상태를 확인하세요.');
    if (selected !== current.id) g.localStorage.setItem(ACTIVE_KEY, current.id);
    return current.id;
  }
  async function getActiveUserId(fallbackId) { return bootstrap(fallbackId); }
  async function getActiveUser() {
    if (!localMode()) return null;
    const id = await getActiveUserId();
    const snap = await userRef(id).get();
    return snap.exists ? Object.assign({}, snap.data(), { id }) : null;
  }
  async function syncProfile(path, profile) {
    if (!localMode() || typeof path !== 'string' || !profile || typeof profile !== 'object' || Array.isArray(profile)) return;
    const match = /^data\/users\/([^/]+)\/profile$/.exec(path.replace(/^\/+|\/+$/g, ''));
    if (!match || !validId(match[1]) || ownProfileWrites.has(profilePath(match[1]))) return; // 자체 저장과 _users 쓰기는 재귀 동기화하지 않습니다.
    return serial(async () => {
      const id = match[1], snap = await userRef(id).get();
      const old = snap.exists ? snap.data() : baseUser(id);
      await userRef(id).set(Object.assign({}, old, observed(profile), { id }));
      g.dispatchEvent(new CustomEvent('salespilot-users-change'));
    });
  }
  async function saveUser(input) {
    return serial(async () => {
      const list = await readRows(), old = list.find(u => u.id === input.id);
      if (!validId(input.id)) throw new Error('사용자 ID가 올바르지 않습니다.');
      if (!['관리자', '일반사용자'].includes(input.appRole)) throw new Error('역할을 선택하세요.');
      if (!input.active) {
        if (input.id === storedId()) throw new Error('현재 사용자는 비활성화할 수 없습니다. 다른 사용자로 전환한 뒤 수정하세요.');
        if (!list.some(u => u.id !== input.id && u.active !== false)) throw new Error('활성 사용자는 최소 1명 유지해야 합니다.');
      }
      const ref = db().doc(profilePath(input.id)), snap = await ref.get();
      const merged = Object.assign({}, snap.exists ? snap.data() : {}, observed(input));
      const record = Object.assign({}, old || baseUser(input.id), observed(input), { id: input.id, appRole: input.appRole, active: input.active });
      // 프로필의 알 수 없는 필드는 보존. 두 SDK 문서는 원자적 트랜잭션 API가 없어 순차 저장합니다.
      ownProfileWrites.add(profilePath(input.id));
      try { await ref.set(merged); } finally { ownProfileWrites.delete(profilePath(input.id)); }
      await userRef(input.id).set(record);
      g.dispatchEvent(new CustomEvent('salespilot-users-change'));
      return record;
    });
  }
  function message(text, error) {
    if (!dialog) return;
    const el = dialog.querySelector('#sp-settings-message'); el.textContent = text || ''; el.dataset.error = error ? 'true' : 'false';
  }
  // UI는 아래 함수에서 한 번 생성하고 이벤트를 직접 연결합니다.
  function ensurePage() {
    if (dialog) return;
    const style = document.createElement('style'); style.id = 'salespilot-settings-style';
    style.textContent = `
#sp-settings-page{box-sizing:border-box;position:fixed;inset:0;width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;border:0;padding:0;background:#f8fafc;color:#172033;font:15px/1.5 system-ui,sans-serif;z-index:2500;overflow:auto}
#sp-settings-page::backdrop{background:#11182799}#sp-settings-page *{box-sizing:border-box}#sp-settings-page [hidden]{display:none!important}
#sp-settings-page header{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;background:#fff;border-bottom:1px solid #dbe2ea}#sp-settings-page h1{font-size:24px;margin:0}#sp-settings-page h2{font-size:20px;margin:0 0 16px}
#sp-settings-page .sp-layout{display:grid;grid-template-columns:200px minmax(0,1fr);min-height:calc(100% - 80px)}#sp-settings-page nav{padding:20px;border-right:1px solid #dbe2ea;background:#fff}#sp-settings-page nav button{width:100%;text-align:left;margin-bottom:8px}#sp-settings-page button,#sp-settings-page input,#sp-settings-page select{font:inherit}#sp-settings-page button{cursor:pointer;padding:9px 14px;border:1px solid #cbd5e1;border-radius:7px;background:white;color:#172033}#sp-settings-page button:disabled{cursor:not-allowed;opacity:.55}#sp-settings-page button[aria-selected=true],#sp-settings-page .sp-primary{background:#175cd3;color:white;border-color:#175cd3}#sp-settings-page :focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
#sp-settings-page main{padding:24px;min-width:0}#sp-settings-page .sp-card{background:white;border:1px solid #dbe2ea;border-radius:10px;padding:20px;margin:16px 0}#sp-settings-page .sp-warning{background:#fff8e5;padding:12px;border-radius:7px;color:#6b4700}#sp-settings-page .sp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}#sp-settings-page label{display:block}#sp-settings-page label input:not([type=checkbox]),#sp-settings-page label select{display:block;width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:6px;margin-top:4px}#sp-settings-page .sp-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}#sp-settings-page .sp-table{overflow:auto}#sp-settings-page table{width:100%;border-collapse:collapse;text-align:left}#sp-settings-page th,#sp-settings-page td{padding:10px;border-bottom:1px solid #e2e8f0;vertical-align:top;overflow-wrap:anywhere}#sp-settings-page td button{margin:2px}#sp-settings-message{white-space:pre-wrap;margin-bottom:16px}#sp-settings-message[data-error=true]{color:#b42318}#sp-settings-page dl{display:grid;grid-template-columns:130px 1fr;gap:8px}#sp-settings-page dd{margin:0;overflow-wrap:anywhere}
@media(max-width:680px){#sp-settings-page .sp-layout{display:block}#sp-settings-page nav{display:flex;gap:6px;padding:12px;border-right:0;border-bottom:1px solid #dbe2ea}#sp-settings-page nav button{width:auto;margin:0;padding:8px}#sp-settings-page main{padding:16px}#sp-settings-page .sp-grid{grid-template-columns:1fr}#sp-settings-page header{padding:14px 16px}#sp-settings-page th,#sp-settings-page td{min-width:90px}}
`;
    document.head.append(style);
    dialog = document.createElement('dialog'); dialog.id = 'sp-settings-page'; dialog.setAttribute('aria-labelledby', 'sp-settings-heading');
    dialog.innerHTML = `<header><h1 id="sp-settings-heading">환경설정</h1><button id="sp-settings-close" type="button">닫기</button></header><div class="sp-layout"><nav role="tablist" aria-label="환경설정 항목">${[['users','사용자관리'],['files','저장폴더'],['ai','AI연결']].map(([id,label], i) => `<button id="sp-settings-tab-${id}" type="button" role="tab" data-settings-tab="${id}" aria-selected="${i===0}" aria-controls="sp-settings-panel-${id}">${label}</button>`).join('')}</nav><main><div id="sp-settings-message" role="status" aria-live="polite"></div><section id="sp-settings-panel-users" role="tabpanel" aria-labelledby="sp-settings-tab-users"><h2>사용자관리</h2><p class="sp-warning">이 목록은 이 브라우저의 개인 저장소에 저장됩니다. 관리자/일반사용자 역할은 관리용 표시일 뿐, 서버 인증이나 권한 통제가 아닙니다. 공용 PC에 개인정보를 입력하지 마세요.</p><div class="sp-actions"><button id="sp-user-new" type="button">사용자 생성</button></div><div class="sp-card sp-table"><table><thead><tr><th>이름 / 소속</th><th>역할</th><th>상태</th><th>작업</th></tr></thead><tbody id="sp-user-rows"></tbody></table></div><form id="sp-user-form" class="sp-card"><h3 id="sp-user-form-title">사용자 생성</h3><input id="sp-user-id" type="hidden"><div class="sp-grid">${FIELDS.map(([key,label]) => `<label for="sp-user-${key}">${label}<input id="sp-user-${key}" name="${key}" type="${key==='email'?'email':key==='phone'?'tel':'text'}" maxlength="300"></label>`).join('')}<label for="sp-user-role">관리용 역할<select id="sp-user-role"><option>일반사용자</option><option>관리자</option></select></label><label for="sp-user-active"><input id="sp-user-active" type="checkbox" checked> 활성 사용자</label></div><p>이름이 비어 있으면 ‘이름 미설정’으로 표시됩니다. 입력하지 않은 작성자 정보는 업무 문서에 임의로 채우지 않습니다.</p><div class="sp-actions"><button class="sp-primary" id="sp-user-save" type="submit">저장</button><button id="sp-user-cancel" type="button">편집 취소</button></div></form></section><section id="sp-settings-panel-files" role="tabpanel" aria-labelledby="sp-settings-tab-files" hidden><h2>저장폴더</h2><p>추천 위치: OneDrive → 문서 → Amaranth10 → OneAI → SalesPilot_작성결과</p><p>폴더를 선택하지 않으면 작성 데이터는 브라우저에 저장되고, 파일 저장은 대기합니다. 전체 경로는 브라우저 API에서 알 수 없어 선택한 폴더 이름만 표시합니다. 브라우저 재시작 후에는 저장 권한을 다시 허용해야 할 수 있습니다.</p><div class="sp-card"><dl id="sp-files-status"></dl><div class="sp-actions"><button id="sp-files-configure" type="button">저장폴더 선택</button><button id="sp-files-allow" type="button">저장 권한 다시 허용</button><button id="sp-files-flush" type="button">대기 파일 저장</button></div><label for="sp-files-auto" style="margin-top:16px"><input id="sp-files-auto" type="checkbox"> 선택한 폴더에 자동 저장</label></div></section><section id="sp-settings-panel-ai" role="tabpanel" aria-labelledby="sp-settings-tab-ai" hidden><h2>AI연결</h2><p>기존 AI 연결 설정 화면에서 실제 제공받은 서버 주소와 모델을 설정하세요. 이 페이지는 새 서버 주소나 인증 정보를 만들지 않습니다.</p><button id="sp-ai-settings" type="button">AI 연결 설정 열기</button></section></main></div>`;
    document.body.append(dialog);
    dialog.querySelector('#sp-settings-close').onclick = () => dialog.close();
    dialog.querySelectorAll('[data-settings-tab]').forEach(button => { button.onclick = () => selectTab(button.dataset.settingsTab); });
    dialog.querySelector('nav').addEventListener('keydown', e => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
      const tabs = [...dialog.querySelectorAll('[data-settings-tab]')], index = tabs.indexOf(document.activeElement);
      if (index < 0) return; e.preventDefault();
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : (index + (e.key==='ArrowRight'?1:-1) + tabs.length)%tabs.length;
      tabs[next].click(); tabs[next].focus();
    });
    dialog.querySelector('#sp-user-new').onclick = () => editUser(null);
    dialog.querySelector('#sp-user-cancel').onclick = () => editUser(null);
    dialog.querySelector('#sp-user-form').addEventListener('submit', submitUser);
    document.addEventListener('keydown', event => {
      if (!dialog.open || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
      event.preventDefault(); event.stopPropagation();
      if (event.target.closest && event.target.closest('#sp-user-form')) dialog.querySelector('#sp-user-form').requestSubmit();
    }, { capture: true });
    dialog.querySelector('#sp-user-rows').addEventListener('click', rowAction);
    // 폴더 선택/권한 요청을 await 없이 사용자 click 안에서 바로 호출합니다.
    [['configure','configureDirectory'],['allow','allowDirectory'],['flush','flushPending']].forEach(([id,method]) => {
      dialog.querySelector('#sp-files-'+id).onclick = () => {
        const api = g.SalesPilotFiles;
        if (!api || typeof api[method] !== 'function') { message('저장폴더 기능이 아직 연결되지 않았습니다.', true); return; }
        try { Promise.resolve(api[method]()).then(refreshFiles).catch(e => message(e.message || '파일 저장 작업에 실패했습니다.', true)); }
        catch (e) { message(e.message, true); }
      };
    });
    dialog.querySelector('#sp-files-auto').onchange = e => {
      try { Promise.resolve(g.SalesPilotFiles.setAutoSave(e.target.checked)).then(refreshFiles).catch(err => { message(err.message, true); refreshFiles(); }); }
      catch (err) { message(err.message, true); refreshFiles(); }
    };
    dialog.querySelector('#sp-ai-settings').onclick = () => {
      if (g.SalesPilotAI && typeof g.SalesPilotAI.openSettings === 'function') { dialog.close(); g.SalesPilotAI.openSettings(); }
      else message('기존 AI 연결 설정 기능이 아직 연결되지 않았습니다.', true);
    };
    editUser(null); selectTab('users');
  }
  function selectTab(id) {
    dialog.querySelectorAll('[data-settings-tab]').forEach(b => { const selected = b.dataset.settingsTab === id; b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1; });
    ['users','files','ai'].forEach(key => { dialog.querySelector('#sp-settings-panel-'+key).hidden = key !== id; });
    if (id === 'files') refreshFiles();
  }
  function editUser(user) {
    editingId = user ? user.id : '';
    dialog.querySelector('#sp-user-id').value = editingId;
    FIELDS.forEach(([key]) => { dialog.querySelector('#sp-user-'+key).value = user && user[key] != null ? String(user[key]) : ''; });
    dialog.querySelector('#sp-user-role').value = user && user.appRole === '관리자' ? '관리자' : '일반사용자';
    const active = dialog.querySelector('#sp-user-active'); active.checked = !user || user.active !== false; active.disabled = !!user && user.id === storedId();
    dialog.querySelector('#sp-user-form-title').textContent = user ? '사용자 수정' : '사용자 생성';
  }
  async function refreshUsers() {
    if (!localMode()) {
      dialog.querySelector('#sp-user-form').hidden = true;
      dialog.querySelector('#sp-user-new').disabled = true;
      dialog.querySelector('#sp-user-rows').innerHTML = '<tr><td colspan="4">개인 브라우저 저장 모드에서만 사용자 목록을 관리합니다. 외부 클라우드 사용자 정보는 조회하지 않습니다.</td></tr>'; return;
    }
    await getActiveUserId(); rows = await readRows();
    const current = storedId();
    dialog.querySelector('#sp-user-rows').innerHTML = rows.map((u,i) => `<tr data-user-id="${esc(u.id)}"><td><b>${esc(u.name || '이름 미설정')}</b><br>${esc([u.org,u.dept].filter(Boolean).join(' · '))}</td><td>${esc(u.appRole || '일반사용자')}</td><td>${u.active===false?'비활성':'활성'}${u.id===current?' · 현재 사용자':''}</td><td><button id="sp-user-edit-${i}" type="button" data-user-action="edit" aria-label="${esc(u.name || '이름 미설정')} 수정">수정</button><button id="sp-user-toggle-${i}" type="button" data-user-action="toggle" ${u.id===current?'disabled':''}>${u.active===false?'활성화':'비활성화'}</button><button id="sp-user-select-${i}" type="button" data-user-action="select" ${u.active===false||u.id===current?'disabled':''}>현재 사용자로 적용</button></td></tr>`).join('');
  }
  async function submitUser(event) {
    event.preventDefault();
    const button = dialog.querySelector('#sp-user-save'); if (button.disabled) return; button.disabled = true;
    const input = { id: editingId || g.crypto.randomUUID(), appRole: dialog.querySelector('#sp-user-role').value, active: dialog.querySelector('#sp-user-active').checked };
    FIELDS.forEach(([key]) => { input[key] = dialog.querySelector('#sp-user-'+key).value.trim(); });
    try { await saveUser(input); await refreshUsers(); editUser(rows.find(u => u.id === input.id)); message('사용자와 작성자 프로필을 저장했습니다. 현재 화면의 작성자 정보 반영은 다시 열기/새로고침 후 확인하세요.'); }
    catch (e) { message('저장을 완료하지 못했습니다. ' + (e.message || e) + ' 다시 저장하면 두 문서를 동기화합니다.', true); }
    finally { button.disabled = false; }
  }
  async function rowAction(event) {
    const button = event.target.closest('[data-user-action]'); if (!button || button.disabled) return;
    const row = button.closest('[data-user-id]'), user = rows.find(u => u.id === row.dataset.userId); if (!user) return;
    if (button.dataset.userAction === 'edit') { editUser(user); dialog.querySelector('#sp-user-name').focus(); return; }
    button.disabled = true;
    try {
      if (button.dataset.userAction === 'toggle') { await saveUser(Object.assign({}, user, { active: user.active === false })); await refreshUsers(); message('사용자 상태를 저장했습니다.'); }
      else {
        // 앱 편집/녹음/AI 처리 중에는 사용자 전환을 시작하지 않습니다.
        const workspace = g.SalesPilotWorkspace;
        if (workspace && ((typeof workspace.hasUnsavedChanges === 'function' && await workspace.hasUnsavedChanges()) || (typeof workspace.isBusy === 'function' && await workspace.isBusy()))) { message('저장하지 않은 변경 또는 진행 중인 작업이 있습니다. 먼저 저장하고 녹음/분석 등의 작업을 종료한 뒤 사용자를 전환하세요.', true); return; }
        const latest = (await readRows()).find(u => u.id === user.id);
        if (!latest || latest.active === false) throw new Error('활성 사용자만 선택할 수 있습니다.');
        if (!g.confirm((latest.name || '이름 미설정') + ' 사용자를 현재 사용자로 적용하고 새로고침할까요?')) return;
        g.localStorage.setItem(ACTIVE_KEY, latest.id); g.location.reload();
      }
    } catch (e) { message(e.message || '사용자 작업에 실패했습니다.', true); }
    finally { if (button.isConnected) button.disabled = false; }
  }
  async function refreshFiles() {
    if (!dialog) return;
    const api = g.SalesPilotFiles;
    try {
      const status = api && typeof api.getStatus === 'function' ? await api.getStatus() : null;
      const enabled = !!status && status.supported !== false;
      ['configure','allow','flush','auto'].forEach(id => { dialog.querySelector('#sp-files-'+id).disabled = !enabled; });
      dialog.querySelector('#sp-files-auto').checked = !!(status && status.autoSave);
      const values = status ? [['지원',status.supported?'사용 가능':'이 브라우저는 폴더 선택 미지원'],['선택 폴더',status.directoryName || '미선택 (브라우저 저장 대기)'],['권한',status.permission || '미확인'],['대기 파일',status.pendingCount == null?'미확인':String(status.pendingCount)],['최근 저장', measuredSaved(status.lastSaved)],['최근 오류', measuredSaved(status.lastError)]] : [['상태','저장폴더 기능이 아직 연결되지 않았습니다.']];
      dialog.querySelector('#sp-files-status').innerHTML = values.map(([key,value]) => '<dt>'+esc(key)+'</dt><dd>'+esc(value)+'</dd>').join('');
    } catch (e) { message(e.message || '저장폴더 상태를 읽지 못했습니다.', true); }
  }
  function measuredSaved(value) {
    if (value == null || value === '') return '기록 없음';
    if (typeof value === 'object') {
      // 실제 API에서 받은 파일명/상태/시각만 표시합니다.
      const names = Array.isArray(value.filenames) ? value.filenames.join(', ') : value.filename || value.name;
      const stamp = value.savedAt || value.at || value.time;
      const time = stamp && !Number.isNaN(new Date(stamp).getTime()) ? new Date(stamp).toLocaleString('ko-KR') : stamp;
      return [names, value.status, time, value.message].filter(v => v != null && v !== '').join(' · ') || '기록 있음 (표시 가능한 정보 없음)';
    }
    return String(value);
  }
  async function openPage() {
    initialize(); ensurePage();
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else { dialog.setAttribute('open',''); dialog.close = () => dialog.removeAttribute('open'); }
    }
    message('');
    try { await refreshUsers(); await refreshFiles(); }
    catch (e) { message(e.message || '환경설정을 읽지 못했습니다.', true); }
    dialog.querySelector('#sp-settings-close').focus();
    // 부모 router가 hash를 관리하므로 여기서는 location/hash를 변경하지 않습니다.
  }
  function insertEntrypoints() {
    const nav = document.querySelector('#snav-items');
    if (nav && !nav.querySelector('[data-route="settings"]')) {
      const link = document.createElement('a'); link.id = 'snav-settings'; link.className = 'it'; link.href = '#settings'; link.dataset.route = 'settings'; link.title = '환경설정';
      link.innerHTML = '<span aria-hidden="true">⚙</span><span class="lb">환경설정</span>'; nav.append(link);
    }
    const bar = document.querySelector('#salespilot-platform-info');
    if (bar && !bar.querySelector('#sp-platform-settings')) {
      const button = document.createElement('button'); button.id = 'sp-platform-settings'; button.type = 'button'; button.textContent = '환경설정'; button.onclick = () => openPage(); bar.append(button);
    }
  }
  function initialize() {
    if (initialized) { insertEntrypoints(); return; }
    if (!document.body) { document.addEventListener('DOMContentLoaded', initialize, { once: true }); return; }
    initialized = true; insertEntrypoints();
    observer = new MutationObserver(insertEntrypoints);
    // 내비가 innerHTML로 재작성되거나 플랫폼 안내가 늦게 생성되어도 복구합니다.
    observer.observe(document.body, { childList: true, subtree: true });
    g.addEventListener('salespilot-files-change', () => { if (dialog && dialog.open) refreshFiles(); });
    g.addEventListener('salespilot-users-change', () => { if (dialog && dialog.open) refreshUsers().catch(e => message(e.message, true)); });
  }
  g.SalesPilotSettings = { getActiveUserId, getActiveUser, syncProfile, openPage, initialize };
  initialize();
})(window);
