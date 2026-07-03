/**
 * Leaderboard Module
 * Manages per-game top-10 leaderboards.
 * Uses Vercel API + Upstash Redis when deployed, falls back to localStorage for local dev.
 * Caches fetched boards to minimize API round trips.
 */

const API_BASE = "/api/leaderboard";
const LEADERBOARD_SIZE = 10;
const CACHE_TTL_MS = 10000; // 10 second cache

// ─── In-memory cache ─────────────────────────────────────
const boardCache = {};

function getCachedBoard(gameKey) {
  const entry = boardCache[gameKey];
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedBoard(gameKey, data) {
  boardCache[gameKey] = { data, ts: Date.now() };
}

// ─── Local storage fallback ─────────────────────────────
const STORAGE_KEYS = {
  snake: "leaderboard_snake",
  tetris: "leaderboard_tetris",
  breakout: "leaderboard_breakout",
};

function getLocalLeaderboard(gameKey) {
  const key = STORAGE_KEYS[gameKey];
  if (!key) return [];
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(data)) return data;
  } catch (e) {}
  return [];
}

function saveLocalLeaderboard(gameKey, board) {
  const key = STORAGE_KEYS[gameKey];
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(board));
}

function addToLocalLeaderboard(gameKey, name, score) {
  const board = getLocalLeaderboard(gameKey);
  board.push({ name: name.toUpperCase(), score });
  board.sort((a, b) => b.score - a.score);
  if (board.length > LEADERBOARD_SIZE) board.length = LEADERBOARD_SIZE;
  saveLocalLeaderboard(gameKey, board);
  return board;
}

// ─── API functions ───────────────────────────────────────

async function fetchBoard(gameKey) {
  // Check cache first
  const cached = getCachedBoard(gameKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}?game=${gameKey}`);
    if (res.ok) {
      const data = await res.json();
      saveLocalLeaderboard(gameKey, data);
      setCachedBoard(gameKey, data);
      return data;
    }
  } catch (e) {}
  return getLocalLeaderboard(gameKey);
}

async function postScore(gameKey, name, score) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: gameKey, name, score }),
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalLeaderboard(gameKey, data);
      setCachedBoard(gameKey, data);
      return data;
    }
  } catch (e) {}
  return addToLocalLeaderboard(gameKey, name, score);
}

// ─── Public API ──────────────────────────────────────────

function qualifiesForBoard(board, score) {
  if (score <= 0) return false;
  if (board.length < LEADERBOARD_SIZE) return true;
  return score > board[board.length - 1].score;
}

function getRank(board, score) {
  if (score <= 0) return -1;
  for (let i = 0; i < board.length; i++) {
    if (score > board[i].score) return i + 1;
  }
  if (board.length < LEADERBOARD_SIZE) return board.length + 1;
  return -1;
}

// ─── Overlay UI ──────────────────────────────────────────

let overlayEl = null;

function createOverlayElement() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.id = "leaderboard-overlay";
  overlayEl.innerHTML = `
    <div class="lb-panel">
      <div class="lb-title">HIGH SCORES</div>
      <div class="lb-subtitle"></div>
      <div class="lb-table-wrap">
        <table class="lb-table">
          <thead><tr><th>#</th><th>NAME</th><th>SCORE</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="lb-entry" style="display:none;">
        <div class="lb-entry-title">NEW HIGH SCORE!</div>
        <div class="lb-entry-score"></div>
        <div class="lb-entry-prompt">ENTER YOUR INITIALS</div>
        <div class="lb-input-wrap">
          <input class="lb-input" maxlength="3" autocomplete="off" spellcheck="false" />
        </div>
        <button class="lb-submit">OK</button>
      </div>
      <div class="lb-footer">
        <button class="lb-close">BACK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlayEl);
  return overlayEl;
}

const GAME_NAMES = { snake: "SNAKE", tetris: "TETRIS", breakout: "BREAK OUT" };

