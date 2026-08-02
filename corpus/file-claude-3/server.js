const express = require('express');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const dataFile = path.join(__dirname, 'data', 'images.json');

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(path.dirname(dataFile), { recursive: true });
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, '[]');
}

function readImages() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeImages(images) {
  fs.writeFileSync(dataFile, JSON.stringify(images, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const id = crypto.randomUUID();
    cb(null, `${id}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/images', (req, res) => {
  const images = readImages().sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
  );
  res.json(images);
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded.' });
  }
  const images = readImages();
  const entry = {
    id: path.parse(req.file.filename).name,
    url: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    uploadedAt: new Date().toISOString(),
  };
  images.push(entry);
  writeImages(images);
  res.status(201).json(entry);
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Upload failed.' });
});

app.listen(PORT, () => {
  console.log(`Gallery running at http://localhost:${PORT}`);
});
