const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const { addSignup, listSignups } = require('./lib/store');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAdmin(req, res, next) {
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    return res.status(503).json({
      error: 'Admin view is not configured. Set ADMIN_USER and ADMIN_PASSWORD to enable it.',
    });
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="FlowNote Admin"');
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const [user, pass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
  const ok = timingSafeEqualStr(user || '', ADMIN_USER) && timingSafeEqualStr(pass || '', ADMIN_PASSWORD);

  if (!ok) {
    res.set('WWW-Authenticate', 'Basic realm="FlowNote Admin"');
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  next();
}

app.post('/api/waitlist', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const { created } = await addSignup(email);
    res.status(created ? 201 : 200).json({
      message: created ? "You're on the list!" : "You're already on the list!",
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/admin/signups', requireAdmin, async (req, res, next) => {
  try {
    const signups = await listSignups();
    res.json(signups);
  } catch (err) {
    next(err);
  }
});

// Kept outside /public so it can never be served without passing through requireAdmin.
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`FlowNote waitlist running at http://localhost:${PORT}`);
});
