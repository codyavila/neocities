# notyet Guestbook API

A tiny Express + SQLite API that powers the guestbook on notyet's Neocities site.

## Setup

```bash
cd guestbook-api
npm install
npm start
```

Server runs on `http://localhost:3000` by default. Set `PORT` env var to change.

## Endpoints

| Method | Path        | Description              |
|--------|-------------|--------------------------|
| GET    | `/`         | Health check             |
| GET    | `/messages` | Fetch guestbook messages |
| POST   | `/messages` | Submit a new message     |

### GET /messages

Query params:
- `limit` (1-100, default 50)
- `page` (default 1)

### POST /messages

Body (JSON):
```json
{
  "name": "visitor name (max 40 chars)",
  "message": "their message (max 500 chars)"
}
```

Rate limited to 10 posts per 15 minutes per IP.

## Deploy

Works on Render, Railway, Fly.io, or any Node host.

### Render (free tier)
1. Push this folder to a GitHub repo
2. New Web Service → connect repo → set root directory to `guestbook-api`
3. Build: `npm install` / Start: `npm start`
4. Done — copy the URL and paste it into `guestbook.html` on your Neocities site

### Railway
1. `railway init` → `railway up`
2. Copy the public URL

Update `ALLOWED_ORIGINS` in `server.js` with your actual Neocities URL.
