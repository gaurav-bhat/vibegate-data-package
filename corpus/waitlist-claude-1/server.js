const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      error: 'Admin view is not configured. Set the ADMIN_PASSWORD environment variable to enable it.',
    });
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="FlowNote Admin"');
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const [user, pass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
  const passBuf = Buffer.from(pass || '');
  const expectedBuf = Buffer.from(ADMIN_PASSWORD);
  const ok =
    user === 'admin' &&
    passBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(passBuf, expectedBuf);

  if (!ok) {
    res.set('WWW-Authenticate', 'Basic realm="FlowNote Admin"');
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  next();
}

// Join the waitlist
app.post('/api/waitlist', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    db.prepare('INSERT INTO signups (email) VALUES (?)').run(email);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(200).json({ message: "You're already on the list!" });
    }
    throw err;
  }

  res.status(201).json({ message: "You're on the list!" });
});

// Admin: list signups
app.get('/api/admin/signups', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT id, email, created_at FROM signups ORDER BY id DESC').all();
  res.json(rows);
});

// Admin: view signups page (kept outside the static /public folder so it
// can't be fetched without passing through requireAdmin)
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`FlowNote waitlist running at http://localhost:${PORT}`);
});
