const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: false,
    },
    orderType: {
      type: String,
      enum: ["Table", "Swiggy", "Zomato", "Parcel"],
      default: "Table",
    },
    orderDisplayId: {
      type: String,
    },
    items: [
      {
        dishId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
          required: true,
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
        printedQuantity: {
          type: Number,
          default: 0,
        },
        category: {
          type: String,
        },
        isAddon: {
          type: Boolean,
          default: false,
        },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Billed"],
      default: "Active",
    },
    kdsStatus: {
      type: String,
      enum: ["new", "preparing", "ready", "delivered"],
      default: "new",
    },
    subTotal: {
      type: Number,
      default: 0,
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
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
    paymentMode: {
      type: String,
      default: null,
    },
    customerName: {
      type: String,
      default: null,
    },
    customerMobile: {
      type: String,
      default: null,
    },
    customerEmail: {
      type: String,
      default: null,
    },
    tableNo: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["POS", "QR_SCAN"],
      default: "POS",
    },
    approvalStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    paymentDetails: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    pendingAddons: [
      {
        items: [
          {
            dishId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Dish",
              required: true,
            },
            name: String,
            price: Number,
            quantity: Number,
            category: String,
          },
        ],
        subTotal: Number,
        tax: Number,
        grandTotal: Number,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
