const Waitlist = require("../models/Waitlist");
const Table = require("../models/Table");
const Hotel = require("../models/Hotel");
const { broadcastKDSUpdate } = require("./kdsController");

// In-memory Waitlist Hall Display SSE Clients
let waitlistHallClients = [];

const broadcastWaitlistSSE = (hotelId, data) => {
  const hId = hotelId ? hotelId.toString() : "";
  // 1. Broadcast to public Hall Display SSE clients for this hotel
  waitlistHallClients.forEach((client) => {
    if (client.hotelId === hId) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        console.error("Error writing to waitlist hall SSE client:", e);
      }
    }
  });

  // 2. Also broadcast to staff KDS stream clients
  try {
    broadcastKDSUpdate(hotelId, { type: "waitlist_updated", ...data });
  } catch (e) {}
};

exports.broadcastWaitlistSSE = broadcastWaitlistSSE;

// Helper: Get start and end of current day (midnight to midnight)
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Customer joins live waiting queue via QR scan
// @route   POST /api/public/waitlist/join
// @access  Public
exports.joinPublicWaitlist = async (req, res) => {
  try {
    const { hotelId, customerName, customerMobile, guestsCount, notes } = req.body;

    if (!hotelId || !customerName || !customerMobile) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID, customer name, and mobile number are required.",
      });
    }

    const cleanMobile = String(customerMobile).trim();
    const partySize = Number(guestsCount) > 0 ? Number(guestsCount) : 2;
    const { start, end } = getTodayRange();

    // Check if this mobile number already has an active waiting or called token today
    const existing = await Waitlist.findOne({
      hotelId,
      customerMobile: cleanMobile,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: start, $lte: end },
    });

    if (existing) {
      // Calculate current position ahead
      const positionAhead = await Waitlist.countDocuments({
        hotelId,
        status: { $in: ["waiting", "called"] },
        createdAt: { $gte: start, $lte: end },
        tokenSequence: { $lt: existing.tokenSequence },
      });

      const waitlistObj = {
        ...existing.toObject(),
        positionAhead: existing.status === "waiting" ? positionAhead : 0,
        estimatedWaitMinutes: Math.max(5, (positionAhead + 1) * 10),
      };

      return res.status(200).json({
        success: true,
        isExisting: true,
        message: `You already have an active queue token: ${existing.tokenNo}`,
        data: {
          waitlist: waitlistObj,
          positionAhead: existing.status === "waiting" ? positionAhead : 0,
          estimatedWaitMinutes: Math.max(5, (positionAhead + 1) * 10),
        },
      });
    }

    // Determine today's sequential token number
    const lastTodayToken = await Waitlist.findOne({
      hotelId,
      createdAt: { $gte: start, $lte: end },
    }).sort({ tokenSequence: -1 });

    const tokenSequence = lastTodayToken ? lastTodayToken.tokenSequence + 1 : 1;
    const tokenNo = `W-${tokenSequence}`;

    // Current position ahead when joining: count waiting & called entries ahead
    const positionAhead = await Waitlist.countDocuments({
      hotelId,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: start, $lte: end },
    });

    const estimatedWaitMinutes = Math.max(5, (positionAhead + 1) * 10);

    const waitlistEntry = await Waitlist.create({
      hotelId,
      tokenNo,
      tokenSequence,
      customerName: customerName.trim(),
      customerMobile: cleanMobile,
      guestsCount: partySize,
      notes: notes ? notes.trim() : "",
      estimatedWaitMinutes,
      status: "waiting",
    });

    broadcastWaitlistSSE(hotelId, {
      type: "waitlist_updated",
      action: "new_token",
      tokenNo: waitlistEntry.tokenNo,
      customerName: waitlistEntry.customerName,
      guestsCount: waitlistEntry.guestsCount,
      entry: waitlistEntry,
    });

    const waitlistObj = {
      ...waitlistEntry.toObject(),
      positionAhead,
      estimatedWaitMinutes,
    };

    res.status(201).json({
      success: true,
      message: `Queue token ${tokenNo} generated successfully!`,
      data: {
        waitlist: waitlistObj,
        positionAhead,
        estimatedWaitMinutes,
      },
    });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get live queue status for a customer's token
