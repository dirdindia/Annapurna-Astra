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
  invoiceNumber: {
    type: String,
    default: null
  },
  roomGstRate: {
    type: Number,
    default: 12
  }
}, { timestamps: true });

// Auto-generate room invoice number when checking out
roomBookingSchema.pre("save", async function (next) {
  if (!this.invoiceNumber && this.status === 'Checked-Out') {
    try {
      const Hotel = mongoose.model('Hotel');
      const hotel = await Hotel.findById(this.hotelId);
      const prefix = (hotel && hotel.invoicePrefixRoom) ? hotel.invoicePrefixRoom.trim() : "ROOM-";
      const count = await mongoose.model('RoomBooking').countDocuments({
        hotelId: this.hotelId,
        invoiceNumber: { $exists: true, $ne: null }
      });
      this.invoiceNumber = `${prefix}${1001 + count}`;
      if (this.roomGstRate === undefined && hotel && hotel.roomGstRate !== undefined) {
        this.roomGstRate = hotel.roomGstRate;
      }
    } catch (err) {
      this.invoiceNumber = `ROOM-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model('RoomBooking', roomBookingSchema);
