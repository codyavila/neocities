// ============================================
// notyet guestbook API
// Express + sql.js (pure JS SQLite) — deploy anywhere
// ============================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "guestbook.db");

// --- Your Neocities URL (update when you know it) ---
const ALLOWED_ORIGINS = [
  "https://notyet.neocities.org",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://0.0.0.0:8080",
  "https://neocities-ua5u.onrender.com",
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

let db;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Auto-save every 30 seconds
setInterval(saveDb, 30000);

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing DB file if it exists
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      message    TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      visible    INTEGER NOT NULL DEFAULT 1
    )
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_visible
      ON messages(visible, created_at DESC)
  `);
  saveDb();
}

// ============ ROUTES ============

// GET /messages?limit=50&page=1
app.get("/messages", (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;

    const rows = db.exec(
      "SELECT id, name, message, created_at FROM messages WHERE visible = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const messages = rows.length > 0
      ? rows[0].values.map(([id, name, message, created_at]) => ({
          id, name, message, created_at,
        }))
      : [];

    const countResult = db.exec(
      "SELECT COUNT(*) AS total FROM messages WHERE visible = 1"
    );
    const total = countResult[0].values[0][0];

    res.json({
      messages,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /messages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /messages  { name, message }
app.post("/messages", postLimiter, (req, res) => {
  try {
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

    db.run("INSERT INTO messages (name, message) VALUES (?, ?)", [name, message]);
    saveDb();

    const lastId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];

    res.status(201).json({
      id: lastId,
      name,
      message,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("POST /messages error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "notyet-guestbook" });
});

// ============ START ============

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Guestbook API running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Guestbook API running on port ${PORT}`);
});
