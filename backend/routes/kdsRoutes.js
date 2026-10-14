const express = require("express");
const { protect } = require("../middleware/auth");
const {
  streamKDSUpdates,
  updateOrderKDSStatus,
  getKDSOrders,
  acknowledgeItemAddon,
} = require("../controllers/kdsController");

const router = express.Router();

// SSE endpoint
router.get("/stream", protect, streamKDSUpdates);

// KDS operations
router.get("/orders", protect, getKDSOrders);
router.put("/order/:orderId/status", protect, updateOrderKDSStatus);
router.put("/order/:orderId/items/:itemId/acknowledge-addon", protect, acknowledgeItemAddon);

module.exports = router;
