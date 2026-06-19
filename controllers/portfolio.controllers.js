const Portfolio = require("../models/portfolio.models");
const redis = require("../service/redisSetup.service.js");

async function getPortfolioById(req, res) {
  try {
    const key = `portfolio:${req.user.userId}`;
    const cachedPortfolio = await redis.get(key);
    if (cachedPortfolio) {
      return res.status(200).json(JSON.parse(cachedPortfolio));
    }
    const data = await Portfolio.findOne({ userId: req.user.userId });
    if (!data) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    await redis.set(key, JSON.stringify(data), {
      ex: 86400,
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolio", error });
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
        returnDocument: "after",
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
          upsert: true,
        },
      );
      await redis.set(key, JSON.stringify(data), {
        ex: 86400,
      });
      return res.status(201).json({ message: "Fund added to portfolio", data });
    }
    await redis.set(key, JSON.stringify(data), {
      ex: 86400,
    });
    res.status(200).json(data);
  } catch (error) {
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
