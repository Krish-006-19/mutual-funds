const { getLatestFunds } = require("../service/LatestNav.service");
const Sip = require("../models/sip.models.js");
const redis = require("../service/redisSetup.service.js");
async function getSipData(req, res) {
    const schemeCode = req.params.schemeCode;
  try {
    const key = `sipData:${req.user.userId}:${schemeCode}`;
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    const data = await Sip.findOne({
      userId: req.user.userId,
      schemeCode,
    });
    if (!data) {
      return res.status(404).json({ message: "No SIP data found for the given scheme code" });
    }
    await redis.set(key, data);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getSipData,
};
