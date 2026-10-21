const mongoose = require("mongoose");

const waitlistSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    tokenNo: {
      type: String, // e.g. "W-1", "W-2"
      required: true,
    },
    tokenSequence: {
      type: Number,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerMobile: {
      type: String,
      required: true,
      trim: true,
    },
    guestsCount: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
    },
    status: {
      type: String,
      enum: ["waiting", "called", "seated", "cancelled", "no_show"],
      default: "waiting",
    },
    assignedTableNo: {
      type: String,
      default: "",
    },
    assignedTableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 15,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    seatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rapid lookups per hotel by date & status
waitlistSchema.index({ hotelId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Waitlist", waitlistSchema);
