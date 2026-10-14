const express = require('express');
const router = express.Router();
const { getAllBookings, checkIn, checkOut, verifyGST, getGuestByPhone, exportBookingsToExcel } = require('../controllers/roomBookingController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getAllBookings);

router.route('/export')
  .get(protect, exportBookingsToExcel);

router.route('/checkin')
  .post(protect, checkIn);

router.route('/advance')
  .post(protect, require('../controllers/roomBookingController').advanceBooking);

router.route('/advance/:id')
  .put(protect, require('../controllers/roomBookingController').updateAdvanceBooking)
  .delete(protect, require('../controllers/roomBookingController').deleteAdvanceBooking);

router.route('/convert/:id')
  .put(protect, require('../controllers/roomBookingController').convertToCheckIn);

router.route('/checkout/:id')
  .post(protect, checkOut);

router.route('/verify-gst/:gstNumber')
  .get(protect, verifyGST);

router.route('/guest/:phone')
  .get(protect, getGuestByPhone);

module.exports = router;
