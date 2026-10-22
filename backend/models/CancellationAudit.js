const mongoose = require("mongoose");

const cancellationAuditSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderDisplayId: {
      type: String,
      default: "",
    },
    tableNo: {
      type: String,
      default: "N/A",
    },
    orderType: {
      type: String,
      default: "Table",
    },
    cancelledItems: [
      {
        dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        printedQuantity: { type: Number, default: 0 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    cancellationType: {
      type: String,
      enum: ["full_order", "item_void"],
      default: "full_order",
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cashierName: {
      type: String,
      default: "Staff",
    },
    reason: {
      type: String,
      default: "Not specified",
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending_otp", "approved", "rejected"],
      default: "pending_otp",
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CancellationAudit", cancellationAuditSchema);
