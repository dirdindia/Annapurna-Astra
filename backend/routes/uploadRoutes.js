const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { uploadToCloudinary } = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Route to upload multiple files under field name "files"
router.post("/upload-files", protect, upload.array("files"), uploadToCloudinary);

// Public route for hotel registration (logo upload)
router.post("/public-upload", upload.array("files"), uploadToCloudinary);

module.exports = router;
