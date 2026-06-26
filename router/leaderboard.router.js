const express = require("express");
const router = express.Router();
const { leaderboardController } = require("../controllers/leaderboard.controller");
const {verifyToken} = require("../middleware/auth.middleware");

router.get("/", verifyToken, leaderboardController);

module.exports = router;