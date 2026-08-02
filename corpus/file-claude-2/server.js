const express = require('express');
const path = require('node:path');
const galleryRouter = require('./routes/gallery');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', galleryRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).send(err.message || 'Something went wrong.');
});

app.listen(PORT, () => {
  console.log(`Gallery running at http://localhost:${PORT}`);
});
