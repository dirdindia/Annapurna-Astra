const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    invoiceNumber: {
      type: String,
      unique: true,
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
    },
    items: [
      {
        dishId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    subTotal: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomBooking',
      default: null
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    status: {
      type: String,
      enum: ['Paid', 'Added to Room'],
      default: 'Paid'
    },
    taxRate: {
      type: Number,
      default: 5,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'NC Bill', 'Credit Bill', 'Added to Room', 'Room'],
      default: 'Cash'
    }
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number pre-save if not provided
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    try {
      const Hotel = mongoose.model("Hotel");
      const hotel = await Hotel.findById(this.hotelId);
      const prefix = (hotel && hotel.invoicePrefixRestaurant) ? hotel.invoicePrefixRestaurant.trim() : "REST-";
      const count = await mongoose.model("Invoice").countDocuments({ hotelId: this.hotelId });
      this.invoiceNumber = `${prefix}${1001 + count}`;
    } catch (err) {
      this.invoiceNumber = `REST-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
