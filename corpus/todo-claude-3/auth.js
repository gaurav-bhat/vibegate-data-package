const crypto = require('node:crypto');

const KEYLEN = 64;
const COOKIE_NAME = 'todo_session';
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// token -> { userId, expiresAt }
const sessions = new Map();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEYLEN).toString('hex');
  return { salt, hash };
}

function passwordMatches(password, salt, storedHash) {
  const candidate = crypto.scryptSync(password, salt, KEYLEN);
  const stored = Buffer.from(storedHash, 'hex');
  if (candidate.length !== stored.length) {
    return false;
  }
  return crypto.timingSafeEqual(candidate, stored);
}

function issueSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function revokeSession(token) {
  sessions.delete(token);
}

function resolveSession(token) {
  const entry = sessions.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return entry.userId;
}

function readCookies(req) {
  const header = req.headers.cookie;
  const jar = {};
  if (!header) return jar;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    jar[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return jar;
}

function attachSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  );
}

function expireSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

function requireAuth(req, res, next) {
  const token = readCookies(req)[COOKIE_NAME];
  const userId = token ? resolveSession(token) : null;
  if (!userId) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  req.userId = userId;
  next();
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  passwordMatches,
  issueSession,
  revokeSession,
  readCookies,
  attachSessionCookie,
  expireSessionCookie,
  requireAuth,
};
