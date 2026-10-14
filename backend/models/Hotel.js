const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      default: '',
    },
    pincode: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['Hotel', 'Resort', 'Guest house', 'Restaurant only'],
      default: 'Hotel'
    },
    // Legal & Tax Compliance
    gstin: {
      type: String,
      default: '',
    },
    fssaiNumber: {
      type: String,
      default: '',
    },
    panNumber: {
      type: String,
      default: '',
    },
    tradeLicenseNumber: {
      type: String,
      default: '',
    },
    // Timings & Invoicing Rules
    checkInTime: {
      type: String,
      default: '12:00 PM',
    },
    checkOutTime: {
      type: String,
      default: '11:00 AM',
    },
    invoicePrefixRestaurant: {
      type: String,
      default: 'REST-',
    },
    invoicePrefixRoom: {
      type: String,
      default: 'ROOM-',
    },
    invoiceTerms: {
      type: String,
      default: '',
    },
    foodGstRate: {
      type: Number,
      default: 5,
    },
    roomGstRate: {
      type: Number,
      default: 12,
    },
    // Guest Policy & Operations
    idProofPolicy: {
      type: String,
      default: 'Aadhaar Card, Passport, Driving License, or Voter ID required at check-in',
    },
    // Banking & UPI Payment
    upiId: {
      type: String,
      default: '',
    },
    bankName: {
      type: String,
      default: '',
    },
    bankAccountNumber: {
      type: String,
      default: '',
    },
    bankIfscCode: {
      type: String,
      default: '',
    },
    bankAccountName: {
      type: String,
      default: '',
    },
    // Contact & Digital Presence
    receptionPhone: {
      type: String,
      default: '',
    },
    websiteUrl: {
      type: String,
      default: '',
    },
    googleMapsUrl: {
      type: String,
      default: '',
    },
    instagramUrl: {
      type: String,
      default: '',
    },
    facebookUrl: {
      type: String,
      default: '',
    },
    starRating: {
      type: String,
      default: '3-Star',
    },
    subscription: {
      plan: { type: String, enum: ['none', 'Starter', 'Growth', 'Enterprise'], default: 'none' },
      validUntil: { type: Date, default: null },
      isActive: { type: Boolean, default: false },
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hotel", hotelSchema);
