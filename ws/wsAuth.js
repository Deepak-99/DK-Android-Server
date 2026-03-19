const jwt = require("jsonwebtoken");

function verifyWS(req) {
    try {
        const token =
            req.headers["sec-websocket-protocol"] ||
            new URL(req.url, "http://localhost")
                .searchParams.get("token");

        if (!token) return null;

        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

module.exports = { verifyWS };
