const History = require("../models/api_History_Fetch.models");
const { updateAllFunds } = require("../service/cronfunctionality.service.js");
const redis = require("../service/redisSetup.service.js");
const { getLatestFunds } = require("../service/LatestNav.service.js");
const convertDate = require("../utils/dateConverter.util.js");

async function getT50(req, res) {
  try {
    const fundData = await getLatestFunds();
    if (!fundData || fundData.length === 0) {
      return res.status(500).json({ error: "Failed to fetch fund data" });
    }
    res.json(fundData);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
}
async function getFundBySchemeCode(req, res) {
  try {
    const key = `fund:${req.params.schemeCode}`;
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.json(cachedData);
    }
    const fundData = await getLatestFunds();
    const fund = fundData.find(
      (f) => f["Scheme Code"] == req.params.schemeCode,
    );

    if (!fund) {
      return res.status(404).json({ error: "Scheme not found" });
    }
    await redis.set(key, fund, {
      ex: 21600,
    });
    res.json(fund);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

async function getFundHistory(req, res) {
  try {
    const key = `fund_history:${req.params.schemeCode}`;
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.json(cachedData);
    }
    let val = await History.findOne({
      schemeCode: req.params.schemeCode,
    }).lean();

    const fundData = await getLatestFunds();
    const fund = fundData.find(
      (f) => f["Scheme Code"] == req.params.schemeCode,
    );

    if (!fund) {
      return res.status(404).json({
        error: "Scheme not found",
      });
    }
    if (!val) {
      return res
        .status(404)
        .json({ error: "No history found for this scheme" });
    }

    if (convertDate(fund) !== val.data[0].date) {
      await updateAllFunds();
      val = await History.findOne({
        schemeCode: req.params.schemeCode,
      }).lean();
    }
    await redis.set(key, val, {
      ex: 21600,
    });
    return res.status(200).json(val);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

module.exports = {
  getT50,
  getFundBySchemeCode,
  getFundHistory,
};
