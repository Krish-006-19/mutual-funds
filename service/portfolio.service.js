const Portfolio = require("../models/portfolio.models");
const redis = require("../service/redisSetup.service.js");
const Trade = require("../models/trade.models.js");
const { getLatestFunds } = require("../service/LatestNav.service.js");
const Sip = require("../models/sip.models.js");
const mongoose = require("mongoose");
 
async function buyFund({
  userId,
  schemeCode,
  category,
  sip,
  nav,
  data,
}) {
  try {
    if (data.remainingBalance < sip) {
      await Sip.findOneAndUpdate(
        { userId, schemeCode },
        { isActive: false }
      );
      return null;
    }

    data.remainingBalance = Number((data.remainingBalance - sip).toFixed(2));

    const quantity = Number((sip / nav).toFixed(6));

    const existingFund = data.funds.find((f) => f.symbol === schemeCode);

    if (existingFund) {
      existingFund.units = Number((existingFund.units + quantity).toFixed(6));

      existingFund.investedAmt = Number(
        (existingFund.investedAmt + sip).toFixed(2),
      );
    } else {
      data.funds.push({
        symbol: schemeCode,
        category: category,
        units: quantity,
        investedAmt: sip,
      });
    }

    return data;
  } catch (error) {
    throw new Error("Error buying fund: " + error.message);
  }
}

async function sellFund({ schemeCode, quantity, nav, data }) {
  try {
    const fund = data.funds.find((f) => f.symbol === schemeCode);

    if (!fund) {
      throw new Error("Fund not found");
    }

    if (fund.units < quantity) {
      throw new Error("Insufficient units to sell");
    }

    fund.units = Number((fund.units - quantity).toFixed(6));

    const proceeds = Number((quantity * nav).toFixed(2));
    data.remainingBalance = Number(
      (data.remainingBalance + proceeds).toFixed(2),
    );
    fund.investedAmt = Number(
      (
        fund.investedAmt -
        fund.investedAmt * (quantity / (fund.units + quantity))
      ).toFixed(2),
    );
    if (fund.units <= 0.000001) {
      data.funds = data.funds.filter((f) => f.symbol !== schemeCode);
    }

    return data;
  } catch (error) {
    throw new Error("Error selling fund: " + error.message);
  }
}

async function updatePortfolio({
  userId,
  schemeCode,
  quantity,
  type,
  sip,
  active
}) {
  const session = await mongoose.startSession();
  let navMap = {};
  const fundsData = await getLatestFunds();
  for (const fund of fundsData) {
    navMap[fund["Scheme Code"]] = Number(fund["Net Asset Value"]);
  }
  const nav = Number(navMap[schemeCode].toFixed(2));
  try {
    let data = [];
    await session.withTransaction(async () => {
      data = await Portfolio.findOne({ userId }).session(session);
      if (!data) {
        throw new Error("Portfolio not found");
      }
      const category = fundsData.find(
        (f) => f["Scheme Code"] === schemeCode,
      )?.category;
      if (type === "BUY" && active === true) {
        const result = await buyFund({
          userId,
          schemeCode,
          category,
          sip,
          nav,
          data,
        });
        if (!result) {
          throw new Error("Insufficient balance");
        }
        const existingSip = await Sip.findOne({ userId, schemeCode }).session(
          session,
        );
        if (existingSip) {
          existingSip.amt = sip;
          existingSip.startdate = new Date();
          existingSip.nextdate = new Date(
            new Date().setMonth(new Date().getMonth() + 1),
          );
          existingSip.isActive = active;
          await existingSip.save({ session });
        } else {
          await Sip.create(
            [
              {
                userId,
                schemeCode,
                amt: sip,
                startdate: new Date(),
                nextdate: new Date(
                  new Date().setMonth(new Date().getMonth() + 1),
                ),
                isActive: active,
              },
            ],
            { session },
          );
        }
      } else if (type === "SELL") {
        await sellFund({ schemeCode, quantity, nav, data });
      }
      await data.save({ session });
      const tradeQuantity =
        type === "BUY" ? Number((sip / nav).toFixed(6)) : quantity;

      const tradeAmount =
        type === "BUY" ? sip : Number((quantity * nav).toFixed(2));

      await Trade.create(
        [
          {
            userId,
            symbol: schemeCode,
            category,
            type,
            quantity: tradeQuantity,
            amount: tradeAmount,
            price: nav,
          },
        ],
        { session },
      );
      await redis.del(`portfolio:${userId}`);
      await redis.del(`trades:${userId}`);
    });

    return data;
  } catch (error) {
    throw new Error("Error updating portfolio: " + error.message);
  } finally {
    await session.endSession();
  }
}

module.exports = {
  updatePortfolio,
};
