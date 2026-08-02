require('dotenv').config();
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { addSignup, getSignups } = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/signup', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const result = addSignup(email);
  if (!result.added) {
    return res.status(409).json({ error: "That email's already on the waitlist." });
  }

  return res.status(201).json({ ok: true });
});

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAdmin(req, res, next) {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    return res
      .status(503)
      .send('Admin dashboard is disabled. Set ADMIN_USER and ADMIN_PASSWORD to enable it.');
  }

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="FlowNote Admin"');
    return res.status(401).send('Authentication required.');
  }

  const [user, password] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
  const ok =
    timingSafeEqual(user || '', ADMIN_USER) && timingSafeEqual(password || '', ADMIN_PASSWORD);

  if (!ok) {
    res.set('WWW-Authenticate', 'Basic realm="FlowNote Admin"');
    return res.status(401).send('Invalid credentials.');
  }

  next();
}

app.get('/api/admin/signups', requireAdmin, (req, res) => {
  res.json(getSignups());
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.use((req, res) => {
  res.status(404).send('Not found.');
});

app.listen(PORT, () => {
  console.log(`FlowNote waitlist app listening on http://localhost:${PORT}`);
});
