const mongoose = require("mongoose");

const tableBookingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerMobile: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      default: "",
    },
    bookingDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    bookingTime: {
      type: String, // e.g. "07:30 PM"
      required: true,
    },
    guestsCount: {
      type: Number,
      required: true,
      default: 2,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    tableNo: {
      type: String,
      default: "",
    },
    specialRequests: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      paidAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TableBooking", tableBookingSchema);
