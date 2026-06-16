const express = require("express");
const router = express.Router();
const {
  getPortfolioById,
  updatePortfolio,
  deleteZeroQuantityFunds,
} = require("../controllers/portfolio.controllers");
const {verifyToken} = require("../middleware/auth.middleware");
router.get("/:id", verifyToken, getPortfolioById);
router.patch("/:id/:schemeCode", verifyToken, updatePortfolio);
router.delete("/:id", verifyToken, deleteZeroQuantityFunds);

module.exports = router;