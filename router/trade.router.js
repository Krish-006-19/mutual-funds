const express = require("express");
const router = express.Router();
const {
  getAllTrades,
  addTrade,
  clearTrades,
} = require("../controllers/trade.controllers.js");
const {verifyToken} = require("../middleware/auth.middleware");
router.get("/", verifyToken, getAllTrades);
router.post("/add", verifyToken, addTrade);
router.delete("/clear", verifyToken, clearTrades);

module.exports = router;
