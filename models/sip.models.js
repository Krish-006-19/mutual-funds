const mongoose = require("mongoose");

const sipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schemeCode: {
      type: String,
      required: true,
    },
    amt: {
      type: Number,
      required: true,
    },
    startdate: {
      type: Date,
      required: true,
    },
    nextdate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Sip", sipSchema);
