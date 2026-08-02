# FlowNote waitlist

Landing page for FlowNote with a hero section, features section, and an
email waitlist form.

## Run

```
npm install
cp .env.example .env   # optional — enables the /admin signup viewer
npm start
```

Visit http://localhost:3000.

## Signups

Emails are stored in `data/signups.json` (created on first signup).

To view who signed up, set `ADMIN_USER` and `ADMIN_PASSWORD` (in `.env` or
the environment) and visit `/admin` — it's protected with HTTP Basic Auth.
Without those set, `/admin` and `/api/admin/signups` return `503` rather
than exposing emails.
