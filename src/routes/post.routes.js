const { readJson, sendJson } = require("../utils/http");

function registerPostRoutes(router, store) {
  router.post("/pixel", async (req, res) => {
    try {
      const body = await readJson(req);
      if (!body) return sendJson(res, 400, { error: "missing_body" });

      const { x, y, color, username } = body;


      if (!username || username.trim().length < 2) {
        return sendJson(res, 400, { error: "pseudo_invalid" });
      }
      if (
        !Number.isInteger(x) ||
        !Number.isInteger(y) ||
        x < 0 ||
        x >= store.size ||
        y < 0 ||
        y >= store.size
      ) {
        return sendJson(res, 400, { error: "invalid_coords" });
      }

      await store.setPixel(x, y, color, username);
      sendJson(res, 200, { ok: true });
    } catch (err) {
      if (err.status === 429) {
        return sendJson(res, 429, { error: "cooldown_active" });
      }
      console.error(err);
      sendJson(res, 500, { error: "server_error" });
    }
  });

  router.post("/reset", async (req, res) => {
    try {
      await store.reset();
      sendJson(res, 200, { ok: true });
    } catch (err) {
      sendJson(res, 500, { error: "server_error" });
    }
  });
}

module.exports = { registerPostRoutes };
