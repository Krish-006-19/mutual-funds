require("dotenv").config();
const axios = require("axios");
const cors = require("cors");
const app = require("express")();
app.use(cors("https://market-for-dummies.onrender.com"));

app.use("/", require('./router/api_data_fetch.router.js'))

app.listen(process.env.PORT, _=>console.log(`Server running on http://localhost:${process.env.PORT}`));
