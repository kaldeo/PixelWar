function sendJson(res, status, data) {
    res.set('Cache-Control', 'no-store');
    res.status(status).json(data);
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1_000_000) {
            req.destroy();
            reject(new Error('Payload too large'));
        }
        });
        req.on('end', () => {
        if (!body) {
            resolve(null);
            return;
        }
        try {
            resolve(JSON.parse(body));
        } catch (err) {
            reject(err);
        }
        });
        req.on('error', reject);
    });
}

module.exports = {
sendJson,
readJson
};
