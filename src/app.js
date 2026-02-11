const { CoreRoute } = require('coreroute');
const { MongoClient } = require('mongodb');
const { createBoardStore } = require('./store/boardStore');
const { registerGetRoutes } = require('./routes/get.routes');
const { registerPostRoutes } = require('./routes/post.routes');

const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGO_DB || 'pixelwar';
const COLLECTION = 'boards';
const SIZE = 50;

const router = new CoreRoute();
router.serveStaticFiles('./public');

async function start() {
	const client = new MongoClient(MONGO_URI);
	await client.connect();
	const db = client.db(DB_NAME);
	const collection = db.collection(COLLECTION);
	const store = createBoardStore(collection, SIZE);
	await store.ensureBoard();

	registerGetRoutes(router, store);
	registerPostRoutes(router, store);

	router.listen(PORT);
	console.log(`Server listening on port ${PORT}`);
	console.log(`MongoDB: ${DB_NAME}/${COLLECTION}`);
}

start().catch((err) => {
	console.error('Failed to start server', err);
	process.exit(1);
});