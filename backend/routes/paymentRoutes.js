const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const {
  getPlans,
  getSubscriptionStatus,
  createOrder,
  verifyPayment,
  getMyInvoices,
} = require("../controllers/paymentController");

// Public/Private plans catalog
router.get("/plans", getPlans);

// Protected routes
router.get("/status", protect, getSubscriptionStatus);
router.post("/razorpay/create-order", protect, admin, createOrder);
router.post("/razorpay/verify", protect, admin, verifyPayment);
router.get("/my-invoices", protect, admin, getMyInvoices);

module.exports = router;
