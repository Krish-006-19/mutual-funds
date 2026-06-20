const express = require("express");
const router = express.Router();
const {
  getAllTrades,
} = require("../controllers/trade.controllers.js");
const {verifyToken} = require("../middleware/auth.middleware");
router.get("/", verifyToken, getAllTrades);

module.exports = router;
