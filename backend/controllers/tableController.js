const Table = require("../models/Table");
const Order = require("../models/Order");

// @desc    Create a table
// @route   POST /api/tables
// @access  Admin
exports.createTable = async (req, res) => {
  try {
    const { tableNo, capacity, type } = req.body;

    const existingTable = await Table.findOne({ tableNo, hotelId: req.user.hotelId });
    if (existingTable) {
      return res.status(400).json({ success: false, message: "Table already exists" });
    }

    const table = await Table.create({ hotelId: req.user.hotelId, tableNo, capacity: capacity || 0, type: type || "Table" });
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find({ hotelId: req.user.hotelId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Admin
exports.updateTable = async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate({ _id: req.params.id, hotelId: req.user.hotelId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found or unauthorized" });
    }

    res.status(200).json({ success: true, data: table });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Admin
exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findOne({ _id: req.params.id, hotelId: req.user.hotelId });

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found or unauthorized" });
    }

    // Check if table is occupied
    if (table.status === "Occupied") {
      return res.status(400).json({ success: false, message: "Cannot delete an occupied table" });
    }

    await table.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
