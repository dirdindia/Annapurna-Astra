const express = require("express");
const router = express.Router();
const { getInventoryItems, addStockIn, getStockInHistory } = require("../controllers/inventoryController");
const { protect } = require("../middleware/auth"); // Assuming auth middleware exists

// Protect all inventory routes
router.use(protect);

router.get("/items", getInventoryItems);
router.post("/stock-in", addStockIn);
router.get("/history", getStockInHistory);

module.exports = router;
