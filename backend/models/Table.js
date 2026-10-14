const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    tableNo: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: false,
      default: 0,
    },
    type: {
      type: String,
      enum: ["Table", "Cabin"],
      default: "Table",
    },
    status: {
      type: String,
      enum: ["Available", "Occupied"],
      default: "Available",
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

tableSchema.index({ hotelId: 1, tableNo: 1 }, { unique: true });

module.exports = mongoose.model("Table", tableSchema);