// @route   GET /api/public/waitlist/status/:id
// @access  Public
exports.getPublicWaitlistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { hotelId, mobile } = req.query;
    const { start, end } = getTodayRange();

    let entry = null;

    if (id && id.length === 24) {
      entry = await Waitlist.findById(id);
    } else if (hotelId && mobile) {
      entry = await Waitlist.findOne({
        hotelId,
        customerMobile: String(mobile).trim(),
        createdAt: { $gte: start, $lte: end },
      }).sort({ createdAt: -1 });
    }

    if (!entry) {
      return res.status(404).json({ success: false, message: "Queue token not found." });
    }

    // Count people ahead who are still waiting or called
    const positionAhead = await Waitlist.countDocuments({
      hotelId: entry.hotelId,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: start, $lte: end },
      tokenSequence: { $lt: entry.tokenSequence },
    });

    const waitlistObj = {
      ...entry.toObject(),
      positionAhead: entry.status === "waiting" ? positionAhead : 0,
      estimatedWaitMinutes: Math.max(5, (positionAhead + 1) * 10),
    };

    res.status(200).json({
      success: true,
      data: {
        waitlist: waitlistObj,
        positionAhead: entry.status === "waiting" ? positionAhead : 0,
        estimatedWaitMinutes: Math.max(5, (positionAhead + 1) * 10),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public hotel waiting queue summary (for display or portal)
// @route   GET /api/public/waitlist/summary/:hotelId
// @access  Public
exports.getHotelPublicQueueSummary = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { start, end } = getTodayRange();

    const waitingCount = await Waitlist.countDocuments({
      hotelId,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: start, $lte: end },
    });

    const calledCount = await Waitlist.countDocuments({
      hotelId,
      status: "called",
      createdAt: { $gte: start, $lte: end },
    });

    const currentlyCalled = await Waitlist.find({
      hotelId,
      status: "called",
      createdAt: { $gte: start, $lte: end },
    })
      .select("tokenNo customerName assignedTableNo calledAt guestsCount")
      .sort({ calledAt: -1 })
      .limit(3);

    // Total tables occupied vs available
    const totalTables = await Table.countDocuments({ hotelId });
    const occupiedTables = await Table.countDocuments({ hotelId, status: "Occupied" });
    const availableTables = await Table.countDocuments({ hotelId, status: "Available" });

    res.status(200).json({
      success: true,
      data: {
        waitingCount,
        calledCount,
        currentlyCalled,
        totalTables,
        occupiedTables,
        availableTables,
        isFull: totalTables > 0 && availableTables === 0,
        estimatedWaitPerParty: 12, // in minutes
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel waitlist entry by customer
// @route   POST /api/public/waitlist/:id/cancel
// @access  Public
exports.cancelPublicWaitlist = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Waitlist.findById(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Queue entry not found." });
    }

    if (entry.status === "seated") {
      return res.status(400).json({ success: false, message: "Guest is already seated." });
    }

    entry.status = "cancelled";
    await entry.save();

    broadcastWaitlistSSE(entry.hotelId, {
      type: "waitlist_updated",
      action: "cancelled",
      tokenNo: entry.tokenNo,
      entry,
    });

    res.status(200).json({ success: true, message: "Queue token cancelled successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// HOTEL ADMIN & STAFF PROTECTED CONTROLLERS
// ==========================================

// @desc    Get waitlist entries for hotel (Active Waiting, Called, and Today's History)
// @route   GET /api/public/admin/waitlist
// @access  Private (Staff / Hotel Admin)
exports.getAdminWaitlist = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { start, end } = getTodayRange();

    const activeWaitlist = await Waitlist.find({
      hotelId,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    const completedWaitlist = await Waitlist.find({
      hotelId,
      status: { $in: ["seated", "cancelled", "no_show"] },
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ updatedAt: -1 })
      .limit(30);

    // Also get currently available tables for immediate seating dropdown
    const availableTables = await Table.find({
      hotelId,
      status: "Available",
    }).sort({ tableNo: 1 });

    res.status(200).json({
      success: true,
      data: {
        active: activeWaitlist,
        completed: completedWaitlist,
        availableTables,
        waitingCount: activeWaitlist.filter((w) => w.status === "waiting").length,
        calledCount: activeWaitlist.filter((w) => w.status === "called").length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Call waiting guest ("Your table is ready")
// @route   PUT /api/public/admin/waitlist/:id/call
// @access  Private
exports.callWaitlistGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNo, tableId } = req.body;
    const hotelId = req.user.hotelId;

    const entry = await Waitlist.findOne({ _id: id, hotelId });
    if (!entry) {
      return res.status(404).json({ success: false, message: "Waitlist entry not found." });
    }

    entry.status = "called";
    entry.calledAt = new Date();
    if (tableNo) entry.assignedTableNo = String(tableNo).trim();
    if (tableId) entry.assignedTableId = tableId;

    await entry.save();

    broadcastWaitlistSSE(hotelId, {
      type: "waitlist_updated",
      action: "called",
      tokenNo: entry.tokenNo,
      customerName: entry.customerName,
      assignedTableNo: entry.assignedTableNo,
      guestsCount: entry.guestsCount,
      entry,
    });

    res.status(200).json({
      success: true,
      message: `Guest ${entry.customerName} (Token ${entry.tokenNo}) has been called!`,
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seat guest on table and mark table Occupied
// @route   PUT /api/public/admin/waitlist/:id/seat
// @access  Private
exports.seatWaitlistGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNo, tableId } = req.body;
    const hotelId = req.user.hotelId;

    const entry = await Waitlist.findOne({ _id: id, hotelId });
    if (!entry) {
      return res.status(404).json({ success: false, message: "Waitlist entry not found." });
    }

    let targetTable = null;
    if (tableId) {
      targetTable = await Table.findOne({ _id: tableId, hotelId });
    } else if (tableNo) {
      targetTable = await Table.findOne({ tableNo: String(tableNo).trim(), hotelId });
    } else if (entry.assignedTableNo) {
      targetTable = await Table.findOne({ tableNo: entry.assignedTableNo, hotelId });
    }

    if (!targetTable) {
      return res.status(400).json({
        success: false,
        message: "Please select an available table to seat the guest.",
      });
    }

    // Mark table as occupied
    targetTable.status = "Occupied";
    await targetTable.save();

    entry.status = "seated";
    entry.seatedAt = new Date();
    entry.assignedTableNo = targetTable.tableNo;
    entry.assignedTableId = targetTable._id;
    await entry.save();

    broadcastWaitlistSSE(hotelId, {
      type: "waitlist_updated",
      action: "seated",
      tokenNo: entry.tokenNo,
      customerName: entry.customerName,
      tableNo: targetTable.tableNo,
      entry,
    });

    res.status(200).json({
      success: true,
      message: `Guest ${entry.customerName} seated at Table ${targetTable.tableNo}!`,
      data: {
        waitlist: entry,
        table: targetTable,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Staff adds walk-in customer directly into queue
// @route   POST /api/public/admin/waitlist/manual
// @access  Private
exports.addManualWaitlist = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { customerName, customerMobile, guestsCount, notes, assignedTableNo } = req.body;

    if (!customerName || !customerMobile) {
      return res.status(400).json({
        success: false,
        message: "Customer name and mobile number are required.",
      });
    }

    const { start, end } = getTodayRange();

    const lastTodayToken = await Waitlist.findOne({
      hotelId,
      createdAt: { $gte: start, $lte: end },
    }).sort({ tokenSequence: -1 });

    const tokenSequence = lastTodayToken ? lastTodayToken.tokenSequence + 1 : 1;
    const tokenNo = `W-${tokenSequence}`;

    const positionAhead = await Waitlist.countDocuments({
      hotelId,
      status: "waiting",
      createdAt: { $gte: start },
    });

    const entry = await Waitlist.create({
      hotelId,
      tokenNo,
      tokenSequence,
      customerName: customerName.trim(),
      customerMobile: String(customerMobile).trim(),
      guestsCount: Number(guestsCount) || 2,
      notes: notes ? notes.trim() : "",
      assignedTableNo: assignedTableNo || "",
      estimatedWaitMinutes: Math.max(10, (positionAhead + 1) * 12),
      status: "waiting",
    });

    broadcastWaitlistSSE(hotelId, {
      type: "waitlist_updated",
      action: "new_token",
      tokenNo: entry.tokenNo,
      customerName: entry.customerName,
      guestsCount: entry.guestsCount,
      entry,
    });

    res.status(201).json({
      success: true,
      message: `Walk-in Guest added! Token #${tokenNo}`,
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update waitlist status (e.g. no_show, cancelled)
// @route   PUT /api/public/admin/waitlist/:id/status
// @access  Private
exports.updateWaitlistStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hotelId = req.user.hotelId;

    if (!["waiting", "called", "seated", "cancelled", "no_show"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const entry = await Waitlist.findOne({ _id: id, hotelId });
    if (!entry) {
      return res.status(404).json({ success: false, message: "Waitlist entry not found." });
    }

    entry.status = status;
    await entry.save();

    broadcastWaitlistSSE(hotelId, {
      type: "waitlist_updated",
      action: status,
      tokenNo: entry.tokenNo,
      entry,
    });

    res.status(200).json({
      success: true,
      message: `Waitlist entry updated to ${status}.`,
      data: entry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Waitlist data for Hall Display Board (public or staff)
// @route   GET /api/public/waitlist/display/:hotelId
// @access  Public
exports.getPublicWaitlistDisplay = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { start, end } = getTodayRange();

    let hotel = await Hotel.findById(hotelId).select("name email phone address city state logo");
    if (!hotel) {
      const User = require("../models/User");
      const u = await User.findById(hotelId).select("name hotelName address hotelLogo city");
      if (u) {
        hotel = {
          _id: u._id,
          name: u.hotelName || u.name,
          logo: u.hotelLogo,
          address: u.address,
          city: u.city,
        };
      }
    }

    const activeWaitlist = await Waitlist.find({
      hotelId,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: start, $lte: end },
    }).sort({ createdAt: 1 });

    const completedWaitlist = await Waitlist.find({
      hotelId,
      status: "seated",
      createdAt: { $gte: start, $lte: end },
    })
      .sort({ updatedAt: -1 })
      .limit(10);

    const totalTables = await Table.countDocuments({ hotelId });
    const occupiedTables = await Table.countDocuments({ hotelId, status: "Occupied" });
    const availableTables = await Table.countDocuments({ hotelId, status: "Available" });

    res.status(200).json({
      success: true,
      data: {
        hotel,
        active: activeWaitlist,
        called: activeWaitlist.filter((w) => w.status === "called"),
        waiting: activeWaitlist.filter((w) => w.status === "waiting"),
        completed: completedWaitlist,
        waitingCount: activeWaitlist.filter((w) => w.status === "waiting").length,
        calledCount: activeWaitlist.filter((w) => w.status === "called").length,
        totalTables,
        occupiedTables,
        availableTables,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Live SSE stream for Waitlist Hall Display (Public TV screens)
// @route   GET /api/public/waitlist-stream/:hotelId
// @access  Public
exports.streamPublicWaitlist = (req, res) => {
  const { hotelId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", message: "Listening for Waitlist Live Queue updates" })}\n\n`);

  const client = { id: Date.now(), res, hotelId: String(hotelId || "") };
  waitlistHallClients.push(client);

  req.on("close", () => {
    waitlistHallClients = waitlistHallClients.filter((c) => c.id !== client.id);
  });
};
