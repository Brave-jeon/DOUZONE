/* SalesPilot 서버 회원 인증. 브라우저 사용자 목록/저장값은 인증에 사용하지 않습니다. */
(function (g) {
  'use strict';
  const FIELDS = [['name','이름'], ['email','이메일'], ['rank','직급'], ['org','소속'], ['dept','부서'], ['phone','연락처']];
  let currentUser = null, initialization, gate, page, connected = false, needsMaster = false, adminRows = [], editingId = null;
  const chosen = { register: null, setup: null, profile: null };
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = id => document.getElementById(id);
  function failure(text, status, code) { const e = new Error(text); e.status = status || 0; e.code = code || 'api_error'; return e; }
  function validUser(u) { return !!u && (typeof u.id === 'string' || typeof u.id === 'number') && String(u.id).length > 0 && ['master','member'].includes(u.role) && ['active','pending','disabled'].includes(u.status); }
  function setUser(u) {
    currentUser = validUser(u) && u.status === 'active' ? Object.assign({}, u) : null;
    g.dispatchEvent(new CustomEvent('salespilot-auth-change', { detail: { user: getUser() } }));
  }
  function getUser() { return currentUser ? Object.assign({}, currentUser) : null; }
  function isAuthenticated() { return !!currentUser && currentUser.status === 'active'; }
  function isMaster() { return isAuthenticated() && currentUser.role === 'master'; }
  // 요청은 같은 출처의 /api 아래로만 제한합니다. 응답의 세션 쿠키는 브라우저가 관리합니다.
  async function request(path, options) {
    if (typeof path !== 'string' || !/^\/api\/[^?#]+(?:\?[^#]*)?$/.test(path) || /\\|[\u0000-\u0020]/.test(path)) throw failure('허용되지 않은 회원 서버 요청 경로입니다.');
    let decodedPath;
    try { decodedPath = decodeURIComponent(path.split('?')[0]); } catch (_) { throw failure('회원 서버 요청 경로 인코딩이 올바르지 않습니다.'); }
    if (/(?:^|\/)\.{1,2}(?:\/|$)|\\|[\u0000-\u001f]/.test(decodedPath)) throw failure('허용되지 않은 회원 서버 요청 경로입니다.');
    if (!/^https?:$/.test(g.location.protocol)) throw failure('회원 서버가 연결되지 않았습니다. PC 서버 버전으로 접속하세요.', 0, 'offline');
    const opts = Object.assign({}, options || {}), controller = new AbortController();
    const externalSignal = opts.signal;
    const abort = () => controller.abort();
    if (externalSignal) { if (externalSignal.aborted) abort(); else externalSignal.addEventListener('abort', abort, { once: true }); }
    const timer = g.setTimeout(abort, 15000);
    const headers = new Headers(opts.headers || {}); headers.set('Accept', 'application/json');
    if (opts.body != null && typeof opts.body === 'object' && !(opts.body instanceof FormData) && !(opts.body instanceof Blob)) { opts.body = JSON.stringify(opts.body); headers.set('Content-Type','application/json'); }
    else if (typeof opts.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
    opts.headers = headers; opts.credentials = 'include'; opts.mode = 'same-origin'; opts.cache = 'no-store'; opts.redirect = 'error'; opts.signal = controller.signal;
    try {
      const response = await g.fetch(path, opts);
      let data;
      try { data = await response.json(); } catch (_) { throw failure('회원 서버의 응답 형식이 올바르지 않습니다. PC 서버 버전과 연결 상태를 확인하세요.', response.status, 'offline'); }
      if (!response.ok || !data || data.ok !== true) {
        if (response.status === 401) { setUser(null); if (gate) showGate(); }
        const defaults = {401:'로그인이 필요하거나 세션이 만료되었습니다.',403:'이 작업을 수행할 권한이 없습니다.',429:'요청이 너무 많습니다. 잠시 후 다시 시도하세요.'};
        const text = data && typeof data.error === 'string' && /[가-힣]/.test(data.error) ? data.error : defaults[response.status] || '회원 서버 요청에 실패했습니다. 다시 시도하세요.';
        throw failure(text, response.status);
      }
      return data;
    } catch (e) {
      if (e && e.code) throw e;
      if (e && e.name === 'AbortError') throw failure('회원 서버 응답 시간이 초과되었습니다. 연결 상태를 확인하고 다시 시도하세요.', 0, 'offline');
      throw failure('회원 서버가 연결되지 않았습니다. PC 서버를 실행하고 아래 PC 서버 버전으로 접속하세요.', 0, 'offline');
    } finally { g.clearTimeout(timer); if (externalSignal) externalSignal.removeEventListener('abort', abort); }
  }
  function message(id, text, error) { const el = $(id); if (el) { el.textContent = text || ''; el.dataset.error = error ? 'true' : 'false'; } }
  function mountStyle() {
    if ($('sp-auth-style')) return;
    const s = document.createElement('style'); s.id = 'sp-auth-style';
    s.textContent = `
#sp-auth-gate,#sp-member-page{box-sizing:border-box;color:#172033;font:15px/1.6 system-ui,sans-serif;background:#f8fafc;z-index:10000}
#sp-auth-gate{position:fixed;inset:0;overflow:auto;padding:32px 16px}#sp-auth-gate[hidden],#sp-member-page [hidden],#sp-auth-gate [hidden]{display:none!important}
#sp-auth-gate *,#sp-member-page *{box-sizing:border-box}#sp-auth-gate .sp-auth-card{max-width:720px;margin:0 auto;background:#fff;border:1px solid #dbe2ea;border-radius:14px;padding:26px;box-shadow:0 12px 45px #17203316}
#sp-auth-gate h1,#sp-member-page h1{font-size:25px;margin:0 0 12px}#sp-auth-gate h2,#sp-member-page h2{font-size:20px;margin:12px 0}
#sp-auth-gate button,#sp-member-page button,#sp-auth-gate input,#sp-member-page input,#sp-member-page select{font:inherit}
#sp-auth-gate button,#sp-member-page button{cursor:pointer;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#172033;padding:9px 14px}#sp-auth-gate button:disabled,#sp-member-page button:disabled{opacity:.5;cursor:not-allowed}
#sp-auth-gate .sp-primary,#sp-member-page .sp-primary,#sp-auth-gate [aria-selected=true]{background:#175cd3;color:#fff;border-color:#175cd3}
#sp-auth-gate :focus-visible,#sp-member-page :focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
.sp-auth-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}#sp-auth-gate label,#sp-member-page label{display:block}
#sp-auth-gate input,#sp-member-page input,#sp-member-page select{width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:6px;margin:4px 0 0}
.sp-auth-actions{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.sp-auth-note{padding:12px;background:#fff8e5;border-radius:7px;color:#6b4700;overflow-wrap:anywhere}.sp-auth-message{white-space:pre-wrap;overflow-wrap:anywhere;margin:14px 0}.sp-auth-message[data-error=true]{color:#b42318}.sp-auth-folder{padding:14px;background:#f1f5f9;border-radius:8px;margin-top:14px}
#sp-member-page{position:fixed;inset:0;width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;border:0;padding:24px;overflow:auto}#sp-member-page::backdrop{background:#11182799}#sp-member-page .sp-member-wrap{max-width:1080px;margin:auto}#sp-member-page header{display:flex;justify-content:space-between;gap:14px;align-items:center}#sp-member-page table{border-collapse:collapse;width:100%;text-align:left}#sp-member-page th,#sp-member-page td{padding:10px;border-bottom:1px solid #dbe2ea;overflow-wrap:anywhere}#sp-member-page td button{margin:3px}#sp-member-page .sp-table-wrap{overflow:auto}#sp-member-form{padding:20px;background:white;border:1px solid #dbe2ea;border-radius:10px;margin-top:20px}
@media(max-width:620px){.sp-auth-grid{grid-template-columns:1fr}#sp-auth-gate{padding:12px}#sp-auth-gate .sp-auth-card,#sp-member-page{padding:16px}}
`;
    document.head.append(s);
  }
  function fields(prefix, password) {
    return FIELDS.map(([key,label]) => `<label for="${prefix}-${key}">${label}${key==='name'||key==='email'?' (필수)':''}<input id="${prefix}-${key}" name="${key}" type="${key==='email'?'email':key==='phone'?'tel':'text'}" maxlength="300" ${key==='name'||key==='email'?'required':''} autocomplete="${key==='name'?'name':key==='email'?'email':key==='phone'?'tel':'off'}"></label>`).join('') + (password ? `<label for="${prefix}-password">암호 (필수)<input id="${prefix}-password" name="password" type="password" required minlength="10" maxlength="256" autocomplete="new-password"><small>10자 이상 입력하세요.</small></label>` : '');
  }
  function folderFields(prefix) {
    return `<div class="sp-auth-folder"><button id="${prefix}-folder-select" type="button">개인 저장폴더 선택</button><p id="${prefix}-folder-label">선택한 폴더 없음</p><label for="${prefix}-folder-path">표시 경로 (참고용)<input id="${prefix}-folder-path" maxlength="500" placeholder="예: 내 문서 / 개인 작성결과"></label><small>브라우저는 전체 경로를 제공하지 않습니다. 표시 경로는 참고용이며 저장 권한이나 실제 경로가 아닙니다. 폴더 선택은 이 브라우저에서만 적용됩니다.</small></div>`;
  }
  function readProfile(prefix) { const out = {}; FIELDS.forEach(([key]) => { out[key] = $(prefix+'-'+key).value.trim(); }); return out; }
  function fillProfile(prefix, user) { FIELDS.forEach(([key]) => { $(prefix+'-'+key).value = user[key] || ''; }); }
  function chooseFolder(kind, prefix, msgId) {
    if (!g.showDirectoryPicker) { message(msgId,'이 브라우저는 폴더 선택을 지원하지 않습니다. 지원하는 PC 브라우저에서 다시 선택하세요.',true); return; }
    // 사용자 클릭에서 picker를 즉시 시작합니다. 인증/네트워크 await 뒤에 권한을 요청하지 않습니다.
    try {
      const selection = g.showDirectoryPicker({ mode: 'readwrite' });
      Promise.resolve(selection).then(handle => { chosen[kind] = handle; $(prefix+'-folder-label').textContent = '선택 폴더: '+handle.name; }).catch(e => { if (e.name !== 'AbortError') message(msgId,'폴더를 선택하지 못했습니다. 브라우저 권한을 확인하세요.',true); });
    } catch (_) { message(msgId,'폴더 선택을 시작하지 못했습니다. 지원하는 브라우저와 보안 연결을 확인하세요.',true); }
  }
  async function registerHandle(user, kind) {
    const handle = chosen[kind]; if (!handle) return '';
    const api = g.SalesPilotFiles;
    if (!api || typeof api.registerDirectoryForUser !== 'function') return '폴더 보관 기능이 아직 연결되지 않았습니다. 로그인 후 내 회원정보에서 폴더를 다시 선택하세요.';
    try { await api.registerDirectoryForUser(user.id, handle); chosen[kind] = null; return ''; }
    catch (_) { return '회원 처리는 완료되었지만 이 브라우저에 폴더 권한을 보관하지 못했습니다. 로그인 후 폴더를 다시 선택하세요.'; }
  }
  function folderProfile(prefix, kind) { return { folderLabel: chosen[kind] ? chosen[kind].name : '', folderPathLabel: $(prefix+'-folder-path').value.trim() }; }
  function ensureGate() {
    if (gate) return;
    mountStyle(); gate = document.createElement('section'); gate.id = 'sp-auth-gate'; gate.setAttribute('role','dialog'); gate.setAttribute('aria-modal','true'); gate.setAttribute('aria-labelledby','sp-auth-title');
    gate.innerHTML = `<div class="sp-auth-card"><h1 id="sp-auth-title">회원 로그인</h1><p>서버에 등록된 활성 회원만 업무 화면을 사용할 수 있습니다.</p><div id="sp-auth-server-note" class="sp-auth-note" hidden>회원 서버 미연결: 현재 화면에서는 회원가입이나 로그인이 처리되지 않습니다. PC 서버를 실행한 뒤 <a href="http://127.0.0.1:8768/">PC 서버 버전 열기</a>로 접속하세요.</div><p class="sp-auth-note">기본 PC 서버는 이 PC에서만 사용합니다. 인터넷 공동 회원가입에는 별도 HTTPS 호스팅이 필요합니다.</p><div class="sp-auth-actions" role="tablist" aria-label="회원 접속"><button id="sp-auth-tab-login" type="button" role="tab" aria-controls="sp-auth-panel-login" aria-selected="true">로그인</button><button id="sp-auth-tab-register" type="button" role="tab" aria-controls="sp-auth-panel-register" aria-selected="false">회원가입</button><button id="sp-auth-tab-setup" type="button" role="tab" aria-controls="sp-auth-panel-setup" aria-selected="false" hidden>처음 마스터 초기화</button></div><div id="sp-auth-message" class="sp-auth-message" role="status" aria-live="polite"></div><section id="sp-auth-panel-login" role="tabpanel" aria-labelledby="sp-auth-tab-login"><form id="sp-auth-login-form"><label for="sp-auth-login-email">이메일<input id="sp-auth-login-email" type="email" required maxlength="300" autocomplete="username"></label><label for="sp-auth-login-password">암호<input id="sp-auth-login-password" type="password" required maxlength="256" autocomplete="current-password"></label><div class="sp-auth-actions"><button id="sp-auth-login-submit" class="sp-primary" type="submit">로그인</button><button id="sp-auth-retry" type="button">서버 연결 다시 확인</button></div></form><p>가입 후에는 마스터의 승인이 필요합니다. 승인대기 또는 비활성 회원은 로그인할 수 없습니다.</p></section><section id="sp-auth-panel-register" role="tabpanel" aria-labelledby="sp-auth-tab-register" hidden><h2>일반 회원가입</h2><p>가입 계정은 일반회원으로 승인대기 상태가 됩니다. 첫 가입자도 자동으로 마스터가 되지 않습니다.</p><form id="sp-auth-register-form"><div class="sp-auth-grid">${fields('sp-auth-register',true)}</div>${folderFields('sp-auth-register')}<div class="sp-auth-actions"><button id="sp-auth-register-submit" class="sp-primary" type="submit">승인대기 회원가입</button></div></form></section><section id="sp-auth-panel-setup" role="tabpanel" aria-labelledby="sp-auth-tab-setup" hidden><h2>처음 마스터 초기화</h2><p class="sp-auth-note">서버 데이터 폴더의 setup-key.txt 파일을 직접 선택하세요. 키는 초기화 요청에만 사용하며 화면·브라우저 저장소에 보관하지 않습니다. 마스터가 이미 있으면 서버가 초기화를 거절합니다.</p><form id="sp-auth-setup-form"><label for="sp-auth-setup-file">초기화 키 파일<input id="sp-auth-setup-file" type="file" accept=".txt,text/plain" required></label><div class="sp-auth-grid">${fields('sp-auth-setup',true)}</div>${folderFields('sp-auth-setup')}<div class="sp-auth-actions"><button id="sp-auth-setup-submit" class="sp-primary" type="submit">마스터 초기화</button></div></form></section></div>`;
    document.body.append(gate);
    ['login','register','setup'].forEach(kind => { $('sp-auth-tab-'+kind).onclick = () => selectGateTab(kind); $('sp-auth-'+kind+'-form').onsubmit = e => submitGate(e, kind); });
    ['register','setup'].forEach(kind => { $('sp-auth-'+kind+'-folder-select').onclick = () => chooseFolder(kind, 'sp-auth-'+kind, 'sp-auth-message'); });
    $('sp-auth-retry').onclick = () => checkSession();
    gate.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const els = [...gate.querySelectorAll('button,input,a[href]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = els[0], last = els[els.length-1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  function selectGateTab(kind) {
    if (kind === 'setup' && !needsMaster) return;
    ['login','register','setup'].forEach(key => { $('sp-auth-panel-'+key).hidden = key !== kind; $('sp-auth-tab-'+key).setAttribute('aria-selected',String(key === kind)); });
  }
  function showGate() {
    if (!document.body) { document.addEventListener('DOMContentLoaded',showGate,{once:true}); return; }
    ensureGate(); gate.hidden = false;
    if (page && page.open) page.close();
    $('sp-auth-server-note').hidden = connected;
    $('sp-auth-tab-setup').hidden = !connected || !needsMaster;
    ['login','register','setup'].forEach(k => { $('sp-auth-'+k+'-submit').disabled = !connected; });
    if (!needsMaster) selectGateTab('login');
  }
  async function checkSession() {
    try {
      const status = await request('/api/status');
      if (typeof status.needsMaster !== 'boolean') throw failure('회원 서버 상태 응답이 올바르지 않습니다.',0,'offline');
      connected = true; needsMaster = status.needsMaster;
      try { const me = await request('/api/me'); if (!validUser(me.user)) throw failure('회원 정보 응답이 올바르지 않습니다.'); setUser(me.user); }
      catch (e) { if (e.status !== 401) throw e; setUser(null); }
      if (isAuthenticated()) { if (gate) gate.hidden = true; }
      else { showGate(); message('sp-auth-message',needsMaster ? '아직 마스터가 없습니다. 서버의 초기화 키 파일로 마스터를 먼저 초기화하세요.' : '이메일과 암호로 로그인하세요.'); }
    } catch (e) { setUser(null); connected = false; needsMaster = false; showGate(); message('sp-auth-message',e.message,true); }
    return getUser();
  }
  function initialize() {
    if (!initialization) initialization = (document.body ? Promise.resolve() : new Promise(resolve => document.addEventListener('DOMContentLoaded',resolve,{once:true}))).then(() => { ensureGate(); return checkSession(); });
    return initialization;
  }
  async function verifyActive(masterOnly) {
    const data = await request('/api/me');
    if (!validUser(data.user) || data.user.status !== 'active') { setUser(null); showGate(); throw failure('활성 회원으로 다시 로그인하세요.',401); }
    setUser(data.user);
    if (masterOnly && !isMaster()) throw failure('마스터만 환경설정과 회원관리를 사용할 수 있습니다.',403);
    return getUser();
  }
  async function submitGate(event, kind) {
    event.preventDefault(); const button = $('sp-auth-'+kind+'-submit'); if (button.disabled) return; button.disabled = true;
    const prefix = 'sp-auth-'+kind; let payload, key = '';
    try {
      if (!connected) throw failure('회원 서버 미연결 상태에서는 가입이나 로그인을 처리할 수 없습니다.');
      if (kind === 'login') payload = {email:$(prefix+'-email').value.trim(), password:$(prefix+'-password').value};
      else {
        payload = Object.assign(readProfile(prefix),folderProfile(prefix,kind),{password:$(prefix+'-password').value});
        if (kind === 'setup') {
          const file = $('sp-auth-setup-file').files[0];
          if (!file || file.name !== 'setup-key.txt' || file.size > 4096) throw failure('서버가 생성한 setup-key.txt 파일을 선택하세요.');
          key = (await file.text()).trim(); if (!key) throw failure('초기화 키 파일이 비어 있습니다.'); payload.setupKey = key;
        }
      }
      const result = await request('/api/'+(kind==='register'?'register':kind==='setup'?'setup':'login'),{method:'POST',body:payload});
      $(prefix+'-password').value = '';
      if (kind === 'setup') $('sp-auth-setup-file').value = '';
      if (!validUser(result.user)) throw failure('회원 응답을 확인할 수 없습니다. 다시 로그인하여 상태를 확인하세요.');
      if (kind === 'register') {
        if (result.user.role !== 'member' || result.user.status !== 'pending') throw failure('가입 응답이 승인대기 일반회원 규격과 다릅니다. 서버 관리자에게 확인하세요.');
        const note = await registerHandle(result.user,kind);
        selectGateTab('login'); $('sp-auth-login-email').value = result.user.email;
        message('sp-auth-message','회원가입이 완료되었습니다. 마스터 승인대기 상태이며 승인 전에는 로그인할 수 없습니다.'+(note?'\n'+note:''));
        return;
      }
      const user = await verifyActive(kind === 'setup');
      const note = kind === 'setup' ? await registerHandle(user,kind) : '';
      if (note) g.alert(note);
      // 서버 세션 쿠키만 유지합니다. 앱 상태/사용자 SDK는 새로 시작합니다.
      g.location.reload();
    } catch (e) { if (e.code === 'offline') { connected = false; $('sp-auth-server-note').hidden = false; } message('sp-auth-message',e.message,true); }
    finally { if (payload) { delete payload.password; delete payload.setupKey; } key = ''; $(prefix+'-password').value = ''; if (kind === 'setup') $('sp-auth-setup-file').value = ''; button.disabled = !connected; }
  }
  function ensurePage() {
    if (page) return; mountStyle(); page = document.createElement('dialog'); page.id = 'sp-member-page'; page.setAttribute('aria-labelledby','sp-member-title');
    page.innerHTML = `<div class="sp-member-wrap"><header><h1 id="sp-member-title">내 회원정보</h1><div class="sp-auth-actions"><button id="sp-member-logout" type="button">로그아웃</button><button id="sp-member-close" type="button">닫기</button></div></header><div id="sp-member-message" class="sp-auth-message" role="status" aria-live="polite"></div><section id="sp-member-admin" hidden><h2>회원관리</h2><p>실제 서버 회원 목록입니다. 승인·역할·비활성 변경은 서버에서 검증합니다. 마지막 활성 마스터 보호와 자기 비활성화 방지는 서버 규칙을 따릅니다.</p><div class="sp-auth-actions"><button id="sp-member-admin-refresh" type="button">목록 새로고침</button><button id="sp-member-ai" type="button">AI 연결 설정</button></div><div class="sp-table-wrap"><table><thead><tr><th>이름 / 이메일</th><th>소속 / 부서</th><th>역할</th><th>상태</th><th>작업</th></tr></thead><tbody id="sp-member-rows"></tbody></table></div></section><form id="sp-member-form"><h2 id="sp-member-form-title">내 회원정보 수정</h2><div class="sp-auth-grid">${fields('sp-member',false)}<label id="sp-member-role-label" for="sp-member-role" hidden>서버 역할<select id="sp-member-role"><option value="member">일반회원</option><option value="master">마스터</option></select></label><label id="sp-member-status-label" for="sp-member-status" hidden>회원 상태<select id="sp-member-status"><option value="pending">승인대기</option><option value="active">활성 (승인)</option><option value="disabled">비활성</option></select></label></div><div id="sp-member-own-folder">${folderFields('sp-member')}<p id="sp-member-folder-status"></p><button id="sp-member-folder-allow" type="button">저장 권한 다시 허용</button></div><div class="sp-auth-actions"><button id="sp-member-save" class="sp-primary" type="submit">회원정보 저장</button><button id="sp-member-edit-cancel" type="button" hidden>회원 편집 취소</button></div><p>암호와 초기화 키는 회원 목록에 표시하거나 저장하지 않습니다. 회원정보 변경 후 기존 앱의 작성자 정보는 새로고침하여 반영하세요.</p></form></div>`;
    document.body.append(page);
    $('sp-member-close').onclick = () => page.close(); $('sp-member-logout').onclick = () => logout();
    $('sp-member-form').onsubmit = submitMember;
    $('sp-member-folder-select').onclick = () => chooseFolder('profile','sp-member','sp-member-message');
    $('sp-member-folder-allow').onclick = () => {
      const api = g.SalesPilotFiles, user = getUser();
      if (!user || !api || typeof api.allowDirectoryForUser !== 'function') { message('sp-member-message','회원별 폴더 권한 기능이 아직 연결되지 않았습니다.',true); return; }
      // 권한 요청 함수는 click 안에서 직접 호출. 함수 내부에서도 requestPermission 전 네트워크 대기를 하지 않아야 합니다.
      try { Promise.resolve(api.allowDirectoryForUser(user.id)).then(refreshFolder).catch(() => message('sp-member-message','저장 권한을 허용하지 못했습니다. 개인 폴더를 다시 선택하세요.',true)); }
      catch (_) { message('sp-member-message','저장 권한 요청에 실패했습니다.',true); }
    };
    $('sp-member-admin-refresh').onclick = () => loadAdmin().catch(e => message('sp-member-message',e.message,true));
    $('sp-member-edit-cancel').onclick = () => { editingId = null; $('sp-member-form').hidden = true; };
    $('sp-member-rows').onclick = adminAction;
    $('sp-member-ai').onclick = async () => {
      try { await verifyActive(true); if (g.SalesPilotAI && typeof g.SalesPilotAI.openSettings === 'function') { page.close(); g.SalesPilotAI.openSettings(); } else throw failure('AI 연결 설정 기능이 아직 연결되지 않았습니다.'); }
      catch (e) { message('sp-member-message',e.message,true); }
    };
  }
  function openPageDialog() { if (!page.open) { if (typeof page.showModal === 'function') page.showModal(); else page.setAttribute('open',''); } }
  async function refreshFolder() {
    const api = g.SalesPilotFiles, user = getUser(); if (!user) return;
    if (!api || typeof api.getStatusForUser !== 'function') { $('sp-member-folder-status').textContent = '회원별 저장폴더 기능이 아직 연결되지 않았습니다.'; return; }
    try {
      const status = await api.getStatusForUser(user.id);
      $('sp-member-folder-status').textContent = status ? '현재 폴더: '+(status.directoryName || '미선택')+' · 권한: '+({granted:'허용됨',prompt:'재허용 필요',denied:'거절됨'}[status.permission] || '미확인')+' · 대기 파일: '+(status.pendingCount == null?'미확인':status.pendingCount) : '폴더 상태를 확인할 수 없습니다.';
    } catch (_) { $('sp-member-folder-status').textContent = '회원별 폴더 상태를 읽지 못했습니다.'; }
  }
  async function openMyProfile() {
    await initialize();
    try {
      const user = await verifyActive(false); ensurePage(); editingId = null; chosen.profile = null;
      $('sp-member-title').textContent = '내 회원정보 · 개인 저장폴더'; $('sp-member-admin').hidden = true; $('sp-member-form').hidden = false;
      $('sp-member-form-title').textContent = '내 회원정보 수정'; ['role-label','status-label','edit-cancel'].forEach(k => $('sp-member-'+k).hidden = true);
      $('sp-member-own-folder').hidden = false; fillProfile('sp-member',user); $('sp-member-folder-path').value = user.folderPathLabel || '';
      $('sp-member-folder-label').textContent = '등록된 폴더 표시: '+(user.folderLabel || '미선택'); message('sp-member-message',''); openPageDialog(); await refreshFolder();
    } catch (e) { showGate(); message('sp-auth-message',e.message,true); }
  }
  async function loadAdmin() {
    await verifyActive(true); const result = await request('/api/admin/users');
    if (!Array.isArray(result.users) || result.users.some(u => !validUser(u))) throw failure('회원 목록 응답이 올바르지 않습니다.');
    adminRows = result.users;
    const roles = {master:'마스터',member:'일반회원'}, states = {active:'활성',pending:'승인대기',disabled:'비활성'};
    $('sp-member-rows').innerHTML = adminRows.map((u,i) => `<tr data-member-index="${i}"><td>${esc(u.name)}<br>${esc(u.email)}</td><td>${esc(u.org)}<br>${esc(u.dept)}</td><td>${roles[u.role]}</td><td>${states[u.status]}</td><td><button type="button" data-member-action="edit">수정 / 역할 관리</button>${u.status!=='active'?'<button type="button" data-member-action="approve">승인 / 활성화</button>':'<button type="button" data-member-action="disable">비활성화</button>'}</td></tr>`).join('') || '<tr><td colspan="5">등록된 회원이 없습니다.</td></tr>';
  }
  async function openAdmin() {
    await initialize();
    try {
      await verifyActive(true); ensurePage(); $('sp-member-title').textContent = '마스터 환경설정 · 회원관리'; $('sp-member-admin').hidden = false; $('sp-member-form').hidden = true; editingId = null;
      message('sp-member-message',''); openPageDialog(); await loadAdmin();
    } catch (e) { if (!isAuthenticated()) showGate(); else g.alert(e.message); if (page) message('sp-member-message',e.message,true); }
  }
  async function adminAction(event) {
    const button = event.target.closest('[data-member-action]'); if (!button || button.disabled) return;
    const row = button.closest('[data-member-index]'), user = row && adminRows[Number(row.dataset.memberIndex)]; if (!user) return;
    button.disabled = true;
    try {
      await verifyActive(true);
      const action = button.dataset.memberAction;
      if (action === 'edit') {
        editingId = user.id; $('sp-member-form').hidden = false; $('sp-member-form-title').textContent = '회원 수정: '+user.name; fillProfile('sp-member',user);
        ['role-label','status-label','edit-cancel'].forEach(k => $('sp-member-'+k).hidden = false); $('sp-member-own-folder').hidden = true;
        $('sp-member-role').value = user.role; $('sp-member-status').value = user.status; $('sp-member-name').focus(); return;
      }
      if (!g.confirm(user.name+' 회원을 '+(action==='approve'?'승인 / 활성화':'비활성화')+'하시겠습니까?')) return;
      await request('/api/admin/users/'+encodeURIComponent(String(user.id)),{method:'PATCH',body:{status:action==='approve'?'active':'disabled'}});
      await loadAdmin(); message('sp-member-message','서버에 회원 상태를 저장했습니다.');
    } catch (e) { message('sp-member-message',e.message,true); }
    finally { if (button.isConnected) button.disabled = false; }
  }
  async function submitMember(event) {
    event.preventDefault(); const button = $('sp-member-save'); if (button.disabled) return; button.disabled = true;
    try {
      const admin = editingId !== null; const user = await verifyActive(admin); let profile = readProfile('sp-member');
      if (admin) { profile.role = $('sp-member-role').value; profile.status = $('sp-member-status').value; }
      else { profile.folderLabel = chosen.profile ? chosen.profile.name : user.folderLabel || ''; profile.folderPathLabel = $('sp-member-folder-path').value.trim(); }
      const result = await request(admin ? '/api/admin/users/'+encodeURIComponent(String(editingId)) : '/api/me',{method:'PATCH',body:profile});
      if (!validUser(result.user)) throw failure('저장된 회원 정보를 확인할 수 없습니다. 서버 상태를 다시 확인하세요.');
      if (admin) {
        await verifyActive(false);
        if (!isMaster()) { await openMyProfile(); message('sp-member-message','역할이 변경되어 회원관리 화면을 닫았습니다.'); return; }
        await loadAdmin(); message('sp-member-message','회원정보·역할·상태를 서버에 저장했습니다.');
      } else { setUser(result.user); const note = await registerHandle(result.user,'profile'); await refreshFolder(); message('sp-member-message','내 회원정보를 서버에 저장했습니다. 작성자 정보 반영을 위해 앱을 새로고침하세요.'+(note?'\n'+note:'')); g.dispatchEvent(new CustomEvent('salespilot-profile-change',{detail:{user:getUser()}})); }
    } catch (e) { message('sp-member-message',e.message,true); }
    finally { button.disabled = false; }
  }
  async function logout() {
    try { await request('/api/logout',{method:'POST'}); setUser(null); chosen.profile = null; chosen.register = null; chosen.setup = null; g.location.reload(); }
    catch (e) { if (page && page.open) message('sp-member-message','로그아웃을 완료하지 못했습니다. '+e.message,true); else { showGate(); message('sp-auth-message','로그아웃을 완료하지 못했습니다. '+e.message,true); } }
  }
  g.SalesPilotAuth = { initialize, ready: initialize, getUser, isAuthenticated, isMaster, request, showGate, openMyProfile, openAdmin, logout };
})(window);
