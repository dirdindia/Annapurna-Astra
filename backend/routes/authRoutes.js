const express = require("express");
const router = express.Router();
const {
  loginUser,
  registerHotel,
  registerStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  updateAdminPassword,
  updateStaffPermissions,
  updateProfile,
  getProfile,
  requestPasswordResetOtp,
  verifyResetOtp,
  resetPasswordWithOtp,
} = require("../controllers/authController");
const { protect, admin } = require("../middleware/auth");

router.post("/login", loginUser);
router.post("/forgot-password", requestPasswordResetOtp);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password-with-otp", resetPasswordWithOtp);
router.post("/register-hotel", registerHotel);
router.post("/register-staff", protect, admin, registerStaff);
router.get("/staff", protect, admin, getStaff);
router.put("/staff/:id", protect, admin, updateStaff);
router.delete("/staff/:id", protect, admin, deleteStaff);
router.put("/update-password", protect, admin, updateAdminPassword);
router.put("/update-staff-permissions", protect, admin, updateStaffPermissions);
router.put("/update-profile", protect, updateProfile);
router.get("/profile", protect, getProfile);

module.exports = router;
