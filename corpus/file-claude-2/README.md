# Image Gallery

A small web app for uploading images and browsing them in a public gallery —
anyone with the link can view it, no login required.

## Requirements

- Node.js v18+

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000

## How it works

- `POST /upload` accepts a single image (field name `image`), validates its
  type and size, and saves it to `public/uploads/` with a random filename.
- Upload metadata (original name, timestamp) is kept in `data/images.json`.
- `GET /` server-renders the gallery from that metadata, newest first.
- Uploaded files are served statically from `/uploads/`, so the gallery link
  works for anyone it's shared with.
