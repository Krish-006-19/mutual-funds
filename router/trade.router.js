const express = require("express");
const router = express.Router();
const {
  getAllTrades,
  addTrade,
  deleteTrade,
  clearTrades,
} = require("../controllers/trade.controllers.js");
const {verifyToken} = require("../middleware/auth.middleware");
router.get("/:id", verifyToken, getAllTrades);
router.post("/:id/add", verifyToken, addTrade);
router.delete("/:id/delete/:schemeCode", verifyToken, deleteTrade);
router.delete("/:id/clear", verifyToken, clearTrades);

module.exports = router;
