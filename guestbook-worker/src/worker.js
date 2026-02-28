// ============================================
// notyet guestbook — Cloudflare Worker + D1
// ============================================

const ALLOWED_ORIGINS = [
  "https://notyet.neocities.org",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://0.0.0.0:8080",
];

// ---- CORS helpers ----

function getCorsOrigin(request) {
  const origin = request.headers.get("Origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

function corsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": getCorsOrigin(request),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
    },
  });
}

// ---- Rate limiting (simple in-memory, per-worker-isolate) ----

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// ---- Sanitize ----

function sanitize(str, maxLen) {
  return str.toString().trim().slice(0, maxLen).replace(/<[^>]*>/g, "");
}

// ---- Routes ----

async function handleCounter(request, db) {
  // Atomically increment and return the count
  await db
    .prepare("UPDATE page_views SET count = count + 1 WHERE id = 1")
    .run();

  const row = await db
    .prepare("SELECT count FROM page_views WHERE id = 1")
    .first();

  return json({ count: row ? row.count : 0 }, 200, request);
}

async function handleGet(request, db) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit")) || 50, 1), 100);
  const page = Math.max(parseInt(url.searchParams.get("page")) || 1, 1);
  const offset = (page - 1) * limit;

  const { results: messages } = await db
    .prepare(
      "SELECT id, name, message, created_at FROM messages WHERE visible = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?"
    )
    .bind(limit, offset)
    .all();

  const countRow = await db
    .prepare("SELECT COUNT(*) AS total FROM messages WHERE visible = 1")
    .first();

  const total = countRow.total;

  return json(
    { messages, total, page, pages: Math.ceil(total / limit) },
    200,
    request
  );
}

async function handlePost(request, db) {
  // Rate limit by IP
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  if (isRateLimited(ip)) {
    return json({ error: "Too many messages. Try again later." }, 429, request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400, request);
  }

  let { name, message } = body;

  if (!name || !message) {
    return json({ error: "Name and message are required." }, 400, request);
  }

  name = sanitize(name, 40);
  message = sanitize(message, 500);

  if (name.length === 0 || message.length === 0) {
    return json({ error: "Name and message cannot be empty." }, 400, request);
  }

  const result = await db
    .prepare("INSERT INTO messages (name, message) VALUES (?, ?)")
    .bind(name, message)
    .run();

  return json(
    {
      id: result.meta.last_row_id,
      name,
      message,
      created_at: new Date().toISOString(),
    },
    201,
    request
  );
}

// ---- Main fetch handler ----

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    try {
      // Health check
      if (pathname === "/" && request.method === "GET") {
        return json({ status: "ok", service: "notyet-guestbook" }, 200, request);
      }

      // GET /counter
      if (pathname === "/counter" && request.method === "GET") {
        return await handleCounter(request, env.DB);
      }

      // GET /messages
      if (pathname === "/messages" && request.method === "GET") {
        return await handleGet(request, env.DB);
      }

      // POST /messages
      if (pathname === "/messages" && request.method === "POST") {
        return await handlePost(request, env.DB);
      }

      return json({ error: "Not found" }, 404, request);
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal server error" }, 500, request);
    }
  },
};
