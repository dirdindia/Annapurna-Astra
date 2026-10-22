const express = require("express");
const {
  createOrUpdateOrder,
  getActiveOrder,
  getActiveVirtualOrders,
  checkoutOrder,
  getAllOrders,
  cancelOrder,
  requestCancelOrder,
  verifyCancelOrder,
  requestItemVoid,
  verifyItemVoid,
  getCancellationAudits,
  testTelegramAlert,
  detectTelegramChatId,
  markOrderPrinted,
} = require("../controllers/orderController");
const { printKOT } = require("../controllers/printController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// General & KDS / KOT Routes
router.post("/print-kot", protect, printKOT);
router.post("/", protect, createOrUpdateOrder);
router.get("/all", protect, getAllOrders);
router.get("/virtual/active", protect, getActiveVirtualOrders);
router.get("/active/:tableId", protect, getActiveOrder);
router.route("/:orderId/checkout").post(protect, checkoutOrder);
router.put("/:orderId/mark-printed", protect, markOrderPrinted);

// Anti-Theft KOT & Void Routes
router.get("/telegram-detect-chat-id", protect, detectTelegramChatId);
router.post("/telegram-test", protect, testTelegramAlert);
router.get("/cancellation-audits", protect, getCancellationAudits);
router.post("/:orderId/request-cancel", protect, requestCancelOrder);
router.post("/:orderId/verify-cancel", protect, verifyCancelOrder);
router.post("/:orderId/request-item-void", protect, requestItemVoid);
router.post("/:orderId/verify-item-void", protect, verifyItemVoid);

// Legacy cancellation route (for backward compatibility)
router.delete("/:orderId", protect, cancelOrder);

module.exports = router;
