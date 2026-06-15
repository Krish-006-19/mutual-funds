const Portfolio = require("../models/portfolio.models");

async function getPortfolioById(req, res) {
  try {
    const data = await Portfolio.findOne({ userId: req.params.id });
    if (!data) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio", error });
  }
}

async function updatePortfolio(req, res) {
  try {
    const data = await Portfolio.findOneAndUpdate(
      { userId: req.params.id, "funds.symbol": req.params.schemeCode },
      {
        $set: {
          remainingBalance: req.body.remainingBalance,
          "funds.$.quantity": req.body.quantity,
          "funds.$.avgPrice": req.body.avgPrice,
          "funds.$.currentPrice": req.body.currentPrice,
          "funds.$.investedAmount": req.body.investedAmount,
          "funds.$.profitLoss": req.body.profitLoss,
        },
      },
      { new: true },
    );
    if (!data) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error updating portfolio", error });
  }
}

async function deleteZeroQuantityFunds(req, res) {
  try {
    const data = await Portfolio.findOneAndUpdate(
      { userId: req.params.id },
      {
        $pull: {
          funds: {
            quantity: 0,
          },
        },
      },
      { new: true },
    );
    if (!data) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    res.status(200).json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting portfolio", error });
  }
}

module.exports = {
  getPortfolioById,
  updatePortfolio,
  deleteZeroQuantityFunds,
};