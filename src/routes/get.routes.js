const { sendJson } = require('../utils/http');

function registerGetRoutes(router, store) {
    router.get('/health', (req, res) => {
    sendJson(res, 200, { ok: true });
    });

    router.get('/grid', async (req, res) => {
    try {
        const board = await store.getBoard();
        sendJson(res, 200, board);
    } catch (err) {
        sendJson(res, 500, { error: 'server_error' });
    }
    });
}

module.exports = {
    registerGetRoutes
};
