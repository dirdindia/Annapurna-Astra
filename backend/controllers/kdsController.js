const Order = require("../models/Order");

let clients = [];

// @desc    Connect to KDS SSE stream
// @route   GET /api/kds/stream
// @access  Private (Staff/Admin)
const streamKDSUpdates = (req, res) => {
  const hotelId = req.user.hotelId.toString();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'KDS Connected' })}\n\n`);

  const client = { id: Date.now(), res, hotelId };
  clients.push(client);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== client.id);
  });
};

// Internal function to broadcast updates to clients of a specific hotel
const broadcastKDSUpdate = (hotelId, data) => {
  clients.forEach(client => {
    if (client.hotelId === hotelId.toString()) {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  });
};

// @desc    Update Order KDS Status
// @route   PUT /api/kds/order/:orderId/status
// @access  Private (Staff)
const updateOrderKDSStatus = async (req, res) => {
  try {
    const { status } = req.body; // new, preparing, ready, delivered
    const { orderId } = req.params;

    if (!["new", "preparing", "ready", "delivered"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid KDS status" });
    }

    const order = await Order.findOne({ _id: orderId, hotelId: req.user.hotelId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.kdsStatus = status;
    await order.save();

    // Broadcast the update to KDS clients for this hotel
    broadcastKDSUpdate(req.user.hotelId, {
      type: 'kds_status_update',
      orderId: order._id,
      kdsStatus: status
    });

    // Also broadcast to customer's live SSE tracker if active
    try {
      const { broadcastCustomerOrderUpdate } = require("./publicOrderController");
      broadcastCustomerOrderUpdate(order._id, {
        type: 'kds_status_update',
        kdsStatus: status,
        order
      });
    } catch (e) {}

    res.status(200).json({ success: true, message: "KDS status updated", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active orders for KDS
// @route   GET /api/kds/orders
// @access  Private (Staff/Admin)
const getKDSOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      hotelId: req.user.hotelId,
      status: "Active",
      approvalStatus: "approved", // ONLY approved orders can show on KDS & Hall display!
      kdsStatus: { $ne: "delivered" }
    })
    .populate("table", "tableNo")
    .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge / Clear Add-on mark for an item in KDS
// @route   PUT /api/kds/order/:orderId/items/:itemId/acknowledge-addon
// @access  Private (Staff/Admin)
const acknowledgeItemAddon = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const order = await Order.findOne({ _id: orderId, hotelId: req.user.hotelId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in order" });
    }

    item.isAddon = false;
    await order.save();

    // Broadcast to KDS screens
    broadcastKDSUpdate(req.user.hotelId, {
      type: "addon_acknowledged",
      orderId: order._id,
      itemId: item._id,
    });

    res.status(200).json({ success: true, message: "Addon badge cleared", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  streamKDSUpdates,
  broadcastKDSUpdate,
  updateOrderKDSStatus,
  getKDSOrders,
  acknowledgeItemAddon,
};
