# Image Gallery

A small web app for uploading images and viewing them in a shared gallery.
Anyone with the link can view the gallery; no login required.

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000

## How it works

- `POST /api/upload` accepts an image (`multipart/form-data`, field name
  `image`) via [multer](https://www.npmjs.com/package/multer) and saves it to
  `public/uploads/`, which Express serves statically.
- Metadata (id, url, original filename, upload time) is appended to
  `data/images.json`.
- `GET /api/images` returns the image list, newest first, for the gallery
  page to render.
