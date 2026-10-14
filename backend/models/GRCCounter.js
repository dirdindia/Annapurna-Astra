const mongoose = require("mongoose");

const grcCounterSchema = new mongoose.Schema({
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true
    },
  name: {
    type: String,
    required: true
  },
  sequence_value: {
    type: Number,
    required: true,
    default: 1
  }
});

module.exports = mongoose.model("GRCCounter", grcCounterSchema);
