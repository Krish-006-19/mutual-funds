const cron = require("node-cron");
const axios = require("axios");

cron.schedule("0 0 * * *", async () => {
    let c=1;
    for(const schemeCode of process.env.FIFTY_FUNDS) {
        try {
            await axios.put(`http://localhost:${process.env.PORT}/history/${schemeCode}`);

            console.log(`Successfully updated history for scheme code ${c}`);
            c++;
        } catch (err) {
            console.error(`Failed to update history for scheme code ${schemeCode}:`, err);
        }
    }
});