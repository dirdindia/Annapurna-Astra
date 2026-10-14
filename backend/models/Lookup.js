const mongoose = require("mongoose");

const LookupSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    name: {
      type: String,
      required: [true, "Lookup name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Lookup type is required"],
      enum: ["INVENTORY_ITEM", "DISH_CATEGORY", "OTHER"],
      default: "OTHER",
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lookup",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lookup", LookupSchema);
