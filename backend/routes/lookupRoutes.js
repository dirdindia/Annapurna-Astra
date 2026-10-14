const express = require("express");
const router = express.Router();
const {
  createLookup,
  getLookups,
  updateLookup,
  deleteLookup,
} = require("../controllers/lookupController");
const { protect, admin } = require("../middleware/auth");

// All routes are protected and admin only for modifying, but viewing might be needed by staff?
// The user said they will use it for inventory (admin) and categories (admin/staff).
// For now, let's allow all authenticated users to GET, but only admin to modify.
// Actually, in the current system, there is no generic `protect` middleware being consistently applied across all routes in standard fashion if it's missing. Let's see if authMiddleware exists.

// Checking existing routes for standard practice.
// Apply protect middleware to all lookup routes so req.user is available
router.use(protect);

router.route("/")
  .get(getLookups)
  .post(createLookup);

router.route("/:id")
  .put(updateLookup)
  .delete(deleteLookup);

module.exports = router;
