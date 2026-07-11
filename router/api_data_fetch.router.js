const express = require("express");
const router = express.Router();
const axios = require("axios");
const { updateAllFunds } = require("../service/cronfunctionality.service.js");
const {
  getT50,
  getFundBySchemeCode,
  getFundHistory,
  replaceFundHistory
} = require("../controllers/api_data_fetch.controllers.js");

router.get("/", getT50);
router.get("/history/:schemeCode", getFundHistory);
router.get("/:schemeCode", getFundBySchemeCode);
router.get("/cron/history", async(req, res) => {
  try {
    await updateAllFunds();
    res.status(200).json({ message: "Fund history cron job executed successfully" });
  } catch (error) {
    console.error("Error in cron job:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
