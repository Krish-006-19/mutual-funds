const cron = require("node-cron");
const axios = require("axios");

cron.schedule("0 0 * * *", async () => {
    let c=1;
    const fiftyFunds = JSON.parse(process.env.FIFTY_FUNDS);
    for(const schemeCode of fiftyFunds) {
        try {
            await axios.put(`https://mutual-funds-1.onrender.com/history/${schemeCode}`);

            console.log(`Successfully updated history for scheme code ${c}`);
            c++;
        } catch (err) {
            console.error(`Failed to update history for scheme code ${schemeCode}:`, err);
        }
    }
});