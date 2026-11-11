/* Preview is advisory: only a server save may finalize a number. Load after member-auth.js. */
(function (g) {
  'use strict';
  const norm = v => v.normalize('NFKC').replace(/\s+/gu, ' ').trim();
  function required(v, label, max = 500) {
    if (typeof v !== 'string' || !norm(v) || v.length > max || /[\u0000-\u001f\u007f]/.test(v)) throw new Error(label + ' 입력이 필요합니다.');
    return v;
  }
  function date(v) {
    if (typeof v !== 'string' || !/^(?:\d{4}-\d{2}-\d{2}|\d{8})$/.test(v)) throw new Error('견적일 형식을 확인해 주세요.');
    const s = v.replace(/-/g, ''), y = +s.slice(0,4), m = +s.slice(4,6), d = +s.slice(6);
    const dt = new Date(0); dt.setUTCFullYear(y,m-1,d); dt.setUTCHours(0,0,0,0);
    if (y < 1 || dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m-1 || dt.getUTCDate() !== d) throw new Error('실제 존재하는 견적일이 필요합니다.');
    return s;
  }
  function grouping(q) {
    if (typeof q.solution === 'string' && norm(q.solution)) return {
      solution: q.solution, basis: '견적의 명시된 solution', deploymentSeparated: null,
      explanation: '명시된 solution이 동일하면 품목·모듈 변경과 무관하게 같은 카운터입니다.'
    };
    let meta = q.templateMetadata || q.templateMeta;
    if (!meta && q.tplId) {
      // XQ_TPLS is an existing global lexical const in src/xq.js, not necessarily window property.
      const list = typeof XQ_TPLS !== 'undefined' ? XQ_TPLS : g.XQ_TPLS;
      if (Array.isArray(list)) meta = list.find(t => t.id === q.tplId);
    }
    if (!meta || typeof meta !== 'object') throw new Error('솔루션 근거가 없습니다. 실제 템플릿 메타 또는 solution을 명시해 주세요. 클래식 template 코드나 품목명으로 추정하지 않습니다.');
    const family = meta.productFamily || meta.family || meta.solution;
    if (typeof family === 'string' && norm(family)) {
      const separated = meta.versionScope === 'deployment';
      if (separated && !meta.kind && !meta.deployment) throw new Error('배포별 채번 메타에 배포형식이 없습니다.');
      const solution = separated ? family + ' / ' + required(meta.deployment || meta.kind,'배포형식') : family;
      return { solution, basis: '실제 템플릿 productFamily/family/solution 및 versionScope', deploymentSeparated: separated,
        explanation: separated ? '메타 versionScope=deployment에 따라 배포형식을 별도 그룹으로 구분합니다. 모듈은 비교하지 않습니다.' : '명시된 상품군으로 통합합니다. 배포별 분리 근거가 없어 배포형식을 카운터에 넣지 않습니다.' };
    }
    // Existing XQ metadata supplies title/kind, but no productFamily/versionScope.
    // Preserve the exact declared title's product label; do NOT infer product from line items.
    const title = required(meta.title, '템플릿 상품명');
    const solution = title.replace(/\s*가격확약서\s*$/, '').trim();
    required(solution, '템플릿 상품명');
    return { solution, basis: 'src/xq.js XQ_TPLS의 실제 title (가격확약서 접미어만 제외)',
      deployment: meta.kind || null, deploymentSeparated: true,
      explanation: '동일 title인 패키지·커스터마이징·MAS는 통합합니다. Cloud/CSAP/설치형은 선언된 상품 title이 다르므로 구분합니다. kind는 배포 근거이며 별도 추가 키는 아닙니다. 메타에 공통 productFamily를 지정하면 통합할 수 있습니다.' };
  }
  function payload(q) {
    if (!q || typeof q !== 'object' || Array.isArray(q)) throw new Error('견적 객체가 필요합니다.');
    const group = grouping(q), p = { company: required(q.company != null ? q.company : q.customer,'기업명'),
      solution: required(group.solution,'솔루션'), documentId: required(q.documentId || q.id,'문서 ID',150), quoteDate: date(q.quoteDate) };
    if (/[\\/]/.test(p.documentId) || ['.','..'].includes(p.documentId)) throw new Error('문서 ID를 확인해 주세요.');
    // Do not use bizNo: in the classic application that is the proposer's registration number.
    if (q.businessNumber != null && q.businessNumber !== '') p.businessNumber = required(q.businessNumber,'고객 기업등록번호',100);
    return { p, group, key: JSON.stringify([p.businessNumber == null ? 'name:'+norm(p.company) : 'registration:'+p.businessNumber,norm(p.solution)]) };
  }
  function quotes(values) {
    if (values instanceof Map) return [...values.values()];
    if (Array.isArray(values)) return values;
    if (values && Array.isArray(values.docs)) return values.docs.map(d => Object.assign({id:d.id},d.data()));
    return [];
  }
  function version(q) {
    const v = typeof q.quoteNo === 'string' && /\bVer\s*\.?\s*(\d+)\.\d+/i.exec(q.quoteNo);
    const n = v ? +v[1] : parseFloat(q.quoteVersion);
    return Number.isSafeInteger(n) && n > 0 ? n : 0;
  }
  function preview(q, allQuotes) {
    const f = payload(q), rows = quotes(allQuotes);
    // A cloned document inherits quoteNo; only an actual matching saved document keeps it.
    const own = rows.find(r => (r.documentId || r.id) === f.p.documentId);
    if (own && own.quoteNo) {
      const old = payload(own);
      if (old.key !== f.key) throw new Error('기업 또는 솔루션 변경은 새 문서 ID로 저장해 주세요.');
      return { quoteNo: own.quoteNo, quoteVersion: own.quoteVersion || version(own)+'.0', versionKey: own.versionKey || 'preview:'+f.key,
        source: 'preview', scope: 'visible-quotes-only', final: false, reused: true, grouping: f.group };
    }
    let max = 0;
    for (const r of rows) { try { if (payload(r).key === f.key) max = Math.max(max,version(r)); } catch (_) { /* Unmapped legacy records are never guessed into a group. */ } }
    if (!Number.isSafeInteger(max+1)) throw new Error('채번 범위를 초과했습니다.');
    return { quoteNo: `CCO - Douzone - Ver ${max+1}.0 - ${f.p.quoteDate}`, quoteVersion: (max+1)+'.0',
      versionKey: 'preview:'+f.key, source: 'preview', scope: 'visible-quotes-only', final: false, reused: false,
      grouping: f.group, warning: '다른 회원의 카운터는 볼 수 없습니다. 최종 번호는 서버 저장 때 확정됩니다.' };
  }
  async function assign(q) {
    const auth = g.SalesPilotAuth;
    if (!auth || !auth.isAuthenticated()) throw new Error('로그인 회원만 채번할 수 있습니다.');
    const f = payload(q);
    // No inherited quoteNo/quoteVersion is transmitted. The server owns these values.
    const r = await auth.request('/api/quotes/allocate',{method:'POST',body:f.p});
    if (!r || r.ok !== true || r.source !== 'server' || r.documentId !== f.p.documentId || typeof r.quoteNo !== 'string' || !/^\d+\.0$/.test(r.quoteVersion) || typeof r.versionKey !== 'string' || !r.versionKey.startsWith('qv1:')) throw new Error('서버 채번 응답을 확인해 주세요.');
    const now = payload(q);
    if (now.key !== f.key || now.p.documentId !== f.p.documentId || now.p.quoteDate !== f.p.quoteDate) throw new Error('채번 요청 중 견적이 변경되었습니다. 다시 저장해 주세요.');
    Object.assign(q,{quoteNo:r.quoteNo,quoteVersion:r.quoteVersion,versionKey:r.versionKey,quoteNumberSource:'server',quoteNumberDocumentId:r.documentId});
    return Object.assign({},r,{grouping:f.group,serverGrouping:r.grouping});
  }
  g.SalesPilotQuoteNumbering = Object.freeze({preview,assign});
})(window);
