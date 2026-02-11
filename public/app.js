const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");
const colorInput = document.getElementById("color");
const usernameInput = document.getElementById("username");
const resetBtn = document.getElementById("reset");
const cooldownBar = document.getElementById("cooldown-bar");

const POLL_MS = 1000;
let isPainting = false;
let lastGrid = null;
let size = 50;
let cells = [];
let onCooldown = false;

usernameInput.value = localStorage.getItem("pixel-war-user") || "";

usernameInput.addEventListener("input", () => {
  localStorage.setItem("pixel-war-user", usernameInput.value.trim());
});

function setStatus(text, isWarning = false) {
  statusEl.textContent = text;
  statusEl.className = isWarning ? "status warning" : "status";
}

function buildGrid(nextSize) {
  size = nextSize;
  gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gridEl.innerHTML = "";
  cells = [];
  for (let i = 0; i < size * size; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.x = i % size;
    cell.dataset.y = Math.floor(i / size);
    gridEl.appendChild(cell);
    cells.push(cell);
  }
}

function setCellColor(x, y, color) {
  const cell = cells[y * size + x];
  if (cell) cell.style.background = color;
}

function applyGrid(grid) {
  if (!grid) return;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!lastGrid || grid[y][x] !== lastGrid[y][x]) {
        setCellColor(x, y, grid[y][x]);
      }
    }
  }
  lastGrid = grid.map((row) => [...row]);
}

async function fetchGrid() {
  try {
    const res = await fetch("/grid");
    const data = await res.json();
    if (data.size !== size) buildGrid(data.size);
    applyGrid(data.grid);
    if (!onCooldown)
      setStatus(`Dernière màj : ${new Date().toLocaleTimeString()}`);
  } catch (e) {
    setStatus("Erreur réseau", true);
  }
}

async function paintCell(x, y) {
  if (onCooldown) return;
  const username = usernameInput.value.trim();
  if (!username) {
    setStatus("⚠️ Pseudo requis !", true);
    usernameInput.focus();
    return;
  }

  try {
    const res = await fetch("/pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y, color: colorInput.value, username }),
    });

    if (res.status === 429) return triggerCooldown(3000);
    if (!res.ok) throw new Error();

    setCellColor(x, y, colorInput.value);
    triggerCooldown(3000);
  } catch (e) {
    setStatus("Échec envoi", true);
  }
}

function triggerCooldown(ms) {
  onCooldown = true;
  gridEl.classList.add("locked");
  const start = Date.now();
  const timer = setInterval(() => {
    const remaining = ms - (Date.now() - start);
    if (cooldownBar) cooldownBar.style.width = `${(remaining / ms) * 100}%`;
    setStatus(`Recharge : ${(remaining / 1000).toFixed(1)}s`);

    if (remaining <= 0) {
      clearInterval(timer);
      onCooldown = false;
      gridEl.classList.remove("locked");
      if (cooldownBar) cooldownBar.style.width = "0%";
      setStatus("Prêt !");
    }
  }, 50);
}

gridEl.addEventListener("pointerdown", (e) => {
  isPainting = true;
  handlePaint(e.target);
});
gridEl.addEventListener("pointerover", (e) => {
  if (isPainting) handlePaint(e.target);
});
window.addEventListener("pointerup", () => (isPainting = false));

function handlePaint(target) {
  if (target.classList.contains("cell")) {
    paintCell(Number(target.dataset.x), Number(target.dataset.y));
  }
}

resetBtn.addEventListener("click", () =>
  fetch("/reset", { method: "POST" }).then(fetchGrid),
);

buildGrid(size);
fetchGrid();
setInterval(fetchGrid, POLL_MS);
