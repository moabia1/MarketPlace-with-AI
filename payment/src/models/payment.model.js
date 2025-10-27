const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  paymentId: {
    type: String
  },
  orderId: {
    type: String,
    required: true
  },
  signature: {
    type:String
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default:"pending"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required:true
  }
}, {
  timestamps:true
})

const payment = mongoose.model("payment", paymentSchema);
module.exports = payment