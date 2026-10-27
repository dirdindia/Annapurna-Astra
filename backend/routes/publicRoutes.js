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
  getPublicTableBooking,
  getTableBookingsByMobile,
  cancelPublicTableBooking,
  reschedulePublicTableBooking,
  getHotelQROrders,
  approveQROrder,
  rejectQROrder,
  getHotelTableBookings,
  updateTableBookingStatus,
  streamCustomerOrderStatus,
  streamCustomerBookingStatus,
  approveAddonOrder,
  rejectAddonOrder,
  getOrdersByMobile,
  getCustomerLiveActivity,
} = require("../controllers/publicOrderController");

const {
  joinPublicWaitlist,
  getPublicWaitlistStatus,
  getHotelPublicQueueSummary,
  cancelPublicWaitlist,
  getAdminWaitlist,
  callWaitlistGuest,
  seatWaitlistGuest,
  addManualWaitlist,
  updateWaitlistStatus,
  getPublicWaitlistDisplay,
  streamPublicWaitlist,
} = require("../controllers/waitlistController");
const { getPublicInvoiceById } = require("../controllers/invoiceController");

// ===================================
// PUBLIC GUEST ROUTES (NO AUTH REQUIRED)
// ===================================
router.get("/hotel/:hotelId", getHotelPublicMenu);
router.get("/bill/:invoiceId", getPublicInvoiceById);
router.post("/order", createPublicOrder);
router.get("/order/:orderId", getPublicOrderStatus);
router.get("/orders/by-mobile", getOrdersByMobile);
router.get("/customer/live-activity", getCustomerLiveActivity);
router.get("/order-stream/:orderId", streamCustomerOrderStatus);
router.get("/booking-stream/:bookingId", streamCustomerBookingStatus);
router.post("/payment/create-order", createPublicRazorpayOrder);
router.post("/payment/verify", verifyPublicRazorpayPayment);
router.post("/table-booking", createPublicTableBooking);
router.get("/table-booking/by-mobile", getTableBookingsByMobile);
router.get("/table-booking/:bookingId", getPublicTableBooking);
router.put("/table-booking/:bookingId/cancel", cancelPublicTableBooking);
router.put("/table-booking/:bookingId/reschedule", reschedulePublicTableBooking);

// Public Live Waitlist Queue & Hall Display
router.post("/waitlist/join", joinPublicWaitlist);
router.get("/waitlist/status/:id", getPublicWaitlistStatus);
router.get("/waitlist/summary/:hotelId", getHotelPublicQueueSummary);
router.post("/waitlist/:id/cancel", cancelPublicWaitlist);
router.get("/waitlist/display/:hotelId", getPublicWaitlistDisplay);
router.get("/waitlist-stream/:hotelId", streamPublicWaitlist);

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

// Admin / Staff Waitlist Controls
router.get("/admin/waitlist", protect, getAdminWaitlist);
router.post("/admin/waitlist/manual", protect, addManualWaitlist);
router.put("/admin/waitlist/:id/call", protect, callWaitlistGuest);
router.put("/admin/waitlist/:id/seat", protect, seatWaitlistGuest);
router.put("/admin/waitlist/:id/status", protect, updateWaitlistStatus);

module.exports = router;
