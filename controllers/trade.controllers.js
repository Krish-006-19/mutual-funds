const trade = require("../models/trade.models.js");

async function getAllTrades(req, res) {
  try {
    const trades = await trade.findOne({ userId: req.params.id });
    if (!trades) {
      return res.status(404).json({ error: "No trades found" });
    }
    res.json(trades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function addTrade(req, res) {
  try {
    const { symbol, type, quantity, avgPrice, currentPrice, profitLoss } =
      req.body;
    if (
      !symbol ||
      !type ||
      !quantity ||
      !avgPrice ||
      !currentPrice ||
      profitLoss === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const newTrade = new trade({
      userId: req.params.id,
      symbol,
      type,
      quantity,
      avgPrice,
      currentPrice,
      profitLoss,
    });
    await newTrade.save();
    res.status(201).json({ message: "Trade added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteTrade(req, res) {
  try {
    const data = await trade.findOneAndDelete({
      userId: req.params.id,
      symbol: req.params.schemeCode,
    });
    if (!data) {
      return res.status(404).json({ error: "Trade not found" });
    }
    res.json({ message: "Trade deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function clearTrades(req, res) {
  try {
    const result = await trade.deleteMany({ userId: req.params.id });
    res.json({ message: `${result.deletedCount} trades cleared successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getAllTrades,
  addTrade,
  deleteTrade,
  clearTrades,
};
