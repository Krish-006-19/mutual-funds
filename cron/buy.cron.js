const cron = require("node-cron");
const Sip = require("../models/sip.models.js");
const { sipcron } = require("../service/sipcronfunctionality.service.js");
cron.schedule("30 20 * * *", async () => {
  try {
    console.log("Running SIP cron job at 8:30 PM");
    await sipcron();
  } catch (error) {
    console.error("Error in cron job:", error);
  }
},{
    timezone: "Asia/Kolkata",
});
