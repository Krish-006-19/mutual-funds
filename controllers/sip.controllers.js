const { getLatestFunds } = require("../service/LatestNav.service");
const Sip = require("../models/sip.models.js");

async function getSipData(req, res) {
    const schemeCode = req.params.schemeCode;
  try {
    const data = await Sip.findOne({
      userId: req.user.userId,
      schemeCode,
    });
    if (!data) {
      return res.status(404).json({ message: "No SIP data found for the given scheme code" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getSipData,
};