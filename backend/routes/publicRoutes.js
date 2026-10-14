const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getHotelPublicMenu,
  createPublicOrder,
  getPublicOrderStatus,
  createPublicRazorpayOrder,
  verifyPublicRazorpayPayment,
  createPublicTableBooking,
  getHotelQROrders,
  approveQROrder,
  rejectQROrder,
  getHotelTableBookings,
  updateTableBookingStatus,
  streamCustomerOrderStatus,
  approveAddonOrder,
  rejectAddonOrder,
  getOrdersByMobile,
} = require("../controllers/publicOrderController");

// ===================================
// PUBLIC GUEST ROUTES (NO AUTH REQUIRED)
// ===================================
router.get("/hotel/:hotelId", getHotelPublicMenu);
router.post("/order", createPublicOrder);
router.get("/order/:orderId", getPublicOrderStatus);
router.get("/orders/by-mobile", getOrdersByMobile);
router.get("/order-stream/:orderId", streamCustomerOrderStatus);
router.post("/payment/create-order", createPublicRazorpayOrder);
router.post("/payment/verify", verifyPublicRazorpayPayment);
router.post("/table-booking", createPublicTableBooking);

// ===================================
// HOTEL ADMIN/STAFF PROTECTED ROUTES
// ===================================
router.get("/admin/qr-orders", protect, getHotelQROrders);
router.put("/admin/qr-orders/:orderId/approve", protect, approveQROrder);
router.put("/admin/qr-orders/:orderId/reject", protect, rejectQROrder);
router.put("/admin/qr-orders/:orderId/addons/:addonIndex/approve", protect, approveAddonOrder);
router.put("/admin/qr-orders/:orderId/addons/:addonIndex/reject", protect, rejectAddonOrder);
router.get("/admin/table-bookings", protect, getHotelTableBookings);
router.put("/admin/table-bookings/:bookingId", protect, updateTableBookingStatus);

module.exports = router;
