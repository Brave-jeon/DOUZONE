/* SalesPilot 일반 웹 연결: 개인 브라우저 저장. 계정 인증·팀 공유 서비스가 아닙니다. */
(function (g) {
  'use strict';
  if (g.claude && typeof g.claude.use === 'function') return;
  const DB_NAME = 'salespilot-web-v1';
  const listeners = new Set();
  const blobToId = new Map();
  const idToBlob = new Map();
  const uid = () => crypto.randomUUID();
  let opening;
  let channel;
  function failure(message, code) { const e = new Error(message); e.code = code || 'local_error'; return e; }
  function openStore() {
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      if (!g.indexedDB) { reject(failure('이 브라우저에서 저장소를 사용할 수 없습니다.', 'storage_unavailable')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('documents')) db.createObjectStore('documents', { keyPath: 'path' });
        if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath: 'id' });
      };
      req.onerror = () => reject(failure('브라우저 저장소를 열지 못했습니다. 저장 권한을 확인하세요.', 'storage_unavailable'));
      req.onblocked = () => reject(failure('다른 탭의 저장소 사용이 끝난 뒤 다시 시도하세요.', 'storage_blocked'));
      req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
    });
    return opening;
  }
  async function request(store, mode, operation) {
    const db = await openStore();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      let result;
      try {
        const req = operation(tx.objectStore(store));
        req.onsuccess = () => { result = req.result; };
        req.onerror = () => reject(failure('브라우저 저장소 작업에 실패했습니다.', req.error && req.error.name));
      } catch (e) { reject(e); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(failure('저장하지 못했습니다. 브라우저 저장 공간과 권한을 확인하세요.', tx.error && tx.error.name));
    });
  }
  async function assetUrl(input) {
    const id = typeof input === 'object' ? input.id : String(input).replace(/^salespilot-asset:/, '');
    if (idToBlob.has(id)) return idToBlob.get(id);
    const item = await request('assets', 'readonly', store => store.get(id));
    if (!item || !(item.blob instanceof Blob)) throw failure('첨부 파일을 찾지 못했습니다.', 'not_found');
    const url = URL.createObjectURL(item.blob);
    idToBlob.set(id, url); blobToId.set(url, id);
    return url;
  }
  function serialize(value) {
    if (typeof value === 'string' && blobToId.has(value)) return 'salespilot-asset:' + blobToId.get(value);
    if (Array.isArray(value)) return value.map(serialize);
    if (value && typeof value === 'object') { const out = {}; Object.keys(value).forEach(k => { out[k] = serialize(value[k]); }); return out; }
    return value;
  }
  async function hydrate(value) {
    if (typeof value === 'string' && value.startsWith('salespilot-asset:')) return assetUrl(value.slice('salespilot-asset:'.length));
    if (Array.isArray(value)) return Promise.all(value.map(hydrate));
    if (value && typeof value === 'object') { const out = {}; await Promise.all(Object.keys(value).map(async k => { out[k] = await hydrate(value[k]); })); return out; }
    return value;
  }
  function notify() {
    for (const listener of listeners) listener();
    if (channel) channel.postMessage('changed');
  }
  try { channel = new BroadcastChannel(DB_NAME); channel.onmessage = () => { for (const listener of listeners) listener(); }; } catch (_) {}
  function documentRef(path) {
    path = String(path).replace(/^\/+|\/+$/g, '');
    if (!path) throw failure('문서 경로가 필요합니다.');
    const id = path.split('/').pop();
    async function get() {
      const record = await request('documents', 'readonly', store => store.get(path));
      const data = record ? await hydrate(record.data) : undefined;
      return { id, exists: !!record, metadata: { fromCache: false, localOnly: true }, data: () => data === undefined ? undefined : structuredClone(data) };
    }
    async function set(data, options) {
      if (!data || typeof data !== 'object') throw failure('저장할 문서가 올바르지 않습니다.');
      let value = serialize(data);
      if (options && options.merge) {
        const current = await request('documents', 'readonly', store => store.get(path));
        value = Object.assign({}, current && current.data, value);
      }
      await request('documents', 'readwrite', store => store.put({ path, data: value, modifiedAt: Date.now() }));
      if (g.SalesPilotSettings && g.SalesPilotSettings.syncProfile) {
        try { await g.SalesPilotSettings.syncProfile(path, value); } catch (error) { console.error(error); }
      }
      if (/^data\/users\/[^/]+\/profile$/.test(path)) {
        g.dispatchEvent(new CustomEvent('salespilot-profile-change', { detail: { path, profile: value } }));
      }
      if (g.SalesPilotFiles && g.SalesPilotFiles.captureDocument) {
        try { await g.SalesPilotFiles.captureDocument(path, value); } catch (error) { console.error(error); }
      }
      notify();
    }
    async function update(data) {
      const current = await request('documents', 'readonly', store => store.get(path));
      if (!current) throw failure('수정할 문서를 찾지 못했습니다.', 'not_found');
      await set(Object.assign({}, current.data, serialize(data)));
    }
    async function remove() { await request('documents', 'readwrite', store => store.delete(path)); notify(); }
    function onSnapshot(next, onError) {
      let active = true;
      const refresh = async () => { try { const result = await get(); if (active) next(result); } catch (e) { if (active && onError) onError(e); else console.error(e); } };
      listeners.add(refresh); refresh();
      return () => { active = false; listeners.delete(refresh); };
    }
    return { id, path, get, set, update, delete: remove, onSnapshot };
  }
  function collectionRef(name, filters, ordering, maxCount) {
    name = String(name).replace(/^\/+|\/+$/g, ''); filters = filters || [];
    const field = (value, key) => String(key).split('.').reduce((a, k) => a && a[k], value);
    async function get() {
      const records = await request('documents', 'readonly', store => store.getAll());
      let values = records.filter(r => r.path.startsWith(name + '/') && !r.path.slice(name.length + 1).includes('/'));
      for (const [key, op, value] of filters) {
        values = values.filter(r => {
          const a = field(r.data, key);
          if (op === '==') return a === value;
          if (op === '!=') return a !== value;
          if (op === '<') return a < value;
          if (op === '<=') return a <= value;
          if (op === '>') return a > value;
          if (op === '>=') return a >= value;
          if (op === 'in') return Array.isArray(value) && value.includes(a);
          if (op === 'array-contains') return Array.isArray(a) && a.includes(value);
          throw failure('지원하지 않는 조회 조건입니다.');
        });
      }
      if (ordering) values.sort((a, b) => { const av = field(a.data, ordering[0]), bv = field(b.data, ordering[0]); return (av < bv ? -1 : av > bv ? 1 : 0) * (ordering[1] === 'desc' ? -1 : 1); });
      else values.sort((a, b) => a.path.localeCompare(b.path));
      if (maxCount != null) values = values.slice(0, maxCount);
      const docs = await Promise.all(values.map(async r => {
        const data = await hydrate(r.data);
        return { id: r.path.split('/').pop(), exists: true, ref: documentRef(r.path), data: () => structuredClone(data) };
      }));
      return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, localOnly: true }, forEach: fn => docs.forEach(fn) };
    }
    function onSnapshot(next, onError) {
      let active = true, version = 0;
      const refresh = async () => {
        const requestVersion = ++version;
        try { const snap = await get(); if (active && requestVersion === version) next(snap); }
        catch (e) { if (active && onError) onError(e); else console.error(e); }
      };
      listeners.add(refresh); refresh();
      return () => { active = false; listeners.delete(refresh); };
    }
    return { get, onSnapshot, doc: id => documentRef(name + '/' + (id || crypto.randomUUID())), where: (key, op, val) => collectionRef(name, filters.concat([[key, op, val]]), ordering, maxCount), orderBy: (key, dir) => collectionRef(name, filters, [key, dir], maxCount), limit: count => collectionRef(name, filters, ordering, Math.max(0, Number(count))) };
  }
  const database = { doc: documentRef, collection: name => collectionRef(name) };
  const assets = {
    async put(input) {
      const raw = input instanceof Blob ? input : input && (input.file || input.blob || input.data);
      if (raw == null) throw failure('저장할 첨부 파일이 없습니다.');
      const blob = raw instanceof Blob ? raw : new Blob([raw], { type: input.type || 'application/octet-stream' });
      const id = crypto.randomUUID();
      const name = input.name || input.filename || raw.name || '첨부파일';
      await request('assets', 'readwrite', store => store.put({ id, blob, name, type: blob.type, size: blob.size }));
      const url = await assetUrl(id);
      return { id, url, name, filename: name, type: blob.type, size: blob.size };
    },
    url: assetUrl,
    async get(id) {
      const item = await request('assets', 'readonly', store => store.get(typeof id === 'object' ? id.id : id));
      if (!item) throw failure('첨부 파일을 찾지 못했습니다.', 'not_found');
      return Object.assign({}, item, { url: await assetUrl(item.id) });
    },
    async delete(input) {
      const raw = typeof input === 'object' ? input.id || input.url : input;
      const id = blobToId.get(raw) || String(raw).replace(/^salespilot-asset:/, '');
      await request('assets', 'readwrite', store => store.delete(id));
      const url = idToBlob.get(id); if (url) { URL.revokeObjectURL(url); blobToId.delete(url); }
      idToBlob.delete(id);
    }
  };
  const mimeTypes = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', html: 'text/html;charset=utf-8', txt: 'text/plain;charset=utf-8', json: 'application/json;charset=utf-8', zip: 'application/zip' };
  const downloads = {
    async save(input) {
      if (!input || input.data == null) throw failure('내려받을 파일 데이터가 없습니다.');
      const filename = String(input.filename || input.name || '다운로드').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
      const ext = filename.split('.').pop().toLowerCase();
      const blob = input.data instanceof Blob ? input.data : new Blob([input.data], { type: input.type || mimeTypes[ext] || 'application/octet-stream' });
      if (g.SalesPilotFiles && g.SalesPilotFiles.saveExport) {
        const outcome = await g.SalesPilotFiles.saveExport({ filename, data: blob });
        if (outcome && outcome.handled) return outcome.result;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = filename; link.style.display = 'none';
      document.body.append(link); link.click(); link.remove();
      return url;
    }
  };
  const user = { id: async () => {
    let id = localStorage.getItem('salespilot-browser-id');
    if (!id) { id = uid(); localStorage.setItem('salespilot-browser-id', id); }
    return g.SalesPilotSettings && g.SalesPilotSettings.getActiveUserId ? g.SalesPilotSettings.getActiveUserId(id) : id;
  } };
  const sample = () => g.SalesPilotAI ? g.SalesPilotAI.getSample() : null;
  g.SalesPilotPlatform = { mode: 'browser', getSample: sample, database, assets, downloads };
  g.claude = { use: async name => {
    if (name === 'database' || name === 'db') { await openStore(); return database; }
    if (name === 'downloads') return downloads;
    if (name === 'assets') return assets;
    if (name === 'user') return user;
    if (name === 'sample') return sample();
    if (name === 'dictation') return g.SalesPilotDictation ? g.SalesPilotDictation.create() : null;
    return null;
  } };
  function explainMode() {
    const note = document.querySelector('.lg-note');
    if (note) note.textContent = '작성자 정보와 문서는 이 브라우저에 저장됩니다. 계정 인증이나 팀 공동 저장 기능이 아닙니다. 공용 PC에서는 개인정보를 입력하지 마세요.';
    const subtitle = document.querySelector('.lg-sub');
    if (subtitle) subtitle.textContent = '문서에 사용할 작성자 정보를 입력해 주세요.';
    const header = document.querySelector('.lg-h'); if (header) header.textContent = '작성자 정보';
    const bar = document.createElement('aside'); bar.id = 'salespilot-platform-info';
    bar.style.cssText = 'position:fixed;bottom:10px;left:12px;right:12px;z-index:1000;display:flex;gap:12px;align-items:center;background:#f1f5f9;color:#0f172a;border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;font:12px sans-serif';
    const label = document.createElement('span');
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'AI 서버 연결 설정';
    button.onclick = () => g.SalesPilotAI && g.SalesPilotAI.openSettings();
    const update = () => { label.textContent = '브라우저 개인 저장 · 팀 공유 없음 · AI 서버 ' + (sample() ? '설정됨(응답 확인 필요)' : '미연결'); };
    update(); g.addEventListener('salespilot-ai-change', update);
    bar.append(label, button); document.body.append(bar);
    if (g.BroadcastChannel) { const channel = new BroadcastChannel('salespilot-browser-data'); g.__salespilotChannel = channel; channel.onmessage = () => notify(false); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', explainMode, { once: true }); else explainMode();
})(window);
