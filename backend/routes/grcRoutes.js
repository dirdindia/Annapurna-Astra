const express = require("express");
const router = express.Router();
const { getCounter, incrementCounter, resetCounter } = require("../controllers/grcController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getCounter);
router.post("/increment", protect, incrementCounter);
router.post("/reset", protect, resetCounter);

module.exports = router;
