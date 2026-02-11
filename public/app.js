const gridEl = document.getElementById('grid');
const statusEl = document.getElementById('status');
const colorInput = document.getElementById('color');
const resetBtn = document.getElementById('reset');

const POLL_MS = 1000;
let isPainting = false;
let lastGrid = null;
let size = 50;
let cells = [];

function setStatus(text) {
  statusEl.textContent = text;
}

function buildGrid(nextSize) {
  size = nextSize;
  gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
  gridEl.innerHTML = '';
  cells = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      gridEl.appendChild(cell);
      cells.push(cell);
    }
  }
}

function indexFor(x, y) {
  return y * size + x;
}

function setCellColor(x, y, color) {
  const idx = indexFor(x, y);
  const cell = cells[idx];
  if (cell) {
    cell.style.background = color;
  }
}

function applyGrid(grid) {
  if (!grid || !Array.isArray(grid)) {
    return;
  }

  if (!lastGrid) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        setCellColor(x, y, grid[y][x]);
      }
    }
  } else {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (grid[y][x] !== lastGrid[y][x]) {
          setCellColor(x, y, grid[y][x]);
        }
      }
    }
  }

  lastGrid = grid.map((row) => row.slice());
}

async function fetchGrid() {
  try {
    const res = await fetch('/grid', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('bad_response');
    }
    const data = await res.json();
    if (!data || !data.grid) {
      throw new Error('bad_payload');
    }

    if (data.size && data.size !== size) {
      buildGrid(data.size);
    }

    applyGrid(data.grid);
    setStatus(`Maj: ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    setStatus('Erreur de connexion');
  }
}

async function paintCell(x, y) {
  const color = colorInput.value;
  setCellColor(x, y, color);

  try {
    const res = await fetch('/pixel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y, color }),
      keepalive: true
    });
    if (!res.ok) {
      throw new Error('bad_response');
    }
  } catch (err) {
    setStatus('Echec envoi pixel');
    await fetchGrid();
  }
}

function handlePaint(target) {
  if (!target || !target.classList.contains('cell')) {
    return;
  }
  const x = Number(target.dataset.x);
  const y = Number(target.dataset.y);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return;
  }
  paintCell(x, y);
}

gridEl.addEventListener('pointerdown', (event) => {
  isPainting = true;
  gridEl.setPointerCapture(event.pointerId);
  handlePaint(event.target);
});

gridEl.addEventListener('pointerover', (event) => {
  if (!isPainting) {
    return;
  }
  handlePaint(event.target);
});

gridEl.addEventListener('pointerup', () => {
  isPainting = false;
});

gridEl.addEventListener('pointerleave', () => {
  isPainting = false;
});

resetBtn.addEventListener('click', async () => {
  try {
    await fetch('/reset', { method: 'POST' });
    await fetchGrid();
  } catch (err) {
    setStatus('Echec reset');
  }
});

buildGrid(size);
fetchGrid();
setInterval(fetchGrid, POLL_MS);
