const Sip = require("../models/sip.models");
const Portfolio = require("../models/portfolio.models");
const { updatePortfolio } = require("../service/portfolio.service.js");
const { getLatestFunds } = require("../service/LatestNav.service.js");
async function sipcron() {
  try {
    const dueSips = await Sip.find({
      isActive: true,
      nextdate: { $lte: new Date() },
    });

    if (!dueSips.length) return;
    const fundsData = await getLatestFunds();
    const navmap={};
    for(const fund of fundsData) {
      navmap[fund["Scheme Code"]] = Number(fund["Net Asset Value"]);
    }
    for (const sip of dueSips) {
    const nav = navmap[sip.schemeCode];

      const result = await updatePortfolio({
        userId: sip.userId,
        schemeCode: sip.schemeCode,
        quantity: Number((sip.amt / nav).toFixed(6)),
        type: "BUY",
        sip: sip.amt,
        active: sip.isActive,
      });

      const nextDate = new Date(sip.nextdate);
      nextDate.setMonth(nextDate.getMonth() + 1);

      sip.nextdate = nextDate;
      await sip.save();
    }
  } catch (error) {
    console.error("Error in sipcron:", error);
  }
}

module.exports = {
  sipcron,
};