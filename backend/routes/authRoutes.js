const express = require("express");
const router = express.Router();
const {
  loginUser,
  registerHotel,
  registerStaff,
  getStaff,
  deleteStaff,
  updateAdminPassword,
  updateStaffPermissions,
  updateProfile,
  getProfile,
} = require("../controllers/authController");
const { protect, admin } = require("../middleware/auth");

router.post("/login", loginUser);
router.post("/register-hotel", registerHotel);
router.post("/register-staff", protect, admin, registerStaff);
router.get("/staff", protect, admin, getStaff);
router.delete("/staff/:id", protect, admin, deleteStaff);
router.put("/update-password", protect, admin, updateAdminPassword);
router.put("/update-staff-permissions", protect, admin, updateStaffPermissions);
router.put("/update-profile", protect, updateProfile);
router.get("/profile", protect, getProfile);

module.exports = router;
