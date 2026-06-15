const express = require("express");
const router = express.Router();
const {
  getAllTrades,
  addTrade,
  deleteTrade,
  clearTrades,
} = require("../controllers/trade.controllers.js");

router.get("/:id", getAllTrades);
router.post("/:id/add", addTrade);
router.delete("/:id/delete/:schemeCode", deleteTrade);
router.delete("/:id/clear", clearTrades);

module.exports = router;
