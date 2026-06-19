const cron = require("node-cron");
const axios = require("axios");
const { updateAllFunds } = require("./service/cronfunctionality.service.js");
const redis = require("./service/redisSetup.service.js");
cron.schedule("0 0 * * *", async () => {
  try { 
    await updateAllFunds();
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});