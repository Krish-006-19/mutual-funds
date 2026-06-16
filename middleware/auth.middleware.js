const {sign, verify} = require("jsonwebtoken")

function createToken(user) {
    const accessToken = sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "1h"})
    return accessToken
}

function verifyToken(req, res, next) {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }
    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid token." });
    }
}

module.exports = {
    createToken,
    verifyToken
}