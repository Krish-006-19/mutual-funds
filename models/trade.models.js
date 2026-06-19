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
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
    },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true },
  },
  { timestamps: true },
);

tradeSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Trade", tradeSchema);
