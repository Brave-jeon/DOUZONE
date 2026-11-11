/* Local-only quote assistance. Returns proposals; never mutates a quote/Book. */
(function (root) {
  'use strict';
  const clean = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  const norm = v => clean(v).replace(/\s/g, '');
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const colNum = s => Array.from(s).reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  function reader(template, book, quote) {
    const overrides = Object.fromEntries((quote && quote.inputs) || []);
    return (sheet, a) => {
      const key = sheet + '!' + a;
      if (book && typeof book.value === 'function') {
        const m = /^([A-Z]+)(\d+)$/.exec(a);
        const v = book.value(sheet, +m[2], colNum(m[1]));
        return v && typeof v === 'object' && 'e' in v ? null : v;
      }
      if (Object.prototype.hasOwnProperty.call(overrides, key)) return overrides[key];
      const cell = template.sheets[sheet].cells[a];
      return cell && !('f' in cell) ? cell.v : null;
    };
  }
  function educationCatalog(template) {
    const sh = template.sheets['교육비'];
    if (!sh) return [];
    const val = a => (sh.cells[a] || {}).v;
    let group = '', subgroup = '';
    const result = [];
    for (let r = 3; r <= sh.maxr; r++) {
      if (val('A' + r)) group = clean(val('A' + r));
      if (val('B' + r)) subgroup = clean(val('B' + r));
      if (!val('E' + r)) continue;
      const detail = clean(val('D' + r));
      const name = detail && subgroup && !detail.includes(subgroup) ? subgroup + ' ' + detail : detail || subgroup;
      result.push({ row: r, group, subgroup, name, spec: clean(val('E' + r)), price: finite(val('H' + r)) ? val('H' + r) : null, note: clean(val('I' + r)), source: '교육비!H' + r });
    }
    return result;
  }
  function licenseSelection(template, quote, read) {
    const sheet = quote.sheet, sh = template.sheets[sheet];
    let section = '', group = '';
    const selected = [];
    for (let r = 1; r <= sh.maxr; r++) {
      const b = clean(read(sheet, 'B' + r));
      if (/^\[/.test(b)) section = b;
      if (!/라이선스/.test(section) || /유저|연동|API/.test(section)) continue;
      if (b && !/소\s*계|구\s*분|^\[/.test(b)) group = b;
      const qty = read(sheet, 'J' + r);
      if (!finite(qty) || qty <= 0) continue;
      const name = clean(read(sheet, 'E' + r) || read(sheet, 'C' + r));
      if (name) selected.push({ name, group, qty, source: sheet + '!J' + r });
    }
    return selected;
  }
  function autoEducation(args) {
    const { quote, template, book } = args || {};
    const result = { updates: [], notes: [], candidates: [], mode: 'visit', requiresReview: true };
    if (!quote || !template || !template.sheets || !template.sheets[quote.sheet]) { result.notes.push('견적/양식/선택 시트가 필요합니다.'); return result; }
    if (args.mode && args.mode !== 'visit') { result.notes.push('승인된 방문교육 모드만 지원합니다.'); return result; }
    const read = reader(template, book, quote), catalog = educationCatalog(template);
    const selected = licenseSelection(template, quote, read);
    result.selectedModules = selected;
    const names = selected.map(x => norm(x.name));
    const has = s => names.some(n => n === norm(s));
    const wanted = new Set();
    const profit = norm(quote.organizationType || ''); // Explicitly supplied only; never infer from a customer name.
    const variant = profit === '영리' || profit === '영리형' ? '영리' : profit === '비영리' || profit === '비영리형' ? '비영리' : null;
    const add = predicate => {
      const matches = catalog.filter(predicate);
      if (matches.length === 1) wanted.add(matches[0]);
      else result.notes.push('교육 카탈로그 매핑 확인 필요: ' + (matches.map(x => x.name).join(', ') || '해당 항목 없음'));
    };
    const basic = [ ['회계관리', '회계관리교육비'], ['인사 관리', '인사관리교육비'], ['자산 관리', '자산관리교육비'], ['인사근태 확장형', '인사근태확장형교육비'], ['영업관리', '영업관리교육비'], ['구매자재관리', '구매관리교육비'], ['생산관리', '생산관리교육비'], ['외주관리', '외주관리교육비'], ['원가관리', '원가관리교육비'], ['모바일 물류관리 유통 및 제조', '모바일물류관리교육비'], ['온라인쇼핑몰관리', '온라인쇼핑몰교육비'] ];
    basic.forEach(([module, education]) => { if (has(module)) add(x => norm(x.name).endsWith(education) && x.group === 'ERP'); });
    if (selected.some(x => /회계|예산|인사/.test(norm(x.group)))) add(x => /회계.*예산.*인사.*공통.*필수/.test(x.name));
    const logistics = selected.some(x => /영업|구매자재|모바일물류/.test(norm(x.group)));
    const production = selected.some(x => /생산/.test(norm(x.group)));
    if (logistics && production) result.notes.push('물류+생산 공통교육: 카탈로그 비고의 방문 300만원/3회 조정 적용 확인 필요. 두 공통 항목은 자동 중복 입력하지 않습니다.');
    else if (logistics || production) add(x => norm(x.subgroup).startsWith('"' + (logistics ? '물류' : '생산') + '"') && /필수/.test(x.subgroup));
    if (has('예산 관리')) {
      if (!variant) result.notes.push('예산교육 영리/비영리 구분 확인 필요 (quote.organizationType).');
      else add(x => norm(x.name).includes('예산관리교육비(' + variant + ')'));
    }
    if (has('UC 확장팩')) {
      if (!variant) result.notes.push('UC 확장팩 교육 영리/비영리 구분 확인 필요 (quote.organizationType).');
      else add(x => x.subgroup === 'UC 확장팩' && norm(x.name) === 'UC확장팩' + variant + '교육비');
    }
    if (has('UC 단독팩')) add(x => norm(x.name) === 'UC단독팩교육비');
    if (has('CRM')) add(x => norm(x.name) === 'CRM교육비');
    if (has('리걸테크 에디션')) {
      const other = selected.some(x => /회계|인사|예산|자산|영업|구매|생산/.test(x.group)) || has('UC 확장팩');
      add(x => x.subgroup === '리걸테크 에디션' && norm(x.name) === '리걸테크에디션' + (other ? '교육비' : '단독교육비'));
    }
    if (selected.some(x => /수입|수출/.test(x.name))) result.notes.push('수출/수입 별도 교육 해당 여부와 카탈로그 매핑 확인 필요.');
    if (selected.some(x => /ONE\s*AI/.test(x.name))) result.notes.push('ONE AI 교육은 1회/2회 및 선택교육 여부 확인 필요.');
    if (!selected.length) result.notes.push('선택된 라이선스 모듈이 없습니다 (실제 J열 수량 > 0 기준).');
    const sh = template.sheets[quote.sheet], slots = [];
    for (let r = 1; r <= sh.maxr; r++) for (const col of ['C', 'E']) {
      const raw = (sh.cells[col + r] || {}).v;
      if (/교육비.*시트에서|교육비 시트/.test(String(raw || ''))) slots.push({ row: r, col });
    }
    const occupied = new Set();
    Array.from(wanted).sort((a, b) => Number(/필수/.test(b.name)) - Number(/필수/.test(a.name))).forEach(item => {
      result.candidates.push(item);
      if (item.price === null) { result.notes.push(item.name + ': 방문 가격 확인 필요.'); return; }
      let slot = slots.find(s => !occupied.has(s.row) && norm(read(quote.sheet, s.col + s.row)) === norm(item.name));
      if (!slot) slot = slots.find(s => !occupied.has(s.row) && (!clean(read(quote.sheet, s.col + s.row)) || /시트에서/.test(clean(read(quote.sheet, s.col + s.row)))));
      if (!slot) { result.notes.push(item.name + ': 빈 교육 입력행 부족. 기존 행은 덮어쓰지 않습니다.'); return; }
      occupied.add(slot.row);
      for (const [col, value] of [[slot.col, item.name], ['F', item.spec], ['I', item.price]]) {
        const addr = col + slot.row;
        if ('f' in (sh.cells[addr] || {})) { result.notes.push(addr + ': 수식 보호로 입력 제외.'); continue; }
        result.updates.push([quote.sheet + '!' + addr, value]);
      }
      const qty = read(quote.sheet, 'J' + slot.row);
      if (!finite(qty) || qty <= 0) result.notes.push(item.name + ': J' + slot.row + ' 수량 확인 필요. 사양의 교육 횟수는 묶음가격의 설명이며 수량으로 임의 전환하지 않습니다.');
      else result.notes.push(item.name + ': 기존 J' + slot.row + '=' + qty + ' 유지. 묶음 방문가격 × 수량 계산 확인 필요.');
    });
    return result;
  }
  function csvRows(text, delimiter) {
    const rows = []; let row = [], value = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
      else if (c === delimiter && !quoted) { row.push(value); value = ''; }
      else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(value); rows.push(row); row = []; value = ''; }
      else value += c;
    }
    if (value || row.length) { row.push(value); rows.push(row); }
    if (quoted) throw new Error('CSV 따옴표가 닫히지 않았습니다.');
    return rows;
  }
  function numeric(value) {
    if (finite(value)) return value >= 0 ? value : null;
    const s = clean(value).replace(/^(KRW|₩)\s*/i, '').replace(/\s*(원|KRW)$/i, '');
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) return null;
    const n = Number(s.replace(/,/g, '')); return Number.isFinite(n) ? n : null;
  }
  function currency(text) {
    const currencies = new Set();
    if (/KRW|₩|\(원\)|(?:단위\s*[:：]?\s*원)|\d\s*원/i.test(text)) currencies.add('KRW');
    if (/USD|US\$|\$/i.test(text)) currencies.add('USD');
    if (/EUR|€/i.test(text)) currencies.add('EUR');
    if (/JPY|CNY|¥|엔|위안/i.test(text)) currencies.add('OTHER');
    if (/만원|천원|백만원|단위\s*[:：]?\s*(천|백만)/.test(text)) return null;
    return currencies.size === 1 && currencies.has('KRW') ? 'KRW' : null;
  }
  function tableCandidates(rows, source, notes) {
    let map = null; const result = [];
    const whole = rows.map(r => r.join(' ')).join('\n'), unit = currency(whole);
    const fields = { item: /^(품목(?:명)?|품명|제품(?:명)?|항목|item|description)$/i, qty: /^(수량|qty|quantity)$/i, price: /^(단가(?:\(원\))?|unit\s*price)$/i, total: /^(합계(?:\(원\))?|금액(?:\(원\))?|공급가액|총액|amount|total)$/i };
    rows.forEach((row, index) => {
      const next = {};
      Object.keys(fields).forEach(k => { const i = row.findIndex(c => fields[k].test(clean(c))); if (i >= 0) next[k] = i; });
      if ('item' in next) { map = { ...next, width: row.length }; return; }
      if (!map) return;
      const item = clean(row[map.item]);
      if (!item || /^(합계|총계|소계|부가세|VAT|total|subtotal)$/i.test(item)) return;
      const aligned = row.length === map.width;
      const raw = k => aligned && k in map ? row[map[k]] : null;
      const flags = ['사용자 확인 후 입력'];
      if (!aligned) flags.push('열 정렬 불명확: 숫자 자동배정 제외');
      const qty = numeric(raw('qty'));
      const price = unit ? numeric(raw('price')) : null, total = unit ? numeric(raw('total')) : null;
      if (qty === null) flags.push('수량 확인 필요');
      if (!unit) flags.push('통화/금액단위 확인 필요 (KRW 원 단위 명시 필요)');
      if (price === null) flags.push('단가 확인 필요');
      if (total === null) flags.push('합계 확인 필요');
      if (finite(qty) && finite(price) && finite(total) && Math.abs(qty * price - total) > 1) flags.push('수량×단가와 원본 합계 불일치');
      result.push({ item, qty, price, total, currency: unit, raw: row.slice(), source: source + ':' + (index + 1), flags, requiresReview: true });
    });
    if (!map) notes.push(source + ': 품목/수량/단가/합계 열 머리글을 식별하지 못했습니다. 원문 수동확인 필요.');
    return result;
  }
  async function fileText(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch (_) { return new TextDecoder('euc-kr', { fatal: true }).decode(bytes); }
  }
  async function pdfTables(file) {
    const parser = root.pdfjsLib;
    if (!parser || !parser.getDocument) throw new Error('PDF 텍스트 추출 라이브러리 없음: PDF 자동읽기 지원불가. 수동확인 필요 (pdf-lib/jsPDF는 텍스트 표 추출기가 아님).');
    const worker = parser.GlobalWorkerOptions && parser.GlobalWorkerOptions.workerSrc;
    if (!worker || /^(?:https?:)?\/\//i.test(worker)) throw new Error('로컬 PDF worker 없음: 외부 CDN을 추가하지 않습니다. PDF 수동확인 필요.');
    const doc = await parser.getDocument({ data: new Uint8Array(await file.arrayBuffer()), useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
    const tables = [];
    try {
      for (let p = 1; p <= doc.numPages; p++) {
        const content = await (await doc.getPage(p)).getTextContent();
        const lines = [];
        content.items.filter(i => clean(i.str)).forEach(i => {
          const y = i.transform[5], x = i.transform[4];
          let line = lines.find(l => Math.abs(l.y - y) < 2);
          if (!line) { line = { y, items: [] }; lines.push(line); }
          line.items.push({ x, text: i.str, width: i.width || 0 });
        });
        const rows = lines.sort((a, b) => b.y - a.y).map(l => {
          const parts = []; let end = -Infinity;
          l.items.sort((a, b) => a.x - b.x).forEach(i => { if (parts.length && i.x - end < 12) parts[parts.length - 1] += ' ' + i.text; else parts.push(i.text); end = i.x + i.width; });
          return parts;
        });
        tables.push({ source: 'PDF page ' + p, rows });
      }
    } finally { await doc.destroy(); }
    return tables;
  }
  async function hardwareImport(file) {
    const result = { originalFile: file, candidates: [], notes: [], supported: false, requiresReview: true, reviewUI: null };
    result.reviewUI = { columns: ['item', 'qty', 'price', 'total', 'currency', 'source', 'flags'], candidates: result.candidates, originalFile: file, requireExplicitConfirmation: true, applyAutomatically: false, preserveFormulas: true };
    if (!file || typeof file.arrayBuffer !== 'function') { result.notes.push('원본 File/Blob이 필요합니다.'); return result; }
    if (file.size > 30 * 1024 * 1024) { result.notes.push('30MB 초과 파일: 수동 확인 필요.'); return result; }
    const ext = String(file.name || '').split('.').pop().toLowerCase();
    try {
      let tables;
      if (ext === 'pdf' || file.type === 'application/pdf') {
        tables = await pdfTables(file);
        if (!tables.some(t => t.rows.length)) result.notes.push('스캔 PDF 또는 텍스트 없음: OCR 미지원. 원본 수동확인 필요.');
      } else if (ext === 'xlsx') {
        if (!root.XLSX || !root.XLSX.read) throw new Error('XLSX 읽기 라이브러리 없음: XLSX 지원불가. CSV/텍스트로 저장하거나 수동확인하세요.');
        const wb = root.XLSX.read(await file.arrayBuffer(), { type: 'array', cellFormula: false });
        tables = wb.SheetNames.map(n => ({ source: n, rows: root.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }) }));
      } else if (['csv', 'txt', 'tsv', 'text'].includes(ext) || /^text\//.test(file.type || '')) {
        const text = await fileText(file); result.rawText = text;
        const first = text.split(/\r?\n/).find(l => /품목|품명|제품|항목|item|description/i.test(l)) || '';
        const delimiter = first.includes('\t') ? '\t' : first.includes(',') ? ',' : first.includes(';') ? ';' : null;
        const rows = delimiter ? csvRows(text, delimiter) : text.split(/\r?\n/).map(l => l.split(/\s{2,}|\s*\|\s*/));
        tables = [{ source: file.name || 'text', rows }];
      } else throw new Error('지원불가 파일 형식: PDF/XLSX/CSV/텍스트만 확인합니다.');
      result.supported = true;
      tables.forEach(t => result.candidates.push(...tableCandidates(t.rows, t.source, result.notes)));
      result.sourceTables = tables;
      if (!result.candidates.length) result.notes.push('확실한 품목 표 후보 없음. 숫자를 추측하지 않고 원본 수동확인을 요청합니다.');
      result.notes.push('원본 보존. 후보의 합계를 새로 계산하거나 견적 워크북에 자동 입력하지 않습니다.');
    } catch (e) { result.notes.push(e.message || String(e)); }
    return result;
  }
  const api = { autoEducation, hardwareImport };
  root.SalesPilotQuoteAssistance = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
