// ============================================
// Guestbook frontend
// Talks to your deployed guestbook API
// ============================================

// *** UPDATE THIS to your deployed API URL ***
const GUESTBOOK_API = "http://localhost:3000";

const form      = document.getElementById("guestbook-form");
const nameInput = document.getElementById("gb-name");
const msgInput  = document.getElementById("gb-message");
const status    = document.getElementById("gb-status");
const container = document.getElementById("guestbook-messages");
const pagination = document.getElementById("gb-pagination");
const msgCount  = document.getElementById("msg-count");

let currentPage = 1;

// ---- Fetch & render messages ----

async function loadMessages(page = 1) {
  currentPage = page;
  container.innerHTML = '<p class="gb-loading">Loading messages...</p>';

  try {
    const res = await fetch(`${GUESTBOOK_API}/messages?page=${page}&limit=20`);
    if (!res.ok) throw new Error("Failed to load");
    const data = await res.json();

    if (msgCount) msgCount.textContent = data.total;

    if (data.messages.length === 0) {
      container.innerHTML =
        '<p class="gb-empty">No messages yet. Be the first to sign!</p>';
      pagination.innerHTML = "";
      return;
    }

    container.innerHTML = data.messages
      .map((m) => {
        const date = new Date(m.created_at + "Z").toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
        return `
          <div class="gb-entry">
            <div class="gb-entry-header">
              <span class="gb-entry-name">${escapeHtml(m.name)}</span>
              <span class="gb-entry-date">${date}</span>
            </div>
            <p class="gb-entry-body">${escapeHtml(m.message)}</p>
          </div>`;
      })
      .join("");

    // Pagination
    if (data.pages > 1) {
      let html = "";
      if (page > 1)
        html += `<button onclick="loadMessages(${page - 1})">&larr; Newer</button>`;
      html += `<span class="gb-page-info">page ${page} of ${data.pages}</span>`;
      if (page < data.pages)
        html += `<button onclick="loadMessages(${page + 1})">Older &rarr;</button>`;
      pagination.innerHTML = html;
    } else {
      pagination.innerHTML = "";
    }
  } catch (err) {
    container.innerHTML =
      '<p class="gb-error">Could not load messages. The API may be offline.</p>';
    if (msgCount) msgCount.textContent = "?";
  }
}

// ---- Submit message ----

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const message = msgInput.value.trim();

    if (!name || !message) return;

    status.textContent = "Sending...";
    status.className = "gb-status";

    try {
      const res = await fetch(`${GUESTBOOK_API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }

      status.textContent = "Thanks for signing!";
      status.classList.add("gb-status-ok");
      nameInput.value = "";
      msgInput.value = "";

      // Reload first page to show the new message
      loadMessages(1);

      setTimeout(() => {
        status.textContent = "";
        status.className = "gb-status";
      }, 4000);
    } catch (err) {
      status.textContent = err.message || "Something went wrong.";
      status.classList.add("gb-status-err");
      setTimeout(() => {
        status.textContent = "";
        status.className = "gb-status";
      }, 5000);
    }
  });
}

// ---- Utility ----

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---- Init ----
loadMessages(1);
