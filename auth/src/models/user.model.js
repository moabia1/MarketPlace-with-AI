const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  fullName: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    }
  },
  role: {
    type: String,
    enum: ["user", "seller"],
    default:"user",
  },
  addresses: [
    {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    }
  ]
});
