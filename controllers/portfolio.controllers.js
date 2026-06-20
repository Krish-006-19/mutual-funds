const Portfolio = require("../models/portfolio.models");
const redis = require("../service/redisSetup.service.js");
const { getLatestFunds } = require("../service/LatestNav.service.js");
const Trade = require("../models/trade.models.js");

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
    const { type, quantity, price } = req.body;
    const schemeCode = req.params.schemeCode;
    if (!["BUY", "SELL"].includes(type) || quantity <= 0 || price <= 0) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }
    let portfolio = await Portfolio.findOne({
      userId: req.user.userId,
    });

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found",
      });
    }

    let fund = portfolio.funds.find((f) => f.symbol === schemeCode);

    if (type === "BUY") {
      const cost = quantity * price;

      if (portfolio.remainingBalance < cost) {
        return res.status(400).json({
          message: "Insufficient balance",
        });
      }

      portfolio.remainingBalance -= cost;

      if (fund) {
        const newQty = fund.quantity + quantity;

        const newAvg =
          (fund.quantity * fund.avgPrice + quantity * price) / newQty;

        fund.quantity = newQty;
        fund.avgPrice = Number(newAvg.toFixed(2));
      } else {
        portfolio.funds.push({
          symbol: schemeCode,
          quantity,
          avgPrice: price,
        });
      }
    } else if (type === "SELL") {
      if (!fund) {
        return res.status(404).json({
          message: "Fund not found",
        });
      }

      if (fund.quantity < quantity) {
        return res.status(400).json({
          message: "Not enough units",
        });
      }

      portfolio.remainingBalance += quantity * price;

      fund.quantity -= quantity;

      if (fund.quantity <= 0) {
        portfolio.funds = portfolio.funds.filter(
          (f) => f.symbol !== schemeCode,
        );
      }
    } else {
      return res.status(400).json({
        message: "Invalid transaction type",
      });
    }

    await portfolio.save();
    await Trade.create({
      userId: req.user.userId,
      symbol: schemeCode,
      type,
      quantity,
      price,
    });

    await redis.del(`portfolio:${req.user.userId}`);
    await redis.del(`trades:${req.user.userId}`);

    return res.status(200).json(portfolio);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error updating portfolio",
    });
  }
}

module.exports = {
  getPortfolioById,
  updatePortfolio
};