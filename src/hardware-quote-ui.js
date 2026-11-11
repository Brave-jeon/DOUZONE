/* Hardware quote review: local parsing only; Book/quote application belongs to onApply. */
(function (g) {
  'use strict';
  const MB = 1024 * 1024, FILE_LIMIT = 30 * MB, ZIP_LIMIT = 64 * MB;
  const mounts = new WeakMap(), cache = new WeakMap();
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy = v => JSON.parse(JSON.stringify(v == null ? null : v));
  function number(v) {
    if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null;
    const s = String(v == null ? '' : v).trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) return null;
    const n = Number(s.replace(/,/g, '')); return Number.isFinite(n) ? n : null;
  }
  function xml(bytes) {
    const text = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('외부 엔티티 XML은 읽지 않습니다. CSV로 변환하세요.');
    const d = new g.DOMParser().parseFromString(text, 'application/xml');
    if (d.getElementsByTagName('parsererror').length) throw new Error('XLSX XML 읽기 불가: CSV로 변환하세요.');
    return d;
  }
  const tags = (d, name) => Array.from(d.getElementsByTagNameNS('*', name));
  const child = (d, name) => tags(d, name)[0];
  const textOf = (d, name) => { const e = child(d, name); return e ? e.textContent : ''; };
  function path(base, target) {
    if (!target || /[\\?#]|^[a-z]+:/i.test(target)) throw new Error('외부 XLSX 참조는 지원하지 않습니다.');
    const parts = (target.startsWith('/') ? target.slice(1) : base + '/' + target).split('/'), out = [];
    for (const p of parts) { if (!p || p === '.') continue; if (p === '..') { if (!out.length) throw new Error('잘못된 ZIP 경로'); out.pop(); } else out.push(p); }
    return out.join('/');
  }
  async function unzip(buffer) {
    if (buffer.byteLength > FILE_LIMIT) throw new Error('파일은 최대 30MB까지 읽을 수 있습니다.');
    const v = new DataView(buffer), b = new Uint8Array(buffer), files = new Map();
    let end = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50 && i + 22 + v.getUint16(i + 20, true) === b.length) { end = i; break; }
    if (end < 0) throw new Error('XLSX ZIP 형식을 읽지 못했습니다. CSV로 변환하세요.');
    const count = v.getUint16(end + 10, true), offset = v.getUint32(end + 16, true), dirSize = v.getUint32(end + 12, true);
    if (v.getUint16(end + 4, true) || v.getUint16(end + 6, true) || count !== v.getUint16(end + 8, true) || count > 2048 || count === 65535 || offset + dirSize > end) throw new Error('분할/ZIP64 또는 과도한 XLSX ZIP은 지원하지 않습니다.');
    let pos = offset, total = 0;
    for (let i = 0; i < count; i++) {
      if (pos + 46 > end || v.getUint32(pos, true) !== 0x02014b50) throw new Error('손상된 XLSX ZIP');
      const flags = v.getUint16(pos + 8, true), method = v.getUint16(pos + 10, true), compressed = v.getUint32(pos + 20, true), size = v.getUint32(pos + 24, true);
      const len = v.getUint16(pos + 28, true), extra = v.getUint16(pos + 30, true), comment = v.getUint16(pos + 32, true), local = v.getUint32(pos + 42, true);
      if (pos + 46 + len + extra + comment > end) throw new Error('손상된 XLSX ZIP');
      const name = new TextDecoder().decode(b.subarray(pos + 46, pos + 46 + len));
      if (flags & 1 || ![0,8].includes(method) || size === 0xffffffff || compressed === 0xffffffff || local + 30 > offset) throw new Error('암호화/지원불가 XLSX: CSV로 변환하세요.');
      total += size; if (total > ZIP_LIMIT) throw new Error('압축 해제 합계 64MB 초과: 파일을 나눠 CSV로 변환하세요.');
      if (files.has(name) || /(^\/|\\|(?:^|\/)\.\.(?:\/|$))/.test(name)) throw new Error('안전하지 않은 XLSX ZIP 경로');
      if (v.getUint32(local, true) !== 0x04034b50 || v.getUint16(local + 8, true) !== method) throw new Error('손상된 XLSX ZIP');
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      if (start + compressed > offset) throw new Error('손상된 XLSX ZIP');
      files.set(name, {method, size, bytes:b.subarray(start, start + compressed)});
      pos += 46 + len + extra + comment;
    }
    let inflated = 0;
    async function get(name) {
      const f = files.get(name); if (!f) throw new Error('XLSX 내부 파일 없음: ' + name);
      if (f.output) return f.output;
      if (f.method === 0) f.output = f.bytes;
      else {
        if (!g.DecompressionStream) throw new Error('이 브라우저는 XLSX 압축 읽기를 지원하지 않습니다. CSV로 저장하세요.');
        let stream; try { stream = new Blob([f.bytes]).stream().pipeThrough(new g.DecompressionStream('deflate-raw')); }
        catch (_) { throw new Error('XLSX 압축 읽기 지원불가: 최신 Chrome을 사용하거나 CSV로 저장하세요.'); }
        const reader = stream.getReader(), chunks = []; let n = 0;
        try { while (true) { const part = await reader.read(); if (part.done) break; n += part.value.length; if (n > f.size || inflated + n > ZIP_LIMIT) throw new Error('압축 해제 64MB 안전 한도 또는 선언 크기 초과'); chunks.push(part.value); } }
        finally { await reader.cancel().catch(() => {}); }
        f.output = new Uint8Array(n); let p = 0; for (const chunk of chunks) { f.output.set(chunk, p); p += chunk.length; }
      }
      if (f.output.length !== f.size) throw new Error('XLSX 압축 크기 불일치');
      inflated += f.output.length; if (inflated > ZIP_LIMIT) throw new Error('압축 해제 64MB 초과'); return f.output;
    }
    return {files, get};
  }
  async function parseXlsx(buffer) {
    const zip = await unzip(buffer), workbook = xml(await zip.get('xl/workbook.xml'));
    const rels = xml(await zip.get('xl/_rels/workbook.xml.rels')), relMap = new Map();
    for (const r of tags(rels, 'Relationship')) if (r.getAttribute('TargetMode') !== 'External') relMap.set(r.getAttribute('Id'), {target:path('xl', r.getAttribute('Target')), type:r.getAttribute('Type') || ''});
    let shared = []; const sharedRel = Array.from(relMap.values()).find(r => /\/sharedStrings$/.test(r.type));
    const sharedPath = sharedRel ? sharedRel.target : 'xl/sharedStrings.xml';
    if (zip.files.has(sharedPath)) shared = tags(xml(await zip.get(sharedPath)), 'si').map(si => tags(si, 't').map(t => t.textContent).join(''));
    const wb = {SheetNames:[], Sheets:Object.create(null)}, warnings = []; let cells = 0, missing = 0;
    for (const sheet of tags(workbook, 'sheet')) {
      if (wb.SheetNames.length >= 100) throw new Error('시트가 너무 많습니다. CSV로 나눠 저장하세요.');
      const name = sheet.getAttribute('name'), id = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sheet.getAttribute('r:id'), rel = relMap.get(id);
      if (!rel || !/\/worksheet$/.test(rel.type)) { warnings.push('워크시트가 아닌 시트는 읽지 않았습니다.'); continue; }
      const d = xml(await zip.get(rel.target)), rows = [];
      for (const r of tags(d, 'row')) {
        const rowNumber = Number(r.getAttribute('r')); if (!Number.isInteger(rowNumber) || rowNumber < 1 || rowNumber > 20000) throw new Error('행 범위가 큽니다. CSV로 나눠 저장하세요.');
        const row = [];
        for (const c of tags(r, 'c')) {
          if (++cells > 200000) throw new Error('셀 20만개 초과: CSV로 나눠 저장하세요.');
          const ref = /^([A-Z]+)(\d+)$/.exec(c.getAttribute('r') || ''); if (!ref || +ref[2] !== rowNumber) throw new Error('XLSX 셀 주소를 읽지 못했습니다.');
          let col = 0; for (const ch of ref[1]) col = col * 26 + ch.charCodeAt(0) - 64;
          if (col > 512 || col < 1) throw new Error('열 범위가 큽니다. CSV로 나눠 저장하세요.');
          const type = c.getAttribute('t'), raw = textOf(c, 'v'); let value = '';
          if (type === 'inlineStr') value = tags(c, 't').map(t => t.textContent).join('');
          else if (type === 's') { if (!/^\d+$/.test(raw) || +raw >= shared.length) throw new Error('공유 문자열 참조 오류'); value = shared[+raw]; }
          else if (type === 'str') value = raw;
          else if (type === 'b') value = raw === '1';
          else if (type === 'e') { value = ''; missing++; }
          else if (raw !== '') { const n = Number(raw); value = Number.isFinite(n) ? n : ''; }
          else if (child(c, 'f')) missing++;
          // Formula text is never evaluated. Only the saved <v> cache is read.
          row[col - 1] = value;
        }
        rows[rowNumber - 1] = row;
      }
      const width = rows.reduce((n, r) => Math.max(n, r ? r.length : 0), 0);
      if (rows.length * width > 500000) throw new Error('희소 셀 범위가 너무 큽니다. CSV로 변환하세요.');
      wb.SheetNames.push(name); wb.Sheets[name] = {__hardwareRows:Array.from({length:rows.length}, (_, i) => Array.from({length:width}, (_, j) => rows[i] && rows[i][j] != null ? rows[i][j] : ''))};
    }
    if (missing) warnings.push('오류 셀 또는 저장된 수식 결과가 없는 셀 ' + missing + '개: 빈칸 유지, 원본 재저장/수동확인 필요.');
    if (Array.from(zip.files.keys()).some(n => /vbaProject|macro/i.test(n))) warnings.push('매크로는 실행하거나 읽지 않았습니다.');
    wb.__hardwareWarnings = warnings; return wb;
  }
  function installShim() {
    if (g.XLSX && typeof g.XLSX.read === 'function') return false;
    g.XLSX = {__hardwareShim:true, read(buffer) { const wb = cache.get(buffer); if (!wb) throw new Error('로컬 XLSX를 먼저 준비해야 합니다. CSV로 변환하세요.'); return wb; }, utils:{sheet_to_json(sheet) { return sheet.__hardwareRows.map(r => r.slice()); }}};
    return true;
  }
  let pdfPromise;
  async function pdfReady() {
    if (!pdfPromise) pdfPromise = (async () => {
      const base = new URL('vendor/pdfjs/', g.document.baseURI), url = new URL('pdf.min.mjs', base);
      if (url.origin !== g.location.origin || !/^https?:$/.test(url.protocol)) throw new Error('PDF 모듈은 같은 출처의 로컬 앱에서만 읽습니다.');
      const lib = await import(url.href);
      // The copied PDF.js distribution names its worker pdf.worker.min.mjs.
      lib.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', base).pathname;
      g.pdfjsLib = lib; return lib;
    })().catch(e => { pdfPromise = null; throw new Error('로컬 PDF 읽기 도구를 불러오지 못했습니다. CSV/텍스트로 변환하세요.'); });
    return pdfPromise;
  }
  async function extract(file) {
    if (!file || file.size > FILE_LIMIT) throw new Error('파일은 최대 30MB까지 읽을 수 있습니다.');
    const helper = g.SalesPilotQuoteAssistance;
    if (!helper || typeof helper.hardwareImport !== 'function') throw new Error('견적 파일 추출 도우미가 연결되지 않았습니다.');
    const ext = String(file.name || '').split('.').pop().toLowerCase(); let input = file, warnings = [];
    if (ext === 'pdf' || file.type === 'application/pdf') await pdfReady();
    if (ext === 'xlsx') {
      installShim();
      // Validate ZIP bounds even if a pre-existing SheetJS reader is available.
      const buffer = await file.arrayBuffer(), wb = await parseXlsx(buffer); warnings = wb.__hardwareWarnings;
      if (g.XLSX.__hardwareShim) cache.set(buffer, wb);
      input = {name:file.name, size:file.size, type:file.type, arrayBuffer:async () => buffer};
    }
    const result = await helper.hardwareImport(input); result.originalFile = file; result.notes.push(...warnings);
    return result;
  }
  function targets(options) {
    const template = options.template, quote = options.quote || {}, sh = template && template.sheets && template.sheets[quote.sheet];
    if (!sh) return [];
    const out = []; let active = false;
    for (let r = 1; r <= sh.maxr; r++) {
      const b = String((sh.cells['B' + r] || {}).v || '');
      if (/^\s*\[/.test(b)) active = /하드웨어|H\/W/i.test(b);
      const name = (sh.cells['E' + r] || {}).v || (sh.cells['C' + r] || {}).v;
      if (active && name && !/소계|합계|구분|항목/.test(String(name)) && (sh.cells['L' + r] || {}).f) out.push({sheet:quote.sheet, row:r, name:String(name).replace(/\s+/g, ' ').trim()});
    }
    return out;
  }
  function previous(options, selected) {
    const q = options.quote || {}, result = {hardwareIncluded:!!q.hardwareIncluded, hardwareImported:copy(q.hardwareImported), inputs:copy(q.inputs || []), targetValues:[]};
    for (const target of selected) {
      const values = {};
      for (const col of ['C','E','F','I','J','K','L','M','N']) {
        const key = target.sheet + '!' + col + target.row;
        if (options.book && typeof options.book.value === 'function') values[col] = options.book.value(target.sheet, target.row, Array.from(col).reduce((n,c) => n * 26 + c.charCodeAt(0) - 64, 0));
        else { const pair = (q.inputs || []).find(x => x[0] === key), cell = options.template.sheets[target.sheet].cells[col + target.row]; values[col] = pair ? pair[1] : cell && !cell.f ? cell.v : null; }
      }
      result.targetValues.push({target:copy(target), values});
    }
    return result;
  }
  function attach(host, options) {
    if (!host || !host.appendChild) throw new Error('하드웨어 업로드 표시 영역이 필요합니다.');
    let state = mounts.get(host);
    if (state && state.options.quote === options.quote) { state.options = options; if (!host.contains(state.el)) host.appendChild(state.el); return state.api; }
    if (state) state.api.destroy();
    state = {options, file:null, result:null, items:[], targets:[], token:0, applying:false};
    const el = g.document.createElement('section'); state.el = el; el.className = 'hardware-quote-ui';
    el.innerHTML = `<style>.hardware-quote-ui{padding:12px;border:1px solid #cbd5e1;border-radius:8px;margin:10px 0;font:14px sans-serif;background:#fff;color:#172b4d}.hardware-quote-ui .hw-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.hardware-quote-ui .hw-scroll{overflow:auto;max-height:480px}.hardware-quote-ui table{border-collapse:collapse;min-width:1050px;width:100%}.hardware-quote-ui th,.hardware-quote-ui td{padding:6px;border:1px solid #cbd5e1;vertical-align:top}.hardware-quote-ui input:not([type=checkbox]),.hardware-quote-ui select{max-width:160px;width:100%;box-sizing:border-box}.hardware-quote-ui pre{white-space:pre-wrap;max-width:280px;margin:0}.hardware-quote-ui .hw-note{white-space:pre-wrap;font-size:12px;color:#475569;margin:8px 0}.hardware-quote-ui button{padding:6px 12px}.hardware-quote-ui [hidden]{display:none!important}</style>
      <div class="hw-toolbar"><strong>하드웨어 견적 파일</strong><label><input type="checkbox" data-hw="included"> 하드웨어 포함</label><label>원본 파일 선택 <input type="file" data-hw="file" accept=".pdf,.xlsx,.csv,.txt,.tsv" disabled></label></div>
      <p class="hw-note">파일은 이 브라우저 안에서만 읽습니다. PDF/XLSX/CSV/TXT · 최대 30MB. 스캔 PDF는 OCR 미지원. 추측값이나 예시 금액을 입력하지 않습니다.</p>
      <div data-hw="status" role="status" aria-live="polite"></div><div data-hw="review" hidden></div>`;
    host.appendChild(el); const find = n => el.querySelector('[data-hw="' + n + '"]');
    find('included').checked = !!(options.quote && options.quote.hardwareIncluded); find('file').disabled = !find('included').checked;
    function status(text) { find('status').textContent = text; }
    function resetReview() { const review = find('review'); if (!review.hidden) { const confirm = review.querySelector('[data-hw="confirm"]'), done = review.querySelector('[data-hw="done"]'); if (confirm) confirm.checked = false; if (done) done.value = ''; } }
    function render() {
      const review = find('review'); review.hidden = false; state.targets = targets(state.options);
      review.innerHTML = `<div class="hw-note">${esc(state.result.notes.join('\n'))}\n대상행은 직접 선택하세요. 미일치 항목은 별도 하드웨어 구간으로 보관합니다. 숫자 빈칸은 미확인값입니다.</div>
        <div class="hw-scroll"><table><thead><tr>${['포함','품목명','수량','단가','금액','통화','대상행','원문 / 확인사항'].map(t => '<th>' + t + '</th>').join('')}</tr></thead><tbody>${state.items.map((item, i) => `<tr data-row="${i}"><td><input type="checkbox" data-field="selected" aria-label="품목 포함" checked></td><td><input data-field="name" aria-label="품목명" value="${esc(item.name)}"></td>${['quantity','unitPrice','amount'].map(k => `<td><input data-field="${k}" aria-label="${({quantity:'수량',unitPrice:'단가',amount:'금액'})[k]}" inputmode="decimal" value="${esc(item[k])}"></td>`).join('')}<td><select data-field="currency" aria-label="통화"><option value="">확인 필요</option>${['KRW','USD','EUR','JPY','CNY'].map(c => `<option${item.currency === c ? ' selected' : ''}>${c}</option>`).join('')}</select></td><td><select data-field="target" aria-label="대상행"><option value="">별도 하드웨어 구간</option>${state.targets.map((t, j) => `<option value="${j}">${esc(t.sheet + ' · ' + t.row + '행 · ' + t.name)}</option>`).join('')}</select></td><td><pre>${esc(item.rawText)}</pre><div class="hw-note">${esc(item.flags.join(' / '))}</div></td></tr>`).join('')}</tbody></table></div>
        ${state.result.rawText ? `<details><summary>추출 원문</summary><pre style="max-width:none">${esc(state.result.rawText)}</pre></details>` : ''}
        <div class="hw-toolbar"><label>금액 기준 <select data-hw="vat"><option value="">VAT 확인 필요</option><option value="exclusive">부가세 별도</option><option value="inclusive">부가세 포함</option><option value="exempt">면세</option></select></label><label>원본 단위 <select data-hw="unit"><option value="">단위 확인 필요</option><option value="1">원/통화 기본단위</option><option value="1000">천원/천 단위</option><option value="10000">만원/만 단위</option><option value="1000000">백만원/백만 단위</option></select></label><label>적용 방법 <select data-hw="mode"><option value="">방법 선택</option><option value="append">추가 (기존 값 보존)</option><option value="replace">대체 (이전값 스냅샷 보존)</option></select></label></div>
        <label><input type="checkbox" data-hw="overwrite"> 선택한 기존 대상행 또는 기존 가져오기 값을 대체하는 데 동의합니다.</label><br>
        <label><input type="checkbox" data-hw="confirm"> 원본의 품목·금액·통화·VAT·단위를 확인했으며 선택한 추가/대체 방법에 동의합니다.</label>
        <select data-hw="done" aria-label="검토 상태"><option value="">검토 상태 선택</option><option value="done">검토 완료</option></select> <button type="button" data-hw="apply">확인한 실제값 적용</button>`;
    }
    async function apply() {
      if (state.applying) return;
      let locked = [];
      const applyOptions = state.options, applyToken = state.token;
      try {
        if (!find('included').checked || !find('confirm').checked || find('done').value !== 'done') throw new Error('하드웨어 포함, 확인 체크, 검토 완료 선택이 모두 필요합니다.');
        const vat = find('vat').value, unit = Number(find('unit').value), mode = find('mode').value;
        if (!vat || !unit || !mode) throw new Error('VAT·금액단위·추가/대체 방법을 명시적으로 선택하세요.');
        const items = state.items.filter(i => i.selected).map(i => ({...i, item:i.name, target:i.target === '' ? null : copy(state.targets[Number(i.target)]), rawText:i.rawText, quantity:number(i.quantity), unitPrice:number(i.unitPrice), amount:number(i.amount)}));
        if (!items.length) throw new Error('적용할 실제 품목이 없습니다. 원본을 CSV로 변환하거나 수동 확인하세요.');
        for (const i of items) {
          if (!i.name.trim() || i.quantity == null || i.quantity <= 0 || i.unitPrice == null || i.amount == null || !i.currency) throw new Error('선택 품목의 이름·수량·단가·금액·통화 미확인값을 원본 기준으로 채우세요.');
          i.unitPrice *= unit; i.amount *= unit;
          if (!Number.isFinite(i.amount) || !Number.isFinite(i.unitPrice)) throw new Error('금액 범위 초과');
          if (Math.abs(i.quantity * i.unitPrice - i.amount) > Math.max(1, i.amount * 1e-10)) throw new Error('수량×단가와 금액이 일치하지 않습니다. 할인/VAT 기준을 원본에서 확인하고 정정하세요.');
          delete i.selected;
        }
        const mapped = items.filter(i => i.target), seen = new Set();
        for (const i of mapped) { const key = i.target.sheet + '!' + i.target.row; if (seen.has(key)) throw new Error('같은 대상행에 여러 품목을 배정할 수 없습니다. 별도 구간을 선택하세요.'); seen.add(key); }
        const snapshot = previous(state.options, mapped.map(i => i.target)), existing = snapshot.hardwareImported && (snapshot.hardwareImported.items || []).length;
        const occupied = snapshot.targetValues.some(t => number(t.values.J) > 0 || number(t.values.N) > 0 || number(t.values.L) > 0);
        if (mode === 'append' && occupied) throw new Error('추가 모드에서는 기존 대상행을 덮어쓸 수 없습니다. 별도 구간 또는 명시적인 대체를 선택하세요.');
        if (mode === 'replace' && (existing || occupied) && !find('overwrite').checked) throw new Error('기존값 대체 동의 체크가 필요합니다. 이전값은 스냅샷으로 전달합니다.');
        if (typeof state.options.onApply !== 'function') throw new Error('견적 적용 콜백이 연결되지 않았습니다. 기존 견적은 변경하지 않았습니다.');
        state.applying = true;
        locked = Array.from(el.querySelectorAll('input,select,button')).map(control => ({control, disabled:control.disabled}));
        locked.forEach(x => { x.control.disabled = true; }); status('원본 보관 및 확인한 값 적용 중…');
        const sourceFile = {name:state.file.name, size:state.file.size, type:state.file.type, lastModified:state.file.lastModified || null};
        const assets = applyOptions.assets;
        if (assets && typeof assets.put === 'function') {
          try { sourceFile.attachment = await assets.put({file:state.file, name:state.file.name, type:state.file.type}); }
          catch (e) { sourceFile.storageWarning = '원본 파일은 견적에 첨부되지 않았습니다(' + (e.message || '저장소 거부') + '). 원본을 별도로 보관하세요.'; }
        }
        else sourceFile.storageWarning = '원본 저장소 미연결: originalFile을 별도로 보관해야 합니다.';
        if (applyToken !== state.token || mounts.get(host) !== state || state.options.quote !== applyOptions.quote) throw new Error('편집 견적이 변경되어 적용을 취소했습니다. 원본 첨부는 별도로 보관됩니다.');
        const totals = {}; items.forEach(i => { totals[i.currency] = (totals[i.currency] || 0) + i.amount; });
        const payload = {sourceFile, originalFile:state.file, items, hardwareIncluded:true, vat, amountUnit:unit, normalizedAmountUnit:1, mode, overwriteConfirmed:find('overwrite').checked, confirmed:true, reviewedAt:new Date().toISOString(), previousSnapshot:snapshot, totals, notes:state.result.notes.slice(), requiresReview:false};
        const applied = await applyOptions.onApply(payload);
        if (applied === false) throw new Error('견적에서 적용을 거부했습니다. 기존값을 확인하세요.');
        resetReview(); if (applyOptions.onDirty) applyOptions.onDirty(true); if (applyOptions.refresh) applyOptions.refresh();
        status('확인한 실제값을 전달했습니다. ' + (sourceFile.storageWarning || '원본 첨부 보관 완료.'));
      } catch (e) { status(e.message || '적용하지 못했습니다. 기존값을 확인하세요.'); }
      finally { state.applying = false; locked.forEach(x => { x.control.disabled = x.disabled; }); find('file').disabled = !find('included').checked; }
    }
    async function change(e) {
      const target = e.target;
      if (state.applying) return;
      if (target === find('included')) { find('file').disabled = !target.checked; resetReview(); status(target.checked ? '원본 파일을 선택하고 검토한 뒤 적용하세요.' : '파일 가져오기를 끕니다. 이미 적용된 금액은 자동 삭제하지 않습니다.'); return; }
      if (target === find('file')) {
        const file = target.files && target.files[0], token = ++state.token; resetReview(); state.file = file; state.items = []; find('review').hidden = true;
        if (!file) return; status('원본의 실제 저장값을 읽는 중…');
        try {
          const result = await extract(file); if (token !== state.token) return;
          state.result = result; state.items = result.candidates.slice(0, 2000).map((c, i) => ({id:'hardware-' + i, name:c.item || '', quantity:c.qty, unitPrice:c.price, amount:c.total, currency:c.currency || '', rawText:(c.raw || []).join(' | '), source:c.source, flags:c.flags || [], selected:true, target:''}));
          if (result.candidates.length > 2000) { state.items = []; result.notes.push('품목 2천개 초과: 파일을 나눠 다시 읽으세요. 일부 품목만 적용하지 않습니다.'); }
          render(); status(state.items.length ? state.items.length + '개 실제 품목 후보: 적용 전 검토 필요' : '읽을 수 있는 품목 없음. 원본을 CSV로 변환하거나 수동 확인하세요.');
        } catch (err) { if (token === state.token) status(err.message || '원본 읽기 불가. CSV로 변환하세요.'); }
        return;
      }
      if (target.dataset.field) { const tr = target.closest('[data-row]'), item = state.items[Number(tr.dataset.row)]; item[target.dataset.field] = target.dataset.field === 'selected' ? target.checked : target.value; resetReview(); }
      else if (['vat','unit','mode','overwrite'].includes(target.dataset.hw)) resetReview();
    }
    el.addEventListener('change', change); el.addEventListener('input', e => { if (e.target.dataset.field && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') change(e); });
    const click = e => { if (e.target.closest('[data-hw="apply"]')) apply(); }; el.addEventListener('click', click);
    state.api = {destroy() { ++state.token; el.remove(); if (mounts.get(host) === state) mounts.delete(host); }, getState() { return {sourceFile:state.file ? {name:state.file.name, size:state.file.size} : null, items:copy(state.items), applying:state.applying}; }};
    mounts.set(host, state); return state.api;
  }
  const api = {attach, extract, parseXlsx, limits:{fileBytes:FILE_LIMIT, zipBytes:ZIP_LIMIT}};
  g.SalesPilotHardwareQuote = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
