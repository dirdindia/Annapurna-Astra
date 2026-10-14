const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceStats,
} = require("../controllers/invoiceController");
const { protect, admin } = require("../middleware/auth");

router.route("/")
  .post(protect, createInvoice)
  .get(protect, getInvoices);

router.get("/stats", protect, admin, getInvoiceStats);

module.exports = router;
