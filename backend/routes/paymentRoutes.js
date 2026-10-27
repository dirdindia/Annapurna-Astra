const express = require("express");
const router = express.Router();
const { protect, hotelAdminOnly } = require("../middleware/auth");
const {
  getPlans,
  getSubscriptionStatus,
  claimFreeTrial,
  createOrder,
  verifyPayment,
  getMyInvoices,
} = require("../controllers/paymentController");

// Public/Private plans catalog
router.get("/plans", getPlans);

// Protected routes
router.get("/status", protect, getSubscriptionStatus);
router.post("/claim-trial", protect, hotelAdminOnly, claimFreeTrial);
router.post("/razorpay/create-order", protect, hotelAdminOnly, createOrder);
router.post("/razorpay/verify", protect, hotelAdminOnly, verifyPayment);
router.get("/my-invoices", protect, hotelAdminOnly, getMyInvoices);

module.exports = router;
