const mongoose = require("mongoose");

async function connectToDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected")
  } catch (error) {
    console.log("Database connection error : ",error)
  }
}

module.exports = connectToDb