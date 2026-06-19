const express = require("express");
const router = express.Router();
const {
  getPortfolioById,
  updatePortfolio,
  deleteZeroQuantityFunds,
} = require("../controllers/portfolio.controllers");
const {verifyToken} = require("../middleware/auth.middleware");
router.get("/", verifyToken, getPortfolioById);
router.delete("/", verifyToken, deleteZeroQuantityFunds);
router.patch("/:schemeCode", verifyToken, updatePortfolio);

module.exports = router;