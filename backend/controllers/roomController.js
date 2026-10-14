const Room = require('../models/Room');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ hotelId: req.user.hotelId });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private/Admin
exports.createRoom = async (req, res) => {
  try {
    const { roomNumber, type, price, beds } = req.body;

    const roomExists = await Room.findOne({ roomNumber, hotelId: req.user.hotelId });
    if (roomExists) {
      return res.status(400).json({ success: false, message: 'Room number already exists' });
    }

    const room = await Room.create({
      hotelId: req.user.hotelId,
      roomNumber,
      type,
      price,
      beds: beds || 1
    });

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, hotelId: req.user.hotelId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or unauthorized' });
    }

    room.roomNumber = req.body.roomNumber || room.roomNumber;
    room.type = req.body.type || room.type;
    room.price = req.body.price || room.price;
    room.status = req.body.status || room.status;
    room.beds = req.body.beds || room.beds;

    const updatedRoom = await room.save();
    res.json({ success: true, data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, hotelId: req.user.hotelId });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found or unauthorized' });
    }

    await Room.deleteOne({ _id: room._id });
    res.json({ success: true, message: 'Room removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
