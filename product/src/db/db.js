const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("MongoDb Connected")
  } catch (error) {
    console.log("Database connection error ",error)
  }
}

module.exports = connectDB