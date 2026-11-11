/* 서버 회원 연결. 기존 로컬 문서는 삭제/자동업로드하지 않습니다. */
(function (g) {
  'use strict';
  const hostUse=g.claude&&g.claude.use?g.claude.use.bind(g.claude):null;
  const DB_NAME = 'salespilot-member-assets-v1';
  function currentOwner(){const a=g.SalesPilotAuth,u=a&&a.getUser();if(!a||!a.isAuthenticated()||!u)throw failure('활성 회원 로그인이 필요합니다.','login_required');return String(u.id);}
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
    const owner=currentOwner();
    if (idToBlob.has(id)&&id.startsWith(encodeURIComponent(owner)+':')) return idToBlob.get(id);
    const item = await request('assets', 'readonly', store => store.get(id));
    if (!item || item.owner !== owner || !(item.blob instanceof Blob)) throw failure('첨부 파일을 찾지 못했습니다.', 'not_found');
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
  const assets = {
    async put(input) {
      const raw = input instanceof Blob ? input : input && (input.file || input.blob || input.data);
      if (raw == null) throw failure('저장할 첨부 파일이 없습니다.');
      const blob = raw instanceof Blob ? raw : new Blob([raw], { type: input.type || 'application/octet-stream' });
      const owner=currentOwner(),id=encodeURIComponent(owner)+':'+crypto.randomUUID();
      const name = input.name || input.filename || raw.name || '첨부파일';
      await request('assets', 'readwrite', store => store.put({ id, owner, blob, name, type: blob.type, size: blob.size }));
      const url = await assetUrl(id);
      return { id, url, name, filename: name, type: blob.type, size: blob.size };
    },
    url: assetUrl,
    async get(id) {
      const item = await request('assets', 'readonly', store => store.get(typeof id === 'object' ? id.id : id));
      if (!item || item.owner !== currentOwner()) throw failure('첨부 파일을 찾지 못했습니다.', 'not_found');
      return Object.assign({}, item, { url: await assetUrl(item.id) });
    },
    async delete(input) {
      const raw = typeof input === 'object' ? input.id || input.url : input;
      const id = blobToId.get(raw) || String(raw).replace(/^salespilot-asset:/, '');
      const item=await request('assets','readonly',store=>store.get(id));
      if(!item||item.owner!==currentOwner())throw failure('첨부 파일 접근 권한이 없습니다.','forbidden');
      await request('assets', 'readwrite', store => store.delete(id));
      const url = idToBlob.get(id); if (url) { URL.revokeObjectURL(url); blobToId.delete(url); }
      idToBlob.delete(id);
    }
  };
  const mimeTypes = { pdf: 'application/pdf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', html: 'text/html;charset=utf-8', txt: 'text/plain;charset=utf-8', json: 'application/json;charset=utf-8', zip: 'application/zip' };
  const downloads = {
    async save(input) {
      currentOwner();
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
  const user={id:async()=>{await g.SalesPilotAuth.ready();return currentOwner();}};
  const sample=()=>g.SalesPilotAI?g.SalesPilotAI.getSample():null;
  g.SalesPilotPlatform={mode:'member-server',getSample:sample,get database(){return g.SalesPilotRemoteDatabase;},assets,downloads};
  g.claude={use:async name=>{
    if(!g.SalesPilotAuth)throw failure('회원 서버 미연결: PC 서버 버전으로 접속하세요.','offline');
    await g.SalesPilotAuth.ready();
    if(name==='database'||name==='db'){if(!g.SalesPilotRemoteDatabase)throw failure('원격 저장소 모듈이 없습니다.','offline');return g.SalesPilotRemoteDatabase;}
    if(name==='user')return user;
    if(!g.SalesPilotAuth.isAuthenticated())return null;
    if(name==='downloads')return downloads;if(name==='assets')return assets;if(name==='sample')return sample();
    if(name==='dictation')return g.SalesPilotDictation?g.SalesPilotDictation.create():null;
    return hostUse?hostUse(name):null;
  }};
  g.addEventListener('salespilot-auth-change',()=>{if(g.SalesPilotAuth.isAuthenticated())return;for(const url of idToBlob.values())URL.revokeObjectURL(url);idToBlob.clear();blobToId.clear();});
})(window);
