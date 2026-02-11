function createEmptyGrid(size) {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => '#000000'));
}

function createBoardStore(collection, size) {
const boardId = 'default';

async function ensureBoard() {
const existing = await collection.findOne({ _id: boardId });
if (!existing || !Array.isArray(existing.grid) || existing.grid.length !== size) {
    await collection.replaceOne(
    { _id: boardId },
    { _id: boardId, size, grid: createEmptyGrid(size) },
    { upsert: true }
    );
}
}

async function getBoard() {
const board = await collection.findOne(
    { _id: boardId },
    { projection: { _id: 0 } }
);

if (!board || !Array.isArray(board.grid)) {
    await ensureBoard();
    const fresh = await collection.findOne(
    { _id: boardId },
    { projection: { _id: 0 } }
    );
    return fresh;
}

return board;
}

async function setPixel(x, y, color) {
await ensureBoard();
const path = `grid.${y}.${x}`;
await collection.updateOne(
    { _id: boardId },
    { $set: { [path]: color } }
);
}

async function reset() {
await collection.replaceOne(
    { _id: boardId },
    { _id: boardId, size, grid: createEmptyGrid(size) },
    { upsert: true }
);
}

return {
    size,
    ensureBoard,
    getBoard,
    setPixel,
    reset
};
}

module.exports = {
createBoardStore
};
