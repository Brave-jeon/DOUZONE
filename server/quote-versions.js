'use strict';
// The caller MUST pass authenticated(req), never an actor supplied by the JSON body.
// Call inside the document-save transaction to commit both content and number together.
const crypto = require('node:crypto');
function fail(status, code, message) { const e = new Error(message); e.status = status; e.code = code; throw e; }
function text(v, field, max = 500) {
  if (typeof v !== 'string' || !v.trim() || v.length > max || /[\u0000-\u001f\u007f]/.test(v)) fail(400, 'invalid_quote', field + ' 입력을 확인해 주세요.');
  return v;
}
const normal = v => v.normalize('NFKC').replace(/\s+/gu, ' ').trim();
function date(v) {
  if (typeof v !== 'string' || !/^(?:\d{4}-\d{2}-\d{2}|\d{8})$/.test(v)) fail(400, 'invalid_date', '견적일은 YYYY-MM-DD 또는 YYYYMMDD여야 합니다.');
  const s = v.replace(/-/g, ''), y = +s.slice(0, 4), m = +s.slice(4, 6), d = +s.slice(6);
  const dt = new Date(0); dt.setUTCFullYear(y, m - 1, d); dt.setUTCHours(0, 0, 0, 0);
  if (y < 1 || dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) fail(400, 'invalid_date', '실제 존재하는 견적일이 필요합니다.');
  return s;
}
function fields(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail(400, 'invalid_quote', '견적 객체가 필요합니다.');
  // These fields are outputs only. A copy's inherited number must never become authoritative.
  const allowed = ['company', 'solution', 'documentId', 'quoteDate', 'businessNumber'];
  if (Object.keys(p).some(k => !allowed.includes(k))) fail(400, 'number_tampering', '서버 채번 출력값이나 허용되지 않은 항목은 입력할 수 없습니다.');
  const company = text(p.company, '기업명'), solution = text(p.solution, '솔루션'), id = text(p.documentId, '문서 ID', 150);
  if (/[\\/]/.test(id) || ['.', '..'].includes(id)) fail(400, 'invalid_quote', '문서 ID를 확인해 주세요.');
  const bn = p.businessNumber == null || p.businessNumber === '' ? null : text(p.businessNumber, '기업등록번호', 100);
  // Registration numbers remain actual supplied values: no digit-stripping, padding or guessed aliases.
  const companyKey = bn === null ? 'name:' + normal(company) : 'registration:' + bn;
  const solutionKey = normal(solution);
  if (!normal(company) || !solutionKey) fail(400, 'invalid_quote', '기업명과 솔루션이 필요합니다.');
  const versionKey = 'qv1:' + crypto.createHash('sha256').update(JSON.stringify([companyKey, solutionKey])).digest('hex');
  return { company, solution, id, companyKey, solutionKey, versionKey, quoteDate: date(p.quoteDate) };
}
function initialize(db) {
  db.exec(`PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS quote_version_counters (
 version_key TEXT PRIMARY KEY, company_key TEXT NOT NULL, solution_key TEXT NOT NULL,
 last_version INTEGER NOT NULL CHECK(last_version>=0), UNIQUE(company_key,solution_key));
CREATE TABLE IF NOT EXISTS quote_version_allocations (
 user_id TEXT NOT NULL REFERENCES users(id), document_id TEXT NOT NULL,
 version_key TEXT NOT NULL REFERENCES quote_version_counters(version_key),
 company TEXT NOT NULL, solution TEXT NOT NULL, quote_date TEXT NOT NULL,
 quote_no TEXT NOT NULL, quote_version INTEGER NOT NULL CHECK(quote_version>0),
 legacy INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,document_id));
CREATE UNIQUE INDEX IF NOT EXISTS quote_version_unique ON quote_version_allocations(version_key,quote_version) WHERE legacy=0;`);
}
function result(row, reused) {
  return { ok: true, documentId: row.document_id, company: row.company, solution: row.solution,
    quoteDate: row.quote_date, quoteNo: row.quote_no, quoteVersion: row.quote_version + '.0',
    versionKey: row.version_key, source: 'server', scope: 'all-members-company-solution',
    reused, legacy: !!row.legacy,
    grouping: { solution: row.solution, basis: '명시된 solution의 NFKC/공백 정규화 값. 품목은 비교하지 않음. 배포별 분리는 호출자가 실제 메타에 근거해 solution을 구분한 경우에만 적용.' } };
}
function allocate(db, user, payload) {
  if (!user || typeof user.id !== 'string' || !user.id) fail(401, 'login_required', '로그인 회원만 채번할 수 있습니다.');
  const f = fields(payload);
  // SAVEPOINT also permits the parent to atomically save content in an outer BEGIN IMMEDIATE.
  const nested = db.isTransaction === true;
  db.exec(nested ? 'SAVEPOINT quote_number_allocate' : 'BEGIN IMMEDIATE');
  try {
    const member = db.prepare("SELECT id FROM users WHERE id=? AND status='active' AND role IN ('master','member')").get(user.id);
    if (!member) fail(401, 'login_required', '활성 로그인 회원만 채번할 수 있습니다.');
    let old = db.prepare('SELECT * FROM quote_version_allocations WHERE user_id=? AND document_id=?').get(user.id, f.id);
    if (old) {
      if (old.version_key !== f.versionKey) fail(409, 'new_document_required', '기업 또는 솔루션이 변경되었습니다. 새 문서 ID로 새 버전을 생성해 주세요.');
      db.exec(nested ? 'RELEASE quote_number_allocate' : 'COMMIT'); return result(old, true);
    }
    // Only the owner's existing quote is inspected. Never return other members' content.
    const saved = db.prepare("SELECT data FROM documents WHERE user_id=? AND collection='quotes' AND id=?").get(user.id, f.id);
    let legacyNo = null, legacyVersion = 0;
    if (saved) {
      let q; try { q = JSON.parse(saved.data); } catch { fail(409, 'invalid_saved_quote', '저장된 견적을 확인할 수 없습니다.'); }
      if (q && typeof q === 'object') {
        const oldCompany = q.company || q.customer, oldSolution = q.solution;
        const oldCompanyKey = q.businessNumber ? 'registration:' + q.businessNumber : typeof oldCompany === 'string' ? 'name:' + normal(oldCompany) : null;
        if (oldCompanyKey && oldCompanyKey !== f.companyKey) fail(409, 'new_document_required', '저장된 기업 식별키가 변경되었습니다. 새 문서 ID가 필요합니다.');
        if (typeof oldSolution === 'string' && normal(oldSolution) !== f.solutionKey) fail(409, 'new_document_required', '저장된 솔루션이 변경되었습니다. 새 문서 ID가 필요합니다.');
        const match = typeof q.quoteNo === 'string' && /\bVer\s*\.?\s*(\d+)\.\d+/i.exec(q.quoteNo);
        if (match && Number.isSafeInteger(+match[1]) && +match[1] > 0) { legacyNo = q.quoteNo; legacyVersion = +match[1]; }
      }
    }
    db.prepare('INSERT INTO quote_version_counters VALUES (?,?,?,0) ON CONFLICT(version_key) DO NOTHING').run(f.versionKey, f.companyKey, f.solutionKey);
    if (legacyNo) db.prepare('UPDATE quote_version_counters SET last_version=MAX(last_version,?) WHERE version_key=?').run(legacyVersion, f.versionKey);
    const current = db.prepare('SELECT last_version FROM quote_version_counters WHERE version_key=?').get(f.versionKey).last_version;
    const version = legacyNo ? legacyVersion : current + 1;
    if (!Number.isSafeInteger(version)) fail(409, 'version_exhausted', '채번 범위를 초과했습니다.');
    if (!legacyNo) db.prepare('UPDATE quote_version_counters SET last_version=? WHERE version_key=?').run(version, f.versionKey);
    const quoteNo = legacyNo || `CCO - Douzone - Ver ${version}.0 - ${f.quoteDate}`;
    db.prepare('INSERT INTO quote_version_allocations VALUES (?,?,?,?,?,?,?,?,?,?)').run(user.id, f.id, f.versionKey, f.company, f.solution, f.quoteDate, quoteNo, version, legacyNo ? 1 : 0, Date.now());
    old = db.prepare('SELECT * FROM quote_version_allocations WHERE user_id=? AND document_id=?').get(user.id, f.id);
    db.exec(nested ? 'RELEASE quote_number_allocate' : 'COMMIT'); return result(old, false);
  } catch (e) {
    db.exec(nested ? 'ROLLBACK TO quote_number_allocate; RELEASE quote_number_allocate' : 'ROLLBACK'); throw e;
  }
}
module.exports = { initialize, allocate };
