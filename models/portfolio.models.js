const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    remainingBalance: {
      type: Number,
      default: 0,
    },
    funds: [
      {
        symbol: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        avgPrice: {
          type: Number,
          required: true,
        }
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Portfolio", portfolioSchema);