const express = require("express");
const router = express.Router();
const { getInventoryItems, addStockIn, getStockInHistory } = require("../controllers/inventoryController");
const { getDailyPrepForecast } = require("../controllers/aiForecastController");
const { protect } = require("../middleware/auth");

// Protect all inventory routes
router.use(protect);

router.get("/ai-forecast", getDailyPrepForecast);
router.get("/items", getInventoryItems);
router.post("/stock-in", addStockIn);
router.get("/history", getStockInHistory);

module.exports = router;
