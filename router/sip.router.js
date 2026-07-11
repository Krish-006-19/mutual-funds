const express = require("express");
const router = express.Router();
const {verifyToken} = require("../middleware/auth.middleware");
const {getSipData} = require("../controllers/sip.controllers.js");
const {sipcron} = require("../service/sipcronfunctionality.service.js");
router.get('/:schemeCode', verifyToken, getSipData);
router.get("/cron/sip", async (req, res) => {
    try {
        await sipcron();
        res.status(200).json({ message: "SIP cron job executed successfully" });
    } catch (error) {
        console.error("Error in cron job:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;