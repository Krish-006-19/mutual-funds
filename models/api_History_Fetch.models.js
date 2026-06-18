const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    schemeCode: {
      type: String,
      required: true,
      unique: true,
    },
    data: [
      {
        date: {
          type: String,
          required: true,
        },
        nav: {
          type: String,
          required: true,
        }
      }
    ]
  },
  { timestamps: true },
);

module.exports = mongoose.model("History", historySchema);
