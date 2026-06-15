const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    schemeCode: {
      type: String,
      required: true,
    },
    data: [
      {
        date: {
          type: Date,
          required: true,
        },
        nav: {
          type: Number,
          required: true,
        }
      }
    ]
  },
  { timestamps: true },
);

module.exports = mongoose.model("History", historySchema);
