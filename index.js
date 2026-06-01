require("dotenv").config();
const axios = require("axios");
const cors = require("cors");
const app = require("express")();
app.use(cors("https://market-for-dummies.onrender.com"));

function parseData(body) {
  if (!body) return [];

  const rows = body.replace(/\r?\n/g, "\n").trim().split("\n");
  if (rows.length < 2) return [];

  const headers = rows[0].split(";");
  const dataRows = rows.slice(1);

  return dataRows
    .map(row => row.split(";"))
    .filter(cols => cols.length === 6)
    .map(cols => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = cols[idx];
      });
      return obj;
    });
}

const T50 = JSON.parse(process.env.FIFTY_FUNDS) || [];

app.get("/", async (req, res) => {
  try {
    const { data } = await axios.get(
      process.env.ALL_FUNDS_API,
      { responseType: "text" }
    );

    let fundData = parseData(data);
    fundData = fundData.filter(fund =>
      T50.includes(Number(fund["Scheme Code"]))
    );

    res.json(fundData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.get("/:schemeCode", async (req, res) => {
  try {
    const { data } = await axios.get(
      process.env.ALL_FUNDS_API,
      { responseType: "text" }
    );

    const fundData = parseData(data);
    const fund = fundData.find(
      f => f["Scheme Code"] == req.params.schemeCode
    );

    if (!fund) {
      return res.status(404).json({ error: "Scheme not found" });
    }

    res.json(fund);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.get("/history/:schemeCode", async (req, res) => {
  try {
    const { data } = await axios.get(
      `${process.env.FUND_HISTORY_API.replace("///", `/${req.params.schemeCode}`)}`
    );

    if (!data || !data.data) {
      return res.status(404).json({ error: "No data found" });
    }

    res.json(data.data.slice(0, data.length));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(process.env.PORT, _=>console.log(`Server running on http://localhost:${process.env.PORT}`));
