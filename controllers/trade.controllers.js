const trade = require("../models/trade.models.js");
const redis = require("../service/redisSetup.service.js");
async function getAllTrades(req, res) {
  try {
    const key = `trades:${req.user.userId}`;
    const cachedTrades = await redis.get(key);
    if (cachedTrades) {
      return res.json(
        typeof cachedTrades === "string"
          ? JSON.parse(cachedTrades)
          : cachedTrades,
      );
    }
    const trades = await trade
      .find({ userId: req.user.userId })
      .select("-__v -userId")
      .sort({ createdAt: -1 })
      .lean();
    if (!trades || trades.length === 0) {
      return res.status(404).json({ error: "No trades found" });
    }
    await redis.set(key, trades);
    res.json(trades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getAllTrades
};
