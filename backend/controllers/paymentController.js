const Razorpay = require("razorpay");
const crypto = require("crypto");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const SubscriptionPayment = require("../models/SubscriptionPayment");

const cleanKey = (val) => (val ? String(val).replace(/^['"]|['"]$/g, "").trim() : "");

const getRazorpayInstance = () => {
  const key_id = cleanKey(process.env.RAZORPAY_KEY_ID);
  const key_secret = cleanKey(process.env.RAZORPAY_SECRET);

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are missing in server environment.");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

const PLANS = {
  Starter: {
    id: "Starter",
    name: "Starter",
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    durationDays: { monthly: 30, yearly: 365 },
    description: "10 rooms tak ke chhote hotel/guest house ke liye",
    features: [
      "Room booking & Front desk",
      "Billing & GST Invoice generation",
      "Up to 2 Staff accounts",
      "Reports & Daily revenue stats",
      "Standard Email Support",
    ],
  },
  Growth: {
    id: "Growth",
    name: "Growth",
    monthlyPrice: 3999,
    yearlyPrice: 39990,
    popular: true,
    durationDays: { monthly: 30, yearly: 365 },
    description: "Restaurant & Bar wale hotels ke liye complete setup",
    features: [
      "Starter ka sab kuch",
      "Restaurant POS & KOT billing",
      "Kitchen Display (KDS) & QR Ordering",
      "Up to 10 Staff accounts",
      "Inventory & Stock tracking",
      "Priority WhatsApp & Phone Support",
    ],
  },
  Enterprise: {
    id: "Enterprise",
    name: "Enterprise",
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    durationDays: { monthly: 30, yearly: 365 },
    description: "Chain aur bade luxury resorts ke liye",
    features: [
      "Growth ka sab kuch",
      "Multi-property management",
      "Unlimited Staff accounts",
      "Advanced Analytics & Custom Excel Exports",
      "24/7 Dedicated Account Manager",
      "Custom Branding & API access",
    ],
  },
};

// @desc    Get subscription plans and Razorpay Key ID
// @route   GET /api/payment/plans
// @access  Public / Private
const getPlans = async (req, res) => {
  try {
    const keyId = cleanKey(process.env.RAZORPAY_KEY_ID);
    res.json({
      success: true,
      keyId,
      plans: PLANS,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current subscription status of hotel
// @route   GET /api/payment/status
// @access  Private
const getSubscriptionStatus = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.user.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const sub = hotel.subscription || { plan: "none", isActive: false, validUntil: null };
    let daysRemaining = 0;
    let isExpired = false;

    if (sub.validUntil) {
      const now = new Date();
      const expiry = new Date(sub.validUntil);
      const diff = expiry - now;
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      if (diff <= 0) {
        isExpired = true;
      }
    }

    res.json({
      success: true,
      subscription: {
        plan: sub.plan || "none",
        isActive: Boolean(sub.isActive && !isExpired && sub.plan !== "none"),
        validUntil: sub.validUntil,
        daysRemaining,
        isExpired,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Razorpay Order for Subscription
// @route   POST /api/payment/razorpay/create-order
// @access  Private (Hotel Admin)
const createOrder = async (req, res) => {
  try {
    const { plan: planName, billingCycle = "monthly" } = req.body;

    const planConfig = PLANS[planName];
    if (!planConfig) {
      return res.status(400).json({ success: false, message: "Invalid subscription plan selected." });
    }

    const price = billingCycle === "yearly" ? planConfig.yearlyPrice : planConfig.monthlyPrice;
    const amountInPaise = Math.round(price * 100);

    const razorpay = getRazorpayInstance();
    const receiptId = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        hotelId: String(req.user.hotelId),
        userId: String(req.user._id),
        planName,
        billingCycle,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    const user = await User.findById(req.user._id);
    const hotel = await Hotel.findById(req.user.hotelId);

    // Create a pending SubscriptionPayment record
    await SubscriptionPayment.create({
      hotelId: req.user.hotelId,
      userId: req.user._id,
      orderId: order.id,
      txnid: order.id,
      planName,
      billingCycle,
      amount: price,
      currency: "INR",
      status: "created",
      customerName: user ? user.name : "",
      customerEmail: user ? user.email : "",
      customerPhone: user ? user.mobile : (hotel ? hotel.phone : ""),
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: cleanKey(process.env.RAZORPAY_KEY_ID),
      planName,
      billingCycle,
      hotelName: hotel ? hotel.name : "StayFlow Hotel",
      customerName: user ? user.name : "Admin",
      customerEmail: user ? user.email : "",
      customerPhone: user ? user.mobile : "",
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create Razorpay order" });
  }
};

// @desc    Verify Razorpay Payment Signature and activate subscription
// @route   POST /api/payment/razorpay/verify
// @access  Private (Hotel Admin)
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan: planName, billingCycle = "monthly" } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment confirmation parameters from Razorpay",
      });
    }

    const secret = cleanKey(process.env.RAZORPAY_SECRET);
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyToSign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark payment failed if record exists
      await SubscriptionPayment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "failed", paymentId: razorpay_payment_id, signature: razorpay_signature }
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Verification failed.",
      });
    }

    // Payment is authentic!
    const planConfig = PLANS[planName] || PLANS.Starter;
    const daysToAdd = billingCycle === "yearly" ? 365 : 30;

    const hotel = await Hotel.findById(req.user.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Associated Hotel not found" });
    }

    // Calculate validUntil:
    // If hotel already has an active, future expiry date, extend from existing validUntil
    const now = new Date();
    let baseDate = now;
    if (hotel.subscription && hotel.subscription.validUntil && new Date(hotel.subscription.validUntil) > now) {
      baseDate = new Date(hotel.subscription.validUntil);
    }

    const validFrom = now;
    const validUntil = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Update Hotel Subscription
    hotel.subscription = {
      plan: planName,
      isActive: true,
      validUntil: validUntil,
    };
    await hotel.save();

    // Update or create payment record
    let payment = await SubscriptionPayment.findOne({ orderId: razorpay_order_id });
    if (payment) {
      payment.paymentId = razorpay_payment_id;
      payment.signature = razorpay_signature;
      payment.status = "success";
      payment.validFrom = validFrom;
      payment.validUntil = validUntil;
      await payment.save();
    } else {
      const price = billingCycle === "yearly" ? planConfig.yearlyPrice : planConfig.monthlyPrice;
      const user = await User.findById(req.user._id);
      payment = await SubscriptionPayment.create({
        hotelId: hotel._id,
        userId: req.user._id,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        txnid: razorpay_order_id,
        planName,
        billingCycle,
        amount: price,
        currency: "INR",
        status: "success",
        validFrom,
        validUntil,
        customerName: user ? user.name : "",
        customerEmail: user ? user.email : "",
        customerPhone: user ? user.mobile : "",
      });
    }

    res.json({
      success: true,
      message: `Congratulations! ${planName} subscription activated successfully.`,
      subscription: {
        plan: hotel.subscription.plan,
        isActive: hotel.subscription.isActive,
        validUntil: hotel.subscription.validUntil,
        daysRemaining: Math.ceil((validUntil - now) / (1000 * 60 * 60 * 24)),
      },
      payment,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ success: false, message: error.message || "Payment verification failed" });
  }
};

// @desc    Get Invoices / Billing history for hotel
// @route   GET /api/payment/my-invoices
// @access  Private (Hotel Admin)
const getMyInvoices = async (req, res) => {
  try {
    const invoices = await SubscriptionPayment.find({
      hotelId: req.user.hotelId,
      status: "success",
    })
      .populate("hotelId", "name email phone address city state pincode gstin")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlans,
  getSubscriptionStatus,
  createOrder,
  verifyPayment,
  getMyInvoices,
};
