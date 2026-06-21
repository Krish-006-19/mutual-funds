const { tradeLimiter } = require("../service/rateLimit.service.js");

async function tradeRateLimit(req, res, next) {
  const { success } = await tradeLimiter.limit(
    `trade:${req.user.userId}`
  );

  if (!success) {
    return res.status(429).json({
      message: "Too many trade requests",
    });
  }

  next();
}

module.exports = tradeRateLimit;