const Portfolio = require("../models/portfolio.models");
const redis = require("../service/redisSetup.service.js");
const Trade = require("../models/trade.models.js");
const { getLatestFunds } = require("../service/LatestNav.service.js");

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
      const nav = navMap[fund.symbol];

      if (nav === undefined) {
        return {
          ...fund,
          nav: null,
          investedValue: null,
          currentValue: null,
          profitLoss: null,
          profitLossPercent: null,
        };
      }

      const investedValue = fund.quantity * fund.avgPrice;

      const currentValue = fund.quantity * nav;

      const profitLoss = currentValue - investedValue;

      const profitLossPercent =
        investedValue === 0
          ? 0
          : Number(((profitLoss / investedValue) * 100).toFixed(2));

      return {
        ...fund,
        nav: Number(nav.toFixed(3)),
        investedValue: Number(investedValue.toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),
        profitLoss: Number(profitLoss.toFixed(2)),
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

async function updatePortfolio(req, res) {
  try {
    const type = String(req.body.type || "").trim().toUpperCase();
    const quantity = Number(req.body.quantity);
    const schemeCode = String(req.params.schemeCode || "").trim();

    if (!["BUY", "SELL"].includes(type) || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const portfolio = await Portfolio.findOne({ userId: req.user.userId });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    if (!Array.isArray(portfolio.funds)) {
      portfolio.funds = [];
    }

    const fundData = await getLatestFunds();
    const navMap = {};

    for (const fund of fundData) {
      navMap[String(fund["Scheme Code"]).trim()] = Number(fund["Net Asset Value"]);
    }

    const price = navMap[schemeCode];

    if (!Number.isFinite(price) || price <= 0) {
       return res.status(404).json({ error: "Scheme not found or invalid price" });
    }

    const fund = portfolio.funds.find((f) => String(f.symbol).trim() === schemeCode);

    if (type === "BUY") {
      const cost = quantity * price;

      if (!Number.isFinite(cost)) {
        return res.status(400).json({ message: "Invalid cost calculation" });
      }

      if (portfolio.remainingBalance < cost) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      portfolio.remainingBalance -= cost;

      if (fund) {
        const newQty = fund.quantity + quantity;
        const newAvg = ((fund.quantity * fund.avgPrice) + (quantity * price)) / newQty;

        fund.quantity = newQty;
        fund.avgPrice = Number(newAvg.toFixed(2));
      } else {
        portfolio.funds.push({
          symbol: schemeCode,
          quantity,
          avgPrice: Number(price.toFixed(2)),
        });
      }
    } else if (type === "SELL") {
      if (!fund) {
        return res.status(404).json({ message: "Fund not found" });
      }

      if (fund.quantity < quantity) {
        return res.status(400).json({ message: "Not enough units" });
      }

      const proceeds = quantity * price;

      if (!Number.isFinite(proceeds)) {
        return res.status(400).json({ message: "Invalid proceeds calculation" });
      }

      const remainingQty = fund.quantity - quantity;
      portfolio.remainingBalance += proceeds;

      if (remainingQty === 0) {
        portfolio.funds = portfolio.funds.filter(
          (f) => String(f.symbol).trim() !== schemeCode
        );
      } else {
        fund.quantity = remainingQty;
      }
    }

    await portfolio.save();

    await Trade.create({
      userId: req.user.userId,
      symbol: schemeCode,
      type,
      quantity,
      price: Number(price.toFixed(2)),
    });

    await redis.del(`portfolio:${req.user.userId}`);
    await redis.del(`trades:${req.user.userId}`);

    return res.status(200).json(portfolio);
  } catch (error) {
    if (error.name === "VersionError") {
      return res.status(409).json({
        message: "Portfolio was modified by another request. Please retry.",
      });
    }

  console.error("PORTFOLIO UPDATE FAILED:", error);

  return res.status(500).json({
    message: "Error updating portfolio",
    error: error.message,
    name: error.name,
  });
  }
}

module.exports = {
  getPortfolioById,
  updatePortfolio,
};
