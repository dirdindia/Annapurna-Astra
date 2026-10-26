const axios = require("axios");
const Order = require("../models/Order");
const Table = require("../models/Table");
const Invoice = require("../models/Invoice");
const Dish = require("../models/Dish");
const InventoryItem = require("../models/InventoryItem");
const RoomBooking = require("../models/RoomBooking");
const Hotel = require("../models/Hotel");
const CancellationAudit = require("../models/CancellationAudit");
const { broadcastKDSUpdate } = require("./kdsController");
const {
  sendCancelAlertOtp,
  sendCancelApprovedNotification,
  sendTestAlert,
} = require("../services/telegramService");

// Helper to preserve printed quantities when updating items
const mergeItemsWithPrintedQty = (existingItems = [], newItems = []) => {
  return newItems.map((newItem) => {
    const rawDishId = newItem.dishId?._id || newItem.dishId;
    const existing = existingItems.find(
      (ei) => (ei.dishId?._id || ei.dishId)?.toString() === rawDishId?.toString()
    );
    return {
      ...newItem,
      printedQuantity:
        newItem.printedQuantity !== undefined
          ? newItem.printedQuantity
          : existing?.printedQuantity || 0,
    };
  });
};

// @desc    Create or update order
// @route   POST /api/orders
// @access  Private (Staff)
exports.createOrUpdateOrder = async (req, res) => {
  try {
    const { tableId, items, subTotal, tax, grandTotal, orderType, orderId, roomBookingId } = req.body;
    
    const type = orderType || "Table";

    let order;

    if (type === "Table") {
      let table = await Table.findOne({ _id: tableId, hotelId: req.user.hotelId });
      if (!table) {
        return res.status(404).json({ success: false, message: "Table not found" });
      }

      if (table.currentOrderId) {
        order = await Order.findOne({ _id: table.currentOrderId, hotelId: req.user.hotelId });
        if (order) {
          order.items = mergeItemsWithPrintedQty(order.items, items);
          order.subTotal = subTotal;
          order.tax = tax;
          order.grandTotal = grandTotal;
          await order.save();
        } else {
          order = await Order.create({
            hotelId: req.user.hotelId,
            table: tableId,
            orderType: type,
            items,
            subTotal,
            tax,
            grandTotal,
            createdBy: req.user._id,
          });
          table.currentOrderId = order._id;
          table.status = "Occupied";
          await table.save();
        }
      } else {
        order = await Order.create({
          hotelId: req.user.hotelId,
          table: tableId,
          orderType: type,
          items,
          subTotal,
          tax,
          grandTotal,
          createdBy: req.user._id,
        });
        table.currentOrderId = order._id;
        table.status = "Occupied";
        await table.save();
      }
    } else {
      // Virtual Order (Swiggy, Zomato, Parcel)
      if (orderId) {
        // Update existing virtual order
        order = await Order.findOne({ _id: orderId, hotelId: req.user.hotelId });
        if (order) {
          order.items = mergeItemsWithPrintedQty(order.items, items);
          order.subTotal = subTotal;
          order.tax = tax;
          order.grandTotal = grandTotal;
          await order.save();
        }
      } else {
        // Create new virtual order
        let displayId;
        if (type === "Room" && roomBookingId) {
          const booking = await RoomBooking.findById(roomBookingId).populate("room");
          const rNum = booking?.room?.roomNumber || "Guest";
          displayId = `Room ${rNum}`;
        } else {
          const count = await Order.countDocuments({ orderType: type, hotelId: req.user.hotelId });
          let prefix = "PAR";
          if (type === "Swiggy") prefix = "SW";
          if (type === "Zomato") prefix = "ZOM";
          if (type === "Room") prefix = "ROOM";
          displayId = `${prefix}-${count + 1}`;
        }
        
        order = await Order.create({
          hotelId: req.user.hotelId,
          orderType: type,
          orderDisplayId: displayId,
          roomBookingId: roomBookingId || null,
          items,
          subTotal,
          tax,
          grandTotal,
          createdBy: req.user._id,
        });
      }
    }

    // Broadcast to KDS that a new order or update happened
    broadcastKDSUpdate(req.user.hotelId, { type: 'new_order' });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active order for a table
// @route   GET /api/orders/active/:tableId
// @access  Private
exports.getActiveOrder = async (req, res) => {
  try {
    const table = await Table.findOne({ _id: req.params.tableId, hotelId: req.user.hotelId }).populate({
      path: "currentOrderId",
      populate: { path: "createdBy", select: "name" }
    });
    if (!table || !table.currentOrderId) {
      return res.status(200).json({ success: true, data: null });
    }
    res.status(200).json({ success: true, data: table.currentOrderId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active virtual orders (Swiggy/Zomato/Parcel)
// @route   GET /api/orders/virtual/active
// @access  Private
exports.getActiveVirtualOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      hotelId: req.user.hotelId,
      orderType: { $ne: "Table" },
      status: "Active",
      approvalStatus: "approved"
    }).populate("createdBy", "name");
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Checkout and generate bill
// @route   POST /api/orders/:orderId/checkout
// @access  Private
exports.checkoutOrder = async (req, res) => {
  try {
    const { customerName, customerMobile, customerEmail, paymentMode, discountPercentage = 0, roomBookingId } = req.body;
    
    const order = await Order.findOne({ _id: req.params.orderId, hotelId: req.user.hotelId }).populate("table");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "Billed") {
      return res.status(400).json({ success: false, message: "Order is already billed" });
    }

    const effectiveRoomBookingId = roomBookingId || order.roomBookingId;

    let cName = customerName || "Guest";
    if (order.orderType === "Table" && order.table && !customerName) {
      cName = `Table ${order.table.tableNo}`;
    } else if (order.orderType !== "Table" && !customerName) {
      cName = order.orderDisplayId;
    }

    // Fetch hotel for tax rate and prefix
    const hotel = await Hotel.findById(req.user.hotelId);
    const foodTaxRate = (hotel && hotel.foodGstRate !== undefined) ? Number(hotel.foodGstRate) : 5;

    // Calculate new totals with discount
    const discountAmount = Math.round((order.subTotal * discountPercentage / 100) * 100) / 100;
    const newTax = Math.round(((order.subTotal - discountAmount) * (foodTaxRate / 100)) * 100) / 100;
    const newGrandTotal = Math.round((order.subTotal - discountAmount + newTax) * 100) / 100;

    let invoiceStatus = "Paid";
    if (effectiveRoomBookingId || order.orderType === "Room") {
      invoiceStatus = "Added to Room";
    }

    // Create Invoice
    const invoice = await Invoice.create({
      hotelId: req.user.hotelId,
      customerName: cName,
      customerMobile: customerMobile || "N/A",
      customerEmail: customerEmail || "",
      paymentMode: paymentMode || (invoiceStatus === "Added to Room" ? "Room" : "Cash"),
      items: order.items,
      subTotal: order.subTotal,
      discountPercentage,
      discountAmount,
      tax: newTax,
      taxRate: foodTaxRate,
      grandTotal: newGrandTotal,
      createdBy: req.user._id,
      tableId: order.table ? order.table._id : null,
      orderId: order._id,
      roomBookingId: effectiveRoomBookingId || null,
      status: invoiceStatus,
    });

    if (effectiveRoomBookingId) {
      await RoomBooking.findOneAndUpdate(
        { _id: effectiveRoomBookingId },
        { $push: { restaurantBills: invoice._id } }
      );
    }

    // Update Order
    order.status = "Billed";
    order.paymentMode = paymentMode || "Cash";
    order.customerName = cName;
    order.discountPercentage = discountPercentage;
    order.discountAmount = discountAmount;
    order.tax = newTax;
    order.grandTotal = newGrandTotal;
    if (customerMobile) {
      order.customerMobile = customerMobile;
    }
    if (customerEmail) {
      order.customerEmail = customerEmail;
    }
    await order.save();

    // Deduct stock for ingredients based on the recipe
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const dish = await Dish.findById(item.dishId);
        if (dish && dish.recipe && dish.recipe.length > 0) {
          for (const recipeItem of dish.recipe) {
            const inventoryItem = await InventoryItem.findById(recipeItem.item);
            if (inventoryItem) {
              inventoryItem.currentStock -= (recipeItem.quantity * item.quantity);
              await inventoryItem.save();
            }
          }
        }
      }
    }

    // Free the table if applicable
    if (order.orderType === "Table" && order.table) {
      const table = await Table.findOne({ _id: order.table._id, hotelId: req.user.hotelId });
      if (table) {
        table.status = "Available";
        table.currentOrderId = null;
        await table.save();
      }
      // Also ensure any other lingering active orders on this table are archived as Billed
      await Order.updateMany(
        { hotelId: req.user.hotelId, table: order.table._id, status: "Active" },
        { $set: { status: "Billed" } }
      );
    }

    // Broadcast update that order has been billed
    broadcastKDSUpdate(req.user.hotelId, { type: 'order_billed', orderId: order._id });

    // Also broadcast to customer's live SSE tracker if active
    try {
      const { broadcastCustomerOrderUpdate } = require("./publicOrderController");
      broadcastCustomerOrderUpdate(order._id, {
        type: 'order_billed',
        status: 'Billed',
        message: 'Order billed successfully. Thank you for dining with us!'
      });
    } catch (e) {}

    const invoiceObj = invoice.toObject();
    if (order.table) {
      invoiceObj.tableNo = order.table.tableNo;
    }

    res.status(200).json({ success: true, data: invoiceObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (admin reports)
// @route   GET /api/orders/all
// @access  Private (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || "";
    const paymentMode = req.query.paymentMode || "";
    const orderType = req.query.orderType || "";
    const status = req.query.status || "";
    const source = req.query.source || "";
    const fromDate = req.query.fromDate || "";
    const toDate = req.query.toDate || "";
    
    let query = { hotelId: req.user.hotelId };
    if (search) {
      query.$or = [
        { orderDisplayId: { $regex: search, $options: "i" } },
        { orderType: { $regex: search, $options: "i" } }
      ];
    }
    if (paymentMode) {
      query.paymentMode = paymentMode;
    }
    if (orderType) {
      query.orderType = orderType;
    }
    if (status) {
      query.status = status;
    }
    if (source) {
      query.source = source;
    }
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
      }
      if (toDate) {
        query.createdAt.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
      }
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate("table")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: orders,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request KOT cancellation (Triggers Anti-Theft Telegram Alert & OTP if required)
// @route   POST /api/orders/:orderId/request-cancel
// @access  Private (Staff/Admin)
exports.requestCancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, hotelId: req.user.hotelId }).populate("table");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "Billed") {
      return res.status(400).json({ success: false, message: "Cannot cancel an already billed order" });
    }

    const hotel = await Hotel.findById(req.user.hotelId);
    const tableNo = order.table ? `Table ${order.table.tableNo}` : (order.orderDisplayId || order.orderType || "Takeaway");

    // Check if any item in the order has already been printed in kitchen
    const hasPrintedItems = order.items.some((item) => (item.printedQuantity || 0) > 0);
    const antiTheftActive = Boolean(hotel?.antiTheftOtpRequired && hotel?.telegramAlertsEnabled && hotel?.telegramChatId);

    // If items were printed OR anti-theft OTP is strictly enforced with telegram configured:
    if ((hasPrintedItems || hotel?.antiTheftOtpRequired) && antiTheftActive) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min validity

      const audit = await CancellationAudit.create({
        hotelId: req.user.hotelId,
        orderId: order._id,
        orderDisplayId: order.orderDisplayId || "",
        tableNo,
        orderType: order.orderType,
        cancelledItems: order.items,
        totalAmount: order.subTotal || 0,
        cancellationType: "full_order",
        cancelledBy: req.user._id,
        cashierName: req.user.name || "Cashier",
        reason: reason || "KOT Cancellation Attempt",
        otp,
        otpExpiresAt,
        status: "pending_otp",
      });

      // Send Instant Telegram Notification & OTP to Owner
      const tgResult = await sendCancelAlertOtp({
        chatId: hotel.telegramChatId,
        hotelName: hotel.name,
        tableOrOrder: tableNo,
        items: order.items,
        totalAmount: order.subTotal || 0,
        cashierName: req.user.name || "Cashier",
        reason: reason || "Customer refused / mistake",
        otp,
        cancellationType: "full_order",
      });

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        auditId: audit._id,
        tableNo,
        totalAmount: order.subTotal,
        message: "Anti-Theft Protection Active: OTP has been sent to Owner's Telegram.",
        telegramDelivered: tgResult.success,
      });
    }

    // Direct Cancellation (if no printed items or no Telegram configured)
    await CancellationAudit.create({
      hotelId: req.user.hotelId,
      orderId: order._id,
      orderDisplayId: order.orderDisplayId || "",
      tableNo,
      orderType: order.orderType,
      cancelledItems: order.items,
      totalAmount: order.subTotal || 0,
      cancellationType: "full_order",
      cancelledBy: req.user._id,
      cashierName: req.user.name || "Cashier",
      reason: reason || "KOT Cancelled (Direct)",
      status: "approved",
      approvedAt: new Date(),
    });

    if (order.orderType === "Table" && order.table) {
      const table = await Table.findOne({ _id: order.table._id || order.table, hotelId: req.user.hotelId });
      if (table && table.currentOrderId?.toString() === order._id.toString()) {
        table.status = "Available";
        table.currentOrderId = null;
        await table.save();
      }
    }

    await Order.deleteOne({ _id: order._id });
    broadcastKDSUpdate(req.user.hotelId, { type: "order_cancelled" });

    return res.status(200).json({
      success: true,
      requiresOtp: false,
      message: "Order cancelled successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and finalize KOT cancellation
// @route   POST /api/orders/:orderId/verify-cancel
// @access  Private (Staff/Admin)
exports.verifyCancelOrder = async (req, res) => {
  try {
    const { auditId, otp } = req.body;
    if (!auditId || !otp) {
      return res.status(400).json({ success: false, message: "Audit ID and OTP are required" });
    }

    const audit = await CancellationAudit.findOne({
      _id: auditId,
      hotelId: req.user.hotelId,
      status: "pending_otp",
    });

    if (!audit) {
      return res.status(404).json({ success: false, message: "Cancellation request expired or already processed" });
    }

    if (new Date() > new Date(audit.otpExpiresAt)) {
      audit.status = "rejected";
      await audit.save();
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (audit.otp.trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP. Please enter the valid code sent to Owner's Telegram." });
    }

    const order = await Order.findOne({ _id: req.params.orderId, hotelId: req.user.hotelId }).populate("table");
    if (order) {
      if (order.orderType === "Table" && order.table) {
        const table = await Table.findOne({ _id: order.table._id || order.table, hotelId: req.user.hotelId });
        if (table && table.currentOrderId?.toString() === order._id.toString()) {
          table.status = "Available";
          table.currentOrderId = null;
          await table.save();
        }
      }
      await Order.deleteOne({ _id: order._id });
    }

    audit.status = "approved";
    audit.approvedAt = new Date();
    await audit.save();

    // Send Confirmation to Owner Telegram
    const hotel = await Hotel.findById(req.user.hotelId);
    if (hotel?.telegramChatId) {
      await sendCancelApprovedNotification({
        chatId: hotel.telegramChatId,
        hotelName: hotel.name,
        tableOrOrder: audit.tableNo,
        totalAmount: audit.totalAmount,
        cashierName: audit.cashierName,
        reason: audit.reason,
      });
    }

    broadcastKDSUpdate(req.user.hotelId, { type: "order_cancelled" });

    res.status(200).json({
      success: true,
      message: "KOT cancellation authorized and successfully processed.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request Item Void from active KOT
// @route   POST /api/orders/:orderId/request-item-void
// @access  Private (Staff/Admin)
exports.requestItemVoid = async (req, res) => {
  try {
    const { dishId, quantityToVoid, reason } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, hotelId: req.user.hotelId }).populate("table");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.find((i) => i.dishId.toString() === dishId.toString());
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in order" });
    }

    const voidQty = Number(quantityToVoid) || 1;
    const voidAmount = item.price * voidQty;
    const hotel = await Hotel.findById(req.user.hotelId);
    const tableNo = order.table ? `Table ${order.table.tableNo}` : (order.orderDisplayId || order.orderType || "Takeaway");
    const antiTheftActive = Boolean(hotel?.antiTheftOtpRequired && hotel?.telegramAlertsEnabled && hotel?.telegramChatId);

    // If item was already printed and anti-theft is active, require OTP
    if ((item.printedQuantity || 0) > 0 && antiTheftActive) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const audit = await CancellationAudit.create({
        hotelId: req.user.hotelId,
        orderId: order._id,
        orderDisplayId: order.orderDisplayId || "",
        tableNo,
        orderType: order.orderType,
        cancelledItems: [{
          dishId: item.dishId,
          name: item.name,
          price: item.price,
          quantity: voidQty,
          printedQuantity: item.printedQuantity || 0,
        }],
        totalAmount: voidAmount,
        cancellationType: "item_void",
        cancelledBy: req.user._id,
        cashierName: req.user.name || "Cashier",
        reason: reason || "Item Void Request",
        otp,
        otpExpiresAt,
        status: "pending_otp",
      });

      await sendCancelAlertOtp({
        chatId: hotel.telegramChatId,
        hotelName: hotel.name,
        tableOrOrder: tableNo,
        items: [{ name: item.name, price: item.price, quantity: voidQty }],
        totalAmount: voidAmount,
        cashierName: req.user.name || "Cashier",
        reason: reason || "Customer cancelled item",
        otp,
        cancellationType: "item_void",
      });

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        auditId: audit._id,
        voidAmount,
        itemName: item.name,
        message: `Anti-Theft Active: OTP sent to Owner's Telegram to void ${item.name}.`,
      });
    }

    // Direct Void without OTP (if item wasn't printed or no Telegram configured)
    if (item.quantity <= voidQty) {
      order.items = order.items.filter((i) => i.dishId.toString() !== dishId.toString());
    } else {
      item.quantity -= voidQty;
      if (item.printedQuantity > item.quantity) {
        item.printedQuantity = item.quantity;
      }
    }

    const currentHotel = await Hotel.findById(req.user.hotelId);
    const currentTaxRate = (currentHotel && currentHotel.foodGstRate !== undefined) ? (Number(currentHotel.foodGstRate) / 100) : 0.05;

    order.subTotal = order.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    order.tax = Math.round(order.subTotal * currentTaxRate * 100) / 100;
    order.grandTotal = order.subTotal + order.tax;
    await order.save();

    await CancellationAudit.create({
      hotelId: req.user.hotelId,
      orderId: order._id,
      orderDisplayId: order.orderDisplayId || "",
      tableNo,
      orderType: order.orderType,
      cancelledItems: [{
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        quantity: voidQty,
      }],
      totalAmount: voidAmount,
      cancellationType: "item_void",
      cancelledBy: req.user._id,
      cashierName: req.user.name || "Cashier",
      reason: reason || "Direct Item Void",
      status: "approved",
      approvedAt: new Date(),
    });

    broadcastKDSUpdate(req.user.hotelId, { type: "order_updated", orderId: order._id });

    res.status(200).json({
      success: true,
      requiresOtp: false,
      message: `${item.name} removed from order.`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and void item
// @route   POST /api/orders/:orderId/verify-item-void
// @access  Private (Staff/Admin)
exports.verifyItemVoid = async (req, res) => {
  try {
    const { auditId, otp, dishId, quantityToVoid } = req.body;
    const audit = await CancellationAudit.findOne({
      _id: auditId,
      hotelId: req.user.hotelId,
      status: "pending_otp",
    });

    if (!audit) {
      return res.status(404).json({ success: false, message: "Void request not found or expired" });
    }

    if (new Date() > new Date(audit.otpExpiresAt)) {
      audit.status = "rejected";
      await audit.save();
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    if (audit.otp.trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP. Verification failed." });
    }

    const order = await Order.findOne({ _id: req.params.orderId, hotelId: req.user.hotelId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.find((i) => i.dishId.toString() === dishId.toString());
    const voidQty = Number(quantityToVoid) || 1;

    if (item) {
      if (item.quantity <= voidQty) {
        order.items = order.items.filter((i) => i.dishId.toString() !== dishId.toString());
      } else {
        item.quantity -= voidQty;
        if (item.printedQuantity > item.quantity) {
          item.printedQuantity = item.quantity;
        }
      }
      const currentHotel = await Hotel.findById(req.user.hotelId);
      const currentTaxRate = (currentHotel && currentHotel.foodGstRate !== undefined) ? (Number(currentHotel.foodGstRate) / 100) : 0.05;

      order.subTotal = order.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
      order.tax = Math.round(order.subTotal * currentTaxRate * 100) / 100;
      order.grandTotal = order.subTotal + order.tax;
      await order.save();
    }

    audit.status = "approved";
    audit.approvedAt = new Date();
    await audit.save();

    const hotel = await Hotel.findById(req.user.hotelId);
    if (hotel?.telegramChatId) {
      await sendCancelApprovedNotification({
        chatId: hotel.telegramChatId,
        hotelName: hotel.name,
        tableOrOrder: audit.tableNo,
        totalAmount: audit.totalAmount,
        cashierName: audit.cashierName,
        reason: audit.reason,
      });
    }

    broadcastKDSUpdate(req.user.hotelId, { type: "order_updated", orderId: order._id });

    res.status(200).json({
      success: true,
      message: "Item void authorized and updated successfully.",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all cancellation & void audit logs (Admin Reports)
// @route   GET /api/orders/cancellation-audits
// @access  Private (Admin)
exports.getCancellationAudits = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const status = req.query.status || "";

    const query = { hotelId: req.user.hotelId };
    if (status) {
      query.status = status;
    }

    const total = await CancellationAudit.countDocuments(query);
    const audits = await CancellationAudit.find(query)
      .populate("cancelledBy", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: audits,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Test Telegram Alert directly from Admin Settings
// @route   POST /api/orders/telegram-test
// @access  Private (Admin)
exports.testTelegramAlert = async (req, res) => {
  try {
    const { chatId } = req.body;
    const hotel = await Hotel.findById(req.user.hotelId);
    const targetChatId = chatId || hotel?.telegramChatId;

    if (!targetChatId) {
      return res.status(400).json({
        success: false,
        message: "Please enter your Telegram Chat ID first.",
      });
    }

    const result = await sendTestAlert(targetChatId, hotel?.name || "Annapurna Astra");
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || result.message || "Failed to send Telegram test message.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Test message sent successfully to your Telegram!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-detect chat ID from latest message sent to the bot
// @route   GET /api/orders/telegram-detect-chat-id
// @access  Private (Admin)
exports.detectTelegramChatId = async (req, res) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "TELEGRAM_BOT_TOKEN is missing in backend/.env",
      });
    }

    const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, { timeout: 8000 });
    const updates = response.data?.result || [];
    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Abhi tak koi message nahi mila! Kripya apne Telegram bot (@e_annapurna_alerts_bot) par jakar 'START' dabayein.",
      });
    }

    const lastUpdate = [...updates].reverse().find((u) => u.message?.chat?.id);
    if (!lastUpdate) {
      return res.status(404).json({
        success: false,
        message: "Bot ko koi recent message nahi mila. Kripya Telegram bot par 'START' dabayein.",
      });
    }

    const chat = lastUpdate.message.chat;
    res.status(200).json({
      success: true,
      chatId: String(chat.id),
      senderName: `${chat.first_name || ""} ${chat.last_name || ""}`.trim() || chat.username || "User",
      message: `Chat ID mil gaya: ${chat.id} (${chat.first_name || "User"})`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Legacy / direct Cancel order (Maintains backward compatibility)
// @route   DELETE /api/orders/:orderId
// @access  Private (Staff/Admin)
exports.cancelOrder = exports.requestCancelOrder;

// @desc    Mark items as printed for KOT
// @route   PUT /api/orders/:orderId/mark-printed
// @access  Private (Staff/Admin)
exports.markOrderPrinted = async (req, res) => {
  try {
    const { items } = req.body; // Array of { dishId, printedQuantity } to update
    const order = await Order.findOne({ _id: req.params.orderId, hotelId: req.user.hotelId });
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Items array is required" });
    }

    // Update printed quantities
    items.forEach(updateItem => {
      const rawDishId = updateItem.dishId?._id || updateItem.dishId;
      const existingItem = order.items.find(i => (i.dishId?._id || i.dishId)?.toString() === rawDishId?.toString());
      if (existingItem) {
        existingItem.printedQuantity = (existingItem.printedQuantity || 0) + (updateItem.quantity || 1);
      }
    });

    await order.save();
    res.status(200).json({ success: true, message: "KOT marked as printed", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
