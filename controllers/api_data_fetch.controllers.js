const axios = require("axios");
const History = require("../models/api_History_Fetch.models");
const { updateAllFunds } = require("../service/cronfunctionality.service.js");
const redis = require("../service/redisSetup.service.js");

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

function convertDate(date) {
  const monthMap = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const [day, month, year] = date.split("-");
  return `${day}-${monthMap[month.toLowerCase()]}-${year}`;
}

const T50 = JSON.parse(process.env.FIFTY_FUNDS) || [];

async function getT50(req, res) {
  try {
    const key = "t50_funds";
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    const { data } = await axios.get(process.env.ALL_FUNDS_API, {
      responseType: "text",
    });

    let fundData = parseData(data);
    fundData = fundData.filter((fund) =>
      T50.includes(Number(fund["Scheme Code"])),
    );

    await redis.set(key, JSON.stringify(fundData), {
      ex: 86400,
    });
    res.json(fundData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
async function getFundBySchemeCode(req, res) {
  try {
    const key = `fund:${req.params.schemeCode}`;
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
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
    await redis.set(key, JSON.stringify(fund), {
      ex: 86400,
    });
    res.json(fund);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

async function getFundHistory(req, res) {
  try {
    const key = `fund_history:${req.params.schemeCode}`;
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    let val = await History.findOne({
      schemeCode: req.params.schemeCode,
    });
    const { data } = await axios.get(process.env.ALL_FUNDS_API, {
      responseType: "text",
    });

    const fundData = parseData(data);
    const fund = fundData.find(
      (f) => f["Scheme Code"] == req.params.schemeCode,
    )["Date"];

    if (!val) {
      return res
        .status(404)
        .json({ error: "No history found for this scheme" });
    }

    if (convertDate(fund) !== val.data[0].date) {
      await updateAllFunds();
      val = await History.findOne({
        schemeCode: req.params.schemeCode,
      });
    }
    await redis.set(key, JSON.stringify(val), {
      ex: 86400,
    });
    return res.status(200).json(val);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

module.exports = {
  getT50,
  getFundBySchemeCode,
  getFundHistory,
};
