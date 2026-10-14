const express = require("express");
const { createOrUpdateOrder, getActiveOrder, getActiveVirtualOrders, checkoutOrder, getAllOrders, cancelOrder, markOrderPrinted } = require("../controllers/orderController");
const { printKOT } = require("../controllers/printController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/print-kot", protect, printKOT);
router.post("/", protect, createOrUpdateOrder);
router.get("/all", protect, getAllOrders);
router.get("/virtual/active", protect, getActiveVirtualOrders);
router.get("/active/:tableId", protect, getActiveOrder);
router.route("/:orderId/checkout").post(protect, checkoutOrder);
router.put("/:orderId/mark-printed", protect, markOrderPrinted);
router.delete("/:orderId", protect, cancelOrder);

module.exports = router;
