const express = require("express");
const router = express.Router();
const {verifyToken} = require("../middleware/auth.middleware");
const {getSipData} = require("../controllers/sip.controllers.js");

router.get('/:schemeCode', verifyToken, getSipData);

module.exports = router;