const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema({
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  guests: [{
    name: { type: String },
    age: { type: Number },
    phone: { type: String },
    idType: { type: String, enum: ['Aadhar', 'PAN', 'Other'], default: 'Aadhar' },
    idNumber: { type: String },
    documentImage: { type: String, default: null },
    personPhoto: { type: String, default: null }
  }],
  advanceAmount: {
    type: Number,
    default: 0
  },
  advancePaymentMode: {
    type: String,
    default: null
  },
  finalPaymentMode: {
    type: String,
    default: null
  },
  hasGST: {
    type: Boolean,
    default: false
  },
  gstNumber: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  companyAddress: {
    type: String,
    default: ''
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  expectedCheckInDate: {
    type: Date,
    default: null
  },
  expectedCheckOutDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Checked-In', 'Checked-Out', 'Advance-Booked'],
    default: 'Checked-In'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  restaurantBills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

}, { timestamps: true });

module.exports = mongoose.model('RoomBooking', roomBookingSchema);
