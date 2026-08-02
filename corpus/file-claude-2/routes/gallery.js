const express = require('express');
const multer = require('multer');
const path = require('node:path');
const crypto = require('node:crypto');
const store = require('../lib/store');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const id = crypto.randomUUID();
    cb(null, `${id}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed.'));
    }
    cb(null, true);
  },
});

router.get('/', (req, res) => {
  const images = store.readAll();
  res.render('gallery', { images });
});

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image uploaded.');
  }
  store.add({
    filename: req.file.filename,
    originalName: req.file.originalname,
    uploadedAt: new Date().toISOString(),
  });
  res.redirect('/');
});

module.exports = router;
