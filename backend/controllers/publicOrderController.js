const Razorpay = require("razorpay");
const crypto = require("crypto");
const Hotel = require("../models/Hotel");
const Dish = require("../models/Dish");
const Table = require("../models/Table");
const Order = require("../models/Order");
const TableBooking = require("../models/TableBooking");
const Waitlist = require("../models/Waitlist");
const { broadcastKDSUpdate } = require("./kdsController");

const cleanKey = (val) => (val ? String(val).replace(/^['"]|['"]$/g, "").trim() : "");

const getRazorpayInstance = () => {
  const key_id = cleanKey(process.env.RAZORPAY_KEY_ID);
  const key_secret = cleanKey(process.env.RAZORPAY_SECRET);
  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are not configured on server.");
  }
  return new Razorpay({ key_id, key_secret });
};

// @desc    Get Hotel Public Menu & Table Info for QR scan
// @route   GET /api/public/hotel/:hotelId
// @access  Public
exports.getHotelPublicMenu = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId).select(
      "name email phone address city state pincode logo type foodGstRate upiId checkInTime checkOutTime receptionPhone"
    );

    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel/Restaurant not found" });
    }

    const dishes = await Dish.find({ hotelId, available: true }).sort({ category: 1, name: 1 });
    const tables = await Table.find({ hotelId }).select("tableNo capacity type status currentOrderId").sort({ tableNo: 1 });

    // Check in real-time which tables have active running dining orders or pending QR orders
    const pendingQrOrders = await Order.find({
      hotelId,
      status: "Active",
      orderType: "Table",
      approvalStatus: "pending",
    }).select("tableNo table");

    const pendingTableNos = new Set(
      pendingQrOrders.map((o) => String(o.tableNo || "").trim().toLowerCase()).filter(Boolean)
    );
    const pendingTableIds = new Set(
      pendingQrOrders.map((o) => String(o.table || "")).filter(Boolean)
    );

    const tablesWithLiveStatus = tables.map((tbl) => {
      // Direct table occupancy from POS / Staff table management
      const isMarkedBusy = tbl.status === "Occupied" || tbl.status === "Booked" || Boolean(tbl.currentOrderId);
      // Or if a QR order is pending confirmation by staff
      const hasPendingQr =
        pendingTableNos.has(String(tbl.tableNo || "").trim().toLowerCase()) ||
        pendingTableIds.has(String(tbl._id));

      const isOccupied = isMarkedBusy || hasPendingQr;

      return {
        _id: tbl._id,
        tableNo: tbl.tableNo,
        capacity: tbl.capacity,
        type: tbl.type,
        status: isOccupied ? "Occupied" : "Available",
      };
    });

    // Extract unique categories
    const categories = Array.from(new Set(dishes.map((d) => d.category || "General")));

    res.status(200).json({
      success: true,
      data: {
        hotel,
        categories,
        dishes,
        tables: tablesWithLiveStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Public Order via QR Code (Pending Hotel Approval)
// @route   POST /api/public/order
// @access  Public
exports.createPublicOrder = async (req, res) => {
  try {
    const {
      hotelId,
      orderType = "Table",
      tableId,
      tableNo,
      customerName,
      customerMobile,
      customerEmail,
      items,
      subTotal,
      tax,
      grandTotal,
      paymentMode = "Counter",
      paymentDetails,
    } = req.body;

    if (!hotelId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Hotel ID and items are required" });
    }

    // Customer mobile is strictly mandatory to prevent fake orders & allow secure tracking/addons
    const cleanMobile = String(customerMobile || "").trim();
    if (!cleanMobile || cleanMobile.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit customer mobile number is mandatory for placing and tracking orders.",
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    let resolvedTableId = null;
    let resolvedTableNo = tableNo || "";

    let targetTableDoc = null;
    if (orderType === "Table") {
      if (tableId) {
        targetTableDoc = await Table.findOne({ _id: tableId, hotelId });
      } else if (tableNo) {
        targetTableDoc = await Table.findOne({ tableNo: String(tableNo).trim(), hotelId });
      }

      if (targetTableDoc) {
        resolvedTableId = targetTableDoc._id;
        resolvedTableNo = targetTableDoc.tableNo;
      }

      // Check if table already has an active running order
      if (resolvedTableId || resolvedTableNo) {
        const isTableActuallyBusy = targetTableDoc && (targetTableDoc.status === "Occupied" || targetTableDoc.status === "Booked" || Boolean(targetTableDoc.currentOrderId));

        const activeTableOrder = await Order.findOne({
          hotelId,
          $or: [
            { tableNo: resolvedTableNo },
            ...(resolvedTableId ? [{ table: resolvedTableId }] : []),
          ],
          orderType: "Table",
          status: "Active",
          approvalStatus: { $in: ["approved", "pending"] },
        }).sort({ createdAt: -1 });

        if (activeTableOrder) {
          // If table doc is marked Available and order was already approved (stale order), auto-archive it
          if (targetTableDoc && targetTableDoc.status === "Available" && !targetTableDoc.currentOrderId && activeTableOrder.approvalStatus === "approved") {
            activeTableOrder.status = "Billed";
            await activeTableOrder.save();
          } else if (isTableActuallyBusy || activeTableOrder.approvalStatus === "pending") {
            // Verify customer identity with mobile number to prevent unauthorized additions
            const existingMobile = String(activeTableOrder.customerMobile || "").trim();
            if (existingMobile && existingMobile !== cleanMobile) {
              return res.status(403).json({
                success: false,
                message: `Table ${resolvedTableNo} is currently occupied with active diners. Please select an available table, switch to Takeaway (Parcel), or join our live queue.`,
              });
            }

            // Case A: Initial order is still pending approval -> Directly merge into pending items
            if (activeTableOrder.approvalStatus === "pending") {
            const mappedItems = items.map((item) => ({
              dishId: item.dishId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              printedQuantity: 0,
              category: item.category || "General",
            }));
            activeTableOrder.items.push(...mappedItems);
            activeTableOrder.subTotal = (activeTableOrder.subTotal || 0) + (Number(subTotal) || 0);
            activeTableOrder.tax = (activeTableOrder.tax || 0) + (Number(tax) || 0);
            activeTableOrder.grandTotal = (activeTableOrder.grandTotal || 0) + (Number(grandTotal) || 0);
            await activeTableOrder.save();

            broadcastKDSUpdate(hotelId, {
              type: "qr_order_pending",
              orderId: activeTableOrder._id,
              orderDisplayId: activeTableOrder.orderDisplayId,
              orderType: "Table",
              tableNo: resolvedTableNo,
              customerName: activeTableOrder.customerName,
              grandTotal: activeTableOrder.grandTotal,
              message: `Additional items added to pending order for Table ${resolvedTableNo}`,
            });

            return res.status(200).json({
              success: true,
              isAddon: true,
              message: `Items added to Table ${resolvedTableNo} pending order! Waiting for hotel confirmation.`,
              data: activeTableOrder,
            });
          }

          // Case B: Initial order is already approved & active -> Add to pendingAddons for admin verification!
          const addonItems = items.map((item) => ({
            dishId: item.dishId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category || "General",
          }));

          const addonObj = {
            items: addonItems,
            subTotal: Number(subTotal) || 0,
            tax: Number(tax) || 0,
            grandTotal: Number(grandTotal) || 0,
            status: "pending",
            requestedAt: new Date(),
          };

          activeTableOrder.pendingAddons.push(addonObj);
          await activeTableOrder.save();

          // Notify Admin with chime & notification
          broadcastKDSUpdate(hotelId, {
            type: "qr_order_pending",
            isAddon: true,
            orderId: activeTableOrder._id,
            orderDisplayId: activeTableOrder.orderDisplayId,
            orderType: "Table",
            tableNo: resolvedTableNo,
            customerName: activeTableOrder.customerName,
            addonGrandTotal: addonObj.grandTotal,
            message: `New items requested for Table ${resolvedTableNo} (#${activeTableOrder.orderDisplayId})`,
          });

          // Notify customer tracker
          broadcastCustomerOrderUpdate(activeTableOrder._id, {
            type: "addon_pending",
            message: "Additional items sent to restaurant for approval!",
            order: activeTableOrder,
          });

          return res.status(200).json({
            success: true,
            isAddon: true,
            message: `Additional items requested for Table ${resolvedTableNo}! Waiting for staff approval.`,
            data: activeTableOrder,
          });
          }
        } else if (
          targetTableDoc &&
          (targetTableDoc.status === "Occupied" ||
            targetTableDoc.status === "Booked" ||
            Boolean(targetTableDoc.currentOrderId))
        ) {
          return res.status(400).json({
            success: false,
            message: `Table ${resolvedTableNo} is currently occupied with active diners. Please select an available table, switch to Takeaway (Parcel), or join our live waitlist queue!`,
          });
        }
      }
    }

    // Generate Order Display ID
    const count = await Order.countDocuments({ hotelId });
    const prefix = orderType === "Parcel" ? "QR-PAR" : "QR-TBL";
    const orderDisplayId = `${prefix}-${count + 101}`;

    const newOrder = await Order.create({
      hotelId,
      table: resolvedTableId,
      tableNo: resolvedTableNo,
      orderType: orderType === "Parcel" ? "Parcel" : "Table",
      orderDisplayId,
      items: items.map((item) => ({
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        printedQuantity: 0,
        category: item.category || "General",
      })),
      status: "Active",
      kdsStatus: "new",
      subTotal: Number(subTotal) || 0,
      tax: Number(tax) || 0,
      grandTotal: Number(grandTotal) || 0,
      paymentMode: paymentMode || "Counter",
      paymentStatus: paymentDetails?.razorpayPaymentId ? "Paid" : "Pending",
      paymentDetails: paymentDetails || {},
      customerName: customerName || (resolvedTableNo ? `Table ${resolvedTableNo}` : "Guest"),
      customerMobile: cleanMobile,
      customerEmail: customerEmail || "",
      source: "QR_SCAN",
      approvalStatus: "pending", // Pending admin verification
      pendingAddons: [],
    });

    // Notify connected Staff/Admin panels in real-time
    broadcastKDSUpdate(hotelId, {
      type: "qr_order_pending",
      orderId: newOrder._id,
      orderDisplayId: newOrder.orderDisplayId,
      orderType: newOrder.orderType,
      tableNo: resolvedTableNo,
      customerName: newOrder.customerName,
      grandTotal: newOrder.grandTotal,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully! Waiting for hotel confirmation.",
      data: newOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Public Order Status (Customer polling/tracking)
// @route   GET /api/public/order/:orderId
// @access  Public
exports.getPublicOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("hotelId", "name phone address logo")
      .populate("table", "tableNo");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// In-memory Customer SSE Clients for real-time order tracking
let customerOrderClients = [];

const broadcastCustomerOrderUpdate = (orderId, data) => {
  customerOrderClients.forEach((client) => {
    if (client.orderId === orderId.toString()) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        console.error("Error writing to customer SSE client:", e);
      }
    }
  });
};

// @desc    Customer SSE stream to listen for approval/rejection/KOT updates
// @route   GET /api/public/order-stream/:orderId
// @access  Public
exports.streamCustomerOrderStatus = (req, res) => {
  const { orderId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", message: "Listening for order status updates" })}\n\n`);

  const client = { id: Date.now(), res, orderId: orderId.toString() };
  customerOrderClients.push(client);

  req.on("close", () => {
    customerOrderClients = customerOrderClients.filter((c) => c.id !== client.id);
  });
};

exports.broadcastCustomerOrderUpdate = broadcastCustomerOrderUpdate;

// In-memory Customer SSE Clients for real-time table booking tracking
let customerBookingClients = [];

const broadcastCustomerBookingUpdate = (bookingId, data) => {
  customerBookingClients.forEach((client) => {
    if (client.bookingId === bookingId.toString()) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (e) {
        console.error("Error writing to customer booking SSE client:", e);
      }
    }
  });
};

// @desc    Customer SSE stream to listen for table booking approval & table assignment
// @route   GET /api/public/booking-stream/:bookingId
// @access  Public
exports.streamCustomerBookingStatus = (req, res) => {
  const { bookingId } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ type: "connected", message: "Listening for table booking status updates" })}\n\n`);

  const client = { id: Date.now(), res, bookingId: bookingId.toString() };
  customerBookingClients.push(client);

  req.on("close", () => {
    customerBookingClients = customerBookingClients.filter((c) => c.id !== client.id);
  });
};

exports.broadcastCustomerBookingUpdate = broadcastCustomerBookingUpdate;

// @desc    Create Razorpay Order for Public Customer Payment
// @route   POST /api/public/payment/create-order
// @access  Public
exports.createPublicRazorpayOrder = async (req, res) => {
  try {
    const { amount, hotelId, orderType } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: Math.round(Number(amount) * 100), // in paise
      currency: "INR",
      receipt: `qr_${Date.now()}`,
      notes: {
        hotelId: String(hotelId || ""),
        orderType: String(orderType || "Table"),
      },
    };

    const rzpOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: cleanKey(process.env.RAZORPAY_KEY_ID),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/public/payment/verify
// @access  Public
exports.verifyPublicRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = cleanKey(process.env.RAZORPAY_SECRET);
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", secret).update(body.toString()).digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
        },
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Book Table by Customer via QR Code
// @route   POST /api/public/table-booking
// @access  Public
exports.createPublicTableBooking = async (req, res) => {
  try {
    const {
      hotelId,
      customerName,
      customerMobile,
      customerEmail,
      bookingDate,
      bookingTime,
      startTime,
      endTime,
      guestsCount,
      specialRequests,
      tableNo,
    } = req.body;

    if (!hotelId || !customerName || !customerMobile || !bookingDate || (!bookingTime && !startTime)) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile, booking date, and arrival time slot are required.",
      });
    }

    let finalBookingTime = bookingTime;
    if (!finalBookingTime && startTime && endTime) {
      finalBookingTime = `${startTime} - ${endTime}`;
    }

    let tableId = null;
    if (tableNo) {
      const table = await Table.findOne({ hotelId, tableNo: String(tableNo).trim() });
      if (table) tableId = table._id;
    }

    const booking = await TableBooking.create({
      hotelId,
      customerName,
      customerMobile,
      customerEmail: customerEmail || "",
      bookingDate,
      bookingTime: finalBookingTime || startTime,
      startTime: startTime || "",
      endTime: endTime || "",
      guestsCount: Number(guestsCount) || 2,
      specialRequests: specialRequests || "",
      tableId,
      tableNo: tableNo || "",
      status: "pending",
    });

    broadcastKDSUpdate(hotelId, {
      type: "new_table_booking",
      bookingId: booking._id,
      customerName: booking.customerName,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    });

    res.status(201).json({
      success: true,
      message: "Table reservation request sent! Hotel staff will confirm shortly.",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Public Table Booking Status
// @route   GET /api/public/table-booking/:bookingId
// @access  Public
exports.getPublicTableBooking = async (req, res) => {
  try {
    const booking = await TableBooking.findById(req.params.bookingId).populate("tableId", "tableNo capacity");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel Table Booking by Customer
// @route   PUT /api/public/table-booking/:bookingId/cancel
// @access  Public
exports.cancelPublicTableBooking = async (req, res) => {
  try {
    const booking = await TableBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }
    booking.status = "cancelled";
    await booking.save();

    broadcastKDSUpdate(booking.hotelId, {
      type: "table_booking_updated",
      bookingId: booking._id,
      status: "cancelled",
      customerName: booking.customerName,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    });

    broadcastCustomerBookingUpdate(booking._id, {
      type: "booking_cancelled",
      status: "cancelled",
      booking,
    });

    res.status(200).json({ success: true, message: "Table reservation cancelled successfully.", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule / Update Time Slot by Customer
// @route   PUT /api/public/table-booking/:bookingId/reschedule
// @access  Public
exports.reschedulePublicTableBooking = async (req, res) => {
  try {
    const { bookingDate, bookingTime, startTime, endTime, guestsCount, specialRequests } = req.body;
    const booking = await TableBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot reschedule a cancelled booking. Please create a new reservation." });
    }

    if (bookingDate) booking.bookingDate = bookingDate;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
    if (bookingTime) {
      booking.bookingTime = bookingTime;
    } else if (startTime && endTime) {
      booking.bookingTime = `${startTime} - ${endTime}`;
    }
    if (guestsCount) booking.guestsCount = Number(guestsCount) || booking.guestsCount;
    if (specialRequests !== undefined) booking.specialRequests = specialRequests;

    await booking.save();

    broadcastKDSUpdate(booking.hotelId, {
      type: "table_booking_updated",
      bookingId: booking._id,
      status: booking.status,
      customerName: booking.customerName,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    });

    broadcastCustomerBookingUpdate(booking._id, {
      type: "booking_updated",
      status: booking.status,
      tableNo: booking.tableNo,
      bookingTime: booking.bookingTime,
      booking,
    });

    res.status(200).json({ success: true, message: "Table reservation updated successfully!", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer Track/Lookup Table Reservation by Mobile Number
// @route   GET /api/public/table-booking/by-mobile
// @access  Public
exports.getTableBookingsByMobile = async (req, res) => {
  try {
    const { hotelId, mobile } = req.query;
    if (!hotelId || !mobile) {
      return res.status(400).json({ success: false, message: "Hotel ID and Mobile number are required" });
    }

    const cleanMobile = String(mobile).trim();
    const booking = await TableBooking.findOne({
      hotelId,
      customerMobile: cleanMobile,
    })
      .populate("tableId", "tableNo capacity")
      .sort({ createdAt: -1 });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No table reservation found for this mobile number. Please verify the mobile number or reserve a new table.",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// HOTEL ADMIN QR ORDER & APPROVAL CONTROLLER
// ==========================================

// @desc    Get all QR scan orders (for admin review)
// @route   GET /api/public/admin/qr-orders
// @access  Private (Hotel Admin / Staff)
exports.getHotelQROrders = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { status } = req.query; // pending, approved, billed, rejected, all

    let filter = { hotelId, source: "QR_SCAN" };
    if (status === "pending") {
      filter.approvalStatus = "pending";
      filter.status = "Active";
    } else if (status === "approved") {
      filter.approvalStatus = "approved";
      filter.status = "Active"; // ONLY Active dining orders! Billed orders move to Billed tab
    } else if (status === "billed") {
      filter.status = "Billed";
    } else if (status === "rejected") {
      filter.approvalStatus = "rejected";
    }

    const orders = await Order.find(filter)
      .populate("table", "tableNo capacity")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve QR Order by Hotel Admin
// @route   PUT /api/public/admin/qr-orders/:orderId/approve
// @access  Private (Hotel Admin / Staff)
exports.approveQROrder = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const order = await Order.findOne({ _id: req.params.orderId, hotelId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.approvalStatus === "approved") {
      return res.status(400).json({ success: false, message: "Order is already approved" });
    }

    order.approvalStatus = "approved";
    order.createdBy = req.user._id;

    // If it's a table order, update table status
    if (order.orderType === "Table") {
      let table = null;
      if (order.table) {
        table = await Table.findOne({ _id: order.table, hotelId });
      } else if (order.tableNo) {
        table = await Table.findOne({ tableNo: order.tableNo, hotelId });
      }

      if (table) {
        table.status = "Occupied";
        table.currentOrderId = order._id;
        await table.save();
        order.table = table._id;
        order.tableNo = table.tableNo;
      }
    }

    await order.save();

    // Broadcast to kitchen display and staff screens that order is approved and KOT is ready!
    broadcastKDSUpdate(hotelId, {
      type: "new_order",
      orderId: order._id,
      message: `QR Order ${order.orderDisplayId} approved!`,
    });

    // Broadcast realtime SSE to customer mobile screen
    broadcastCustomerOrderUpdate(order._id, {
      type: "order_approved",
      approvalStatus: "approved",
      kdsStatus: order.kdsStatus,
      message: "Order approved by restaurant! Kitchen is preparing your dishes.",
      order,
    });

    res.status(200).json({
      success: true,
      message: "Order approved successfully! KOT generated and sent to kitchen.",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject QR Order by Hotel Admin
// @route   PUT /api/public/admin/qr-orders/:orderId/reject
// @access  Private (Hotel Admin / Staff)
exports.rejectQROrder = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { reason = "Declined by restaurant staff" } = req.body;
    const order = await Order.findOne({ _id: req.params.orderId, hotelId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.approvalStatus = "rejected";
    order.status = "Cancelled";
    order.rejectionReason = reason;
    await order.save();

    // If table was linked, free it if it was occupying
    if (order.table) {
      const table = await Table.findOne({ _id: order.table, hotelId });
      if (table && table.currentOrderId?.toString() === order._id.toString()) {
        table.status = "Available";
        table.currentOrderId = null;
        await table.save();
      }
    }

    broadcastKDSUpdate(hotelId, {
      type: "order_cancelled",
      orderId: order._id,
    });

    // Broadcast realtime SSE to customer mobile screen
    broadcastCustomerOrderUpdate(order._id, {
      type: "order_rejected",
      approvalStatus: "rejected",
      rejectionReason: order.rejectionReason,
      message: `Order declined: ${order.rejectionReason}`,
      order,
    });

    res.status(200).json({
      success: true,
      message: "Order rejected.",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Hotel Table Bookings
// @route   GET /api/public/admin/table-bookings
// @access  Private (Hotel Admin / Staff)
exports.getHotelTableBookings = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const bookings = await TableBooking.find({ hotelId })
      .populate("tableId", "tableNo capacity")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Table Booking Status & Details (Confirm / Cancel / Reschedule Slot / Assign Table)
// @route   PUT /api/public/admin/table-bookings/:bookingId
// @access  Private (Hotel Admin / Staff)
exports.updateTableBookingStatus = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { status, tableNo, bookingDate, bookingTime, startTime, endTime, guestsCount } = req.body;

    const booking = await TableBooking.findOne({ _id: req.params.bookingId, hotelId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (status) booking.status = status;
    if (bookingDate) booking.bookingDate = bookingDate;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
    if (bookingTime) {
      booking.bookingTime = bookingTime;
    } else if (startTime && endTime) {
      booking.bookingTime = `${startTime} - ${endTime}`;
    }
    if (guestsCount) booking.guestsCount = Number(guestsCount) || booking.guestsCount;

    if (tableNo !== undefined) {
      booking.tableNo = String(tableNo || "").trim();
      if (booking.tableNo) {
        const table = await Table.findOne({ hotelId, tableNo: booking.tableNo });
        if (table) booking.tableId = table._id;
        // When table number is assigned/confirmed, reservation status must be confirmed (unless cancelled or completed)
        if (booking.status !== "cancelled" && booking.status !== "completed") {
          booking.status = "confirmed";
        }
      } else {
        booking.tableId = null;
      }
    }

    if (booking.status === "confirmed" && !booking.tableNo) {
      // Auto-assign first available table with matching capacity or any available table
      const availableTable = await Table.findOne({ hotelId, status: "Available" }).sort({ capacity: 1 });
      if (availableTable) {
        booking.tableId = availableTable._id;
        booking.tableNo = availableTable.tableNo;
      }
    }

    await booking.save();

    // Broadcast table booking update to Staff & KDS
    broadcastKDSUpdate(hotelId, {
      type: "table_booking_updated",
      bookingId: booking._id,
      status: booking.status,
      tableNo: booking.tableNo,
      customerName: booking.customerName,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime
    });

    // Broadcast instant SSE update to customer screen
    broadcastCustomerBookingUpdate(booking._id, {
      type: booking.status === "completed" ? "booking_completed" : "booking_updated",
      status: booking.status,
      tableNo: booking.tableNo,
      bookingTime: booking.bookingTime,
      booking,
    });

    res.status(200).json({
      success: true,
      message: `Table reservation confirmed successfully${booking.tableNo ? ` on Table ${booking.tableNo}` : ""}`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve Add-on Items for an Active Order
// @route   PUT /api/public/admin/qr-orders/:orderId/addons/:addonIndex/approve
// @access  Private (Hotel Admin / Staff)
exports.approveAddonOrder = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { orderId, addonIndex } = req.params;

    const order = await Order.findOne({ _id: orderId, hotelId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const idx = parseInt(addonIndex, 10);
    if (!order.pendingAddons || !order.pendingAddons[idx]) {
      return res.status(400).json({ success: false, message: "Addon request not found" });
    }

    const addon = order.pendingAddons[idx];
    if (addon.status !== "pending") {
      return res.status(400).json({ success: false, message: `Addon is already ${addon.status}` });
    }

    // Merge addon items into order items with isAddon: true flag
    addon.items.forEach((item) => {
      order.items.push({
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        printedQuantity: 0,
        category: item.category || "General",
        isAddon: true,
      });
    });

    // Update totals
    order.subTotal = (order.subTotal || 0) + (addon.subTotal || 0);
    order.tax = (order.tax || 0) + (addon.tax || 0);
    order.grandTotal = (order.grandTotal || 0) + (addon.grandTotal || 0);
    addon.status = "approved";

    await order.save();

    // Trigger KOT for kitchen
    broadcastKDSUpdate(hotelId, {
      type: "new_order",
      orderId: order._id,
      message: `Additional items approved for Table ${order.tableNo}!`,
    });

    // Notify customer mobile screen
    broadcastCustomerOrderUpdate(order._id, {
      type: "addon_approved",
      message: "Additional items approved by restaurant! Kitchen is preparing them.",
      order,
    });

    res.status(200).json({
      success: true,
      message: "Additional items approved & sent to kitchen!",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject Add-on Items for an Active Order
// @route   PUT /api/public/admin/qr-orders/:orderId/addons/:addonIndex/reject
// @access  Private (Hotel Admin / Staff)
exports.rejectAddonOrder = async (req, res) => {
  try {
    const hotelId = req.user.hotelId;
    const { orderId, addonIndex } = req.params;
    const { reason = "Item unavailable" } = req.body;

    const order = await Order.findOne({ _id: orderId, hotelId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const idx = parseInt(addonIndex, 10);
    if (!order.pendingAddons || !order.pendingAddons[idx]) {
      return res.status(400).json({ success: false, message: "Addon request not found" });
    }

    order.pendingAddons[idx].status = "rejected";
    await order.save();

    // Notify customer
    broadcastCustomerOrderUpdate(order._id, {
      type: "addon_rejected",
      message: `Additional items declined: ${reason}`,
      order,
    });

    res.status(200).json({
      success: true,
      message: "Additional items request declined.",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Customer Track Active Order by Mobile Number
// @route   GET /api/public/orders/by-mobile
// @access  Public
exports.getOrdersByMobile = async (req, res) => {
  try {
    const { hotelId, mobile } = req.query;
    if (!hotelId || !mobile) {
      return res.status(400).json({ success: false, message: "Hotel ID and Mobile number are required" });
    }

    const cleanMobile = String(mobile).trim();
    // Find active order for this mobile
    const activeOrder = await Order.findOne({
      hotelId,
      customerMobile: cleanMobile,
      status: "Active",
      approvalStatus: { $in: ["approved", "pending"] },
    })
      .populate("hotelId", "name phone address logo")
      .populate("table", "tableNo")
      .sort({ createdAt: -1 });

    if (!activeOrder) {
      return res.status(404).json({
        success: false,
        message: "No active dining order found for this mobile number. You can start a fresh order!",
      });
    }

    res.status(200).json({
      success: true,
      data: activeOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Get start and end of current day (midnight to midnight)
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Customer Live All-in-One Tracker (Orders, Advance Bookings, Waitlist Tokens)
// @route   GET /api/public/customer/live-activity
// @access  Public
exports.getCustomerLiveActivity = async (req, res) => {
  try {
    const { hotelId, mobile } = req.query;
    if (!hotelId || !mobile) {
      return res.status(400).json({ success: false, message: "Hotel ID and Mobile number are required" });
    }

    const cleanMobile = String(mobile).trim();
    const { start, end } = getTodayRange();

    // 1. Live Dining / Takeaway Order
    const activeOrder = await Order.findOne({
      hotelId,
      customerMobile: cleanMobile,
      status: "Active",
      approvalStatus: { $in: ["approved", "pending"] },
    })
      .populate("hotelId", "name phone address logo")
      .populate("table", "tableNo")
      .sort({ createdAt: -1 });

    // 2. Advance Table Booking (pending or confirmed)
    const activeBooking = await TableBooking.findOne({
      hotelId,
      customerMobile: cleanMobile,
      status: { $in: ["pending", "confirmed"] },
    })
      .populate("tableId", "tableNo capacity")
      .sort({ createdAt: -1 });

    // 3. Live Queue Waitlist Token
    const activeWaitlist = await Waitlist.findOne({
      hotelId,
      customerMobile: cleanMobile,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: start, $lte: end },
    });

    let waitlistDetails = null;
    if (activeWaitlist) {
      const positionAhead = await Waitlist.countDocuments({
        hotelId,
        status: { $in: ["waiting", "called"] },
        createdAt: { $gte: start, $lte: end },
        tokenSequence: { $lt: activeWaitlist.tokenSequence },
      });
      waitlistDetails = {
        ...activeWaitlist.toObject(),
        positionAhead: activeWaitlist.status === "waiting" ? positionAhead : 0,
        estimatedWaitMinutes: Math.max(5, (positionAhead + 1) * 10),
      };
    }

    const hasAnyActive = Boolean(activeOrder || activeBooking || waitlistDetails);

    res.status(200).json({
      success: true,
      data: {
        activeOrder: activeOrder || null,
        activeBooking: activeBooking || null,
        activeWaitlist: waitlistDetails || null,
        hasAnyActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

