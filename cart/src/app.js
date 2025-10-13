const express = require('express');
const cookieParser = require("cookie-parser")
const cartRoute = require("./routes/cart.route");


const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/cart", cartRoute);

module.exports = app;