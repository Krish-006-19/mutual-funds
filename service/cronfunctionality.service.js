const axios = require("axios");
const History = require("../models/api_History_Fetch.models");
async function updateAllFunds() {
  const funds = JSON.parse(process.env.FIFTY_FUNDS);
  let c = 1;

  for (const schemeCode of funds) {
    try {
    const { data } = await axios.get(
      `${process.env.FUND_HISTORY_API.replace("///", `/${schemeCode}`)}`,
    );
    if (!data || !data.data) {
      console.error(`No data found for scheme code: ${schemeCode}`);
      continue;
    }
    
    await History.updateOne(
      { schemeCode },
      { schemeCode: schemeCode, data: data.data },
      { upsert: true }
    );
      console.log(`Updated ${c}`);
      c++;
    } catch (err) {
      console.error(`Failed ${schemeCode}`, err);
    }
  }
}

module.exports = { updateAllFunds };