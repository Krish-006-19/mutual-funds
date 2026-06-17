async function updateAllFunds() {
  const funds = JSON.parse(process.env.FIFTY_FUNDS);
  let c = 1;

  for (const schemeCode of funds) {
    try {
      await axios.put(
        `${process.env.BACKEND_URL}/history/${schemeCode}`
      );

      console.log(`Updated ${c}`);
      c++;
    } catch (err) {
      console.error(`Failed ${schemeCode}`, err);
    }
  }
}

module.exports = { updateAllFunds };