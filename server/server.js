'use strict';
// Local-only server. Internet sharing requires a separately secured HTTPS deployment.
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const PORT = Number(process.env.PORT || 8768);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) throw new Error('PORT 값이 올바르지 않습니다.');
const APP = fs.realpathSync(`${__dirname}/../app`);
const PROJECT = fs.realpathSync(`${__dirname}/..`);
const configuredData = process.env.APP_DATA_DIR || `${process.env.USERPROFILE || process.env.HOME}/.oneai/workspace/salespilot-server-data`;
fs.mkdirSync(configuredData, { recursive: true, mode: 0o700 });
const DATA = fs.realpathSync(configuredData);
function within(child, parent) {
  const c = child.replace(/\\/g, '/').toLowerCase();
  const p = parent.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
  return c === p || c.startsWith(p + '/');
}
function inGitTree(directory) {
  let current = directory.replace(/\\/g, '/').replace(/\/$/, '');
  while (current) {
    if (fs.existsSync(`${current}/.git`)) return true;
    const parent = current.replace(/\/[^/]+$/, '');
    if (parent === current) break;
    current = parent;
  }
  return false;
}
if (within(DATA, PROJECT) || within(DATA, APP) || inGitTree(DATA)) throw new Error('회원 데이터 폴더는 Git 프로젝트와 정적 app 밖에 있어야 합니다.');
const KEY_FILE = `${DATA}/setup-key.txt`;
const db = new DatabaseSync(`${DATA}/members.sqlite`);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
 org TEXT NOT NULL DEFAULT '', dept TEXT NOT NULL DEFAULT '', rank TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
 folderLabel TEXT NOT NULL DEFAULT '', folderPathLabel TEXT NOT NULL DEFAULT '',
 role TEXT NOT NULL CHECK(role IN ('master','member')), status TEXT NOT NULL CHECK(status IN ('active','pending','disabled')),
 salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(user_id,collection,id));`);
const sql = (query, ...args) => db.prepare(query).get(...args);
const all = (query, ...args) => db.prepare(query).all(...args);
const run = (query, ...args) => db.prepare(query).run(...args);
function initialized() { return !!sql("SELECT value FROM meta WHERE key='master_initialized'") || !!sql("SELECT id FROM users WHERE role='master'"); }
if (initialized()) {
  run("INSERT OR IGNORE INTO meta VALUES ('master_initialized','1')");
  if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE);
} else if (!fs.existsSync(KEY_FILE)) {
  fs.writeFileSync(KEY_FILE, crypto.randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 });
}
const PROFILE = ['email', 'name', 'org', 'dept', 'rank', 'phone', 'folderLabel', 'folderPathLabel'];
const PUBLIC = ['id', ...PROFILE, 'role', 'status'];
const MAX_BODY = 1024 * 1024;
const SESSION_AGE = 12 * 60 * 60 * 1000;
const origins = new Set([`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`]);
function fail(status, message) { const e = new Error(message); e.status = status; throw e; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function publicUser(user) { return Object.fromEntries(PUBLIC.map(k => [k, user[k]])); }
function sha(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function safeEqual(a, b) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function derive(password, salt) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve(key.toString('hex'))));
}
function passwordValue(value) {
  if (typeof value !== 'string' || value.length < 10 || Buffer.byteLength(value) > 1024) fail(400, '비밀번호는 10자 이상, 1024바이트 이하여야 합니다.');
  return value;
}
function profile(body, required = false) {
  const result = {};
  for (const field of PROFILE) {
    if (body[field] === undefined) { if (required) result[field] = ''; continue; }
    if (typeof body[field] !== 'string' || body[field].length > (field === 'folderPathLabel' ? 1000 : 250)) fail(400, '프로필 입력 형식을 확인해 주세요.');
    result[field] = body[field].trim();
  }
  if (result.email !== undefined) {
    result.email = result.email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) fail(400, '이메일 주소를 확인해 주세요.');
  }
  if (result.name !== undefined && !result.name) fail(400, '이름을 입력해 주세요.');
  return result;
}
function forbid(body, allowed) {
  if (Object.keys(body).some(k => !allowed.includes(k))) fail(400, '허용되지 않은 변경 항목이 있습니다.');
}
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
async function bodyOf(req) {
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) fail(415, 'JSON 형식으로 요청해 주세요.');
  if (Number(req.headers['content-length']) > MAX_BODY) fail(413, '요청 크기가 너무 큽니다.');
  let size = 0; const chunks = [];
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) fail(413, '요청 크기가 너무 큽니다.'); chunks.push(chunk); }
  let value;
  try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'JSON 입력을 확인해 주세요.'); }
  if (!object(value)) fail(400, 'JSON 객체가 필요합니다.');
  return value;
}
const limits = new Map();
function rate(key, max, duration) {
  const now = Date.now();
  let record = limits.get(key);
  if (!record || record.until <= now) record = { count: 0, until: now + duration };
  record.count++; limits.set(key, record);
  if (limits.size > 10000) for (const [k, v] of limits) if (v.until <= now) limits.delete(k);
  if (limits.size > 20000 || record.count > max) fail(429, '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
}
function cookieToken(req) {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)salespilot_session=([a-f0-9]{64})(?:;|$)/);
  return match ? match[1] : null;
}
function authenticated(req, master = false) {
  const token = cookieToken(req);
  const user = token && sql('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status=?', sha(token), Date.now(), 'active');
  if (!user) fail(401, '로그인이 필요합니다.');
  if (master && user.role !== 'master') fail(403, '마스터 권한이 필요합니다.');
  return user;
}
function createSession(res, id) {
  const token = crypto.randomBytes(32).toString('hex');
  run('DELETE FROM sessions WHERE expires_at<=?', Date.now());
  run('INSERT INTO sessions VALUES (?,?,?)', sha(token), id, Date.now() + SESSION_AGE);
  res.setHeader('Set-Cookie', `salespilot_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE / 1000}`);
}
function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; } catch (e) { db.exec('ROLLBACK'); throw e; }
}
async function register(req, res, body, setup) {
  forbid(body, [...PROFILE, 'password', ...(setup ? ['setupKey'] : [])]);
  if (setup) {
    if (initialized()) fail(403, '마스터 초기화는 이미 완료되었습니다.');
    if (typeof body.setupKey !== 'string' || body.setupKey.length > 256 || !safeEqual(body.setupKey, fs.readFileSync(KEY_FILE, 'utf8').trim())) fail(403, '초기 설정 키를 확인해 주세요.');
  }
  const p = profile(body, true);
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await derive(passwordValue(body.password), salt);
  const id = crypto.randomUUID();
  transaction(() => {
    if (setup && initialized()) fail(403, '마스터 초기화는 이미 완료되었습니다.');
    if (sql('SELECT id FROM users WHERE email=?', p.email)) fail(409, '이미 등록된 이메일입니다.');
    run(`INSERT INTO users (id,${PROFILE.join(',')},role,status,salt,password_hash,created_at) VALUES (${Array(14).fill('?').join(',')})`, id, ...PROFILE.map(k => p[k]), setup ? 'master' : 'member', setup ? 'active' : 'pending', salt, hash, Date.now());
    if (setup) run("INSERT INTO meta VALUES ('master_initialized','1')");
  });
  if (setup) { try { fs.unlinkSync(KEY_FILE); } catch { /* Initialization remains permanently closed in DB. */ } createSession(res, id); }
  json(res, 201, { ok: true, user: publicUser(sql('SELECT * FROM users WHERE id=?', id)) });
}
const dummySalt = crypto.randomBytes(16).toString('hex');
async function login(req, res, body) {
  forbid(body, ['email', 'password']);
  if (typeof body.email !== 'string') fail(400, '이메일 주소를 입력해 주세요.');
  const p = profile({ email: body.email });
  passwordValue(body.password);
  rate(`email:${sha(p.email)}`, 20, 15 * 60 * 1000);
  const user = sql('SELECT * FROM users WHERE email=?', p.email);
  const hash = await derive(body.password, user ? user.salt : dummySalt);
  if (!user || !safeEqual(hash, user.password_hash) || user.status !== 'active') fail(401, '이메일, 비밀번호 또는 회원 승인 상태를 확인해 주세요.');
  createSession(res, user.id); json(res, 200, { ok: true, user: publicUser(user) });
}
function updateUser(actor, targetId, body, admin) {
  forbid(body, [...PROFILE, ...(admin ? ['role', 'status'] : [])]);
  const patch = profile(body);
  if (admin) {
    if (body.role !== undefined) { if (!['master', 'member'].includes(body.role)) fail(400, '역할을 확인해 주세요.'); patch.role = body.role; }
    if (body.status !== undefined) { if (!['active', 'pending', 'disabled'].includes(body.status)) fail(400, '상태를 확인해 주세요.'); patch.status = body.status; }
  }
  return transaction(() => {
    const old = sql('SELECT * FROM users WHERE id=?', targetId);
    if (!old) fail(404, '회원을 찾을 수 없습니다.');
    const next = { ...old, ...patch };
    if (admin && actor.id === targetId && next.status !== 'active') fail(400, '자신의 계정을 비활성화할 수 없습니다.');
    if (old.role === 'master' && old.status === 'active' && (next.role !== 'master' || next.status !== 'active') && sql("SELECT COUNT(*) AS count FROM users WHERE role='master' AND status='active'").count <= 1) fail(400, '마지막 활성 마스터는 변경할 수 없습니다.');
    if (patch.email && sql('SELECT id FROM users WHERE email=? AND id<>?', patch.email, targetId)) fail(409, '이미 등록된 이메일입니다.');
    const fields = Object.keys(patch);
    if (fields.length) run(`UPDATE users SET ${fields.map(k => `${k}=?`).join(',')} WHERE id=?`, ...fields.map(k => patch[k]), targetId);
    if (next.status !== 'active' || next.role !== old.role) run('DELETE FROM sessions WHERE user_id=?', targetId);
    return publicUser(next);
  });
}
function checkSettings(value, depth = 0) {
  if (depth > 20) fail(400, '설정 구조가 너무 깊습니다.');
  if (typeof value === 'string' && /(?:-----BEGIN .*PRIVATE KEY-----|Bearer\s+\S+|(?:password|passwd|api[_-]?key|secret|token)\s*[=:])/i.test(value)) fail(400, '설정에 자격증명을 저장할 수 없습니다.');
  if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
    if (/(?:password|passwd|secret|token|credential|api.?key|authorization|cookie|setup.?key)/i.test(key)) fail(400, '설정에 자격증명을 저장할 수 없습니다.');
    checkSettings(item, depth + 1);
  }
}
function docName(value) {
  if (!value || value.length > 150 || /[\x00-\x1f\\/]/.test(value) || ['.', '..'].includes(value)) fail(400, '자료 식별자를 확인해 주세요.');
  return value;
}
function documentRoute(req, res, url, body) {
  const user = authenticated(req);
  if (url.pathname === '/api/documents' && req.method === 'GET') {
    const collection = docName(url.searchParams.get('collection'));
    const rows = all('SELECT id,data FROM documents WHERE user_id=? AND collection=? ORDER BY id', user.id, collection);
    return json(res, 200, { ok: true, documents: rows.map(row => ({ id: row.id, data: JSON.parse(row.data) })) });
  }
  const parts = url.pathname.split('/');
  if (parts.length !== 5) fail(404, 'API를 찾을 수 없습니다.');
  const collection = docName(decodeURIComponent(parts[3])); const id = docName(decodeURIComponent(parts[4]));
  const row = sql('SELECT data FROM documents WHERE user_id=? AND collection=? AND id=?', user.id, collection, id);
  if (req.method === 'GET') { if (!row) fail(404, '자료를 찾을 수 없습니다.'); return json(res, 200, { ok: true, id, data: JSON.parse(row.data) }); }
  if (req.method === 'DELETE') { run('DELETE FROM documents WHERE user_id=? AND collection=? AND id=?', user.id, collection, id); return json(res, 200, { ok: true }); }
  if (!['PUT', 'PATCH'].includes(req.method)) fail(405, '지원하지 않는 요청입니다.');
  forbid(body, ['data']);
  if (body.data === undefined) fail(400, 'data 항목이 필요합니다.');
  let data = body.data;
  if (req.method === 'PATCH') {
    if (!row) fail(404, '자료를 찾을 수 없습니다.');
    const previous = JSON.parse(row.data);
    if (!object(previous) || !object(data)) fail(400, '부분 수정은 객체 자료만 지원합니다.');
    data = { ...previous, ...data };
  }
  const encoded = JSON.stringify(data);
  if (Buffer.byteLength(encoded) > MAX_BODY) fail(413, '자료 크기가 너무 큽니다.');
  run('INSERT INTO documents VALUES (?,?,?,?) ON CONFLICT(user_id,collection,id) DO UPDATE SET data=excluded.data', user.id, collection, id, encoded);
  json(res, 200, { ok: true, id, data });
}
async function api(req, res, url) {
  const method = req.method;
  let body = {};
  if (!['GET', 'HEAD'].includes(method)) {
    if (!origins.has(req.headers.origin)) fail(403, '허용된 서버 화면에서 요청해 주세요.');
    rate(`write:${req.socket.remoteAddress}`, 120, 60000);
    if (['/api/login', '/api/setup', '/api/register'].includes(url.pathname)) rate(`auth:${req.socket.remoteAddress}`, 30, 15 * 60000);
    if (method !== 'DELETE' && url.pathname !== '/api/logout') body = await bodyOf(req);
  }
  const route = `${method} ${url.pathname}`;
  if (route === 'GET /api/status') return json(res, 200, { ok: true, needsMaster: !initialized() });
  if (route === 'POST /api/setup') return register(req, res, body, true);
  if (route === 'POST /api/register') return register(req, res, body, false);
  if (route === 'POST /api/login') return login(req, res, body);
  if (route === 'POST /api/logout') {
    const token = cookieToken(req); if (token) run('DELETE FROM sessions WHERE token_hash=?', sha(token));
    res.setHeader('Set-Cookie', 'salespilot_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return json(res, 200, { ok: true });
  }
  if (route === 'GET /api/me') return json(res, 200, { ok: true, user: publicUser(authenticated(req)) });
  if (route === 'PATCH /api/me') { const user = authenticated(req); return json(res, 200, { ok: true, user: updateUser(user, user.id, body, false) }); }
  if (route === 'GET /api/admin/users') { authenticated(req, true); return json(res, 200, { ok: true, users: all('SELECT * FROM users ORDER BY created_at,id').map(publicUser) }); }
  if (method === 'PATCH' && /^\/api\/admin\/users\/[^/]+$/.test(url.pathname)) {
    const actor = authenticated(req, true);
    return json(res, 200, { ok: true, user: updateUser(actor, decodeURIComponent(url.pathname.split('/')[4]), body, true) });
  }
  if (url.pathname === '/api/admin/settings' && ['GET', 'PUT'].includes(method)) {
    authenticated(req, true);
    if (method === 'PUT') { forbid(body, ['settings']); if (!object(body.settings)) fail(400, 'settings 객체가 필요합니다.'); checkSettings(body.settings); run('INSERT INTO settings VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data', JSON.stringify(body.settings)); }
    const row = sql('SELECT data FROM settings WHERE id=1');
    return json(res, 200, { ok: true, settings: row ? JSON.parse(row.data) : {} });
  }
  if (url.pathname === '/api/documents' || url.pathname.startsWith('/api/documents/')) return documentRoute(req, res, url, body);
  fail(404, 'API를 찾을 수 없습니다.');
}
const MIME = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', ico: 'image/x-icon', webp: 'image/webp', woff: 'font/woff', woff2: 'font/woff2' };
function staticFile(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method)) fail(405, '지원하지 않는 요청입니다.');
  let relative = decodeURIComponent(url.pathname);
  if (/[\\\x00]/.test(relative) || relative.split('/').some(p => p === '..' || p.startsWith('.'))) fail(403, '파일 경로가 허용되지 않습니다.');
  if (relative === '/') relative = '/index.html';
  let file;
  try { file = fs.realpathSync(APP + relative); } catch { fail(404, '파일을 찾을 수 없습니다.'); }
  if (!within(file, APP)) fail(403, '파일 경로가 허용되지 않습니다.');
  const stat = fs.statSync(file);
  if (!stat.isFile()) fail(404, '파일을 찾을 수 없습니다.');
  const ext = file.split('.').pop().toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-cache' });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  try {
    if (!origins.has(`http://${req.headers.host}`)) fail(403, '허용되지 않은 서버 주소입니다.');
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (url.pathname.startsWith('/api/')) await api(req, res, url); else staticFile(req, res, url);
  } catch (error) {
    if (res.headersSent || res.destroyed) return;
    const status = error.status || (error instanceof URIError ? 400 : 500);
    json(res, status, { ok: false, error: status === 500 ? '서버 처리 중 오류가 발생했습니다.' : error instanceof URIError ? '요청 경로를 확인해 주세요.' : error.message });
  }
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
server.keepAliveTimeout = 5000;
server.maxHeadersCount = 100;
server.on('error', () => { console.error('서버를 시작할 수 없습니다. 포트와 데이터 폴더 권한을 확인해 주세요.'); process.exitCode = 1; });
server.listen(PORT, '127.0.0.1', () => {
  console.log(`SalesPilot: http://127.0.0.1:${PORT}`);
  console.log(`회원 데이터 폴더: ${DATA}`);
  if (!initialized()) console.log(`최초 마스터 설정 키 파일: ${KEY_FILE}`);
  console.log('인터넷 공동 회원가입에는 별도 HTTPS 호스팅이 필요합니다.');
});
function shutdown() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
