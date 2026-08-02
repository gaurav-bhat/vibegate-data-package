# Image Gallery

A web app for uploading images and viewing them in a shared public gallery.

## Requirements

- Node.js v18+

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000

## API

- `GET /api/images` — list uploaded image URLs
- `POST /api/upload` — upload an image (multipart form field `image`)

Uploaded files are stored in `public/uploads/` and served statically, so
anyone with the gallery link can view them.