function populateTable(el, board, highlightRank, pendingScore) {
  const tbody = el.querySelector(".lb-table tbody");
  tbody.innerHTML = "";

  const entries = [...board];
  if (highlightRank > 0 && pendingScore !== undefined) {
    entries.splice(highlightRank - 1, 0, { name: "???", score: pendingScore, pending: true });
    if (entries.length > LEADERBOARD_SIZE) entries.length = LEADERBOARD_SIZE;
  }

  if (entries.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" class="lb-empty">NO SCORES YET</td>`;
    tbody.appendChild(tr);
    return;
  }

  entries.forEach((entry, i) => {
    const tr = document.createElement("tr");
    if (entry.pending) tr.classList.add("lb-highlight");
    tr.innerHTML = `
      <td class="lb-rank">${String(i + 1).padStart(2, "0")}</td>
      <td class="lb-name">${entry.name}</td>
      <td class="lb-score">${entry.score}</td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Show leaderboard (view-only). Single API fetch.
 */
async function showLeaderboard(gameKey, onClose) {
  const el = createOverlayElement();
  el.querySelector(".lb-subtitle").textContent = GAME_NAMES[gameKey] || gameKey.toUpperCase();
  el.querySelector(".lb-entry").style.display = "none";

  const board = await fetchBoard(gameKey);
  populateTable(el, board);
  el.style.display = "flex";

  const closeBtn = el.querySelector(".lb-close");
  const closeHandler = () => {
    el.style.display = "none";
    closeBtn.removeEventListener("click", closeHandler);
    if (onClose) onClose();
  };
  closeBtn.addEventListener("click", closeHandler);
}

/**
 * Called on game over. Single fetch to check + display.
 * Only one API call (GET) upfront, one more (POST) on submit.
 */
async function handleGameOver(gameKey, score, onDone) {
  const board = await fetchBoard(gameKey);

  if (!qualifiesForBoard(board, score)) {
    if (onDone) onDone(board);
    return;
  }

  const el = createOverlayElement();
  const rank = getRank(board, score);
  el.querySelector(".lb-subtitle").textContent = GAME_NAMES[gameKey] || gameKey.toUpperCase();

  const entrySection = el.querySelector(".lb-entry");
  entrySection.style.display = "flex";
  el.querySelector(".lb-entry-score").textContent = score;

  const input = el.querySelector(".lb-input");
  input.value = "";
  const inputHandler = () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z]/g, "");
  };
  input.addEventListener("input", inputHandler);

  populateTable(el, board, rank, score);
  el.style.display = "flex";
  requestAnimationFrame(() => input.focus());

  const submitBtn = el.querySelector(".lb-submit");
  const closeBtn = el.querySelector(".lb-close");

  const cleanup = () => {
    submitBtn.removeEventListener("click", submitHandler);
    closeBtn.removeEventListener("click", closeHandler);
    input.removeEventListener("input", inputHandler);
    input.removeEventListener("keydown", keyHandler);
  };

  const doSubmit = async () => {
    let name = input.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (name.length === 0) name = "AAA";
    while (name.length < 3) name += "_";

    submitBtn.disabled = true;
    submitBtn.textContent = "...";

    const updatedBoard = await postScore(gameKey, name, score);
    populateTable(el, updatedBoard);
    entrySection.style.display = "none";

    submitBtn.disabled = false;
    submitBtn.textContent = "OK";
    cleanup();

    const viewCloseHandler = () => {
      el.style.display = "none";
      closeBtn.removeEventListener("click", viewCloseHandler);
      if (onDone) onDone(updatedBoard);
    };
    closeBtn.addEventListener("click", viewCloseHandler);
  };

  const submitHandler = () => doSubmit();
  const keyHandler = (e) => {
    if (e.key === "Enter") { e.preventDefault(); doSubmit(); }
    e.stopPropagation();
  };
  const closeHandler = () => {
    el.style.display = "none";
    cleanup();
    if (onDone) onDone(board);
  };

  submitBtn.addEventListener("click", submitHandler);
  closeBtn.addEventListener("click", closeHandler);
  input.addEventListener("keydown", keyHandler);
}

export { showLeaderboard, handleGameOver };
