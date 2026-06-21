const { Ratelimit } = require("@upstash/ratelimit");
const redis = require("./redisSetup.service.js");

const tradeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "5 s"),
  analytics: true,
});

module.exports = {
  tradeLimiter,
};