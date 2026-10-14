const Invoice = require("../models/Invoice");
const RoomBooking = require("../models/RoomBooking");
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

    const discountAmount = Math.round((subTotal * discountPercentage / 100) * 100) / 100;
    const tax = Math.round(((subTotal - discountAmount) * 0.05) * 100) / 100; // 5% GST
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

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceStats,
};
