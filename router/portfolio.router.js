const express = require("express");
const router = express.Router();
const {
  getPortfolioById,
  updatePortfolio,
  deleteZeroQuantityFunds,
} = require("../controllers/portfolio.controllers");

router.get("/:id", getPortfolioById);
router.patch("/:id/:schemeCode", updatePortfolio);
router.delete("/:id", deleteZeroQuantityFunds);

module.exports = router;