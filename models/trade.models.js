const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  symbol: String,
  type: {
    type: String,
    enum: ["BUY", "SELL"]
  },
  quantity: Number,
  avgPrice: Number,
  currentPrice: Number,
  profitLoss: Number
}, { timestamps: true });

module.exports = mongoose.model("Trade", tradeSchema);