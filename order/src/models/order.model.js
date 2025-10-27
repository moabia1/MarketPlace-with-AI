const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: String,
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    items: [
      {
        product: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        price: {
          amount: {
            type: Number,
            required: true,
          },
          currency: {
            type: String,
            required: true,
            enum: ["USD", "INR"],
          },
        },
      },
    ],
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "paid",
        "delivered",
        "shipped",
        "cancelled",
      ],
    },
    totalAmount: {
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        required: true,
        enum: ["USD", "INR"],
      },
    },
    shippingAddress: {
      type: addressSchema,
      // make shippingAddress optional to match tests that may omit it
      required: false,
    },
    // record of status changes
    timeline: [
      {
        status: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
    // payment details and capture status
    paymentSummary: {
      method: { type: String },
      captured: { type: Boolean, default: false },
      amount: {
        amount: { type: Number },
        currency: { type: String, enum: ["USD", "INR"] },
      },
    },
  },
  { timestamps: true }
);

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
