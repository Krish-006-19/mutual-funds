const axios = require("axios");
const History = require("../models/api_History_Fetch.models");
const { updateAllFunds } = require("../service/cronfunctionality.service.js");
function parseData(body) {
  if (!body) return [];

  const rows = body.replace(/\r?\n/g, "\n").trim().split("\n");
  if (rows.length < 2) return [];

  const headers = rows[0].split(";");
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => row.split(";"))
    .filter((cols) => cols.length === 6)
    .map((cols) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = cols[idx];
      });
      return obj;
    });
}

const T50 = JSON.parse(process.env.FIFTY_FUNDS) || [];

async function getT50(req, res) {
  try {
    const { data } = await axios.get(process.env.ALL_FUNDS_API, {
      responseType: "text",
    });

    let fundData = parseData(data);
    fundData = fundData.filter((fund) =>
      T50.includes(Number(fund["Scheme Code"])),
    );

    res.json(fundData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

async function getFundBySchemeCode(req, res) {
  try {
    const { data } = await axios.get(process.env.ALL_FUNDS_API, {
      responseType: "text",
    });

    const fundData = parseData(data);
    const fund = fundData.find(
      (f) => f["Scheme Code"] == req.params.schemeCode,
    );

    if (!fund) {
      return res.status(404).json({ error: "Scheme not found" });
    }

    res.json(fund);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

async function getFundHistory(req, res) {
  try {
    const val = await History.findOne({ schemeCode: req.params.schemeCode }).select("-_id");
    if (!val) {
      return res
        .status(404)
        .json({ error: "No history found for this scheme" });
    }
    const date = new Date()
      .toISOString()
      .split("T")[0]
      .split("-")
      .reverse()
      .join("-");

    // if (val.date === date) {
    //   await updateAllFunds();
    // }
    return res.status(200).json(val.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

// async function replaceFundHistory(req, res) {
//   try {
//     const { schemeCode } = req.params;
//     const { data } = await axios.get(
//       `${process.env.FUND_HISTORY_API.replace("///", `/${schemeCode}`)}`,
//     );
//     if (!data || !data.data) {
//       return res.status(404).json({ error: "No data found" });
//     }

//     await History.updateOne(
//       { schemeCode },
//       { data: data.data },
//       { upsert: true }
//     );
//     res.json({ message: "History updated successfully"});
//   } catch (err) {
//     res.status(500).json({ error: "Failed to update data" });
//   }
// }

module.exports = {
  getT50,
  getFundBySchemeCode,
  getFundHistory,
  // replaceFundHistory
};
