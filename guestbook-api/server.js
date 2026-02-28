// ============================================
// notyet guestbook API
// Express + SQLite — deploy anywhere
// ============================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Your Neocities URL (update when you know it) ---
const ALLOWED_ORIGINS = [
  "https://notyet.neocities.org",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

// ============ MIDDLEWARE ============

app.use(helmet());
app.use(express.json({ limit: "8kb" }));
app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (curl, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);

// Rate limit: 10 posts per 15 min per IP
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many messages. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ DATABASE ============

const db = new Database(path.join(__dirname, "guestbook.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    visible    INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_messages_visible
    ON messages(visible, created_at DESC);
`);

// Prepared statements
const insertMsg = db.prepare(
  "INSERT INTO messages (name, message) VALUES (@name, @message)"
);
const getMessages = db.prepare(
  "SELECT id, name, message, created_at FROM messages WHERE visible = 1 ORDER BY created_at DESC LIMIT @limit OFFSET @offset"
);
const countMessages = db.prepare(
  "SELECT COUNT(*) AS total FROM messages WHERE visible = 1"
);

// ============ ROUTES ============

// GET /messages?limit=50&page=1
app.get("/messages", (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;

  const messages = getMessages.all({ limit, offset });
  const { total } = countMessages.get();

  res.json({
    messages,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// POST /messages  { name, message }
app.post("/messages", postLimiter, (req, res) => {
  let { name, message } = req.body;

  // Validate
  if (!name || !message) {
    return res.status(400).json({ error: "Name and message are required." });
  }

  name = name.toString().trim().slice(0, 40);
  message = message.toString().trim().slice(0, 500);

  if (name.length === 0 || message.length === 0) {
    return res.status(400).json({ error: "Name and message cannot be empty." });
  }

  // Basic HTML sanitization (strip tags)
  name = name.replace(/<[^>]*>/g, "");
  message = message.replace(/<[^>]*>/g, "");

  const result = insertMsg.run({ name, message });

  res.status(201).json({
    id: result.lastInsertRowid,
    name,
    message,
    created_at: new Date().toISOString(),
  });
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "notyet-guestbook" });
});

// ============ START ============

app.listen(PORT, () => {
  console.log(`Guestbook API running on port ${PORT}`);
});
