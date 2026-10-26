const Invoice = require("../models/Invoice");
const RoomBooking = require("../models/RoomBooking");
const Hotel = require("../models/Hotel");
const Order = require("../models/Order");
const { sendInvoiceWhatsApp } = require("../services/whatsappService");
const mongoose = require("mongoose");

// Helper to get date ranges
const getDateRange = (filterType, specificDate) => {
  const now = new Date();
  let start, end;

  switch (filterType) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;

    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case "year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999);
      break;

    case "specific":
      if (specificDate) {
        const parsedDate = new Date(specificDate);
        if (!isNaN(parsedDate.getTime())) {
          start = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 0, 0, 0, 0);
          end = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999);
        } else {
          // Fallback to today
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
      break;

    default:
      // All time
      start = new Date(0);
      end = new Date(now.getFullYear() + 10, 11, 31, 23, 59, 59, 999);
  }

  return { start, end };
};

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  const { customerName, customerMobile, customerEmail, items, roomBookingId, discountPercentage = 0 } = req.body;

  try {
    if (!customerName || !customerMobile || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Please enter customer details and items" });
    }

    // Calculate totals
    let subTotal = 0;
    const formattedItems = items.map((item) => {
      const price = Number(item.price);
      const quantity = Number(item.quantity);
      subTotal += price * quantity;
      return {
        dishId: item.dishId,
        name: item.name,
        price,
        quantity,
      };
    });

    const hotel = await Hotel.findById(req.user.hotelId);
    const foodTaxRate = (hotel && hotel.foodGstRate !== undefined) ? Number(hotel.foodGstRate) : 5;

    const discountAmount = Math.round((subTotal * discountPercentage / 100) * 100) / 100;
    const tax = Math.round(((subTotal - discountAmount) * (foodTaxRate / 100)) * 100) / 100;
    const grandTotal = Math.round((subTotal - discountAmount + tax) * 100) / 100;

    let invoiceStatus = 'Paid';
    if (roomBookingId) {
      invoiceStatus = 'Added to Room';
    }

    const invoice = await Invoice.create({
      hotelId: req.user.hotelId,
      customerName,
      customerMobile,
      customerEmail,
      items: formattedItems,
      subTotal,
      discountPercentage,
      discountAmount,
      tax,
      taxRate: foodTaxRate,
      grandTotal,
      status: invoiceStatus,
      roomBookingId: roomBookingId || null,
      createdBy: req.user._id,
    });

    if (roomBookingId) {
      await RoomBooking.findOneAndUpdate(
        { _id: roomBookingId }, 
        { $push: { restaurantBills: invoice._id } }
      );
    }

    // Populate creator's name
    const populatedInvoice = await Invoice.findById(invoice._id).populate("createdBy", "name");

    res.status(201).json({ success: true, invoice: populatedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all invoices with pagination & filters
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search, source, paymentMode, fromDate, toDate } = req.query;

  try {
    const query = { hotelId: req.user.hotelId };

    if (source === "restaurant") {
      query.orderId = null;
    } else if (source === "kot") {
      query.orderId = { $ne: null };
    }

    if (paymentMode) {
      query.paymentMode = paymentMode;
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

    // Text search (customerName, customerMobile, invoiceNumber)
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { customerMobile: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate("createdBy", "name")
      .populate("orderId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: invoices,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to compute combined stats
const getCombinedStats = async (start, end, source, hotelId) => {
  let total = 0, count = 0;
  
  if (source === 'restaurant' || source === 'all') {
    const invData = await Invoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, hotelId } },
      { $group: { _id: null, total: { $sum: "$grandTotal" }, count: { $sum: 1 } } }
    ]);
    total += invData[0]?.total || 0;
    count += invData[0]?.count || 0;
  }
  
  if (source === 'room' || source === 'all') {
    const roomData = await RoomBooking.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: 'Checked-Out', hotelId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]);
    total += roomData[0]?.total || 0;
    count += roomData[0]?.count || 0;
  }

  return { total, count };
};

