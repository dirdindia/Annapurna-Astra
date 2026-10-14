const express = require('express');
const router = express.Router();
const {
  getHotels,
  getSubscriptions,
  updateSubscription,
  deleteHotel,
  getInvoices,
  getDashboardStats,
  getNotifications,
  markNotificationRead,
} = require('../controllers/superAdminController');

// Hotels
router.route('/hotels').get(getHotels);
router.route('/hotels/:id').delete(deleteHotel);
router.route('/hotels/:id/subscription').put(updateSubscription);

// Subscriptions
router.route('/subscriptions').get(getSubscriptions);

// Invoices / Billing
router.route('/invoices').get(getInvoices);

// Dashboard Stats & Notifications
router.route('/dashboard-stats').get(getDashboardStats);
router.route('/notifications').get(getNotifications);
router.route('/notifications/:id/read').put(markNotificationRead);

module.exports = router;
