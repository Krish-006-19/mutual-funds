require("dotenv").config();
require("./cronjob.js");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 100,
});


mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/marketdb")
  .then(() => console.log("Mongo connected!"))
  .catch((err) => console.error(err));

app.use(
  cors({
    origin: [
      "https://market-for-dummies.onrender.com",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use(limiter);

app.get('/health', (req,res)=>{
  return res.status(200).json({message: "Welcome to Market for Dummies API"});
})
app.use("/leaderboard", require('./router/leaderboard.router.js'));
app.use("/portfolio", require('./router/portfolio.router.js'));
app.use("/trade", require('./router/trade.router.js'));
app.use("/user", require('./router/user.router.js'));
app.use("/", require('./router/api_data_fetch.router.js'));

app.listen(process.env.PORT, _=>console.log(`Server running on http://localhost:${process.env.PORT}`));
