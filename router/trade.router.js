const express = require("express");
const router = express.Router();
const {
  getTrades,
  addTrade,
  deleteTrade,
  clearTrades,
} = require("../controllers/trade.controllers.js");

router.get("/", getTrades);
router.post("/add", addTrade);
router.delete("/delete/:schemeCode", deleteTrade);
router.delete("/clear", clearTrades);

module.exports = router;
