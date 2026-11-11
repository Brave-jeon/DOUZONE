/* User-selected PC folder storage. No server, automatic picker or credential export. */
(function (g) {
  'use strict';
  const DB_NAME = 'salespilot-files-v1';
  // Verified against app/index.html and src/{ct,br,dc,vc}.js.
  const DOCUMENT_COLLECTIONS = new Set(['quotes', 'contracts', 'discounts', 'buildreqs', 'meetings', 'termdocs']);
  const MIME = { json: 'application/json;charset=utf-8', html: 'text/html;charset=utf-8', txt: 'text/plain;charset=utf-8', pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', zip: 'application/zip' };
  const SUPPORT_MESSAGE = 'PC 폴더 저장은 최신 Chrome 또는 Edge의 HTTPS(또는 localhost) 환경에서 사용할 수 있습니다. 외부 HTTP 주소에서는 지원되지 않습니다. 일반 다운로드는 계속 사용할 수 있습니다.';
  let dbPromise, directory = null, sequence = 0, saveQueue = Promise.resolve();
  const previews = [];
  const state = { supported: !!(g.isSecureContext && g.showDirectoryPicker && g.FileSystemDirectoryHandle && g.indexedDB), directoryName: '', permission: 'none', autoSave: true, pendingCount: 0, lastSaved: null, lastError: null };
  function getStatus() {
    return Object.assign({}, state, { lastSaved: state.lastSaved ? Object.assign({}, state.lastSaved, { filenames: state.lastSaved.filenames.slice() }) : null });
  }
  function emit() { g.dispatchEvent(new CustomEvent('salespilot-files-change', { detail: getStatus() })); }
  function fail(message, code) { const e = new Error(message); e.code = code; return e; }
  function errorMessage(e) {
    if (e && typeof e.code === 'string') return e.message;
    if (e && e.name === 'AbortError') return '폴더 선택 또는 파일 저장을 취소했습니다. 기존 파일은 변경하지 않았습니다.';
    if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) return '폴더 쓰기 권한이 없습니다. 폴더 저장 설정에서 ‘권한 허용’을 직접 눌러 주세요. 대기 데이터는 브라우저에 보관됩니다.';
    if (e && e.name === 'QuotaExceededError') return '저장 공간이 부족합니다. PC와 브라우저 저장 공간을 확보한 뒤 다시 저장해 주세요.';
    if (e && e.name === 'DataCloneError') return '폴더 권한 또는 데이터를 브라우저에 보관할 수 없습니다. Chrome/Edge 저장소 설정을 확인해 주세요.';
    return 'PC 폴더에 저장하지 못했습니다. 대기 데이터와 폴더 권한·연결 상태를 확인한 뒤 다시 시도해 주세요.';
  }
  function report(e) { state.lastError = errorMessage(e); emit(); return state.lastError; }
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
  async function refreshCount() { state.pendingCount = await store('pending', 'readonly', s => s.count()); }
  async function validateHandle(handle) {
    if (!g.FileSystemDirectoryHandle || !(handle instanceof g.FileSystemDirectoryHandle) || handle.kind !== 'directory') throw fail('실제 브라우저 폴더 선택으로 얻은 폴더 권한이 필요합니다. 문자열 경로나 모의 핸들은 사용할 수 없습니다.', 'invalid_handle');
    // Call the native prototype method, not a supplied object's overridden function.
    return g.FileSystemDirectoryHandle.prototype.queryPermission.call(handle, { mode: 'readwrite' });
  }
  async function permission() {
    if (!directory) { state.permission = 'none'; return 'none'; }
    state.permission = await validateHandle(directory);
    return state.permission;
  }
  const ready = (async () => {
    try {
      const prefs = await store('prefs', 'readonly', s => s.get('settings'));
      if (prefs) { state.autoSave = prefs.autoSave !== false; state.lastSaved = prefs.lastSaved || null; }
      const saved = await store('handles', 'readonly', s => s.get('directory'));
      if (saved && saved.handle) {
        state.permission = await validateHandle(saved.handle);
        directory = saved.handle; state.directoryName = directory.name;
      }
      await refreshCount(); emit();
    } catch (e) { report(e); }
  })();
  function requireClick() {
    if (g.navigator.userActivation && !g.navigator.userActivation.isActive) throw fail('폴더 선택 또는 권한 허용 버튼을 직접 눌러 주세요. 자동으로 권한을 요청하지 않습니다.', 'user_activation_required');
  }
  function configureDirectory() {
    if (!state.supported) { report(fail(SUPPORT_MESSAGE, 'unsupported')); return Promise.resolve({ ok: false, error: state.lastError }); }
    // Must call the picker before any await to retain the real button's user activation.
    let picked;
    try { requireClick(); picked = g.showDirectoryPicker({ mode: 'readwrite' }); }
    catch (e) { report(e); return Promise.resolve({ ok: false, error: state.lastError }); }
    return picked.then(registerDirectory).catch(e => ({ ok: false, error: report(e) }));
  }
  async function registerDirectory(handle) {
    try {
      const granted = await validateHandle(handle);
      await ready;
      return await queue(async () => {
        // IndexedDB structured clone preserves the real FileSystemDirectoryHandle.
        await store('handles', 'readwrite', s => s.put({ id: 'directory', handle }));
        directory = handle; state.directoryName = handle.name; state.permission = granted; state.lastError = null;
        emit();
        if (granted === 'granted') await flushInternal();
        else { state.lastError = '폴더를 기억했습니다. ‘권한 허용’을 직접 눌러 대기 파일을 저장해 주세요.'; emit(); }
        return { ok: true, status: getStatus() };
      });
    } catch (e) { return { ok: false, error: report(e) }; }
  }
  function allowDirectory() {
    let requested;
    try {
      requireClick();
      if (!directory) throw fail('먼저 저장할 PC 폴더를 선택해 주세요.', 'no_directory');
      // Never request permission during initialization, capture or flushing.
      requested = g.FileSystemDirectoryHandle.prototype.requestPermission.call(directory, { mode: 'readwrite' });
    } catch (e) { return Promise.resolve({ ok: false, error: report(e) }); }
    return requested.then(value => queue(async () => {
      state.permission = value;
      if (value !== 'granted') { report(fail('폴더 쓰기 권한이 거부되었습니다. 대기 파일은 보관되며, ‘권한 허용’을 다시 눌러 저장할 수 있습니다.', 'permission_denied')); return { ok: false, status: getStatus() }; }
      state.lastError = null; await flushInternal(); emit(); return { ok: true, status: getStatus() };
    })).catch(e => ({ ok: false, error: report(e) }));
  }
  async function savePrefs() { await store('prefs', 'readwrite', s => s.put({ id: 'settings', autoSave: state.autoSave, lastSaved: state.lastSaved })); }
  async function setAutoSave(value) {
    await ready;
    return queue(async () => {
      state.autoSave = !!value;
      try { await savePrefs(); if (state.autoSave) await flushInternal(); }
      catch (e) { report(e); }
      emit(); return getStatus();
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
  async function allocate(base, create = true) {
    // Check only our proposed name; never enumerate/read the user's folder.
    for (let attempt = 0; attempt < 8; attempt++) {
      const filename = uniqueName(base);
      try { await directory.getFileHandle(filename); }
      catch (e) { if (e.name === 'NotFoundError') return { filename, handle: create ? await directory.getFileHandle(filename, { create: true }) : null }; throw e; }
    }
    throw fail('새 파일 이름을 확보하지 못했습니다. 다시 시도해 주세요.', 'name_collision');
  }
  async function writeNew(file, blob) {
    if (!file.handle) {
      // Asset resolution does not create empty placeholders. Recheck before creation.
      try { await directory.getFileHandle(file.filename); throw fail('동일 이름의 파일이 생겼습니다. 새 이름으로 다시 시도해 주세요.', 'name_collision'); }
      catch (e) { if (e.name !== 'NotFoundError') throw e; }
      file.handle = await directory.getFileHandle(file.filename, { create: true });
    }
    let stream;
    try { stream = await file.handle.createWritable({ keepExistingData: false }); await stream.write(blob); await stream.close(); }
    catch (e) { if (stream) { try { await stream.abort(); } catch (_) {} } throw e; }
    // No removeEntry: a failure must never delete any existing user file.
  }
  function toBlob(data, filename) {
    if (data instanceof g.Blob) return data;
    if (typeof data === 'string' || data instanceof g.ArrayBuffer || g.ArrayBuffer.isView(data)) return new g.Blob([data], { type: MIME[String(filename).split('.').pop().toLowerCase()] || 'application/octet-stream' });
    throw fail('내보내기 데이터는 Blob, ArrayBuffer, TypedArray 또는 문자열이어야 합니다.', 'invalid_data');
  }
  async function author() {
    if (!g.SalesPilotSettings || typeof g.SalesPilotSettings.getActiveUser !== 'function') return null;
    try {
      const value = await g.SalesPilotSettings.getActiveUser();
      if (typeof value === 'string') return { name: value };
      if (!value || typeof value !== 'object') return null;
      const out = {};
      // Never copy settings, keys, passwords or unknown user object properties.
      for (const k of ['id', 'name', 'rank', 'org', 'dept', 'phone', 'email', 'company', 'department', 'title']) if (typeof value[k] === 'string') out[k] = value[k];
      return Object.keys(out).length ? out : null;
    } catch (_) { return null; }
  }
  async function resolveAssets(data) {
    let assets;
    const binaries = [], seen = new Map();
    async function walk(value) {
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
        const file = await allocate(item.name || item.filename || ('attachment-' + id), false);
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
  async function recordSaved(filenames) {
    const previous = state.lastSaved ? state.lastSaved.filenames : [];
    state.lastSaved = { filename: filenames[filenames.length - 1], filenames: filenames.concat(previous).slice(0, 20), savedAt: new Date().toISOString(), directoryName: directory.name };
    state.lastError = null;
    try { await savePrefs(); } catch (e) { report(e); }
    emit();
  }
  async function writePending(item) {
    if (await permission() !== 'granted') throw fail('폴더 쓰기 권한이 필요합니다. ‘권한 허용’을 직접 눌러 주세요. 파일은 대기 중입니다.', 'permission_required');
    const filenames = [];
    let blob, filename;
    if (item.kind === 'document') {
      const resolved = await resolveAssets(item.data);
      const envelope = { documentId: item.path.split('/').pop(), path: item.path, savedAt: item.savedAt, author: item.author, data: resolved.data };
      blob = new g.Blob([JSON.stringify(envelope, null, 2)], { type: MIME.json });
      for (const binary of resolved.binaries) { await writeNew(binary.file, binary.blob); filenames.push(binary.file.filename); }
      const file = await allocate(item.path.replace(/\//g, '-') + '.json');
      await writeNew(file, blob); filename = file.filename;
    } else {
      blob = item.blob;
      const file = await allocate(item.filename);
      await writeNew(file, blob); filename = file.filename;
    }
    filenames.push(filename);
    await store('pending', 'readwrite', s => s.delete(item.id));
    await recordSaved(filenames); await refreshCount(); emit();
    if (item.kind === 'export') {
      const url = g.URL.createObjectURL(blob); previews.push(url);
      if (previews.length > 20) g.URL.revokeObjectURL(previews.shift());
      return { url, filename, directoryName: directory.name, savedToFolder: true };
    }
    return { filename, filenames, directoryName: directory.name, savedToFolder: true };
  }
  async function flushInternal() {
    if (!directory || await permission() !== 'granted') { emit(); return { saved: 0, pending: state.pendingCount }; }
    const items = await store('pending', 'readonly', s => s.getAll());
    items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    let saved = 0;
    for (const item of items) {
      if (item.kind === 'document' && !state.autoSave) continue;
      try { await writePending(item); saved++; }
      catch (e) { report(e); if (e.name === 'NotAllowedError' || e.name === 'QuotaExceededError' || e.code === 'permission_required') break; }
    }
    await refreshCount(); emit(); return { saved, pending: state.pendingCount };
  }
  async function flushPending() {
    await ready;
    return queue(async () => { try { return await flushInternal(); } catch (e) { return { saved: 0, pending: state.pendingCount, error: report(e) }; } });
  }
  async function captureDocument(path, data) {
    // Local DB save has already succeeded. ALL export errors are contained here.
    try {
      await ready;
      path = String(path).replace(/^\/+|\/+$/g, '');
      const parts = path.split('/');
      if (parts.length !== 2 || !parts[1] || !DOCUMENT_COLLECTIONS.has(parts[0])) return { captured: false, reason: 'excluded_collection' };
      return await queue(async () => {
        if (!state.autoSave) return { captured: false, reason: 'auto_save_off' };
        const item = { id: 'doc:' + path, kind: 'document', path, data: g.structuredClone(data), savedAt: new Date().toISOString(), author: await author(), order: Date.now() };
        // One latest snapshot per document, no in-memory duplicate pending list.
        await store('pending', 'readwrite', s => s.put(item)); await refreshCount(); emit();
        if (directory && await permission() === 'granted') {
          try { return { captured: true, result: await writePending(item) }; }
          catch (e) { return { captured: true, pending: true, error: report(e) }; }
        }
        return { captured: true, pending: true };
      });
    } catch (e) { return { captured: false, error: report(e) }; }
  }
  async function saveExport(input) {
    await ready;
    if (!state.supported || !directory) {
      state.lastError = !state.supported ? SUPPORT_MESSAGE : '저장 폴더가 선택되지 않아 일반 다운로드를 사용합니다. PC 폴더에 저장하려면 폴더 선택 버튼을 눌러 주세요.';
      emit(); return { handled: false };
    }
    return queue(async () => {
      try {
        if (!input || input.data == null) throw fail('내보낼 파일 데이터가 없습니다.', 'invalid_data');
        const filename = safeName(input.filename || 'SalesPilot');
        const item = { id: 'export:' + g.crypto.randomUUID(), kind: 'export', filename, blob: toBlob(input.data, filename), order: Date.now() };
        await store('pending', 'readwrite', s => s.put(item)); await refreshCount(); emit();
        try { return { handled: true, result: await writePending(item) }; }
        catch (e) { return { handled: true, pending: true, result: null, error: report(e) }; }
      } catch (e) { return { handled: true, pending: false, result: null, error: report(e) }; }
    });
  }
  g.SalesPilotFiles = Object.freeze({ configureDirectory, registerDirectory, allowDirectory, getStatus, setAutoSave, flushPending, captureDocument, saveExport });
  // Existing granted permission may flush in background; prompt/denied never does.
  ready.then(() => { if (directory && state.permission === 'granted') flushPending(); });
})(window);
