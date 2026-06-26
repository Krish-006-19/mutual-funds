const Portfolio = require("../models/portfolio.models");
const { verifyToken } = require("../middleware/auth.middleware");
const { getLatestFunds } = require("../service/LatestNav.service");

async function leaderboardController(req, res) {
  try {
    const portfolios = await Portfolio.find().lean();

    const latestFunds = await getLatestFunds();

    const navMap = {};
    for (const fund of latestFunds) {
      navMap[fund["Scheme Code"]] = Number(fund["Net Asset Value"]);
    }

    const leaderboard = portfolios.map((portfolio) => {
      let investedValue = 0;

      for (const fund of portfolio.funds) {
        const nav = navMap[fund.symbol] || 0;

        investedValue += nav * fund.units;
      }

      const totalValue = Number(portfolio.remainingBalance) + investedValue;

      return {
        username: portfolio.username,
        totalValue: Number(totalValue.toFixed(2)),
        remainingBalance: portfolio.remainingBalance,
      };
    });

    leaderboard.sort((a, b) => b.totalValue - a.totalValue);

    res.json(leaderboard.slice(0, 10));
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Error fetching leaderboard",
    });
  }
}

module.exports = { leaderboardController };