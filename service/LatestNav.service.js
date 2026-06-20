const axios = require("axios");
const redis = require("./redisSetup.service");
const parseData = require("../utils/parseData.util.js");
const T50 = JSON.parse(process.env.FIFTY_FUNDS) || [];

async function getLatestFunds() {
  const key = "t50_funds";

  let funds = await redis.get(key);

  if (funds) {
    return funds;
  }

  const { data } = await axios.get(
    process.env.ALL_FUNDS_API,
    {
      responseType: "text",
    }
  );

  funds = parseData(data);

  funds = funds.filter((fund) =>
    T50.includes(Number(fund["Scheme Code"]))
  );

  await redis.set(key, funds, {
    ex: 21600,
  });

  return funds;
}

module.exports = {
  getLatestFunds,
};