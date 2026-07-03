/**
 * Leaderboard Module
 * Manages per-game top-10 leaderboards.
 * Uses Vercel KV API when deployed, falls back to localStorage for local dev.
 * Provides an arcade-style overlay for name entry and leaderboard display.
 */

const API_BASE = "/api/leaderboard";
const LEADERBOARD_SIZE = 10;

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
  } catch (e) {
    // corrupted data
  }
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
  if (board.length > LEADERBOARD_SIZE) {
    board.length = LEADERBOARD_SIZE;
  }
  saveLocalLeaderboard(gameKey, board);
  return board;
}

// ─── API-backed functions (with local fallback) ──────────

/**
 * Get the leaderboard for a given game.
 * Tries the API first, falls back to localStorage.
 */
async function getLeaderboard(gameKey) {
  try {
    const res = await fetch(`${API_BASE}?game=${gameKey}`);
    if (res.ok) {
      const data = await res.json();
      // Cache locally
      saveLocalLeaderboard(gameKey, data);
      return data;
    }
  } catch (e) {
    // API unavailable (local dev), use localStorage
  }
  return getLocalLeaderboard(gameKey);
}

/**
 * Add a score to the leaderboard.
 * Tries the API first, falls back to localStorage.
 */
async function addToLeaderboard(gameKey, name, score) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: gameKey, name, score }),
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalLeaderboard(gameKey, data);
      return data;
    }
  } catch (e) {
    // API unavailable, use localStorage
  }
  return addToLocalLeaderboard(gameKey, name, score);
}

/**
 * Check if a score qualifies for the leaderboard.
 */
async function qualifiesForLeaderboard(gameKey, score) {
  if (score <= 0) return false;
  const board = await getLeaderboard(gameKey);
  if (board.length < LEADERBOARD_SIZE) return true;
  return score > board[board.length - 1].score;
}

/**
 * Find the rank a score would receive (1-indexed), or -1 if it doesn't qualify.
 */
function getRank(board, score) {
  if (score <= 0) return -1;
  for (let i = 0; i < board.length; i++) {
    if (score > board[i].score) return i + 1;
  }
  if (board.length < LEADERBOARD_SIZE) return board.length + 1;
  return -1;
}

// ─── Overlay UI ────────────────────────────────────────────

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
          <thead>
            <tr><th>#</th><th>NAME</th><th>SCORE</th></tr>
          </thead>
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

const GAME_DISPLAY_NAMES = {
  snake: "SNAKE",
  tetris: "TETRIS",
  breakout: "BREAK OUT",
};

/**
 * Show the leaderboard overlay (view-only mode).
 * @param {string} gameKey
 * @param {Function} [onClose] - callback when user closes
 */
async function showLeaderboard(gameKey, onClose) {
  const el = createOverlayElement();
  const board = await getLeaderboard(gameKey);

  el.querySelector(".lb-subtitle").textContent =
    GAME_DISPLAY_NAMES[gameKey] || gameKey.toUpperCase();

  // hide entry section
  el.querySelector(".lb-entry").style.display = "none";

  populateTable(el, board);

  el.style.display = "flex";

  // Close handler
  const closeBtn = el.querySelector(".lb-close");
  const closeHandler = () => {
    el.style.display = "none";
    closeBtn.removeEventListener("click", closeHandler);
    if (onClose) onClose();
  };
  closeBtn.addEventListener("click", closeHandler);
}

/**
 * Show the leaderboard with name-entry mode (when player sets a new high score).
 * @param {string} gameKey
 * @param {number} score
 * @param {Function} onDone - called with the updated board after entry
 */
async function showLeaderboardEntry(gameKey, score, onDone) {
  const el = createOverlayElement();
  const board = await getLeaderboard(gameKey);
  const rank = getRank(board, score);

  el.querySelector(".lb-subtitle").textContent =
    GAME_DISPLAY_NAMES[gameKey] || gameKey.toUpperCase();

  // Show entry section
  const entrySection = el.querySelector(".lb-entry");
  entrySection.style.display = "flex";

  el.querySelector(".lb-entry-score").textContent = score;

  const input = el.querySelector(".lb-input");
  input.value = "";

  // Force uppercase and filter to letters only
  const inputHandler = () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z]/g, "");
  };
  input.addEventListener("input", inputHandler);

  populateTable(el, board, rank, score);

  el.style.display = "flex";

  // Use requestAnimationFrame to ensure overlay is visible before focusing
  requestAnimationFrame(() => {
    input.focus();
  });

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

    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.textContent = "...";

    const updatedBoard = await addToLeaderboard(gameKey, name, score);
    populateTable(el, updatedBoard);
    entrySection.style.display = "none";

    submitBtn.disabled = false;
    submitBtn.textContent = "OK";
    cleanup();

    // Re-bind close for view mode
    const viewCloseHandler = () => {
      el.style.display = "none";
      closeBtn.removeEventListener("click", viewCloseHandler);
      if (onDone) onDone(updatedBoard);
    };
    closeBtn.addEventListener("click", viewCloseHandler);
  };

  const submitHandler = () => doSubmit();

  const keyHandler = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSubmit();
    }
    // Stop game keys from propagating
    e.stopPropagation();
  };

  const closeHandler = () => {
    // Close without saving
    el.style.display = "none";
    cleanup();
    if (onDone) onDone(board);
  };

  submitBtn.addEventListener("click", submitHandler);
  closeBtn.addEventListener("click", closeHandler);
  input.addEventListener("keydown", keyHandler);
}

/**
 * Populate the scores table.
 * @param {HTMLElement} el - overlay element
 * @param {Array} board - the leaderboard data
 * @param {number} [highlightRank] - rank to highlight (1-indexed) for a new entry
 * @param {number} [pendingScore] - the score being entered
 */
function populateTable(el, board, highlightRank, pendingScore) {
  const tbody = el.querySelector(".lb-table tbody");
  tbody.innerHTML = "";

  // Build display entries — insert a pending entry at the highlight rank if provided
  const displayEntries = [...board];
  if (
    highlightRank &&
    highlightRank > 0 &&
    pendingScore !== undefined
  ) {
    displayEntries.splice(highlightRank - 1, 0, {
      name: "???",
      score: pendingScore,
      pending: true,
    });
    if (displayEntries.length > LEADERBOARD_SIZE) {
      displayEntries.length = LEADERBOARD_SIZE;
    }
  }

  if (displayEntries.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3" class="lb-empty">NO SCORES YET</td>`;
    tbody.appendChild(tr);
    return;
  }

  displayEntries.forEach((entry, i) => {
    const tr = document.createElement("tr");
    if (entry.pending) {
      tr.classList.add("lb-highlight");
    }
    tr.innerHTML = `
      <td class="lb-rank">${String(i + 1).padStart(2, "0")}</td>
      <td class="lb-name">${entry.name}</td>
      <td class="lb-score">${entry.score}</td>
    `;
    tbody.appendChild(tr);
  });
}

export {
  getLeaderboard,
  qualifiesForLeaderboard,
  addToLeaderboard,
  showLeaderboard,
  showLeaderboardEntry,
};
