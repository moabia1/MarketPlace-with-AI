require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");

connectDB();
app.listen(3001, () => {
  console.log("Server running on port");
});
