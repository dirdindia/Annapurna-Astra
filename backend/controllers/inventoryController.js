const InventoryItem = require("../models/InventoryItem");
const StockIn = require("../models/StockIn");

// Get all inventory items with their current stock
exports.getInventoryItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await InventoryItem.countDocuments();
    const items = await InventoryItem.find()
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch inventory items", error: error.message });
  }
};

// Add a new stock-in transaction
exports.addStockIn = async (req, res) => {
  try {
    const { items, supplierName, invoiceUrl, date } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide at least one item" });
    }

    const batchId = `BATCH-${Date.now()}`;
    const stockInRecords = [];

    // Process each item
    for (const itemData of items) {
      const { itemName, unit, quantity, price } = itemData;

      if (!itemName || !quantity || !price) continue;

      // Find or create the inventory item
      let item = await InventoryItem.findOne({ name: { $regex: new RegExp(`^${itemName}$`, "i") } });
      
      if (!item) {
        item = await InventoryItem.create({
          name: itemName,
          unit: unit || "kg",
          currentStock: 0,
        });
      }

      // Create the stock in transaction
      const stockIn = await StockIn.create({
        item: item._id,
        quantity: Number(quantity),
        price: Number(price),
        supplierName: supplierName || "",
        batchId: batchId,
        invoiceUrl: invoiceUrl || "",
        date: date ? new Date(date) : new Date(),
      });

      // Update current stock
      item.currentStock += Number(quantity);
      await item.save();

      stockInRecords.push(stockIn);
    }

    res.status(201).json({ success: true, data: stockInRecords, message: "Stock batch added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add stock batch", error: error.message });
  }
};

// Get history of stock ins
exports.getStockInHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await StockIn.countDocuments();
    const history = await StockIn.find()
      .populate("item", "name unit")
      .sort({ date: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stock history", error: error.message });
  }
};
