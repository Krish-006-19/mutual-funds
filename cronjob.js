const cron = require("node-cron");
const axios = require("axios");
const { updateAllFunds } = require("./service/cronfunctionality.service.js");

cron.schedule("0 0 * * *", async () => {
  await updateAllFunds();
});