const { CoreRoute } = require("coreroute");
const { MongoClient } = require("mongodb");
const { createBoardStore } = require("./store/boardStore");
const { registerGetRoutes } = require("./routes/get.routes");
const { registerPostRoutes } = require("./routes/post.routes");

const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.MONGO_DB || "pixelwar";
const SIZE = 50;

const router = new CoreRoute();
router.serveStaticFiles("./public");

async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  // On définit les deux collections
  const boardCol = db.collection("boards");
  const userCol = db.collection("users");

  // Indexation pour la performance du cooldown
  await userCol.createIndex({ username: 1 }, { unique: true });

  // ON PASSE LES DEUX COLLECTIONS ICI
  const store = createBoardStore(boardCol, userCol, SIZE);
  await store.ensureBoard();

  registerGetRoutes(router, store);
  registerPostRoutes(router, store);

  router.listen(PORT);
  console.log(`🚀 Serveur Pixel War lancé sur le port ${PORT}`);
}

start().catch(console.error);
