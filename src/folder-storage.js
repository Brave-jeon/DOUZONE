/* User-selected PC folder storage. No server, automatic picker or credential export. */
(function (g) {
  'use strict';
  const DB_NAME = 'salespilot-files-v1';
  // Verified against app/index.html and src/{ct,br,dc,vc}.js.
  const DOCUMENT_COLLECTIONS = new Set(['quotes', 'contracts', 'discounts', 'buildreqs', 'meetings', 'termdocs']);
  const MIME = { json: 'application/json;charset=utf-8', html: 'text/html;charset=utf-8', txt: 'text/plain;charset=utf-8', pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', zip: 'application/zip' };
  const SUPPORT_MESSAGE = 'PC 폴더 저장은 최신 Chrome 또는 Edge의 HTTPS(또는 localhost) 환경에서 사용할 수 있습니다. 외부 HTTP 주소에서는 지원되지 않습니다. 일반 다운로드는 계속 사용할 수 있습니다.';
  let dbPromise, sequence = 0, saveQueue = Promise.resolve(), authEpoch = 0, observedOwner = null;
  const previews = [], owners = new Map(), streams = new Set();
  const supported = !!(g.isSecureContext && g.showDirectoryPicker && g.FileSystemDirectoryHandle && g.indexedDB);
  function emptyState(ownerId) { return { ownerId, supported, directoryName: '', permission: 'none', autoSave: true, pendingCount: 0, lastSaved: null, lastError: null }; }
  function normalizeId(id) {
    if (!['string', 'number'].includes(typeof id) || !String(id).trim() || String(id).length > 500) throw fail('서버 회원 ID가 필요합니다.', 'invalid_owner');
    return String(id);
  }
  function activeUser() {
    const u = g.SalesPilotAuth && g.SalesPilotAuth.getUser && g.SalesPilotAuth.getUser();
    return u && u.status === 'active' && u.id != null ? u : null;
  }
  function currentOwner() { const u = activeUser(); return u ? normalizeId(u.id) : null; }
  function syncOwner() {
    const id = currentOwner();
    if (id !== observedOwner) {
      observedOwner = id; authEpoch++;
      for (const stream of streams) { try { Promise.resolve(stream.abort()).catch(() => {}); } catch (_) {} }
      for (const url of previews) g.URL.revokeObjectURL(url);
      previews.length = 0;
    }
    return id;
  }
  function requireOwner(id) {
    if (id == null) throw fail('활성 회원으로 로그인해야 자기 폴더를 사용할 수 있습니다.', 'login_required');
    const ownerId = normalizeId(id);
    if (syncOwner() !== ownerId) throw fail('활성 회원으로 로그인해야 자기 폴더를 사용할 수 있습니다.', 'login_required');
    return ownerId;
  }
  function context(id) {
    id = normalizeId(id);
    if (!owners.has(id)) owners.set(id, { ownerId: id, directory: null, state: emptyState(id), loading: null });
    return owners.get(id);
  }
  function key(id) { return 'user:' + encodeURIComponent(id); }
  function snapshot(ctx) {
    const state = ctx ? ctx.state : emptyState(null);
    return Object.assign({}, state, { lastSaved: state.lastSaved ? Object.assign({}, state.lastSaved, { filenames: state.lastSaved.filenames.slice() }) : null });
  }
  function getStatus() {
    const id = syncOwner();
    if (!id) return snapshot(null);
    const ctx = context(id);
    // Avoid event/retry recursion when IndexedDB is unavailable.
    loadOwner(ctx).catch(e => { ctx.state.lastError = errorMessage(e); });
    return snapshot(ctx);
  }
  async function getStatusForUser(userId) {
    const ctx = context(requireOwner(userId));
    await loadOwner(ctx); requireOwner(ctx.ownerId); return snapshot(ctx);
  }
  function emit() { g.dispatchEvent(new CustomEvent('salespilot-files-change', { detail: getStatus() })); }
  function fail(message, code) { const e = new Error(message); e.code = code; return e; }
  function errorMessage(e) {
    if (e && typeof e.code === 'string') return e.message;
    if (e && e.name === 'AbortError') return '폴더 선택 또는 파일 저장을 취소했습니다. 기존 파일은 변경하지 않았습니다.';
    if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) return '폴더 쓰기 권한이 없습니다. 회원정보에서 ‘권한 허용’을 직접 눌러 주세요. 대기 데이터는 이 회원의 브라우저 보관함에 유지됩니다.';
    if (e && e.name === 'QuotaExceededError') return '저장 공간이 부족합니다. PC와 브라우저 저장 공간을 확보한 뒤 다시 저장해 주세요.';
    if (e && e.name === 'DataCloneError') return '폴더 권한 또는 데이터를 브라우저에 보관할 수 없습니다. Chrome/Edge 저장소 설정을 확인해 주세요.';
    return 'PC 폴더에 저장하지 못했습니다. 대기 데이터와 폴더 권한·연결 상태를 확인한 뒤 다시 시도해 주세요.';
  }
  function report(e, ctx) { const message = errorMessage(e); if (ctx) ctx.state.lastError = message; emit(); return message; }
  function queue(operation) {
    const work = saveQueue.then(operation);
    saveQueue = work.catch(() => {});
    return work;
  }
  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!g.indexedDB) { reject(fail('브라우저 저장소를 사용할 수 없습니다. 일반 다운로드를 사용해 주세요.', 'storage_unavailable')); return; }
      const req = g.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of ['handles', 'prefs', 'pending']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(fail('다른 SalesPilot 탭을 닫고 다시 시도해 주세요.', 'storage_blocked'));
      req.onsuccess = () => { req.result.onversionchange = () => { req.result.close(); dbPromise = null; }; resolve(req.result); };
    });
    return dbPromise;
  }
  async function store(name, mode, action) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, mode);
      let result;
      try { const req = action(tx.objectStore(name)); req.onsuccess = () => { result = req.result; }; }
      catch (e) { tx.abort(); reject(e); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || fail('브라우저 대기 저장에 실패했습니다.', 'storage_error'));
    });
  }
  async function refreshCount(ctx) {
    const items = await store('pending', 'readonly', s => s.getAll());
    ctx.state.pendingCount = items.filter(item => item.ownerId === ctx.ownerId).length;
  }
  async function validateHandle(handle) {
    if (!g.FileSystemDirectoryHandle || !(handle instanceof g.FileSystemDirectoryHandle) || handle.kind !== 'directory') throw fail('실제 브라우저 폴더 선택으로 얻은 폴더 권한이 필요합니다. 문자열 경로나 모의 핸들은 사용할 수 없습니다.', 'invalid_handle');
    return g.FileSystemDirectoryHandle.prototype.queryPermission.call(handle, { mode: 'readwrite' });
  }
  async function loadOwner(ctx) {
    if (ctx.loading) return ctx.loading;
    ctx.loading = (async () => {
      // Deliberately never read/migrate/delete legacy directory/settings/pending records.
      const prefs = await store('prefs', 'readonly', s => s.get(key(ctx.ownerId)));
      if (prefs && prefs.ownerId === ctx.ownerId) { ctx.state.autoSave = prefs.autoSave !== false; ctx.state.lastSaved = prefs.lastSaved || null; }
      const saved = await store('handles', 'readonly', s => s.get(key(ctx.ownerId)));
      if (saved && saved.ownerId === ctx.ownerId && saved.handle) {
        ctx.state.permission = await validateHandle(saved.handle);
        ctx.directory = saved.handle; ctx.state.directoryName = saved.handle.name;
      }
      await refreshCount(ctx);
    })();
    try { await ctx.loading; } catch (e) { ctx.loading = null; throw e; }
  }
  function makeJob(ctx) {
    requireOwner(ctx.ownerId);
    return Object.freeze({ ownerId: ctx.ownerId, handle: ctx.directory, epoch: authEpoch, ctx });
  }
  function checkJob(job) {
    if (syncOwner() !== job.ownerId || authEpoch !== job.epoch) throw fail('로그아웃 또는 회원 전환으로 폴더 저장을 중단했습니다. 원래 회원의 파일은 브라우저 대기 보관함에 유지됩니다.', 'owner_changed');
  }
  async function permission(job) {
    checkJob(job);
    const value = job.handle ? await validateHandle(job.handle) : 'none';
    checkJob(job);
    if (job.ctx.directory === job.handle) job.ctx.state.permission = value;
    return value;
  }
  function requireClick() {
    if (!g.navigator.userActivation || !g.navigator.userActivation.isActive) throw fail('폴더 선택 또는 권한 허용 버튼을 직접 눌러 주세요. 자동으로 권한을 요청하지 않습니다.', 'user_activation_required');
  }
  function configureDirectoryForUser(userId) {
    let picked, ownerId, epoch;
    try {
      ownerId = requireOwner(userId); epoch = authEpoch;
      if (!supported) throw fail(SUPPORT_MESSAGE, 'unsupported');
      // Picker starts synchronously in the actual user's click.
      requireClick(); picked = g.showDirectoryPicker({ mode: 'readwrite' });
    } catch (e) { return Promise.resolve({ ok: false, error: report(e, ownerId && context(ownerId)) }); }
    return picked.then(handle => {
      if (syncOwner() !== ownerId || epoch !== authEpoch) throw fail('회원이 변경되어 폴더 선택을 적용하지 않았습니다.', 'owner_changed');
      return registerDirectoryForUser(ownerId, handle);
    }).catch(e => ({ ok: false, error: report(e, context(ownerId)) }));
  }
  function configureDirectory() { const id = syncOwner(); return id ? configureDirectoryForUser(id) : Promise.resolve({ ok: false, error: report(fail('활성 회원으로 로그인한 뒤 폴더를 선택하세요.', 'login_required')) }); }
  async function registerDirectoryForUser(userId, handle) {
    // Explicit registration also accepts a pending ID returned by server registration.
    // The native handle is structured-cloned ONLY into this PC's IndexedDB, never HTTP/JSON.
    let ctx;
    try {
      ctx = context(userId);
      const activeId = syncOwner();
      if (activeId && activeId !== ctx.ownerId) throw fail('다른 회원의 폴더를 등록하거나 사용할 수 없습니다.', 'owner_mismatch');
      const granted = await validateHandle(handle);
      await loadOwner(ctx);
      return await queue(async () => {
        await store('handles', 'readwrite', s => s.put({ id: key(ctx.ownerId), ownerId: ctx.ownerId, handle }));
        ctx.directory = handle; ctx.state.directoryName = handle.name; ctx.state.permission = granted; ctx.state.lastError = null;
        emit();
        if (syncOwner() === ctx.ownerId && granted === 'granted') await flushInternal(makeJob(ctx));
        else if (granted !== 'granted') ctx.state.lastError = '폴더를 기억했습니다. 로그인 후 회원정보의 ‘권한 허용’을 직접 눌러 대기 파일을 저장해 주세요.';
        emit(); return { ok: true, status: snapshot(ctx) };
      });
    } catch (e) { return { ok: false, error: report(e, ctx) }; }
  }
  function registerDirectory(handle) {
    const id = syncOwner();
    return id ? registerDirectoryForUser(id, handle) : Promise.resolve({ ok: false, error: report(fail('활성 회원으로 로그인한 뒤 폴더를 등록하세요.', 'login_required')) });
  }
  function allowDirectoryForUser(userId) {
    let requested, ctx, job;
    try {
      ctx = context(requireOwner(userId)); requireClick();
      if (!ctx.directory) throw fail('폴더 정보를 불러온 뒤 저장할 PC 폴더를 선택해 주세요.', 'no_directory');
      job = makeJob(ctx);
      requested = g.FileSystemDirectoryHandle.prototype.requestPermission.call(job.handle, { mode: 'readwrite' });
    } catch (e) { return Promise.resolve({ ok: false, error: report(e, ctx) }); }
    return requested.then(value => queue(async () => {
      checkJob(job); ctx.state.permission = value;
      if (value !== 'granted') throw fail('폴더 쓰기 권한이 거부되었습니다. 대기 파일은 보관됩니다. ‘권한 허용’을 다시 눌러 주세요.', 'permission_denied');
      ctx.state.lastError = null; await flushInternal(job); emit(); return { ok: true, status: snapshot(ctx) };
    })).catch(e => ({ ok: false, error: report(e, ctx) }));
  }
  function allowDirectory() { const id = syncOwner(); return id ? allowDirectoryForUser(id) : Promise.resolve({ ok: false, error: report(fail('활성 회원으로 로그인하세요.', 'login_required')) }); }
  async function savePrefs(ctx) { await store('prefs', 'readwrite', s => s.put({ id: key(ctx.ownerId), ownerId: ctx.ownerId, autoSave: ctx.state.autoSave, lastSaved: ctx.state.lastSaved })); }
  async function setAutoSave(value) {
    const ctx = context(requireOwner(currentOwner())); await loadOwner(ctx); const job = makeJob(ctx);
    return queue(async () => {
      checkJob(job); ctx.state.autoSave = !!value;
      try { await savePrefs(ctx); if (ctx.state.autoSave) await flushInternal(job); } catch (e) { report(e, ctx); }
      emit(); return snapshot(ctx);
    });
  }
  function safeName(value) {
    const cleaned = String(value || 'SalesPilot').replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_').replace(/[. ]+$/g, '');
    const dot = cleaned.lastIndexOf('.');
    const ext = dot > 0 && cleaned.length - dot <= 16 ? cleaned.slice(dot) : '';
    let stem = (ext ? cleaned.slice(0, dot) : cleaned).slice(0, 100) || 'SalesPilot';
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem)) stem = '_' + stem;
    return stem + ext;
  }
  function uniqueName(base) {
    base = safeName(base);
    const dot = base.lastIndexOf('.'), ext = dot > 0 ? base.slice(dot) : '', stem = dot > 0 ? base.slice(0, dot) : base;
    const now = new Date(), pad = (value, count = 2) => String(value).padStart(count, '0');
    const stamp = now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()) + '_' + pad(now.getMilliseconds(),3);
    return stem + '_' + stamp + '_' + (++sequence) + '_' + g.crypto.randomUUID() + ext;
  }
  async function checkedFile(job, filename, options) {
    checkJob(job);
    if (!job.handle) throw fail('저장 폴더가 없습니다. 파일은 브라우저에 보관됩니다.', 'no_directory');
    const handle = await job.handle.getFileHandle(filename, options); checkJob(job); return handle;
  }
  async function allocate(job, base, create = true) {
    // Check only our proposed name; never enumerate/read the user's folder.
    for (let attempt = 0; attempt < 8; attempt++) {
      const filename = uniqueName(base);
      try { await checkedFile(job, filename); }
      catch (e) { if (e.name === 'NotFoundError') return { filename, handle: create ? await checkedFile(job, filename, { create: true }) : null }; throw e; }
    }
    throw fail('새 파일 이름을 확보하지 못했습니다. 다시 시도해 주세요.', 'name_collision');
  }
  async function writeNew(job, file, blob) {
    if (!file.handle) {
      // Asset resolution does not create empty placeholders. Recheck before creation.
      try { await checkedFile(job, file.filename); throw fail('동일 이름의 파일이 생겼습니다. 새 이름으로 다시 시도해 주세요.', 'name_collision'); }
      catch (e) { if (e.name !== 'NotFoundError') throw e; }
      file.handle = await checkedFile(job, file.filename, { create: true });
    }
    let stream;
    try {
      checkJob(job); stream = await file.handle.createWritable({ keepExistingData: false }); streams.add(stream);
      checkJob(job); await stream.write(blob); checkJob(job); await stream.close(); checkJob(job);
    }
    catch (e) { if (stream) { try { await stream.abort(); } catch (_) {} } throw e; }
    finally { if (stream) streams.delete(stream); }
    // No removeEntry: a failure must never delete any existing user file.
  }
  function toBlob(data, filename) {
    if (data instanceof g.Blob) return data;
    if (typeof data === 'string' || data instanceof g.ArrayBuffer || g.ArrayBuffer.isView(data)) return new g.Blob([data], { type: MIME[String(filename).split('.').pop().toLowerCase()] || 'application/octet-stream' });
    throw fail('내보내기 데이터는 Blob, ArrayBuffer, TypedArray 또는 문자열이어야 합니다.', 'invalid_data');
  }
  function author(ownerId) {
    const value = activeUser();
    if (!value || normalizeId(value.id) !== ownerId) return null;
    const out = { id: ownerId };
    // Only safe server profile fields, not browser-selected identities/settings/credentials.
    for (const k of ['name', 'rank', 'org', 'dept', 'phone', 'email', 'company', 'department', 'title']) if (typeof value[k] === 'string') out[k] = value[k];
    return out;
  }
  async function resolveAssets(job, data) {
    let assets;
    const binaries = [], seen = new Map();
    async function walk(value) {
      checkJob(job);
      if (typeof value === 'string' && value.startsWith('salespilot-asset:')) {
        const id = value.slice('salespilot-asset:'.length);
        if (seen.has(id)) return seen.get(id).filename;
        if (!assets) assets = g.SalesPilotPlatform && g.SalesPilotPlatform.assets || (g.claude && typeof g.claude.use === 'function' ? await g.claude.use('assets') : null);
        if (!assets || typeof assets.get !== 'function' || !id) throw fail('첨부 저장소를 읽을 수 없습니다. 원본 문서를 대기 상태로 보관합니다.', 'asset_unavailable');
        let item;
        try { item = await assets.get(id); } catch (_) { throw fail('첨부 파일을 읽지 못했습니다. 원본 첨부 참조를 보존하고 대기합니다.', 'asset_unavailable'); }
        // standalone assets.get returns {id, blob, name, type, size, url}; never fetch a guessed URL.
        const blob = item instanceof g.Blob ? item : item && item.blob;
        if (!(blob instanceof g.Blob)) throw fail('첨부 파일의 실제 바이너리를 확인하지 못했습니다. 원본 문서를 대기 상태로 보관합니다.', 'asset_unavailable');
        const file = await allocate(job, item.name || item.filename || ('attachment-' + id), false);
        binaries.push({ file, blob }); seen.set(id, file); return file.filename;
      }
      if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (Array.isArray(value)) { const out = []; for (const entry of value) out.push(await walk(entry)); return out; }
      if (value && Object.getPrototypeOf(value) === Object.prototype) {
        const out = {};
        for (const key of Object.keys(value)) Object.defineProperty(out, key, { value: await walk(value[key]), enumerable: true, configurable: true, writable: true });
        return out;
      }
      throw fail('JSON으로 원본 값을 보존할 수 없는 문서 값이 있습니다. 원본 문서는 브라우저에 유지하고 폴더 저장을 대기합니다.', 'non_json_document');
    }
    return { data: await walk(data), binaries };
  }
  async function recordSaved(job, filenames) {
    const ctx = job.ctx, state = ctx.state;
    const previous = state.lastSaved ? state.lastSaved.filenames : [];
    state.lastSaved = { filename: filenames[filenames.length - 1], filenames: filenames.concat(previous).slice(0, 20), savedAt: new Date().toISOString(), directoryName: job.handle.name };
    state.lastError = null;
    try { await savePrefs(ctx); } catch (e) { report(e, ctx); }
    emit();
  }
  async function writePending(job, item) {
    checkJob(job);
    if (item.ownerId !== job.ownerId) throw fail('다른 회원 또는 이전 브라우저 자료는 저장하지 않습니다.', 'owner_mismatch');
    if (!job.handle) throw fail(supported ? '이 회원의 저장 폴더가 선택되지 않았습니다. 파일은 이 회원의 브라우저 보관함에 대기 중입니다. 회원정보에서 폴더 선택 버튼을 직접 눌러 주세요.' : SUPPORT_MESSAGE + ' 파일은 이 회원의 브라우저 보관함에 대기 중입니다.', 'no_directory');
    if (await permission(job) !== 'granted') throw fail('폴더 쓰기 권한이 필요합니다. 회원정보에서 ‘권한 허용’을 직접 눌러 주세요. 파일은 이 회원의 브라우저 보관함에 대기 중입니다.', 'permission_required');
    const filenames = [];
    let blob, filename;
    if (item.kind === 'document') {
      const resolved = await resolveAssets(job, item.data);
      const envelope = { ownerId: item.ownerId, documentId: item.path.split('/').pop(), path: item.path, savedAt: item.savedAt, author: item.author, data: resolved.data };
      blob = new g.Blob([JSON.stringify(envelope, null, 2)], { type: MIME.json });
      for (const binary of resolved.binaries) { await writeNew(job, binary.file, binary.blob); filenames.push(binary.file.filename); }
      const file = await allocate(job, item.path.replace(/\//g, '-') + '.json');
      await writeNew(job, file, blob); filename = file.filename;
    } else {
      blob = item.blob;
      const file = await allocate(job, item.filename);
      await writeNew(job, file, blob); filename = file.filename;
    }
    checkJob(job); filenames.push(filename);
    await store('pending', 'readwrite', s => s.delete(item.id));
    await recordSaved(job, filenames); await refreshCount(job.ctx); emit();
    if (item.kind === 'export') {
      checkJob(job);
      const url = g.URL.createObjectURL(blob); previews.push(url);
      if (previews.length > 20) g.URL.revokeObjectURL(previews.shift());
      return { url, filename, ownerId: job.ownerId, directoryName: job.handle.name, savedToFolder: true };
    }
    return { filename, filenames, ownerId: job.ownerId, directoryName: job.handle.name, savedToFolder: true };
  }
  async function flushInternal(job) {
    const ctx = job.ctx; checkJob(job);
    if (!job.handle || await permission(job) !== 'granted') { emit(); return { saved: 0, pending: ctx.state.pendingCount }; }
    const items = (await store('pending', 'readonly', s => s.getAll())).filter(item => item.ownerId === job.ownerId);
    items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    let saved = 0;
    for (const item of items) {
      checkJob(job);
      if (item.kind === 'document' && !ctx.state.autoSave) continue;
      try { await writePending(job, item); saved++; }
      catch (e) { report(e, ctx); if (e.name === 'NotAllowedError' || e.name === 'QuotaExceededError' || ['permission_required', 'owner_changed'].includes(e.code)) break; }
    }
    await refreshCount(ctx); emit(); return { saved, pending: ctx.state.pendingCount };
  }
  async function flushPending() {
    let ctx;
    try {
      ctx = context(requireOwner(currentOwner())); await loadOwner(ctx); const job = makeJob(ctx);
      return await queue(async () => { try { return await flushInternal(job); } catch (e) { return { saved: 0, pending: ctx.state.pendingCount, error: report(e, ctx) }; } });
    } catch (e) { return { saved: 0, pending: ctx ? ctx.state.pendingCount : 0, error: report(e, ctx) }; }
  }
  async function captureDocument(path, data, sourceOwnerId) {
    // Caller MUST invoke only after a successful server save of its own document.
    // Server adapter may pass its immutable request owner as argument 3 to detect late responses.
    let ctx;
    try {
      const ownerId = requireOwner(sourceOwnerId == null ? currentOwner() : sourceOwnerId);
      ctx = context(ownerId); const epoch = authEpoch;
      const capturedAuthor = author(ownerId), capturedData = g.structuredClone(data);
      path = String(path).replace(/^\/+|\/+$/g, '');
      const parts = path.split('/');
      if (parts.length !== 2 || !parts[1] || !DOCUMENT_COLLECTIONS.has(parts[0])) return { captured: false, reason: 'excluded_collection' };
      await loadOwner(ctx); const job = makeJob(ctx);
      if (epoch !== job.epoch) throw fail('회원 변경으로 문서 자동보관을 중단했습니다.', 'owner_changed');
      return await queue(async () => {
        checkJob(job);
        if (!ctx.state.autoSave) return { captured: false, reason: 'auto_save_off' };
        const item = { id: key(ownerId) + ':doc:' + path, ownerId, kind: 'document', path, data: capturedData, savedAt: new Date().toISOString(), author: capturedAuthor, order: Date.now() };
        await store('pending', 'readwrite', s => s.put(item)); await refreshCount(ctx); emit();
        try {
          if (job.handle && await permission(job) === 'granted') return { captured: true, result: await writePending(job, item) };
          ctx.state.lastError = '문서는 이 회원의 브라우저에 대기 보관되었습니다. 회원정보에서 저장 폴더를 선택하거나 권한을 직접 허용하세요.'; emit();
          return { captured: true, pending: true, ownerId, error: ctx.state.lastError };
        } catch (e) { return { captured: true, pending: true, error: report(e, ctx) }; }
      });
    } catch (e) { return { captured: false, error: report(e, ctx) }; }
  }
  async function saveExport(input) {
    let ctx;
    try {
      const ownerId = requireOwner(currentOwner()); ctx = context(ownerId); const epoch = authEpoch;
      if (!input || input.data == null) throw fail('내보낼 파일 데이터가 없습니다.', 'invalid_data');
      const filename = safeName(input.filename || 'SalesPilot');
      const item = { id: key(ownerId) + ':export:' + g.crypto.randomUUID(), ownerId, kind: 'export', filename, blob: toBlob(input.data, filename), order: Date.now() };
      await loadOwner(ctx); const job = makeJob(ctx);
      if (epoch !== job.epoch) throw fail('회원 변경으로 내보내기를 중단했습니다.', 'owner_changed');
      return await queue(async () => {
        checkJob(job);
        await store('pending', 'readwrite', s => s.put(item)); await refreshCount(ctx); emit();
        try { return { handled: true, result: await writePending(job, item) }; }
        catch (e) { return { handled: true, pending: true, result: null, ownerId, error: report(e, ctx) }; }
      });
    } catch (e) {
      // handled:true deliberately blocks standalone's unauthenticated download fallback.
      return { handled: true, pending: false, result: null, error: report(e, ctx) };
    }
  }
  g.SalesPilotFiles = Object.freeze({ configureDirectoryForUser, registerDirectoryForUser, allowDirectoryForUser, getStatusForUser, configureDirectory, registerDirectory, allowDirectory, getStatus, setAutoSave, flushPending, captureDocument, saveExport });
  async function onAuthChange() {
    const id = syncOwner(); emit();
    if (!id) return; // No legacy or member handle loading/saving before login.
    const epoch = authEpoch, ctx = context(id);
    try {
      await loadOwner(ctx);
      if (syncOwner() !== id || epoch !== authEpoch) return;
      emit(); if (ctx.directory && ctx.state.permission === 'granted') await flushPending();
    } catch (e) { report(e, ctx); }
  }
  g.addEventListener('salespilot-auth-change', onAuthChange);
  onAuthChange();
})(window);
