const Portfolio = require("../models/portfolio.models");
const redis = require("../service/redisSetup.service.js");
const Trade = require("../models/trade.models.js");
const { getLatestFunds } = require("../service/LatestNav.service.js");
const { updatePortfolio } = require("../service/portfolio.service.js");
const Sip = require("../models/sip.models.js");
async function getPortfolioById(req, res) {
  try {
    const key = `portfolio:${req.user.userId}`;

    const cachedPortfolio = await redis.get(key);
    if (cachedPortfolio) {
      return res.status(200).json(cachedPortfolio);
    }

    const portfolio = await Portfolio.findOne({
      userId: req.user.userId,
    })
      .select("-_id -__v -createdAt -updatedAt -userId")
      .lean();

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found",
      });
    }

    const fundsData = await getLatestFunds();

    const navMap = {};
    for (const fund of fundsData) {
      navMap[fund["Scheme Code"]] = Number(fund["Net Asset Value"]);
    }

    portfolio.funds = portfolio.funds.map((fund) => {
      const rawNav = navMap[fund.symbol];

      if (rawNav === undefined || rawNav === null || Number.isNaN(rawNav)) {
        return {
          ...fund,
          nav: null,
          investedValue: null,
          currentValue: null,
          profitLoss: null,
          profitLossPercent: null,
        };
      }

      const nav = Number(rawNav.toFixed(2));

      const investedValue = Number(fund.investedAmt.toFixed(2));

      const currentValue = Number((fund.units * nav).toFixed(2));

      const profitLoss = Number(
        (currentValue - investedValue).toFixed(2)
      );

      const profitLossPercent =
        investedValue === 0
          ? 0
          : Number(((profitLoss / investedValue) * 100).toFixed(2));

      return {
        ...fund,
        nav,
        investedValue,
        currentValue,
        profitLoss,
        profitLossPercent,
      };
    });

    await redis.set(key, portfolio, {
      ex: 21600,
    });

    return res.status(200).json(portfolio);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error fetching portfolio",
    });
  }
}
async function updatePortfolioController(req, res) {
  try {
    const isStopped = req.body.isStopped;
    if (isStopped) {
      await Sip.findOneAndUpdate(
        { userId: req.user.userId, schemeCode: req.body.schemeCode },
        { isActive: false }
      );
      return res.status(200).json({ message: "SIP stopped successfully" });
    }
    const portfolio = await updatePortfolio({
      userId: req.user.userId,
      schemeCode: req.params.schemeCode,
      quantity: req.body.quantity,
      type: req.body.type,
      sip: req.body.sip,
      active: req.body.active,
    });
    return res.status(200).json(portfolio);
  } catch (error) {
    if (error.name === "VersionError") {
      return res.status(409).json({
        message: "Portfolio was modified by another request. Please retry.",
      });
    }

    if (error.code === 11000) {
      console.error("Duplicate key error in updatePortfolio:", error.message);
      return res.status(409).json({
        message: "A conflicting trade record already exists. Please retry.",
      });
    }

    console.error("updatePortfolio error:", {
      message: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params,
      userId: req.user?.userId,
    });

    return res.status(500).json({
      message: "Error updating portfolio",
    });
  }
}

module.exports = {
  getPortfolioById,
  updatePortfolioController,
};
