const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    name: { type: String, required: true, trim: true, unique: true },
    unit: { type: String, required: true, default: "kg" },
    currentStock: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
