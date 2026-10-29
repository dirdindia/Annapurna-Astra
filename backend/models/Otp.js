const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      default: "password_reset",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto delete after expiry
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Otp", otpSchema);

