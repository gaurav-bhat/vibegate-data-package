const crypto = require('node:crypto');

const KEY_LENGTH = 64;
const COOKIE_NAME = 'todo_session';
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// token -> { userId, expiresAt }
const sessionStore = new Map();

function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, KEY_LENGTH).toString('hex');
  return { salt, hash: derived };
}

function passwordMatches(plainPassword, salt, storedHash) {
  const derived = crypto.scryptSync(plainPassword, salt, KEY_LENGTH);
  const stored = Buffer.from(storedHash, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

function startSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessionStore.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function endSession(token) {
  sessionStore.delete(token);
}

function resolveSession(token) {
  const entry = sessionStore.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    sessionStore.delete(token);
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
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Lax`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

function requireAuth(req, res, next) {
  const token = readCookies(req)[COOKIE_NAME];
  const userId = token ? resolveSession(token) : null;
  if (!userId) {
    return res.status(401).json({ error: 'You need to log in first.' });
  }
  req.userId = userId;
  next();
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  passwordMatches,
  startSession,
  endSession,
  resolveSession,
  readCookies,
  attachSessionCookie,
  clearSessionCookie,
  requireAuth,
};
