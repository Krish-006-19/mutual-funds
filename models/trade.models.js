const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
    },
    quantity: Number,
    avgPrice: Number,
    currentPrice: Number,
    profitLoss: Number,
  },
  { timestamps: true },
);

tradeSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model("Trade", tradeSchema);
