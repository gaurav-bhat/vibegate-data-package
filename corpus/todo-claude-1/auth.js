const crypto = require('node:crypto');

const SCRYPT_KEYLEN = 64;
const SESSION_COOKIE = 'session_token';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory session store: token -> { userId, expiresAt }
const sessions = new Map();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(expectedHash, 'hex');
  if (hash.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(hash, expected);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function destroySession(token) {
  sessions.delete(token);
}

function getUserIdForToken(token) {
  const session = sessions.get(token);
  if (!session) {
    return null;
  }
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.userId;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) {
    return cookies;
  }
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function setSessionCookie(res, token) {
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  const userId = token ? getUserIdForToken(token) : null;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  req.userId = userId;
  next();
}

module.exports = {
  SESSION_COOKIE,
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getUserIdForToken,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
};
