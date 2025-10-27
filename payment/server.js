require("dotenv").config();
const app = require("./src/app")
const connectToDB = require("./src/db/db")


connectToDB()
app.listen(3004, () => {
  console.log("Payment server running on port 3004")
})