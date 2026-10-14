const Hotel = require("../models/Hotel");
const User = require("../models/User");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const Notification = require("../models/Notification");

// @desc    Get all hotels
// @route   GET /api/superadmin/hotels
const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });

    const formattedHotels = await Promise.all(
      hotels.map(async (hotel) => {
        const owner = await User.findOne({ hotelId: hotel._id, role: "hotel_admin" });
        const sub = hotel.subscription || { plan: "none", isActive: false, validUntil: null };

        let daysRemaining = 0;
        let isExpired = false;
        if (sub.validUntil) {
          const now = new Date();
          const diff = new Date(sub.validUntil) - now;
          daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
          if (diff <= 0) isExpired = true;
        }

        const isEffectiveActive = Boolean(sub.isActive && !isExpired && sub.plan !== "none");

        return {
          ...hotel.toObject(),
          contact: hotel.phone,
          ownerName: owner ? owner.name : "Admin",
          ownerEmail: owner ? owner.email : hotel.email,
          ownerMobile: owner ? owner.mobile : hotel.phone,
          subscriptionPlan: sub.plan || "none",
          subscriptionStatus: isEffectiveActive ? "active" : "inactive",
          subscriptionExpiresAt: sub.validUntil,
          daysRemaining,
          isExpired,
          isActive: isEffectiveActive,
          createdAt: hotel.createdAt,
        };
      })
    );

    res.json(formattedHotels);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all subscriptions with hotel & owner info
// @route   GET /api/superadmin/subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ createdAt: -1 });

    const subscriptions = await Promise.all(
      hotels.map(async (hotel) => {
        const owner = await User.findOne({ hotelId: hotel._id, role: "hotel_admin" });
        const sub = hotel.subscription || { plan: "none", isActive: false, validUntil: null };

        let daysRemaining = 0;
        let isExpired = false;
        if (sub.validUntil) {
          const now = new Date();
          const diff = new Date(sub.validUntil) - now;
          daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
          if (diff <= 0) isExpired = true;
        }

        const isEffectiveActive = Boolean(sub.isActive && !isExpired && sub.plan !== "none");

        return {
          _id: hotel._id,
          hotelId: hotel._id,
          hotelName: hotel.name,
          hotelEmail: hotel.email,
          hotelPhone: hotel.phone,
          city: hotel.city,
          state: hotel.state,
          logo: hotel.logo,
          ownerName: owner ? owner.name : "N/A",
          ownerEmail: owner ? owner.email : hotel.email,
          ownerMobile: owner ? owner.mobile : hotel.phone,
          plan: sub.plan || "none",
          isActive: isEffectiveActive,
          rawIsActive: sub.isActive,
          validUntil: sub.validUntil,
          daysRemaining,
          isExpired,
          createdAt: hotel.createdAt,
        };
      })
    );

    // Calculate quick stats
    const total = subscriptions.length;
    const activeCount = subscriptions.filter((s) => s.isActive).length;
    const inactiveCount = subscriptions.filter((s) => !s.isActive && !s.isExpired).length;
    const expiredCount = subscriptions.filter((s) => s.isExpired).length;

    res.json({
      success: true,
      stats: {
        total,
        active: activeCount,
        inactive: inactiveCount,
        expired: expiredCount,
      },
      data: subscriptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update or manually set Hotel Subscription
// @route   PUT /api/superadmin/hotels/:id/subscription
const updateSubscription = async (req, res) => {
  try {
    const { plan, isActive, days = 30, validUntil } = req.body;
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });

    if (!hotel.subscription) {
      hotel.subscription = { plan: "none", isActive: false, validUntil: null };
    }

    if (plan !== undefined) {
      hotel.subscription.plan = plan;
    }

    if (isActive !== undefined) {
      hotel.subscription.isActive = Boolean(isActive);
    } else {
      // Toggle if not explicitly passed
      hotel.subscription.isActive = !hotel.subscription.isActive;
    }

    if (hotel.subscription.plan === "none" || !hotel.subscription.isActive) {
      if (hotel.subscription.plan === "none") {
        hotel.subscription.isActive = false;
        hotel.subscription.validUntil = null;
      }
    } else {
      // Activate with validity
      if (validUntil) {
        hotel.subscription.validUntil = new Date(validUntil);
      } else {
        hotel.subscription.validUntil = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000);
      }
    }

    await hotel.save();

    res.json({
      success: true,
      message: "Hotel subscription updated successfully",
      subscription: hotel.subscription,
      hotel,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a hotel
// @route   DELETE /api/superadmin/hotels/:id
const deleteHotel = async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    await User.deleteMany({ hotelId: req.params.id });
    res.json({ success: true, message: "Hotel and associated accounts deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all SaaS Subscription Invoices with pagination
// @route   GET /api/superadmin/invoices
const getInvoices = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      const search = req.query.search.trim();
      query.$or = [
        { txnid: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
        { paymentId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
        { planName: { $regex: search, $options: "i" } },
      ];
    }

    const total = await SubscriptionPayment.countDocuments(query);
    const invoices = await SubscriptionPayment.find(query)
      .populate("hotelId", "name email phone city state address gstin")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: invoices,
      pages: Math.ceil(total / limit) || 1,
      total,
      page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get SuperAdmin Dashboard Statistics
// @route   GET /api/superadmin/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const totalHotels = await Hotel.countDocuments();
    const totalUsers = await User.countDocuments();

    const now = new Date();
    const activeSubscriptions = await Hotel.countDocuments({
      "subscription.isActive": true,
      "subscription.plan": { $ne: "none" },
      $or: [
        { "subscription.validUntil": { $gt: now } },
        { "subscription.validUntil": null },
      ],
    });

    // Total Revenue from successful subscription payments
    const revenueResult = await SubscriptionPayment.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Recent 5 registered hotels
    const recentHotels = await Hotel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email phone city subscription createdAt");

    // Plan distribution
    const planCounts = await Hotel.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$subscription.plan", "none"] },
          count: { $sum: 1 },
        },
      },
    ]);

    const planDistribution = planCounts.map((p) => ({
      name: p._id === "none" ? "No Plan" : p._id,
      value: p.count,
    }));

    // Revenue by Month (last 6 months)
    const monthlyRevenue = await SubscriptionPayment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: { $dateToString: { format: "%b %Y", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    res.json({
      totalHotels,
      activeSubscriptions,
      totalRevenue,
      totalUsers,
      recentHotels,
      planDistribution,
      revenueByMonth: monthlyRevenue.map((m) => ({ month: m._id, revenue: m.revenue })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get SuperAdmin Notifications
// @route   GET /api/superadmin/notifications
const getNotifications = async (req, res) => {
  try {
    // Generate/fetch notifications or recent payments/registrations
    const notifications = await Notification.find()
      .populate("hotelId", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/superadmin/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHotels,
  getSubscriptions,
  updateSubscription,
  deleteHotel,
  getInvoices,
  getDashboardStats,
  getNotifications,
  markNotificationRead,
};