// @desc    Get reports summary for dashboard
// @route   GET /api/invoices/stats
// @access  Private/Admin
const getInvoiceStats = async (req, res) => {
  try {
    const now = new Date();
    const source = req.query.source || 'restaurant'; // restaurant, room, all
    

    // 1. Today's Billing
    const todayRange = getDateRange("today");
    const todayStats = await getCombinedStats(todayRange.start, todayRange.end, source, req.user.hotelId);

    // 2. Month's Billing
    const monthRange = getDateRange("month");
    const monthStats = await getCombinedStats(monthRange.start, monthRange.end, source, req.user.hotelId);

    // 3. Yearly Billing
    const yearRange = getDateRange("year");
    const yearStats = await getCombinedStats(yearRange.start, yearRange.end, source, req.user.hotelId);

    // 4. Dynamic Chart Data based on query parameters (day, week, month, year)
    const chartType = req.query.chartType || "month";
    const chartData = [];

    if (chartType === "day") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        
        const dayStats = await getCombinedStats(start, end, source, req.user.hotelId);
        const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        chartData.push({ label: dateStr, amount: dayStats.total });
      }
    } else if (chartType === "week") {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const dStart = new Date(now);
        dStart.setDate(dStart.getDate() - (i * 7 + 6));
        dStart.setHours(0, 0, 0, 0);

        const dEnd = new Date(now);
        dEnd.setDate(dEnd.getDate() - (i * 7));
        dEnd.setHours(23, 59, 59, 999);

        const weekStats = await getCombinedStats(dStart, dEnd, source, req.user.hotelId);
        const label = i === 0 ? "This Week" : `${i} Wk Ago`;
        chartData.push({ label, amount: weekStats.total });
      }
    } else if (chartType === "year") {
      // Last 5 years
      const currentYear = now.getFullYear();
      for (let y = currentYear - 4; y <= currentYear; y++) {
        const start = new Date(y, 0, 1, 0, 0, 0, 0);
        const end = new Date(y, 11, 31, 23, 59, 59, 999);

        const yearStats = await getCombinedStats(start, end, source, req.user.hotelId);
        chartData.push({ label: `${y}`, amount: yearStats.total });
      }
    } else {
      // Month-wise (current year) - default
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(now.getFullYear(), m, 1, 0, 0, 0, 0);
        const mEnd = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
        
        const mStats = await getCombinedStats(mStart, mEnd, source, req.user.hotelId);
        chartData.push({ label: months[m], amount: mStats.total });
      }
    }

    res.json({
      success: true,
      stats: {
        today: { amount: todayStats.total, count: todayStats.count },
        month: { amount: monthStats.total, count: monthStats.count },
        year: { amount: yearStats.total, count: yearStats.count },
      },
      chartData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to find invoice or fallback to order
const findInvoiceOrOrder = async (id) => {
  let invoice = null;
  let order = null;
  let hotel = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    // 1. Try finding direct Invoice by _id
    invoice = await Invoice.findById(id).populate("hotelId").populate("tableId");

    // 2. Try finding Invoice by orderId
    if (!invoice) {
      invoice = await Invoice.findOne({ orderId: id }).populate("hotelId").populate("tableId");
    }

    // 3. If no invoice exists, check if it's an Order
    if (!invoice) {
      order = await Order.findById(id).populate("hotelId").populate("table");
    }
  }

  // 4. Try finding Invoice by invoiceNumber
  if (!invoice && !order) {
    invoice = await Invoice.findOne({ invoiceNumber: id }).populate("hotelId").populate("tableId");
  }

  if (invoice) {
    hotel = invoice.hotelId;
    return {
      type: "invoice",
      data: invoice.toObject(),
      tableNo: invoice.tableId?.tableNo,
      hotel,
      invoiceId: invoice._id,
    };
  }

  if (order) {
    hotel = order.hotelId;
    return {
      type: "order",
      data: {
        _id: order._id,
        invoiceNumber: order.orderDisplayId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customerName: order.customerName || "Valued Guest",
        customerMobile: order.customerMobile,
        items: order.items,
        subTotal: order.subTotal,
        discountAmount: order.discountAmount || 0,
        discountPercentage: order.discountPercentage || 0,
        tax: order.tax || 0,
        grandTotal: order.grandTotal,
        paymentMode: order.paymentMode || "Paid",
        createdAt: order.createdAt,
      },
      tableNo: order.table?.tableNo,
      hotel,
      invoiceId: order._id,
    };
  }

  // 5. Try finding RoomBooking
  if (mongoose.Types.ObjectId.isValid(id)) {
    const booking = await RoomBooking.findById(id).populate("hotelId").populate("room").populate("restaurantBills");
    if (booking) {
      hotel = booking.hotelId;
      const guestName = (booking.guests && booking.guests[0] && booking.guests[0].name) ? booking.guests[0].name : "Room Guest";
      const guestMobile = (booking.guests && booking.guests[0] && booking.guests[0].phone) ? booking.guests[0].phone : "";
      const roomNo = booking.room ? `Room ${booking.room.roomNumber}` : "Room";

      const checkInDate = new Date(booking.checkInTime || Date.now());
      const checkOutDate = new Date(booking.checkOutTime || Date.now());
      let diffDays = Math.ceil(Math.abs(checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;

      const items = [
        {
          name: `${booking.room?.type || "Room Tariff"} (${diffDays} Night${diffDays > 1 ? "s" : ""})`,
          price: booking.room?.price || 0,
          quantity: diffDays,
        }
      ];

      if (booking.restaurantBills && booking.restaurantBills.length > 0) {
        booking.restaurantBills.forEach(b => {
          items.push({
            name: `Restaurant Folio #${b.invoiceNumber || ""}`,
            price: b.grandTotal,
            quantity: 1,
          });
        });
      }

      return {
        type: "room_booking",
        data: {
          _id: booking._id,
          invoiceNumber: `ROOM-${booking._id.toString().slice(-6).toUpperCase()}`,
          customerName: guestName,
          customerMobile: guestMobile,
          items,
          subTotal: booking.totalAmount,
          discountAmount: 0,
          discountPercentage: 0,
          tax: 0,
          grandTotal: booking.totalAmount,
          paymentMode: booking.finalPaymentMode || booking.advancePaymentMode || "Paid",
          createdAt: booking.checkOutTime || booking.createdAt,
        },
        tableNo: roomNo,
        hotel,
        invoiceId: booking._id,
      };
    }
  }

  return null;
};

// @desc    Send Invoice via WhatsApp (Meta Cloud API + Direct wa.me link fallback)
// @route   POST /api/invoices/:id/send-whatsapp
// @access  Private
const sendInvoiceViaWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetMobile } = req.body;

    const record = await findInvoiceOrOrder(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Invoice or Order not found for this bill." });
    }

    const { data: billData, tableNo, invoiceId } = record;
    const hotel = record.hotel || (await Hotel.findById(req.user?.hotelId));
    const recipientMobile = targetMobile || billData.customerMobile;

    if (!recipientMobile || recipientMobile === "N/A" || recipientMobile.replace(/\D/g, "").length < 10) {
      return res.status(400).json({
        success: false,
        message: "A valid 10-digit customer mobile number is required to send WhatsApp bill.",
      });
    }

    // Determine public digital bill URL
    const frontendBaseUrl = (process.env.FRONTEND_URL || "https://hotel.e-annapurna.co.in").replace(/\/+$/, "");
    const billUrl = `${frontendBaseUrl}/bill/${invoiceId}`;

    // Custom WhatsApp config per hotel if present
    const customConfig = {
      accessToken: hotel?.whatsappConfig?.accessToken,
      phoneNumberId: hotel?.whatsappConfig?.phoneNumberId,
    };

    const result = await sendInvoiceWhatsApp({
      customerMobile: recipientMobile,
      customerName: billData.customerName,
      hotel,
      invoice: {
        ...billData,
        tableNo,
      },
      billUrl,
      customConfig,
    });

    return res.status(200).json({
      success: true,
      sentViaApi: result.sentViaApi,
      waLink: result.waLink,
      message: result.message,
      apiResponse: result.apiResponse,
    });
  } catch (error) {
    console.error("[sendInvoiceViaWhatsApp] Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public Digital Invoice View (JSON)
// @route   GET /api/public/bill/:invoiceId
// @access  Public (Guest view)
const getPublicInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const record = await findInvoiceOrOrder(invoiceId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Invoice not found or expired" });
    }

    const { data: invoice, tableNo, hotel } = record;
    return res.status(200).json({
      success: true,
      invoice: {
        ...invoice,
        tableNo,
      },
      hotel: hotel ? {
        name: hotel.name,
        address: hotel.address,
        city: hotel.city,
        phone: hotel.phone,
        receptionPhone: hotel.receptionPhone,
        gstin: hotel.gstin,
        fssaiNumber: hotel.fssaiNumber,
        logo: hotel.logo,
        upiId: hotel.upiId,
      } : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public Digital Invoice HTML View & Direct PDF Download
// @route   GET /bill/:invoiceId
// @access  Public (Guest download/view)
const renderPublicInvoiceHtml = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const record = await findInvoiceOrOrder(invoiceId);
    if (!record) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Invoice Not Found</title>
          <style>body{font-family:sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;}</style>
        </head>
        <body>
          <div>
            <h1 style="color:#ef4444;font-size:24px;margin-bottom:8px;">Invoice Not Found</h1>
            <p style="color:#94a3b8;font-size:14px;">This digital invoice link may be invalid or expired.</p>
          </div>
        </body>
        </html>
      `);
    }

    const { data: inv, tableNo, hotel } = record;
    const billDate = new Date(inv.createdAt || Date.now()).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemsRows = (inv.items || [])
      .map(
        (it) => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;">${it.name}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${it.quantity}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">₹${Number(it.price).toFixed(2)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:bold;">₹${Number(it.price * it.quantity).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const cgst = Number(inv.tax || 0) / 2;
    const sgst = Number(inv.tax || 0) / 2;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice #${inv.invoiceNumber} - ${hotel?.name || "Official Receipt"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #1e293b; padding: 20px 10px; display: flex; justify-content: center; }
    .container { width: 100%; max-width: 600px; }
    .actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .badge { background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .btn { background: #059669; color: white; padding: 10px 18px; border-radius: 12px; font-weight: bold; font-size: 13px; border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .btn:hover { background: #047857; }
    .btn-share { background: #334155; margin-right: 8px; }
    .btn-share:hover { background: #475569; }
    .card { background: white; border-radius: 24px; padding: 32px 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
    .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; }
    .hotel-name { font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; }
    .hotel-meta { font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.4; }
    .tax-badge { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-top: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 20px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .info-label { color: #94a3b8; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-val { font-weight: bold; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    th { text-align: left; padding: 10px 8px; background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
    .summary { border-top: 2px dashed #e2e8f0; padding-top: 16px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 8px; }
    .grand-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #0f172a; padding: 12px 0; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; margin-top: 10px; }
    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; line-height: 1.6; }
    @media print {
      body { background: white; padding: 0; }
      .actions { display: none !important; }
      .card { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="actions">
      <div class="badge">✓ Verified Digital Invoice</div>
      <div>
        <button class="btn btn-share" onclick="navigator.share?navigator.share({title:'Invoice #${inv.invoiceNumber}',url:window.location.href}):navigator.clipboard.writeText(window.location.href)">Share</button>
        <button class="btn" onclick="window.print()">📥 Download PDF / Print</button>
      </div>
    </div>
    <div class="card">
      <div class="header">
        <h1 class="hotel-name">${hotel?.name || "HOTEL INVOICE"}</h1>
        <div class="hotel-meta">
          ${hotel?.address ? `<div>📍 ${hotel.address}${hotel.city ? `, ${hotel.city}` : ""}</div>` : ""}
          <div>${hotel?.phone ? `📞 ${hotel.phone}` : ""} ${hotel?.gstin ? ` | 🏛️ GSTIN: ${hotel.gstin}` : ""}</div>
        </div>
        <div class="tax-badge">Original Tax Invoice</div>
      </div>
      <div class="info-grid">
        <div><div class="info-label">Invoice Number</div><div class="info-val">#${inv.invoiceNumber}</div></div>
        <div style="text-align:right;"><div class="info-label">Date & Time</div><div class="info-val">${billDate}</div></div>
        <div><div class="info-label">Billed To</div><div class="info-val">${inv.customerName || "Walk-in Guest"}</div><div style="color:#64748b;font-size:11px;">${inv.customerMobile || ""}</div></div>
        <div style="text-align:right;"><div class="info-label">Location / Table</div><div class="info-val">${tableNo ? `Table ${tableNo}` : (inv.roomBookingId ? "Room Service" : "Dine-In")}</div></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Rate</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <div class="summary">
        <div class="summary-row"><span>Subtotal:</span><span>₹${Number(inv.subTotal || 0).toFixed(2)}</span></div>
        ${inv.discountAmount && inv.discountAmount > 0 ? `<div class="summary-row" style="color:#059669;"><span>Discount:</span><span>-₹${Number(inv.discountAmount).toFixed(2)}</span></div>` : ""}
        ${cgst > 0 ? `<div class="summary-row"><span>CGST:</span><span>₹${cgst.toFixed(2)}</span></div><div class="summary-row"><span>SGST:</span><span>₹${sgst.toFixed(2)}</span></div>` : ""}
        <div class="grand-total"><span>Grand Total:</span><span>₹${Number(inv.grandTotal || 0).toFixed(2)}</span></div>
        <div class="summary-row" style="margin-top:8px;"><span>Payment Status:</span><span style="font-weight:bold;color:#059669;">PAID (${inv.paymentMode || "Cash"})</span></div>
      </div>
      <div class="footer">
        <p>🙏 Thank you for your visit! Please visit again.</p>
        <p style="font-size:10px;margin-top:4px;">Powered by Annapurna Astra Smart POS</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    return res.status(200).send(html);
  } catch (error) {
    console.error("renderPublicInvoiceHtml error:", error);
    return res.status(500).send("Server Error loading invoice");
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceStats,
  sendInvoiceViaWhatsApp,
  getPublicInvoiceById,
  renderPublicInvoiceHtml,
};
