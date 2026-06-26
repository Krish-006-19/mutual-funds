const express = require("express");
const router = express.Router();
const {
  getPortfolioById,
  updatePortfolioController,
} = require("../controllers/portfolio.controllers");
const {verifyToken} = require("../middleware/auth.middleware");
const tradeRateLimit = require("../middleware/tradeRateLimit.middleware");

router.get("/", verifyToken, getPortfolioById);
router.patch("/:schemeCode", verifyToken, tradeRateLimit, updatePortfolioController);

module.exports = router;