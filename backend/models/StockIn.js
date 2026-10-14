const mongoose = require("mongoose");

const stockInSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    supplierName: { type: String, trim: true },
    batchId: { type: String }, // To group multiple items from one invoice
    invoiceUrl: { type: String }, // Cloudinary URL
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockIn", stockInSchema);
