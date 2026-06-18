const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  getT50,
  getFundBySchemeCode,
  getFundHistory,
  replaceFundHistory
} = require("../controllers/api_data_fetch.controllers.js");

router.get("/", getT50);
router.get("/:schemeCode", getFundBySchemeCode);
router.get("/history/:schemeCode", getFundHistory);

module.exports = router;
