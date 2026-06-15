const express = require("express");
const router = express.Router();
const Portfolio = require("../models/portfolio.models");

router.get("/", async(req, res) => {
    try {
        const portfolios = await Portfolio.find().sort({ remainingBalance: -1 }).limit(10);
        res.json(portfolios);
    } catch (error) {
        res.status(500).json({ message: "Error fetching leaderboard", error });
    }
})

module.exports = router;