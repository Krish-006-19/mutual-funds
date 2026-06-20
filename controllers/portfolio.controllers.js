const Portfolio = require("../models/portfolio.models");
const redis = require("../service/redisSetup.service.js");
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
      navMap[fund["Scheme Code"]] = Number(
        fund["Net Asset Value"]
      );
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

      const investedValue =
        fund.quantity * fund.avgPrice;

      const currentValue =
        fund.quantity * nav;

      const profitLoss =
        currentValue - investedValue;

      const profitLossPercent =
        investedValue === 0
          ? 0
          : Number(
              (
                (profitLoss / investedValue) *
                100
              ).toFixed(2)
            );

      return {
        ...fund,
        nav: Number(nav.toFixed(3)),
        investedValue: Number(
          investedValue.toFixed(2)
        ),
        currentValue: Number(
          currentValue.toFixed(2)
        ),
        profitLoss: Number(
          profitLoss.toFixed(2)
        ),
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
    const key = `portfolio:${req.user.userId}`;
    let data = await Portfolio.findOneAndUpdate(
      {
        userId: req.user.userId,
        "funds.symbol": req.params.schemeCode,
      },
      {
        $set: {
          remainingBalance: req.body.remainingBalance,
          "funds.$.quantity": req.body.quantity,
          "funds.$.avgPrice": req.body.avgPrice,
        },
      },
      {
        new: true, runValidators: true
      },
    );

    if (!data) {
      data = await Portfolio.findOneAndUpdate(
        { userId: req.user.userId },
        {
          $set: {
            remainingBalance: req.body.remainingBalance,
          },
          $push: {
            funds: {
              symbol: req.params.schemeCode,
              quantity: req.body.quantity,
              avgPrice: req.body.avgPrice,
            },
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
          upsert: true,
        },
      );
    await redis.del(key);
      return res.status(201).json({ message: "Fund added to portfolio", data });
    }
    await redis.del(key);
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating portfolio", error });
  }
}

async function deleteZeroQuantityFunds(req, res) {
  try {
    const data = await Portfolio.findOneAndUpdate(
      { userId: req.user.userId },
      {
        $pull: {
          funds: {
            quantity: 0,
          },
        },
      },
      { returnDocument: "after" },
    );
    if (!data) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    await redis.del(`portfolio:${req.user.userId}`);
    res
      .status(200)
      .json({ message: "Zero quantity funds deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting portfolio", error });
  }
}

module.exports = {
  getPortfolioById,
  updatePortfolio,
  deleteZeroQuantityFunds,
};
