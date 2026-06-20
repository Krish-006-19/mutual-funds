const express = require("express");
const router = express.Router();
const {
  getPortfolioById,
  updatePortfolio,
} = require("../controllers/portfolio.controllers");
const {verifyToken} = require("../middleware/auth.middleware");

router.get("/", verifyToken, getPortfolioById);
router.patch("/:schemeCode", verifyToken, updatePortfolio);

module.exports = router;