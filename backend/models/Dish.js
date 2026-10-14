const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    dishId: {
      type: String,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String, // Cloudinary Image URL
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
    available: {
      type: Boolean,
      default: true,
    },
    recipe: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryItem",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: {
          type: String,
          default: "kg",
        },
      }
    ],

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Dish", dishSchema);
