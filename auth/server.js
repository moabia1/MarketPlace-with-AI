const app = require("./src/app")
require("dotenv").config()
const connectDb = require("./src/db/db");

connectDb()
app.listen(3000, () => {
  console.log("Server running on port 3000")
})