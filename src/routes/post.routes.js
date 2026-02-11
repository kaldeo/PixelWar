const { readJson, sendJson } = require('../utils/http');

function registerPostRoutes(router, store) {
    router.post('/pixel', async (req, res) => {
    try {
        const body = await readJson(req);
        if (!body) {
        sendJson(res, 400, { error: 'missing_body' });
        return;
        }

        const { x, y, color } = body;
        if (!Number.isInteger(x) || !Number.isInteger(y)) {
        sendJson(res, 400, { error: 'invalid_coords' });
        return;
        }
        if (x < 0 || x >= store.size || y < 0 || y >= store.size) {
        sendJson(res, 400, { error: 'out_of_bounds' });
        return;
        }
        if (typeof color !== 'string' || color.length === 0) {
        sendJson(res, 400, { error: 'invalid_color' });
        return;
        }

        await store.setPixel(x, y, color);
        sendJson(res, 200, { ok: true });
    } catch (err) {
        sendJson(res, 500, { error: 'server_error' });
    }
    });

    router.post('/reset', async (req, res) => {
    try {
        await store.reset();
        sendJson(res, 200, { ok: true });
    } catch (err) {
        sendJson(res, 500, { error: 'server_error' });
    }
    });
}

module.exports = {
    registerPostRoutes
};
