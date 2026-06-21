const express = require("express");
const router = express.Router();
const {
  getPortfolioById,
  updatePortfolio,
} = require("../controllers/portfolio.controllers");
const {verifyToken} = require("../middleware/auth.middleware");
const tradeRateLimit = require("../middleware/tradeRateLimit.middleware");

router.get("/", verifyToken, getPortfolioById);
router.patch("/:schemeCode", verifyToken, tradeRateLimit, updatePortfolio);

module.exports = router;