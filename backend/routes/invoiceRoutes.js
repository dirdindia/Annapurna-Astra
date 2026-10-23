const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceStats,
  sendInvoiceViaWhatsApp,
} = require("../controllers/invoiceController");
const { protect, admin } = require("../middleware/auth");

router.route("/")
  .post(protect, createInvoice)
  .get(protect, getInvoices);

router.get("/stats", protect, admin, getInvoiceStats);
router.post("/:id/send-whatsapp", protect, sendInvoiceViaWhatsApp);

module.exports = router;
