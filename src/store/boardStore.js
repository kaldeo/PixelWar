function createEmptyGrid(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "#000000"),
  );
}

function createBoardStore(collection, userCollection, size) {
  const boardId = "default";

  return {
    size,
    async ensureBoard() {
      const existing = await collection.findOne({ _id: boardId });
      if (!existing)
        await collection.insertOne({
          _id: boardId,
          size,
          grid: createEmptyGrid(size),
        });
    },
    async getBoard() {
      return await collection.findOne({ _id: boardId });
    },
    async setPixel(x, y, color, username) {
      const now = new Date();
      const minDate = new Date(now - 3000);

      const userUpdate = await userCollection.findOneAndUpdate(
        {
          username: username,
          $or: [
            { lastPixelAt: { $lte: minDate } },
            { lastPixelAt: { $exists: false } },
          ],
        },
        { $set: { lastPixelAt: now } },
        { upsert: true, returnDocument: "after" },
      );

      if (!userUpdate) {
        const err = new Error("Cooldown actif");
        err.status = 429;
        throw err;
      }


      await collection.updateOne(
        { _id: boardId },
        { $set: { [`grid.${y}.${x}`]: color } },
      );
    },
    async reset() {
      await collection.updateOne(
        { _id: boardId },
        { $set: { grid: createEmptyGrid(size) } },
      );
    },
  };
}

module.exports = { createBoardStore };
